import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useBlog } from "../store/BlogContext.jsx";
import { Brand, Page } from "../components/Chrome.jsx";
import CategoryBar from "../components/CategoryBar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { Plus, SearchIcon } from "../components/Icons.jsx";
import Pagination from "../components/Pagination.jsx";
import { PostMeta } from "../components/PostMeta.jsx";
import { PAGE_SIZE } from "../ui.js";
import { ErrorNote, Loading } from "../components/Status.jsx";
import { Block, Line, Repeat } from "../components/Skeleton.jsx";

/** 목록 주소. 카테고리 · 검색어 · 페이지를 함께 담습니다. */
function listHref({ category = "", query = "", page = 1 }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

/** text 안에서 query 와 맞는 부분을 <mark> 로 감쌉니다. 대소문자는 가리지 않습니다. */
function Highlight({ text, query }) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const parts = [];
  let from = 0;
  for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark className="highlight" key={at}>
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
  }
  parts.push(text.slice(from));
  return parts;
}

function PostRow({ post, query }) {
  const paragraphs = post.body.split("\n\n");
  // 검색 중이면 검색어가 들어 있는 문단을 요약으로 보여 줍니다.
  const excerpt =
    (query &&
      paragraphs.find((p) => p.toLowerCase().includes(query.toLowerCase()))) ||
    paragraphs[0];

  return (
    <Link className="post-item" to={`/posts/${post.id}`}>
      <span className="post-item__title">
        <Highlight text={post.title} query={query} />
      </span>
      <span className="post-item__excerpt">
        <Highlight text={excerpt} query={query} />
      </span>
      <PostMeta post={post} />
    </Link>
  );
}

/** 글을 받아 오기 전의 행. PostRow 와 같은 class 를 써서 높이가 같습니다. */
function PostRowSkeleton() {
  return (
    <div className="post-item">
      <span className="post-item__title">
        <Line width="60%" />
      </span>
      <span className="post-item__excerpt">
        <Line />
        <Line width="45%" />
      </span>
      <span className="post-item__meta">
        <Block className="tag">
          <Line width="2em" />
        </Block>
        <span className="post-item__author">
          <Line width="2.5em" />
        </span>
        <span className="post-item__date">
          <Line width="7em" />
        </span>
      </span>
    </div>
  );
}

