import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { Avatar, BackBar, Page, Tag } from "../components/Chrome.jsx";
import { Briefcase, ChevronRight, LinkIcon } from "../components/Icons.jsx";
import { Counts } from "../components/PostMeta.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import { MY_PAGE_SIZE, PROVIDER_LABELS } from "../ui.js";
import { ErrorNote, Loading } from "../components/Status.jsx";
import { PendingLabel, usePending } from "../components/Spinner.jsx";
import { Block, Line, Repeat } from "../components/Skeleton.jsx";

/** 첫 로딩 중 프로필. 이름 · 이메일 줄만 잡습니다. */
function ProfileSkeleton() {
  return (
    <section className="profile">
      <div className="profile__top">
        <Block className="avatar avatar--56" />
        <div className="profile__who">
          <p className="profile__name">
            <Line width="3em" />
          </p>
          <p className="profile__account">
            <Line width="10em" />
          </p>
        </div>
        <Link className="chip profile__edit" to="/mypage/profile">
          프로필 수정
        </Link>
      </div>
    </section>
  );
}

function MyPostSkeleton() {
  return (
    <div className="my-post">
      <span className="my-post__link">
        <span className="my-post__title">
          <Line width="55%" />
        </span>
        <span className="my-post__meta">
          <Block className="tag">
            <Line width="2em" />
          </Block>
          <Line width="7em" />
        </span>
      </span>
      <div className="my-post__actions">
        <span className="btn-text">
          <Line width="2em" />
        </span>
        <span className="btn-text">
          <Line width="2em" />
        </span>
      </div>
    </div>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    me,
    email,
    bio,
    snsLink,
    profileImage,
    provider,
    myPosts,
    myPostPage,
    myPostsLoaded,
    loadMyPosts,
    deletePost,
    isAdmin,
    logout,
    withdraw,
    loading,
  } = useBlog();
  const [target, setTarget] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [signingOut, runSignOut] = usePending();

  const page = Math.max(1, Number(params.get("page")) || 1);

  // 내가 쓴 글은 서버가 페이지 단위로 줍니다 (GET /api/members/me/posts).
  // 감춘 글도 들어 있어서 여기서는 거르지 않습니다.
  useEffect(() => {
    if (!me) return;
    loadMyPosts({ pageNumber: page, pageSize: MY_PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, page]);


  // 첫 로딩 중에는 프로필 윗줄까지만 그립니다. 소개 · 링크가 있는지 모르니 그 아래는 비워 둡니다.
  if (loading)
    return (
      <Page>
        <BackBar to="/" title="마이페이지" label="목록으로" />
        <main>
          <Loading />
          <ProfileSkeleton />
        </main>
      </Page>
    );

  const hrefFor = (n) => (n > 1 ? `/mypage?page=${n}` : "/mypage");

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Page>
      <title>마이페이지 — 수로그</title>

      <ErrorNote />

      <BackBar to="/" title="마이페이지" label="목록으로" />

      <main>
        <section className="profile">
          <div className="profile__top">
            <Avatar name={me} size={56} photo={profileImage} />
            <div className="profile__who">
              <p className="profile__name">{me}</p>
              <p className="profile__account">
                {email}{" "}
                {provider && provider !== "local" && (
                  <Tag>{PROVIDER_LABELS[provider] ?? provider}</Tag>
                )}
              </p>
            </div>
            <Link className="chip profile__edit" to="/mypage/profile">
              프로필 수정
            </Link>
          </div>

          {(bio || snsLink) && (
            <div className="profile__extra">
              {bio && (
                <p className="profile__row">
                  <Briefcase />
                  {bio}
                </p>
              )}
              {snsLink && (
                <p className="profile__row">
                  <LinkIcon />
                  <a
                    href={
                      snsLink.startsWith("http")
                        ? snsLink
                        : `https://${snsLink}`
                    }
                    rel="me noopener"
                  >
                    {snsLink}
                  </a>
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="my-posts__head">
            내가 쓴 글{" "}
            <span className="my-posts__count">
              {myPostsLoaded ? myPostPage.totalElements : ""}
            </span>
          </h2>

          {/* 글이 오기 전에는 행 자리만 잡고, 페이지 버튼 · 로그아웃은 그 뒤에 그립니다. */}
          {!myPostsLoaded && (
            <Repeat count={MY_PAGE_SIZE}>
              <MyPostSkeleton />
            </Repeat>
          )}
          {myPostsLoaded && myPosts.length === 0 && (
            <p className="my-posts__empty">아직 쓴 글이 없습니다</p>
          )}

          {myPosts.map((post) => (
            <article className="my-post" key={post.id}>
              <Link className="my-post__link" to={`/posts/${post.id}`}>
                <span className="my-post__title">{post.title}</span>
                <span className="my-post__meta">
                  <Tag>{post.category}</Tag>
                  <span>{post.date}</span>
                  {post.hidden && <Tag variant="hidden">숨김</Tag>}
                  <Counts likes={post.likes} comments={post.commentCount} />
                </span>
              </Link>
              <div className="my-post__actions">
                <Link
                  className="btn-text btn-text--accent"
                  to={`/posts/${post.id}/edit`}
                >
                  수정
                </Link>
                <button
                  className="btn-text btn-text--muted"
                  type="button"
                  onClick={() => setTarget(post.id)}
                >
                  삭제
                </button>
              </div>
            </article>
          ))}

          {myPostsLoaded && (
            <Pagination
              page={page}
              total={myPostPage.totalPages}
              hrefFor={hrefFor}
              label="내가 쓴 글 페이지 이동"
            />
          )}
        </section>
      </main>

      {myPostsLoaded && isAdmin && (
        <Link className="admin-link" to="/admin/categories">
          관리자 페이지
          <ChevronRight />
        </Link>
      )}

      {myPostsLoaded && (
        <div className="sign-out">
          <button
            className="btn-quiet"
            type="button"
            disabled={signingOut}
            onClick={() => runSignOut(signOut)}
          >
            <PendingLabel pending={signingOut} label="로그아웃하는 중입니다">
              로그아웃
            </PendingLabel>
          </button>
          <button
            className="btn-inline sign-out__leave"
            type="button"
            onClick={() => setLeaving(true)}
          >
            회원 탈퇴
          </button>
        </div>
      )}

      <ConfirmDialog
        open={leaving}
        title="정말 탈퇴할까요?"
        text="닉네임 · 이메일 · 프로필이 지워지고, 쓴 글은 모두 감춰집니다. 되돌릴 수 없습니다."
        confirmLabel="탈퇴"
        onCancel={() => setLeaving(false)}
        onConfirm={async () => {
          const ok = await withdraw();
          setLeaving(false);
          // 로그아웃처럼 로그인 화면으로 갑니다
          if (ok) navigate("/login", { replace: true });
        }}
      />

      <ConfirmDialog
        open={target !== null}
        title="이 글을 삭제할까요?"
        text="삭제한 글은 다시 되돌릴 수 없습니다."
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          await deletePost(target);
          setTarget(null);
          // 마지막 글을 지워 이 페이지가 비면 앞 페이지로 물러납니다.
          if (myPosts.length === 1 && page > 1)
            navigate(hrefFor(page - 1), { replace: true });
          else await loadMyPosts({ pageNumber: page, pageSize: MY_PAGE_SIZE });
        }}
      />
    </Page>
  );
}
