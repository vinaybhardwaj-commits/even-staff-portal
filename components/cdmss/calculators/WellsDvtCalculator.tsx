'use client';

import Link from 'next/link';
import { ZapOff, Stethoscope } from 'lucide-react';
import CalculatorShell from './CalculatorShell';
import type { CalculatorConfig, CalculatorResult, FormField } from '@/lib/cdmss/calculators/types';

const FIELDS: FormField[] = [
  { key: 'active_cancer', label: 'Active cancer (treatment ≤ 6 mo or palliative)', type: 'bool', required: true,
    staticTooltip: 'Cancer currently receiving treatment, OR treatment within the past 6 months, OR palliative-only.' },
  { key: 'paralysis_paresis', label: 'Paralysis, paresis, or recent LE plaster immobilization', type: 'bool', required: true,
    staticTooltip: 'Lower-limb paralysis/paresis OR plaster cast on the leg within the past 12 weeks.' },
  { key: 'bedridden_or_surg', label: 'Bedridden ≥ 3 d OR major surgery within 12 wk', type: 'bool', required: true,
    staticTooltip: 'Recent bedrest ≥3 days OR major surgery within the past 12 weeks under general or regional anaesthesia.' },
  { key: 'localized_tenderness', label: 'Localized tenderness along the deep venous system', type: 'bool', required: true,
    staticTooltip: 'Tenderness on palpation along the popliteal / femoral vein course in the symptomatic leg.' },
  { key: 'entire_leg_swollen', label: 'Entire leg swollen', type: 'bool', required: true,
    staticTooltip: 'Diffuse swelling involving the whole limb, not just the calf.' },
  { key: 'calf_swelling_3cm', label: 'Calf swelling ≥ 3 cm vs asymptomatic side', type: 'bool', required: true,
    staticTooltip: 'Measured 10 cm below the tibial tuberosity; difference of 3 cm or more between legs.' },
  { key: 'pitting_edema', label: 'Pitting edema confined to symptomatic leg', type: 'bool', required: true,
    staticTooltip: 'Pitting edema present only in the symptomatic leg — not bilateral.' },
  { key: 'collateral_veins', label: 'Collateral superficial (non-varicose) veins', type: 'bool', required: true,
    staticTooltip: 'New non-varicose superficial veins suggesting collateral flow around an occluded deep vein.' },
  { key: 'previous_dvt', label: 'Previously documented DVT', type: 'bool', required: true,
    staticTooltip: 'Prior objectively-confirmed deep vein thrombosis (any site, any side).' },
  { key: 'alt_dx_as_likely', label: 'Alternative diagnosis at least as likely as DVT', type: 'bool', required: true,
    staticTooltip: 'Score −2 if a differential (cellulitis, Baker cyst, post-thrombotic syndrome, etc.) is at least as plausible.' },
];

const CFG: CalculatorConfig = {
  name: 'wells_dvt',
  displayTitle: 'Wells score — DVT',
  moduleHome: 'ask',
  pasteModeEnabled: false,
  apiPath: '/api/calculators/wells_dvt',
  resultSections: ['interpretation'],
  typicalLatencySec: 2,
  fields: FIELDS,
};

type Det = { score: number; band: string; band_label: string };

const BAND_COLOR: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-200 text-red-800',
};

function Result({ result }: { result: CalculatorResult & { deterministic: Det } }) {
  const d = result.deterministic;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900">{d.score}</span>
          <span className="text-sm text-slate-500">Wells DVT</span>
          <span className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${BAND_COLOR[d.band] ?? ''}`}>{d.band_label}</span>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">Clinical interpretation</h2>
        </div>
        <div className="text-sm leading-relaxed text-slate-700">{d.band_label}.</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/ask?q=${encodeURIComponent('My Wells DVT is ' + d.score + ' (' + d.band_label + '). Do I need D-dimer or proceed straight to compression US?')}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand hover:text-brand">
          Ask deeper about this score
        </Link>
      </div>
      <div className="text-xs text-slate-400">Trace: <code className="rounded bg-slate-100 px-1.5 py-0.5">{result.trace_id}</code></div>
    </div>
  );
}

export default function WellsDvtCalculator() {
  return <CalculatorShell<Det> config={CFG} renderResult={Result} />;
}
