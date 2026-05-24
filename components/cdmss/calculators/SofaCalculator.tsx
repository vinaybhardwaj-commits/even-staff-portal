'use client';

import Link from 'next/link';
import { ShieldAlert, Stethoscope } from 'lucide-react';
import CalculatorShell from './CalculatorShell';
import type { CalculatorConfig, CalculatorResult, FormField } from '@/lib/cdmss/calculators/types';

const FIELDS: FormField[] = [
  { key: 'respiration', label: 'Respiration (PaO₂/FiO₂)', type: 'enum', required: true,
    options: [
      { value: 'gt_400',       label: '> 400 mmHg (0)' },
      { value: '301_400',      label: '301-400 (1)' },
      { value: '201_300',      label: '201-300 (2)' },
      { value: '101_200_mv',   label: '≤ 200 with mechanical ventilation (3)' },
      { value: 'le_100_mv',    label: '≤ 100 with mechanical ventilation (4)' },
    ],
    staticTooltip: 'PaO₂/FiO₂ ratio in mmHg. The 3- and 4-point bands require mechanical ventilation (invasive or NIV).' },
  { key: 'coagulation', label: 'Coagulation (platelets ×10³/µL)', type: 'enum', required: true,
    options: [
      { value: 'gt_150', label: '> 150 (0)' },
      { value: '101_150', label: '101-150 (1)' },
      { value: '51_100',  label: '51-100 (2)' },
      { value: '21_50',   label: '21-50 (3)' },
      { value: 'le_20',   label: '≤ 20 (4)' },
    ],
    staticTooltip: 'Platelet count in thousand/µL.' },
  { key: 'liver', label: 'Liver (total bilirubin mg/dL)', type: 'enum', required: true,
    options: [
      { value: 'lt_1_2',     label: '< 1.2 (0)' },
      { value: '1_2_to_1_9', label: '1.2-1.9 (1)' },
      { value: '2_0_to_5_9', label: '2.0-5.9 (2)' },
      { value: '6_0_to_11_9',label: '6.0-11.9 (3)' },
      { value: 'gt_12',      label: '> 12 (4)' },
    ],
    staticTooltip: 'Serum total bilirubin in mg/dL.' },
  { key: 'cardiovascular', label: 'Cardiovascular (MAP + vasopressors)', type: 'enum', required: true,
    options: [
      { value: 'map_ge_70',                          label: 'MAP ≥ 70 (0)' },
      { value: 'map_lt_70',                          label: 'MAP < 70, no pressors (1)' },
      { value: 'dopamine_le_5_or_dobutamine',        label: 'Dopamine ≤ 5 µg/kg/min OR dobutamine any dose (2)' },
      { value: 'dopamine_gt_5_or_norepi_le_0_1',     label: 'Dopamine > 5 OR norepi ≤ 0.1 µg/kg/min (3)' },
      { value: 'dopamine_gt_15_or_norepi_gt_0_1',    label: 'Dopamine > 15 OR norepi > 0.1 µg/kg/min (4)' },
    ],
    staticTooltip: 'Doses in µg/kg/min; epinephrine equivalent to norepinephrine in this lookup. Use highest-tier criterion that is met.' },
  { key: 'cns', label: 'CNS (Glasgow Coma Score)', type: 'enum', required: true,
    options: [
      { value: '15',     label: '15 (0)' },
      { value: '13_14',  label: '13-14 (1)' },
      { value: '10_12',  label: '10-12 (2)' },
      { value: '6_9',    label: '6-9 (3)' },
      { value: 'lt_6',   label: '< 6 (4)' },
    ],
    staticTooltip: 'Glasgow Coma Score. Use the sedation-free score where possible.' },
  { key: 'renal', label: 'Renal (creatinine mg/dL OR urine output)', type: 'enum', required: true,
    options: [
      { value: 'lt_1_2',                  label: '< 1.2 (0)' },
      { value: '1_2_to_1_9',              label: '1.2-1.9 (1)' },
      { value: '2_0_to_3_4',              label: '2.0-3.4 (2)' },
      { value: '3_5_to_4_9_or_uo_lt_500', label: '3.5-4.9 OR UO < 500 mL/d (3)' },
      { value: 'gt_5_or_uo_lt_200',       label: '> 5 OR UO < 200 mL/d (4)' },
    ],
    staticTooltip: 'Serum creatinine in mg/dL. Use the urine-output rule (UO <500 or <200 mL/d) only when more abnormal than the creatinine band.' },
  // qSOFA secondary chip — 3 booleans, positive when ≥2.
  { key: 'qsofa_rr_ge_22',       label: 'qSOFA: RR ≥ 22', type: 'bool', required: true, defaultValue: false,
    staticTooltip: 'Respiratory rate ≥ 22 breaths/min. Component of qSOFA — positive when ≥2/3 are true.' },
  { key: 'qsofa_altered_mental', label: 'qSOFA: altered mentation', type: 'bool', required: true, defaultValue: false,
    staticTooltip: 'GCS < 15 or any new altered mentation. Component of qSOFA.' },
  { key: 'qsofa_sbp_le_100',     label: 'qSOFA: SBP ≤ 100 mmHg', type: 'bool', required: true, defaultValue: false,
    staticTooltip: 'Systolic blood pressure ≤ 100 mmHg. Component of qSOFA.' },
];

