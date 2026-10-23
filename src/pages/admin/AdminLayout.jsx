import { NavLink, Outlet } from 'react-router-dom'
import { BackBar, Page } from '../../components/Chrome.jsx'

const tabs = [
  { to: '/admin/categories', label: '카테고리' },
  { to: '/admin/members', label: '회원' },
  { to: '/admin/posts', label: '게시글' },
]

/** 관리자 화면의 공통 껍데기 — 상단 바와 탭 칩. */
export default function AdminLayout() {
  return (
    <Page>
      <BackBar to="/mypage" title="관리자" label="마이페이지로" />

      <nav className="admin-tabs" aria-label="관리 항목">
        {tabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? 'chip chip--on' : 'chip')}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <main><Outlet /></main>
    </Page>
  )
}
