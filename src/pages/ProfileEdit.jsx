import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { Avatar, EditorBar, Page } from "../components/Chrome.jsx";
import { Camera, GoogleMark, MailMark } from "../components/Icons.jsx";
import { Field, TextField } from "../components/Fields.jsx";
import { ErrorNote } from "../components/Status.jsx";
import { Spinner, usePending } from "../components/Spinner.jsx";

const marks = {
  local: <MailMark />,
  google: <GoogleMark />,
};

export default function ProfileEdit() {
  const navigate = useNavigate();
  const {
    me,
    email,
    bio,
    snsLink,
    profileImage,
    provider,
    providerLabel,
    saveProfile,
    uploadImage,
  } = useBlog();

  // 사진은 고르는 즉시 서버에 올리고, 돌려받은 주소를 들고 있다가 저장할 때 보냅니다.
  const [photo, setPhoto] = useState(profileImage ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  // 닉네임 저장 → 프로필 저장이 모두 끝날 때까지 스피너가 돕니다
  const [saving, runSave] = usePending();

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) setPhoto(url);
  };

  const save = async (formData) => {
    const ok = await saveProfile({
      nickname: String(formData.get("nickname") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
      snsLink: String(formData.get("snsLink") ?? "").trim(),
      profileImage: photo,
    });
    if (ok) navigate("/mypage");
  };

  return (
    <Page>
      <title>프로필 수정 — 수로그</title>

      <ErrorNote />

      <EditorBar
        cancelTo="/mypage"
        title="프로필 수정"
        formId="profile-form"
        disabled={uploading}
        pending={saving}
      />

      <main className="auth">
        {/* action 에 함수를 주면 React 가 FormData 를 그대로 넘겨 줍니다. */}
        <form
          className="auth__form"
          id="profile-form"
          action={(fd) => runSave(() => save(fd))}
          aria-busy={saving}
        >
          <div className="field-list">
            <div className="photo-picker">
              <button
                className="photo-picker__button"
                type="button"
                aria-label="프로필 사진 고르기"
                disabled={uploading || saving}
                onClick={() => fileRef.current?.click()}
              >
                <Avatar name={me} size={72} photo={photo || null} />
                <span className="photo-picker__badge" aria-hidden="true">
                  {uploading ? <Spinner label="사진을 올리는 중입니다" /> : <Camera />}
                </span>
              </button>
              <div>
                <p className="photo-picker__label">
                  {uploading ? "사진을 올리는 중입니다" : "프로필 사진"}
                </p>
                <p className="photo-picker__hint">
                  PNG · JPEG · GIF · WebP, 5MB 까지 올릴 수 있습니다.
                  사진이 없으면 닉네임 첫 글자가 대신 보입니다.
                </p>
                {photo && (
                  <button
                    className="btn-inline"
                    type="button"
                    disabled={uploading}
                    onClick={() => setPhoto("")}
                  >
                    사진 지우기
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                tabIndex={-1}
                onChange={pickPhoto}
              />
            </div>

            <TextField
              id="nickname"
              label="닉네임"
              type="text"
              autoComplete="nickname"
              defaultValue={me}
              maxLength={20}
              required
              hint="20자까지. 글 목록과 상세 화면에 작성자로 표시됩니다."
            />

            <TextField
              id="bio"
              label="자기소개"
              type="text"
              defaultValue={bio}
              maxLength={500}
              placeholder="어떤 사람인지 한 줄로"
            />

            <TextField
              id="snsLink"
              label="SNS 링크"
              type="url"
              defaultValue={snsLink}
              maxLength={255}
              placeholder="https://"
              hint="http:// 또는 https:// 로 시작하는 주소만 저장됩니다."
            />

            <Field
              label="연결된 계정"
              hint="로그인에 쓰는 계정입니다. 바꿀 수 없습니다."
            >
              <div className="provider">
                {marks[provider] ?? marks.local}
                <span>{email}</span>
                <span className="provider__name">{providerLabel}</span>
              </div>
            </Field>
          </div>
        </form>
      </main>
    </Page>
  );
}
