/* lms.js - dùng chung cho các trang LMS: chủ đề màu, kết nối Supabase, đăng nhập giáo viên.
   Khóa dưới đây là khóa công khai (publishable) của Supabase, được phép nằm trong trang web.
   Dữ liệu được bảo vệ bằng quy tắc trong database, không phải bằng việc giấu khóa này. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://bumaiagvgpewhvczgwio.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_B563fC34wnTDCGSZv29euw_6P3mFRs5';

  /* ---------- Chủ đề màu: một màu gốc sinh ra cả bộ màu ---------- */
  var THEME_KEY = window.LMS_THEME_KEY || 'lms_theme_v2';
  var L = { 50: 97, 100: 94, 200: 89, 300: 78, 400: 66, 500: 54, 600: 24, 700: 16, 800: 12, 900: 8 };

  function hsl2rgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    function f(n) { var k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function toHex(r) { return '#' + r.map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function hexFor(h, s) { return toHex(hsl2rgb(h, s, 54)); }
  function toHS(hx) {
    var r = parseInt(hx.slice(1, 3), 16) / 255, g = parseInt(hx.slice(3, 5), 16) / 255, b = parseInt(hx.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2, h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h = Math.round(h * 60); if (h < 0) h += 360;
    }
    return { h: h, s: Math.round(s * 100) };
  }
  var DEF = hexFor(219, 60);

  function applyTheme(hx) {
    if (!/^#[0-9a-f]{6}$/i.test(hx || '')) hx = DEF;
    var o = toHS(hx), h = o.h, s = Math.max(8, Math.min(78, o.s)), st = document.documentElement.style;
    Object.keys(L).forEach(function (k) { st.setProperty('--sky-' + k, hsl2rgb(h, s, L[k]).join(' ')); });
    function c(sat, l) { return toHex(hsl2rgb(h, sat, l)); }
    st.setProperty('--t-primary', c(s, 16)); st.setProperty('--t-primary-2', c(s, 24)); st.setProperty('--t-accent', c(s, 54));
    st.setProperty('--t-tint', c(s, 94)); st.setProperty('--t-tint-2', c(s, 89)); st.setProperty('--t-soft', c(s, 97));
    st.setProperty('--t-border', c(s * 0.5, 92)); st.setProperty('--t-line', c(s * 0.4, 84)); st.setProperty('--t-muted', c(s * 0.3, 45));
    st.setProperty('--t-ink', c(s * 0.7, 14)); st.setProperty('--page-bg', c(Math.min(s, 65) * 0.95, 93));
  }
  function getTheme() { try { return localStorage.getItem(THEME_KEY) || DEF; } catch (e) { return DEF; } }
  function saveTheme(x) { try { localStorage.setItem(THEME_KEY, x); } catch (e) { /* bỏ qua */ } }
  applyTheme(getTheme());

  /* ---------- Tiện ích ---------- */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('lms-toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'lms-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  /* ---------- Hộp thoại xác nhận / thông báo (thay confirm, alert của trình duyệt) ---------- */
  function ask(msg, opt) {
    opt = opt || {};
    return new Promise(function (resolve) {
      if (!document.getElementById('lms-cf-css')) {
        var st = document.createElement('style'); st.id = 'lms-cf-css';
        st.textContent = '#lms-cf{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.45)}' +
          '#lms-cf .cf-card{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:22px 22px 18px}' +
          '#lms-cf .cf-msg{white-space:pre-line;overflow-wrap:anywhere;font-size:1rem;line-height:1.5;color:#0f172a}' +
          '#lms-cf .cf-acts{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}' +
          '#lms-cf button{min-height:44px;padding:0 20px;border-radius:9999px;font-weight:700;font-size:.9375rem;cursor:pointer}' +
          '#lms-cf .cf-no{border:1px solid var(--t-tint-2,#cbd5e1);background:#fff;color:var(--t-primary,#0f172a)}' +
          '#lms-cf .cf-ok{border:0;background:var(--t-primary,#0f172a);color:#fff}' +
          '#lms-cf .cf-ok.danger{background:#be123c}';
        document.head.appendChild(st);
      }
      var prev = document.activeElement;
      var o = document.createElement('div'); o.id = 'lms-cf'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-modal', 'true');
      var c = document.createElement('div'); c.className = 'cf-card';
      var m = document.createElement('div'); m.className = 'cf-msg'; m.textContent = msg;
      var a = document.createElement('div'); a.className = 'cf-acts';
      var no = document.createElement('button'); no.type = 'button'; no.className = 'cf-no'; no.textContent = opt.cancel || 'Hủy';
      var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'cf-ok' + (opt.danger ? ' danger' : ''); ok.textContent = opt.ok || 'Đồng ý';
      if (!opt.alertOnly) a.appendChild(no); a.appendChild(ok);
      c.appendChild(m); c.appendChild(a); o.appendChild(c); document.body.appendChild(o);
      function done(v) { document.removeEventListener('keydown', key, true); o.remove(); if (prev && prev.focus) { try { prev.focus(); } catch (e) {} } resolve(v); }
      function key(e) { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); done(false); } }
      document.addEventListener('keydown', key, true);
      ok.addEventListener('click', function () { done(true); });
      no.addEventListener('click', function () { done(false); });
      o.addEventListener('click', function (e) { if (e.target === o) done(false); });
      ok.focus();
    });
  }
  function confirmBox(msg, opt) { return ask(msg, opt); }
  function alertBox(msg) { return ask(msg, { alertOnly: true, ok: 'Đã hiểu' }); }
  function friendlyError(e) {
    var m = (e && (e.message || e.error_description)) || String(e || '');
    if (/invalid login credentials/i.test(m)) return 'Email hoặc mật khẩu chưa đúng.';
    if (/rate limit|too many requests|only request this after/i.test(m)) return 'Gửi quá nhiều lần. Chờ vài phút rồi thử lại.';
    if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Không kết nối được. Kiểm tra mạng rồi thử lại.';
    return m || 'Có lỗi xảy ra.';
  }

  /* ---------- Supabase ---------- */
  var _client = null;
  function client() {
    if (_client) return _client;
    if (!window.supabase || !window.supabase.createClient) return null;
    var fromEmailLink = /[#&?](access_token|code|error_description)=/.test(location.href);
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: fromEmailLink }
    });
    _client.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') showNewPassword(_client); });
    return _client;
  }

  function isTeacher(c) {
    return c.rpc('is_teacher').then(function (r) { return r.data === true; }, function () { return false; });
  }

  function showLogin(c, firstMessage) {
    return new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.id = 'lms-login'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Đăng nhập giáo viên');
      ov.innerHTML =
        '<form class="lg-card" novalidate>' +
          '<div class="lg-brand"><span>' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>' +
          '</span>gblearning</div>' +
          '<h1>Đăng nhập giáo viên</h1>' +
          '<p>Chỉ giáo viên mới xem và sửa được danh sách học viên.</p>' +
          '<label for="lg-email">Email</label>' +
          '<input id="lg-email" type="email" autocomplete="username" inputmode="email" required>' +
          '<label for="lg-pass">Mật khẩu</label>' +
          '<input id="lg-pass" type="password" autocomplete="current-password" required>' +
          '<div class="lg-error" role="alert"></div>' +
          '<button type="submit" class="lg-btn">Đăng nhập</button>' +
          '<button type="button" class="lg-link">Quên mật khẩu?</button>' +
          '<div class="lg-ok" role="status"></div>' +
        '</form>';
      document.body.appendChild(ov);
      var form = ov.querySelector('form'), err = ov.querySelector('.lg-error'), btn = ov.querySelector('.lg-btn');
      if (firstMessage) err.textContent = firstMessage;
      setTimeout(function () { var e = document.getElementById('lg-email'); if (e) e.focus(); }, 30);
      var okMsg = ov.querySelector('.lg-ok');
      ov.querySelector('.lg-link').addEventListener('click', function () {
        var email = document.getElementById('lg-email').value.trim();
        err.textContent = ''; okMsg.textContent = '';
        if (!email) { err.textContent = 'Nhập email vào ô Email trước, rồi bấm Quên mật khẩu.'; return; }
        c.auth.resetPasswordForEmail(email, { redirectTo: new URL('index.html', location.href).href }).then(function (res) {
          if (res.error) throw res.error;
          okMsg.textContent = 'Nếu email này đúng tài khoản giáo viên, link đặt lại mật khẩu đã được gửi. Kiểm tra hộp thư (cả thư rác).';
        }).catch(function (e) { err.textContent = friendlyError(e); });
      });
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var email = document.getElementById('lg-email').value.trim(), pass = document.getElementById('lg-pass').value;
        if (!email || !pass) { err.textContent = 'Nhập email và mật khẩu.'; return; }
        btn.disabled = true; btn.textContent = 'Đang đăng nhập...'; err.textContent = '';
        c.auth.signInWithPassword({ email: email, password: pass }).then(function (res) {
          if (res.error) throw res.error;
          return isTeacher(c).then(function (ok) {
            if (!ok) {
              return c.auth.signOut().then(function () { throw new Error('Tài khoản này chưa được cấp quyền giáo viên.'); });
            }
            ov.remove();
            resolve({ client: c, session: res.data.session });
          });
        }).catch(function (e) {
          err.textContent = friendlyError(e);
          btn.disabled = false; btn.textContent = 'Đăng nhập';
        });
      });
    });
  }

  function showNewPassword(c) {
    if (document.getElementById('lms-newpass')) return;
    var ov = document.createElement('div');
    ov.id = 'lms-newpass'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Đặt mật khẩu mới');
    ov.innerHTML =
      '<form class="lg-card" novalidate>' +
        '<h1>Đặt mật khẩu mới</h1>' +
        '<p>Nhập mật khẩu mới cho tài khoản giáo viên (ít nhất 8 ký tự).</p>' +
        '<label for="np-1">Mật khẩu mới</label>' +
        '<input id="np-1" type="password" autocomplete="new-password" required>' +
        '<label for="np-2">Nhập lại mật khẩu</label>' +
        '<input id="np-2" type="password" autocomplete="new-password" required>' +
        '<div class="lg-error" role="alert"></div>' +
        '<button type="submit" class="lg-btn">Lưu mật khẩu</button>' +
      '</form>';
    document.body.appendChild(ov);
    var form = ov.querySelector('form'), err = ov.querySelector('.lg-error'), btn = ov.querySelector('.lg-btn');
    setTimeout(function () { var e = document.getElementById('np-1'); if (e) e.focus(); }, 30);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = document.getElementById('np-1').value, b = document.getElementById('np-2').value;
      if (a.length < 8) { err.textContent = 'Mật khẩu cần ít nhất 8 ký tự.'; return; }
      if (a !== b) { err.textContent = 'Hai mật khẩu chưa giống nhau.'; return; }
      btn.disabled = true; btn.textContent = 'Đang lưu...'; err.textContent = '';
      c.auth.updateUser({ password: a }).then(function (res) {
        if (res.error) throw res.error;
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* bỏ qua */ }
        location.reload();
      }).catch(function (e) { err.textContent = friendlyError(e); btn.disabled = false; btn.textContent = 'Lưu mật khẩu'; });
    });
  }

  function requireTeacher() {
    var c = client();
    if (!c) return Promise.reject(new Error('Không tải được thư viện kết nối. Kiểm tra mạng rồi tải lại trang.'));
    return c.auth.getSession().then(function (r) {
      var session = r.data && r.data.session;
      if (!session) return showLogin(c);
      return isTeacher(c).then(function (ok) {
        if (ok) return { client: c, session: session };
        return showLogin(c, 'Phiên đăng nhập đã hết hạn hoặc tài khoản chưa có quyền giáo viên. Đăng nhập lại.');
      });
    });
  }

  function signOut() {
    var c = client();
    var done = function () { location.reload(); };
    if (!c) return done();
    return c.auth.signOut().then(done, done);
  }

  /* ---------- Hộp chọn màu chủ đề ---------- */
  function initThemePopover() {
    var btn = document.getElementById('btn-theme');
    if (!btn) return;
    var PRESETS = [['Xanh navy (mặc định)', 219, 60], ['Xanh ngọc', 183, 60], ['Xanh rêu', 146, 38], ['Tím', 262, 52],
                   ['Hồng', 335, 58], ['Cam san hô', 14, 72], ['Hổ phách', 38, 80], ['Xám than', 215, 10]]
      .map(function (p) { return { name: p[0], hex: hexFor(p[1], p[2]) }; });
    var pop = document.createElement('div');
    pop.id = 'theme-pop'; pop.hidden = true;
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Tùy chỉnh màu chủ đề');
    pop.innerHTML = '<div class="tp-title">Màu chủ đề</div><div class="tp-note">Cả trang đổi theo màu bạn chọn.</div><div class="tp-grid"></div>' +
      '<label class="tp-custom"><span>Màu tùy chọn</span><input type="color" id="tp-input" aria-label="Chọn màu chủ đề tùy ý"></label>' +
      '<button type="button" class="tp-reset">Về mặc định</button>' +
      '<button type="button" class="tp-logout">Đăng xuất</button>';
    document.body.appendChild(pop);
    var grid = pop.querySelector('.tp-grid'), input = pop.querySelector('#tp-input');
    PRESETS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tp-sw'; b.dataset.c = c.hex; b.setAttribute('aria-label', c.name);
      b.innerHTML = '<span style="background:' + c.hex + '"></span>';
      b.addEventListener('click', function () { choose(c.hex); });
      grid.appendChild(b);
    });
    function mark(c) {
      grid.querySelectorAll('.tp-sw').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.c.toLowerCase() === c.toLowerCase() ? 'true' : 'false'); });
      input.value = /^#[0-9a-f]{6}$/i.test(c) ? c : DEF;
    }
    function choose(c) { applyTheme(c); saveTheme(c); mark(c); }
    input.addEventListener('input', function () { choose(input.value); });
    pop.querySelector('.tp-reset').addEventListener('click', function () { choose(DEF); });
    pop.querySelector('.tp-logout').addEventListener('click', signOut);
    function place() {
      var r = btn.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
      pop.style.top = (r.bottom + 8) + 'px';
      pop.style.left = Math.min(Math.max(12, r.right - w), window.innerWidth - w - 12) + 'px';
    }
    function open() { mark(getTheme()); pop.hidden = false; place(); btn.setAttribute('aria-expanded', 'true'); }
    function close() { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function () { pop.hidden ? open() : close(); });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { close(); btn.focus(); } });
    window.addEventListener('resize', function () { if (!pop.hidden) place(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initThemePopover);
  else initThemePopover();

  window.LMS = {
    client: client, requireTeacher: requireTeacher, signOut: signOut,
    esc: esc, toast: toast, friendlyError: friendlyError, confirm: confirmBox, alert: alertBox,
    theme: { apply: applyTheme, get: getTheme, DEF: DEF }
  };
})();
