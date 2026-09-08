import { NextResponse } from "next/server";
import { storage } from "@/server/storage";

/**
 * Serves a stored file by making a signed read against the bucket and
 * streaming the bytes back. This is how every logo reaches a browser: a lot
 * of S3-compatible servers require every request to be SigV4-signed and have
 * no anonymous read at all, and an AWS bucket is private unless someone
 * deliberately opens it. The app has the credentials, so it can always sign.
 *
 * Keys are content-addressed, so the response is immutable and cached hard —
 * the bucket is hit once per file per cache lifetime, not once per pageview.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  // Keys are content-addressed hashes; anything else is not ours.
  if (!/^[a-f0-9]{32}\.(svg|png|jpg|webp|pdf)$/.test(key)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await storage.get(key);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.contentType,
      // Content-addressed, so it can never go stale.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
