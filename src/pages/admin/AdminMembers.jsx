import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBlog } from "../../store/BlogContext.jsx";
import { Avatar, Tag } from "../../components/Chrome.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { ErrorNote, Loading } from "../../components/Status.jsx";
import Pagination from "../../components/Pagination.jsx";
import { ADMIN_PAGE_SIZE } from "../../ui.js";
import { Block, Line, Repeat } from "../../components/Skeleton.jsx";

function MemberSkeleton() {
  return (
    <div className="member">
      <div className="member__top">
        <Block className="avatar avatar--40" />
        <div className="member__main">
          <p className="member__name">
            <Line width="3em" />
          </p>
          <p className="member__mail">
            <Line width="10em" />
          </p>
        </div>
        <div className="member__role">
          <span className="btn-text">
            <Line width="4.5em" />
          </span>
        </div>
      </div>
      <p className="member__meta">
        <Line width="11em" />
      </p>
    </div>
  );
}

export default function AdminMembers() {
  const [params] = useSearchParams();
  const {
    members,
    memberPage,
    membersLoaded,
    loadMembers,
    toggleMemberRole,
    deleteMember,
    isAdmin,
  } = useBlog();
  const [target, setTarget] = useState(null);
  const [removing, setRemoving] = useState(null);

  const page = Math.max(1, Number(params.get("page")) || 1);

  useEffect(() => {
    if (!isAdmin) return;
    loadMembers({ pageNumber: page, pageSize: ADMIN_PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, page]);

  const hrefFor = (n) =>
    n > 1 ? `/admin/members?page=${n}` : "/admin/members";
  const granting = target ? target.admin === false : false;

  return (
    <>
      <title>관리자 · 회원 — 수로그</title>

      <h2 className="admin-head">
        회원{" "}
        <span className="admin-head__count">
          {membersLoaded ? memberPage.totalElements : ""}
        </span>
      </h2>

      <ErrorNote />

      {/* 회원이 오기 전에는 행 자리만 잡고, 페이지 버튼 · 안내 문구는 그 뒤에 그립니다. */}
      {!membersLoaded && (
        <>
          <Loading />
          <Repeat count={ADMIN_PAGE_SIZE}>
            <MemberSkeleton />
          </Repeat>
        </>
      )}

      {members.map((m) => (
        <article className="member" key={m.id}>
          <div className="member__top">
            <Avatar name={m.name} size={40} />
            <div className="member__main">
              <p className="member__name">
                {m.name}
                {m.admin && <Tag variant="admin">관리자</Tag>}
              </p>
              <p className="member__mail">{m.mail}</p>
            </div>
            {m.self ? (
              <span className="member__self">본인</span>
            ) : m.deleted ? (
              // 탈퇴한 회원은 권한을 바꿀 수 없습니다 (서버가 404 로 답합니다)
              <Tag variant="hidden">탈퇴</Tag>
            ) : (
              <div className="member__role">
                <button
                  className={
                    m.admin
                      ? "btn-text btn-text--muted"
                      : "btn-text btn-text--accent"
                  }
                  type="button"
                  onClick={() => setTarget(m)}
                >
                  {m.admin ? "관리자 해제" : "관리자 지정"}
                </button>
                <button
                  className="btn-text btn-text--muted"
                  type="button"
                  onClick={() => setRemoving(m)}
                >
                  탈퇴
                </button>
              </div>
            )}
          </div>
          {/* 글 수는 서버가 세어서 줍니다 (MemberAdminResponse.postCount) */}
          <p className="member__meta">
            글 {m.postCount} · {m.joined} 가입
          </p>
        </article>
      ))}

      {membersLoaded && (
        <>
          <Pagination
            page={page}
            total={memberPage.totalPages}
            hrefFor={hrefFor}
            label="회원 페이지 이동"
          />

          <p className="admin-note">
            관리자는 카테고리와 게시글을 관리할 수 있습니다. 자기 자신의 권한은
            내릴 수 없습니다.
          </p>
        </>
      )}

      <ConfirmDialog
        open={target !== null}
        title={
          granting
            ? "이 회원을 관리자로 지정할까요?"
            : "관리자 권한을 해제할까요?"
        }
        text={
          granting
            ? "관리자는 카테고리와 게시글을 관리할 수 있습니다."
            : "이 회원은 더 이상 관리 화면에 들어갈 수 없습니다."
        }
        confirmLabel={granting ? "지정" : "해제"}
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          await toggleMemberRole(target.id);
          setTarget(null);
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`${removing?.name ?? ""} 님을 탈퇴시킬까요?`}
        text="닉네임 · 이메일 · 프로필이 지워지고, 이 회원의 글은 모두 감춰집니다. 되돌릴 수 없습니다."
        confirmLabel="탈퇴"
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          const ok = await deleteMember(removing.id);
          setRemoving(null);
          // 서버가 이름 · 이메일을 바꿔 두었으므로 이 쪽을 다시 받아 옵니다
          if (ok) loadMembers({ pageNumber: page, pageSize: ADMIN_PAGE_SIZE });
        }}
      />
    </>
  );
}
