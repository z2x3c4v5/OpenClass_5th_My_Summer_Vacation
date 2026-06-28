/* =========================================================
 * 6단원 · What will you do this summer? · 듣고 따라 말하기 웹 앱
 * - 음성 출력: Web Speech API (SpeechSynthesis)
 * - 단어 클릭: 단어 발음 + 뜻 풍선(popup)
 * - 문장 만들기: 할 일 + 때/장소 조합 → 검사 + 번역 + 듣기
 * - 따라 말하기 채점: Web Speech API (SpeechRecognition)
 * ========================================================= */

/* ---------- 음성 합성 (TTS) ---------- */
const synth = window.speechSynthesis;
let enVoice = null;
let speakRate = 0.85;

function pickVoice() {
  const voices = synth.getVoices();
  enVoice =
    voices.find(v => /en[-_]US/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
    null;
  const status = document.querySelector(".toolbar #voice-status");
  if (status) {
    status.textContent = enVoice ? `음성: ${enVoice.name}` : "영어 음성을 찾는 중...";
  }
}
pickVoice();
if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;

function speak(text, rate, onStart, onEnd) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate || speakRate;
  u.pitch = 1.05;
  if (enVoice) u.voice = enVoice;
  if (onStart) u.onstart = onStart;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

/* ---------- 단어 뜻 풍선(popup) ---------- */
const popup = document.createElement("div");
popup.className = "word-popup hidden";
popup.innerHTML = `
  <div class="wp-word"></div>
  <div class="wp-meaning"></div>
  <button class="wp-listen">단어 다시 듣기</button>`;
document.body.appendChild(popup);

popup.querySelector(".wp-listen").addEventListener("click", e => {
  e.stopPropagation();
  if (popup.dataset.word) speak(popup.dataset.word, 0.8);
});

function showWordPopup(wordEl, rawWord) {
  const key = wordKey(rawWord);
  const meaning = WORD_MEANINGS[key] || "(뜻 정보 없음)";
  popup.dataset.word = key || rawWord;
  popup.querySelector(".wp-word").textContent = rawWord.replace(/[.,!?]+$/, "");
  popup.querySelector(".wp-meaning").textContent = meaning;

  Track.event("word_lookup", { word: key || rawWord, meaning: meaning });
  Track.liveState({ lastWord: key || rawWord });

  popup.classList.remove("hidden");
  const r = wordEl.getBoundingClientRect();
  const pw = popup.offsetWidth;
  let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  let top = r.bottom + 8 + window.scrollY;
  popup.style.left = left + "px";
  popup.style.top = top + "px";

  speak(key || rawWord, 0.8);
}

function hidePopup() { popup.classList.add("hidden"); }
document.addEventListener("click", e => {
  if (!popup.contains(e.target) && !e.target.classList.contains("word")) hidePopup();
});

/* ---------- 클릭 가능한 단어로 문장 만들기 ---------- */
function buildWords(sentence) {
  const frag = document.createDocumentFragment();
  sentence.split(/\s+/).forEach((w, i) => {
    if (i > 0) frag.appendChild(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = w;
    span.addEventListener("click", e => {
      e.stopPropagation();
      showWordPopup(span, w);
    });
    frag.appendChild(span);
  });
  return frag;
}

/* ---------- 실사 이미지 ---------- */
let imageMode = true; // true: 실사 사진, false: 이모지
function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}
function imageUrl(prompt) {
  const p = encodeURIComponent("a bright, friendly, realistic photo of " + prompt + ", for kids");
  return `https://image.pollinations.ai/prompt/${p}?width=400&height=260&nologo=true&seed=${hashSeed(prompt)}`;
}

/* ---------- 카드 만들기 ---------- */
function makeCard(item, opts) {
  opts = opts || {};
  const div = document.createElement("div");
  div.className = "card" + (opts.tone != null ? " tone-" + opts.tone : "");

  function speakSentence() {
    Track.event("listen", { en: item.en });
    Track.liveState({ currentSentence: item.en });   // 지금 듣는 문장(단일·교체)
    speak(item.en, null,
      () => div.classList.add("speaking"),
      () => div.classList.remove("speaking"));
  }

  // 윗줄: 태그 + 듣기
  const top = document.createElement("div");
  top.className = "card-top";
  const tag = document.createElement("span");
  tag.className = "card-tag";
  if (opts.index != null) tag.textContent = "CARD " + opts.index;
  const listenAll = document.createElement("button");
  listenAll.className = "listen-all";
  listenAll.textContent = "듣기 ▶";
  listenAll.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  top.append(tag, listenAll);

  // 이모지 또는 실사 이미지
  let visual;
  if (imageMode && item.imgPrompt) {
    visual = document.createElement("img");
    visual.className = "photo";
    visual.loading = "lazy";
    visual.alt = item.en;
    visual.src = imageUrl(item.imgPrompt);
    visual.addEventListener("error", () => {
      const em = document.createElement("div");
      em.className = "emoji";
      em.textContent = item.emoji;
      visual.replaceWith(em);
    });
  } else {
    visual = document.createElement("div");
    visual.className = "emoji";
    visual.textContent = item.emoji;
  }

  // 안쪽 문장 박스: 문장 + 한글 + 스피커
  const box = document.createElement("div");
  box.className = "sentence-box";
  const txt = document.createElement("div");
  txt.className = "sentence-text";
  const en = document.createElement("div");
  en.className = "en";
  en.appendChild(buildWords(item.en));
  const ko = document.createElement("div");
  ko.className = "ko";
  ko.textContent = item.ko;
  txt.append(en, ko);
  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn";
  speakBtn.setAttribute("aria-label", "문장 듣기");
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  box.append(txt, speakBtn);

  div.append(top, visual, box);

  // ⭐ 연습 목록 담기 버튼
  if (opts.selectable) {
    const sel = document.createElement("button");
    sel.className = "select-btn";
    const on = isSelected(item.en);
    sel.classList.toggle("on", on);
    sel.textContent = on ? "✓ 연습 목록에 있음" : "⭐ 연습 목록에 추가";
    sel.addEventListener("click", e => {
      e.stopPropagation();
      toggleSelect(item, opts.selectType || "suggest");
    });
    div.append(sel);
  }
  return div;
}

function renderGrid(id, list, opts) {
  opts = opts || {};
  const grid = document.getElementById(id);
  grid.innerHTML = "";
  list.forEach((item, i) => {
    const cardOpts = {};
    if (opts.tones) { cardOpts.tone = i % 6; if (!opts.noIndex) cardOpts.index = i + 1; }
    if (opts.selectable) { cardOpts.selectable = true; cardOpts.selectType = opts.selectType; }
    grid.appendChild(makeCard(item, cardOpts));
  });
}

/* ---------- 난이도(초급/중급/고급) + 활동 종류 ---------- */
let currentLevel = "beginner";
let currentCategory = "all";
function currentSuggestions() { return SUGGESTION_LEVELS[currentLevel]; }

function renderSuggestions() {
  const lvl = currentSuggestions();
  const view = [];
  lvl.forEach((item, i) => {
    if (currentCategory === "all" || SUGGESTION_CATEGORIES[i] === currentCategory) {
      view.push(Object.assign({}, item, { imgPrompt: IMAGE_PROMPTS[i] }));
    }
  });
  renderGrid("suggestion-grid", view, { tones: true, selectable: true });
}

document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentLevel = btn.dataset.level;
    Track.event("filter_change", { level: currentLevel });
    Track.liveState({ level: currentLevel });
    synth.cancel();
    hidePopup();
    renderSuggestions();
  });
});

