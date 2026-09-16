/**
 * storage.js
 * Firebase Auth thật: Email/Password + Google OAuth
 * Config: project nambam-b8354
 */

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyA22ba3woA3NAT1TeEt6RuuVuIlJjosiXo",
  authDomain: "nambam-b8354.firebaseapp.com",
  projectId: "nambam-b8354",
  storageBucket: "nambam-b8354.firebasestorage.app",
  messagingSenderId: "61657245608",
  appId: "1:61657245608:web:10f688df0cb9663eb45f9d"
};

// ===== INIT FIREBASE (CDN compat mode) =====
// Firebase được load từ CDN trong HTML trước file này
let _auth = null;

function getAuth() {
  if (_auth) return _auth;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  _auth = firebase.auth();
  _auth.languageCode = 'vi';
  return _auth;
}

// ===== SESSION KEY (dùng sessionStorage để tự xóa khi đóng tab) =====
const SESSION_KEY = 'nkhn_fb_session_v1';

// ===== STORAGE API =====
const Storage = (() => {

  // ---- Đăng ký Email/Password ----
  async function register({ username, email, password }) {
    try {
      const auth = getAuth();
      const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
      // Lưu displayName
      await cred.user.updateProfile({ displayName: username.trim() });
      const user = _buildUser(cred.user, 'local', username.trim());
      setSession(user);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: _fbError(e) };
    }
  }

  // ---- Đăng nhập Email/Password ----
  async function login({ email, password }) {
    try {
      const auth = getAuth();
      const cred = await auth.signInWithEmailAndPassword(email.trim(), password);
      const user = _buildUser(cred.user, 'local');
      setSession(user);
      return { ok: true, user };
    } catch (e) {
      return { ok: false, msg: _fbError(e) };
    }
  }

  // ---- Google OAuth popup ----
  async function oauthLogin(provider) {
    try {
      const auth = getAuth();
      let providerObj;
      if (provider === 'google') {
        providerObj = new firebase.auth.GoogleAuthProvider();
        providerObj.addScope('email');
        providerObj.addScope('profile');
      } else if (provider === 'facebook') {
        providerObj = new firebase.auth.FacebookAuthProvider();
        providerObj.addScope('email');
      } else {
        return { ok: false, msg: 'Provider không hợp lệ' };
      }

      const cred = await auth.signInWithPopup(providerObj);
      const user = _buildUser(cred.user, provider);
      setSession(user);
      return { ok: true, user };
    } catch (e) {
      // User đóng popup → không hiện lỗi
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        return { ok: false, msg: '' };
      }
      return { ok: false, msg: _fbError(e) };
    }
  }

  // ---- Build user object từ Firebase user ----
  function _buildUser(fbUser, provider, overrideName) {
    return {
      uid:      fbUser.uid,
      username: overrideName || fbUser.displayName || fbUser.email.split('@')[0],
      email:    fbUser.email,
      provider
    };
  }

  // ---- Firebase error → tiếng Việt ----
  function _fbError(e) {
    const map = {
      'auth/email-already-in-use':    'Email này đã được đăng ký.',
      'auth/invalid-email':           'Email không hợp lệ.',
      'auth/weak-password':           'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
      'auth/user-not-found':          'Email chưa được đăng ký.',
      'auth/wrong-password':          'Mật khẩu không đúng.',
      'auth/invalid-credential':      'Email hoặc mật khẩu không đúng.',
      'auth/too-many-requests':       'Quá nhiều lần thử, thử lại sau.',
      'auth/network-request-failed':  'Lỗi mạng, kiểm tra kết nối.',
      'auth/popup-blocked':           'Popup bị chặn, hãy cho phép popup rồi thử lại.',
      'auth/account-exists-with-different-credential': 'Email này đã đăng ký bằng phương thức khác.',
    };
    return map[e.code] || (e.message || 'Đã có lỗi xảy ra.');
  }

  // ---- Session ----
  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch { return null; }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    try { getAuth().signOut(); } catch {}
  }

  // ---- Guard: redirect nếu chưa đăng nhập ----
  function requireAuth(redirectTo = 'login.html') {
    const user = getSession();
    if (!user) { window.location.href = redirectTo; return null; }
    return user;
  }

  // ---- Guard: redirect nếu đã đăng nhập ----
  function redirectIfAuth(redirectTo = 'index.html') {
    const user = getSession();
    if (user) window.location.href = redirectTo;
  }

  return { register, login, oauthLogin, getSession, clearSession, requireAuth, redirectIfAuth };
})();
