/*
  DEC blog builder
  ----------------
  Runs automatically on Netlify every time the site is published.
  Reads content/posts.json (edited in the dashboard) and creates:
    /blog/                      - the blog list page
    /blog/<post-name>/          - one shareable page per post
    sitemap.xml                 - updated with every post
  and (via build-pages.js) the /areas/ village pages and /services/ pages.
  It also redirects the old blog.html links to the new pages.

  No extra software needed - plain Node.js. If anything goes wrong the
  build stops and Netlify keeps the previous version of the site live.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const {
  SITE, ORIGIN, DEFAULT_SHARE, PHONE, TEL, WA,
  esc, slugify, abs, isoDate, niceDate, plain, clip, markdown,
  HEAD_COMMON, HEADER, FOOTER
} = require('./shared');
const buildPages = require('./build-pages');
const postSlug = p => slugify(p.slug && p.slug.trim() ? p.slug : p.title);

function card(p, small) {
  const img = p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" width="600" height="340">` : '';
  return `<a class="post-card${small ? ' small' : ''}" href="/blog/${p._slug}/">${img}
  <div class="post-card-body"><div class="meta">${esc(niceDate(p.date))}${p.readtime ? ' · ' + esc(p.readtime) : ''}</div>
  <h${small ? 3 : 2}>${esc(p.title)}</h${small ? 3 : 2}>${small ? '' : `<p>${esc(p.excerpt || '')}</p>`}
  <span class="more">Read the guide →</span></div></a>`;
}

// ---------- post page ----------
function postPage(p, others) {
  const url = `${ORIGIN}/blog/${p._slug}/`;
  const desc = clip(p.excerpt && p.excerpt.trim() ? p.excerpt.trim() : plain(p.body), 158);
  const share = abs(p.share_image || p.image || DEFAULT_SHARE);
  const shareText = `${p.title} - Drayton Exterior Cleaning`;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: p.title, description: desc, image: [share], datePublished: isoDate(p.date) || undefined,
    dateModified: isoDate(p.updated || p.date) || undefined, mainEntityOfPage: url,
    author: { '@type': 'Person', name: 'Danny', url: ORIGIN + '/' },
    publisher: { '@type': 'Organization', '@id': ORIGIN + '/#business', name: 'Drayton Exterior Cleaning',
      logo: { '@type': 'ImageObject', url: ORIGIN + '/content/uploads/dec-logo.png' } }
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: ORIGIN + '/blog/' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url }]
  }];
  const more = others.slice(0, 3).map(o => card(o, true)).join('\n');
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)} | DEC Blog</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Drayton Exterior Cleaning">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(share)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(p.title)}">
${isoDate(p.date) ? `<meta property="article:published_time" content="${isoDate(p.date)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(share)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
${HEAD_COMMON}
</head>
<body>
${HEADER}
<main id="main">
  <article class="wrap post">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog/">Blog</a></nav>
    <div class="meta">${esc(niceDate(p.date))}${p.readtime ? ' · ' + esc(p.readtime) : ''} · by Danny</div>
    <h1>${esc(p.title)}</h1>
    ${p.excerpt ? `<p class="lede">${esc(p.excerpt)}</p>` : ''}
    <div class="share" data-url="${url}" data-title="${esc(shareText)}">
      <span class="share-label">Share</span>
      <button type="button" class="share-btn native" hidden>Share…</button>
      <a class="share-btn wa" href="https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}" target="_blank" rel="noopener" data-method="whatsapp">WhatsApp</a>
      <a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" data-method="facebook">Facebook</a>
      <a class="share-btn" href="mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent(shareText + '\n\n' + url)}" data-method="email">Email</a>
      <button type="button" class="share-btn copy" data-method="copy">Copy link</button>
    </div>
    ${p.image ? `<img class="cover" src="${esc(p.image)}" alt="${esc(p.image_alt || p.title)}" width="1200" height="675" decoding="async">` : ''}
    <div class="body">
${markdown(p.body)}
    </div>
    <aside class="cta">
      <h2>Want windows that stay this clean?</h2>
      <p>Pure-water window cleaning in Market Drayton and nearby villages. See your price in 30 seconds &mdash; no email needed.</p>
      <div class="cta-btns">
        <a class="btn" href="/#calculator">Get My Price</a>
        <a class="btn ghost" href="https://wa.me/${WA}" target="_blank" rel="noopener">Message on WhatsApp</a>
      </div>
    </aside>
    <div class="share bottom" data-url="${url}" data-title="${esc(shareText)}">
      <span class="share-label">Found this useful? Share it with a neighbour</span>
      <button type="button" class="share-btn native" hidden>Share…</button>
      <a class="share-btn wa" href="https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}" target="_blank" rel="noopener" data-method="whatsapp">WhatsApp</a>
      <a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" data-method="facebook">Facebook</a>
      <button type="button" class="share-btn copy" data-method="copy">Copy link</button>
    </div>
  </article>
  ${more ? `<section class="wrap-wide more-posts"><h2>More from the blog</h2><div class="grid">${more}</div></section>` : ''}
</main>
${FOOTER}
<script src="/_build/blog.js" defer></script>
</body>
</html>`;
}

// ---------- blog list page ----------
function listPage(posts) {
  const url = ORIGIN + '/blog/';
  const desc = 'Plain-English guides on window cleaning, hard water, gutters and exterior care for homes in Market Drayton and nearby villages.';
  const ld = { '@context': 'https://schema.org', '@type': 'Blog', name: 'The DEC Blog', url,
    blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${url}${p._slug}/`, datePublished: isoDate(p.date) || undefined })) };
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog | Window Cleaning Tips for Market Drayton | DEC</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Drayton Exterior Cleaning">
<meta property="og:title" content="The DEC Blog">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN + DEFAULT_SHARE}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
${HEAD_COMMON}
<script>
  /* old links like blog.html#post-name land here as /blog/#post-name - send them to the post */
  (function(){ var h = location.hash.replace('#',''); if (h && /^[a-z0-9-]+$/.test(h)) location.replace('/blog/' + h + '/'); })();
