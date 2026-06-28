# 6단원 · What will you do this summer?

5학년 영어 **6단원**(여름방학 계획 말하기) 학습용 웹앱입니다.
교과서의 6개 표현(`I'll grow tomatoes.` 등)뿐 아니라 **다양한 여름 활동**을
듣고·따라 말하며 익히고, **나만의 문장까지 직접 만들어 볼 수 있도록** 만들었습니다.
(5단원 *Let's ~* 페이지와 같은 구성, ☀️ 여름 테마 디자인)

## 기능

- ☀️ **할 일 말하기 (I'll ~)** — 초급·중급·고급 난이도 × 4가지 활동 종류
  (🌱 기르기·만들기 / 🏃 운동·배우기 / 🏖️ 나들이·여행 / 📚 집·취미), **종류마다 6문장씩, 총 72문장**
  - 교과서 6표현 모두 포함: grow tomatoes · join a science camp · go to the beach · read many books · learn taekwondo · visit my grandpa
- 📅 **때·장소 표현** — 언제(this summer, every day…) · 어디서(at the beach, at the park…)
- 🧩 **나만의 문장 만들기** — `할 일` + `때·장소`를 골라 문장을 조합
  - 어색한 조합(장소 중복 등)은 **맞는지 검사**해 알려주고, 올바른 문장은 **전체 문장 + 한글 번역 + 듣기(TTS)** 제공
  - 🎲 무작위 조합 버튼, ⭐로 연습 목록에 담기
- 🎤 **내 문장 연습** — ⭐로 담은 문장(고른 할 일 / 내가 만든 문장)을 마이크로 말하면 **발음 정확도** 측정 (Chrome 권장)
- 단어 클릭 시 **뜻 풍선 + 발음**, 말하기 **속도 조절** 슬라이더

브라우저 내장 **Web Speech API**(음성 합성·음성 인식)를 사용합니다.
선택한 문장과 연습 기록은 브라우저(localStorage)에 저장됩니다.

## 사용 방법

`index.html`을 브라우저(크롬 권장)에서 열면 됩니다. 별도 설치가 필요 없습니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 학생 화면 구조(탭·섹션 + 로그인 게이트) |
| `style.css`  | 디자인·여름 테마(+ 로그인/사용자바) |
| `data.js`    | 문장·표현·단어 뜻·문장 만들기 데이터 |
| `app.js`     | 음성·단어 풍선·문장 만들기·연습 채점 로직(+ 학습 행동 추적 훅) |
| `firebase-config.js` | Firebase 설정값 + 관리자 이메일(직접 입력) |
| `auth.js`    | 학생 구글 로그인 게이트·프로필 저장 |
| `tracker.js` | 학생 학습 행동을 Firestore에 실시간 기록 |
| `teacher.html` / `teacher.js` / `dashboard.css` | **선생님 전용 실시간 대시보드** |
| `firestore.rules` | 보안 규칙(학생은 본인만, 관리자만 전체 열람) |

## 🔥 학생 현황 대시보드 (Firebase) 설정 방법

학생들이 **구글 로그인**으로 접속하면 학습 행동이 Firebase에 실시간 저장되고,
**관리자(선생님) 구글 계정**으로 `teacher.html` 에 들어가면 학생들이 지금
무엇을 누르고·어떤 문장을 만들고·연습 정확도가 몇 %인지 실시간으로 볼 수 있습니다.

1. **Firebase 콘솔**(console.firebase.google.com)에서 프로젝트
   `OpenclassforSummervacation` 열기
2. **Authentication → Sign-in method → Google** 사용 설정
3. **Firestore Database** 만들기(프로덕션 모드)
4. **프로젝트 설정 → 내 앱 → 웹앱(</>) 추가** 후 나오는 `firebaseConfig` 값을
   `firebase-config.js` 의 `window.FIREBASE_CONFIG` 에 붙여넣기
   - `window.ADMIN_EMAIL` 에 선생님 구글 계정 이메일이 들어 있는지 확인
5. **Firestore 보안 규칙**에 `firestore.rules` 내용을 붙여넣고 게시(Publish)
   - 규칙 안의 관리자 이메일도 `firebase-config.js` 와 같게 맞춰주세요
6. 배포(Firebase Hosting 또는 GitHub Pages)한 뒤
   - 학생: `index.html` → 구글 로그인 → 학습
   - 선생님: 우측 상단 **📊 학생 대시보드** 또는 `teacher.html` 로 접속

> 처음 대시보드를 열면 활동 피드에 "색인(index)이 필요하다"는 안내가 보일 수 있어요.
> 브라우저 콘솔(F12)에 뜨는 링크를 한 번 눌러 색인을 만들면(`events` 컬렉션 그룹의
> `ts` 내림차순) 이후로는 바로 보입니다.

### 무엇이 기록되나
탭 이동 · 난이도/분류 변경 · 단어 뜻 찾기 · 문장 듣기 · 문장 조합(올바른/어색한) ·
연습목록 담기/빼기 · 발음 연습 정확도(최고/최근/횟수). 모든 기록은 학생 본인과
관리자만 볼 수 있습니다(보안 규칙). Firebase 미설정 시에도 앱은 기존처럼 동작합니다.
