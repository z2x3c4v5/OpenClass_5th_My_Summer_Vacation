/* ============================================================
 * Firebase 설정값
 * ------------------------------------------------------------
 * Firebase 콘솔(https://console.firebase.google.com) →
 *   프로젝트 "OpenclassforSummervacation" 선택 →
 *   ⚙️ 프로젝트 설정 → "내 앱" → 웹 앱(</>) → "SDK 설정 및 구성" →
 *   "구성(Config)" 에 보이는 값을 아래에 그대로 붙여넣으세요.
 *
 * ⚠️ 이 값들은 비밀이 아닙니다(브라우저에 노출되는 게 정상).
 *    실제 보호는 firestore.rules(보안 규칙)가 합니다.
 * ============================================================ */
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB1_HHA7skhEBrTDsbPuYtQPSop0Dympy8",
  authDomain:        "openclassforsummervacation.firebaseapp.com",
  projectId:         "openclassforsummervacation",
  storageBucket:     "openclassforsummervacation.firebasestorage.app",
  messagingSenderId: "236981046863",
  appId:             "1:236981046863:web:75741d86bbbdf5483ba43a",
  measurementId:     "G-V5P4J3VSVN"
};

/* 대시보드(학생 현황)를 볼 수 있는 관리자(선생님) 구글 계정.
 * 이 이메일로 로그인했을 때만 teacher.html 에 들어갈 수 있고,
 * 보안 규칙(firestore.rules)에서도 같은 이메일만 학생 데이터를 읽게 막아둡니다. */
window.ADMIN_EMAIL = "fglucky35@gmail.com";
