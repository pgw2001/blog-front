/** label + input + 도움말 한 덩어리. HTML 버전의 .field 와 같은 구조입니다. */
export function Field({ id, label, hint, children }) {
  return (
    <div className="field">
      {id ? <label className="field__label" htmlFor={id}>{label}</label>
          : <span className="field__label">{label}</span>}
      {children}
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  )
}

export function TextField({ id, label, hint, ...rest }) {
  return (
    <Field id={id} label={label} hint={hint}>
      <input className="input" id={id} name={id} {...rest} />
    </Field>
  )
}

export function Divider({ children = '또는' }) {
  return <p className="divider">{children}</p>
}