export default function PostList() {
  const {
    posts,
    postPage,
    postsLoading,
    categories,
    categoryNames,
    loadPosts,
    me,
    loading,
  } = useBlog();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // 무엇을 보여 줄지는 전부 주소에 적혀 있습니다.
  const category = params.get("category") ?? "";
  const query = (params.get("q") ?? "").trim();
  const page = Math.max(1, Number(params.get("page")) || 1);

  // 주소에는 카테고리가 이름으로 들어 있고, 서버는 id 로 받습니다.
  const categoryId = categories.find((c) => c.name === category)?.id ?? null;

  // 카테고리 · 검색어 · 페이지가 바뀔 때마다 그 한 쪽을 서버에서 받아 옵니다.
  useEffect(() => {
    // 이름을 id 로 바꾸려면 카테고리 목록이 먼저 있어야 합니다.
    if (category && categoryId === null) return;
    loadPosts({
      categoryId,
      keyword: query,
      pageNumber: page,
      pageSize: PAGE_SIZE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, categoryId, query, page]);

  // 거르는 일도 페이지를 끊는 일도 서버가 했습니다. 받은 것을 그대로 그립니다.
  const shown = posts;
  const totalPages = postPage.totalPages;
  const busy = loading || postsLoading;

  // 없는 쪽을 달라고 하면 (주소를 직접 고쳤거나, 글이 지워져 쪽이 줄었거나)
  // 마지막 쪽으로 돌려보냅니다. 몇 쪽까지 있는지는 받아 보고서야 압니다.
  useEffect(() => {
    if (busy || page <= totalPages) return;
    navigate(listHref({ category, query, page: totalPages }), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, page, totalPages]);

  // 카테고리를 바꾸거나 페이지를 넘겨도 검색어는 유지합니다.
  const hrefFor = (n) => listHref({ category, query, page: n });
  const categoryHref = (name) => listHref({ category: name, query });

  /* ── 검색 ─────────────────────────────────────────────── */

  // 검색어가 주소에 있으면 늘 검색 모드입니다. 버튼으로 열기만 하고 아직 검색하지 않은 상태는 searchOpen 이 들고 있습니다.
  const [searchOpen, setSearchOpen] = useState(false);
  const searching = searchOpen || Boolean(query);
  const searchButtonRef = useRef(null);
  const returnFocus = useRef(false);

  const search = (value) => navigate(listHref({ category, query: value }));

  const closeSearch = () => {
    setSearchOpen(false);
    returnFocus.current = true;
    if (query) navigate(listHref({ category }));
  };

  // 검색을 닫으면 초점을 검색 버튼으로 돌려놓습니다 (키보드로 쓰는 사람이 제자리를 잃지 않게).
  useEffect(() => {
    if (searching || !returnFocus.current) return;
    returnFocus.current = false;
    searchButtonRef.current?.focus();
  }, [searching]);

  const sectionLabel = query
    ? `‘${query}’ 검색 결과${busy ? "" : ` ${postPage.totalElements}건`}`
    : category || "전체";

  return (
    <Page>
      <title>{query ? `‘${query}’ 검색 — 수로그` : "수로그"}</title>

      {/* 검색 모드에서도 상단 바 높이는 같습니다. 열고 닫을 때 아래가 밀리지 않습니다. */}
      <header
        className={searching ? "appbar appbar--search" : "appbar appbar--between"}
      >
        {searching ? (
          <SearchBar
            key={query}
            initial={query}
            onSearch={search}
            onClose={closeSearch}
          />
        ) : (
          <>
            <Brand />
            <div className="appbar__actions">
              <button
                ref={searchButtonRef}
                className="btn-icon"
                type="button"
                aria-label="검색"
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon />
              </button>
              <Link className="btn-pill" to="/write">
                <Plus /> 새 글
              </Link>
            </div>
          </>
        )}
      </header>

      <CategoryBar
        names={categoryNames}
        current={category}
        hrefFor={categoryHref}
        loading={loading}
      />

      <ErrorNote />

      <main>
        {/* 받아 오는 동안에는 행 자리만 그리고, 그 아래(페이지 버튼 · 하단)는 그리지 않습니다.
            아래에 미리 그려 둔 것이 없으니 글이 들어와도 밀려 내려가는 것이 없습니다. */}
        {busy && (
          <section className="post-list">
            <Loading />
            <h2 className="section-label">{sectionLabel}</h2>
            <Repeat count={PAGE_SIZE}>
              <PostRowSkeleton />
            </Repeat>
          </section>
        )}

        {/* 서버에 글 고정 기능이 없어서 '고정' 자리는 두지 않았습니다.
            POST 테이블에 컬럼을 하나 더하는 것부터 시작하면 됩니다. */}

        {!busy && shown.length > 0 && (
          <section className="post-list">
            <h2 className="section-label">{sectionLabel}</h2>
            {shown.map((p) => (
              <PostRow key={p.id} post={p} query={query} />
            ))}
          </section>
        )}

        {!busy && (
          <Pagination
            page={page}
            total={totalPages}
            hrefFor={hrefFor}
            label="글 목록 페이지 이동"
          />
        )}

        {!busy && shown.length === 0 && (
          <div className="empty">
            <p className="empty__title">
              {query
                ? `‘${query}’에 맞는 글이 없습니다`
                : category
                  ? "이 카테고리에는 아직 글이 없습니다"
                  : "아직 남긴 글이 없습니다"}
            </p>
            <p className="empty__text">
              {query
                ? category
                  ? "다른 검색어로 찾거나 전체 카테고리에서 찾아보세요"
                  : "다른 검색어로 찾아보세요"
                : category
                  ? "다른 카테고리를 골라 보세요"
                  : "오른쪽 위 새 글 버튼으로 시작해 보세요"}
            </p>
          </div>
        )}
      </main>

      {/* 로그인 여부도 첫 로딩이 끝나야 알 수 있어서, 그 전에는 하단을 그리지 않습니다. */}
      {!loading && (
        <footer className="footer">
          {/* 로그인 전에는 로그인 링크만 보여 줍니다. */}
          <div className="footer__account">
            {me ? (
              <>
                <span className="footer__user">
                  <strong>{me}</strong> 님으로 로그인 중
                </span>
                <Link className="footer__link" to="/mypage">
                  마이페이지
                </Link>
              </>
            ) : (
              <>
                <span className="footer__user">
                  로그인하면 글을 남길 수 있습니다
                </span>
                <Link className="footer__link" to="/login">
                  로그인
                </Link>
              </>
            )}
          </div>
          <Brand size={20} nameClass="footer__name" />
          <small className="footer__copy">© 2026 수로그</small>
        </footer>
      )}
    </Page>
  );
}
