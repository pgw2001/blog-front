import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useBlog } from "../../store/BlogContext.jsx";
import { EditorBar, Page } from "../../components/Chrome.jsx";
import { TextField } from "../../components/Fields.jsx";
import { ErrorNote, Loading } from "../../components/Status.jsx";
import { usePending } from "../../components/Spinner.jsx";

/** 추가와 수정이 같은 화면입니다. :id 가 있으면 수정입니다. */
export default function AdminCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, addCategory, renameCategory, loading } = useBlog();

  const editing = Boolean(id);
  const [saving, runSave] = usePending();
  const category = editing
    ? categories.find((c) => String(c.id) === String(id))
    : null;

  // 주소로 바로 들어오면 카테고리가 올 때까지 같은 입력 칸을 막아 둔 채로 기다립니다.
  const waiting = loading && editing && !category;

  if (!waiting && editing && !category)
    return <Navigate to="/admin/categories" replace />;

  const save = async (formData) => {
    const name = String(formData.get("name") ?? "").trim();
    if (name) {
      const ok = editing
        ? await renameCategory(category.id, name)
        : await addCategory(name);
      if (!ok) return; // 실패하면 화면에 남겨 둡니다 (오류 줄이 뜹니다)
    }
    navigate("/admin/categories");
  };

  return (
    <Page>
      <title>
        {editing ? "카테고리 수정 — 수로그" : "카테고리 추가 — 수로그"}
      </title>

      <ErrorNote />

      <EditorBar
        cancelTo="/admin/categories"
        title={editing ? "카테고리 수정" : "카테고리 추가"}
        formId="category-form"
        disabled={waiting}
        pending={saving}
      />

      <main className="auth">
        {/* 기다리던 값이 오면 form 을 새로 만들어 defaultValue · autoFocus 가 다시 적용되게 합니다. */}
        <form
          className="auth__form"
          id="category-form"
          action={(fd) => runSave(() => save(fd))}
          aria-busy={saving}
          key={waiting ? "waiting" : "ready"}
        >
          {waiting && <Loading />}
          <TextField
            id="name"
            label="이름"
            type="text"
            defaultValue={category?.name ?? ""}
            placeholder={waiting ? "" : "예: 읽은 글"}
            maxLength={10}
            disabled={waiting}
            required
            autoFocus
            hint="10자까지. 글 목록 맨 위의 필터와 글 작성 화면에 바로 나타납니다."
          />
        </form>
      </main>
    </Page>
  );
}
