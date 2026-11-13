/* Chế độ sáng / tối: nhớ lựa chọn gần nhất trên từng thiết bị */
(function () {
  var K = 'gb-mode', d = document.documentElement;
  function get() { try { return localStorage.getItem(K); } catch (e) { return null; } }
  function put(m) { try { localStorage.setItem(K, m); } catch (e) { } }
  if (get() === 'dark') d.setAttribute('data-mode', 'dark');
  var EX = 'contrast(1.1628) hue-rotate(180deg) invert(1)';
  var css = 'html[data-mode="dark"]{filter:invert(1) hue-rotate(180deg) contrast(.86);background:#fff;color-scheme:light}' +
    'html[data-mode="dark"] img[src*="logo"]{filter:none}' +
    'html[data-mode="dark"] video,html[data-mode="dark"] canvas{filter:' + EX + '}' +
    'html[data-mode="dark"] .t-daybar,html[data-mode="dark"] .g-hero,html[data-mode="dark"] .week-calendar-day.selected{filter:' + EX + '}' +
    'html[data-mode="dark"] .student-main .card.t-daybar{border-color:transparent!important}@media(min-width:781px){html[data-mode="dark"] .student-welcome{filter:' + EX + '}}@media(max-width:780px){html[data-mode="dark"] .student-sidebar{filter:' + EX + '}}' +
    '@media(min-width:641px){html[data-mode="dark"] body>header.has-week,html[data-mode="dark"] body>header.page-title-header{filter:' + EX + '}}' +
    '@media(max-width:640px){html[data-mode="dark"] body>#lms-nav{filter:' + EX + '}}' +
    '#btn-mode{display:inline-flex;align-items:center;justify-content:center;cursor:pointer}#btn-mode svg{width:20px;height:20px}';
  var st = document.createElement('style'); st.id = 'lms-mode-css'; st.textContent = css; (document.head || d).appendChild(st);
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function paint(b) { var dark = d.getAttribute('data-mode') === 'dark'; b.innerHTML = dark ? SUN : MOON; b.setAttribute('aria-label', dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'); b.title = b.getAttribute('aria-label'); }
  function init() {
    if (document.getElementById('btn-mode')) return;
    var box = document.querySelector('header .header-tools, header .page-header-actions'); if (!box) return;
    var b = document.createElement('button'); b.id = 'btn-mode'; b.type = 'button'; b.className = 'icon-btn';
    paint(b);
    b.addEventListener('click', function () { var next = d.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'; if (next === 'dark') d.setAttribute('data-mode', 'dark'); else d.removeAttribute('data-mode'); put(next); paint(b); });
    var ref = document.getElementById('btn-theme') || document.getElementById('btn-logout');
    if (ref && ref.parentNode === box) box.insertBefore(b, ref); else box.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('load', init);
})();

/* Tìm kiếm trên mobile: cùng một popup cho mọi trang + chấm báo đang lọc */
(function () {
  var mq = window.matchMedia('(max-width:640px)'), pop, moved = [];
  var LIB = ['lib-search', 'lib-class', 'lib-kind', 'lib-skill', 'lib-week-scope'];
  function els(t) {
    if (t.id === 'lib-filter-toggle') return LIB.map(function (i) { return document.getElementById(i); }).filter(Boolean);
    if (!t.__els) t.__els = [].slice.call((t.parentElement || document).querySelectorAll(':scope>.m-fold'));
    return t.__els;
  }
  function own(t) { return !!t.closest('#m-weekbar') || !!t.closest('.classes-head'); }
  function ensure() {
    if (pop) return pop;
    pop = document.createElement('div'); pop.id = 'g-pop'; pop.hidden = true;
    pop.innerHTML = '<div class="m-pop-card"><b></b><div class="m-pop-body"></div><button type="button" class="m-pop-ok">Xong</button></div>';
    document.body.appendChild(pop);
    pop.addEventListener('click', function (e) { if (e.target === pop || e.target.classList.contains('m-pop-ok')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) close(); });
    return pop;
  }
  function open(t) {
    var p = ensure(), body = p.querySelector('.m-pop-body'), list = els(t);
    p.querySelector('b').textContent = t.id === 'lib-filter-toggle' ? 'Tìm học liệu' : ((list[0] && list[0].getAttribute('aria-label')) || 'Tìm kiếm');
    list.forEach(function (e) { moved.push({ e: e, p: e.parentNode, n: e.nextSibling }); body.appendChild(e); });
    p.hidden = false;
    var q = body.querySelector('input'); if (q) setTimeout(function () { q.focus(); }, 50);
  }
  function close() {
    if (!pop || pop.hidden) return;
    while (moved.length) { var m = moved.pop(); if (m.n && m.n.parentNode === m.p) m.p.insertBefore(m.e, m.n); else m.p.appendChild(m.e); }
    pop.hidden = true; dots();
  }
  function active(list) {
    return list.some(function (e) {
      if (e.id === 'sort' || e.id === 'lib-week-scope') return false;
      if (e.tagName === 'SELECT') return e.selectedIndex > 0;
      return (e.value || '').trim() !== '';
    });
  }
  function dots() {
    [].slice.call(document.querySelectorAll('.m-fold-toggle,#lib-filter-toggle')).forEach(function (t) {
      if (active(els(t))) t.setAttribute('data-on', '1'); else t.removeAttribute('data-on');
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.m-fold-toggle,#lib-filter-toggle');
    if (!t || !mq.matches || own(t)) return;
    e.stopImmediatePropagation(); e.preventDefault(); open(t);
  }, true);
  ['input', 'change'].forEach(function (n) { document.addEventListener(n, dots, true); });
  window.addEventListener('load', function () { setTimeout(dots, 300); });
  document.addEventListener('DOMContentLoaded', function () { setTimeout(dots, 300); });
})();
