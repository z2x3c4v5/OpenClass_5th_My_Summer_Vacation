/* =========================================================
 * 6단원 · What will you do this summer? 데이터
 * - 활동 문장(I'll ~) : 초급 / 중급 / 고급  각 32개
 * - 카테고리(인덱스별 공통) : make / active / trip / home
 * - 때(When) · 장소(Where) 표현
 * - 문장 만들기용 데이터 (활동 + 때/장소 조합)
 * - 단어 뜻 사전
 *  ※ 교과서 표현 6개 모두 포함:
 *    grow tomatoes / join a science camp / go to the beach /
 *    read many books / learn taekwondo / visit my grandpa
 *  ※ 초5가 좋아하는 활동 다수 포함:
 *    인생네컷 · 워터파크 · 놀이공원 · 노래방 · 떡볶이 · 빙수 ·
 *    슬라임 · 케이팝 댄스 · 유튜브 · 웹툰 · 폰 게임 · 친구집 자기 등
 * ========================================================= */

/* 카테고리: 같은 인덱스끼리 같은 종류 */
const SUGGESTION_CATEGORIES = [
  "make","make","make","make","make","make","make",                          // 0~6   🌱 만들기·꾸미기 (7)
  "active","active","active","active","active","active","active","active",    // 7~14  🏃 운동·배우기 (8)
  "trip","trip","trip","trip","trip","trip","trip","trip",                    // 15~22 🏖️ 나들이·여행 (8)
  "home","home","home","home","home","home","home","home","home",            // 23~31 🎮 놀이·취미 (9)
];

/* 이미지(실사) 검색 키워드 - 인덱스별 공통 */
const IMAGE_PROMPTS = [
  "growing red tomatoes in a sunny garden",
  "kids baking cookies in a kitchen",
  "kids making colorful slime",
  "child making friendship bracelets",
  "kids filming a youtube video with a camera",
  "child drawing a webtoon comic on a tablet",
  "kids making homemade pizza",
  "children practicing taekwondo in white uniforms",
  "kids dancing kpop dance together",
  "child riding a bicycle outdoors in summer",
  "child learning to swim in a pool",
  "happy kids playing soccer on a green field",
  "kids playing badminton in a park",
  "child rollerblading in a park",
  "child riding a skateboard",
  "kids playing on a sunny sandy beach",
  "grandfather smiling with his grandchild",
  "kids doing fun science experiments at a camp",
  "kids having fun at a water park with big slides",
  "kids at an amusement park with a roller coaster",
  "friends taking fun photos in a photo booth",
  "family camping with a tent in nature at night",
  "beautiful Jeju island with blue ocean",
  "child reading a stack of books",
  "kids watching a movie with popcorn",
  "child playing computer games happily",
  "child playing games on a smartphone",
  "korean tteokbokki spicy rice cakes",
  "kids singing at a karaoke singing room with microphones",
  "korean shaved ice dessert bingsu with fruit",
  "child watching youtube on a tablet",
  "kids having a fun sleepover with pillows",
];

/* ===== 활동 문장 (모두 "I'll ~" 로 시작) =====
 * 인덱스: make(0-6) · active(7-14) · trip(15-22) · home(23-31) */
