# Bulletin attachments — operator notes

## Storage backend
Vercel Blob (public access). Provisioned 21 May 2026 via Vercel UI
(project → Storage → Create Database → Blob → evenstaffportal-blob,
region iad1, access Public).

Auto-injected env vars (Production + Preview):
- `BLOB_READ_WRITE_TOKEN` — used by `lib/portal/storage.ts`
- `BLOB_STORE_ID`
- `BLOB_WEBHOOK_PUBLIC_KEY`

## Constraints
- 10 MB max per upload (`storage.ts::DEFAULT_MAX_BYTES`)
- MIME allowlist: png, jpg, webp, gif, heic, heif, pdf
- Public access: URLs are non-guessable (Vercel appends a random
  suffix per `addRandomSuffix: true`), so security model is
  secret-by-obscurity. Fine for staff bulletin attachments.

## Storage paths
`{kind}/{YYYY-MM}/{timestamp}-{safe-name}{ext}` — e.g.
`bulletin/2026-05/1779348530-protocol-draft.pdf`. Grouped by kind
+ month for easy Blob console browsing.

## Replacing the backend
`lib/portal/storage.ts` is the single point of indirection. To swap
to S3, Cloudflare R2, Postgres BYTEA, etc., reimplement
`uploadAttachment` / `deleteAttachment` — call sites won't change.

## To delete a file
For now, manual via Vercel Blob console. `deleteAttachment(url)` is
already wired in `storage.ts` for future moderation tooling.
