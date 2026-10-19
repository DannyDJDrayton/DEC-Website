/* DEC cookie consent + Google Analytics loader
   - Google Analytics only loads AFTER the visitor clicks "Accept".
   - Choice is remembered on this device for 6 months.
   - Any link with data-cookie-settings reopens the banner.
*/
(function () {
  var GA_ID = 'G-PENXMTE224';
  var KEY = 'dec-cookie-choice';
  var MAX_AGE_DAYS = 182;

  // Safe stub so calculator events never error; queued until GA loads.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function readChoice() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (Date.now() - c.t > MAX_AGE_DAYS * 864e5) return null;
      return c.v;
    } catch (e) { return null; }
  }
  function saveChoice(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    gtag('js', new Date());
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function clearGACookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') === 0) {
        var host = location.hostname.replace(/^www\./, '');
        ['', '; domain=.' + host, '; domain=' + host].forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + d;
        });
      }
    });
  }

  function injectStyles() {
    if (document.getElementById('dec-cc-style')) return;
    var css =
      '#dec-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:1000;max-width:560px;margin:0 auto;background:#14171A;color:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 18px 40px rgba(0,0,0,.25);font-family:Inter,system-ui,sans-serif;font-size:.92rem;line-height:1.5}' +
      '#dec-cc p{margin:0 0 14px}' +
      '#dec-cc a{color:#9BE08F;text-decoration:underline}' +
      '#dec-cc .dec-cc-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '#dec-cc button{flex:1 1 140px;min-height:44px;border-radius:8px;font:700 .92rem Inter,system-ui,sans-serif;cursor:pointer;border:2px solid #fff;background:#fff;color:#14171A}' +
      '#dec-cc button:focus-visible{outline:3px solid #9BE08F;outline-offset:2px}';
    var st = document.createElement('style');
    st.id = 'dec-cc-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function showBanner() {
    if (document.getElementById('dec-cc')) return;
    injectStyles();
    var box = document.createElement('div');
    box.id = 'dec-cc';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choices');
    box.innerHTML =
      '<p>We’d like to use Google Analytics cookies to see how people use this site so we can improve it. ' +
      'They’re only set if you say yes. <a href="/privacy">Privacy &amp; cookies</a></p>' +
      '<div class="dec-cc-btns">' +
      '<button type="button" data-choice="accept">Accept analytics</button>' +
      '<button type="button" data-choice="reject">Reject</button>' +
      '</div>';
    box.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute('data-choice');
      if (!v) return;
      var previous = readChoice();
      saveChoice(v);
      box.remove();
      if (v === 'accept') {
        loadGA();
      } else {
        clearGACookies();
        if (previous === 'accept' && loaded) location.reload(); // stop GA already running
      }
    });
    document.body.appendChild(box);
  }

  function init() {
    var c = readChoice();
    if (c === 'accept') loadGA();
    else if (c === null) showBanner();
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); showBanner(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