const SUGGESTION_LEVELS = {
  beginner: [
    // 🌱 make
    { en: "I'll grow tomatoes.",        ko: "나는 토마토를 기를 거야.",     emoji: "🍅" },
    { en: "I'll make cookies.",         ko: "나는 쿠키를 만들 거야.",       emoji: "🍪" },
    { en: "I'll make slime.",           ko: "나는 슬라임을 만들 거야.",     emoji: "🫧" },
    { en: "I'll make bracelets.",       ko: "나는 팔찌를 만들 거야.",       emoji: "📿" },
    { en: "I'll make a YouTube video.", ko: "나는 유튜브 영상을 만들 거야.", emoji: "🎥" },
    { en: "I'll draw webtoons.",        ko: "나는 웹툰을 그릴 거야.",       emoji: "✏️" },
    { en: "I'll make pizza.",           ko: "나는 피자를 만들 거야.",       emoji: "🍕" },
    // 🏃 active
    { en: "I'll learn taekwondo.",      ko: "나는 태권도를 배울 거야.",     emoji: "🥋" },
    { en: "I'll learn K-pop dance.",    ko: "나는 케이팝 댄스를 배울 거야.", emoji: "💃" },
    { en: "I'll ride a bike.",          ko: "나는 자전거를 탈 거야.",       emoji: "🚴" },
    { en: "I'll learn to swim.",        ko: "나는 수영을 배울 거야.",       emoji: "🏊" },
    { en: "I'll play soccer.",          ko: "나는 축구를 할 거야.",         emoji: "⚽" },
    { en: "I'll play badminton.",       ko: "나는 배드민턴을 칠 거야.",     emoji: "🏸" },
    { en: "I'll go rollerblading.",     ko: "나는 인라인을 탈 거야.",       emoji: "🛼" },
    { en: "I'll learn to skateboard.",  ko: "나는 스케이트보드를 배울 거야.", emoji: "🛹" },
    // 🏖️ trip
    { en: "I'll go to the beach.",         ko: "나는 해변에 갈 거야.",       emoji: "🏖️" },
    { en: "I'll visit my grandpa.",        ko: "나는 할아버지를 찾아뵐 거야.", emoji: "👴" },
    { en: "I'll join a science camp.",     ko: "나는 과학 캠프에 참가할 거야.", emoji: "🔬" },
    { en: "I'll go to a water park.",      ko: "나는 워터파크에 갈 거야.",   emoji: "💦" },
    { en: "I'll go to an amusement park.", ko: "나는 놀이공원에 갈 거야.",   emoji: "🎢" },
    { en: "I'll take photos at a photo booth.", ko: "나는 인생네컷을 찍을 거야.", emoji: "📸" },
    { en: "I'll go camping.",              ko: "나는 캠핑을 갈 거야.",       emoji: "🏕️" },
    { en: "I'll travel to Jeju.",          ko: "나는 제주도로 여행 갈 거야.", emoji: "✈️" },
    // 🎮 home
    { en: "I'll read many books.",      ko: "나는 책을 많이 읽을 거야.",   emoji: "📚" },
    { en: "I'll watch movies.",         ko: "나는 영화를 볼 거야.",         emoji: "🎬" },
    { en: "I'll play computer games.",  ko: "나는 컴퓨터 게임을 할 거야.", emoji: "🎮" },
    { en: "I'll play phone games.",     ko: "나는 폰 게임을 할 거야.",      emoji: "📱" },
    { en: "I'll eat tteokbokki.",       ko: "나는 떡볶이를 먹을 거야.",     emoji: "🍢" },
    { en: "I'll sing at a singing room.", ko: "나는 노래방에서 노래할 거야.", emoji: "🎤" },
    { en: "I'll eat bingsu.",           ko: "나는 빙수를 먹을 거야.",       emoji: "🍧" },
    { en: "I'll watch YouTube.",        ko: "나는 유튜브를 볼 거야.",       emoji: "📺" },
    { en: "I'll have a sleepover.",     ko: "나는 친구 집에서 잘 거야.",   emoji: "🛌" },
  ],
  intermediate: [
    // 🌱 make
    { en: "I'll grow tomatoes in the garden.",         ko: "나는 정원에서 토마토를 기를 거야.",     emoji: "🍅" },
    { en: "I'll make cookies with my mom.",            ko: "나는 엄마와 쿠키를 만들 거야.",         emoji: "🍪" },
    { en: "I'll make slime with my friends.",          ko: "나는 친구들과 슬라임을 만들 거야.",     emoji: "🫧" },
    { en: "I'll make bracelets for my friends.",       ko: "나는 친구들에게 줄 팔찌를 만들 거야.",  emoji: "📿" },
    { en: "I'll make a YouTube video with my friends.", ko: "나는 친구들과 유튜브 영상을 만들 거야.", emoji: "🎥" },
    { en: "I'll draw webtoons on my tablet.",          ko: "나는 태블릿으로 웹툰을 그릴 거야.",     emoji: "✏️" },
    { en: "I'll make pizza for dinner.",               ko: "나는 저녁으로 피자를 만들 거야.",       emoji: "🍕" },
    // 🏃 active
    { en: "I'll learn taekwondo every day.",           ko: "나는 매일 태권도를 배울 거야.",         emoji: "🥋" },
    { en: "I'll learn K-pop dance with my friends.",   ko: "나는 친구들과 케이팝 댄스를 배울 거야.", emoji: "💃" },
    { en: "I'll ride a bike along the river.",         ko: "나는 강을 따라 자전거를 탈 거야.",      emoji: "🚴" },
    { en: "I'll learn to swim at the pool.",           ko: "나는 수영장에서 수영을 배울 거야.",     emoji: "🏊" },
    { en: "I'll play soccer with my friends.",         ko: "나는 친구들과 축구를 할 거야.",         emoji: "⚽" },
    { en: "I'll play badminton in the park.",          ko: "나는 공원에서 배드민턴을 칠 거야.",     emoji: "🏸" },
    { en: "I'll go rollerblading in the park.",        ko: "나는 공원에서 인라인을 탈 거야.",       emoji: "🛼" },
    { en: "I'll learn to skateboard with my brother.", ko: "나는 형이랑 스케이트보드를 배울 거야.", emoji: "🛹" },
    // 🏖️ trip
    { en: "I'll go to the beach with my family.",      ko: "나는 가족과 해변에 갈 거야.",           emoji: "🏖️" },
    { en: "I'll visit my grandpa in the country.",     ko: "나는 시골에 계신 할아버지를 찾아뵐 거야.", emoji: "👴" },
    { en: "I'll join a science camp this summer.",     ko: "나는 이번 여름에 과학 캠프에 참가할 거야.", emoji: "🔬" },
    { en: "I'll go to a water park with my friends.",  ko: "나는 친구들과 워터파크에 갈 거야.",     emoji: "💦" },
    { en: "I'll go to an amusement park with my friends.", ko: "나는 친구들과 놀이공원에 갈 거야.", emoji: "🎢" },
    { en: "I'll take photos at a photo booth with my friends.", ko: "나는 친구들과 인생네컷을 찍을 거야.", emoji: "📸" },
    { en: "I'll go camping in the mountains.",         ko: "나는 산으로 캠핑을 갈 거야.",           emoji: "🏕️" },
    { en: "I'll travel to Jeju by plane.",             ko: "나는 비행기로 제주도에 갈 거야.",       emoji: "✈️" },
    // 🎮 home
    { en: "I'll read many books this summer.",         ko: "나는 이번 여름에 책을 많이 읽을 거야.", emoji: "📚" },
    { en: "I'll watch movies on rainy days.",          ko: "나는 비 오는 날 영화를 볼 거야.",       emoji: "🎬" },
    { en: "I'll play computer games after my homework.", ko: "나는 숙제를 한 뒤에 컴퓨터 게임을 할 거야.", emoji: "🎮" },
    { en: "I'll play phone games with my friends.",    ko: "나는 친구들과 폰 게임을 할 거야.",      emoji: "📱" },
    { en: "I'll eat tteokbokki with my friends.",      ko: "나는 친구들과 떡볶이를 먹을 거야.",     emoji: "🍢" },
    { en: "I'll sing at a singing room with my friends.", ko: "나는 친구들과 노래방에서 노래할 거야.", emoji: "🎤" },
    { en: "I'll eat bingsu on hot days.",              ko: "나는 더운 날 빙수를 먹을 거야.",        emoji: "🍧" },
    { en: "I'll watch YouTube in my room.",            ko: "나는 내 방에서 유튜브를 볼 거야.",      emoji: "📺" },
    { en: "I'll have a sleepover at my friend's house.", ko: "나는 친구 집에서 자고 올 거야.",      emoji: "🛌" },
  ],
  advanced: [
    // 🌱 make
    { en: "I'll grow tomatoes and water them every morning.", ko: "나는 토마토를 기르고 매일 아침 물을 줄 거야.", emoji: "🍅" },
    { en: "I'll make cookies and share them with my friends.", ko: "나는 쿠키를 만들어 친구들과 나눠 먹을 거야.", emoji: "🍪" },
    { en: "I'll make slime and play with my friends.",        ko: "나는 슬라임을 만들어 친구들과 놀 거야.",       emoji: "🫧" },
    { en: "I'll make bracelets and give them to my friends.", ko: "나는 팔찌를 만들어 친구들에게 줄 거야.",       emoji: "📿" },
    { en: "I'll make a YouTube video and show it to my class.", ko: "나는 유튜브 영상을 만들어 반 친구들에게 보여줄 거야.", emoji: "🎥" },
    { en: "I'll draw webtoons and post them online.",         ko: "나는 웹툰을 그려서 온라인에 올릴 거야.",       emoji: "✏️" },
    { en: "I'll make pizza and eat it with my family.",       ko: "나는 피자를 만들어 가족과 먹을 거야.",         emoji: "🍕" },
    // 🏃 active
    { en: "I'll learn taekwondo to become stronger.",         ko: "나는 더 강해지려고 태권도를 배울 거야.",       emoji: "🥋" },
    { en: "I'll learn K-pop dance and perform on stage.",     ko: "나는 케이팝 댄스를 배워 무대에서 공연할 거야.", emoji: "💃" },
    { en: "I'll ride a bike around the lake on weekends.",    ko: "나는 주말마다 호수 주변에서 자전거를 탈 거야.", emoji: "🚴" },
    { en: "I'll learn to swim and dive into the pool.",       ko: "나는 수영을 배워 수영장에 다이빙할 거야.",     emoji: "🏊" },
    { en: "I'll play soccer at the park after lunch.",        ko: "나는 점심을 먹고 공원에서 축구를 할 거야.",     emoji: "⚽" },
    { en: "I'll play badminton with my dad every evening.",   ko: "나는 매일 저녁 아빠와 배드민턴을 칠 거야.",     emoji: "🏸" },
    { en: "I'll go rollerblading and race with my friends.",  ko: "나는 인라인을 타고 친구들과 시합할 거야.",     emoji: "🛼" },
    { en: "I'll learn to skateboard and try cool tricks.",    ko: "나는 스케이트보드를 배워 멋진 기술에 도전할 거야.", emoji: "🛹" },
    // 🏖️ trip
    { en: "I'll go to the beach and build a sandcastle.",     ko: "나는 해변에 가서 모래성을 쌓을 거야.",         emoji: "🏖️" },
    { en: "I'll visit my grandpa and help him on the farm.",  ko: "나는 할아버지를 찾아뵙고 농장 일을 도울 거야.", emoji: "👴" },
    { en: "I'll join a science camp and make new friends.",   ko: "나는 과학 캠프에 참가해 새 친구들을 사귈 거야.", emoji: "🔬" },
    { en: "I'll go to a water park and ride the big slides.", ko: "나는 워터파크에 가서 큰 슬라이드를 탈 거야.",   emoji: "💦" },
    { en: "I'll go to an amusement park and ride a roller coaster.", ko: "나는 놀이공원에 가서 롤러코스터를 탈 거야.", emoji: "🎢" },
    { en: "I'll take photos at a photo booth and keep them in my album.", ko: "나는 인생네컷을 찍어 앨범에 모아 둘 거야.", emoji: "📸" },
    { en: "I'll go camping and watch the stars at night.",    ko: "나는 캠핑을 가서 밤에 별을 볼 거야.",          emoji: "🏕️" },
    { en: "I'll travel to Jeju and climb Mt. Halla.",         ko: "나는 제주도에 가서 한라산에 오를 거야.",        emoji: "✈️" },
    // 🎮 home
    { en: "I'll read many books and write book reports.",     ko: "나는 책을 많이 읽고 독후감을 쓸 거야.",        emoji: "📚" },
    { en: "I'll watch movies and eat popcorn with my friends.", ko: "나는 친구들과 영화를 보며 팝콘을 먹을 거야.", emoji: "🎬" },
    { en: "I'll play computer games with my cousin on weekends.", ko: "나는 주말마다 사촌과 컴퓨터 게임을 할 거야.", emoji: "🎮" },
    { en: "I'll play phone games and beat my high score.",    ko: "나는 폰 게임을 해서 최고 점수를 깰 거야.",     emoji: "📱" },
    { en: "I'll eat tteokbokki and gimbap with my friends.",  ko: "나는 친구들과 떡볶이와 김밥을 먹을 거야.",     emoji: "🍢" },
    { en: "I'll sing at a singing room and dance with my friends.", ko: "나는 노래방에서 친구들과 노래하고 춤출 거야.", emoji: "🎤" },
    { en: "I'll eat bingsu and stay cool on hot days.",       ko: "나는 더운 날 빙수를 먹으며 시원하게 보낼 거야.", emoji: "🍧" },
    { en: "I'll watch YouTube and learn fun science tricks.", ko: "나는 유튜브를 보며 재미있는 과학 실험을 배울 거야.", emoji: "📺" },
    { en: "I'll have a sleepover and stay up late with my friends.", ko: "나는 친구 집에서 자며 친구들과 늦게까지 놀 거야.", emoji: "🛌" },
  ],
};

