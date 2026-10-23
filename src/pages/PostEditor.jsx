import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { EditorBar, Page } from "../components/Chrome.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { ErrorNote, Loading } from "../components/Status.jsx";
import { Block, Line, Repeat } from "../components/Skeleton.jsx";
import ChipScroller from "../components/ChipScroller.jsx";
import { Camera } from "../components/Icons.jsx";
import { PendingLabel, Spinner, usePending } from "../components/Spinner.jsx";

/** 카테고리를 기다리는 동안 그릴 칩 자리 수. 한 줄을 채울 만큼이면 됩니다. */
const SKELETON_CHIPS = 5;

/** 새 글과 글 수정이 같은 화면을 씁니다. mode 로만 갈립니다. */
export default function PostEditor({ mode }) {
  const editing = mode === "edit";
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    postById,
    categories,
    addPost,
    updatePost,
    deletePost,
    loadPost,
    uploadImage,
    me,
    memberId,
  } = useBlog();
  const [asking, setAsking] = useState(false);
  const [missing, setMissing] = useState(false);
  // 썸네일 주소. undefined 면 아직 손대지 않은 것이라 글이 가진 값을 씁니다.
  const [thumbnail, setThumbnail] = useState(undefined);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  // 저장 요청이 끝날 때까지 상단 "저장" 자리에 스피너가 돕니다
  const [saving, runSave] = usePending();

  const post = editing ? postById(id) : null;
  const shownThumbnail = thumbnail === undefined ? (post?.thumbnail ?? null) : thumbnail;

  // 목록을 거치지 않고 주소로 바로 들어올 수 있습니다.
  // 마이페이지에서 들어와도 그 글은 목록에 없습니다. 그래서 글을 직접 받아 옵니다.
  useEffect(() => {
    if (!editing || !me) return;
    let alive = true;
    setMissing(false);
    Promise.resolve(loadPost(id)).then((found) => {
      if (alive && !found) setMissing(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, id, me]);

  // 카테고리 · 글이 올 때까지 기다립니다.
  // 기다리는 동안에도 같은 입력 칸을 그려 두고 막아만 둡니다. 그래서 값이 들어와도 화면이 그대로입니다.
  const waiting = categories.length === 0 || (editing && !post && !missing);

  // 남의 글은 고칠 수 없습니다. 서버도 403 으로 막지만 화면부터 막습니다.
  const mine = !post || (memberId && String(post.authorId) === String(memberId));

  if (missing) return <Navigate to="/" replace />;
  if (!mine) return <Navigate to={`/posts/${id}`} replace />;

  // 카테고리는 이름이 아니라 id 로 보냅니다 (PostRequest.categoryId).
  const currentId = String(post?.categoryId ?? categories[0]?.id ?? "");
  const back = editing ? `/posts/${id}` : "/";

  // 이미지를 고르면 바로 서버에 올리고, 돌려받은 주소를 썸네일로 들고 있습니다.
  // 글을 저장할 때 이 주소가 PostRequest.thumbnail 로 갑니다.
  const pickThumbnail = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) setThumbnail(url);
  };

  const save = async (formData) => {
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("content") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? currentId);
    // 체크하면 감춘 글로 저장합니다. 수정할 때도 이 값을 그대로 보내야 숨긴 글이 공개로 바뀌지 않습니다.
    const hidden = formData.get("hidden") === "on";

    if (editing) {
      const ok = await updatePost(post.id, { title, body, categoryId, hidden, thumbnail: shownThumbnail });
      if (ok) navigate(`/posts/${post.id}`);
      return;
    }
    if (!title && !body) {
      navigate("/");
      return;
    }
    // 서버가 만들어진 글을 돌려주므로, 그 글의 상세 화면으로 바로 갑니다.
    const created = await addPost({ title, body, categoryId, hidden, thumbnail: shownThumbnail });
    if (created) navigate(`/posts/${created.id}`);
  };

  return (
    <Page>
      <title>{editing ? "글 수정 — 수로그" : "새 글 — 수로그"}</title>

      <ErrorNote />

      <EditorBar
        cancelTo={back}
        title={editing ? "글 수정" : "새 글"}
        formId="post-form"
        disabled={waiting || uploading}
        pending={saving}
      />

      <main className="editor-main">
        {/* 기다리던 값이 오면 form 을 새로 만들어 defaultValue 를 다시 읽힙니다. */}
        <form
          className="editor"
          id="post-form"
          action={(fd) => runSave(() => save(fd))}
          aria-busy={saving}
          key={waiting ? "waiting" : "ready"}
        >
          {waiting && <Loading />}

          <input
            className="editor__title"
            type="text"
            name="title"
            aria-label="제목"
            placeholder={waiting ? "" : "제목"}
            autoComplete="off"
            defaultValue={post?.title ?? ""}
            disabled={waiting}
            maxLength={100}
            required
          />

          {/* radio 는 감춰 두고 label 을 칩으로 씁니다 (.chip-radio:checked + .chip)
              글 목록의 카테고리 줄처럼 한 줄에 두고 옆으로 넘깁니다. 고른 칩이 가려져 있으면 보이게 넘겨 둡니다. */}
          <div className="editor__category">
            <ChipScroller
              className="editor__category-list"
              activeSelector=".chip-radio:checked + .chip"
              role="group"
              aria-label="카테고리"
            >
              {waiting && (
                <Repeat count={SKELETON_CHIPS}>
                  <Block className="chip">
                    <Line width="2.5em" />
                  </Block>
                </Repeat>
              )}
              {!waiting &&
                categories.map((c) => (
                  <span className="chip-option" key={c.id}>
                    <input
                      className="chip-radio"
                      type="radio"
                      name="categoryId"
                      id={`cat-${c.id}`}
                      value={c.id}
                      defaultChecked={String(c.id) === currentId}
                    />
                    <label className="chip" htmlFor={`cat-${c.id}`}>
                      {c.name}
                    </label>
                  </span>
                ))}
            </ChipScroller>
          </div>

          {/* 썸네일 · 공개 여부. 썸네일은 이미지를 먼저 올려 받은 주소를 저장합니다. */}
          <div className="editor__options">
            <div className="thumb-picker">
              {uploading ? (
                <span className="thumb-picker__empty">
                  <Spinner label="이미지를 올리는 중입니다" />
                </span>
              ) : shownThumbnail ? (
                <img className="thumb-picker__image" src={shownThumbnail} alt="" />
              ) : (
                <span className="thumb-picker__empty" aria-hidden="true">
                  <Camera size={18} />
                </span>
              )}
              <button
                className="btn-text btn-text--accent"
                type="button"
                disabled={waiting || uploading || saving}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "올리는 중" : shownThumbnail ? "썸네일 바꾸기" : "썸네일 올리기"}
              </button>
              {shownThumbnail && (
                <button
                  className="btn-text btn-text--muted"
                  type="button"
                  disabled={waiting || uploading}
                  onClick={() => setThumbnail(null)}
                >
                  빼기
                </button>
              )}
              <input
                ref={fileRef}
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                tabIndex={-1}
                onChange={pickThumbnail}
              />
            </div>
            <label className="check">
              <input
                type="checkbox"
                name="hidden"
                defaultChecked={post?.hidden ?? false}
                disabled={waiting}
              />
              비공개로 저장
            </label>
          </div>

          <textarea
            className="editor__body"
            name="content"
            aria-label="내용"
            placeholder={waiting ? "" : "오늘은 어떤 이야기를 남길까요?"}
            defaultValue={post?.body ?? ""}
            disabled={waiting}
          />
        </form>
      </main>

      {editing && (
        <div className="danger-zone">
          <button
            className="btn-danger"
            type="button"
            disabled={waiting || saving}
            onClick={() => setAsking(true)}
          >
            이 글 삭제하기
          </button>
        </div>
      )}

      <ConfirmDialog
        open={asking}
        title="이 글을 삭제할까요?"
        text="삭제한 글은 다시 되돌릴 수 없습니다."
        onCancel={() => setAsking(false)}
        onConfirm={async () => {
          await deletePost(post.id);
          navigate("/");
        }}
      />
    </Page>
  );
}
