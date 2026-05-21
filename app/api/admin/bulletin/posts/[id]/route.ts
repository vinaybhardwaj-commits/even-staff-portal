import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  let payload: { pin?: boolean; hide?: boolean; hidden_reason?: string };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (typeof payload.pin === 'boolean') {
    if (payload.pin) {
      await sql`UPDATE bulletin_posts SET pinned = TRUE, pinned_by = 'Admin', pinned_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    } else {
      await sql`UPDATE bulletin_posts SET pinned = FALSE, pinned_by = NULL, pinned_at = NULL, updated_at = NOW() WHERE id = ${id}`;
    }
  }

  if (typeof payload.hide === 'boolean') {
    if (payload.hide) {
      const reason = (payload.hidden_reason ?? '').trim().slice(0, 500) || 'Hidden by moderator';
      await sql`UPDATE bulletin_posts SET hidden_by = 'Admin', hidden_at = NOW(), hidden_reason = ${reason}, updated_at = NOW() WHERE id = ${id}`;
    } else {
      await sql`UPDATE bulletin_posts SET hidden_by = NULL, hidden_at = NULL, hidden_reason = NULL, updated_at = NOW() WHERE id = ${id}`;
    }
  }

  return NextResponse.json({ ok: true });
}