/* ===== 때 (When) =====
 * ※ 질문이 이미 "this summer"라고 시점을 주므로, 답에는 시점을 또 붙이지 않아요.
 *    대신 '얼마나 자주/언제(빈도·시간대)'를 더해 자연스럽게 만들어요. */
const DAY_EXPRESSIONS = [
  { en: "every day",        ko: "매일",          emoji: "📆" },
  { en: "every morning",    ko: "매일 아침",     emoji: "🌅" },
  { en: "every weekend",    ko: "주말마다",      emoji: "🗓️" },
  { en: "after lunch",      ko: "점심 후에",     emoji: "🍱" },
  { en: "on rainy days",    ko: "비 오는 날에",  emoji: "🌧️" },
  { en: "on hot days",      ko: "더운 날에",     emoji: "🥵" },
  { en: "in the evening",   ko: "저녁에",        emoji: "🌆" },
  { en: "at night",         ko: "밤에",          emoji: "🌙" },
];

/* ===== 장소 (Where) ===== */
const PLACE_EXPRESSIONS = [
  { en: "at the beach",          ko: "해변에서",      emoji: "🏖️" },
  { en: "at the water park",     ko: "워터파크에서",  emoji: "💦" },
  { en: "at the amusement park", ko: "놀이공원에서",  emoji: "🎢" },
  { en: "at a photo booth",      ko: "인생네컷 부스에서", emoji: "📸" },
  { en: "at the park",           ko: "공원에서",      emoji: "🌳" },
  { en: "at the pool",           ko: "수영장에서",    emoji: "🏊" },
  { en: "at the singing room",   ko: "노래방에서",    emoji: "🎤" },
  { en: "at a cafe",             ko: "카페에서",      emoji: "☕" },
  { en: "at the library",        ko: "도서관에서",    emoji: "📖" },
  { en: "at home",               ko: "집에서",        emoji: "🏠" },
  { en: "in my room",            ko: "내 방에서",     emoji: "🛏️" },
  { en: "at my friend's house",  ko: "친구 집에서",   emoji: "🏡" },
];

