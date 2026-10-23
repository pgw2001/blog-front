import { useBlog } from '../store/BlogContext.jsx'

/**
 * 불러오는 중이라고 스크린 리더에 알려 줍니다.
 * 화면에는 글자 대신 스켈레톤(Skeleton.jsx)이 보이므로 이 문장은 눈에 보이지 않습니다.
 */
export function Loading({ label = '불러오는 중입니다' }) {
  return (
    <p className="visually-hidden" role="status">
      {label}
    </p>
  )
}

/**
 * 마지막으로 실패한 요청을 알려 줍니다.
 * 연동 중에 응답이 안 맞으면 여기에 메시지가 뜹니다 (자세한 건 콘솔).
 * 화면 아래에 떠 있으므로 나타나도 내용을 밀어내지 않습니다.
 */
export function ErrorNote() {
  const { error, clearError } = useBlog()
  if (!error) return null
  return (
    <div className="error-note" role="alert">
      <span>{error}</span>
      <button className="error-note__close" type="button" onClick={clearError} aria-label="닫기">
        닫기
      </button>
    </div>
  )
}
