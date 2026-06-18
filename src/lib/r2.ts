import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible. These env vars come from the R2 dashboard.
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://pub-xxxx.r2.dev (no trailing slash)

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Build a safe object key from a user-supplied filename.
 * path.basename strips any directory parts, then we whitelist characters —
 * this prevents path traversal (../) and keeps URLs clean.
 */
export function makeKey(prefix: string, originalName: string): string {
  const base = originalName.split(/[\\/]/).pop() || "file";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${prefix}/${Date.now()}-${safe}`;
}

/** Upload a file buffer to R2 and return its public URL. */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_URL}/${key}`;
}

/** Delete an object from R2 given its public URL (or key). No-op if not an R2 URL. */
export async function deleteFromR2(urlOrKey: string): Promise<void> {
  let key = urlOrKey;
  if (urlOrKey.startsWith(PUBLIC_URL)) {
    key = urlOrKey.slice(PUBLIC_URL.length + 1); // strip "PUBLIC_URL/"
  } else if (urlOrKey.startsWith("http")) {
    return; // external/legacy URL we don't own — skip
  }
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
