import { API_BASE_URL } from './config.js'

/**
 * fetch 를 한 겹 감싼 것. api 폴더의 모든 함수가 이걸 씁니다.
 *
 * 서버 주소를 앞에 붙이고, 쿼리 문자열을 만들고, JSON 으로 보내고 받고,
 * 실패한 응답을 ApiError 로 바꿔 던집니다.
 */

/** 서버가 4xx · 5xx 로 답했을 때 던지는 오류입니다. */
export class ApiError extends Error {
  constructor(status, message, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/* ── 액세스 토큰 보관 ──────────────────────────────────────────
 *
 * 로그인 응답의 accessToken 을 여기에 둡니다.
 *
 * 왜 localStorage 가 아니라 변수인가:
 *   localStorage 에 둔 값은 이 페이지에서 도는 모든 스크립트가 읽을 수 있습니다.
 *   자바스크립트 변수는 새로고침하면 사라지지만, 그 대신 남의 스크립트가
 *   꺼내 갈 수 없습니다.
 *
 * 새로고침하면 로그아웃되는 것처럼 보이는 게 맞습니다.
 * 리프레시 토큰은 브라우저가 쿠키로 들고 있으니, 앱이 켜질 때 재발급을 한 번
 * 부르면 로그인 상태가 돌아옵니다. 그건 "액세스 토큰 재발급" 장에서 다룹니다.
 */
let accessToken = null

export function setAccessToken(token) {
  accessToken = token ?? null
}

export function getAccessToken() {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

/**
 * @param {string} path   '/api/public/posts' 처럼 앞에 슬래시를 붙인 경로
 * @param {object} [opts] { method, body, query }
 *   - body 는 객체 그대로 넘기면 JSON 으로 변환해서 보냅니다
 *     FormData 를 넘기면 그대로 보냅니다 (이미지 올리기)
 *   - query 는 값이 undefined · null · '' 인 항목을 빼고 붙입니다
 * @returns 응답 본문(JSON). 204 처럼 본문이 없으면 null
 */
export async function request(path, opts = {}) {
  const { method = 'GET', body, query } = opts

  let url = `${API_BASE_URL}${path}`
  if (query) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString()
    if (qs) url += `?${qs}`
  }

  // 파일은 JSON 이 아니라 multipart/form-data 로 갑니다.
  // 그때는 Content-Type 을 비워 둡니다. 브라우저가 경계 문자열(boundary)까지 붙여서 채웁니다.
  const isForm = body instanceof FormData
  const headers = isForm ? {} : { 'Content-Type': 'application/json' }

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const init = {
    method,
    headers,
    // 리프레시 토큰 쿠키를 같이 보내고 받으려면 이게 있어야 합니다.
    // 서버의 CORS 설정에도 allowCredentials(true) 가 켜져 있어야 합니다.
    credentials: 'include',
  }
  if (body !== undefined) init.body = isForm ? body : JSON.stringify(body)

  let res
  try {
    res = await fetch(url, init)
  } catch (e) {
    // 서버가 안 떠 있거나, CORS 에 막혔거나, 주소가 틀렸습니다.
    // 브라우저 콘솔에 진짜 이유가 찍혀 있습니다.
    throw new ApiError(0, `서버에 연결할 수 없습니다. (${url})`, { cause: e })
  }

  if (res.status === 401 && accessToken && !opts.retried && path !== REFRESH_PATH) {
    const ok = await tryRefresh()
    if (ok) return request(path, { ...opts, retried: true })
  }

  const text = await res.text()
  const data = text ? safeJson(text) : null

  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(data, res.status), data)
  }

  return data
}

/**
 * 우리 서버는 실패를 이 모양(ErrorResponse)으로 답합니다.
 *
 *   { "message": "게시글을 찾을 수 없습니다." }
 *   { "message": "입력값이 올바르지 않습니다.", "errors": { "title": "제목은 필수입니다." } }
 *
 * 입력값 검사에 걸리면 어느 칸이 왜 틀렸는지가 errors 에 들어 있습니다.
 * 그때는 "입력값이 올바르지 않습니다." 대신 칸별 문구를 이어서 보여 줍니다.
 */
function errorMessage(data, status) {
  const fieldMessages = data?.errors ? Object.values(data.errors) : []
  if (fieldMessages.length > 0) return fieldMessages.join(' ')
  return data?.message ?? `요청이 실패했습니다. (${status})`
}

const REFRESH_PATH = '/api/public/auth/refresh'

let refreshing = null

async function tryRefresh() {
  if (!refreshing) {
    refreshing = request(REFRESH_PATH, { method: 'POST' })
      .then((res) => { setAccessToken(res.accessToken); return true })
      .catch(() => { clearAccessToken(); return false })
      .finally(() => { refreshing = null })
  }
  return refreshing
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
