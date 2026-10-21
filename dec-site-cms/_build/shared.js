/*
  DEC shared page pieces
  ----------------------
  Used by build-blog.js (blog pages) and build-pages.js (village + service pages)
  so every generated page has the same header, footer and helpers.
*/
'use strict';

const ORIGIN = 'https://draytonclean.co.uk';
const DEFAULT_SHARE = '/content/uploads/og-image.png';
const PHONE = '07367 298 499', TEL = '+447367298499', WA = '447367298499';

// The villages and services, in the order they appear in menus and footers.
// (Kept here so the footer can link to them without reading the JSON twice.)
const fs = require('fs');
const path = require('path');
const SITE = path.resolve(__dirname, '..');
const readJSON = (rel, key) => {
  const f = path.join(SITE, rel);
  return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8'))[key] || []) : [];
};
const AREAS = readJSON('content/areas.json', 'areas');
const SERVICES = readJSON('content/services.json', 'services');

// ---------- helpers ----------
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const abs = u => !u ? '' : /^https?:\/\//.test(u) ? u : ORIGIN + (u.startsWith('/') ? u : '/' + u);
const isoDate = d => { const t = new Date(d); return isNaN(t) ? '' : t.toISOString().slice(0, 10); };
const niceDate = d => { const t = new Date(d); return isNaN(t) ? '' :
  t.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const plain = md => String(md || '').replace(/<[^>]+>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*_>`-]/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';

// ---------- tiny markdown converter (headings, lists, bold, italic, links, images, quotes, raw HTML) ----------
function inline(text) {
  let s = esc(text);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) =>
    `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, href) => {
    const ext = /^https?:\/\//.test(href) && !href.includes('draytonclean.co.uk');
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  // turn bare draytonclean.co.uk links into real links
  s = s.replace(/(^|[\s(])((?:https?:\/\/)?draytonclean\.co\.uk(\/[^\s<)]*)?)/g, (m, pre, url, p) =>
    `${pre}<a href="${p ? p.replace(/[.,]$/, '') : '/'}">${url}</a>`);
  return s;
}
function markdown(md) {
  const lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
  const out = []; let para = [], list = null;
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type}>` + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + `</${list.type}>`); list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], t = line.trim();
    if (!t) { flushPara(); flushList(); continue; }
    let m;
    if (/^<(iframe|div|figure|video|blockquote|table|p|h\d|ul|ol)\b/i.test(t)) {    // raw HTML block
      flushPara(); flushList();
      const block = [line];
      while (i + 1 < lines.length && lines[i + 1].trim()) block.push(lines[++i]);
      out.push(block.join('\n')); continue;
    }
    if ((m = t.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara(); flushList();
      const lvl = Math.min(4, Math.max(2, m[1].length));       // # and ## -> h2 (the title is the h1)
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`); continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(t)) { flushPara(); flushList(); out.push('<hr>'); continue; }
    if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); flushList(); out.push('<blockquote><p>' + inline(m[1]) + '</p></blockquote>'); continue; }
    if ((m = t.match(/^[-*•]\s+(.*)$/)) || (m = t.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara();
      const type = /^\d/.test(t) ? 'ol' : 'ul';
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push(m[1]); continue;
    }
    flushList(); para.push(t);
  }
  flushPara(); flushList();
  return out.join('\n');
}

// ---------- shared page pieces ----------
const HEAD_COMMON = `<script src="/dec-consent.js"></script>
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/_build/blog.css">`;

const HEADER = `<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="nav">
    <a href="/" aria-label="Drayton Exterior Cleaning home"><img src="/content/uploads/dec-logo.png" alt="Drayton Exterior Cleaning" width="120" height="40" style="height:40px;width:auto;"></a>
    <nav class="nav-links" aria-label="Main">
      <a href="/services/">Services</a><a href="/areas/">Areas</a><a href="/prices.html">Prices</a><a href="/blog/">Blog</a><a href="/#reviews">Reviews</a>
      <a class="call-btn" href="tel:${TEL}" aria-label="Call ${PHONE}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z"/></svg></a>
      <a class="btn" href="/prices.html">Get My Price</a>
    </nav>
  </div>
</header>`;

const FOOTER = `<footer class="site-foot">
  <div class="wrap-wide">
    <div class="foot-grid">
      <div>
        <img src="/content/uploads/dec-logo-dark.png" alt="Drayton Exterior Cleaning" width="110" height="36" style="height:36px;width:auto;">
        <p>Pure-water window &amp; exterior cleaning in Market Drayton and the villages around it.</p>
        <p><a href="tel:${TEL}">${PHONE}</a><br><a href="https://wa.me/${WA}" target="_blank" rel="noopener">WhatsApp us</a><br><a href="mailto:hello@draytonclean.co.uk">hello@draytonclean.co.uk</a></p>
      </div>
      <nav aria-label="Areas we cover"><h2 class="foot-h">Areas we cover</h2>
        ${AREAS.map(a => `<a href="/areas/${a.slug}/">${esc(a.name)}</a>`).join('\n        ')}
      </nav>
      <nav aria-label="Services"><h2 class="foot-h">Services</h2>
        ${SERVICES.map(s => `<a href="/services/${s.slug}/">${esc(s.name)}</a>`).join('\n        ')}
        <a href="/prices.html">Instant prices</a>
        <a href="/blog/">Blog</a>
      </nav>
    </div>
    <p class="legal">Drayton Exterior Cleaning (DEC) is a trading name of Prime Event &amp; Media Solutions Ltd. Registered in England &amp; Wales No. 16904317.
      <a href="/terms">Terms</a> · <a href="/privacy">Privacy &amp; cookies</a> · <a href="#" data-cookie-settings>Cookie settings</a></p>
  </div>
</footer>`;

module.exports = {
  ORIGIN, DEFAULT_SHARE, PHONE, TEL, WA, SITE, AREAS, SERVICES,
  esc, slugify, abs, isoDate, niceDate, plain, clip, inline, markdown,
  HEAD_COMMON, HEADER, FOOTER
};
