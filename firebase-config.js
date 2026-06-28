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
  apiKey:            "여기에_apiKey_붙여넣기",
  authDomain:        "openclassforsummervacation.firebaseapp.com",
  projectId:         "openclassforsummervacation",
  storageBucket:     "openclassforsummervacation.appspot.com",
  messagingSenderId: "여기에_messagingSenderId_붙여넣기",
  appId:             "여기에_appId_붙여넣기"
};

/* 대시보드(학생 현황)를 볼 수 있는 관리자(선생님) 구글 계정.
 * 이 이메일로 로그인했을 때만 teacher.html 에 들어갈 수 있고,
 * 보안 규칙(firestore.rules)에서도 같은 이메일만 학생 데이터를 읽게 막아둡니다. */
window.ADMIN_EMAIL = "fglucky35@gmail.com";
