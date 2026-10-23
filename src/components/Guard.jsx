import { Navigate } from 'react-router-dom'
import { useBlog } from '../store/BlogContext.jsx'
import { Page } from './Chrome.jsx'
import { Loading } from './Status.jsx'

/**
 * 화면 접근 규칙.
 *
 * 첫 로딩 중에는 내가 누구인지 아직 모릅니다.
 * 그동안 화면을 그려 버리면 로그인한 사람에게 로그인 화면이 잠깐 보이는 식으로 어긋납니다.
 * 그래서 답이 나올 때까지 기다립니다.
 *
 * 규칙은 App.jsx 의 라우트 옆에 둡니다. 화면 안이 아니라요.
 * 화면 안에 두면 라우트를 옮길 때 규칙이 따라오지 않습니다.
 *
 * 진짜로 막는 것은 서버입니다. 여기서 하는 일은 헛걸음을 줄이는 것뿐입니다.
 */
function Waiting() {
  return (
    <Page>
      <Loading label="확인하는 중입니다" />
    </Page>
  )
}

/** 로그인하지 않은 사람만 (로그인 · 회원가입) */
export function RequireAnon({ children }) {
  const { me, loading } = useBlog()
  if (loading) return <Waiting />
  if (me) return <Navigate to="/" replace />
  return children
}

/** 로그인한 사람만 (글쓰기 · 마이페이지) */
export function RequireMember({ children }) {
  const { me, loading } = useBlog()
  if (loading) return <Waiting />
  if (!me) return <Navigate to="/login" replace />
  return children
}

/** 관리자만 (/admin 아래 전부) */
export function RequireAdmin({ children }) {
  const { isAdmin, loading } = useBlog()
  if (loading) return <Waiting />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
