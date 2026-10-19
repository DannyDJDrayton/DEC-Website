/* DEC blog: share buttons */
(function () {
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function track(method, url) {
    if (typeof window.gtag === 'function') window.gtag('event', 'share', { method: method, content_type: 'article', item_id: url });
  }
  document.querySelectorAll('.share').forEach(function (bar) {
    var url = bar.getAttribute('data-url');
    var title = bar.getAttribute('data-title');
    var native = bar.querySelector('.native');
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener('click', function () {
        navigator.share({ title: title, url: url }).then(function () { track('native', url); }).catch(function () {});
      });
    }
    bar.querySelectorAll('a[data-method]').forEach(function (a) {
      a.addEventListener('click', function () { track(a.getAttribute('data-method'), url); });
    });
    var copy = bar.querySelector('.copy');
    if (copy) copy.addEventListener('click', function () {
      var done = function () { toast('Link copied - paste it anywhere'); track('copy', url); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      } else { window.prompt('Copy this link:', url); }
    });
  });
})();
