import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { Page, Tag } from "../components/Chrome.jsx";
import { ChevronLeft, Heart } from "../components/Icons.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { ErrorNote, Loading } from "../components/Status.jsx";
import { Block, Line, Repeat } from "../components/Skeleton.jsx";
import { PendingLabel, usePending } from "../components/Spinner.jsx";

/** 댓글 스켈레톤은 이만큼까지만 그립니다. 그 아래는 어차피 화면 밖입니다. */
const COMMENT_SKELETON_MAX = 5;

/** 주소로 바로 들어와 글이 아직 없을 때. 글 본문까지만 자리를 잡습니다. */
function ArticleSkeleton() {
  return (
    <Page>
      <Loading />

      <header className="appbar appbar--article">
        <Link className="btn-icon" to="/" aria-label="목록으로">
          <ChevronLeft />
        </Link>
      </header>

      <main>
        <div className="article">
          <p className="article__title">
            <Line width="70%" />
          </p>
          <div className="article__meta">
            <Block className="tag">
              <Line width="2em" />
            </Block>
            <span className="article__author">
              <Line width="2.5em" />
            </span>
            <span className="article__date">
              <Line width="7em" />
            </span>
          </div>
          <hr className="article__divider" />
          <div className="article__body">
            <p>
              <Line />
              <Line width="40%" />
            </p>
            <p>
              <Line />
              <Line />
              <Line width="65%" />
            </p>
          </div>
        </div>
      </main>
    </Page>
  );
}

