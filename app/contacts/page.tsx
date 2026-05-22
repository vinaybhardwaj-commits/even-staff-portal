import { AppLayout } from '@/components/AppLayout';
import { getContacts } from '@/lib/portal/reads';
import { Phone, Mail, Pin, Search } from 'lucide-react';
import { ContactsListClient } from '@/components/contacts/ContactsListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'Contacts · Even Staff Portal' };

export default async function ContactsDirectoryPage() {
  const contacts = await getContacts(500);
  return (
    <AppLayout title="Contacts">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {contacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
            <Phone className="w-12 h-12 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" strokeWidth={1.5} />
            <div className="text-[14px] font-medium text-navy mb-1">No contacts yet</div>
            <div className="text-[12px] text-[var(--color-text-secondary)]">Admin will add staff directory entries.</div>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ContactsListClient initialContacts={contacts as any} />
        )}
      </div>
    </AppLayout>
  );
}
