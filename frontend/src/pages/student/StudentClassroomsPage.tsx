// src/pages/student/StudentClassroomsPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { classroomApi } from "../../api/classroomApi";
import type { Classroom, ClassroomQuiz } from "../../types/classroom.types";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm " +
  "text-foreground placeholder:text-muted-foreground/50 outline-none " +
  "focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all";

// ─────────────────────────────────────────────────────────────────────────────
export default function StudentClassroomsPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selected, setSelected] = useState<Classroom | null>(null);
  const [quizzes, setQuizzes] = useState<ClassroomQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [qLoading, setQLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // ── Load danh sách lớp ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClasses(await classroomApi.enrolled());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Khi chọn lớp → load quiz published ───────────────────────────────────
  const selectClass = useCallback(async (cls: Classroom) => {
    setSelected(cls);
    setQuizzes([]);
    setQLoading(true);
    try {
      const list = await classroomApi.classQuizzes(cls._id);
      setQuizzes(list);
    } finally {
      setQLoading(false);
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoin = async (code: string) => {
    const cls = await classroomApi.join({ code });
    setClasses((prev) => [cls, ...prev]);
    setShowJoin(false);
    await selectClass(cls);
  };

  const handleLeave = async (id: string, name: string) => {
    if (!confirm(`Rời khỏi lớp "${name}"?`)) return;
    await classroomApi.leave(id);
    setClasses((prev) => prev.filter((c) => c._id !== id));
    if (selected?._id === id) {
      setSelected(null);
      setQuizzes([]);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 border-r border-border flex flex-col bg-card">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Lớp học của tôi
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {classes.length} lớp
            </p>
          </div>
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon /> Tham gia
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <Spinner />
          ) : classes.length === 0 ? (
            <EmptyState
              title="Chưa tham gia lớp nào"
              sub="Nhập mã lớp từ giáo viên"
              action={{
                label: "Tham gia lớp →",
                onClick: () => setShowJoin(true),
              }}
            />
          ) : (
            classes.map((cls) => (
              <button
                key={cls._id}
                onClick={() => selectClass(cls)}
                className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors hover:bg-muted/40 ${
                  selected?._id === cls._id
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : ""
                }`}
              >
                <p className="text-xs font-semibold text-foreground truncate">
                  {cls.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  GV: {cls.teacherId.name} · {cls.quizzes.length} quiz
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Detail: quiz của lớp ── */}
      {selected ? (
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-card/50 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {selected.name}
              </h2>
              {selected.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                Giáo viên:{" "}
                <span className="font-medium text-foreground">
                  {selected.teacherId.name}
                </span>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span>{selected.teacherId.email}</span>
              </p>
            </div>
            <button
              onClick={() => handleLeave(selected._id, selected.name)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
            >
              Rời lớp
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Quiz trong lớp
                {!qLoading && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({quizzes.length})
                  </span>
                )}
              </h3>
            </div>

            {qLoading ? (
              <Spinner />
            ) : quizzes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
                <QuizIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-xs text-muted-foreground">
                  Giáo viên chưa gán quiz nào vào lớp này
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {quizzes.map((q) => (
                  <QuizCard
                    key={q._id}
                    quiz={q}
                    onStart={() => navigate(`/student/quizzes/${q._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ClassIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-sm font-medium text-foreground">
              Chọn lớp để xem quiz
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              hoặc tham gia lớp mới
            </p>
          </div>
        </div>
      )}

      {showJoin && (
        <JoinModal onClose={() => setShowJoin(false)} onJoin={handleJoin} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuizCard — hiển thị 1 quiz + nút Làm bài
// ─────────────────────────────────────────────────────────────────────────────
function QuizCard({
  quiz,
  onStart,
}: {
  quiz: ClassroomQuiz;
  onStart: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-ring/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <QuizIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {quiz.title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {quiz.subject}
          </p>
        </div>
      </div>

      <div className="flex gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ClockIcon /> {quiz.duration} phút
        </span>
        {quiz.questionCount != null && (
          <span className="flex items-center gap-1">
            <span className="w-0.5 h-3 bg-border" />
            {quiz.questionCount} câu hỏi
          </span>
        )}
      </div>

      <button
        onClick={onStart}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <PlayIcon /> Làm bài
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JoinModal
// ─────────────────────────────────────────────────────────────────────────────
function JoinModal({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (code.trim().length < 6) {
      setErr("Mã lớp gồm 6 ký tự");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await onJoin(code.trim().toUpperCase());
      setOk("Tham gia thành công!");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4"
        style={{ animation: "jIn .16s ease both" }}
      >
        <style>{`@keyframes jIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

        <div>
          <h3 className="text-sm font-bold text-foreground">
            Tham gia lớp học
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nhập mã 6 ký tự từ giáo viên
          </p>
        </div>

        {ok && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-primary/10 border border-primary/20 text-primary">
            <CheckIcon /> {ok}
          </div>
        )}
        {err && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-destructive/10 border border-destructive/20 text-destructive">
            <WarnIcon /> {err}
          </div>
        )}

        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setErr("");
            setOk("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="VD: ABC123"
          maxLength={6}
          autoFocus
          className={
            inputCls +
            " text-center font-mono text-xl font-bold tracking-[.25em] uppercase"
          }
        />

        {/* Mã length indicator */}
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < code.length ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={busy || code.length < 6}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5"
          >
            {busy ? <MiniSpin /> : null} Tham gia
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────────────
const EmptyState = ({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: { label: string; onClick: () => void };
}) => (
  <div className="text-center py-12 px-4">
    <ClassIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
    <p className="text-xs font-medium text-foreground">{title}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-2 text-xs text-primary font-medium hover:opacity-75"
      >
        {action.label}
      </button>
    )}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-10">
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
const MiniSpin = () => (
  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
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
);
const PlusIcon = () => (
  <svg
    className="w-3 h-3"
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
);
const PlayIcon = () => (
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
      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
    />
  </svg>
);
const ClockIcon = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const CheckIcon = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
);
const WarnIcon = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
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
);
const ClassIcon = ({ className }: { className?: string }) => (
  <svg
    className={className ?? "w-6 h-6"}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
    />
  </svg>
);
const QuizIcon = ({ className }: { className?: string }) => (
  <svg
    className={className ?? "w-5 h-5"}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
    />
  </svg>
);