/* ===== 누구와 (With whom) ===== */
const WITH_EXPRESSIONS = [
  { en: "with my friends", ko: "친구들과",  emoji: "👯" },
  { en: "with my family",  ko: "가족과",    emoji: "👨‍👩‍👧‍👦" },
  { en: "with my mom",     ko: "엄마와",    emoji: "👩" },
  { en: "with my dad",     ko: "아빠와",    emoji: "👨" },
  { en: "with my brother", ko: "형이랑",    emoji: "👦" },
  { en: "with my sister",  ko: "여동생과",  emoji: "👧" },
  { en: "with my cousin",  ko: "사촌과",    emoji: "🧒" },
  { en: "by myself",       ko: "혼자서",    emoji: "🙂" },
];

/* ===== 문장 만들기 (활동 + 때/장소 조합) =====
 * 세션(카테고리)별로 나눠서 보여줘요.
 * place:true -> 이미 "가는 곳(장소)"이 들어 있어 또 장소를 붙이면 어색함 */
const BUILD_CATS = [
  { key: "make",   label: "🌱 만들기·꾸미기" },
  { key: "active", label: "🏃 운동·배우기" },
  { key: "trip",   label: "🏖️ 나들이·여행" },
  { key: "home",   label: "🎮 놀이·취미" },
];

