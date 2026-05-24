'use client';

import Link from 'next/link';
import { Waves, Stethoscope } from 'lucide-react';
import CalculatorShell from './CalculatorShell';
import type { CalculatorConfig, CalculatorResult, FormField } from '@/lib/cdmss/calculators/types';

const FIELDS: FormField[] = [
  { key: 'qt_ms', label: 'QT interval', type: 'integer', unit: 'ms', required: true,
    hardMin: 200, hardMax: 700, softMin: 300, softMax: 600,
    staticTooltip: 'Measured QT in ms — start of Q to end of T in the lead with the longest QT (typically II or V2-V3).' },
  { key: 'hr_bpm', label: 'Heart rate', type: 'integer', unit: 'bpm', required: false,
    hardMin: 30, hardMax: 200, softMin: 40, softMax: 180,
    staticTooltip: 'Provide HR (bpm) or use RR (ms) below — one of the two is required.' },
  { key: 'rr_ms',  label: 'RR interval (alternative)', type: 'integer', unit: 'ms', required: false,
    hardMin: 200, hardMax: 3000,
    staticTooltip: 'RR interval in ms (alternative to HR). RR = 60000 / HR.' },
  { key: 'sex', label: 'Sex', type: 'enum', required: true,
    options: [
      { value: 'M', label: 'Male' },
      { value: 'F', label: 'Female' },
    ],
    staticTooltip: 'Biological sex determines Bazett normal bands — males have a stricter upper limit (<430 ms).' },
];

const CFG: CalculatorConfig = {
  name: 'qtc',
  displayTitle: 'QTc — Corrected QT interval',
  moduleHome: 'ask',
  pasteModeEnabled: false,
  apiPath: '/api/calculators/qtc',
  resultSections: ['interpretation'],
  typicalLatencySec: 2,
  fields: FIELDS,
};

type Det = {
  rr_sec: number;
  bazett_ms: number; fridericia_ms: number; framingham_ms: number;
  band: string; band_label: string; high_tdp_risk: boolean;
};

const BAND_COLOR: Record<string, string> = {
  normal:     'bg-emerald-100 text-emerald-700',
  borderline: 'bg-yellow-100 text-yellow-800',
  prolonged:  'bg-red-200 text-red-800',
};

function Result({ result }: { result: CalculatorResult & { deterministic: Det } }) {
  const d = result.deterministic;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900">{d.bazett_ms}</span>
          <span className="text-sm text-slate-500">ms QTc (Bazett)</span>
          <span className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${BAND_COLOR[d.band] ?? ''}`}>{d.band_label}</span>
        </div>
        {d.high_tdp_risk && (
          <div className="mt-2 text-xs font-medium text-rose-700">
            ⚠ Any-method QTc &gt; 500 ms — high torsades-de-pointes risk. Review QT-prolonging drugs.
          </div>
        )}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Waves className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">All three corrections</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-slate-200 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Bazett</div>
            <div className="mt-1 text-xl font-semibold">{d.bazett_ms}<span className="ml-1 text-xs text-slate-400">ms</span></div>
          </div>
          <div className="rounded-md border border-slate-200 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Fridericia</div>
            <div className="mt-1 text-xl font-semibold">{d.fridericia_ms}<span className="ml-1 text-xs text-slate-400">ms</span></div>
          </div>
          <div className="rounded-md border border-slate-200 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Framingham</div>
            <div className="mt-1 text-xl font-semibold">{d.framingham_ms}<span className="ml-1 text-xs text-slate-400">ms</span></div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400">RR = {d.rr_sec.toFixed(3)} s. Bazett is most over-correcting at high HR; Fridericia preferred &gt; 100 bpm.</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">Clinical interpretation</h2>
        </div>
        <div className="text-sm leading-relaxed text-slate-700">
          {d.band_label}.{d.high_tdp_risk ? ' Any-method QTc above 500 ms — high TdP risk.' : ''}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/ask?q=${encodeURIComponent('My QTc (Bazett) is ' + d.bazett_ms + ' ms (' + d.band_label + '). Which QT-prolonging drugs should I review and at what threshold do I stop them?')}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand hover:text-brand">
          Ask deeper about this score
        </Link>
      </div>
      <div className="text-xs text-slate-400">Trace: <code className="rounded bg-slate-100 px-1.5 py-0.5">{result.trace_id}</code></div>
    </div>
  );
}

export default function QtcCalculator() {
  return <CalculatorShell<Det> config={CFG} renderResult={Result} />;
}
