/**
 * Sidebar navigation config — per PRD §4.1.
 *
 * 13 items in 3 sections, NO admin link (admin lives at hidden URL only,
 * per locked decision #17).
 *
 * SP.8 (cutover): CDMSS clinical tools now use RELATIVE paths. The middleware
 * in middleware.ts redirects /ask, /ddx, /drugs, /coach, /calculators, /review
 * to the stable CDMSS underlying alias (even-cdmss-vinaybhardwaj-commits-projects
 * .vercel.app). The vanity aliases even-cdmss.vercel.app + even-tutor.vercel.app
 * now resolve to THIS staff-portal project, so a relative href is correct;
 * the redirect happens server-side from whichever host the user is on.
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
  workspace: 'WORKSPACE',
  clinical: 'CLINICAL TOOLS',
  operations: 'OPERATIONS',
};