document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.cat;
    Track.event("filter_change", { category: currentCategory });
    Track.liveState({ category: currentCategory });
    synth.cancel();
    hidePopup();
    renderSuggestions();
  });
});

/* ===========================================================
 * 🧩 문장 만들기 (할 일 + 때/장소 조합)
 * =========================================================== */
let buildActivity = null;
let buildModifier = null; // { en, ko, type: "when" | "where" }
let lastBuilt = "";       // 마지막으로 들려준 문장 (별표 토글 때 중복 재생 방지)
let lastInvalid = "";     // 마지막으로 기록한 어색한 조합 (중복 기록 방지)

function makeChip(text, cls, isOn, onClick) {
  const c = document.createElement("button");
  c.className = "chip " + cls + (isOn ? " on" : "");
  c.textContent = text;
  c.addEventListener("click", onClick);
  return c;
}

function renderBuilder() {
  const actWrap = document.getElementById("build-activities");
  const whenRow = document.getElementById("build-when");
  const whereRow = document.getElementById("build-where");
  const withRow = document.getElementById("build-with");
  actWrap.innerHTML = ""; whenRow.innerHTML = ""; whereRow.innerHTML = ""; withRow.innerHTML = "";

  // 할 일을 세션(카테고리)별로 나눠서 보여주기
  BUILD_CATS.forEach(cat => {
    const items = BUILD_ACTIVITIES.filter(a => a.cat === cat.key);
    if (!items.length) return;
    const title = document.createElement("div");
    title.className = "chip-group-title";
    title.textContent = cat.label;
    const row = document.createElement("div");
    row.className = "chip-row";
    items.forEach(a => {
      row.appendChild(makeChip(`${a.emoji} ${a.en}`, "act", buildActivity === a, () => {
        buildActivity = a; renderBuilder(); updateBuildResult();
      }));
    });
    actWrap.append(title, row);
  });
  BUILD_WHEN.forEach(m => {
    const on = buildModifier && buildModifier.type === "when" && buildModifier.en === m.en;
    whenRow.appendChild(makeChip(m.en, "when", on, () => {
      buildModifier = Object.assign({}, m, { type: "when" }); renderBuilder(); updateBuildResult();
    }));
  });
  BUILD_WHERE.forEach(m => {
    const on = buildModifier && buildModifier.type === "where" && buildModifier.en === m.en;
    whereRow.appendChild(makeChip(m.en, "where", on, () => {
      buildModifier = Object.assign({}, m, { type: "where" }); renderBuilder(); updateBuildResult();
    }));
  });
  BUILD_WITH.forEach(m => {
    const on = buildModifier && buildModifier.type === "with" && buildModifier.en === m.en;
    withRow.appendChild(makeChip(m.en, "with", on, () => {
      buildModifier = Object.assign({}, m, { type: "with" }); renderBuilder(); updateBuildResult();
    }));
  });
}

