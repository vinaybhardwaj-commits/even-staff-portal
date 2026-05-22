/**
 * Sidebar navigation config — per PRD §4.1 + v1.1 expansion.
 *
 * 4 sections, NO admin link (admin lives at hidden URL only per locked
 * decision #17).
 *
 * v1.1 addition: HOSPITAL SYSTEMS section at the top with the three HIS
 * apps (KareXpert, Pulse, Chart) — promoted out of /resources per V's
 * 22 May 2026 ask. These open in a new tab (external HIS systems).
 *
 * SP.8 (cutover): CDMSS clinical tools use RELATIVE paths. Middleware
 * redirects /ask, /ddx, /drugs, /coach, /calculators, /review to the stable
 * CDMSS underlying alias.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Home, Megaphone, Tv, Phone, Link as LinkIcon, FlaskConical,
  MessageCircle, Sparkles, Pill, Calculator, Brain, BookOpen,
  Bell, Building2, Activity, FileText,
} from 'lucide-react';

export type NavSection = 'systems' | 'workspace' | 'clinical' | 'operations';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
  section: NavSection;
};

export const NAV_ITEMS: NavItem[] = [
  // HOSPITAL SYSTEMS — external HIS apps, opens in new tab
  { label: 'KareXpert', href: 'https://even.karexpert.com/account-management/login', icon: Building2, external: true, section: 'systems' },
  { label: 'Pulse',     href: 'https://pulse.even.in/',                              icon: Activity,  external: true, section: 'systems' },
  { label: 'Chart',     href: 'https://chart.even.in/',                              icon: FileText,  external: true, section: 'systems' },

  // WORKSPACE
  { label: 'Home',       href: '/',          icon: Home,          section: 'workspace' },
  { label: 'Bulletin',   href: '/bulletin',  icon: Megaphone,     section: 'workspace' },
  { label: 'Videos',     href: '/videos',    icon: Tv,            section: 'workspace' },
  { label: 'Contacts',   href: '/contacts',  icon: Phone,         section: 'workspace' },
  { label: 'Resources',  href: '/resources', icon: LinkIcon,      section: 'workspace' },
  { label: 'Pilot apps', href: '/pilot',     icon: FlaskConical,  section: 'workspace' },

  // CLINICAL TOOLS — middleware redirects to CDMSS underlying alias (SP.8)
  { label: 'Ask',    href: '/ask',          icon: MessageCircle, section: 'clinical' },
  { label: 'DDx',    href: '/ddx',          icon: Sparkles,      section: 'clinical' },
  { label: 'Drugs',  href: '/drugs',        icon: Pill,          section: 'clinical' },
  { label: 'Calc',   href: '/calculators',  icon: Calculator,    section: 'clinical' },
  { label: 'Coach',  href: '/coach',        icon: Brain,         section: 'clinical' },
  { label: 'Review', href: '/review',       icon: BookOpen,      section: 'clinical' },

  // OPERATIONS
  { label: 'Sewa', href: '/sewa', icon: Bell, section: 'operations' },
];

export const SECTION_LABELS: Record<NavSection, string> = {
  systems: 'HOSPITAL SYSTEMS',
  workspace: 'WORKSPACE',
  clinical: 'CLINICAL TOOLS',
  operations: 'OPERATIONS',
};
