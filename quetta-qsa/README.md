# QSA — QUETTA 교무 시스템

교무 전용 웹앱들을 하나로 묶는 셸입니다. 지금은 0단계(기반)로, 로그인·허용목록·보안 규칙·홈 화면만 들어 있습니다.

소유 계정은 **공용 업무 계정(knkscampusk)** 입니다. Firebase 프로젝트와 GitHub 레포 모두 이 계정으로 만들고, 직원 개인 계정은 로그인 사용자(허용목록)로만 추가합니다.

## 파일 구성

```
index.html          셸 (로그인, 사이드바, 메뉴 이동)
core/config.js      Firebase 웹 설정값, 메뉴 목록, 연결 프로젝트
core/firebase.js    Firebase 초기화 (SDK 10.12.2)
core/auth.js        Google 로그인, 허용목록 확인, 연결 프로젝트 로그인
core/router.js      모듈 지연 로딩, 메뉴 이탈 시 구독 자동 해제
core/ui.css         QUETTA 디자인 토큰
modules/home.js     홈 (모듈 작성 예시)
firestore.rules     보안 규칙
```

## 처음 설정 (공용 계정으로 진행)

1. **Firebase 프로젝트 만들기**
   Firebase 콘솔에서 새 프로젝트 `quetta-qsa` 를 만듭니다. Google 애널리틱스는 꺼도 됩니다.

2. **Google 로그인 켜기**
   Authentication > 로그인 방법 > Google 사용 설정. 다른 로그인 방법(익명, 이메일)은 켜지 않습니다.

3. **Firestore 만들기**
   Firestore Database > 데이터베이스 만들기 > 위치 `asia-northeast3 (서울)`, **프로덕션 모드**로 시작합니다. 위치는 나중에 바꿀 수 없습니다.

4. **보안 규칙 배포**
   Firestore > 규칙 탭에 `firestore.rules` 내용을 붙여넣고 게시합니다. 게시 전에 `if true` 가 없는지 한 번 더 확인하세요.

5. **허용목록 등록**
   Firestore > 데이터에서 컬렉션 `qsa_admins` 를 만들고, 교무 직원마다 문서를 하나씩 추가합니다.
   - 문서 ID: 직원 Google 이메일 **소문자** (예: `hong@gmail.com`)
   - 필드: `name` (문자열, 이름) 정도만 넣으면 됩니다.
   - 직원이 바뀌면 문서를 지우는 것만으로 접근이 막힙니다.

6. **웹 앱 등록 → 설정값 붙여넣기**
   프로젝트 설정 > 내 앱 > 웹 앱 추가 후 나오는 값을 `core/config.js` 의 `firebaseConfig` 에 붙여넣습니다.

7. **GitHub Pages 배포**
   공용 GitHub 계정(knkscampusk-web)에 레포 `quetta-qsa` 를 만들고 파일을 올린 뒤, Settings > Pages 에서 main 브랜치로 배포합니다.
   주소: `https://knkscampusk-web.github.io/quetta-qsa/`

8. **도메인 제한 (중요)**
   - Authentication > 설정 > 승인된 도메인에 `knkscampusk-web.github.io` 추가
   - Google Cloud 콘솔 > API 및 서비스 > 사용자 인증 정보 > 브라우저 키 > 애플리케이션 제한사항을 **HTTP 리퍼러**로 바꾸고 아래 두 개만 허용
     - `https://knkscampusk-web.github.io/*`
     - `https://quetta-qsa.firebaseapp.com/*`

## 내 PC에서 확인하기

`index.html` 을 더블클릭(file://)으로 열면 동작하지 않습니다. 여러 파일로 나뉜 구조라 브라우저가 막기 때문입니다. 아래 중 하나로 여세요.

- **GitHub Pages 주소로 열기** (가장 간단)
- **로컬 서버로 열기:** 이 폴더에서 명령 프롬프트를 열고 `python -m http.server 8000` 실행 후 `http://localhost:8000` 접속
  (Python 이 없으면 VS Code 의 Live Server 확장으로 열어도 됩니다)
- 로컬에서 Google 로그인까지 하려면 Authentication > 승인된 도메인에 `localhost` 가 있어야 합니다(기본 포함).

## 확인 순서

- 허용목록에 있는 계정 → 홈 화면, "내 접속 기록"에 시각 표시
- 허용목록에 없는 계정 → 로그인 화면으로 돌아오며 "허용목록에 없습니다" 안내
- "권한을 확인하지 못했습니다" 가 뜨면 4번(규칙 게시)을 확인

## 보안 원칙

- `allow read, write: if true` 금지. 규칙에 적지 않은 경로는 전부 차단돼 있습니다.
- 화면의 허용목록 확인은 안내용이고, 실제 차단은 보안 규칙이 합니다.
- 허용목록은 앱에서 수정할 수 없고 콘솔에서만 관리합니다.
- `core/config.js` 의 웹 설정값 외에 비밀 키(paffy API, Supabase service key, GitHub 토큰 등)는 코드에 넣지 않습니다. 필요하면 GitHub Actions Secrets 에만 둡니다.
- PIN·비밀번호를 화면 코드에서 비교하는 방식은 쓰지 않습니다(코드를 보면 다 보입니다).

## 새 모듈 추가하는 법 (1단계부터)

1. `modules/이름.js` 를 만들고 `export async function mount(el, ctx)` 를 구현합니다.
   `ctx` 에는 `db`, `auth`, `user`, `track` 이 들어 있습니다.
2. `onSnapshot` 의 해제 함수는 반드시 `ctx.track(unsub)` 으로 넘깁니다. 메뉴를 떠나면 자동 해제됩니다.
3. 컬렉션 전체를 실시간 구독하지 말고, 필요한 범위만(`where`, `limit`) 읽습니다.
4. `core/config.js` 의 `menu` 에서 해당 항목에 `loader` 를 넣고 `ready: true` 로 바꿉니다.
5. `firestore.rules` 에 그 모듈의 컬렉션을 `isQsaAdmin()` 조건으로 추가하고 다시 게시합니다.
