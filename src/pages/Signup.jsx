import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { BackBar, Page } from "../components/Chrome.jsx";
import { Divider, TextField } from "../components/Fields.jsx";
import SocialButtons from "../components/SocialButtons.jsx";
import { ErrorNote } from "../components/Status.jsx";
import { PendingLabel, usePending } from "../components/Spinner.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, startSocialAuth } = useBlog();
  const [pending, run] = usePending();

  const submit = async (formData) => {
    const ok = await signup({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      nickname: String(formData.get("nickname") ?? "").trim(),
    });
    if (ok) navigate("/");
  };

  // 구글로 가입하면 닉네임은 서버가 구글 이름으로 정해 줍니다.
  // 마음에 안 들면 마이페이지 > 프로필 수정에서 바꾸면 됩니다.
  const social = (provider) => startSocialAuth(provider);

  return (
    <Page>
      <title>회원가입 — 수로그</title>

      <ErrorNote />

      <BackBar to="/login" title="회원가입" />

      <main className="auth">
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
              autoComplete="new-password"
              placeholder="4자 이상 20자 이하"
              minLength={4}
              maxLength={20}
              required
              hint="4자 이상 20자 이하로 만들어 주세요."
            />
            <TextField
              id="nickname"
              label="닉네임"
              type="text"
              autoComplete="nickname"
              placeholder="글에 표시될 이름"
              maxLength={20}
              required
              hint="글 목록과 상세 화면에 작성자로 표시됩니다."
            />
          </div>

          <button className="btn-submit" type="submit" disabled={pending}>
            <PendingLabel pending={pending} label="가입하는 중입니다">
              가입하기
            </PendingLabel>
          </button>
        </form>

        <Divider />
        <SocialButtons onPick={social} />

        <p className="auth__foot">
          이미 계정이 있으신가요?
          <Link to="/login">로그인</Link>
        </p>
      </main>
    </Page>
  );
}
