# 블로그 프런트 (React 19) — 연동 완성본

> 129~137장의 교체를 모두 마친 상태입니다. `src/data/mock.js` 가 없고, `api/` 의 함수가 전부 실제 서버를 부릅니다.

우리가 만든 블로그 API에 붙일 화면입니다.
**화면은 다 만들어져 있고, 서버를 부르는 자리만 비어 있습니다.**

지금은 서버 대신 `src/data/mock.js` 의 가짜 응답으로 돕니다.
그 가짜 응답은 **우리 API가 실제로 돌려주는 JSON과 같은 모양**입니다.
그래서 연동은 "함수 안의 한 줄을 바꾸는 일"이 됩니다.

```js
// 지금
const res = await mock.postPage({ pageNumber, pageSize })

// 바꾼 뒤
const res = await request('/api/public/posts', { query: { pageNumber, pageSize } })
```

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

서버를 붙일 때는 프로젝트 루트에 `.env.local` 을 만듭니다 (`.env.example` 복사).

```
VITE_API_BASE_URL=http://localhost:8080
```

`.env` 를 고치면 `npm run dev` 를 다시 띄워야 반영됩니다.

프런트는 5173, 서버는 8080 에서 각각 돕니다. 출처가 다르므로 **서버에서 CORS 를 열어 줘야**
합니다. 프록시는 쓰지 않습니다.

## 폴더

```
src/
  api/          서버를 부르는 자리 (여기만 고치면 됩니다)
    config.js     서버 주소
    client.js     fetch 한 겹 · 오류 · 액세스 토큰 보관
    mappers.js    서버 응답 ↔ 화면이 쓰는 모양
    posts.js      글 · 좋아요 · 댓글
    auth.js       로그인 · 회원가입 · 세션 · 구글 로그인
    profile.js    프로필 · 내가 쓴 글 · 다른 사람의 프로필
    admin.js      카테고리 · 회원 · 전체 게시글 · 감춘 글의 댓글
    files.js      이미지 올리기
    index.js      모아서 내보내는 곳
  data/mock.js  가짜 응답 (연동이 끝나면 지워도 됩니다)
  store/        화면 상태 한 곳 (useReducer)
  pages/        화면 하나당 파일 하나
  components/   여러 화면이 같이 쓰는 조각
  ui.js         한 페이지에 몇 개를 보여 줄지 같은 화면 상수
```

**화면 코드(`pages/`)는 손대지 않습니다.** 고치는 곳은 `api/` 입니다.

## 화면과 주소

| 주소 | 화면 |
|---|---|
| `/` | 글 목록 (`?category=` `?page=`) |
| `/posts/:id` | 글 상세 · 좋아요 · 댓글 (고치기 · 지우기) |
| `/members/:id` | 다른 사람의 프로필 |
| `/write` · `/posts/:id/edit` | 새 글 · 글 수정 |
| `/login` · `/signup` | 로그인 · 회원가입 |
| `/mypage` · `/mypage/profile` | 마이페이지 · 프로필 수정 |
| `/admin/categories` · `/admin/members` · `/admin/posts` | 관리자 |

## 붙여야 하는 API

주소 앞에 `/api` 가 붙습니다. `/api/public/**` 은 로그인 없이 열리고,
나머지는 액세스 토큰이 있어야 하며, `/api/admin/**` 은 관리자만 부를 수 있습니다.

