import { NextRequest, NextResponse } from 'next/server';
import { uploadAttachment } from '@/lib/portal/storage';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  try {
    const result = await uploadAttachment(file, 'bulletin');
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'upload_failed';
    const isConfig = msg.includes('BLOB_READ_WRITE_TOKEN');
    return NextResponse.json(
      { error: isConfig ? 'storage_not_configured' : 'upload_error', detail: msg },
      { status: isConfig ? 503 : 400 },
    );
  }
}
