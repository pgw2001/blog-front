/**
 * 서버 응답 ↔ 화면이 쓰는 모양
 *
 * 이름이 다른 필드는 여기서만 바꿉니다.
 * 화면 코드(pages/)는 아래 "화면 쪽 모양"만 알면 되고,
 * 서버 응답이 바뀌어도 이 파일만 고치면 됩니다.
 *
 * ┌── 서버와 화면의 이름 차이 ──────────────────────────────────┐
 * │ PostResponse.content          → body                       │
 * │ PostResponse.isVisible        → hidden   (값이 반대입니다)  │
 * │ PostResponse.categoryName     → category                   │
 * │ PostResponse.authorNickname   → author                     │
 * │ PostResponse.createdAt        → date ('2026년 8월 30일')    │
 * │ PostResponse.likesCount       → likes                      │
 * │ PostResponse.isLiked          → liked                      │
 * │ LikesResponse.likesCount      → likes                      │
 * │ LikesResponse.liked           → liked                      │
 * │ CommentResponse.content       → text                       │
 * │ MemberAdminResponse.role      → admin (true · false)       │
 * │ MemberAdminResponse.deletedAt → deleted (true · false)     │
 * │ ...createdAt                  → joined                     │
 * └────────────────────────────────────────────────────────────┘
 *
 * 좋아요 수는 글 응답(PostResponse)과 좋아요 응답(LikesResponse) 모두 likesCount 입니다.
 * 눌렀는지는 글 응답에서는 isLiked, 좋아요 응답에서는 liked 로 이름이 다릅니다.
 *
 * id 는 서버가 숫자(bigint)로 줍니다.
 * 화면은 주소창에서 꺼낸 문자열과 비교하므로 문자열로 바꿔서 들고 있다가,
 * 서버로 보낼 때 Number() 로 되돌립니다.
 * 이걸 안 하면 1 === '1' 이 false 라 상세 화면이 목록으로 튕깁니다.
 */

/* ── 목록 응답의 페이지 정보 ──────────────────────────────────
 *
 * 우리 서버의 목록 응답은 모두 이 모양입니다 (PageResponse).
 *
 *   {
 *     content: [ ... ],
 *     pageNumber: 1,        // 1부터 셉니다
 *     pageSize: 10,
 *     totalElements: 42,
 *     totalPages: 5,
 *     lastPage: false
 *   }
 *
 * 화면도 1부터 세므로 pageNumber 는 그대로 씁니다.
 */
export function toPageInfo(res) {
  return {
    number: res?.pageNumber ?? 1,
    size: res?.pageSize ?? 0,
    totalElements: res?.totalElements ?? 0,
    // 글이 하나도 없으면 서버가 0을 줍니다. 화면의 페이지 버튼은 최소 1쪽입니다
    // 서버 PageResponse 가 totalPage · LastPage 로 보내고 있어 두 이름을 다 받습니다
    totalPages: Math.max(1, res?.totalPages ?? 1),
    lastPage: res?.lastPage ?? res?.LastPage ?? true,
  };
}

export const emptyPage = {
  number: 1,
  size: 0,
  totalElements: 0,
  totalPages: 1,
  lastPage: true,
};

/* ── 날짜 ─────────────────────────────────────────────────── */

/** '2026-08-30T10:00:00.123456' → '2026년 8월 30일' */
export function toKoreanDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/* ── 글 ───────────────────────────────────────────────────── */

/** PostResponse → 화면이 쓰는 글 */
export function toPost(dto) {
  if (!dto) return null;
  return {
    id: String(dto.id),
    title: dto.title ?? "",
    body: dto.content ?? "",
    category: dto.categoryName ?? "",
    categoryId: dto.categoryId == null ? "" : String(dto.categoryId),
    author: dto.authorNickname ?? "",
    authorId: dto.authorId == null ? "" : String(dto.authorId),
    date: toKoreanDate(dto.createdAt),
    hidden: dto.isVisible === false,
    thumbnail: dto.thumbnail ?? null,

    likes: dto.likesCount ?? 0,
    liked: dto.isLiked === true,
    // 댓글은 글 응답에 들어 있지 않습니다. 개수만 옵니다.
    // 댓글 본문은 따로 받습니다 (GET /api/public/posts/{id}/comments).
    commentCount: dto.commentCount ?? 0,

    // 우리 서버에는 고정(pinned) 기능이 없습니다.
    // 만들고 싶다면 POST 테이블에 컬럼을 하나 추가하는 것부터 시작하면 됩니다.
    pinned: false,
  };
}

/**
 * 화면 → PostRequest (새 글 · 수정)
 *
 * isVisible 을 빠뜨리면 안 됩니다. 수정할 때 늘 true 를 보내면
 * 숨겨 둔 글이 저장하는 순간 공개로 바뀝니다. 화면이 들고 있는 값을 그대로 돌려보냅니다.
 */