| 동작 | 메서드 · 경로 | 함수 |
|---|---|---|
| 카테고리 목록 | `GET /api/public/categories` | `admin.fetchCategories` |
| 글 목록 | `GET /api/public/posts` | `posts.fetchPosts` |
| 글 하나 | `GET /api/public/posts/{id}` | `posts.fetchPost` |
| 댓글 목록 | `GET /api/public/posts/{id}/comments` | `posts.fetchComments` |
| 로그인 | `POST /api/public/auth/login` | `auth.login` |
| 내 정보 | `GET /api/members/me` | `auth.fetchMe` |
| 회원가입 | `POST /api/public/auth/signup` | `auth.signup` |
| 로그아웃 | `POST /api/auth/logout` | `auth.logout` |
| 새 글 | `POST /api/posts` | `posts.createPost` |
| 글 수정 | `PUT /api/posts/{id}` | `posts.updatePost` |
| 글 삭제 | `DELETE /api/posts/{id}` | `posts.deletePost` |
| 좋아요 | `POST /api/posts/{id}/likes` | `posts.likePost` |
| 좋아요 취소 | `DELETE /api/posts/{id}/likes` | `posts.unlikePost` |
| 댓글 달기 | `POST /api/posts/{id}/comments` | `posts.createComment` |
| 댓글 고치기 | `PUT /api/comments/{id}` | `posts.updateComment` |
| 댓글 지우기 | `DELETE /api/comments/{id}` | `posts.deleteComment` |
| 토큰 재발급 | `POST /api/public/auth/refresh` | `auth.refresh` |
| 내가 쓴 글 | `GET /api/members/me/posts` | `profile.fetchMyPosts` |
| 프로필 저장 | `PUT /api/members/me/profile` | `profile.updateProfile` |
| 닉네임 변경 | `PUT /api/members/me` | `auth.updateMe` |
| 이미지 올리기 | `POST /api/files` (multipart) | `files.uploadImage` |
| 회원 정보(공개) | `GET /api/public/members/{id}` | `profile.fetchMember` |
| 프로필(공개) | `GET /api/public/members/{id}/profile` | `profile.fetchMemberProfile` |
| 카테고리 추가 | `POST /api/admin/categories` | `admin.createCategory` |
| 카테고리 수정 | `PUT /api/admin/categories/{id}` | `admin.renameCategory` |
| 카테고리 삭제 | `DELETE /api/admin/categories/{id}` | `admin.deleteCategory` |
| 전체 게시글 | `GET /api/admin/posts` | `admin.fetchAllPosts` |
| 감추기 · 공개 | `PATCH /api/admin/posts/{id}/visibility` | `admin.setPostHidden` |
| 감춘 글의 댓글 | `GET /api/admin/posts/{id}/comments` | `admin.fetchAdminComments` |
| 회원 목록 | `GET /api/admin/members` | `admin.fetchMembers` |
| 권한 변경 | `PATCH /api/admin/members/{id}/role` | `admin.setMemberRole` |
| 회원 탈퇴시키기 | `DELETE /api/admin/members/{id}` | `admin.deleteMember` |
| 회원 탈퇴 (나) | `DELETE /api/members/me` | `auth.withdraw` |
| 구글 로그인 | `GET /oauth2/authorization/google` | `auth.startSocialAuth` (바꿀 것 없음) |

바꿀 함수는 모두 33개입니다. 각 함수 위 주석에 요청 · 응답 모양이 적혀 있습니다.

### 목록 응답 봉투 (PageResponse)

목록은 모두 이 모양으로 옵니다.

```json
{
  "content": [ ... ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalElements": 42,
  "totalPages": 5,
  "lastPage": false
}
```

페이지 번호는 **1부터** 셉니다. 화면도 1부터 세므로 그대로 씁니다.
`pageSize` 는 100 을 넘을 수 없습니다. 봉투를 벗기는 일은 `mappers.toPageInfo` 가 합니다.

서버의 기본 정렬은 **id 오름차순(오래된 것이 먼저)** 입니다.
글 목록 · 내가 쓴 글 · 관리자 글 목록은 `sortBy=id&sortOrder=desc` 를 보내서 새 글을 위로 올립니다.

### 실패 응답 (ErrorResponse)

```json
{ "message": "게시글을 찾을 수 없습니다." }
{ "message": "입력값이 올바르지 않습니다.", "errors": { "title": "제목은 필수입니다." } }
```

`client.js` 가 `errors` 가 있으면 칸별 문구를, 없으면 `message` 를 오류 줄에 띄웁니다.

### 서버 이름 ↔ 화면 이름

