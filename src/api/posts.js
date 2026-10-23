import { request } from "./client.js";
import { fromPost, toComment, toLikes, toPageInfo, toPost } from "./mappers.js";

/**
 * 글 · 좋아요 · 댓글
 *
 * 각 함수 안에 "← 이 줄" 이라고 표시한 줄이 하나씩 있습니다.
 * 그 줄에서 가짜 응답 대신 실제 서버를 부르면 연동이 끝납니다.
 * 위쪽 주석에 어떤 요청을 보내야 하는지 적어 뒀습니다.
 *
 * 함수가 돌려주는 모양
 *   목록 → { items: [글], page: { number, size, totalElements, totalPages, lastPage } }
 *   하나 → 글
 */

/**
 * 글 목록 (감춘 글 제외)
 *
 *   GET /api/public/posts?categoryId=&keyword=&pageNumber=&pageSize=&sortBy=id&sortOrder=desc
 *   응답 PageResponse<PostResponse> { content: [PostResponse], pageNumber, pageSize, totalElements, totalPages, lastPage }
 *
 * categoryId 와 keyword 는 안 보내면 조건이 없는 것입니다.
 * 거르는 일도 페이지를 끊는 일도 전부 서버가 합니다. 화면은 받은 것을 그대로 그립니다.
 *
 * 서버의 기본 정렬은 id 오름차순(오래된 글이 먼저)입니다.
 * 블로그 목록은 새 글이 위에 와야 하므로 sortOrder=desc 를 직접 보냅니다.
 *
 * 로그인하지 않아도 부를 수 있습니다.
 * 다만 토큰을 같이 보내면 isLiked 가 채워져 옵니다.
 */
export async function fetchPosts({ categoryId, keyword, pageNumber = 1, pageSize = 10 } = {}) {
  const query = { categoryId, keyword, pageNumber, pageSize, sortBy: "id", sortOrder: "desc" };
  const res = await request("/api/public/posts", { query });
  return { items: res.content.map(toPost), page: toPageInfo(res) };
}

/**
 * 글 하나
 *
 *   GET /api/public/posts/{postId}
 *   응답 PostResponse
 *
 * 없는 글이면 404 입니다. 감춘 글은 글쓴이 본인과 관리자에게만 보입니다.
 * 그래서 토큰이 실려 있어야 합니다. 첫 로딩(재발급)이 끝난 뒤에 부릅니다.
 */
export async function fetchPost(postId) {
  const res = await request(`/api/public/posts/${postId}`);
  return toPost(res);
}

/**
 * 새 글
 *
 *   POST /api/posts
 *   보내는 것 PostRequest { title, content, thumbnail, categoryId, isVisible }
 *   응답 201 PostResponse   (만들어진 글을 그대로 돌려줍니다)
 *
 * 돌려받은 글에 id 가 있으므로, 저장한 뒤 그 글의 상세 화면으로 바로 갈 수 있습니다.
 */
export async function createPost({ title, body, categoryId, hidden, thumbnail }) {
  const payload = fromPost({ title, body, categoryId, hidden, thumbnail });
  const res = await request("/api/posts", { method: "POST", body: payload });
  return toPost(res);
}

/**
 * 글 수정
 *
 *   PUT /api/posts/{postId}
 *   보내는 것 PostRequest
 *   응답 PostResponse
 *
 * 남의 글을 고치려 하면 403 입니다.
 */
export async function updatePost(postId, { title, body, categoryId, hidden, thumbnail }) {
  const payload = fromPost({ title, body, categoryId, hidden, thumbnail });
  const res = await request(`/api/posts/${postId}`, { method: "PUT", body: payload });
  return toPost(res);
}

/**
 * 글 삭제
 *
 *   DELETE /api/posts/{postId}
 *   응답 204, 본문 없음
 *
 * 댓글과 좋아요도 함께 지워집니다.
 */
export async function deletePost(postId) {
  await request(`/api/posts/${postId}`, { method: "DELETE" });
  return null;
}

/**
 * 좋아요
 *
 *   누를 때  POST   /api/posts/{postId}/likes   → 201 LikesResponse { likesCount, liked }
 *   뗄 때    DELETE /api/posts/{postId}/likes   → 200 LikesResponse
 *
 * 화면이 스스로 세지 않고 서버가 알려준 숫자를 그대로 씁니다.
 */
export async function likePost(postId) {
  const res = await request(`/api/posts/${postId}/likes`, { method: "POST" });
  return toLikes(res);
}

export async function unlikePost(postId) {
  const res = await request(`/api/posts/${postId}/likes`, { method: "DELETE" });
  return toLikes(res);
}

/**
 * 댓글 목록
 *
 *   GET /api/public/posts/{postId}/comments?pageNumber=&pageSize=
 *   응답 PageResponse<CommentResponse> { content: [CommentResponse], ... }
 *
 * 글 상세 응답에는 댓글이 들어 있지 않습니다. 따로 받아 옵니다.
 * 감춘 글의 댓글은 이 주소로 받을 수 없습니다(404). 관리자는 admin.fetchAdminComments 를 씁니다.
 */
export async function fetchComments(
  postId,
  { pageNumber = 1, pageSize = 50 } = {},
) {
  const res = await request(`/api/public/posts/${postId}/comments`, {
    query: { pageNumber, pageSize },
  });
  return { items: res.content.map(toComment), page: toPageInfo(res) };
}

/**
 * 댓글 달기
 *
 *   POST /api/posts/{postId}/comments
 *   보내는 것 CommentRequest { content }
 *   응답 201 CommentResponse
 */
export async function createComment(postId, text) {
  const res = await request(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: { content: text },
  });
  return toComment(res);
}

/**
 * 댓글 고치기
 *
 *   PUT /api/comments/{commentId}
 *   보내는 것 CommentRequest { content }
 *   응답 200 CommentResponse
 *
 * 주소에 글 번호가 없습니다. 댓글 번호만으로 어느 댓글인지 정해지기 때문입니다.
 * 남의 댓글이면 403 입니다.
 */
export async function updateComment(commentId, text) {
  const res = await request(`/api/comments/${commentId}`, {
    method: "PUT",
    body: { content: text },
  });
  return toComment(res);
}

/**
 * 댓글 지우기
 *
 *   DELETE /api/comments/{commentId}
 *   응답 204, 본문 없음
 */
export async function deleteComment(commentId) {
  await request(`/api/comments/${commentId}`, { method: "DELETE" });
  return null;
}