</script>
</head>
<body>
${HEADER}
<main id="main" class="wrap">
  <section class="list-hero">
    <div class="eyebrow">The DEC Blog</div>
    <h1>Windows, gutters and exterior care &mdash; explained plainly.</h1>
    <p class="lede">Practical guides for homeowners in Market Drayton and the surrounding villages.</p>
  </section>
  <section class="list">
${posts.map(p => card(p, false)).join('\n')}
  </section>
</main>
${FOOTER}
<script src="/_build/blog.js" defer></script>
</body>
</html>`;
}

// ---------- sitemap ----------
function sitemap(posts, extra) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = [
    // homepage + prices: change these dates when those pages are edited
    ['/', '2026-10-20', 'weekly', '1.0'], ['/prices.html', '2026-10-20', 'monthly', '0.9'],
    ['/blog/', isoDate(posts[0] && posts[0].date) || today, 'weekly', '0.7'],
    ...posts.map(p => [`/blog/${p._slug}/`, isoDate(p.updated || p.date) || today, 'monthly', '0.6']),
    ...(extra || []),
    ['/terms', '2026-10-21', 'yearly', '0.2'],
    ['/privacy', '2026-10-19', 'yearly', '0.2']
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map(r => `  <url><loc>${ORIGIN}${r[0]}</loc><lastmod>${r[1]}</lastmod><changefreq>${r[2]}</changefreq><priority>${r[3]}</priority></url>`).join('\n')}
</urlset>
`;
}

// ---------- run ----------
function write(rel, content) {
  const file = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('  wrote', rel);
}

const data = JSON.parse(fs.readFileSync(path.join(SITE, 'content/posts.json'), 'utf8'));
const posts = (data.blog || [])
  .filter(p => p && p.title && !p.draft)
  .map(p => Object.assign({}, p, { _slug: postSlug(p) }))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const seen = new Set();
posts.forEach(p => {
  if (!p._slug) throw new Error('A blog post has no usable title: ' + JSON.stringify(p).slice(0, 80));
  if (seen.has(p._slug)) throw new Error('Two blog posts share the web address /blog/' + p._slug + '/ - change one title or URL name.');
  seen.add(p._slug);
});

console.log(`DEC blog builder: ${posts.length} post(s)`);
fs.rmSync(path.join(SITE, 'blog'), { recursive: true, force: true });
posts.forEach(p => write(`blog/${p._slug}/index.html`, postPage(p, posts.filter(o => o !== p))));
write('blog/index.html', listPage(posts));
const pageRows = buildPages(write);       // village + service pages
write('sitemap.xml', sitemap(posts, pageRows));

// Retire the old single-page blog: remove it from the published site and redirect old links.
fs.rmSync(path.join(SITE, 'blog.html'), { force: true });
const redirectsFile = path.join(SITE, '_redirects');
const existing = fs.existsSync(redirectsFile) ? fs.readFileSync(redirectsFile, 'utf8') : '';
let rules = '# Added by the blog builder\n/blog.html  /blog/  301\n';
posts.forEach(p => {                       // links made from the title (old blog.html#... links) -> short address
  const fromTitle = slugify(p.title);
  if (fromTitle && fromTitle !== p._slug) rules += `/blog/${fromTitle}/  /blog/${p._slug}/  301\n`;
});
if (!existing.includes('# Added by the blog builder')) {
  fs.writeFileSync(redirectsFile, existing + (existing && !existing.endsWith('\n') ? '\n' : '') + rules);
  console.log('  added redirects for old blog links');
}
console.log('DEC blog builder: done');
