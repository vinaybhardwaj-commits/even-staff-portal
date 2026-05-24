import { AdminExampleQuestionsClient } from './admin-example-questions-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Example Questions' };

export default function Page() {
  return (
    <AdminPageChrome title="Example questions (rotating chips)">
      <AdminExampleQuestionsClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
