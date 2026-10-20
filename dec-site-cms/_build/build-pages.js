/*
  DEC village + service page builder
  ----------------------------------
  Called by build-blog.js on every Netlify publish. Reads:
    content/areas.json     - one entry per village  -> /areas/<slug>/
    content/services.json  - one entry per service  -> /services/<slug>/
    content/testimonials.json (the same reviews shown on the homepage)
  and also makes the /areas/ and /services/ index pages.

  To change the wording on a village or service page, edit the JSON file.
  Returns the rows to add to sitemap.xml.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const {
  SITE, ORIGIN, DEFAULT_SHARE, PHONE, TEL, WA, AREAS, SERVICES,
  esc, abs, markdown, HEAD_COMMON, HEADER, FOOTER
} = require('./shared');

const UPDATED = '2026-10-20';          // change when the page wording is edited
const BUSINESS_ID = ORIGIN + '/#business';
const PORTRAIT = '/content/uploads/web-img_5824.webp';

const readJSON = rel => JSON.parse(fs.readFileSync(path.join(SITE, rel), 'utf8'));
const reviews = (() => {
  try { return (readJSON('content/testimonials.json').items || []).filter(r => r && r.quote); }
  catch (e) { return []; }
})();
const posts = (() => {
  try { return readJSON('content/posts.json').blog || []; } catch (e) { return []; }
})();

const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const crumbsLd = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: ORIGIN + it[1] }))
});
const faqLd = faq => (faq && faq.length) ? {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
} : null;

function head({ title, description, url, image, schema }) {
  const share = abs(image || DEFAULT_SHARE);
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Drayton Exterior Cleaning">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN + DEFAULT_SHARE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ORIGIN + DEFAULT_SHARE}">
${schema.filter(Boolean).map(ld).join('\n')}
${image ? `<link rel="preload" as="image" href="${esc(image)}">` : ''}
${HEAD_COMMON}
</head>
<body>
${HEADER}`;
}

const tail = () => `${FOOTER}
</body>
</html>`;

const ctaButtons = (label) => `<div class="pg-ctas">
      <a class="btn" href="/prices.html">${label || 'Get My Price in 30 Seconds'}</a>
      <a class="btn line" href="https://wa.me/${WA}" target="_blank" rel="noopener">WhatsApp us</a>
      <a class="btn line" href="tel:${TEL}">Call ${PHONE}</a>
    </div>`;

const trust = `<ul class="trust">
      <li>Fully insured</li><li>Every review so far is 5 stars</li><li>Text the day before</li><li>Online portal &amp; payment</li>
    </ul>`;

function reviewBlock(placeName, offset) {
  if (!reviews.length) return '';
  const local = reviews.filter(r => r.location && placeName && r.location.toLowerCase() === placeName.toLowerCase());
  const others = reviews.filter(r => !local.includes(r) && r.quote.length > 60);
  const pool = local.length >= 2 ? local : local.concat(others.slice(offset % Math.max(1, others.length)).concat(others));
  const pick = [...new Set(pool)].slice(0, 2);
  return `<section class="pg-section">
    <h2>What customers say</h2>
    <div class="reviews">
      ${pick.map(r => `<figure class="review">
        <div class="stars" aria-label="${r.rating || 5} out of 5 stars">${'★'.repeat(r.rating || 5)}</div>
        <blockquote><p>${esc(r.quote)}</p></blockquote>
        <figcaption>${esc(r.name)}${r.location ? ', ' + esc(r.location) : ''}</figcaption>
      </figure>`).join('\n      ')}
    </div>
    <p class="small"><a href="/#reviews">Read all our reviews</a></p>
  </section>`;
}

const meetDanny = `<section class="pg-section danny">
    <img src="${PORTRAIT}" alt="Danny, owner of Drayton Exterior Cleaning" width="120" height="160" loading="lazy" decoding="async">
    <div>
      <h2>You'll get Danny</h2>
      <p>DEC is run by Danny, who started cleaning windows around Market Drayton at 18 with a ladder and a bucket. He's back doing it with modern pure-water kit, a proper booking system and the same eye for detail. Some people know him already as a local DJ.</p>
      <p class="small"><a href="/blog/from-a-ladder-at-18-to-dec/">Read Danny's story</a></p>
    </div>
  </section>`;

function faqBlock(faq) {
  if (!faq || !faq.length) return '';
  return `<section class="pg-section">
    <h2>Questions people ask</h2>
    <div class="faq">
      ${faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n      ')}
    </div>
  </section>`;
}

const finalCta = (place) => `<aside class="cta">
    <h2>See your price${place ? ' for ' + esc(place) : ''} in 30 seconds</h2>
    <p>No email needed. Pick your house type and bedrooms and the price appears instantly. Then text, WhatsApp or send it over to book.</p>
    <div class="cta-btns">
      <a class="btn" href="/prices.html">Get My Price</a>
      <a class="btn ghost" href="https://wa.me/${WA}" target="_blank" rel="noopener">Message on WhatsApp</a>
    </div>
  </aside>`;

function figure(src, alt) {
  return `<img class="pg-photo" src="${esc(src)}" alt="${esc(alt)}" width="960" height="640" decoding="async" fetchpriority="high">`;
}

// ---------- village page ----------
function areaPage(a, i) {
  const url = `${ORIGIN}/areas/${a.slug}/`;
  const others = AREAS.filter(o => o.slug !== a.slug);
  const schema = [
    {
      '@context': 'https://schema.org', '@type': 'Service',
      name: `Window cleaning in ${a.name}`, serviceType: 'Window cleaning', url,
      provider: { '@type': 'LocalBusiness', '@id': BUSINESS_ID, name: 'Drayton Exterior Cleaning', telephone: TEL, url: ORIGIN + '/' },
      areaServed: [{ '@type': 'Place', name: a.name }].concat((a.covers || []).map(c => ({ '@type': 'Place', name: c })))
    },
    crumbsLd([['Home', '/'], ['Areas we cover', '/areas/'], [a.name, `/areas/${a.slug}/`]]),
    faqLd(a.faq)
  ];
  return `${head({ title: a.title, description: a.description, url, image: a.image, schema })}
<main id="main" class="pg">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/areas/">Areas</a> › <span aria-current="page">${esc(a.name)}</span></nav>
    <div class="eyebrow">Window cleaning · ${esc(a.name)}${a.postcode ? ' · ' + esc(a.postcode) : ''}</div>
    <h1>Window Cleaning in ${esc(a.name)}</h1>
    <p class="lede">${esc(a.lede)}</p>
    ${ctaButtons()}
    ${trust}
    ${figure(a.image, a.image_alt)}
    ${a.covers && a.covers.length ? `<div class="covers"><h2 class="mini">We cover</h2><ul>${a.covers.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
    <div class="body">
${markdown(a.body)}
    </div>
    <section class="pg-section">
      <h2>Services in ${esc(a.name)}</h2>
      <div class="svc-links">
        ${SERVICES.map(s => `<a href="/services/${s.slug}/"><strong>${esc(s.name)}</strong><span>${esc(s.lede)}</span></a>`).join('\n        ')}
      </div>
      <p class="small">Gutter clearing and pressure washing are coming soon.</p>
    </section>
    ${reviewBlock(a.name, i)}
    ${meetDanny}
    ${faqBlock(a.faq)}
    ${finalCta(a.name)}
    <nav class="pg-section nearby" aria-label="Other villages we cover">
      <h2>Nearby villages we also cover</h2>
      <ul class="chips">${others.map(o => `<li><a href="/areas/${o.slug}/">${esc(o.name)}</a></li>`).join('')}</ul>
    </nav>
  </div>
</main>
${tail()}`;
}

// ---------- service page ----------
function servicePage(s, i) {
  const url = `${ORIGIN}/services/${s.slug}/`;
  const related = (s.related_posts || []).map(sl => posts.find(p => p.slug === sl)).filter(Boolean);
  const schema = [
    {
      '@context': 'https://schema.org', '@type': 'Service',
      name: s.name, serviceType: s.name, url, description: s.description,
      provider: { '@type': 'LocalBusiness', '@id': BUSINESS_ID, name: 'Drayton Exterior Cleaning', telephone: TEL, url: ORIGIN + '/' },
      areaServed: AREAS.map(a => ({ '@type': 'Place', name: a.name }))
    },
    crumbsLd([['Home', '/'], ['Services', '/services/'], [s.name, `/services/${s.slug}/`]]),
    faqLd(s.faq)
  ];
  return `${head({ title: s.title, description: s.description, url, image: s.image, schema })}
<main id="main" class="pg">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/services/">Services</a> › <span aria-current="page">${esc(s.name)}</span></nav>
    <div class="eyebrow">${esc(s.name)} · Market Drayton &amp; villages</div>
    <h1>${esc(s.h1)}</h1>
    <p class="lede">${esc(s.lede)}</p>
    ${ctaButtons()}
    ${trust}
    ${figure(s.image, s.image_alt)}
    <div class="body">
${markdown(s.body)}
    </div>
    <section class="pg-section">
      <h2>Where we offer ${esc(s.name.toLowerCase())}</h2>
      <ul class="chips">${AREAS.map(a => `<li><a href="/areas/${a.slug}/">${esc(a.name)}</a></li>`).join('')}</ul>
    </section>
    ${reviewBlock('', i + 1)}
    ${faqBlock(s.faq)}
    ${related.length ? `<section class="pg-section"><h2>Helpful guides</h2><ul class="guide-list">${related.map(p => `<li><a href="/blog/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ul></section>` : ''}
    ${finalCta('')}
    <nav class="pg-section nearby" aria-label="Other services">
      <h2>Other services</h2>
      <ul class="chips">${SERVICES.filter(o => o !== s).map(o => `<li><a href="/services/${o.slug}/">${esc(o.name)}</a></li>`).join('')}</ul>
    </nav>
  </div>
</main>
${tail()}`;
}

// ---------- index pages ----------
function areasIndex() {
  const url = ORIGIN + '/areas/';
  const title = 'Areas We Cover | Window Cleaning Near Market Drayton | DEC';
  const description = 'Window cleaning in Market Drayton, Newport, Audlem, Hodnet, Loggerheads, Woore, Hinstock, Cheswardine and nearby villages. Find your area.';
  const schema = [crumbsLd([['Home', '/'], ['Areas we cover', '/areas/']])];
  return `${head({ title, description, url, schema })}
<main id="main" class="pg">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span aria-current="page">Areas</span></nav>
    <div class="eyebrow">Where we work</div>
    <h1>Window cleaning in Market Drayton and the villages around it</h1>
    <p class="lede">We're based in Market Drayton and clean homes across the town and the surrounding villages, including a few just over the borders in Staffordshire and Cheshire. Pick your village to see what we do there.</p>
    ${ctaButtons()}
    <div class="area-cards">
      ${AREAS.map(a => `<a class="area-card" href="/areas/${a.slug}/">
        <h2>${esc(a.name)}</h2>
        <p>${esc(a.lede)}</p>
        ${a.covers && a.covers.length ? `<p class="small">Including ${esc(a.covers.slice(0, 4).join(', '))}</p>` : ''}
        <span class="more">Window cleaning in ${esc(a.name)} →</span>
      </a>`).join('\n      ')}
    </div>
    <p class="small">Not sure if we cover you? Text or WhatsApp your postcode to <a href="tel:${TEL}">${PHONE}</a>, and if you're close by we'll usually say yes.</p>
    ${finalCta('')}
  </div>
</main>
${tail()}`;
}

function servicesIndex() {
  const url = ORIGIN + '/services/';
  const title = 'Window & Exterior Cleaning Services | Market Drayton | DEC';
  const description = 'Pure-water window cleaning, inside window cleaning, conservatory and fascia & soffit cleaning in Market Drayton and nearby villages.';
  const schema = [crumbsLd([['Home', '/'], ['Services', '/services/']])];
  return `${head({ title, description, url, schema })}
<main id="main" class="pg">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span aria-current="page">Services</span></nav>
    <div class="eyebrow">Our services</div>
    <h1>Window &amp; exterior cleaning services</h1>
    <p class="lede">Everything is done with pure water and a water-fed pole, so the glass, frames and sills all come up clean, and nobody leans a ladder on your home.</p>
    ${ctaButtons()}
    <div class="area-cards">
      ${SERVICES.map(s => `<a class="area-card" href="/services/${s.slug}/">
        <h2>${esc(s.name)}</h2>
        <p>${esc(s.lede)}</p>
        <span class="more">More about ${esc(s.name.toLowerCase())} →</span>
      </a>`).join('\n      ')}
      <div class="area-card soon"><h2>Gutter Cleaning</h2><p>Clear gutters and free-flowing downpipes.</p><span class="tag">Coming soon</span></div>
      <div class="area-card soon"><h2>Pressure Washing</h2><p>Driveways, patios and paths.</p><span class="tag">Coming soon</span></div>
    </div>
    ${finalCta('')}
  </div>
</main>
${tail()}`;
}

// ---------- run ----------
module.exports = function buildPages(write) {
  const seen = new Set();
  [...AREAS.map(a => 'areas/' + a.slug), ...SERVICES.map(s => 'services/' + s.slug)].forEach(k => {
    if (!/^[a-z]+\/[a-z0-9-]+$/.test(k)) throw new Error('Bad page address: ' + k);
    if (seen.has(k)) throw new Error('Two pages share the address /' + k + '/');
    seen.add(k);
  });
  fs.rmSync(path.join(SITE, 'areas'), { recursive: true, force: true });
  fs.rmSync(path.join(SITE, 'services'), { recursive: true, force: true });
  write('areas/index.html', areasIndex());
  AREAS.forEach((a, i) => write(`areas/${a.slug}/index.html`, areaPage(a, i)));
  write('services/index.html', servicesIndex());
  SERVICES.forEach((s, i) => write(`services/${s.slug}/index.html`, servicePage(s, i)));
  console.log(`DEC page builder: ${AREAS.length} village page(s), ${SERVICES.length} service page(s)`);
  return [
    ['/services/', UPDATED, 'monthly', '0.8'],
    ...SERVICES.map(s => [`/services/${s.slug}/`, UPDATED, 'monthly', '0.8']),
    ['/areas/', UPDATED, 'monthly', '0.8'],
    ...AREAS.map(a => [`/areas/${a.slug}/`, UPDATED, 'monthly', '0.8'])
  ];
};
