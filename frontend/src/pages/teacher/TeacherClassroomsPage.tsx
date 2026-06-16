// src/pages/teacher/TeacherClassroomsPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { classroomApi } from "../../api/classroomApi";
import type {
  Classroom,
  ClassroomQuiz,
  StudentRef,
} from "../../types/classroom.types";

// ─────────────────────────────────────────────────────────────────────────────
// Fetch teacher's own quizzes (để assign)
// ─────────────────────────────────────────────────────────────────────────────
const getToken = (): string => {
  try {
    return JSON.parse(localStorage.getItem("auth") ?? "{}").accessToken ?? "";
  } catch {
    return "";
  }
};

async function fetchMyQuizzes(): Promise<ClassroomQuiz[]> {
  const res = await fetch("/api/quizzes?page=1&limit=100", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const data = await res.json();
  return (data.data?.quizzes ?? []) as ClassroomQuiz[];
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm " +
  "text-foreground placeholder:text-muted-foreground/50 outline-none " +
  "focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all";

// ─────────────────────────────────────────────────────────────────────────────
export default function TeacherClassroomsPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selected, setSelected] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [myQuizzes, setMyQuizzes] = useState<ClassroomQuiz[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClasses(await classroomApi.myClasses());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async (id: string) => {
    const cls = await classroomApi.getOne(id);
    setSelected(cls);
    setClasses((prev) => prev.map((c) => (c._id === id ? cls : c)));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async (name: string, description: string) => {
    const cls = await classroomApi.create({ name, description });
    setClasses((prev) => [cls, ...prev]);
    setSelected(cls);
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa lớp này? Hành động không thể hoàn tác.")) return;
    await classroomApi.remove(id);
    setClasses((prev) => prev.filter((c) => c._id !== id));
    if (selected?._id === id) setSelected(null);
  };

  const handleKick = async (studentId: string) => {
    if (!selected) return;
    await classroomApi.kickStudent(selected._id, studentId);
    await refresh(selected._id);
  };

  const handleAssign = async (quizId: string) => {
    if (!selected) return;
    await classroomApi.assignQuiz(selected._id, quizId);
    await refresh(selected._id);
  };

  const handleRemoveQuiz = async (quizId: string) => {
    if (!selected) return;
    await classroomApi.removeQuiz(selected._id, quizId);
    await refresh(selected._id);
  };

  const openAssign = async () => {
    const list = await fetchMyQuizzes();
    setMyQuizzes(list);
    setShowAssign(true);
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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon /> Tạo lớp
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <Spinner />
          ) : classes.length === 0 ? (
            <EmptyState
              title="Chưa có lớp nào"
              sub="Nhấn Tạo lớp để bắt đầu"
              action={{
                label: "Tạo lớp đầu tiên →",
                onClick: () => setShowCreate(true),
              }}
            />
          ) : (
            classes.map((cls) => (
              <button
                key={cls._id}
                onClick={() => setSelected(cls)}
                className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors hover:bg-muted/40 ${
                  selected?._id === cls._id
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {cls.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {cls.students.length} học sinh · {cls.quizzes.length} quiz
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary tracking-widest">
                    {cls.code}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Detail panel ── */}
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
              {/* Code badge */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20">
                  <KeyIcon />
                  <span className="text-xs text-muted-foreground">
                    Mã tham gia:
                  </span>
                  <span className="font-mono text-base font-bold text-primary tracking-[.2em]">
                    {selected.code}
                  </span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(selected.code)}
                  className="text-[10px] px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-ring/50 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => handleDelete(selected._id)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <TrashIcon />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* ── Học sinh ── */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Học sinh{" "}
                <span className="text-muted-foreground font-normal">
                  ({selected.students.length})
                </span>
              </h3>
              {selected.students.length === 0 ? (
                <Dashed>
                  <p className="text-xs text-muted-foreground">
                    Chưa có học sinh nào
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Chia sẻ mã{" "}
                    <span className="font-mono font-bold text-primary">
                      {selected.code}
                    </span>{" "}
                    để học sinh tham gia
                  </p>
                </Dashed>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {selected.students.map((s: StudentRef, i: number) => (
                    <div
                      key={s._id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < selected.students.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary text-xs font-bold uppercase">
                          {s.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {s.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleKick(s._id)}
                        className="text-[10px] px-2 py-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Quiz ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Quiz{" "}
                  <span className="text-muted-foreground font-normal">
                    ({selected.quizzes.length})
                  </span>
                </h3>
                <button
                  onClick={openAssign}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:opacity-75 transition-opacity"
                >
                  <PlusIcon small /> Gán quiz
                </button>
              </div>

              {selected.quizzes.length === 0 ? (
                <Dashed>
                  <p className="text-xs text-muted-foreground">
                    Chưa có quiz nào trong lớp
                  </p>
                  <button
                    onClick={openAssign}
                    className="mt-1.5 text-xs text-primary font-medium hover:opacity-75"
                  >
                    Gán quiz ngay →
                  </button>
                </Dashed>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selected.quizzes.map((q: ClassroomQuiz) => (
                    <div
                      key={q._id}
                      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-ring/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {q.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {q.subject} · {q.duration} phút
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                            q.isPublished
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {q.isPublished ? "Live" : "Nháp"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() =>
                            navigate(`/teacher/quizzes/${q._id}/edit`)
                          }
                          className="text-[10px] text-primary font-medium hover:opacity-75"
                        >
                          Chỉnh sửa →
                        </button>
                        <button
                          onClick={() => handleRemoveQuiz(q._id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Gỡ khỏi lớp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ClassIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-sm font-medium text-foreground">
              Chọn lớp để quản lý
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              hoặc tạo lớp mới
            </p>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateClassModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {showAssign && selected && (
        <AssignQuizModal
          quizzes={myQuizzes}
          assignedIds={selected.quizzes.map((q) => q._id)}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateClassModal
// ─────────────────────────────────────────────────────────────────────────────
function CreateClassModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setErr("Tên lớp không được để trống");
      return;
    }
    setBusy(true);
    try {
      await onCreate(name.trim(), desc.trim());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Tạo lớp mới" onClose={onClose}>
      {err && <ErrBanner msg={err} />}
      <Field label="Tên lớp *">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErr("");
          }}
          placeholder="VD: Toán 10A"
          className={inputCls}
          autoFocus
        />
      </Field>
      <Field label="Mô tả (tuỳ chọn)">
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          placeholder="Mô tả ngắn về lớp học..."
          className={inputCls + " resize-none"}
        />
      </Field>
      <ModalFooter
        onCancel={onClose}
        onConfirm={submit}
        busy={busy}
        label="Tạo lớp"
      />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AssignQuizModal
// ─────────────────────────────────────────────────────────────────────────────
function AssignQuizModal({
  quizzes,
  assignedIds,
  onClose,
  onAssign,
}: {
  quizzes: ClassroomQuiz[];
  assignedIds: string[];
  onClose: () => void;
  onAssign: (quizId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const unassigned = quizzes.filter((q) => !assignedIds.includes(q._id));

  const assign = async (id: string) => {
    setBusy(id);
    try {
      await onAssign(id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title="Gán quiz vào lớp" onClose={onClose}>
      {unassigned.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Tất cả quiz đã được gán
        </p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
          {unassigned.map((q) => (
            <div
              key={q._id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {q.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {q.subject} · {q.duration} phút
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                  q.isPublished
                    ? "bg-primary/15 text-primary"
                    : "bg-muted-foreground/15 text-muted-foreground"
                }`}
              >
                {q.isPublished ? "Live" : "Nháp"}
              </span>
              <button
                disabled={busy === q._id}
                onClick={() => assign(q._id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
              >
                {busy === q._id ? <MiniSpin /> : "Gán"}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end pt-1">
        <GhostBtn onClick={onClose}>Đóng</GhostBtn>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────────────
const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ animation: "mIn .16s ease both" }}
    >
      <style>{`@keyframes mIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const ErrBanner = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-destructive/10 border border-destructive/20 text-destructive">
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
    {msg}
  </div>
);

const ModalFooter = ({
  onCancel,
  onConfirm,
  busy,
  label,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
  label: string;
}) => (
  <div className="flex justify-end gap-2 pt-1">
    <GhostBtn onClick={onCancel}>Hủy</GhostBtn>
    <button
      onClick={onConfirm}
      disabled={busy}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
    >
      {busy && <MiniSpin />} {label}
    </button>
  </div>
);

const GhostBtn = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
  >
    {children}
  </button>
);

const Dashed = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
    {children}
  </div>
);

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
const PlusIcon = ({ small }: { small?: boolean }) => (
  <svg
    className={small ? "w-3.5 h-3.5" : "w-3 h-3"}
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
const KeyIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
    />
  </svg>
);
const TrashIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
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
