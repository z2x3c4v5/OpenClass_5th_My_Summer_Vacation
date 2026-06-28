/* ============================================================
 * tracker.js — 학생 학습 행동을 Firestore에 실시간 기록
 * ------------------------------------------------------------
 * 사용 (app.js 안에서):
 *   Track.event("tab_view", { tab: "build" });   // 행동 로그(append)
 *   Track.liveState({ tab: "build" });            // "지금 뭐하는 중" (덮어쓰기)
 *   Track.practice(item, stats, score, heard);    // 문장별 누적 성취
 *
 * 로그인 전에 호출되면 큐에 모아두었다가 로그인되면 한 번에 보냅니다.
 * Firebase가 설정되지 않았으면 모든 호출은 조용히 무시됩니다(앱은 그대로 동작).
 * ============================================================ */
window.Track = (function () {
  let db = null, uid = null, ready = false;
  const queue = [];
  let liveTimer = null, pendingLive = {};

  function ref() { return db.collection("students").doc(uid); }
  function ts() { return firebase.firestore.FieldValue.serverTimestamp(); }

  function init(_db, _uid) {
    db = _db; uid = _uid; ready = true;
    // 큐에 쌓인 호출 비우기
    queue.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
    // 접속 표시(하트비트): 20초마다 살아있음을 알림
    heartbeat();
    setInterval(heartbeat, 20000);
    window.addEventListener("beforeunload", () => {
      try { ref().set({ online: false }, { merge: true }); } catch (e) {}
    });
  }

  function heartbeat() {
    if (ready) ref().set({ online: true, lastActive: ts() }, { merge: true }).catch(() => {});
  }

  function event(type, payload) {
    if (!ready) { queue.push(() => event(type, payload)); return; }
    ref().collection("events").add({
      type: type, payload: payload || {}, ts: ts()
    }).catch(() => {});
  }

  // liveState 는 자주 바뀌므로 0.4초 디바운스로 묶어서 1개의 문서를 덮어씀(비용 절약)
  function liveState(patch) {
    if (!ready) { queue.push(() => liveState(patch)); return; }
    Object.assign(pendingLive, patch);
    if (liveTimer) return;
    liveTimer = setTimeout(() => {
      liveTimer = null;
      const data = Object.assign({}, pendingLive, { lastAt: ts() });
      pendingLive = {};
      ref().set({ liveState: data, lastActive: ts() }, { merge: true }).catch(() => {});
    }, 400);
  }

  function practice(item, stats, score, heard) {
    if (!ready) { queue.push(() => practice(item, stats, score, heard)); return; }
    const id = (item.en || "").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 140) || "sentence";
    ref().collection("practice").doc(id).set({
      en: item.en, ko: item.ko || "", type: item.type || "suggest",
      attempts: stats.attempts, best: stats.best,
      lastScore: score, lastHeard: heard || "", updatedAt: ts()
    }, { merge: true }).catch(() => {});
  }

  return { init: init, event: event, liveState: liveState, practice: practice };
})();
