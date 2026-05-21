import { NextResponse } from 'next/server';
import { listComplaintTypes, getFieldsForType, getResolutionsForType } from '@/lib/portal/sewa-reads';

export const runtime = 'nodejs';

export async function GET() {
  const types = await listComplaintTypes();
  // Expand each type with its fields + resolutions in a single response — saves round trips for the staff compose flow
  const enriched = await Promise.all(types.map(async (t) => {
    const [fields, resolutions] = await Promise.all([
      getFieldsForType(Number(t.id)),
      getResolutionsForType(Number(t.id)),
    ]);
    return { ...t, fields, resolutions };
  }));
  return NextResponse.json({ types: enriched });
}
