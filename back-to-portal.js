/* back-to-portal.js - gắn nút "Về trang học viên" vào header của mọi trang bài học / bài tập.
   Cách dùng: thêm <script src="đường-dẫn-tương-đối/back-to-portal.js"></script> cuối <body>.
   Mã học viên lấy từ ?s=mã (hoặc #mã). Không có mã thì không hiện nút. Nút trỏ về student.html cùng thư mục với file này. */
(function () {
  'use strict';
  var sc = document.currentScript; if (!sc) return;
  var base = new URL('.', sc.src).href;
  var code = new URLSearchParams(location.search).get('s') || decodeURIComponent((location.hash || '').slice(1)).split('/')[0];
  if (!code) return;
  var href = base + 'student.html#' + encodeURIComponent(code);
  function make() {
    var a = document.createElement('a');
    a.className = 'gb-back'; a.href = href; a.title = 'Về trang học viên'; a.setAttribute('aria-label', 'Về trang học viên');
    a.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;flex:none;border-radius:12px;color:#1B1D22;text-decoration:none;-webkit-tap-highlight-color:transparent';
    a.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>';
    return a;
  }
  function ensure() {
    var h = document.querySelector('header'); if (!h) return null;
    if (!h.querySelector('.gb-back')) h.insertBefore(make(), h.firstChild);
    return h;
  }
  function start() {
    var h = ensure(); if (!h || !window.MutationObserver) return;
    new MutationObserver(function () { if (!h.querySelector('.gb-back')) h.insertBefore(make(), h.firstChild); }).observe(h, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
