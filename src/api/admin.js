import { request } from "./client.js";
import { toCategory, toComment, toMember, toPageInfo, toPost } from "./mappers.js";

/**
 * 카테고리 · 회원 · 전체 게시글
 *
 * /api/admin/** 은 관리자만 부를 수 있습니다. 서버가 막습니다.
 * 화면에서 버튼을 숨기는 건 막는 게 아닙니다.
 */

/* ── 카테고리 ─────────────────────────────────────────────── */

/**
 * 카테고리 목록
 *
 *   GET /api/public/categories?pageNumber=&pageSize=&sortBy=id&sortOrder=asc
 *   응답 PageResponse<CategoryResponse> { content: [CategoryResponse { id, name, postCount }], ... }
 *
 * 글 목록의 필터와 글쓰기 화면에서도 쓰므로 로그인 없이 열립니다.
 * 그래서 /api/admin 아래가 아닙니다.
 * pageSize 는 100 을 넘을 수 없습니다(넘으면 400).
 */
export async function fetchCategories({ pageNumber = 1, pageSize = 100 } = {}) {
  const res = await request("/api/public/categories", {
    query: { pageNumber, pageSize },
  });
  return { items: res.content.map(toCategory), page: toPageInfo(res) };
}

/**
 * 카테고리 추가
 *
 *   POST /api/admin/categories
 *   보내는 것 CategoryRequest { name }   (10자 이하)
 *   응답 201 CategoryResponse { id, name, postCount }
 *
 * 이름이 겹치면 409 입니다. 대소문자만 다른 이름도 같은 이름으로 봅니다.
 * 만들어진 카테고리를 돌려받으므로 목록을 다시 받지 않고 그대로 더합니다.
 */
export async function createCategory(name) {
  const res = await request("/api/admin/categories", { method: "POST", body: { name } });
  return toCategory(res);
}

/**
 * 카테고리 이름 바꾸기
 *
 *   PUT /api/admin/categories/{categoryId}
 *   보내는 것 CategoryRequest { name }
 *   응답 200 CategoryResponse
 */
export async function renameCategory(categoryId, name) {
  const res = await request(`/api/admin/categories/${categoryId}`, {
    method: "PUT",
    body: { name },
  });
  return toCategory(res);
}

/**
 * 카테고리 삭제
 *
 *   DELETE /api/admin/categories/{categoryId}
 *   응답 204   (글이 남아 있으면 409)
 */
export async function deleteCategory(categoryId) {
  await request(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
  return null;
}

/* ── 회원 ─────────────────────────────────────────────────── */

/**
 * 회원 목록 (탈퇴한 회원 포함)
 *
 *   GET /api/admin/members?pageNumber=&pageSize=&sortBy=id&sortOrder=asc
 *   응답 PageResponse<MemberAdminResponse> { content: [{ id, email, nickname, role, createdAt, deletedAt, postCount }], ... }
 *
 * @param {string} myId 지금 로그인한 사람의 id — 본인 줄에 '본인' 표를 답니다
 */
export async function fetchMembers({
  myId,
  pageNumber = 1,
  pageSize = 10,
} = {}) {
  const res = await request("/api/admin/members", { query: { pageNumber, pageSize } });
  return {
    items: res.content.map((m) => toMember(m, myId)),
    page: toPageInfo(res),
  };
}

/**
 * 회원 권한 바꾸기
 *
 *   PATCH /api/admin/members/{memberId}/role
 *   보내는 것 MemberRoleRequest { role: 'ADMIN' | 'USER' }
 *   응답 MemberAdminResponse
 *
 * 자기 자신은 내릴 수 없고, 마지막 관리자도 내릴 수 없습니다 → 400 + { message }
 */
export async function setMemberRole(memberId, admin) {
  const res = await request(`/api/admin/members/${memberId}/role`, {
    method: "PATCH",
    body: { role: admin ? "ADMIN" : "USER" },
  });
  return {
    id: String(res.id),
    admin: String(res.role).toUpperCase() === "ADMIN",
  };
}

/**
 * 회원 탈퇴시키기
 *
 *   DELETE /api/admin/members/{memberId}
 *   응답 204
 *
 * 지우지 않고 탈퇴 처리합니다. 이름은 '탈퇴한회원_번호', 이메일은 'deleted_번호@deleted.local' 이 되고
 * 그 회원의 글은 모두 감춰집니다. 마지막 관리자는 탈퇴시킬 수 없습니다 → 400
 */
export async function deleteMember(memberId) {
  await request(`/api/admin/members/${memberId}`, { method: "DELETE" });
  return null;
}

/* ── 전체 게시글 ──────────────────────────────────────────── */

/**
 * 관리자용 전체 게시글 (감춘 글 포함)
 *
 *   GET /api/admin/posts?pageNumber=&pageSize=&sortBy=id&sortOrder=desc
 *   응답 PageResponse<PostResponse>
 *
 * 읽는 쪽 GET /api/public/posts 는 감춘 글을 빼야 하고 이건 다 줘야 합니다.
 * 그래서 주소를 나눠 뒀습니다.
 */
export async function fetchAllPosts({ pageNumber = 1, pageSize = 10 } = {}) {
  const query = { pageNumber, pageSize, sortBy: "id", sortOrder: "desc" };
  const res = await request("/api/admin/posts", { query });
  return { items: res.content.map(toPost), page: toPageInfo(res) };
}

/**
 * 글 감추기 · 다시 공개
 *
 *   PATCH /api/admin/posts/{postId}/visibility
 *   보내는 것 PostVisibilityRequest { isVisible: true | false }
 *   응답 PostResponse
 *
 * 화면은 hidden 으로 들고 있지만 서버로는 반대값(isVisible)을 보냅니다.
 */
export async function setPostHidden(postId, hidden) {
  const res = await request(`/api/admin/posts/${postId}/visibility`, {
    method: "PATCH",
    body: { isVisible: !hidden },
  });
  return toPost(res);
}

/**
 * 감춘 글의 댓글 (관리자)
 *
 *   GET /api/admin/posts/{postId}/comments?pageNumber=&pageSize=
 *   응답 PageResponse<CommentResponse>
 *
 * 공개 주소(/api/public/posts/{id}/comments)는 감춘 글이면 404 입니다.
 * 관리자는 이 주소로 감춘 글의 댓글까지 봅니다.
 */
export async function fetchAdminComments(postId, { pageNumber = 1, pageSize = 50 } = {}) {
  const res = await request(`/api/admin/posts/${postId}/comments`, {
    query: { pageNumber, pageSize },
  });
  return { items: res.content.map(toComment), page: toPageInfo(res) };
}
