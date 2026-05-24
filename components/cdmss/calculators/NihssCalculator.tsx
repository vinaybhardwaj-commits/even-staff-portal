'use client';

import Link from 'next/link';
import { Brain, Stethoscope } from 'lucide-react';
import CalculatorShell from './CalculatorShell';
import type { CalculatorConfig, CalculatorResult, FormField } from '@/lib/cdmss/calculators/types';

// Reusable score dropdown options.
const O = (n: number) => Array.from({ length: n + 1 }, (_, i) => ({ value: String(i), label: String(i) }));

const FIELDS: FormField[] = [
  { key: 'loc',             label: '1a LOC',                        type: 'enum', required: true,
    options: [
      { value: '0', label: '0 — Alert' },
      { value: '1', label: '1 — Drowsy, arouses with minor stim' },
      { value: '2', label: '2 — Stuporous, requires repeated stim' },
      { value: '3', label: '3 — Coma / unresponsive' },
    ],
    staticTooltip: 'Level of consciousness — examiner observation only, no painful stim needed beyond what differentiates the categories.' },
  { key: 'loc_questions',   label: '1b LOC questions',              type: 'enum', required: true,
    options: [
      { value: '0', label: '0 — Both correct' },
      { value: '1', label: '1 — One correct' },
      { value: '2', label: '2 — Neither correct' },
    ],
    staticTooltip: 'Ask current month and patient\'s age. Aphasia / intubation that prevents speech scores 2; dysarthria can still score 0 if answer is comprehensible.' },
  { key: 'loc_commands',    label: '1c LOC commands',               type: 'enum', required: true,
    options: [
      { value: '0', label: '0 — Both correct' },
      { value: '1', label: '1 — One correct' },
      { value: '2', label: '2 — Neither correct' },
    ],
    staticTooltip: 'Ask to open/close eyes and grip/release the non-paretic hand. Substitute another 1-step command if hand cannot be used.' },
  { key: 'gaze',            label: '2 Best gaze',                   type: 'enum', required: true,
    options: O(2),
    staticTooltip: 'Horizontal eye movements only. 0=normal, 1=partial gaze palsy correctable with VOR, 2=forced deviation not overcome by oculocephalic.' },
  { key: 'visual_fields',   label: '3 Visual fields',               type: 'enum', required: true,
    options: O(3),
    staticTooltip: 'Confrontation. 0=no loss, 1=partial hemianopia, 2=complete hemianopia, 3=bilateral hemianopia incl cortical blindness.' },
  { key: 'facial_palsy',    label: '4 Facial palsy',                type: 'enum', required: true,
    options: O(3),
    staticTooltip: '0=normal, 1=minor (NL flattening), 2=partial (lower face), 3=complete (one or both sides).' },
  { key: 'motor_arm_left',  label: '5a Motor arm — left',           type: 'enum', required: true,
    options: O(4),
    staticTooltip: 'Arm held 90° (sitting) or 45° (supine) × 10 s. 0=no drift, 1=drift, 2=some effort vs gravity, 3=no effort vs gravity, 4=no movement.' },
  { key: 'motor_arm_right', label: '5b Motor arm — right',          type: 'enum', required: true,
    options: O(4),
    staticTooltip: 'Same protocol as 5a, opposite side.' },
  { key: 'motor_leg_left',  label: '6a Motor leg — left',           type: 'enum', required: true,
    options: O(4),
    staticTooltip: 'Leg held 30° (always supine) × 5 s. Same 0-4 scale as arms.' },
  { key: 'motor_leg_right', label: '6b Motor leg — right',          type: 'enum', required: true,
    options: O(4),
    staticTooltip: 'Same protocol as 6a, opposite side.' },
  { key: 'limb_ataxia',     label: '7 Limb ataxia',                 type: 'enum', required: true,
    options: O(2),
    staticTooltip: 'Finger-nose-finger + heel-shin. 0=absent (or unable to test from weakness), 1=present in 1 limb, 2=present in 2+ limbs.' },
  { key: 'sensory',         label: '8 Sensory',                     type: 'enum', required: true,
    options: O(2),
    staticTooltip: 'Pinprick. 0=normal, 1=mild-moderate loss, 2=severe-to-total loss.' },
  { key: 'language',        label: '9 Best language',               type: 'enum', required: true,
    options: O(3),
    staticTooltip: 'Naming + reading + describing the cookie-theft picture. 0=normal, 1=mild-moderate aphasia, 2=severe aphasia, 3=mute / global.' },
  { key: 'dysarthria',      label: '10 Dysarthria',                 type: 'enum', required: true,
    options: O(2),
    staticTooltip: 'Articulation only — not aphasia. 0=normal, 1=mild-moderate, 2=severe / unintelligible / mute.' },
  { key: 'extinction',      label: '11 Extinction / inattention',   type: 'enum', required: true,
    options: O(2),
    staticTooltip: 'Double simultaneous stim. 0=normal, 1=mild (one modality), 2=profound (multiple modalities, denies own limb).' },
];

const CFG: CalculatorConfig = {
  name: 'nihss',
  displayTitle: 'NIHSS — NIH Stroke Scale',
  moduleHome: 'ask',
  pasteModeEnabled: false,
  apiPath: '/api/calculators/nihss',
  resultSections: ['interpretation'],
  typicalLatencySec: 2,
  fields: FIELDS,
};

type Det = { score: number; band: string; band_label: string };

const BAND_COLOR: Record<string, string> = {
  no_stroke:       'bg-emerald-100 text-emerald-700',
  minor:           'bg-yellow-100 text-yellow-800',
  moderate:        'bg-orange-100 text-orange-700',
  moderate_severe: 'bg-rose-200 text-rose-800',
  severe:          'bg-red-200 text-red-800',
};

function Result({ result }: { result: CalculatorResult & { deterministic: Det } }) {
  const d = result.deterministic;
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900">{d.score}</span>
          <span className="text-sm text-slate-500">/ 42 NIHSS</span>
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
        <Link href={`/ask?q=${encodeURIComponent('My NIHSS is ' + d.score + ' (' + d.band_label + '). What does this mean for tPA eligibility and disposition?')}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand hover:text-brand">
          Ask deeper about this score
        </Link>
      </div>
      <div className="text-xs text-slate-400">Trace: <code className="rounded bg-slate-100 px-1.5 py-0.5">{result.trace_id}</code></div>
    </div>
  );
}

export default function NihssCalculator() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
        <Brain className="h-4 w-4 text-brand" /> NIH Stroke Scale (NINDS / AHA)
      </div>
      <CalculatorShell<Det> config={CFG} renderResult={Result} />
    </div>
  );
}
