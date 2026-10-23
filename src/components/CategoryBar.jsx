import { Link } from 'react-router-dom'
import ChipScroller from './ChipScroller.jsx'
import { Block, Line, Repeat } from './Skeleton.jsx'

/** 로딩 중에 그릴 칩 자리 수. 한 줄을 채울 만큼이면 됩니다. */
const SKELETON_CHIPS = 5

/**
 * 글 목록 위의 카테고리 줄. 칩을 한 줄에 두고 옆으로 넘겨 봅니다 (ChipScroller).
 * 카테고리를 받아 오는 동안에는 "전체" 옆에 칩 스켈레톤을 둡니다.
 */
export default function CategoryBar({ names, current, hrefFor, loading }) {
  const chip = (name) => (
    <Link
      key={name || 'all'}
      className={name === current ? 'chip chip--on' : 'chip'}
      to={hrefFor(name)}
      aria-current={name === current ? 'page' : undefined}
      draggable={false}
    >
      {name || '전체'}
    </Link>
  )

  return (
    <nav className="category-bar" aria-label="카테고리">
      <ChipScroller
        className="category-bar__list"
        activeSelector='[aria-current="page"]'
        watch={`${loading}:${current}`}
      >
        {chip('')}
        {loading ? (
          <Repeat count={SKELETON_CHIPS}>
            <Block className="chip">
              <Line width="2.5em" />
            </Block>
          </Repeat>
        ) : (
          names.map(chip)
        )}
      </ChipScroller>
    </nav>
  )
}
