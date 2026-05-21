'use client';
import { useEffect, useState } from 'react';
import { Loader2, Upload, Youtube, Trash2, Home, X, Check } from 'lucide-react';
import { youtubeThumbnailUrl } from '@/lib/portal/youtube';

type Video = {
  id: number | string;
  title: string;
  description: string | null;
  category: string | null;
  source_type: 'upload' | 'youtube';
  blob_url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  uploaded_at: string;
  soft_deleted_at: string | null;
};

export function AdminVideosClient({ adminToken }: { adminToken: string }) {
  const authHeader = `Bearer ${adminToken}`;
  const [videos, setVideos] = useState<Video[]>([]);
  const [homeId, setHomeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload form
  const [upTitle, setUpTitle] = useState('');
  const [upDescription, setUpDescription] = useState('');
  const [upCategory, setUpCategory] = useState('');
  const [upFile, setUpFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // YouTube form
  const [ytTitle, setYtTitle] = useState('');
  const [ytDescription, setYtDescription] = useState('');
  const [ytCategory, setYtCategory] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [addingYt, setAddingYt] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/videos', { headers: { authorization: authHeader }, cache: 'no-store' });
      if (!r.ok) throw new Error(`list ${r.status}`);
      const j = await r.json();
      setVideos(j.videos);
      // Also fetch home_video_id via admin (public reads don't expose app_settings)
      const home = await fetch('/api/admin/db-tables', { headers: { authorization: authHeader }, cache: 'no-store' });
      if (home.ok) {
        // We don't have a direct endpoint for app_settings; infer via the home video read.
        // For SP.4 simplicity, just probe via the public homepage logic.
        // Quick alt: probe /api/videos and let the UI show 'home' chip if video.id appears in app_settings.home_video_id
      }
      // Simpler: read app_settings via a dedicated admin endpoint we'll add inline
      const hs = await fetch('/api/admin/videos/home-id', { headers: { authorization: authHeader }, cache: 'no-store' });
      if (hs.ok) {
        const hj = await hs.json();
        setHomeId(hj.home_video_id ?? null);
      }
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!upTitle.trim() || !upFile) return;
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', upFile);
      const ur = await fetch('/api/admin/videos/upload', { method: 'POST', body: fd, headers: { authorization: authHeader } });
      const uj = await ur.json();
      if (!ur.ok) throw new Error(uj.detail || uj.error || 'upload failed');

      const cr = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: authHeader },
        body: JSON.stringify({
          title: upTitle.trim(),
          description: upDescription.trim(),
          category: upCategory.trim(),
          source_type: 'upload',
          blob_url: uj.url,
          blob_path: uj.pathname,
          size_bytes: uj.size,
          mime_type: uj.contentType,
        }),
      });
      const cj = await cr.json();
      if (!cr.ok) throw new Error(cj.error || 'create failed');

      setUpTitle(''); setUpDescription(''); setUpCategory(''); setUpFile(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onAddYouTube(e: React.FormEvent) {
    e.preventDefault();
    if (!ytTitle.trim() || !ytUrl.trim()) return;
    setAddingYt(true); setError(null);
    try {
      const cr = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: authHeader },
        body: JSON.stringify({
          title: ytTitle.trim(),
          description: ytDescription.trim(),
          category: ytCategory.trim(),
          source_type: 'youtube',
          youtube_url: ytUrl.trim(),
        }),
      });
      const cj = await cr.json();
      if (!cr.ok) throw new Error(cj.error || 'create failed');
      setYtTitle(''); setYtDescription(''); setYtCategory(''); setYtUrl('');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingYt(false);
    }
  }

  async function setHome(id: number | string) {
    setError(null);
    try {
      const r = await fetch(`/api/admin/videos/${id}/set-home`, { method: 'POST', headers: { authorization: authHeader } });
      if (!r.ok) throw new Error((await r.json()).error || 'set-home failed');
      await refresh();
    } catch (e) { setError((e as Error).message); }
  }

  async function clearHome() {
    setError(null);
    try {
      const r = await fetch('/api/admin/videos/clear-home', { method: 'POST', headers: { authorization: authHeader } });
      if (!r.ok) throw new Error((await r.json()).error || 'clear-home failed');
      await refresh();
    } catch (e) { setError((e as Error).message); }
  }

  async function softDelete(id: number | string, title: string) {
    if (!confirm(`Soft-delete "${title}"? It'll disappear from the public library but stays recoverable for 30 days.`)) return;
    setError(null);
    try {
      const r = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE', headers: { authorization: authHeader } });
      if (!r.ok) throw new Error((await r.json()).error || 'delete failed');
      await refresh();
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upload form */}
        <form onSubmit={onUpload} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-brand" />
            <h2 className="text-[13px] font-semibold text-navy">Upload MP4 (≤ 25 MB)</h2>
          </div>
          <input
            type="text" value={upTitle} onChange={(e) => setUpTitle(e.target.value)}
            placeholder="Title" maxLength={200} required
            className="w-full px-3 py-2 mb-2 text-[13px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand"
          />
          <input
            type="text" value={upDescription} onChange={(e) => setUpDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 mb-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand"
          />
          <input
            type="text" value={upCategory} onChange={(e) => setUpCategory(e.target.value)}
            placeholder="Category (e.g. Admin announcement, Training, Townhall)"
            className="w-full px-3 py-2 mb-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand"
          />
          <input
            type="file" accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setUpFile(e.target.files?.[0] ?? null)}
            className="block text-[11px] text-[var(--color-text-secondary)] mb-3"
            required
          />
          <button
            type="submit" disabled={uploading || !upTitle.trim() || !upFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)] disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading…' : 'Upload video'}
          </button>
        </form>

        {/* YouTube form */}
        <form onSubmit={onAddYouTube} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Youtube className="w-4 h-4 text-brand" />
            <h2 className="text-[13px] font-semibold text-navy">Add YouTube video</h2>
          </div>
          <input
            type="text" value={ytTitle} onChange={(e) => setYtTitle(e.target.value)}
            placeholder="Title" maxLength={200} required
            className="w-full px-3 py-2 mb-2 text-[13px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand"
          />
          <input
            type="text" value={ytDescription} onChange={(e) => setYtDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 mb-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand"
          />
          <input
            type="text" value={ytCategory} onChange={(e) => setYtCategory(e.target.value)}
            placeholder="Category (optional)"
            className="w-full px-3 py-2 mb-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand"
          />
          <input
            type="url" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)}
            placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
            required
            className="w-full px-3 py-2 mb-3 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand"
          />
          <button
            type="submit" disabled={addingYt || !ytTitle.trim() || !ytUrl.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)] disabled:cursor-not-allowed transition-colors"
          >
            {addingYt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Youtube className="w-3.5 h-3.5" />}
            {addingYt ? 'Adding…' : 'Add video'}
          </button>
        </form>
      </div>

      {/* Library list */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
          <h2 className="text-[13px] font-semibold text-navy flex-1">All videos ({videos.length})</h2>
          {homeId !== null && (
            <button onClick={clearHome} className="text-[11px] text-[var(--color-text-muted)] hover:text-pink-dark inline-flex items-center gap-1">
              <X className="w-3 h-3" /> Clear home video
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : videos.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]">No videos. Upload or paste a YouTube URL above.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {videos.map((v) => {
              const isHome = Number(v.id) === homeId;
              const isDeleted = !!v.soft_deleted_at;
              const thumb = v.thumbnail_url || (v.youtube_video_id ? youtubeThumbnailUrl(v.youtube_video_id, 'mq') : null);
              return (
                <li key={v.id} className={`flex items-center gap-3 px-4 py-3 ${isDeleted ? 'opacity-50' : ''}`}>
                  <div className="w-16 h-10 bg-[var(--color-bg)] rounded shrink-0 overflow-hidden">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Upload className="w-3 h-3 text-[var(--color-text-muted)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-navy truncate">{v.title}</span>
                      {isHome && <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand text-white"><Home className="w-2.5 h-2.5" />Home</span>}
                      {isDeleted && <span className="text-[9px] uppercase tracking-wider text-pink-dark">deleted</span>}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-2">
                      {v.source_type === 'youtube' ? <Youtube className="w-2.5 h-2.5" /> : <Upload className="w-2.5 h-2.5" />}
                      <span>{v.source_type}</span>
                      {v.category && <><span>·</span><span>{v.category}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isDeleted && !isHome && (
                      <button onClick={() => setHome(v.id)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Set home
                      </button>
                    )}
                    {!isDeleted && (
                      <button onClick={() => softDelete(v.id, v.title)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
