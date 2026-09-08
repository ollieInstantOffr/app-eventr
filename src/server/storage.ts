import { createHash, randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export type StoredFile = {
  key: string;
  contentType: string;
  size: number;
};

/**
 * Uploaded logos and generated posters live in an S3-compatible bucket.
 * Everything goes through this interface, so a different backend could
 * replace it without touching call sites.
 */
export interface StorageAdapter {
  put(body: Buffer, contentType: string, extension: string): Promise<StoredFile>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
  /**
   * App-relative path, not an absolute URL — see absoluteUrl() for the one
   * place (email) that needs the full thing.
   */
  url(key: string): string;
}

const ALLOWED = new Map<string, string>([
  ["image/svg+xml", "svg"],
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function extensionForType(contentType: string): string | null {
  return ALLOWED.get(contentType) ?? null;
}

/**
 * An uploaded SVG is markup that we later inline on the guest's phone and on
 * the live screen, so scripts, event handlers and external references have to
 * come out before it is stored.
 */
export function sanitiseSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("|')\s*(javascript|data):[^"']*\2/gi, "")
    .replace(/<!ENTITY[\s\S]*?>/gi, "");
}

/**
 * S3-compatible object storage. Works unmodified against AWS S3 and against
 * any S3-compatible provider (MinIO, Cloudflare R2, DigitalOcean Spaces,
 * Backblaze B2, a self-hosted Garage/SeaweedFS, ...) — just point
 * S3_ENDPOINT at that provider. Path-style addressing is forced
 * unconditionally (`<endpoint>/<bucket>/<key>`), which every S3-compatible
 * provider accepts and several require, unlike AWS's virtual-hosted style.
 *
 * Files are served back through the app's own /api/files route rather than
 * by linking a browser straight at the object. That costs a proxied round
 * trip, but it's the only approach that works everywhere: plenty of
 * S3-compatible servers require every request to be SigV4-signed and have no
 * notion of an anonymous public read, and on AWS a bucket is private by
 * default and needs a deliberate public-read policy. The app holds the
 * credentials, so it can always sign the read; the route caches
 * aggressively, and keys are content-addressed, so this stays cheap.
 */
class S3Storage implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  // Content-addressed, so re-uploading the same logo doesn't duplicate it and
  // the served URL can be cached forever.
  private static keyFor(body: Buffer, extension: string): string {
    const digest = createHash("sha256").update(body).digest("hex").slice(0, 32);
    return `${digest}.${extension}`;
  }

  async put(body: Buffer, contentType: string, extension: string): Promise<StoredFile> {
    const key = S3Storage.keyFor(body, extension);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Content-addressed keys never change, so the browser — and any CDN
        // sitting in front of the bucket — can hold onto this forever.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { key, contentType, size: body.byteLength };
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const bytes = await response.Body?.transformToByteArray();
      if (!bytes) return null;
      return {
        body: Buffer.from(bytes),
        contentType: response.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (error instanceof NoSuchKey || isNotFound(error)) return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      // Deleting something already gone isn't an error worth surfacing.
      if (!isNotFound(error)) throw error;
    }
  }

  url(key: string): string {
    return `/api/files/${key}`;
  }
}

/**
 * Real AWS S3 throws the typed `NoSuchKey` exception; several
 * S3-compatible providers instead return a generic error with a 404 status,
 * so both are treated as "not found" rather than a real failure.
 */
function isNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("$metadata" in error)) return false;
  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return metadata?.httpStatusCode === 404;
}

export const storage: StorageAdapter = new S3Storage();

/**
 * The absolute form of storage.url(), for email — a relative path is
 * meaningless in an inbox, which has no page to resolve it against.
 */
export function absoluteUrl(key: string): string {
  return new URL(storage.url(key), env.APP_URL).toString();
}

/** Validates, sanitises and stores one uploaded file. */
export async function storeUpload(file: File): Promise<StoredFile> {
  const extension = extensionForType(file.type);
  if (!extension) {
    throw new UploadError(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("File is larger than 4 MB");
  }

  let body = Buffer.from(await file.arrayBuffer());
  if (extension === "svg") {
    body = Buffer.from(sanitiseSvg(body.toString("utf8")), "utf8");
  }

  try {
    return await storage.put(body, file.type, extension);
  } catch (error) {
    // Storage being unreachable or refusing the write is an operational
    // problem, not something the organiser can act on — but it must not take
    // the whole page down with an unhandled error either. The real cause goes
    // to the logs; they get a form message and keep their unsaved work.
    console.error("[storage] upload failed:", error);
    throw new UploadError(
      "Couldn't save that file — the storage service didn't accept it. Try again in a moment.",
    );
  }
}

export class UploadError extends Error {}

/** Used where a key is needed before the bytes exist (generated posters). */
export function scratchKey(extension: string) {
  return `${randomUUID()}.${extension}`;
}
