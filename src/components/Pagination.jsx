import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from './Icons.jsx'

/**
 * 페이지 이동. 글 목록과 마이페이지가 같이 씁니다.
 *
 * @param {number}   page    지금 페이지 (1부터)
 * @param {number}   total   전체 페이지 수
 * @param {function} hrefFor (n) => 그 페이지의 주소
 * @param {string}   label   스크린 리더용 이름
 */
export default function Pagination({ page, total, hrefFor, label = '페이지 이동' }) {
  if (total < 2) return null
  const pages = Array.from({ length: total }, (_, i) => i + 1)

  return (
    <nav className="pagination" aria-label={label}>
      {page > 1 ? (
        <Link className="page-btn page-btn--arrow" to={hrefFor(page - 1)} aria-label="이전 페이지">
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <span className="page-btn page-btn--arrow page-btn--disabled" aria-hidden="true">
          <ChevronLeft size={18} />
        </span>
      )}

      {pages.map((n) => (
        <Link
          key={n}
          className={n === page ? 'page-btn page-btn--current' : 'page-btn'}
          to={hrefFor(n)}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </Link>
      ))}

      {page < total ? (
        <Link className="page-btn page-btn--arrow" to={hrefFor(page + 1)} aria-label="다음 페이지">
          <ChevronRight />
        </Link>
      ) : (
        <span className="page-btn page-btn--arrow page-btn--disabled" aria-hidden="true">
          <ChevronRight />
        </span>
      )}
    </nav>
  )
}
