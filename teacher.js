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
  const feedEvents = {};          // uid -> 최근 이벤트 배열
  const feedUnsubs = {};          // uid -> 구독 해제 함수

  const TARGET_SENTENCES = 4;     // 학생이 만들어야 하는 문장 개수

  // 🪑 자리 배치 상태 (이 브라우저에 저장 → Firebase 불필요)
  let seating = loadSeating();
  let editMode = false, dragUid = null, selectUid = null;
  function defSeating() { return { rows: 4, cols: 5, seats: {} }; }
  function loadSeating() {
    try { return Object.assign(defSeating(), JSON.parse(localStorage.getItem("seating_v1") || "null") || {}); }
    catch (e) { return defSeating(); }
  }
  function saveSeating() {
    try { localStorage.setItem("seating_v1", JSON.stringify(seating)); } catch (e) {}
    // 클라우드에도 저장 → 다른 기기에서도 그대로 유지
    try { db.collection("config").doc("seating").set(seating).catch(function () {}); } catch (e) {}
  }

  function start() {
    db.collection("students").onSnapshot(snap => {
      snap.forEach(d => { students[d.id] = d.data(); });
      // 삭제된 학생 정리
      const ids = new Set(snap.docs.map(d => d.id));
      Object.keys(students).forEach(id => { if (!ids.has(id)) delete students[id]; });
      syncFeedListeners(ids);
      renderGrid();
      renderSummary();
      renderSeating();
      if (detailUid) renderDetail();
    }, err => console.warn("students:", err));

    // 자리 배치를 클라우드에서 불러와 기기 간 동기화(어느 PC에서 열어도 유지)
    db.collection("config").doc("seating").onSnapshot(d => {
      if (d.exists && d.data() && d.data().seats) {
        seating = Object.assign(defSeating(), d.data());
        try { localStorage.setItem("seating_v1", JSON.stringify(seating)); } catch (e) {}
        if ($("seat-rows")) $("seat-rows").value = seating.rows;
        if ($("seat-cols")) $("seat-cols").value = seating.cols;
        renderSeating();
      }
    }, e => {});
  }

  // 학생마다 자기 events 하위 컬렉션을 구독해서 합칩니다.
  // (컬렉션 그룹 쿼리를 안 써서 별도 색인이 필요 없음)
  function syncFeedListeners(ids) {
    ids.forEach(uid => {
      if (feedUnsubs[uid]) return;
      feedUnsubs[uid] = db.collection("students").doc(uid).collection("events")
        .orderBy("ts", "desc").limit(25)
        .onSnapshot(s => {
          feedEvents[uid] = s.docs.map(d => Object.assign({ uid: uid }, d.data()));
          renderFeedMerged();
        }, e => { /* 무시 */ });
    });
    // 사라진 학생 구독 정리
    Object.keys(feedUnsubs).forEach(uid => {
      if (!ids.has(uid)) {
        try { feedUnsubs[uid](); } catch (e) {}
        delete feedUnsubs[uid];
        delete feedEvents[uid];
      }
    });
  }

  function renderFeedMerged() {
    const all = [];
    Object.keys(feedEvents).forEach(uid => { (feedEvents[uid] || []).forEach(ev => all.push(ev)); });
    all.sort((a, b) =>
      ((b.ts && b.ts.toMillis ? b.ts.toMillis() : 0) - (a.ts && a.ts.toMillis ? a.ts.toMillis() : 0)));
    renderFeed(all.slice(0, 80));
    renderSeating();
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
  const TAB_NAMES = { suggest: "할 일 말하기", words: "때·장소", build: "문장 만들기", practice: "내 문장 연습", challenge: "🚀 도전 미션" };
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

  function renderFeed(events) {
    const feed = $("feed");
    if (!events.length) { feed.innerHTML = '<p class="dash-empty">아직 활동이 없어요.</p>'; return; }
    feed.innerHTML = "";
    events.forEach(ev => {
      const uid = ev.uid;
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
  let detailUid = null, detailPractice = {};

  function openDetail(uid) {
    closeDetailSubs();
    detailUid = uid; detailPractice = {};
    const s = students[uid] || {};
    $("detail-name").textContent = (s.name || "학생") + (s.email ? "  ·  " + s.email : "");
    $("detail-body").innerHTML =
      '<h3 class="detail-h3">✏️ 선택한 문장 <span id="d-selcount"></span></h3>' +
      '<div id="d-selected" class="d-practice">불러오는 중...</div>' +
      '<h3 class="detail-h3">⚡ 최근 행동</h3>' +
      '<div id="d-events" class="d-events">불러오는 중...</div>';
    $("detail").classList.remove("hidden");

    detailUnsubs.push(
      db.collection("students").doc(uid).collection("practice").orderBy("updatedAt", "desc")
        .onSnapshot(snap => {
          detailPractice = {};
          snap.forEach(d => { const p = d.data(); detailPractice[p.en] = p; });
          renderDetail();
        }, e => { const el = $("d-selected"); if (el) el.textContent = "불러오기 실패: " + e.message; })
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

  // 선택한 문장 + 문장별 연습 성취(연습 횟수·평균·최고)
  function renderDetail() {
    if (!detailUid) return;
    const el = $("d-selected");
    if (!el) return;
    const s = students[detailUid] || {};
    const sel = (s.selected || []).filter(it => it.type === "combo");
    const cnt = $("d-selcount");
    if (cnt) cnt.innerHTML = "(" + sel.length + "/" + TARGET_SENTENCES + ")" +
      (sel.length >= TARGET_SENTENCES ? ' <b class="d-done">⭐ 완료</b>' : "");
    if (!sel.length) {
      el.innerHTML = '<p class="dash-empty">아직 선택한 문장이 없어요. (학생이 ⭐로 담으면 여기 떠요)</p>';
      return;
    }
    let html = '<table class="d-table"><tr><th>문장</th><th>연습</th><th>평균</th><th>최고</th></tr>';
    sel.forEach(it => {
      const tag = it.type === "combo" ? "🧩 " : "🙋 ";
      const p = detailPractice[it.en];
      if (p) {
        const avg = p.avg != null ? p.avg : (p.best || 0);
        html += '<tr><td>' + tag + esc(it.en) + '</td><td>' + (p.attempts || 0) + '회</td>' +
          '<td><b>' + avg + '%</b></td><td>' + (p.best || 0) + '%</td></tr>';
      } else {
        html += '<tr><td>' + tag + esc(it.en) + '</td><td colspan="3" class="d-notyet">아직 연습 안 함</td></tr>';
      }
    });
    html += '</table>';
    el.innerHTML = html;
  }

  function closeDetailSubs() { detailUnsubs.forEach(u => { try { u(); } catch (e) {} }); detailUnsubs = []; detailUid = null; }
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

  /* ---------------- 🪑 자리 배치 뷰 ---------------- */
  function scoreOf(ev) { return ev && ev.payload && ev.payload.score != null ? ev.payload.score : 0; }

  // 학생 1명의 현재 상태 판정 (색상/문구)
  function statusOf(uid) {
    const s = students[uid];
    if (!s) return { k: "empty", label: "빈 자리", alert: false };
    if (!isOnline(s)) return { k: "offline", label: s.name || "학생", sub: "오프라인", alert: false };

    const evs = feedEvents[uid] || [];
    const practices = evs.filter(e => e.type === "practice_attempt");
    const live = s.liveState || {};
    const hasAct = live.lastAt && live.lastAt.toMillis;
    const actSec = hasAct ? (nowMs() - live.lastAt.toMillis()) / 1000 : 0;

    // 🔴 빨간 테두리(도움 필요) 판정
    const recent = practices.slice(0, 3).map(scoreOf);
    const recentAvg = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : null;
    const poor = recent.length >= 2 && recentAvg < 50;     // 최근 연습 정확도 낮음
    const idleStuck = hasAct && actSec > 90;                // 접속 중인데 오래 무반응(안 누름)
    const alert = poor || idleStuck;

    // 배경색: 최근 연습 결과
    let k = "ok";
    const lastP = practices[0];
    if (lastP) {
      const sc = scoreOf(lastP);
      const pSec = lastP.ts && lastP.ts.toMillis ? (nowMs() - lastP.ts.toMillis()) / 1000 : 9999;
      if (pSec < 90) k = sc >= 75 ? "success" : (sc < 45 ? "fail" : "ok");
    }

    let sub;
    if (alert) sub = idleStuck ? "멈춤? 확인" : "정확도 낮음 " + (recentAvg != null ? recentAvg + "%" : "");
    else if (lastP && scoreOf(lastP) >= 75) sub = scoreOf(lastP) + "% 정답";
    else sub = live.tab ? (TAB_NAMES[live.tab] || live.tab) : "학습 중";

    return { k: k, label: s.name || "학생", sub: sub, alert: alert };
  }

  function seatKey(r, c) { return r + "-" + c; }
  function seatedUids() { return new Set(Object.values(seating.seats).filter(Boolean)); }

  function assignSeat(uid, r, c) {
    Object.keys(seating.seats).forEach(k => { if (seating.seats[k] === uid) delete seating.seats[k]; });
    seating.seats[seatKey(r, c)] = uid;
    dragUid = null; selectUid = null;
    saveSeating(); renderSeating();
  }
  function unassign(uid) {
    Object.keys(seating.seats).forEach(k => { if (seating.seats[k] === uid) delete seating.seats[k]; });
    saveSeating(); renderSeating();
  }

  // 자리 한 칸 내용: 이름 + 진행도 + (지금 듣는 문장) + 선택한 문장 4개(정확도·횟수)
  function seatInner(uid, st) {
    const s = students[uid] || {};
    // 문장 만들기(조합)로 연습목록에 담은 문장만 표시
    const sel = (s.selected || []).filter(it => it.type === "combo");
    const cur = (s.liveState && s.liveState.currentSentence) || "";
    const done = sel.length >= TARGET_SENTENCES;
    const inSel = sel.some(it => it.en === cur);

    let html = '<div class="seat-head"><span class="seat-name">' + esc(st.label || "") + "</span>" +
      '<span class="seat-badge' + (done ? " done" : "") + '">' +
      (done ? "⭐ " : "✏️ ") + sel.length + "/" + TARGET_SENTENCES + "</span></div>";

    // 🚀 심화(도전 미션) 진행 중 표시
    if (s.liveState && s.liveState.tab === "challenge") {
      html += '<div class="seat-chal">🚀 심화 도전 중</div>';
    }

    // 지금 듣는/하는 문장 — 선택목록에 없을 때만 따로(단일·교체)
    if (cur && !inSel) {
      html += '<div class="seat-now">▶ 🔊 ' + esc(cur) + "</div>";
    }

    if (sel.length) {
      html += '<div class="seat-sents">';
      sel.slice(0, TARGET_SENTENCES).forEach(it => {
        const now = cur && it.en === cur;
        const ic = it.type === "combo" ? "🧩" : "🙋";
        const att = it.attempts || 0;
        const acc = att ? ((it.avg != null ? it.avg : it.best) || 0) + "%" : "—";
        html += '<div class="seat-sent' + (now ? " now" : "") + '">' +
          '<span class="ss-text">' + (now ? "▶ " : "") + ic + " " + esc(it.en) + "</span>" +
          '<span class="ss-stat">' + att + "회·" + acc + "</span></div>";
      });
      html += "</div>";
    } else if (!cur) {
      html += '<div class="seat-sub">' +
        esc(st.k === "offline" ? "오프라인" : (st.sub || "문장 선택 전")) + "</div>";
    }
    return html;
  }

  function renderSeating() {
    const grid = $("seating-grid");
    if (!grid) return;
    grid.style.gridTemplateColumns = "repeat(" + seating.cols + ", 1fr)";
    grid.innerHTML = "";
    for (let r = 0; r < seating.rows; r++) {
      for (let c = 0; c < seating.cols; c++) {
        const uid = seating.seats[seatKey(r, c)] || null;
        const st = uid ? statusOf(uid) : { k: "empty", label: "빈 자리" };
        const cell = document.createElement(editMode ? "div" : "button");
        cell.className = "seat seat-" + st.k + (editMode ? " editing" : "");

        if (editMode) {
          cell.innerHTML = '<div class="seat-name">' +
            esc(uid ? (students[uid].name || "학생") : "빈 자리") + "</div>";
        } else if (uid) {
          cell.innerHTML = seatInner(uid, st);
          const combos = (students[uid].selected || []).filter(it => it.type === "combo");
          if (st.alert) cell.classList.add("seat-alert");            // 🔴 도움 필요
          else if (combos.length >= TARGET_SENTENCES) cell.classList.add("seat-complete"); // ⭐ 완료
        } else {
          cell.innerHTML = '<div class="seat-name">빈 자리</div>';
        }

        if (editMode) {
          cell.addEventListener("dragover", e => e.preventDefault());
          cell.addEventListener("drop", e => { e.preventDefault(); if (dragUid) assignSeat(dragUid, r, c); });
          if (uid) {
            cell.setAttribute("draggable", "true");
            cell.addEventListener("dragstart", () => { dragUid = uid; });
            const x = document.createElement("span");
            x.className = "seat-x"; x.textContent = "✕";
            x.addEventListener("click", e => { e.stopPropagation(); unassign(uid); });
            cell.appendChild(x);
          } else {
            cell.addEventListener("click", () => { if (selectUid) assignSeat(selectUid, r, c); });
          }
        } else if (uid) {
          cell.addEventListener("click", () => openDetail(uid));
        }
        grid.appendChild(cell);
      }
    }
    renderPool();
  }

  function renderPool() {
    const pool = $("seat-pool");
    if (!pool) return;
    if (!editMode) { pool.innerHTML = ""; return; }
    const seated = seatedUids();
    const list = Object.keys(students).filter(u => !seated.has(u));
    pool.innerHTML = '<div class="pool-title">미배치 학생 — 끌어다 빈자리에 놓거나, 학생을 누른 뒤 빈자리를 누르세요</div>';
    if (!list.length) { pool.innerHTML += '<span class="dash-empty">모든 학생이 배치됐어요 ✅</span>'; return; }
    list.forEach(u => {
      const chip = document.createElement("div");
      chip.className = "pool-chip" + (selectUid === u ? " sel" : "");
      chip.textContent = (students[u].name || "학생");
      chip.setAttribute("draggable", "true");
      chip.addEventListener("dragstart", () => { dragUid = u; });
      chip.addEventListener("click", () => { selectUid = (selectUid === u ? null : u); renderPool(); });
      pool.appendChild(chip);
    });
  }

  function autoAssign() {
    const uids = Object.keys(students);
    seating.seats = {};
    let i = 0;
    for (let r = 0; r < seating.rows && i < uids.length; r++)
      for (let c = 0; c < seating.cols && i < uids.length; c++)
        seating.seats[seatKey(r, c)] = uids[i++];
    saveSeating(); renderSeating();
  }

  function applyDims() {
    const r = Math.max(1, Math.min(12, parseInt($("seat-rows").value, 10) || 4));
    const c = Math.max(1, Math.min(12, parseInt($("seat-cols").value, 10) || 5));
    seating.rows = r; seating.cols = c;
    Object.keys(seating.seats).forEach(k => {
      const p = k.split("-"); if (+p[0] >= r || +p[1] >= c) delete seating.seats[k];
    });
    saveSeating(); renderSeating();
  }

  function toggleEdit() {
    editMode = !editMode; selectUid = null; dragUid = null;
    document.body.classList.toggle("seat-editing", editMode);
    const b = $("seat-edit-toggle");
    if (b) b.textContent = editMode ? "✅ 편집 완료" : "✏️ 자리 편집";
    renderSeating();
  }

  function switchView(v) {
    const seat = v === "seat";
    $("seating-view").style.display = seat ? "" : "none";
    $("list-view").style.display = seat ? "none" : "";
    // 실시간 활동 피드는 '목록' 보기에서만 (자리뷰는 꽉 차게)
    if ($("feed-col")) $("feed-col").style.display = seat ? "none" : "";
    document.body.classList.toggle("seat-mode", seat);
    $("view-seat").classList.toggle("active", seat);
    $("view-list").classList.toggle("active", !seat);
  }

  function initSeating() {
    if ($("seat-rows")) $("seat-rows").value = seating.rows;
    if ($("seat-cols")) $("seat-cols").value = seating.cols;
    const bind = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
    bind("seat-edit-toggle", toggleEdit);
    bind("seat-apply", applyDims);
    bind("seat-auto", autoAssign);
    bind("seat-clear", () => { seating.seats = {}; saveSeating(); renderSeating(); });
    bind("view-seat", () => switchView("seat"));
    bind("view-list", () => switchView("list"));
    bind("fs-toggle", toggleFullscreen);
    document.addEventListener("fullscreenchange", () => {
      const fs = !!document.fullscreenElement;
      document.body.classList.toggle("fs", fs);
      const b = $("fs-toggle");
      if (b) b.textContent = fs ? "⛶ 전체화면 끄기" : "⛶ 전체화면";
    });
    switchView("seat");   // 기본은 자리 보기(피드 숨김)
    renderSeating();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { try { req.call(el); } catch (e) {} }
    }
  }
  initSeating();

  // 5초마다 상대시간/접속표시/자리색 갱신
  setInterval(() => { if (started) { renderGrid(); renderSummary(); renderSeating(); } }, 5000);
})();
