const firebaseConfig = {
  apiKey: "AIzaSyA22ba3woA3NAT1TeEt6RuuVuIlJjosiXo",
  authDomain: "nambam-b8354.firebaseapp.com",
  projectId: "nambam-b8354",
  storageBucket: "nambam-b8354.firebasestorage.app",
  messagingSenderId: "61657245608",
  appId: "1:61657245608:web:10f688df0cb9663eb45f9d",
  measurementId: "G-WEVE1LJB5G"
};

const Storage = (() => {
  let _auth = null;
  let _googleProvider = null;

  function getAuth() {
    if (!_auth) {
      const app = firebase.initializeApp(firebaseConfig);
      _auth = firebase.auth();
      _googleProvider = new firebase.auth.GoogleAuthProvider();
    }
    return _auth;
  }

  
  const SESSION_KEY = 'nkhn_session_v1';

  function setSession(user) {
    const safe = {
      uid: user.uid,
      username: user.displayName || user.email.split('@')[0],
      email: user.email,
      provider: user.providerData[0]?.providerId || 'local'
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(safe));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch { return null; }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    getAuth().signOut();
  }

  
  function requireAuth(redirectTo = 'login.html') {
    const user = getSession();
    if (!user) { window.location.href = redirectTo; return null; }
    return user;
  }

  function redirectIfAuth(redirectTo = 'index.html') {
    const user = getSession();
    if (user) window.location.href = redirectTo;
  }

  
  async function register({ username, email, password }) {
    try {
      const auth = getAuth();
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: username });
      setSession(cred.user);
      return { ok: true };
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Email này đã được đăng ký.',
        'auth/invalid-email': 'Email không hợp lệ.',
        'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
      };
      return { ok: false, msg: msgs[e.code] || e.message };
    }
  }

  
  async function login({ email, password }) {
    try {
      const auth = getAuth();
      const cred = await auth.signInWithEmailAndPassword(email, password);
      setSession(cred.user);
      return { ok: true, user: cred.user };
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'Email chưa được đăng ký.',
        'auth/wrong-password': 'Mật khẩu không đúng.',
        'auth/invalid-email': 'Email không hợp lệ.',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
        'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau.',
      };
      return { ok: false, msg: msgs[e.code] || 'Đăng nhập thất bại.' };
    }
  }

  
  async function loginWithGoogle() {
    try {
      const auth = getAuth();
      const result = await auth.signInWithPopup(_googleProvider);
      setSession(result.user);
      return { ok: true, user: result.user };
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') return { ok: false, msg: '' };
      return { ok: false, msg: 'Đăng nhập Google thất bại. Thử lại nhé!' };
    }
  }

  return {
    register,
    login,
    loginWithGoogle,
    getSession,
    clearSession,
    requireAuth,
    redirectIfAuth
  };
})();
