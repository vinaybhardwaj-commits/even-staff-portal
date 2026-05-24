'use client';

import Link from 'next/link';
import { Heart, Stethoscope } from 'lucide-react';
import CalculatorShell from './CalculatorShell';
import type { CalculatorConfig, CalculatorResult, FormField } from '@/lib/cdmss/calculators/types';

const FIELDS: FormField[] = [
  { key: 'history', label: 'History', type: 'enum', required: true,
    options: [
      { value: 'slightly_suspicious',    label: 'Slightly suspicious (0)' },
      { value: 'moderately_suspicious',  label: 'Moderately suspicious (1)' },
      { value: 'highly_suspicious',      label: 'Highly suspicious (2)' },
    ],
    staticTooltip: 'Clinician gestalt of chest-pain history: classic exertional radiating substernal pressure with diaphoresis is highly suspicious; isolated pleuritic/positional pain is slightly suspicious.' },
  { key: 'ecg', label: 'ECG', type: 'enum', required: true,
    options: [
      { value: 'normal',                       label: 'Normal (0)' },
      { value: 'non_specific_changes',         label: 'Non-specific repolarisation changes / known LBBB / paced (1)' },
      { value: 'significant_st_deviation',     label: 'Significant ST deviation (2)' },
    ],
    staticTooltip: 'Score 1 for non-specific repolarisation, LBBB, paced rhythm, or LVH with strain; score 2 only for ischaemic ST depression / elevation not attributable to LBBB or LVH.' },
  { key: 'age', label: 'Age', type: 'enum', required: true,
    options: [
      { value: 'lt_45',     label: '< 45 (0)' },
      { value: '45_to_64',  label: '45-64 (1)' },
      { value: 'ge_65',     label: '≥ 65 (2)' },
    ],
    staticTooltip: 'Patient age at presentation.' },
  { key: 'risk_factors', label: 'Risk factors', type: 'enum', required: true,
    options: [
      { value: 'none',                  label: 'None (0)' },
      { value: '1_to_2',                label: '1-2 factors (1)' },
      { value: 'ge_3_or_known_cad',     label: '≥ 3 factors OR known CAD (2)' },
    ],
    staticTooltip: 'Risk factors: HTN, DM, hypercholesterolemia, current smoker, family history of CAD before age 55, obesity BMI > 30. Known atherosclerotic disease (prior MI/PCI/CABG, stroke, PAD) automatically scores 2.' },
  { key: 'troponin', label: 'Troponin', type: 'enum', required: true,
    options: [
      { value: 'le_normal',          label: '≤ normal limit (0)' },
      { value: '1_to_3x_normal',     label: '1-3× normal (1)' },
      { value: 'gt_3x_normal',       label: '> 3× normal (2)' },
    ],
    staticTooltip: 'Use the assay-specific 99th-percentile upper reference limit. For hs-cTn, banding still uses 1× and 3× multipliers.' },
];

const CFG: CalculatorConfig = {
  name: 'heart',
  displayTitle: 'HEART score — chest pain risk',
  moduleHome: 'ask',
  pasteModeEnabled: false,
  apiPath: '/api/calculators/heart',
  resultSections: ['interpretation'],
  typicalLatencySec: 2,
  fields: FIELDS,
};

type Det = {
  score: number; band: string; band_label: string;
  element_points: { history: number; ecg: number; age: number; risk_factors: number; troponin: number };
};

const BAND_COLOR: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-200 text-red-800',
};

const ELEMENT_LABEL: Record<string, string> = {
  history: 'H', ecg: 'E', age: 'A', risk_factors: 'R', troponin: 'T',
};

function Result({ result }: { result: CalculatorResult & { deterministic: Det } }) {
  const d = result.deterministic;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900">{d.score}</span>
          <span className="text-sm text-slate-500">/ 10 HEART</span>
          <span className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${BAND_COLOR[d.band] ?? ''}`}>{d.band_label}</span>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">Element contributions</h2>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(d.element_points).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-1.5 text-xs">
              <span className="text-slate-500">{ELEMENT_LABEL[k] ?? k}</span>
              <span className={`font-semibold ${v === 0 ? 'text-slate-400' : v === 2 ? 'text-orange-600' : 'text-amber-700'}`}>+{v}</span>
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
        <Link href={`/ask?q=${encodeURIComponent('My HEART score is ' + d.score + ' (' + d.band_label + '). What is the safest disposition and observation window?')}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand hover:text-brand">
          Ask deeper about this score
        </Link>
      </div>
      <div className="text-xs text-slate-400">Trace: <code className="rounded bg-slate-100 px-1.5 py-0.5">{result.trace_id}</code></div>
    </div>
  );
}

export default function HeartCalculator() {
  return <CalculatorShell<Det> config={CFG} renderResult={Result} />;
}
