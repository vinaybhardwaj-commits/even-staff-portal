/**
 * v1.2 T8: one-shot migration for patient_name + patient_mrn on staff_complaints.
 * Idempotent (ADD COLUMN IF NOT EXISTS).
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const results: { stmt: string; ok: boolean; error?: string }[] = [];
  const statements = [
    `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS patient_name TEXT`,
    `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS patient_mrn TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_staff_complaints_patient_mrn ON staff_complaints (patient_mrn) WHERE patient_mrn IS NOT NULL`,
  ];

  for (const s of statements) {
    try {
      await sql.query(s);
      results.push({ stmt: s, ok: true });
    } catch (e: unknown) {
      results.push({ stmt: s, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
