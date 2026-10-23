import { useState } from "react";
import { Link } from "react-router-dom";
import { useBlog } from "../../store/BlogContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { ErrorNote, Loading } from "../../components/Status.jsx";
import { Line, Repeat } from "../../components/Skeleton.jsx";
import { ADMIN_PAGE_SIZE } from "../../ui.js";

function CategoryRowSkeleton() {
  return (
    <div className="admin-row">
      <div className="admin-row__main">
        <span className="admin-row__title">
          <Line width="4em" />
        </span>
        <span className="admin-row__sub">
          <Line width="3em" />
        </span>
      </div>
      <div className="admin-row__actions">
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

export default function AdminCategories() {
  const { categories, deleteCategory, loading } = useBlog();
  const [target, setTarget] = useState(null);

  return (
    <>
      <title>관리자 · 카테고리 — 수로그</title>

      <h2 className="admin-head">
        카테고리{" "}
        <span className="admin-head__count">
          {loading ? "" : categories.length}
        </span>
        <Link className="chip admin-head__action" to="/admin/categories/new">
          + 추가
        </Link>
      </h2>

      <ErrorNote />

      {/* 카테고리가 오기 전에는 행 자리만 잡고, 아래 안내 문구는 그 뒤에 그립니다. */}
      {loading && (
        <>
          <Loading />
          <Repeat count={ADMIN_PAGE_SIZE}>
            <CategoryRowSkeleton />
          </Repeat>
        </>
      )}

      {!loading && categories.map((c) => {
        // 글 수는 서버가 세어서 줍니다 (CategoryDto.postCount)
        const used = c.postCount;
        return (
          <div className="admin-row" key={c.id}>
            <div className="admin-row__main">
              <span className="admin-row__title">{c.name}</span>
              <span className="admin-row__sub">글 {used}개</span>
            </div>
            <div className="admin-row__actions">
              <Link
                className="btn-text btn-text--accent"
                to={`/admin/categories/${c.id}`}
              >
                수정
              </Link>
              {used > 0 ? (
                <span className="btn-text btn-text--off" aria-disabled="true">
                  삭제
                </span>
              ) : (
                <button
                  className="btn-text btn-text--muted"
                  type="button"
                  onClick={() => setTarget(c.id)}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!loading && (
        <p className="admin-note">
          글이 남아 있는 카테고리는 지울 수 없습니다. 글을 먼저 옮기거나 지워
          주세요.
        </p>
      )}

      <ConfirmDialog
        open={target !== null}
        title="이 카테고리를 삭제할까요?"
        text="글이 없는 카테고리만 지울 수 있습니다. 삭제하면 되돌릴 수 없습니다."
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          await deleteCategory(target);
          setTarget(null);
        }}
      />
    </>
  );
}
