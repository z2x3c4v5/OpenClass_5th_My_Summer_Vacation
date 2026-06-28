/* ============================================================
 * auth.js — 학생 구글 로그인 게이트 + 프로필 저장 + 추적 시작
 * (index.html 학생 화면 전용)
 * ============================================================ */
(function () {
  const cfg = window.FIREBASE_CONFIG || {};
  const gate = document.getElementById("login-gate");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const msg = document.getElementById("login-msg");
  const who = document.getElementById("who-am-i");
  const dashLink = document.getElementById("dash-link");

  // 설정값을 아직 안 넣은 경우 안내
  if (!cfg.apiKey || cfg.apiKey.indexOf("여기에") === 0) {
    if (msg) msg.textContent = "⚠️ firebase-config.js 에 Firebase 설정값을 먼저 넣어주세요.";
    if (loginBtn) loginBtn.disabled = true;
    return;
  }

  firebase.initializeApp(cfg);
  const auth = firebase.auth();
  const db = firebase.firestore();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
  const provider = new firebase.auth.GoogleAuthProvider();

  if (loginBtn) loginBtn.addEventListener("click", () => {
    loginBtn.disabled = true;
    if (msg) msg.textContent = "";
    auth.signInWithPopup(provider).catch(err => {
      loginBtn.disabled = false;
      if (msg) msg.textContent = "로그인에 실패했어요: " + ((err && err.message) || err);
    });
  });

  if (logoutBtn) logoutBtn.addEventListener("click", () => auth.signOut());

  auth.onAuthStateChanged(user => {
    if (user) {
      ensureProfile(user);
      window.Track && Track.init(db, user.uid);
      if (gate) gate.classList.add("hidden");
      if (who) who.textContent = user.displayName || user.email || "";
      if (dashLink) dashLink.style.display = (user.email === window.ADMIN_EMAIL) ? "inline-flex" : "none";
    } else {
      if (gate) gate.classList.remove("hidden");
      if (loginBtn) loginBtn.disabled = false;
      if (who) who.textContent = "";
      if (dashLink) dashLink.style.display = "none";
    }
  });

  function ensureProfile(user) {
    db.collection("students").doc(user.uid).set({
      name: user.displayName || "(이름없음)",
      email: user.email || "",
      photoURL: user.photoURL || "",
      online: true,
      lastActive: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }
})();