const CFG: CalculatorConfig = {
  name: 'sofa',
  displayTitle: 'SOFA — Sepsis-related Organ Failure Assessment',
  moduleHome: 'ask',
  pasteModeEnabled: false,
  apiPath: '/api/calculators/sofa',
  resultSections: ['interpretation'],
  typicalLatencySec: 2,
  fields: FIELDS,
};

type Det = {
  score: number; band: string; band_label: string;
  element_points: Record<string, number>;
  qsofa_score: number; qsofa_positive: boolean;
};

const BAND_COLOR: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-yellow-100 text-yellow-800',
  severe: 'bg-orange-200 text-orange-800',
  very_high: 'bg-red-200 text-red-800',
};

const ELEMENT_LABEL: Record<string, string> = {
  respiration: 'Resp', coagulation: 'Coag', liver: 'Liver',
  cardiovascular: 'CV', cns: 'CNS', renal: 'Renal',
};

function Result({ result }: { result: CalculatorResult & { deterministic: Det } }) {
  const d = result.deterministic;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900">{d.score}</span>
          <span className="text-sm text-slate-500">/ 24 SOFA</span>
          <span className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${BAND_COLOR[d.band] ?? ''}`}>{d.band_label}</span>
        </div>
        <div className="mt-2">
          {d.qsofa_positive ? (
            <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
              qSOFA POSITIVE ({d.qsofa_score}/3) — high mortality flag
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              qSOFA negative ({d.qsofa_score}/3)
            </span>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">Per-organ contributions</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Object.entries(d.element_points).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-1.5 text-xs">
              <span className="text-slate-500">{ELEMENT_LABEL[k] ?? k}</span>
              <span className={`font-semibold ${v === 0 ? 'text-slate-400' : v >= 3 ? 'text-red-600' : 'text-amber-700'}`}>+{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">Clinical interpretation</h2>
        </div>
        <div className="text-sm leading-relaxed text-slate-700">
          {d.band_label}.{d.qsofa_positive ? ' qSOFA positive — escalate sepsis workup; consider 1-h bundle.' : ''}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/ask?q=${encodeURIComponent('My SOFA is ' + d.score + ' (' + d.band_label + ')' + (d.qsofa_positive ? ', qSOFA positive' : '') + '. What is the implied mortality trajectory and ICU plan?')}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand hover:text-brand">
          Ask deeper about this score
        </Link>
      </div>
      <div className="text-xs text-slate-400">Trace: <code className="rounded bg-slate-100 px-1.5 py-0.5">{result.trace_id}</code></div>
    </div>
  );
}

export default function SofaCalculator() {
  return <CalculatorShell<Det> config={CFG} renderResult={Result} />;
}
