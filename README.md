# 박규원의 가족여행

가족 여행의 일정, 장소·맛집, 준비물, 경비, 예약 정보를 휴대폰에서 같이 관리하는 웹앱이에요.
아케이드 게임 컨셉(STAGE, CLEAR, HP)에 가족마다 픽셀 캐릭터가 있어요.

- **Next.js 16** (App Router, Server Actions) — 프론트와 서버를 한 프로젝트에서
- **Firebase Firestore** — DB (무료 Spark 플랜으로 충분해요)
- **Vercel** — 호스팅 (무료 Hobby 플랜)

## 주요 기능

- 이름 + 비밀번호 로그인 (회원가입 없음, 관리자가 가족 계정을 한 사람당 하나씩 만들어요)
- 가족마다 캐릭터·색·역할(여러 개)
- 실시간 시계(한국·일본 시간)와 "지금 할 일 / 다음 일정"
- 날짜별 일정(STAGE), CLEAR 버튼 → 완료! 도장
- 장소·맛집: 구글 지도 **링크**와 **검색어** 둘 다 저장, 사진 링크, 가족별 "하고 싶은 것"
- 준비물 체크리스트, 경비 기록과 자동 정산(엔·원), 예약번호 복사, 일본 비상 연락처
- 모든 항목에 만든 사람·수정한 사람 표시
- 다른 가족이 고친 내용은 15초 안에 자동 반영

## 로컬에서 실행

```bash
npm install
npm run dev
```

http://localhost:3000 을 열면 처음 설정 화면이 나와요. 관리자 계정을 만들고, 가족 설정에서 가족을 추가하세요.
Firebase 환경 변수가 없으면 `.data/db.json` 파일에 저장돼요(개발용).

## 배포하기

### 1. Firebase (DB)

1. https://console.firebase.google.com 에서 프로젝트 만들기 (Google 애널리틱스는 꺼도 돼요)
2. 빌드 → **Firestore Database** → 데이터베이스 만들기 → 위치 `asia-northeast3 (서울)` → **프로덕션 모드**
3. Firestore → 규칙 탭에 이 저장소의 `firestore.rules` 내용을 붙여넣고 게시
4. 프로젝트 설정(톱니바퀴) → **서비스 계정** → **새 비공개 키 생성** → JSON 파일 다운로드
   - 이 파일은 비밀번호와 같아요. 저장소에 올리거나 공유하지 마세요.

### 2. Vercel (호스팅)

1. 이 저장소를 GitHub에 올리기
2. https://vercel.com → Add New → Project → 저장소 선택
3. Environment Variables 에 아래 값 입력 후 Deploy

| 이름 | 값 |
|---|---|
| `SESSION_SECRET` | `openssl rand -base64 32` 로 만든 랜덤 문자열 |
| `FIREBASE_PROJECT_ID` | JSON의 `project_id` |
| `FIREBASE_CLIENT_EMAIL` | JSON의 `client_email` |
| `FIREBASE_PRIVATE_KEY` | JSON의 `private_key` 전체 (`-----BEGIN ... END PRIVATE KEY-----\n` 포함) |

4. 배포된 주소로 들어가서 관리자 계정을 만들고, 가족을 추가한 뒤 주소와 각자 비밀번호를 알려주세요.
   휴대폰에서는 "홈 화면에 추가"를 하면 앱처럼 쓸 수 있어요.

## 구조

```
src/
  app/            페이지 (/, /login, /setup, /party, /trips/[id])
  actions/        서버 액션 (로그인, 가족, 여행 수정) — 모든 요청에서 로그인 확인
  components/     화면 (trip-app.tsx 가 여행 상세 전체)
  lib/            타입, 저장소(Firestore/로컬 파일), 세션, 검증, 픽셀 그림, 예시 데이터
```

여행 하나가 Firestore 문서 하나에 들어가 있어서(일정·장소·준비물·경비 포함) 읽기 횟수가 적고,
수정은 트랜잭션으로 처리해서 가족이 동시에 고쳐도 내용이 사라지지 않아요.
