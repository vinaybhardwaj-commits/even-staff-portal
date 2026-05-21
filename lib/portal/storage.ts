/**
 * Storage abstraction for portal attachments.
 *
 * v1 backend: Vercel Blob (public access, CDN-distributed).
 * Why Blob > Neon BYTEA for this use case:
 *  - 5-10MB PDF/image files would bloat backups + slow pgvector queries
 *    (the shared Neon DB has mksap_chunks at 188k rows, attachments
 *    co-located in the same instance is the wrong scale boundary)
 *  - Object storage gets CDN edge caching for free, Postgres doesn't
 *  - Vercel Blob is S3-class storage with multi-region replication —
 *    "robust" was the bar V set, and Blob meets it.
 *
 * Future-portable by design: callers receive a TEXT url (bulletin_posts
 * .attachment_url is TEXT). Swapping to Postgres BYTEA or S3 later means
 * changing this file and nothing else.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var. Auto-provisioned by Vercel
 * when a Blob store is created in the project's Storage tab.
 */
import { put, del } from '@vercel/blob';

export type UploadResult = {
  url: string;       // public URL — store in DB
  pathname: string;  // internal Blob path — store for future deletes
  size: number;
  contentType: string;
};

export type UploadConstraints = {
  maxBytes?: number;          // default 10 MB
  allowedContentTypes?: RegExp; // default: images + PDFs
};

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const DEFAULT_ALLOWED = /^(image\/(png|jpe?g|webp|gif|heic|heif)|application\/pdf)$/i;

export async function uploadAttachment(
  file: File,
  kind: 'bulletin' | 'video' | 'misc',
  opts: UploadConstraints = {},
): Promise<UploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Provision Blob store in Vercel project Storage tab.');
  }

  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const allowed = opts.allowedContentTypes ?? DEFAULT_ALLOWED;

  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${(maxBytes / 1024 / 1024).toFixed(0)} MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  }
  if (!allowed.test(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  }

  // Path: kind/yyyy-mm/random-name.ext  — keeps the Blob list grouped + searchable.
  const today = new Date();
  const yyyymm = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || extFromMime(file.type)).toLowerCase();
  const safeBase = file.name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 50) || 'file';
  const path = `${kind}/${yyyymm}/${Date.now()}-${safeBase}${ext}`;

  const blob = await put(path, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: true, // collision-proof, also makes URL non-guessable
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    contentType: file.type,
  };
}

export async function deleteAttachment(urlOrPathname: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return; // soft-no-op if Blob not provisioned
  await del(urlOrPathname);
}

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/png': return '.png';
    case 'image/jpeg': return '.jpg';
    case 'image/webp': return '.webp';
    case 'image/gif': return '.gif';
    case 'image/heic':
    case 'image/heif': return '.heic';
    case 'application/pdf': return '.pdf';
    default: return '';
  }
}