function updateBuildResult() {
  const box = document.getElementById("build-result");

  if (!buildActivity || !buildModifier) {
    box.className = "build-result empty";
    box.textContent = "할 일과 때·장소를 골라보세요! 👆";
    lastBuilt = "";
    return;
  }

  // 장소가 이미 들어 있는 활동(go to the beach 등)에 또 장소를 붙이면 어색함
  const clash = buildModifier.type === "where" && buildActivity.place;
  if (clash) {
    const tryEn = `I'll ${buildActivity.en} ${buildModifier.en}.`;
    if (tryEn !== lastInvalid) {
      lastInvalid = tryEn;
      Track.event("sentence_invalid", { en: tryEn, reason: "place_clash" });
    }
    box.className = "build-result bad";
    box.innerHTML = "";
    const badge = document.createElement("div");
    badge.className = "br-badge";
    badge.textContent = "🤔 이 조합은 어색해요";
    const note = document.createElement("div");
    note.className = "br-note";
    note.innerHTML = `"<b>${buildActivity.en}</b>" 에는 이미 <b>가는 곳(장소)</b>이 들어 있어요.<br>📅 <b>때(When)</b> 표현과 함께 만들어 보세요!`;
    box.append(badge, note);
    return;
  }

  // 올바른 문장
  const en = `I'll ${buildActivity.en} ${buildModifier.en}.`;
  const ko = `나는 ${buildModifier.ko} ${buildActivity.koVerb}.`;

  box.className = "build-result ok";
  box.innerHTML = "";

  const badge = document.createElement("div");
  badge.className = "br-badge";
  badge.textContent = "✅ 멋진 문장이에요!";

  const enEl = document.createElement("div");
  enEl.className = "br-sentence";
  enEl.appendChild(buildWords(en));

  const koEl = document.createElement("div");
  koEl.className = "br-ko";
  koEl.textContent = ko;

  const actions = document.createElement("div");
  actions.className = "br-actions";
  const listenBtn = document.createElement("button");
  listenBtn.className = "btn primary";
  listenBtn.textContent = "🔊 듣기";
  listenBtn.addEventListener("click", () => speak(en));

  const item = { en, ko, emoji: buildActivity.emoji, type: "combo" };
  const starBtn = document.createElement("button");
  starBtn.className = "btn";
  const on = isSelected(en);
  starBtn.textContent = on ? "✓ 연습 목록에 있음" : "⭐ 연습 목록에 추가";
  starBtn.addEventListener("click", () => { toggleSelect(item, "combo"); updateBuildResult(); });

  actions.append(listenBtn, starBtn);
  box.append(badge, enEl, koEl, actions);

  // 새로운 문장이 완성되면 한 번만 들려주기 (별표 토글로 다시 부르면 재생 안 함)
  if (en !== lastBuilt) {
    lastBuilt = en;
    Track.event("sentence_built", { en: en, ko: ko });
    Track.liveState({ currentSentence: en });
    speak(en);
  }
}

