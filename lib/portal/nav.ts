/**
 * Sidebar navigation config — per PRD §4.1.
 *
 * 13 items in 3 sections, NO admin link (admin lives at hidden URL only,
 * per locked decision #17).
 *
 * CDMSS clinical tools are external for SP.1 (they live at
 * even-cdmss.vercel.app until SP.8 cutover merges everything). After
 * the alias reassignment + repo merge, they become internal /ask, /ddx, etc.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Home, Megaphone, Tv, Phone, Link as LinkIcon, FlaskConical,
  MessageCircle, Sparkles, Pill, Calculator, Brain, BookOpen,
  Bell,
} from 'lucide-react';

export type NavSection = 'workspace' | 'clinical' | 'operations';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
  section: NavSection;
};

export const NAV_ITEMS: NavItem[] = [
  // WORKSPACE
  { label: 'Home',       href: '/',          icon: Home,          section: 'workspace' },
  { label: 'Bulletin',   href: '/bulletin',  icon: Megaphone,     section: 'workspace' },
  { label: 'Videos',     href: '/videos',    icon: Tv,            section: 'workspace' },
  { label: 'Contacts',   href: '/contacts',  icon: Phone,         section: 'workspace' },
  { label: 'Resources',  href: '/resources', icon: LinkIcon,      section: 'workspace' },
  { label: 'Pilot apps', href: '/pilot',     icon: FlaskConical,  section: 'workspace' },

  // CLINICAL TOOLS — external to CDMSS for SP.1 (alias-bridged at SP.8)
  { label: 'Ask',    href: 'https://even-cdmss.vercel.app/ask',          icon: MessageCircle, external: true, section: 'clinical' },
  { label: 'DDx',    href: 'https://even-cdmss.vercel.app/ddx',          icon: Sparkles,      external: true, section: 'clinical' },
  { label: 'Drugs',  href: 'https://even-cdmss.vercel.app/drugs', icon: Pill,          external: true, section: 'clinical' },
  { label: 'Calc',   href: 'https://even-cdmss.vercel.app/calculators',  icon: Calculator,    external: true, section: 'clinical' },
  { label: 'Coach',  href: 'https://even-cdmss.vercel.app/coach',        icon: Brain,         external: true, section: 'clinical' },
  { label: 'Review', href: 'https://even-cdmss.vercel.app/review',       icon: BookOpen,      external: true, section: 'clinical' },

  // OPERATIONS
  { label: 'Sewa', href: '/sewa', icon: Bell, section: 'operations' },
];

export const SECTION_LABELS: Record<NavSection, string> = {
  workspace: 'WORKSPACE',
  clinical: 'CLINICAL TOOLS',
  operations: 'OPERATIONS',
};
