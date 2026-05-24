/**
 * v1.9b — public read-only PubChem lookup endpoint.
 *
 * Used by DosingCard and other infographic blocks to enrich themselves
 * client-side with deterministic drug identity data.
 *
 * GET /api/pubchem/lookup?name=metformin
 *   → { cid, canonical_name, atc_codes, url, mesh_top }
 *   → 404 with { found: false } if PubChem doesn't recognise the name
 *
 * No auth — PubChem facts are public data, and the route is read-only.
 * Uses the same 24h LRU cache as the rest of the PubChem helper.
 */
import { NextRequest, NextResponse } from 'next/server';
import { enrichDrug } from '@/lib/cdmss/pubchem';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: 'name too long' }, { status: 400 });

  const facts = await enrichDrug(name);
  if (!facts.cid) {
    return NextResponse.json({ found: false }, { status: 404 });
  }
  return NextResponse.json({
    found: true,
    cid: facts.cid,
    canonical_name: facts.canonical_name,
    atc_codes: facts.atc_codes,
    url: facts.url,
    mesh_top: facts.mesh_pharmacological_actions[0] || null,
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },  // edge can cache 1h
  });
}
