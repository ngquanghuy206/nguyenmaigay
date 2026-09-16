/**
 * auth.js
 * Validation form, toast, đồng hồ.
 * Dùng chung cho login.html và register.html
 */

// ===== CLOCK =====
function startClock(elId) {
  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const days = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
    const el = document.getElementById(elId);
    if (el) el.textContent =
      days[now.getDay()] + ' ' +
      pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/' + now.getFullYear() +
      ' — ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  }
  tick();
  setInterval(tick, 1000);
}

// ===== TOAST =====
const TOAST_ICONS = {
  ok:  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>',
  err: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
};
function showToast(msg, type = 'ok') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = (TOAST_ICONS[type] || '') + msg;
  toast.className = 'show toast-' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = ''; }, 2800);
}

// ===== PASSWORD TOGGLE =====
function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input && input.tagName === 'INPUT') {
        input.type = input.type === 'password' ? 'text' : 'password';
        const eyeOn  = btn.querySelector('.ico-eye');
        const eyeOff = btn.querySelector('.ico-eye-off');
        if (eyeOn)  eyeOn.style.display  = input.type === 'password' ? '' : 'none';
        if (eyeOff) eyeOff.style.display = input.type === 'password' ? 'none' : '';
      }
    });
  });
}

// ===== VALIDATION HELPERS =====
function validateEmail(email) {
  // RFC-style email check
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

function validateUsername(username) {
  // 3-30 ký tự, chữ/số/dấu gạch dưới/gạch ngang
  return /^[a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF ]{3,30}$/.test(username.trim());
}

function validatePassword(pw) {
  return pw.length >= 6;
}

// Show/hide field message
function setFieldState(inputEl, msgEl, type, html) {
  inputEl.className = type === 'err' ? 'error' : type === 'ok' ? 'success' : '';
  if (msgEl) {
    msgEl.innerHTML = html || '';
    msgEl.className = 'field-msg ' + (type || '');
  }
}

// ===== REGISTER FORM =====
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const usernameIn = document.getElementById('regUsername');
  const emailIn    = document.getElementById('regEmail');
  const pwIn       = document.getElementById('regPassword');
  const pw2In      = document.getElementById('regPassword2');
  const submitBtn  = document.getElementById('regSubmit');

  // Live validation
  const SVG_OK  = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg>';
  const SVG_ERR = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  usernameIn.addEventListener('input', () => {
    const ok = validateUsername(usernameIn.value);
    setFieldState(usernameIn, document.getElementById('msgUsername'),
      ok ? 'ok' : 'err',
      ok ? SVG_OK + 'Tên hợp lệ' : SVG_ERR + 'Tên 3–30 ký tự, không ký tự đặc biệt');
  });

  emailIn.addEventListener('input', () => {
    const ok = validateEmail(emailIn.value);
    setFieldState(emailIn, document.getElementById('msgEmail'),
      ok ? 'ok' : 'err',
      ok ? SVG_OK + 'Email hợp lệ' : SVG_ERR + 'Email không đúng định dạng');
  });

  pwIn.addEventListener('input', () => {
    const ok = validatePassword(pwIn.value);
    setFieldState(pwIn, document.getElementById('msgPassword'),
      ok ? 'ok' : 'err',
      ok ? SVG_OK + 'Mật khẩu đủ mạnh' : SVG_ERR + 'Tối thiểu 6 ký tự');
    if (pw2In.value) {
      const match = pw2In.value === pwIn.value;
      setFieldState(pw2In, document.getElementById('msgPassword2'),
        match ? 'ok' : 'err',
        match ? SVG_OK + 'Khớp' : SVG_ERR + 'Mật khẩu không khớp');
    }
  });

  pw2In.addEventListener('input', () => {
    const match = pw2In.value === pwIn.value;
    setFieldState(pw2In, document.getElementById('msgPassword2'),
      pw2In.value ? (match ? 'ok' : 'err') : '',
      pw2In.value ? (match ? SVG_OK + 'Khớp' : SVG_ERR + 'Mật khẩu không khớp') : '');
  });

  // Submit
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const username = usernameIn.value.trim();
    const email    = emailIn.value.trim();
    const pw       = pwIn.value;
    const pw2      = pw2In.value;

    if (!validateUsername(username)) { showToast('Tên tài khoản không hợp lệ', 'err'); return; }
    if (!validateEmail(email))       { showToast('Email không hợp lệ', 'err'); return; }
    if (!validatePassword(pw))       { showToast('Mật khẩu tối thiểu 6 ký tự', 'err'); return; }
    if (pw !== pw2)                  { showToast('Mật khẩu nhập lại không khớp', 'err'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang đăng ký...';

    const result = await Storage.register({ username, email, password: pw });

    if (result.ok) {
      showToast('Đăng ký thành công! Đang chuyển hướng...', 'ok');
      setTimeout(() => window.location.href = 'login.html', 1400);
    } else {
      showToast(result.msg, 'err');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng ký';
    }
  });

  // OAuth buttons
  document.getElementById('btnGoogle')?.addEventListener('click', () => oauthFlow('google'));
  document.getElementById('btnFacebook')?.addEventListener('click', () => oauthFlow('facebook'));
}

// ===== LOGIN FORM =====
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const submitBtn = document.getElementById('loginSubmit');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) { showToast('Vui lòng nhập đủ thông tin', 'err'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang đăng nhập...';

    const result = await Storage.login({ email, password });

    if (result.ok) {
      showToast('Đăng nhập thành công!', 'ok');
      setTimeout(() => window.location.href = 'index.html', 900);
    } else {
      showToast(result.msg, 'err');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng nhập';
    }
  });

  document.getElementById('btnGoogle')?.addEventListener('click', () => oauthFlow('google'));
  document.getElementById('btnFacebook')?.addEventListener('click', () => oauthFlow('facebook'));
}

// ===== OAUTH FLOW =====
async function oauthFlow(provider) {
  showToast(`Đang kết nối ${provider === 'google' ? 'Google' : 'Facebook'}...`, 'ok');
  // Simulate network delay
  await new Promise(r => setTimeout(r, 900));
  const result = await Storage.oauthLogin(provider);
  if (result.ok) {
    showToast('Đăng nhập thành công!', 'ok');
    setTimeout(() => window.location.href = 'index.html', 800);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initRegisterForm();
  initLoginForm();
  if (document.getElementById('clock')) startClock('clock');
});