document.getElementById("build-random").addEventListener("click", () => {
  buildActivity = BUILD_ACTIVITIES[Math.floor(Math.random() * BUILD_ACTIVITIES.length)];
  // 때·누구와는 항상, 장소는 활동에 장소가 없을 때만
  let pool = BUILD_WHEN.map(m => Object.assign({}, m, { type: "when" }))
    .concat(BUILD_WITH.map(m => Object.assign({}, m, { type: "with" })));
  if (!buildActivity.place) {
    pool = pool.concat(BUILD_WHERE.map(m => Object.assign({}, m, { type: "where" })));
  }
  buildModifier = pool[Math.floor(Math.random() * pool.length)];
  renderBuilder();
  updateBuildResult();
});

document.getElementById("build-clear").addEventListener("click", () => {
  buildActivity = null; buildModifier = null;
  synth.cancel();
  renderBuilder();
  updateBuildResult();
});

/* ===========================================================
 * 내 문장 연습 (선택 → 말하기/녹음 → 정확도 → 연습 횟수)
 * =========================================================== */
let selected = new Map();
let stats = {};
try { (JSON.parse(localStorage.getItem("summer_selected") || "[]") || []).forEach(it => selected.set(it.en, it)); } catch (e) {}
try { stats = JSON.parse(localStorage.getItem("summer_stats") || "{}") || {}; } catch (e) {}

function persist() {
  try {
    localStorage.setItem("summer_selected", JSON.stringify([...selected.values()]));
    localStorage.setItem("summer_stats", JSON.stringify(stats));
  } catch (e) {}
  if (window.Track) {
    Track.setSelected([...selected.values()].map(it => {
      const st = stats[it.en] || {};
      return {
        en: it.en, ko: it.ko || "", type: it.type || "suggest",
        attempts: st.attempts || 0, best: st.best || 0,
        avg: st.avg != null ? st.avg : (st.best || 0)
      };
    }));
  }
}
function isSelected(en) { return selected.has(en); }
function toggleSelect(item, type) {
  let added;
  if (selected.has(item.en)) { selected.delete(item.en); added = false; }
  else { selected.set(item.en, { en: item.en, ko: item.ko, emoji: item.emoji, imgPrompt: item.imgPrompt, type: type || "suggest" }); added = true; }
  Track.event("select_toggle", { en: item.en, ko: item.ko || "", on: added, type: type || "suggest" });
  persist();
  updatePracticeBadge();
  renderSuggestions();
  if (document.getElementById("tab-practice").classList.contains("active")) renderPractice();
}
function updatePracticeBadge() {
  const c = document.getElementById("practice-count");
  if (c) c.textContent = selected.size;
}

