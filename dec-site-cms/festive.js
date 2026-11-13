/* =========================================================
   DEC festive touches — banner, fairy lights and light snow
   ---------------------------------------------------------
   Switches itself ON from 15 November and OFF after 6 January,
   so nothing needs removing after Christmas.

   To turn it off early: change FESTIVE_ENABLED to false.
   To preview it out of season: add ?festive=1 to any page URL.
   ========================================================= */
(function () {
  var FESTIVE_ENABLED = true;

  var BANNER_TEXT = 'Christmas is coming! Get your windows gleaming before the family arrives.';
  var BANNER_LINK_TEXT = 'Get my price';
  var BANNER_LINK = '/#calculator';

  // ---- Is it the festive season? (15 Nov – 6 Jan) ----
  function inSeason() {
    var d = new Date(), m = d.getMonth(), day = d.getDate(); // m: 0 = Jan
    return (m === 10 && day >= 15) || m === 11 || (m === 0 && day <= 6);
  }
  var forced = /[?&]festive=1\b/.test(location.search);
  if (!FESTIVE_ENABLED || (!inSeason() && !forced)) return;
  if (/^\/admin/.test(location.pathname)) return;

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  var motionOK = true;
  try { motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var css = '' +
    /* Banner */
    '.dec-xmas-bar{position:relative;z-index:60;background:#1E2328;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:.9rem;line-height:1.4;}' +
    '.dec-xmas-bar .in{max-width:1160px;margin:0 auto;padding:10px 52px 10px 20px;display:flex;align-items:center;justify-content:center;gap:10px 16px;flex-wrap:wrap;text-align:center;}' +
    '.dec-xmas-bar .star{color:#72B600;font-size:1.05rem;}' +
    '.dec-xmas-bar a.go{color:#1E2328;background:#72B600;font-weight:700;padding:5px 14px;border-radius:999px;white-space:nowrap;text-decoration:none;}' +
    '.dec-xmas-bar a.go:hover{background:#8ad10a;}' +
    '.dec-xmas-bar button{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:#fff;opacity:.7;font-size:1.3rem;line-height:1;cursor:pointer;}' +
    '.dec-xmas-bar button:hover,.dec-xmas-bar button:focus-visible{opacity:1;background:rgba(255,255,255,.12);}' +
    /* Fairy lights under the header */
    '.dec-lights{position:absolute;left:0;right:0;bottom:-11px;height:14px;pointer-events:none;overflow:hidden;z-index:1;' +
      'background:radial-gradient(ellipse 60% 14px at 50% -6px,transparent 70%,rgba(30,35,40,.35) 72%,transparent 76%) 0 0/44px 14px repeat-x;}' +
    '.dec-lights i{position:absolute;top:3px;width:7px;height:10px;border-radius:50% 50% 50% 50%/40% 40% 60% 60%;}' +
    '.dec-lights i::before{content:"";position:absolute;top:-2px;left:1.5px;width:4px;height:3px;background:#6B6F76;border-radius:1px;}' +
    '.dec-lights i.c0{background:#72B600;box-shadow:0 2px 8px #72B600;}' +
    '.dec-lights i.c1{background:#E63946;box-shadow:0 2px 8px #E63946;}' +
    '.dec-lights i.c2{background:#FFC93C;box-shadow:0 2px 8px #FFC93C;}' +
    '.dec-lights i.c3{background:#4CC9F0;box-shadow:0 2px 8px #4CC9F0;}' +
    '@keyframes decTwinkle{0%,100%{opacity:1}50%{opacity:.35}}' +
    '.dec-motion .dec-lights i{animation:decTwinkle 2.4s ease-in-out infinite;}' +
    /* Snow */
    '.dec-snow{position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden;}' +
    '.dec-snow span{position:absolute;top:-12px;border-radius:50%;background:#C9D6E3;box-shadow:0 0 3px rgba(120,140,160,.5);opacity:.75;animation:decFall linear infinite;}' +
    '@keyframes decFall{0%{transform:translate3d(0,-12px,0)}100%{transform:translate3d(var(--drift),105vh,0)}}' +
    '@media print{.dec-xmas-bar,.dec-lights,.dec-snow{display:none!important;}}';

  function init() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    if (motionOK) document.documentElement.classList.add('dec-motion');

    var header = document.querySelector('header');

    // ---- Banner (visitors can close it; stays closed for the season) ----
    var seasonKey = 'dec-xmas-closed-' + (new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear());
    if (store(seasonKey) !== '1') {
      var bar = document.createElement('div');
      bar.className = 'dec-xmas-bar';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Christmas notice');
      bar.innerHTML = '<div class="in"><span><span class="star" aria-hidden="true">&#9733;</span> ' + BANNER_TEXT + '</span>' +
        '<a class="go" href="' + BANNER_LINK + '">' + BANNER_LINK_TEXT + ' &rarr;</a></div>' +
        '<button type="button" aria-label="Close Christmas notice">&times;</button>';
      bar.querySelector('button').addEventListener('click', function () {
        bar.parentNode.removeChild(bar);
        store(seasonKey, '1');
      });
      if (header && header.parentNode) header.parentNode.insertBefore(bar, header);
      else document.body.insertBefore(bar, document.body.firstChild);
    }

    // ---- Fairy lights along the bottom of the header ----
    if (header) {
      if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
      var lights = document.createElement('div');
      lights.className = 'dec-lights';
      lights.setAttribute('aria-hidden', 'true');
      var html = '', n = Math.ceil((window.innerWidth || 1200) / 44) + 1;
      for (var i = 0; i < n; i++) {
        html += '<i class="c' + (i % 4) + '" style="left:' + (i * 44 + 18) + 'px;animation-delay:' + ((i % 5) * 0.45).toFixed(2) + 's"></i>';
      }
      lights.innerHTML = html;
      header.appendChild(lights);
    }

    // ---- Light snowfall (skipped for visitors who prefer less motion) ----
    if (motionOK) {
      var snow = document.createElement('div');
      snow.className = 'dec-snow';
      snow.setAttribute('aria-hidden', 'true');
      var count = (window.innerWidth || 1200) < 640 ? 12 : 22, flakes = '';
      for (var j = 0; j < count; j++) {
        var size = (Math.random() * 4 + 3).toFixed(1);
        flakes += '<span style="left:' + (Math.random() * 100).toFixed(1) + '%;width:' + size + 'px;height:' + size + 'px;' +
          '--drift:' + (Math.random() * 80 - 40).toFixed(0) + 'px;' +
          'animation-duration:' + (Math.random() * 10 + 12).toFixed(1) + 's;' +
          'animation-delay:-' + (Math.random() * 20).toFixed(1) + 's"></span>';
      }
      snow.innerHTML = flakes;
      document.body.appendChild(snow);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