이름이 다른 것만 적었습니다. 바꾸는 곳은 `mappers.js` 한 곳입니다.

| 서버 | 화면 | 비고 |
|---|---|---|
| `content` | `body` | 글 본문 |
| `isVisible` | `hidden` | **값이 반대** |
| `categoryName` | `category` | |
| `authorNickname` | `author` | |
| `createdAt` | `date` · `joined` | `'2026년 8월 30일'` |
| `likesCount` · `isLiked` | `likes` · `liked` | 글 응답 |
| `likesCount` · `liked` | `likes` · `liked` | 좋아요 응답 |
| `role` | `admin` | `'ADMIN'` 이면 `true` |
| `deletedAt` | `deleted` | 값이 있으면 탈퇴한 회원 |

`id` 는 서버가 숫자로 줍니다. 화면은 주소창 값(문자열)과 비교하므로 **문자열로 바꿔서**
들고 있다가, 보낼 때 `Number()` 로 되돌립니다. 이걸 안 하면 `1 === '1'` 이 `false` 라
상세 화면이 목록으로 튕깁니다.

## 할 일

1. `.env.local` 만들기
2. `api/` 의 함수에서 `mock...` 줄을 `request(...)` 로 바꾸기 (한 번에 하나씩, 화면을 보면서)
3. `client.js` 에서 액세스 토큰을 `Authorization` 헤더에 싣기
4. `client.js` 에서 401 을 만나면 재발급을 부르고 그 요청을 한 번 다시 보내기

3번을 하기 전에는 로그인이 필요한 화면이 401 로 막힙니다. 순서대로 가면 됩니다.

## 알아 둘 것

- **액세스 토큰은 자바스크립트 변수에 둡니다.** 새로고침하면 사라집니다.
  대신 리프레시 토큰이 쿠키로 남아 있어서, 앱이 켜질 때 재발급을 한 번 부르면
  로그인 상태가 돌아옵니다. `store/BlogContext.jsx` 의 첫 로딩이 그 일을 합니다.
- **쿠키를 주고받으려면** `fetch` 에 `credentials: 'include'` 가 있어야 하고,
  서버 CORS 에도 `allowCredentials(true)` 와 정확한 출처가 켜져 있어야 합니다.
- **리프레시 토큰은 한 번 쓰면 새것으로 바뀝니다.** 재발급을 동시에 두 번 부르면
  두 번째는 401 입니다. 그래서 첫 로딩은 한 번만 돌게 막아 두었습니다.
- **로그아웃하면 그 전에 받은 액세스 토큰도 바로 막힙니다.** 서버가 회원별로
  "이 시각 이전에 발급한 토큰은 받지 않는다"를 적어 둡니다.
- **만들고 고친 것은 서버가 돌려줍니다.** 새 글 · 댓글 · 카테고리 추가와 수정은 응답에
  만들어진 값이 들어 있어서 목록을 다시 받지 않습니다.
- **댓글은 글 응답에 들어 있지 않습니다.** 개수만 오고, 본문은 따로 받습니다.
- **감춘 글**은 글쓴이와 관리자만 볼 수 있습니다. 댓글 · 좋아요는 누구도 못 하고,
  댓글 목록은 관리자만 관리자용 주소로 봅니다.
- **이미지는 먼저 올리고 주소를 받습니다.** 그 주소를 글의 `thumbnail` 이나 프로필의
  `profileImage` 에 넣어 저장합니다. 이미지 주소는 로그인 없이 열립니다.
- **탈퇴는 지우지 않고 감춥니다.** 이름 · 이메일이 바뀌고 글이 모두 감춰지며, 관리자 회원 목록에는 남습니다.

## 아직 없는 것

- 글 고정(pinned) 기능이 서버에 없습니다. 목록의 "고정" 자리는 비어 있습니다.
- 작성자별 글 목록 API 가 없어서, 다른 사람의 프로필 화면에는 글 목록이 없습니다.
- 비밀번호 찾기 화면이 없습니다.