export function fromPost({
  title,
  body,
  categoryId,
  hidden = false,
  thumbnail = null,
}) {
  return {
    title,
    content: body,
    thumbnail: thumbnail || null,
    categoryId: Number(categoryId),
    isVisible: !hidden,
  };
}

/** LikesResponse → 좋아요 버튼이 쓰는 값 */
export function toLikes(dto) {
  return {
    likes: dto?.likesCount ?? 0,
    liked: dto?.liked === true,
  };
}

/* ── 댓글 ─────────────────────────────────────────────────── */

/** CommentResponse → 화면이 쓰는 댓글 */
export function toComment(dto) {
  if (!dto) return null;
  return {
    id: String(dto.id),
    text: dto.content ?? "",
    author: dto.authorNickname ?? "",
    // 내 댓글에만 수정 · 삭제 버튼을 달 때 씁니다
    authorId: dto.authorId == null ? "" : String(dto.authorId),
    date: toKoreanDate(dto.createdAt),
  };
}

/* ── 카테고리 ─────────────────────────────────────────────── */

/** CategoryResponse → 화면이 쓰는 카테고리 */
export function toCategory(dto) {
  if (!dto) return null;
  return {
    id: String(dto.id),
    name: dto.name ?? "",
    // 관리자 화면의 "글 N개"와 삭제 잠금에 씁니다
    postCount: dto.postCount ?? 0,
  };
}

/* ── 회원 ─────────────────────────────────────────────────── */

/** 'ADMIN' 인지. 서버는 role 을 문자열로 줍니다. */
export function isAdminRole(role) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

/**
 * MemberAdminResponse → 관리자 회원 목록의 한 줄
 * @param {object} dto
 * @param {string} myId  지금 로그인한 사람의 id (본인 줄은 권한을 못 내립니다)
 */
export function toMember(dto, myId) {
  if (!dto) return null;
  return {
    id: String(dto.id),
    name: dto.nickname ?? "",
    mail: dto.email ?? "",
    joined: toKoreanDate(dto.createdAt),
    admin: isAdminRole(dto.role),
    // 탈퇴한 회원도 목록에 남습니다. 이름과 이메일은 서버가 지워 둔 값입니다
    deleted: dto.deletedAt != null,
    self: myId !== undefined && String(dto.id) === String(myId),
    postCount: dto.postCount ?? 0,
  };
}

/**
 * MemberPublicResponse + ProfileResponse → 다른 사람의 프로필 화면
 *
 *   GET /api/public/members/{id}          { id, nickname, createdAt }
 *   GET /api/public/members/{id}/profile  { memberId, nickname, bio, profileImage, snsLink }
 */
export function toPublicProfile(member, profile) {
  return {
    id: String(member?.id ?? profile?.memberId ?? ""),
    name: member?.nickname ?? profile?.nickname ?? "",
    joined: toKoreanDate(member?.createdAt),
    bio: profile?.bio ?? "",
    snsLink: profile?.snsLink ?? "",
    profileImage: profile?.profileImage ?? null,
  };
}

/**
 * MemberMeResponse → 화면이 쓰는 "지금 로그인한 사람"
 *
 * 서버 응답:
 *   {
 *     id, email, nickname, role, createdAt,
 *     profile: { memberId, nickname, bio, profileImage, snsLink },
 *     socialAccounts: [{ provider }]
 *   }
 *
 * 프로필을 아직 입력하지 않았으면 bio · profileImage · snsLink 가 null 인 빈 프로필이 옵니다.
 */
export function toSession(dto) {
  if (!dto) return null;
  const profile = dto.profile ?? {};
  const social = dto.socialAccounts ?? [];

  return {
    memberId: String(dto.id ?? ""),
    me: dto.nickname ?? "",
    email: dto.email ?? "",
    admin: isAdminRole(dto.role),
    joined: toKoreanDate(dto.createdAt),

    bio: profile.bio ?? "",
    snsLink: profile.snsLink ?? "",
    profileImage: profile.profileImage ?? null,

    // 소셜 계정이 여러 개일 수 있습니다. 화면은 하나만 보여 주므로 첫 번째를 씁니다.
    // 서버는 'GOOGLE' 처럼 대문자로 줍니다. 이메일로 가입했으면 빈 배열이라 'local' 이 됩니다.
    provider: social[0]?.provider?.toLowerCase() ?? "local",
  };
}

/**
 * 화면 → ProfileRequest (프로필 저장)
 *
 * 빈 문자열을 보내면 서버가 "지운다"는 뜻(null)으로 바꿔 저장합니다.
 */
export function fromProfile({ bio, profileImage, snsLink }) {
  return {
    bio: bio ?? "",
    profileImage: profileImage ?? "",
    snsLink: snsLink ?? "",
  };
}
