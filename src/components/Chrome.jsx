import { Link } from "react-router-dom";
import { BrandMark, ChevronLeft } from "./Icons.jsx";
import { PendingLabel } from "./Spinner.jsx";

export function Page({ children }) {
  return <div className="viewport">{children}</div>;
}

/** 뒤로 가기 + 가운데 제목. 오른쪽은 균형을 위한 빈 칸입니다. */
export function BackBar({ to, title, label = "뒤로" }) {
  return (
    <header className="appbar appbar--center">
      <Link className="btn-icon" to={to} aria-label={label}>
        <ChevronLeft />
      </Link>
      <h1 className="appbar__title">{title}</h1>
      <span className="appbar__spacer" />
    </header>
  );
}

/**
 * 취소 / 제목 / 저장. 저장은 form 을 submit 합니다. 불러오는 중에는 disabled 로 막아 둡니다.
 * pending 이면 저장하는 중이라 "저장" 자리에 스피너가 돌고, 취소도 누를 수 없습니다.
 */
export function EditorBar({
  cancelTo,
  title,
  formId,
  submitLabel = "저장",
  disabled = false,
  pending = false,
}) {
  return (
    <header className="appbar appbar--editor">
      <Link
        className={pending ? "btn-text btn-text--plain btn-text--off" : "btn-text btn-text--plain"}
        to={cancelTo}
        aria-disabled={pending}
        tabIndex={pending ? -1 : undefined}
      >
        취소
      </Link>
      <span className="appbar__title">{title}</span>
      <button
        className="btn-text btn-text--accent"
        type="submit"
        form={formId}
        disabled={disabled || pending}
      >
        <PendingLabel pending={pending} label="저장하는 중입니다">
          {submitLabel}
        </PendingLabel>
      </button>
    </header>
  );
}

export function Brand({
  size = 26,
  className = "brand",
  nameClass = "brand__name",
}) {
  return (
    <Link className={className} to="/">
      <BrandMark size={size} />
      <span className={nameClass}>수로그</span>
    </Link>
  );
}

export function Tag({ children, variant }) {
  const cls = variant ? `tag tag--${variant}` : "tag";
  return <span className={cls}>{children}</span>;
}

/** 사진이 있으면 사진, 없으면 닉네임 첫 글자. */
export function Avatar({ name, size = 40, photo = null }) {
  const cls = `avatar avatar--${size}`;
  if (photo) return <img className={cls} src={photo} alt="" />;
  return (
    <span className={cls} aria-hidden="true">
      {String(name || "?").slice(0, 1)}
    </span>
  );
}