/* ---- 음성 인식 (정확도 측정) ---- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const srSupported = !!SR;
let rec = srSupported ? new SR() : null;
if (rec) { rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 5; }
let recBusy = false;

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z\s']/g, "").replace(/\s+/g, " ").trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function wordsClose(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= 1;
}
const STOPWORDS = new Set(["a", "an", "the", "to", "of", "on", "in", "at", "for", "but", "i", "i'm", "i'll"]);
function scoreMatch(target, heard) {
  const t = normalize(target).split(" ").filter(Boolean);
  const h = normalize(heard).split(" ").filter(Boolean);
  let content = t.filter(w => !STOPWORDS.has(w));
  if (!content.length) content = t;
  let hit = 0;
  content.forEach(w => { if (h.some(x => wordsClose(x, w))) hit++; });
  let score = hit / content.length;
  if (score >= 0.5) score = Math.min(1, score + 0.12);
  return score;
}
function practiceAttempt(target, cb) {
  if (!rec || recBusy) { cb.onend && cb.onend(); return; }
  recBusy = true;
  let score = 0, heard = "", errCode = null;
  rec.onresult = e => {
    const alts = e.results[0];
    for (let i = 0; i < alts.length; i++) {
      const s = scoreMatch(target, alts[i].transcript);
      if (s > score) { score = s; heard = alts[i].transcript; }
    }
  };
  rec.onerror = ev => { errCode = ev.error; };
  rec.onend = () => {
    recBusy = false;
    if (errCode && score === 0) cb.onerror && cb.onerror(errCode);
    else cb.onresult && cb.onresult(Math.round(score * 100), heard);
    cb.onend && cb.onend();
  };
  try { rec.start(); } catch (e) { recBusy = false; cb.onend && cb.onend(); }
}

/* ---- 연습 카드 ---- */
function makePracticeCard(item) {
  const div = document.createElement("div");
  div.className = "card pcard";

  const top = document.createElement("div");
  top.className = "card-top";
  const tag = document.createElement("span");
  tag.className = "card-tag " + (item.type === "combo" ? "tag-combo" : "tag-suggest");
  tag.textContent = item.type === "combo" ? "🧩 내 문장" : "🙋 할 일";
  const remove = document.createElement("button");
  remove.className = "premove";
  remove.setAttribute("aria-label", "목록에서 빼기");
  remove.textContent = "✕";
  remove.addEventListener("click", () => {
    selected.delete(item.en);
    persist();
    updatePracticeBadge();
    renderPractice();
    renderSuggestions();
  });
  top.append(tag, remove);

  let visual;
  if (imageMode && item.imgPrompt) {
    visual = document.createElement("img");
    visual.className = "photo";
    visual.loading = "lazy";
    visual.alt = item.en;
    visual.src = imageUrl(item.imgPrompt);
    visual.addEventListener("error", () => {
      const em = document.createElement("div");
      em.className = "emoji";
      em.textContent = item.emoji;
      visual.replaceWith(em);
    });
  } else {
    visual = document.createElement("div");
    visual.className = "emoji";
    visual.textContent = item.emoji;
  }

  const box = document.createElement("div");
  box.className = "sentence-box";
  const txt = document.createElement("div");
  txt.className = "sentence-text";
  const en = document.createElement("div");
  en.className = "en";
  en.appendChild(buildWords(item.en));
  const ko = document.createElement("div");
  ko.className = "ko";
  ko.textContent = item.ko;
  txt.append(en, ko);
  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn";
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", () => speak(item.en));
  box.append(txt, speakBtn);

  const micArea = document.createElement("div");
  micArea.className = "mic-area";
  const mic = document.createElement("button");
  mic.className = "mic-btn";
  mic.setAttribute("aria-label", "말하기");
  mic.innerHTML = '<span class="mic-ico">🎙️</span>';
  const micLabel = document.createElement("div");
  micLabel.className = "mic-label";
  micLabel.textContent = "마이크를 누르고 말해보세요";
  micArea.append(mic, micLabel);

  const statsEl = document.createElement("div");
  statsEl.className = "pstats";
  const fb = document.createElement("div");
  fb.className = "mic-feedback";

  function renderStats(last) {
    const s = stats[item.en] || { attempts: 0, best: 0 };
    statsEl.innerHTML =
      `정확도 <b class="acc">${last != null ? last + "%" : "--"}</b>` +
      ` · 최고 <b class="best">${s.best ? s.best + "%" : "--"}</b>` +
      ` · 연습 <b>${s.attempts}</b>회`;
  }
  renderStats(null);

  if (!srSupported) { mic.disabled = true; mic.title = "이 브라우저는 음성 인식을 지원하지 않아요 (Chrome 권장)"; }

  mic.addEventListener("click", () => {
    if (recBusy || !srSupported) return;
    mic.classList.add("recording");
    micLabel.textContent = "🔴 녹음 중... 말해보세요";
    fb.textContent = "또박또박 말해보세요!";
    fb.className = "mic-feedback";
    practiceAttempt(item.en, {
      onresult: (score, heard) => {
        const s = stats[item.en] || { attempts: 0, best: 0, sum: 0 };
        s.attempts++;
        s.best = Math.max(s.best, score);
        s.sum = (s.sum || 0) + score;
        s.avg = Math.round(s.sum / s.attempts);
        stats[item.en] = s;
        persist();
        Track.practice(item, s, score, heard);
        Track.event("practice_attempt", { en: item.en, score: score, heard: heard || "", best: s.best, attempts: s.attempts });
        Track.liveState({ tab: "practice", currentSentence: item.en });
        renderStats(score);
        if (score >= 75) { fb.className = "mic-feedback good"; fb.innerHTML = `⭐ 훌륭해요! (${score}%)<br><span class="heard">내가 한 발음: ${heard}</span>`; }
        else if (score >= 45) { fb.className = "mic-feedback good"; fb.innerHTML = `👍 좋아요! 한 번 더! (${score}%)<br><span class="heard">내가 한 발음: ${heard}</span>`; }
        else { fb.className = "mic-feedback bad"; fb.innerHTML = `🔁 다시 또박또박! (${score}%)<br><span class="heard">내가 한 발음: ${heard || "(못 들었어요)"}</span>`; }
      },
      onerror: err => {
        fb.className = "mic-feedback bad";
        fb.textContent = err === "not-allowed" ? "마이크 권한을 허용해 주세요." : "다시 시도해 주세요.";
      },
      onend: () => {
        mic.classList.remove("recording");
        micLabel.textContent = "마이크를 누르고 말해보세요";
      }
    });
  });

  div.append(top, visual, box, micArea, statsEl, fb);
  return div;
}

