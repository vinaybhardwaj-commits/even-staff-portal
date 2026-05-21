import { AppLayout } from '@/components/AppLayout';
import { listPosts } from '@/lib/portal/bulletin';
import { Compose } from '@/components/bulletin/Compose';
import { PostCard } from '@/components/bulletin/PostCard';
import { Megaphone } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'Bulletin · Even Staff Portal' };

export default async function BulletinFeed() {
  const posts = await listPosts();

  return (
    <AppLayout title="Bulletin">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <Compose />

        <div className="mt-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-10 text-center">
              <Megaphone className="w-10 h-10 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-[14px] font-medium text-navy mb-1">No posts yet</div>
              <div className="text-[12px] text-[var(--color-text-secondary)]">Start the conversation. Use the box above to write the first post.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
