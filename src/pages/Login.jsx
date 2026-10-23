import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { Page } from "../components/Chrome.jsx";
import { BrandMark } from "../components/Icons.jsx";
import { Divider, TextField } from "../components/Fields.jsx";
import SocialButtons from "../components/SocialButtons.jsx";
import { PendingLabel, usePending } from "../components/Spinner.jsx";
import { ErrorNote } from "../components/Status.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login, startSocialAuth, showError, loading } = useBlog();
  const [params, setParams] = useSearchParams();
  // 로그인 요청부터 내 정보 받기(첫 로딩)까지 끝날 때까지 버튼에 스피너가 돕니다
  const [pending, run] = usePending();

  // 구글 로그인이 실패하면 서버가 /login?error=social 로 돌려보냅니다.
  // 첫 로딩이 끝난 뒤에 알립니다. 첫 로딩은 시작할 때 오류 줄을 지우기 때문입니다.
  // 한 번 보여 주고 주소에서 지웁니다. 새로고침해도 다시 뜨지 않게요.
  useEffect(() => {
    if (loading || params.get("error") !== "social") return;
    showError("구글 계정으로 로그인하지 못했습니다. 다시 시도해 주세요.");
    params.delete("error");
    setParams(params, { replace: true });
  }, [loading, params, setParams, showError]);

  const submit = async (formData) => {
    const ok = await login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (ok) navigate("/");
  };

  // 브라우저가 서버의 OAuth 주소로 떠납니다. 그래서 뒤에 아무 줄도 없습니다.
  // 구글에서 돌아오면 다시 이 앱이 처음부터 뜨고, 그때 재발급으로 로그인 상태가 됩니다.
  const social = (provider) => startSocialAuth(provider);

  return (
    <Page>
      <title>로그인 — 수로그</title>

      <ErrorNote />

      <main className="auth">
        <div className="auth__brand">
          <Link className="auth__logo" to="/">
            <BrandMark size={32} />
            <span className="auth__logo-name">수로그</span>
          </Link>
          <p className="auth__tagline">기록을 이어가려면 로그인해 주세요</p>
        </div>

        <form
          className="auth__form"
          action={(fd) => run(() => submit(fd))}
          aria-busy={pending}
        >
          <div className="field-list">
            <TextField
              id="email"
              label="이메일"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <TextField
              id="password"
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              required
            />
          </div>

          <div className="auth__helper">
            {/* 비밀번호 찾기 화면은 아직 없습니다. */}
            <button className="btn-inline" type="button">
              비밀번호를 잊으셨나요?
            </button>
          </div>

          <button className="btn-submit" type="submit" disabled={pending}>
            <PendingLabel pending={pending} label="로그인하는 중입니다">
              로그인
            </PendingLabel>
          </button>
        </form>

        <Divider />
        <SocialButtons onPick={social} />

        <p className="auth__foot">
          아직 계정이 없으신가요?
          <Link to="/signup">회원가입</Link>
        </p>
      </main>
    </Page>
  );
}