const BUILD_ACTIVITIES = [
  // 🌱 만들기·꾸미기
  { en: "grow tomatoes",      koVerb: "토마토를 기를 거야",     emoji: "🍅", place: false, cat: "make" },
  { en: "make cookies",       koVerb: "쿠키를 만들 거야",       emoji: "🍪", place: false, cat: "make" },
  { en: "make slime",         koVerb: "슬라임을 만들 거야",     emoji: "🫧", place: false, cat: "make" },
  { en: "make bracelets",     koVerb: "팔찌를 만들 거야",       emoji: "📿", place: false, cat: "make" },
  { en: "make a YouTube video", koVerb: "유튜브 영상을 만들 거야", emoji: "🎥", place: false, cat: "make" },
  { en: "draw webtoons",      koVerb: "웹툰을 그릴 거야",       emoji: "✏️", place: false, cat: "make" },
  { en: "make pizza",         koVerb: "피자를 만들 거야",       emoji: "🍕", place: false, cat: "make" },
  // 🏃 운동·배우기
  { en: "learn taekwondo",    koVerb: "태권도를 배울 거야",     emoji: "🥋", place: false, cat: "active" },
  { en: "learn K-pop dance",  koVerb: "케이팝 댄스를 배울 거야", emoji: "💃", place: false, cat: "active" },
  { en: "ride a bike",        koVerb: "자전거를 탈 거야",       emoji: "🚴", place: false, cat: "active" },
  { en: "learn to swim",      koVerb: "수영을 배울 거야",       emoji: "🏊", place: false, cat: "active" },
  { en: "play soccer",        koVerb: "축구를 할 거야",         emoji: "⚽", place: false, cat: "active" },
  { en: "play badminton",     koVerb: "배드민턴을 칠 거야",     emoji: "🏸", place: false, cat: "active" },
  { en: "go rollerblading",   koVerb: "인라인을 탈 거야",       emoji: "🛼", place: false, cat: "active" },
  { en: "learn to skateboard", koVerb: "스케이트보드를 배울 거야", emoji: "🛹", place: false, cat: "active" },
  // 🏖️ 나들이·여행
  { en: "go to the beach",    koVerb: "해변에 갈 거야",         emoji: "🏖️", place: true,  cat: "trip" },
  { en: "visit my grandpa",   koVerb: "할아버지를 찾아뵐 거야", emoji: "👴", place: true,  cat: "trip" },
  { en: "join a science camp", koVerb: "과학 캠프에 참가할 거야", emoji: "🔬", place: true,  cat: "trip" },
  { en: "go to a water park", koVerb: "워터파크에 갈 거야",     emoji: "💦", place: true,  cat: "trip" },
  { en: "go to an amusement park", koVerb: "놀이공원에 갈 거야", emoji: "🎢", place: true,  cat: "trip" },
  { en: "take photos at a photo booth", koVerb: "인생네컷을 찍을 거야", emoji: "📸", place: true, cat: "trip" },
  { en: "go camping",         koVerb: "캠핑을 갈 거야",         emoji: "🏕️", place: true,  cat: "trip" },
  { en: "travel to Jeju",     koVerb: "제주도로 여행 갈 거야",  emoji: "✈️", place: true,  cat: "trip" },
  // 🎮 놀이·취미
  { en: "read many books",    koVerb: "책을 많이 읽을 거야",    emoji: "📚", place: false, cat: "home" },
  { en: "watch movies",       koVerb: "영화를 볼 거야",         emoji: "🎬", place: false, cat: "home" },
  { en: "play computer games", koVerb: "컴퓨터 게임을 할 거야", emoji: "🎮", place: false, cat: "home" },
  { en: "play phone games",   koVerb: "폰 게임을 할 거야",      emoji: "📱", place: false, cat: "home" },
  { en: "eat tteokbokki",     koVerb: "떡볶이를 먹을 거야",     emoji: "🍢", place: false, cat: "home" },
  { en: "sing at a singing room", koVerb: "노래방에서 노래할 거야", emoji: "🎤", place: true, cat: "home" },
  { en: "eat bingsu",         koVerb: "빙수를 먹을 거야",       emoji: "🍧", place: false, cat: "home" },
  { en: "watch YouTube",      koVerb: "유튜브를 볼 거야",       emoji: "📺", place: false, cat: "home" },
  { en: "have a sleepover",   koVerb: "친구 집에서 잘 거야",    emoji: "🛌", place: true,  cat: "home" },
];

