/**
 * YouTube URL → video ID parser. Supports:
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://m.youtube.com/watch?v=VIDEO_ID
 *   https://youtube.com/shorts/VIDEO_ID
 *
 * Returns null if not a YouTube URL or no parseable ID.
 */
export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const u = url.trim();

  // youtu.be/VIDEO_ID
  let m = u.match(/^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{6,15})(?:[?&].*)?$/i);
  if (m) return m[1];

  // youtube.com/watch?v=VIDEO_ID  (or m.youtube.com)
  m = u.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([A-Za-z0-9_-]{6,15})(?:[&].*)?$/i);
  if (m) return m[1];

  // youtube.com/embed/VIDEO_ID
  m = u.match(/^https?:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{6,15})(?:[?&].*)?$/i);
  if (m) return m[1];

  // youtube.com/shorts/VIDEO_ID
  m = u.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{6,15})(?:[?&].*)?$/i);
  if (m) return m[1];

  return null;
}

export function youtubeThumbnailUrl(videoId: string, quality: 'maxres' | 'hq' | 'mq' = 'hq'): string {
  // maxres often returns 404 for older videos; hqdefault is the universal safe default.
  const file = quality === 'maxres' ? 'maxresdefault.jpg' : quality === 'hq' ? 'hqdefault.jpg' : 'mqdefault.jpg';
  return `https://i.ytimg.com/vi/${videoId}/${file}`;
}

export function youtubeEmbedUrl(videoId: string, opts: { autoplay?: boolean; mute?: boolean } = {}): string {
  const params = new URLSearchParams();
  if (opts.autoplay) params.set('autoplay', '1');
  if (opts.mute) params.set('mute', '1');
  params.set('playsinline', '1');
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
