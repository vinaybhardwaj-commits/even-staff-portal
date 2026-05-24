'use client';

import Link from 'next/link';
import { Activity, Stethoscope } from 'lucide-react';
import CalculatorShell from './CalculatorShell';
import type { CalculatorConfig, CalculatorResult, FormField } from '@/lib/cdmss/calculators/types';

const FIELDS: FormField[] = [
  { key: 'age_ge_60', label: 'Age ≥ 60', type: 'bool', required: true,
    staticTooltip: 'Patient age 60 or above at the time of the TIA.' },
  { key: 'bp_ge_140_90', label: 'BP ≥ 140/90 at first assessment', type: 'bool', required: true,
    staticTooltip: 'Initial BP measured after the TIA — either SBP ≥140 or DBP ≥90 satisfies the criterion.' },
  { key: 'clinical', label: 'Clinical features', type: 'enum', required: true,
    options: [
      { value: 'unilateral_weakness',            label: 'Unilateral weakness (+2)' },
      { value: 'speech_disturbance_no_weakness', label: 'Speech disturbance without weakness (+1)' },
      { value: 'other',                          label: 'Other (0)' },
    ],
    staticTooltip: 'Pick the strongest single feature of the index event. Unilateral weakness scores highest.' },
  { key: 'duration', label: 'Symptom duration', type: 'enum', required: true,
    options: [
      { value: 'ge_60min',     label: '≥ 60 min (+2)' },
      { value: '10_to_59min',  label: '10-59 min (+1)' },
      { value: 'lt_10min',     label: '< 10 min (0)' },
    ],
    staticTooltip: 'Duration of the focal neurologic symptoms at peak. Use the longest contiguous episode.' },
  { key: 'diabetes', label: 'Diabetes', type: 'bool', required: true,
    staticTooltip: 'Pre-existing diagnosis of diabetes mellitus (type 1 or type 2, on any therapy).' },
];

const CFG: CalculatorConfig = {
  name: 'abcd2',
  displayTitle: 'ABCD² — TIA stroke risk',
  moduleHome: 'ask',
  pasteModeEnabled: false,
  apiPath: '/api/calculators/abcd2',
  resultSections: ['interpretation'],
  typicalLatencySec: 2,
  fields: FIELDS,
};

type Det = {
  score: number; band: string; band_label: string;
  element_points: { age: number; bp: number; clinical: number; duration: number; diabetes: number };
};

const BAND_COLOR: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-200 text-red-800',
};

const ELEMENT_LABEL: Record<string, string> = {
  age: 'Age', bp: 'BP', clinical: 'Clinical', duration: 'Duration', diabetes: 'DM',
};

function Result({ result }: { result: CalculatorResult & { deterministic: Det } }) {
  const d = result.deterministic;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900">{d.score}</span>
          <span className="text-sm text-slate-500">/ 7 ABCD²</span>
          <span className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${BAND_COLOR[d.band] ?? ''}`}>{d.band_label}</span>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">Element contributions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(d.element_points).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-1.5 text-xs">
              <span className="text-slate-500">{ELEMENT_LABEL[k] ?? k}</span>
              <span className={`font-semibold ${v === 0 ? 'text-slate-400' : 'text-slate-700'}`}>+{v}</span>
            </div>
          ))}
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
        <Link href={`/ask?q=${encodeURIComponent('My ABCD² is ' + d.score + ' (' + d.band_label + '). What is the management plan and admission threshold?')}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand hover:text-brand">
          Ask deeper about this score
        </Link>
      </div>
      <div className="text-xs text-slate-400">Trace: <code className="rounded bg-slate-100 px-1.5 py-0.5">{result.trace_id}</code></div>
    </div>
  );
}

export default function Abcd2Calculator() {
  return <CalculatorShell<Det> config={CFG} renderResult={Result} />;
}