const BUILD_WHEN = [
  { en: "every day",    ko: "매일" },
  { en: "every morning", ko: "매일 아침" },
  { en: "on weekends",  ko: "주말마다" },
  { en: "after lunch",  ko: "점심을 먹고" },
  { en: "in the evening", ko: "저녁에" },
  { en: "on hot days",  ko: "더운 날에" },
];

const BUILD_WHERE = [
  { en: "at the park",    ko: "공원에서" },
  { en: "at home",        ko: "집에서" },
  { en: "in my room",     ko: "내 방에서" },
  { en: "at the library", ko: "도서관에서" },
  { en: "at a cafe",      ko: "카페에서" },
  { en: "at the pool",    ko: "수영장에서" },
];

const BUILD_WITH = [
  { en: "with my friends", ko: "친구들과" },
  { en: "with my family",  ko: "가족과" },
  { en: "with my mom",     ko: "엄마와" },
  { en: "with my dad",     ko: "아빠와" },
  { en: "with my brother", ko: "형이랑" },
  { en: "with my sister",  ko: "여동생과" },
];

/* ===== 단어 뜻 사전 ===== */
function wordKey(w) {
  return w.toLowerCase().replace(/^[^a-z']+/, "").replace(/[^a-z']+$/, "");
}

const WORD_MEANINGS = {
  "i'll": "나는 ~할 거야 (I will)",
  "i": "나는",
  "will": "~할 것이다",
  "to": "~에, ~으로, ~하기 위해",
  "do": "하다",
  "what": "무엇",
  "where": "어디에",
  "who": "누구",
  "you": "너, 너희",
  "this": "이, 이번",
  "summer": "여름",
  "vacation": "방학",
  "grow": "기르다, 키우다",
  "tomatoes": "토마토 (여러 개)",
  "make": "만들다",
  "cookies": "쿠키 (여러 개)",
  "slime": "슬라임",
  "bracelets": "팔찌 (여러 개)",
  "youtube": "유튜브",
  "video": "영상, 동영상",
  "webtoons": "웹툰",
  "draw": "(그림을) 그리다",
  "tablet": "태블릿",
  "post": "(인터넷에) 올리다",
  "online": "온라인에, 인터넷에",
  "pizza": "피자",
  "dinner": "저녁 식사",
  "show": "보여주다",
  "class": "반, 학급",
  "of": "~의",
  "beautiful": "아름다운",
  "places": "장소들",
  "learn": "배우다",
  "taekwondo": "태권도",
  "k-pop": "케이팝 (K-pop)",
  "kpop": "케이팝",
  "dance": "춤; 춤추다",
  "perform": "공연하다",
  "stage": "무대",
  "every": "매~, 모든",
  "day": "날, 하루",
  "become": "~이 되다",
  "stronger": "더 강한",
  "play": "(운동·게임을) 하다, 놀다",
  "soccer": "축구",
  "badminton": "배드민턴",
  "games": "게임 (여러 개)",
  "computer": "컴퓨터",
  "phone": "휴대폰, 폰",
  "with": "~와 함께",
  "my": "나의",
  "friends": "친구들",
  "friend's": "친구의",
  "at": "~에서, ~에",
  "park": "공원, ~파크",
  "after": "~후에",
  "lunch": "점심",
  "ride": "타다",
  "a": "하나의",
  "an": "하나의",
  "bike": "자전거",
  "rollerblading": "인라인스케이트 타기",
  "skateboard": "스케이트보드",
  "tricks": "기술, 묘기",
  "cool": "멋진; 시원한",
  "try": "시도하다, 도전하다",
  "race": "경주하다, 시합하다",
  "along": "~을 따라",
  "the": "그 (특정한 것)",
  "river": "강",
  "around": "~주변에",
  "lake": "호수",
  "on": "~에, ~위에",
  "weekends": "주말마다",
  "weekend": "주말",
  "swim": "수영하다",
  "dive": "다이빙하다, 뛰어들다",
  "into": "~안으로",
  "pool": "수영장",
  "afternoon": "오후",
  "brother": "형, 오빠, 남동생",
  "sister": "여동생, 누나, 언니",
  "myself": "나 자신, 혼자서",
  "family": "가족",
  "for": "~을 위해, ~동안",
  "dad": "아빠",
  "evening": "저녁",
  "go": "가다",
  "beach": "해변, 바닷가",
  "water": "물; (water park) 워터파크",
  "amusement": "놀이 (amusement park: 놀이공원)",
  "roller": "롤러 (roller coaster: 롤러코스터)",
  "coaster": "(roller coaster) 롤러코스터",
  "slides": "미끄럼틀, 슬라이드",
  "big": "큰",
  "and": "그리고",
  "build": "쌓다, 짓다",
  "sandcastle": "모래성",
  "photo": "사진",
  "photos": "사진들",
  "booth": "부스, 작은 공간",
  "take": "(사진을) 찍다, 가져가다",
  "pictures": "사진, 그림",
  "keep": "보관하다, 간직하다",
  "album": "앨범, 사진첩",
  "visit": "방문하다, 찾아뵙다",
  "grandpa": "할아버지",
  "country": "시골, 나라",
  "help": "돕다",
  "him": "그를",
  "farm": "농장",
  "join": "참가하다, 함께하다",
  "science": "과학",
  "camp": "캠프, 야영",
  "camping": "캠핑",
  "new": "새로운",
  "mountains": "산",
  "watch": "보다, 지켜보다",
  "stars": "별들",
  "night": "밤",
  "travel": "여행하다",
  "jeju": "제주(도)",
  "by": "~로, ~을 타고",
  "plane": "비행기",
  "climb": "오르다",
  "mt.": "~산 (mountain)",
  "halla": "한라(산)",
  "read": "읽다",
  "many": "많은",
  "books": "책 (여러 권)",
  "book": "책",
  "reports": "보고서, 독후감",
  "write": "쓰다, 적다",
  "movies": "영화 (여러 편)",
  "popcorn": "팝콘",
  "cousin": "사촌",
  "eat": "먹다",
  "tteokbokki": "떡볶이",
  "gimbap": "김밥",
  "sing": "노래하다",
  "singing": "노래 부르기 (singing room: 노래방)",
  "room": "방, ~방",
  "bingsu": "빙수",
  "stay": "머무르다, 지내다",
  "up": "(stay up) 안 자고 깨어 있다",
  "late": "늦게",
  "high": "높은 (high score: 최고 점수)",
  "score": "점수",
  "beat": "이기다, (기록을) 깨다",
  "hot": "더운, 뜨거운",
  "sleepover": "친구 집에서 자고 노는 것",
  "house": "집",
  "home": "집, 집에",
  "cafe": "카페",
  "library": "도서관",
  "garden": "정원, 텃밭",
  "mom": "엄마",
  "rainy": "비가 오는",
  "days": "날들",
  "two": "둘, 2",
  "weeks": "주 (여러 주)",
  "all": "모든, 내내",
  "long": "긴, 오래",
  "fun": "재미있는; 재미",
  "it": "그것",
  "them": "그것들을",
  "give": "주다",
  "morning": "아침",
  "share": "나누다, 함께 쓰다",
  "in": "~안에, ~에",
};

