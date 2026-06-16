import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  EMPTY_CHOICE,
  EMPTY_FORM,
  EMPTY_QUESTION,
  quizApi,
  type Choice,
  type Question,
  type QuizFormData,
} from "../../api/quizApi";

// ── Small components ──────────────────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-foreground mb-1.5">
    {children}
  </label>
);

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all";

const ErrorMsg = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-destructive text-xs mt-1">{msg}</p> : null;

// ── Main Component ────────────────────────────────────────────────────────────
export default function QuizFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<QuizFormData>(EMPTY_FORM());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [apiErr, setApiErr] = useState("");

  // Load quiz khi edit
  useEffect(() => {
    if (!id) return;
    quizApi
      .getById(id)
      .then((quiz) => {
        setForm({
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subject,
          duration: quiz.duration,
          questions: quiz.questions,
          isPublished: quiz.isPublished,
        });
      })
      .catch(() => navigate("/teacher/quizzes"))
      .finally(() => setFetching(false));
  }, [id]);

  const setField = (k: keyof QuizFormData, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Question handlers ──────────────────────────────────────────────────────
  const addQuestion = () =>
    setForm((f) => ({ ...f, questions: [...f.questions, EMPTY_QUESTION()] }));

  const removeQuestion = (qi: number) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== qi),
    }));

  const setQuestion = (qi: number, key: keyof Question, val: any) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qi ? { ...q, [key]: val } : q,
      ),
    }));

  const setChoice = (qi: number, ci: number, key: keyof Choice, val: any) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              choices: q.choices.map((c, j) =>
                j !== ci ? c : { ...c, [key]: val },
              ),
            },
      ),
    }));

  const setCorrect = (qi: number, ci: number) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              choices: q.choices.map((c, j) => ({ ...c, isCorrect: j === ci })),
            },
      ),
    }));

  const addChoice = (qi: number) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i !== qi ? q : { ...q, choices: [...q.choices, EMPTY_CHOICE()] },
      ),
    }));

  const removeChoice = (qi: number, ci: number) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i !== qi ? q : { ...q, choices: q.choices.filter((_, j) => j !== ci) },
      ),
    }));

  const moveQuestion = (qi: number, dir: -1 | 1) => {
    const next = qi + dir;
    if (next < 0 || next >= form.questions.length) return;
    setForm((f) => {
      const qs = [...f.questions];
      [qs[qi], qs[next]] = [qs[next], qs[qi]];
      return { ...f, questions: qs };
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Bắt buộc";
    if (!form.subject.trim()) e.subject = "Bắt buộc";
    if (!form.duration || form.duration < 1) e.duration = "Tối thiểu 1 phút";
    if (form.questions.length === 0) e.questions = "Cần ít nhất 1 câu hỏi";

    form.questions.forEach((q, i) => {
      if (!q.text.trim()) e[`q_${i}`] = "Nội dung câu hỏi bắt buộc";
      const hasCorrect = q.choices.some((c) => c.isCorrect);
      if (!hasCorrect) e[`q_${i}_correct`] = "Phải chọn 1 đáp án đúng";
      q.choices.forEach((c, j) => {
        if (!c.text.trim()) e[`q_${i}_c_${j}`] = "Không được để trống";
      });
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (publish = false) => {
    if (!validate()) return;
    setLoading(true);
    setApiErr("");
    try {
      const payload = { ...form, isPublished: publish };
      if (isEdit && id) {
        await quizApi.update(id, payload);
      } else {
        await quizApi.create(payload);
      }
      navigate("/teacher/quizzes");
    } catch (err: any) {
      setApiErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="w-5 h-5 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/teacher/quizzes")}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            {isEdit ? "Chỉnh sửa Quiz" : "Tạo Quiz mới"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {form.questions.length} câu hỏi
          </p>
        </div>
      </div>

      {/* ── API Error ── */}
      {apiErr && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {apiErr}
        </div>
      )}

      {/* ── Quiz Info ── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Thông tin Quiz</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Tiêu đề *</Label>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="VD: Toán lớp 10 - Chương 1"
              className={inputCls}
            />
            <ErrorMsg msg={errors.title} />
          </div>
          <div>
            <Label>Môn học *</Label>
            <input
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
              placeholder="VD: Toán, Lý, Hóa..."
              className={inputCls}
            />
            <ErrorMsg msg={errors.subject} />
          </div>
          <div>
            <Label>Thời gian (phút) *</Label>
            <input
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => setField("duration", Number(e.target.value))}
              className={inputCls}
            />
            <ErrorMsg msg={errors.duration} />
          </div>
          <div className="col-span-2">
            <Label>Mô tả</Label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Mô tả nội dung quiz..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* ── Questions ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Câu hỏi</p>
          {errors.questions && (
            <p className="text-destructive text-xs">{errors.questions}</p>
          )}
        </div>

        {form.questions.map((q, qi) => (
          <div
            key={qi}
            className="bg-card border border-border rounded-xl p-5 space-y-4"
          >
            {/* Question header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                Câu {qi + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveQuestion(qi, -1)}
                  disabled={qi === 0}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 15.75l7.5-7.5 7.5 7.5"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => moveQuestion(qi, 1)}
                  disabled={qi === form.questions.length - 1}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => removeQuestion(qi)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Question text */}
            <div>
              <Label>Nội dung câu hỏi *</Label>
              <textarea
                value={q.text}
                onChange={(e) => setQuestion(qi, "text", e.target.value)}
                placeholder="Nhập nội dung câu hỏi..."
                rows={2}
                className={`${inputCls} resize-none`}
              />
              <ErrorMsg msg={errors[`q_${qi}`]} />
            </div>

            {/* Choices */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
                  Lựa chọn *{" "}
                  <span className="text-muted-foreground font-normal">
                    (click ◯ để chọn đáp án đúng)
                  </span>
                </Label>
                <ErrorMsg msg={errors[`q_${qi}_correct`]} />
              </div>
              <div className="space-y-2">
                {q.choices.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    {/* Radio correct */}
                    <button
                      onClick={() => setCorrect(qi, ci)}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        c.isCorrect
                          ? "border-primary bg-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {c.isCorrect && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                    <input
                      value={c.text}
                      onChange={(e) =>
                        setChoice(qi, ci, "text", e.target.value)
                      }
                      placeholder={`Lựa chọn ${ci + 1}`}
                      className={`flex-1 px-3 py-2 rounded-lg bg-input border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${
                        errors[`q_${qi}_c_${ci}`]
                          ? "border-destructive focus:ring-2 focus:ring-destructive/20"
                          : "border-border focus:border-ring focus:ring-2 focus:ring-ring/20"
                      }`}
                    />
                    {q.choices.length > 2 && (
                      <button
                        onClick={() => removeChoice(qi, ci)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {q.choices.length < 6 && (
                <button
                  onClick={() => addChoice(qi)}
                  className="mt-2 text-xs text-primary hover:opacity-75 transition-opacity flex items-center gap-1"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Thêm lựa chọn
                </button>
              )}
            </div>

            {/* Explanation */}
            <div>
              <Label>Giải thích đáp án (tuỳ chọn)</Label>
              <input
                value={q.explanation}
                onChange={(e) => setQuestion(qi, "explanation", e.target.value)}
                placeholder="Giải thích tại sao đáp án đúng..."
                className={inputCls}
              />
            </div>
          </div>
        ))}

        {/* Add question */}
        <button
          onClick={addQuestion}
          className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Thêm câu hỏi
        </button>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={() => navigate("/teacher/quizzes")}
          className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Hủy
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
          >
            Lưu nháp
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading && (
              <svg
                className="w-3.5 h-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isEdit ? "Lưu & Xuất bản" : "Tạo & Xuất bản"}
          </button>
        </div>
      </div>
    </div>
  );
}
