import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBlog } from "../../store/BlogContext.jsx";
import { Tag } from "../../components/Chrome.jsx";
import { Block, Line, Repeat } from "../../components/Skeleton.jsx";
import { ErrorNote, Loading } from "../../components/Status.jsx";
import Pagination from "../../components/Pagination.jsx";
import { ADMIN_PAGE_SIZE } from "../../ui.js";

function AdminPostSkeleton() {
  return (
    <div className="admin-post">
      <div className="admin-post__main">
        <span className="admin-post__title">
          <Line width="60%" />
        </span>
        <span className="admin-post__meta">
          <Block className="tag">
            <Line width="2em" />
          </Block>
          <Line width="8em" />
        </span>
      </div>
      <span className="btn-text">
        <Line width="2.5em" />
      </span>
    </div>
  );
}

export default function AdminPosts() {
  const [params] = useSearchParams();
  const {
    adminPosts,
    adminPostPage,
    adminPostsLoaded,
    loadAdminPosts,
    toggleHidden,
    isAdmin,
  } = useBlog();

  const page = Math.max(1, Number(params.get("page")) || 1);

  // 감춘 글까지 보려면 관리자용 주소를 써야 합니다 (GET /api/admin/posts).
  useEffect(() => {
    if (!isAdmin) return;
    loadAdminPosts({ pageNumber: page, pageSize: ADMIN_PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, page]);

  const hiddenCount = adminPosts.filter((p) => p.hidden).length;
  const hrefFor = (n) => (n > 1 ? `/admin/posts?page=${n}` : "/admin/posts");

  return (
    <>
      <title>관리자 · 게시글 — 수로그</title>

      <h2 className="admin-head">
        게시글
        <span className="admin-head__count">
          {!adminPostsLoaded
            ? ""
            : hiddenCount > 0
              ? `${adminPostPage.totalElements} · 이 쪽 숨김 ${hiddenCount}`
              : adminPostPage.totalElements}
        </span>
      </h2>

      <ErrorNote />

      {/* 글이 오기 전에는 행 자리만 잡고, 페이지 버튼은 그 뒤에 그립니다. */}
      {!adminPostsLoaded && (
        <>
          <Loading />
          <Repeat count={ADMIN_PAGE_SIZE}>
            <AdminPostSkeleton />
          </Repeat>
        </>
      )}

      {adminPosts.map((p) => (
        <article
          className={p.hidden ? "admin-post admin-post--hidden" : "admin-post"}
          key={p.id}
        >
          <div className="admin-post__main">
            <Link className="admin-post__title" to={`/posts/${p.id}`}>
              {p.title}
            </Link>
            <span className="admin-post__meta">
              <Tag>{p.category}</Tag>
              <span>
                {p.author} · {p.date}
              </span>
              {p.hidden && <Tag variant="hidden">숨김</Tag>}
            </span>
          </div>
          <button
            className={
              p.hidden
                ? "btn-text btn-text--accent"
                : "btn-text btn-text--muted"
            }
            type="button"
            onClick={() => toggleHidden(p.id)}
          >
            {p.hidden ? "다시 공개" : "감추기"}
          </button>
        </article>
      ))}

      {adminPostsLoaded && (
        <Pagination
          page={page}
          total={adminPostPage.totalPages}
          hrefFor={hrefFor}
          label="게시글 페이지 이동"
        />
      )}
    </>
  );
}