function renderPractice() {
  const items = [...selected.values()];
  const empty = document.getElementById("practice-empty");
  const list = document.getElementById("practice-list");
  if (!items.length) { empty.style.display = "block"; list.innerHTML = ""; updatePracticeBadge(); return; }
  empty.style.display = "none";
  // 할 일 문장 먼저, 내가 만든 문장 다음으로 정렬
  items.sort((a, b) => (a.type === "combo" ? 1 : 0) - (b.type === "combo" ? 1 : 0));
  list.innerHTML = "";
  items.forEach(it => list.appendChild(makePracticeCard(it)));
  updatePracticeBadge();
}

/* ---------- 초기 렌더 ---------- */
renderSuggestions();
renderGrid("day-grid", DAY_EXPRESSIONS, { tones: true, noIndex: true });
renderGrid("place-grid", PLACE_EXPRESSIONS, { tones: true, noIndex: true });
renderGrid("with-grid", WITH_EXPRESSIONS, { tones: true, noIndex: true });
renderBuilder();
updateBuildResult();
updatePracticeBadge();

/* ---------- 탭 전환 ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    Track.event("tab_view", { tab: btn.dataset.tab });
    Track.liveState({ tab: btn.dataset.tab });
    synth.cancel();
    hidePopup();
    if (btn.dataset.tab === "practice") renderPractice();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ---------- 속도 조절 ---------- */
document.getElementById("rate").addEventListener("input", e => {
  speakRate = parseFloat(e.target.value);
});
