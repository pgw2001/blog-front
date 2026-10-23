import { Navigate, Route, Routes } from 'react-router-dom'
import { BlogProvider } from './store/BlogContext.jsx'
import { RequireAdmin, RequireAnon, RequireMember } from './components/Guard.jsx'

import PostList from './pages/PostList.jsx'
import PostDetail from './pages/PostDetail.jsx'
import PostEditor from './pages/PostEditor.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import MyPage from './pages/MyPage.jsx'
import ProfileEdit from './pages/ProfileEdit.jsx'
import MemberProfile from './pages/MemberProfile.jsx'

import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminCategoryForm from './pages/admin/AdminCategoryForm.jsx'
import AdminMembers from './pages/admin/AdminMembers.jsx'
import AdminPosts from './pages/admin/AdminPosts.jsx'

export default function App() {
  return (
    <BlogProvider>
      <Routes>
        {/* 누구나 */}
        <Route path="/" element={<PostList />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/members/:id" element={<MemberProfile />} />

        {/* 로그인하지 않은 사람만 */}
        <Route path="/login" element={<RequireAnon><Login /></RequireAnon>} />
        <Route path="/signup" element={<RequireAnon><Signup /></RequireAnon>} />

        {/* 로그인한 사람만 */}
        <Route path="/write" element={<RequireMember><PostEditor mode="new" /></RequireMember>} />
        <Route path="/posts/:id/edit" element={<RequireMember><PostEditor mode="edit" /></RequireMember>} />
        <Route path="/mypage" element={<RequireMember><MyPage /></RequireMember>} />
        <Route path="/mypage/profile" element={<RequireMember><ProfileEdit /></RequireMember>} />

        {/* 관리자만. 카테고리 폼은 자체 상단 바를 쓰므로 관리자 레이아웃 밖이지만,
            규칙은 여기 라우트에 붙어 있으므로 빠질 수 없습니다. */}
        <Route path="/admin/categories/new" element={<RequireAdmin><AdminCategoryForm /></RequireAdmin>} />
        <Route path="/admin/categories/:id" element={<RequireAdmin><AdminCategoryForm /></RequireAdmin>} />

        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Navigate to="/admin/categories" replace />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="posts" element={<AdminPosts />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BlogProvider>
  )
}
