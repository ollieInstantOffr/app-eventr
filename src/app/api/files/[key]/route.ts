import { NextResponse } from "next/server";
import { storage } from "@/server/storage";

/**
 * Proxies a file through the app rather than the bucket directly. Nothing in
 * the app generates links here any more — storage.url() points straight at
 * S3 — but it's kept as a working fallback for any link handed out before
 * that switch.
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