function CommentSkeleton() {
  return (
    <div className="comment">
      <div className="comment__meta">
        <span className="comment__author">
          <Line width="2.5em" />
        </span>
        <span className="comment__date">
          <Line width="7em" />
        </span>
      </div>
      <p className="comment__body">
        <Line />
        <Line width="40%" />
      </p>
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    postById,
    commentsOf,
    commentsLoaded,
    loadPost,
    loadComments,
    toggleLike,
    addComment,
    editComment,
    removeComment,
    deletePost,
    me,
    memberId,
    loading,
  } = useBlog();
  const [asking, setAsking] = useState(false);
  const [missing, setMissing] = useState(false);
  // 고치고 있는 댓글의 id, 지우려고 고른 댓글의 id
  const [editingId, setEditingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  // 댓글 등록 · 댓글 고치기가 끝날 때까지 버튼에 스피너가 돕니다
  const [posting, runPost] = usePending();
  const [editingSaving, runEdit] = usePending();

  const post = postById(id);
  const comments = commentsOf(id);
  const commentsReady = commentsLoaded(id);

  // 목록을 거치지 않고 주소로 바로 들어올 수 있으므로 글을 직접 받아 옵니다.
  // 댓글은 글과 따로 받습니다.
  //
  // 첫 로딩(재발급)이 끝난 뒤에 부릅니다. 감춘 글은 글쓴이와 관리자에게만 보이는데,
  // 토큰이 손에 들어오기 전에 물으면 서버는 "없는 글"(404)로 답하기 때문입니다.
  // 로그인한 사람이 바뀌어도 다시 받아 옵니다 (isLiked 가 달라집니다).
  useEffect(() => {
    if (loading) return;
    let alive = true;
    setMissing(false);
    Promise.resolve(loadPost(id)).then((found) => {
      if (!alive) return;
      if (!found) {
        setMissing(true);
        return;
      }
      loadComments(id, { hidden: found.hidden });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loading, memberId]);

  if (missing) return <Navigate to="/" replace />;
  if (!post) return <ArticleSkeleton />;

  const mine = memberId && String(post.authorId) === String(memberId);

  const submitComment = async (formData) => {
    const text = String(formData.get("content") ?? "").trim();
    if (text) await addComment(post.id, text);
  };

  const submitEdit = async (formData) => {
    const text = String(formData.get("content") ?? "").trim();
    if (!text) return;
    const saved = await editComment(post.id, editingId, text);
    if (saved) setEditingId(null);
  };

  return (
    <Page>
      <title>{`${post.title} — 수로그`}</title>

      <ErrorNote />

      <header className="appbar appbar--article">
        <Link className="btn-icon" to="/" aria-label="목록으로">
          <ChevronLeft />
        </Link>
        {/* 수정 · 삭제는 글쓴이에게만 보여 줍니다. 서버도 남의 글은 막습니다. */}
        {mine && (
          <div className="appbar__actions">
            <Link
              className="btn-text btn-text--accent"
              to={`/posts/${post.id}/edit`}
            >
              수정
            </Link>
            <button
              className="btn-text btn-text--muted"
              type="button"
              onClick={() => setAsking(true)}
            >
              삭제
            </button>
          </div>
        )}
      </header>

      <main>
        <article className="article">
          <h1 className="article__title">{post.title}</h1>
          <div className="article__meta">
            <Tag>{post.category}</Tag>
            {/* 글쓴이를 누르면 그 사람의 프로필로 갑니다 (PostResponse.authorId) */}
            <Link className="article__author" to={`/members/${post.authorId}`}>
              {post.author}
            </Link>
            <span className="article__sep" aria-hidden="true">
              ·
            </span>
            <span className="article__date">{post.date}</span>
            {post.hidden && <Tag variant="hidden">숨김</Tag>}
          </div>
          <hr className="article__divider" />
          {post.thumbnail && (
            <img className="article__cover" src={post.thumbnail} alt="" />
          )}
          <div className="article__body">
            {post.body.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </article>

        <div className="like-bar">
          <button
            className={post.liked ? "btn-like btn-like--on" : "btn-like"}
            type="button"
            aria-pressed={post.liked}
            // 감춘 글에는 아무도 좋아요를 누를 수 없습니다 (서버가 404 로 답합니다)
            disabled={!me || post.hidden}
            onClick={() => toggleLike(post.id)}
          >
            <Heart size={18} filled={post.liked} />
            좋아요 {post.likes}
          </button>
        </div>

        <section className="comments">
          <h2 className="comments__head">
            댓글{" "}
            <span className="comments__count">{post.commentCount ?? 0}</span>
          </h2>

          {/* 댓글이 오기 전에는 글이 알려 준 댓글 수만큼 자리를 잡고, 입력 칸은 그 뒤에 그립니다. */}
          {!commentsReady && (
            <>
              <Loading label="댓글을 불러오는 중입니다" />
              <Repeat
                count={Math.min(post.commentCount ?? 0, COMMENT_SKELETON_MAX)}
              >
                <CommentSkeleton />
              </Repeat>
            </>
          )}

          {commentsReady && comments.length === 0 && (
            <p className="comments__empty">
              {post.hidden
                ? "숨긴 글의 댓글은 관리자만 볼 수 있습니다"
                : "첫 댓글을 남겨 보세요"}
            </p>
          )}

          {comments.map((c) =>
            String(c.id) === String(editingId) ? (
              <form
                className="comment comment--editing"
                key={c.id}
                action={(fd) => runEdit(() => submitEdit(fd))}
                aria-busy={editingSaving}
              >
                <label className="visually-hidden" htmlFor={`edit-${c.id}`}>
                  댓글 고치기
                </label>
                <input
                  className="input"
                  id={`edit-${c.id}`}
                  name="content"
                  type="text"
                  defaultValue={c.text}
                  maxLength={500}
                  required
                  autoFocus
                />
                <div className="comment__actions">
                  <button
                    className="btn-text btn-text--muted"
                    type="button"
                    disabled={editingSaving}
                    onClick={() => setEditingId(null)}
                  >
                    취소
                  </button>
                  <button
                    className="btn-text btn-text--accent"
                    type="submit"
                    disabled={editingSaving}
                  >
                    <PendingLabel pending={editingSaving} label="댓글을 고치는 중입니다">
                      저장
                    </PendingLabel>
                  </button>
                </div>
              </form>
            ) : (
              <article className="comment" key={c.id}>
                <div className="comment__meta">
                  <Link
                    className="comment__author"
                    to={`/members/${c.authorId}`}
                  >
                    {c.author}
                  </Link>
                  <span className="comment__sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="comment__date">{c.date}</span>
                  {/* 고치기 · 지우기는 댓글 쓴 사람에게만 보여 줍니다. 서버도 남의 댓글은 403 으로 막습니다.
                      감춘 글의 댓글은 쓴 사람도 고칠 수 없습니다 (서버가 404 로 답합니다). */}
                  {memberId &&
                    String(c.authorId) === String(memberId) &&
                    !post.hidden && (
                      <span className="comment__actions">
                        <button
                          className="btn-text btn-text--muted"
                          type="button"
                          onClick={() => setEditingId(c.id)}
                        >
                          수정
                        </button>
                        <button
                          className="btn-text btn-text--muted"
                          type="button"
                          onClick={() => setRemovingId(c.id)}
                        >
                          삭제
                        </button>
                      </span>
                    )}
                </div>
                <p className="comment__body">{c.text}</p>
              </article>
            ),
          )}

          {/* 로그인 여부를 아직 모르면(첫 로딩) 입력 칸도 안내 문구도 그리지 않습니다.
              감춘 글에는 아무도 댓글을 달 수 없습니다 (서버가 404 로 답합니다). */}
          {!commentsReady || loading || post.hidden ? null : me ? (
            <form
              className="comment-form"
              action={(fd) => runPost(() => submitComment(fd))}
              aria-busy={posting}
            >
              <label className="visually-hidden" htmlFor="comment">
                댓글
              </label>
              <input
                className="input"
                id="comment"
                name="content"
                type="text"
                placeholder="댓글을 남겨 보세요"
                maxLength={500}
                required
              />
              <button className="btn-inline-accent" type="submit" disabled={posting}>
                <PendingLabel pending={posting} label="댓글을 등록하는 중입니다">
                  등록
                </PendingLabel>
              </button>
            </form>
          ) : (
            <p className="comments__empty">
              <Link to="/login">로그인</Link> 하면 댓글을 남길 수 있습니다
            </p>
          )}
        </section>
      </main>

      <ConfirmDialog
        open={removingId !== null}
        title="이 댓글을 삭제할까요?"
        text="삭제한 댓글은 다시 되돌릴 수 없습니다."
        onCancel={() => setRemovingId(null)}
        onConfirm={async () => {
          await removeComment(post.id, removingId);
          setRemovingId(null);
        }}
      />

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
