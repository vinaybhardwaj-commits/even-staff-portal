/**
 * Tiny safe markdown renderer for bulletin posts + comments.
 * Supports: bold (**...**), italics (*...*), inline code (`...`),
 * links ([text](url)), unordered lists (- ...), ordered lists (1. ...),
 * headings (#, ##, ###), blockquotes (>), line breaks.
 *
 * No raw HTML allowed — everything escaped first. Conservative on purpose
 * to keep XSS surface zero. If we ever want full markdown, swap to
 * react-markdown + rehype-sanitize behind this interface.
 */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function inline(s: string): string {
  let out = esc(s);
  // Inline code: `code` (before bold/italic so they don't recurse inside)
  out = out.replace(/`([^`]+)`/g, '<code class="bg-[var(--color-bg)] px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');
  // Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  out = out.replace(/(?<![*])\*([^*\n]+?)\*(?![*])/g, '<em>$1</em>');
  // Links: [text](url)  — only allow http/https URLs, target=_blank
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-brand hover:underline">${text}</a>`;
  });
  return out;
}

export function renderMarkdown(input: string): string {
  if (!input) return '';
  const lines = input.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^### (.+)/.test(line)) { out.push(`<h3 class="text-[14px] font-semibold text-navy mt-3 mb-1">${inline(line.replace(/^### /, ''))}</h3>`); i++; continue; }
    if (/^## (.+)/.test(line))  { out.push(`<h2 class="text-[15px] font-semibold text-navy mt-3 mb-1">${inline(line.replace(/^## /, ''))}</h2>`); i++; continue; }
    if (/^# (.+)/.test(line))   { out.push(`<h1 class="text-[16px] font-semibold text-navy mt-3 mb-1">${inline(line.replace(/^# /, ''))}</h1>`); i++; continue; }
    if (/^> (.+)/.test(line))   { out.push(`<blockquote class="border-l-2 border-brand-faint pl-2 italic text-[var(--color-text-muted)] my-1">${inline(line.replace(/^> /, ''))}</blockquote>`); i++; continue; }
    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*] /, ''))}</li>`);
        i++;
      }
      out.push(`<ul class="list-disc list-outside pl-5 my-1 space-y-0.5">${items.join('')}</ul>`);
      continue;
    }
    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      out.push(`<ol class="list-decimal list-outside pl-5 my-1 space-y-0.5">${items.join('')}</ol>`);
      continue;
    }
    if (line.trim() === '') {
      // Group runs of blank lines as a single paragraph break
      out.push('');
      i++;
      continue;
    }
    // Plain paragraph (collapse adjacent non-empty lines into one <p>)
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^[#>\-*]|\d+\. /.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p class="my-1.5">${inline(para.join(' '))}</p>`);
  }
  return out.join('');
}
