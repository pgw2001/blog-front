import { PendingLabel, usePending } from './Spinner.jsx'

/**
 * 삭제 · 권한 변경처럼 한 번 물어야 하는 동작에 씁니다.
 *
 * onConfirm 이 서버를 부르는 동안에는 확인 버튼에 스피너가 돌고,
 * 두 버튼 모두 눌리지 않습니다. 끝나면 부른 쪽이 open 을 내려 창을 닫습니다.
 */
export default function ConfirmDialog({ open, title, text, confirmLabel = '삭제', onCancel, onConfirm }) {
  const [pending, run] = usePending()
  if (!open) return null

  const cancel = () => {
    if (!pending) onCancel()
  }

  return (
    <div className="modal modal--open" role="presentation" onClick={cancel}>
      <div className="modal__inner" onClick={(e) => e.stopPropagation()}>
        <div className="modal__dialog" role="dialog" aria-modal="true" aria-label={title} aria-busy={pending}>
          <h2 className="modal__title">{title}</h2>
          <p className="modal__text">{text}</p>
          <div className="modal__actions">
            <button className="btn-block btn-block--ghost" type="button" disabled={pending} onClick={cancel}>
              취소
            </button>
            <button
              className="btn-block btn-block--danger"
              type="button"
              disabled={pending}
              onClick={() => run(onConfirm)}
            >
              <PendingLabel pending={pending}>{confirmLabel}</PendingLabel>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
