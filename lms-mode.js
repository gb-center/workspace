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
