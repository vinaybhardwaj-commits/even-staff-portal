/**
 * v1.2 T2: presigned upload token for direct client→Blob uploads.
 *
 * Bypasses Vercel's serverless body limit. Client uses `upload()` from
 * '@vercel/blob/client', which POSTs metadata here. Auth: the client
 * sends ADMIN_TOKEN through clientPayload (an opaque string the
 * Blob client SDK forwards verbatim). We validate it inside
 * onBeforeGenerateToken — invalid token => throw => 400 to client.
 */
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Auth via clientPayload (admin token forwarded by client)
        const token = (clientPayload || '').trim();
        if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
          throw new Error('unauthorized');
        }
        if (!pathname.startsWith('video/')) {
          throw new Error('pathname_must_start_with_video');
        }
        return {
          allowedContentTypes: [
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/x-m4v',
            'video/3gpp',
          ],
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify({ at: Date.now() }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        try { console.log('[v1.2 T2 video upload] complete:', blob.url, blob.pathname); } catch {}
      },
    });
    return NextResponse.json(json);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'upload_token_error';
    const isAuth = msg === 'unauthorized';
    return NextResponse.json({ error: isAuth ? 'unauthorized' : 'upload_token_error', detail: msg }, { status: isAuth ? 401 : 400 });
  }
}
