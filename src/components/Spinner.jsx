import { useCallback, useRef, useTransition } from 'react'

/**
 * 버튼 안에 넣는 작은 회전 표시.
 * 색은 글자색(currentColor)을 따라가므로 어떤 버튼에 넣어도 어울립니다.
 * 화면 읽기 프로그램에는 label 을 읽어 줍니다.
 */
export function Spinner({ label = '처리하는 중입니다' }) {
  return (
    <span className="spinner" role="status">
      <span className="visually-hidden">{label}</span>
    </span>
  )
}

/**
 * 버튼 글자 자리에 그대로 들어갑니다. 처리 중이면 글자 대신 스피너를 보여 주되,
 * 글자는 투명하게 남겨 둬서 버튼 폭이 바뀌지 않게 합니다.
 */
export function PendingLabel({ pending, children, label }) {
  return (
    <span className={pending ? 'pending-label pending-label--on' : 'pending-label'}>
      <span className="pending-label__text">{children}</span>
      {pending && <Spinner label={label} />}
    </span>
  )
}

/**
 * 서버를 부르는 동작이 끝날 때까지 "처리 중"을 들고 있습니다.
 *
 *   const [pending, run] = usePending()
 *   <form action={(fd) => run(() => save(fd))}>
 *
 * form action 은 React 가 트랜지션 안에서 부릅니다. 그 안에서 useState 로
 * "처리 중"을 켜면 동작이 다 끝난 뒤에야 화면에 반영돼 스피너가 보이지 않습니다.
 * useTransition 의 isPending 은 트랜지션이 시작되는 즉시 켜지므로 이것을 씁니다.
 * 버튼의 onClick 에서 불러도 똑같이 동작합니다.
 *
 * 처리 중에 또 누르면 무시합니다. 저장 버튼을 두 번 눌러 글이 두 개 생기는 일을 막습니다.
 */
export function usePending() {
  const [pending, startTransition] = useTransition()
  const busy = useRef(false)

  const run = useCallback((task) => {
    if (busy.current) return Promise.resolve(undefined)
    busy.current = true
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          resolve(await task())
        } catch (e) {
          reject(e)
        } finally {
          busy.current = false
        }
      })
    })
  }, [])

  return [pending, run]
}
