import { Fragment } from 'react'

/**
 * 데이터를 받아 오기 전에 자리를 채우는 조각.
 *
 * 화면마다 실제 행과 같은 class 로 껍데기를 만들고, 글자 자리에 Line 을 넣습니다.
 * 글자 크기와 줄 높이를 그 class 에서 물려받으므로 스켈레톤과 실제 행의 높이가 같아서
 * 데이터가 들어오는 순간 화면이 밀리지 않습니다.
 *
 *   <span className="post-item__title"><Line width="60%" /></span>
 *
 * 높이를 알 수 없는 것(목록 아래의 페이지 버튼, 안내 문구 등)은 스켈레톤 뒤에 그리지 않습니다.
 * 이미 그려진 것이 아래로 밀리는 게 레이아웃 시프트이고, 새로 나타나는 것은 밀리는 게 아닙니다.
 */

/** 글자 한 줄 자리. 높이는 감싼 요소의 줄 높이와 같습니다. */
export function Line({ width = '100%' }) {
  return <span className="sk-line" style={{ width }} />
}

/** 태그 · 아바타처럼 모양째 비워 두는 자리. 크기는 className 이 정합니다. */
export function Block({ className, children }) {
  return <span className={`${className} sk-block`}>{children}</span>
}

/** 같은 스켈레톤을 count 번 그립니다. */
export function Repeat({ count, children }) {
  return Array.from({ length: count }, (_, i) => <Fragment key={i}>{children}</Fragment>)
}
