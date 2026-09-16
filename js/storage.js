/**
 * storage.js
 * Quản lý dữ liệu người dùng với localStorage.
 * Password được hash bằng SHA-256 (không thể đọc ngược).
 */

const Storage = (() => {
  const USERS_KEY = 'nkhn_users_v1';
  const SESSION_KEY = 'nkhn_session_v1';

  // ---- SHA-256 hash (Web Crypto API) ----
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '__nkhn_salt_2026__');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ---- Đọc/ghi users ----
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ---- Đăng ký ----
  async function register({ username, email, password }) {
    const users = getUsers();

    // check trùng
    const emailLower = email.toLowerCase().trim();
    const usernameLower = username.toLowerCase().trim();

    for (const u of Object.values(users)) {
      if (u.email === emailLower) return { ok: false, msg: 'Email này đã được đăng ký.' };
      if (u.username.toLowerCase() === usernameLower) return { ok: false, msg: 'Tên tài khoản đã tồn tại.' };
    }

    const hash = await hashPassword(password);
    const uid = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    users[uid] = {
      uid,
      username: username.trim(),
      email: emailLower,
      passwordHash: hash,
      provider: 'local',
      createdAt: Date.now()
    };
    saveUsers(users);
    return { ok: true };
  }

  // ---- Đăng nhập ----
  async function login({ email, password }) {
    const users = getUsers();
    const emailLower = email.toLowerCase().trim();
    const hash = await hashPassword(password);

    const user = Object.values(users).find(
      u => u.email === emailLower && u.passwordHash === hash && u.provider === 'local'
    );
    if (!user) return { ok: false, msg: 'Email hoặc mật khẩu không đúng.' };

    setSession(user);
    return { ok: true, user };
  }

  // ---- OAuth mock (Google / Facebook) ----
  // Trong môi trường thực sẽ dùng Firebase/Supabase OAuth redirect
  // Ở đây simulate: tạo tài khoản từ thông tin mock rồi đăng nhập
  function oauthLogin(provider) {
    return new Promise((resolve) => {
      // Giả lập popup OAuth
      const mockUser = {
        google: {
          uid: 'google_demo_001',
          username: 'Google User',
          email: 'demo.google@gmail.com',
          provider: 'google'
        },
        facebook: {
          uid: 'facebook_demo_001',
          username: 'Facebook User',
          email: 'demo.facebook@fb.com',
          provider: 'facebook'
        }
      };

      const data = mockUser[provider];
      const users = getUsers();

      // Upsert user
      if (!users[data.uid]) {
        users[data.uid] = { ...data, createdAt: Date.now() };
        saveUsers(users);
      }

      setSession(users[data.uid]);
      resolve({ ok: true, user: users[data.uid] });
    });
  }

  // ---- Session ----
  function setSession(user) {
    // Lưu session không có password hash
    const safe = { uid: user.uid, username: user.username, email: user.email, provider: user.provider };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(safe));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch { return null; }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ---- Guard: redirect nếu chưa đăng nhập ----
  function requireAuth(redirectTo = 'login.html') {
    const user = getSession();
    if (!user) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  }

  // ---- Guard: redirect nếu đã đăng nhập (dùng cho trang login/register) ----
  function redirectIfAuth(redirectTo = 'index.html') {
    const user = getSession();
    if (user) window.location.href = redirectTo;
  }

  return { register, login, oauthLogin, getSession, clearSession, requireAuth, redirectIfAuth };
})();
