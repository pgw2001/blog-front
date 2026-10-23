import { useRef, useState } from 'react'
import { ChevronLeft, Close, SearchIcon } from './Icons.jsx'

/**
 * 글 목록 상단 바의 검색 모드. 로고 · 새 글 버튼 자리를 이 줄이 대신합니다.
 *
 * 입력 칸 높이를 버튼들과 같은 44px 로 맞춰서, 검색을 열고 닫아도 상단 바 높이가 그대로입니다.
 * 엔터(모바일 키보드의 검색)를 눌러야 검색합니다. 글자마다 목록이 바뀌며 흔들리지 않게 합니다.
 *
 * @param {string}   initial  처음 입력 칸에 들어 있을 검색어 (주소의 ?q=)
 * @param {function} onSearch (검색어) => void. 빈 문자열이면 검색을 지웁니다
 * @param {function} onClose  검색을 닫습니다
 */
export default function SearchBar({ initial = '', onSearch, onClose }) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef(null)

  const submit = (e) => {
    e.preventDefault()
    onSearch(value.trim())
    // 모바일에서 검색하면 키보드를 내려 결과가 가려지지 않게 합니다.
    if (value.trim()) inputRef.current?.blur()
  }

  const clear = () => {
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <form className="search" role="search" onSubmit={submit}>
      <button className="btn-icon" type="button" aria-label="검색 닫기" onClick={onClose}>
        <ChevronLeft />
      </button>

      <div className="search__field">
        <SearchIcon size={18} />
        <input
          ref={inputRef}
          className="search__input"
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          placeholder="제목이나 내용으로 검색"
          aria-label="글 검색"
          autoComplete="off"
          enterKeyHint="search"
          autoFocus={!initial}
        />
        {value && (
          <button className="search__clear" type="button" aria-label="검색어 지우기" onClick={clear}>
            <Close />
          </button>
        )}
      </div>
    </form>
  )
}
