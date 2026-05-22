import { AppLayout } from '@/components/AppLayout';
import { getHomeLayout } from '@/lib/portal/settings';

export default async function CdmssGroupLayout({ children }: { children: React.ReactNode }) {
  const settings = await getHomeLayout();
  return <AppLayout settings={settings}>{children}</AppLayout>;
}
