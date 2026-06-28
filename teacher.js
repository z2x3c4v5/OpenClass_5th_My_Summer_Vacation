/* ============================================================
 * teacher.js — 선생님(관리자) 전용 실시간 대시보드
 * 관리자 이메일(ADMIN_EMAIL)로 로그인했을 때만 데이터를 보여줍니다.
 * ============================================================ */
(function () {
  const cfg = window.FIREBASE_CONFIG || {};
  const $ = id => document.getElementById(id);
  const gate = $("login-gate"), loginBtn = $("login-btn"), logoutBtn = $("logout-btn");
  const msg = $("login-msg"), who = $("who-am-i");

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

  loginBtn.addEventListener("click", () => {
    loginBtn.disabled = true; msg.textContent = "";
    auth.signInWithPopup(provider).catch(err => {
      loginBtn.disabled = false;
      msg.textContent = "로그인 실패: " + ((err && err.message) || err);
    });
  });
  logoutBtn.addEventListener("click", () => auth.signOut());

  let started = false;
  auth.onAuthStateChanged(user => {
    if (!user) { gate.classList.remove("hidden"); loginBtn.disabled = false; who.textContent = ""; return; }
    who.textContent = user.displayName || user.email || "";
    if (user.email !== window.ADMIN_EMAIL) {
      msg.textContent = "이 계정(" + user.email + ")은 관리자가 아니에요. 관리자 계정으로 로그인하세요.";
      gate.classList.remove("hidden"); loginBtn.disabled = false;
      return;
    }
    gate.classList.add("hidden");
    if (!started) { started = true; start(); }
  });

  /* ---------------- 실시간 데이터 ---------------- */
  const students = {};            // uid -> data
  let detailUnsubs = [];

  function start() {
    db.collection("students").onSnapshot(snap => {
      snap.forEach(d => { students[d.id] = d.data(); });
      // 삭제된 학생 정리
      const ids = new Set(snap.docs.map(d => d.id));
      Object.keys(students).forEach(id => { if (!ids.has(id)) delete students[id]; });
      renderGrid();
      renderSummary();
    }, err => console.warn("students:", err));

    db.collectionGroup("events").orderBy("ts", "desc").limit(80).onSnapshot(snap => {
      renderFeed(snap.docs);
    }, err => {
      $("feed").innerHTML = '<div class="feed-err">활동 피드를 불러오려면 색인(index)이 필요할 수 있어요.<br>' +
        '브라우저 콘솔(F12)에 나오는 링크를 눌러 색인을 만들어 주세요.<br><small>' + (err.message || err) + '</small></div>';
    });
  }

  /* ---------------- 접속 여부 ---------------- */
  function isOnline(s) {
    if (s.online === false) return false;
    const t = s.lastActive && s.lastActive.toMillis ? s.lastActive.toMillis() : 0;
    return t && (nowMs() - t) < 70000; // 70초 이내 하트비트
  }
  // serverTimestamp 비교용 현재시각 (대시보드 클라이언트 기준)
  function nowMs() { return new Date().getTime(); }

  /* ---------------- 요약 ---------------- */
  function renderSummary() {
    const all = Object.values(students);
    const online = all.filter(isOnline).length;
    $("dash-summary").innerHTML =
      pill("👩‍🎓 전체", all.length + "명") +
      pill("🟢 접속 중", online + "명");
    $("student-count").textContent = all.length + "명";
  }
  function pill(label, val) {
    return '<span class="dash-pill"><b>' + val + '</b> ' + label + '</span>';
  }

  /* ---------------- 학생 카드 그리드 ---------------- */
  const TAB_NAMES = { suggest: "할 일 말하기", words: "때·장소", build: "문장 만들기", practice: "내 문장 연습" };
  const LVL = { beginner: "초급", intermediate: "중급", advanced: "고급" };

  function renderGrid() {
    const grid = $("student-grid");
    const list = Object.keys(students).map(uid => ({ uid: uid, s: students[uid] }));
    list.sort((a, b) => (isOnline(b.s) - isOnline(a.s)) ||
      ((b.s.lastActive && b.s.lastActive.toMillis ? b.s.lastActive.toMillis() : 0) -
       (a.s.lastActive && a.s.lastActive.toMillis ? a.s.lastActive.toMillis() : 0)));

    if (!list.length) { grid.innerHTML = '<p class="dash-empty">아직 로그인한 학생이 없어요.</p>'; return; }

    grid.innerHTML = "";
    list.forEach(({ uid, s }) => {
      const live = s.liveState || {};
      const card = document.createElement("div");
      card.className = "student-card" + (isOnline(s) ? " online" : "");
      const where = live.tab ? (TAB_NAMES[live.tab] || live.tab) : "—";
      const lvl = live.level ? " · " + (LVL[live.level] || live.level) : "";
      card.innerHTML =
        '<div class="sc-top"><span class="sc-dot"></span>' +
          '<span class="sc-name">' + esc(s.name || "(이름없음)") + '</span></div>' +
        '<div class="sc-row">📂 <b>' + esc(where) + '</b>' + esc(lvl) + '</div>' +
        (live.currentSentence ? '<div class="sc-row sc-sentence">🧩 ' + esc(live.currentSentence) + '</div>' : '') +
        (live.lastWord ? '<div class="sc-row">🔤 ' + esc(live.lastWord) + '</div>' : '') +
        '<div class="sc-foot">' + ago(s.lastActive) + '</div>';
      card.addEventListener("click", () => openDetail(uid));
      grid.appendChild(card);
    });
  }

  /* ---------------- 실시간 피드 ---------------- */
  function eventText(type, p) {
    p = p || {};
    switch (type) {
      case "tab_view": return "📂 '" + (TAB_NAMES[p.tab] || p.tab) + "' 탭으로 이동";
      case "filter_change": return "🎚️ " + (p.level ? "난이도 " + (LVL[p.level] || p.level) : "") + (p.category ? "분류 " + p.category : "");
      case "word_lookup": return "🔤 단어 찾아봄: <b>" + esc(p.word) + "</b>" + (p.meaning ? " (" + esc(p.meaning) + ")" : "");
      case "listen": return "🔊 듣기: " + esc(p.en);
      case "sentence_built": return "🧩 문장 완성: <b>" + esc(p.en) + "</b>";
      case "sentence_invalid": return "⚠️ 어색한 조합 시도: " + esc(p.en);
      case "select_toggle": return (p.on ? "⭐ 연습목록 추가" : "➖ 연습목록 제거") + ": " + esc(p.en);
      case "practice_attempt": return "🎤 연습 <b>" + p.score + "%</b> : " + esc(p.en);
      default: return type;
    }
  }

  function renderFeed(docs) {
    const feed = $("feed");
    if (!docs.length) { feed.innerHTML = '<p class="dash-empty">아직 활동이 없어요.</p>'; return; }
    feed.innerHTML = "";
    docs.forEach(d => {
      const ev = d.data();
      const uid = d.ref.parent.parent.id;
      const name = (students[uid] && students[uid].name) || "학생";
      const row = document.createElement("div");
      row.className = "feed-row";
      row.innerHTML =
        '<div class="feed-name">' + esc(name) + '</div>' +
        '<div class="feed-text">' + eventText(ev.type, ev.payload) + '</div>' +
        '<div class="feed-time">' + ago(ev.ts) + '</div>';
      row.addEventListener("click", () => openDetail(uid));
      feed.appendChild(row);
    });
  }

  /* ---------------- 학생 상세 ---------------- */
  function openDetail(uid) {
    closeDetailSubs();
    const s = students[uid] || {};
    $("detail-name").textContent = (s.name || "학생") + (s.email ? "  ·  " + s.email : "");
    const body = $("detail-body");
    body.innerHTML =
      '<h3 class="detail-h3">🎤 문장별 연습 성취</h3><div id="d-practice" class="d-practice">불러오는 중...</div>' +
      '<h3 class="detail-h3">⚡ 최근 행동</h3><div id="d-events" class="d-events">불러오는 중...</div>';
    $("detail").classList.remove("hidden");

    detailUnsubs.push(
      db.collection("students").doc(uid).collection("practice").orderBy("updatedAt", "desc")
        .onSnapshot(snap => {
          const el = $("d-practice");
          if (!el) return;
          if (snap.empty) { el.innerHTML = '<p class="dash-empty">아직 연습 기록이 없어요.</p>'; return; }
          let html = '<table class="d-table"><tr><th>문장</th><th>최고</th><th>최근</th><th>횟수</th></tr>';
          snap.forEach(d => {
            const p = d.data();
            html += '<tr><td>' + esc(p.en) + '</td><td><b>' + (p.best || 0) + '%</b></td><td>' +
              (p.lastScore != null ? p.lastScore + "%" : "—") + '</td><td>' + (p.attempts || 0) + '</td></tr>';
          });
          html += '</table>';
          el.innerHTML = html;
        }, e => { const el = $("d-practice"); if (el) el.textContent = "불러오기 실패: " + e.message; })
    );

    detailUnsubs.push(
      db.collection("students").doc(uid).collection("events").orderBy("ts", "desc").limit(40)
        .onSnapshot(snap => {
          const el = $("d-events");
          if (!el) return;
          if (snap.empty) { el.innerHTML = '<p class="dash-empty">기록 없음</p>'; return; }
          el.innerHTML = "";
          snap.forEach(d => {
            const ev = d.data();
            const r = document.createElement("div");
            r.className = "d-event";
            r.innerHTML = '<span class="d-event-time">' + ago(ev.ts) + '</span> ' + eventText(ev.type, ev.payload);
            el.appendChild(r);
          });
        }, e => { const el = $("d-events"); if (el) el.textContent = "불러오기 실패: " + e.message; })
    );
  }

  function closeDetailSubs() { detailUnsubs.forEach(u => { try { u(); } catch (e) {} }); detailUnsubs = []; }
  $("detail-close").addEventListener("click", () => { $("detail").classList.add("hidden"); closeDetailSubs(); });
  $("detail").addEventListener("click", e => { if (e.target.id === "detail") { $("detail").classList.add("hidden"); closeDetailSubs(); } });

  /* ---------------- 유틸 ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function ago(ts) {
    if (!ts || !ts.toMillis) return "";
    const sec = Math.max(0, Math.round((nowMs() - ts.toMillis()) / 1000));
    if (sec < 10) return "방금";
    if (sec < 60) return sec + "초 전";
    const min = Math.round(sec / 60);
    if (min < 60) return min + "분 전";
    const hr = Math.round(min / 60);
    if (hr < 24) return hr + "시간 전";
    return Math.round(hr / 24) + "일 전";
  }

  // 1초마다 상대시간/접속표시 갱신
  setInterval(() => { if (started) { renderGrid(); renderSummary(); } }, 5000);
})();
