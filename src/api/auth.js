import { API_BASE_URL } from './config.js'
import { clearAccessToken, request, setAccessToken } from './client.js'
import { toSession } from './mappers.js'

/**
 * 로그인 · 회원가입 · 세션
 *
 * 로그인 · 회원가입 · 재발급은 모두 같은 모양으로 답합니다.
 *   LoginResponse { accessToken, tokenType }
 * 그리고 리프레시 토큰은 본문이 아니라 쿠키(Set-Cookie)로 따라옵니다.
 *
 * 액세스 토큰은 client.js 의 setAccessToken 에 넣어 둡니다.
 */

/**
 * 로그인
 *
 *   POST /api/public/auth/login
 *   보내는 것 { email, password }
 *   응답 LoginResponse   (틀리면 401 + { message: "인증에 실패했습니다." })
 */
export async function login({ email, password }) {
  const res = await request('/api/public/auth/login', { method: 'POST', body: { email, password } })
  setAccessToken(res.accessToken)
  return res
}

/**
 * 회원가입
 *
 *   POST /api/public/auth/signup
 *   보내는 것 { email, password, nickname }
 *   응답 201 LoginResponse   (가입하면 바로 로그인된 상태가 됩니다)
 *
 * 이메일 · 닉네임이 겹치면 409 + { message } 입니다.
 */
export async function signup({ email, password, nickname }) {
  const res = await request('/api/public/auth/signup', { method: 'POST', body: { email, password, nickname } })
  setAccessToken(res.accessToken)
  return res
}

/**
 * 액세스 토큰 재발급
 *
 *   POST /api/public/auth/refresh
 *   보내는 것 없음 — 브라우저가 리프레시 토큰 쿠키를 알아서 같이 보냅니다
 *   응답 LoginResponse (+ 새 쿠키)
 *
 * 쿠키가 없거나 만료됐으면 401 입니다. 그때는 로그인하지 않은 것으로 봅니다.
 * 이때 서버는 쓸 수 없는 쿠키를 지우라는 Set-Cookie 도 함께 보냅니다.
 * fetch 에 credentials: 'include' 가 있어야 쿠키가 따라갑니다.
 */
export async function refresh() {
  const res = await request('/api/public/auth/refresh', { method: 'POST' })
  setAccessToken(res.accessToken)
  return res
}

/**
 * 지금 로그인한 사람
 *
 *   GET /api/members/me
 *   응답 MemberMeResponse { id, email, nickname, role, createdAt, profile, socialAccounts }
 *
 * 로그인하지 않았으면 401 입니다.
 */
export async function fetchMe() {
  const res = await request('/api/members/me')
  return toSession(res)
}

/**
 * 닉네임 · 비밀번호 바꾸기
 *
 *   PUT /api/members/me
 *   보내는 것 MemberUpdateRequest { nickname, password }   (둘 다 바꿀 것만 보냅니다)
 *   응답 MemberPublicResponse { id, nickname, createdAt }
 */
export async function updateMe({ nickname, password }) {
  const res = await request('/api/members/me', { method: 'PUT', body: { nickname, password } })
  return { me: res.nickname }
}

/**
 * 로그아웃
 *
 *   POST /api/auth/logout
 *   응답 204 (+ 리프레시 토큰 쿠키를 지우는 Set-Cookie)
 *
 * 서버가 실패해도 화면은 로그아웃 상태로 갑니다. 손에 든 토큰은 지웁니다.
 */
export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
  return null
}

/**
 * 회원 탈퇴 (나 자신)
 *
 *   DELETE /api/members/me
 *   응답 204
 *
 * 서버는 이름 · 이메일 · 프로필을 지우고, 쓴 글을 모두 감추고, 리프레시 토큰도 지웁니다.
 * 손에 든 액세스 토큰도 다음 요청부터 통하지 않으므로 여기서 버립니다.
 */
export async function withdraw() {
  try {
    await request('/api/members/me', { method: 'DELETE' })
  } finally {
    clearAccessToken()
  }
  return null
}

/* ── 구글 로그인 ──────────────────────────────────────────────
 *
 * OAuth 는 fetch 로 할 수 없습니다. 브라우저를 그 주소로 보내야 합니다.
 *
 *   GET {서버}/oauth2/authorization/google    ← /api 로 시작하지 않습니다
 *
 * 구글에서 돌아오면 서버가 리프레시 토큰 쿠키를 심고 우리 화면으로 보냅니다.
 * 액세스 토큰은 주소창에 남지 않도록 주지 않습니다.
 * 그래서 돌아온 다음에 재발급(refresh)을 한 번 불러야 로그인 상태가 됩니다.
 */
export function socialAuthUrl(provider = 'google') {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`
}

export function startSocialAuth(provider = 'google') {
  window.location.href = socialAuthUrl(provider)
}
