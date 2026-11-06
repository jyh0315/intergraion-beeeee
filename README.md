# ∫ 적분 배틀 (Integration Bee)

친구와 실시간으로 겨루는 적분 대결 사이트. GitHub Pages + Firebase Realtime Database.

- 난이도: 쉬움 / 보통 / 어려움 (각 15~16문제, 정답은 수치적분으로 검증)
- 방 만들기 → 초대 링크 공유 → 최대 8명 대결
- 먼저 정답을 맞힌 사람이 1점, 오답은 2초 동안 재제출 금지
- 혼자 연습 모드 (Firebase 없이도 동작)

## 설정

1. **Firebase 웹 앱 설정값** → `firebase-config.js`에 `apiKey`, `messagingSenderId`, `appId` 입력
   (콘솔 ⚙️ 프로젝트 설정 → 일반 → 내 앱 → 웹 앱 `</>` 추가)
2. **익명 로그인 켜기**: Authentication → 로그인 방법 → 익명 → 사용 설정
3. **Realtime Database 규칙**: `database.rules.json` 내용을 Realtime Database → 규칙 탭에 붙여넣고 게시
4. **승인된 도메인**: Authentication → 설정 → 승인된 도메인에 `jyh0315.github.io` 추가
5. **GitHub Pages**: Settings → Pages → Source: Deploy from a branch, `main` / `(root)`

## 답 입력

`pi/4`, `ln2`, `e-1`, `sqrt(pi)/2`, `pi^2/6`, `2pi/sqrt3` 처럼 정확한 값으로 입력. `π`, `√` 기호도 됩니다.
소수 근삿값(0.7854 등)은 인정되지 않습니다.

## 문제 추가

`problems.js`의 해당 난이도 배열에 `{ tex, ans, ansTex }` 추가.