/* =========================================================
 * 🚀 도전 미션 (심화) — 나만의 문장 4개를 완성한 학생이 푸는 더 어려운 문장
 *  - and 로 두 활동 잇기 / because 로 이유 붙이기 / 길게 늘이기
 * ========================================================= */
const CHALLENGE_SENTENCES = [
  { en: "I'll go to the beach and swim with my friends.", ko: "나는 해변에 가서 친구들과 수영할 거야.", emoji: "🏖️", imgPrompt: "kids swimming at the beach with friends in summer" },
  { en: "I'll read many books because I love stories.", ko: "나는 이야기를 좋아해서 책을 많이 읽을 거야.", emoji: "📚", imgPrompt: "a happy child reading many storybooks" },
  { en: "I'll join a science camp and learn about robots.", ko: "나는 과학 캠프에 참여해서 로봇에 대해 배울 거야.", emoji: "🤖", imgPrompt: "kids learning about robots at a science camp" },
  { en: "I'll grow tomatoes and water them every day.", ko: "나는 토마토를 길러서 매일 물을 줄 거야.", emoji: "🍅", imgPrompt: "a child watering tomato plants in a garden" },
  { en: "I'll visit my grandpa and help him on the farm.", ko: "나는 할아버지를 찾아가서 농장 일을 도울 거야.", emoji: "👴", imgPrompt: "a child helping grandpa on a farm in summer" },
  { en: "I'll learn taekwondo because I want to be strong.", ko: "나는 강해지고 싶어서 태권도를 배울 거야.", emoji: "🥋", imgPrompt: "a kid practicing taekwondo, strong and happy" },
  { en: "I'll go to a water park and ride the big slide.", ko: "나는 워터파크에 가서 큰 미끄럼틀을 탈 거야.", emoji: "🛝", imgPrompt: "kids riding a big water slide at a water park" },
  { en: "I'll make a photo book to remember my summer.", ko: "나는 여름을 기억하려고 사진 책을 만들 거야.", emoji: "📸", imgPrompt: "a child making a summer photo book with pictures" }
];
