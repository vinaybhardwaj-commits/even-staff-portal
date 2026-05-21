/**
 * Storage abstraction for portal attachments + media.
 *
 * v1 backend: Vercel Blob (public access, CDN-distributed).
 * Why Blob > Neon BYTEA for this use case:
 *  - 5-25MB PDF/image/video files would bloat backups + slow pgvector
 *    queries (shared CDMSS Neon DB has mksap_chunks at 188k rows;
 *    attachments co-located in the same instance is the wrong scale
 *    boundary).
 *  - Object storage gets CDN edge caching for free, Postgres doesn't.
 *  - Vercel Blob is S3-class storage with multi-region replication —
 *    "robust" was the bar V set, and Blob meets it.
 *
 * Future-portable by design: callers receive a TEXT url. Swapping to
 * Postgres BYTEA / S3 / R2 later means changing this file and nothing
 * else.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var. Auto-provisioned by Vercel
 * when a Blob store is created in the project's Storage tab.
 */
import { put, del } from '@vercel/blob';

export type UploadResult = {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
};

export type UploadConstraints = {
  maxBytes?: number;
  allowedContentTypes?: RegExp;
};

// Per-kind defaults
const KIND_DEFAULTS: Record<'bulletin' | 'video' | 'misc', Required<UploadConstraints>> = {
  bulletin: {
    maxBytes: 10 * 1024 * 1024, // 10 MB
    allowedContentTypes: /^(image\/(png|jpe?g|webp|gif|heic|heif)|application\/pdf)$/i,
  },
  video: {
    maxBytes: 25 * 1024 * 1024, // 25 MB per V's SP.4-kickoff lock (simple multipart)
    allowedContentTypes: /^video\/(mp4|webm|quicktime|x-m4v|3gpp)$/i,
  },
  misc: {
    maxBytes: 10 * 1024 * 1024,
    allowedContentTypes: /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/i,
  },
};

export async function uploadAttachment(
  file: File,
  kind: 'bulletin' | 'video' | 'misc',
  opts: UploadConstraints = {},
): Promise<UploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Provision Blob store in Vercel project Storage tab.');
  }

  const defaults = KIND_DEFAULTS[kind];
  const maxBytes = opts.maxBytes ?? defaults.maxBytes;
  const allowed = opts.allowedContentTypes ?? defaults.allowedContentTypes;

  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${(maxBytes / 1024 / 1024).toFixed(0)} MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  }
  if (!allowed.test(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  }

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
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    contentType: file.type,
  };
}

export async function deleteAttachment(urlOrPathname: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
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
    case 'video/mp4': return '.mp4';
    case 'video/webm': return '.webm';
    case 'video/quicktime': return '.mov';
    case 'video/x-m4v': return '.m4v';
    case 'video/3gpp': return '.3gp';
    default: return '';
  }
}
