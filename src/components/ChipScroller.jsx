import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** 칩이 이만큼 안쪽에 있어야 "보인다"고 칩니다. 양 끝의 흐림 폭과 같습니다. */
const EDGE = 36

/** 마우스를 이만큼 움직여야 끌어서 넘기기로 봅니다. 그보다 작으면 그냥 클릭입니다. */
const DRAG_THRESHOLD = 5

/**
 * 칩을 한 줄에 두고 옆으로 넘겨 보는 줄.
 * 글 목록의 카테고리 줄(CategoryBar)과 글 작성 화면의 카테고리 고르기가 같이 씁니다.
 *
 * 칩이 몇 개든 높이는 한 줄로 고정합니다.
 * 줄바꿈을 하면 칩 수만큼 높이가 달라져서, 칩이 도착하는 순간 아래 내용이 밀립니다.
 *
 * - 터치 · 트랙패드는 브라우저가 그대로 옆으로 넘깁니다.
 * - 마우스는 휠을 굴리거나 끌어서 넘깁니다.
 * - 가려진 칩이 있는 쪽 끝은 흐리게 보여 줍니다.
 * - 선택된 칩이 가려져 있으면 보이는 자리까지 넘겨 둡니다.
 *
 * @param {string} activeSelector 선택된 칩을 찾는 선택자
 * @param {*}      watch          이 값이 바뀌면 선택된 칩이 보이는지 다시 확인합니다
 *                                (처음 그릴 때는 항상 확인합니다)
 * 나머지 props(role, aria-label 등)는 감싸는 div 에 그대로 붙습니다.
 */
export default function ChipScroller({ className, activeSelector, watch, children, ...rest }) {
  const ref = useRef(null)
  const drag = useRef({ pointerId: null, startX: 0, startLeft: 0, moved: false })
  const [edges, setEdges] = useState({ start: false, end: false })

  // 양 끝에 가려진 칩이 있는지 잽니다.
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const start = el.scrollLeft > 1
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  // 마우스 휠의 세로 움직임을 가로로 바꿉니다.
  // 끝까지 넘겼으면 막지 않아서 그대로 페이지가 스크롤됩니다.
  // React 의 onWheel 은 preventDefault 를 쓸 수 없어서 직접 붙입니다.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      const max = el.scrollWidth - el.clientWidth
      const atEdge = delta < 0 ? el.scrollLeft <= 0 : el.scrollLeft >= max - 1
      if (max <= 0 || atEdge) return
      e.preventDefault()
      el.scrollLeft += delta
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /**
   * 칩이 흐림 영역에 걸려 있거나 밖에 있으면 보이게 넘깁니다.
   * 칩이 한 겹 더 싸여 있어도(글 작성 화면의 .chip-option) 줄 기준 위치를 구하도록 화면 좌표로 잽니다.
   *
   * @param center true 면 가운데로(처음 그릴 때), false 면 보이는 데까지만 부드럽게(초점이 옮겨 갈 때)
   */
  const reveal = useCallback((chip, center) => {
    const el = ref.current
    if (!el || !chip) return
    const box = el.getBoundingClientRect()
    const rect = chip.getBoundingClientRect()
    const left = rect.left - box.left + el.scrollLeft
    const right = left + rect.width
    const viewStart = el.scrollLeft + EDGE
    const viewEnd = el.scrollLeft + el.clientWidth - EDGE
    if (left >= viewStart && right <= viewEnd) return

    if (center) {
      el.scrollLeft = left - (el.clientWidth - rect.width) / 2
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({
      left: left < viewStart ? left - EDGE : right - el.clientWidth + EDGE,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [])

  // 선택된 칩이 가려져 있으면 가운데로 넘겨 둡니다. 그리기 전에 옮기므로 튀는 모습이 보이지 않습니다.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (activeSelector) reveal(el.querySelector(activeSelector), true)
    measure()
  }, [activeSelector, watch, reveal, measure])

  // 방향키 · Tab 으로 초점이 옮겨 가거나 가장자리에 걸친 칩을 누르면 그 칩이 다 보이게 넘깁니다.
  const onFocus = (e) => reveal(e.target.closest('.chip-option, .chip'), false)

  /* ── 마우스로 끌어서 넘기기 ─────────────────────────────── */

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startLeft: e.currentTarget.scrollLeft, moved: false }
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (e.pointerId !== d.pointerId) return
    const dx = e.clientX - d.startX
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    e.currentTarget.scrollLeft = d.startLeft - dx
  }

  const onPointerEnd = (e) => {
    if (e.pointerId === drag.current.pointerId) drag.current.pointerId = null
  }

  // 끌어서 넘긴 뒤 손을 뗄 때 칩이 눌리지 않게 합니다 (링크 이동 · 라디오 선택 모두).
  const onClickCapture = (e) => {
    if (!drag.current.moved) return
    drag.current.moved = false
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      {...rest}
      className={className ? `chip-scroller ${className}` : 'chip-scroller'}
      ref={ref}
      onScroll={measure}
      onFocus={onFocus}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
      data-more-start={edges.start || undefined}
      data-more-end={edges.end || undefined}
    >
      {children}
    </div>
  )
}
