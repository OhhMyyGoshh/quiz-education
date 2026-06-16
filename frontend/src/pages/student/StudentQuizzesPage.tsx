// src/pages/student/StudentQuizzesPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { classroomApi } from "../../api/classroomApi";
import type { Classroom, ClassroomQuiz } from "../../types/classroom.types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface QuizWithClass extends ClassroomQuiz {
  classroom: { _id: string; name: string };
}

const SUBJECTS = ["", "Toán", "Lý", "Hóa", "Văn", "Anh", "Sinh", "Sử", "Địa"];

const SUBJECT_COLOR: Record<string, string> = {
  Toán: "bg-chart-2/15 text-chart-2",
  Lý: "bg-chart-3/15 text-chart-3",
  Hóa: "bg-chart-4/15 text-chart-4",
  Văn: "bg-chart-1/15 text-chart-1",
  Anh: "bg-primary/15 text-primary",
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentQuizzesPage() {
  const navigate = useNavigate();

  const [allQuizzes, setAllQuizzes] = useState<QuizWithClass[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // ── Load enrolled → lấy quiz từng lớp song song ───────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const enrolled = await classroomApi.enrolled();
      setClasses(enrolled);

      const results = await Promise.all(
        enrolled.map((cls) =>
          classroomApi.classQuizzes(cls._id).then((quizzes) =>
            quizzes.map((q) => ({
              ...q,
              classroom: { _id: cls._id, name: cls.name },
            })),
          ),
        ),
      );

      setAllQuizzes(results.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(
      () => setSearch(searchInput.trim().toLowerCase()),
      350,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = allQuizzes.filter((q) => {
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search) ||
      q.subject.toLowerCase().includes(search);
    const matchSubject = !subject || q.subject === subject;
    const matchClass = !classFilter || q.classroom._id === classFilter;
    return matchSearch && matchSubject && matchClass;
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Quiz của tôi
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {filtered.length} quiz từ {classes.length} lớp đang học
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
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
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tiêu đề, môn học..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-input border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
          />
        </div>

        {/* Subject */}
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="px-3 py-2 rounded-lg bg-input border border-border text-xs text-foreground outline-none focus:border-ring transition-all"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s || "Tất cả môn"}
            </option>
          ))}
        </select>

        {/* Class filter — chỉ hiện khi có >1 lớp */}
        {classes.length > 1 && (
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-input border border-border text-xs text-foreground outline-none focus:border-ring transition-all"
          >
            <option value="">Tất cả lớp</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : classes.length === 0 ? (
        /* Chưa vào lớp nào */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ClassIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Bạn chưa tham gia lớp nào
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Tham gia lớp học để thấy quiz từ giáo viên
          </p>
          <button
            onClick={() => navigate("/student/classrooms")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Tham gia lớp →
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Có lớp nhưng không match filter */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            Không có quiz nào
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {allQuizzes.length === 0
              ? "Giáo viên chưa gán quiz vào lớp của bạn"
              : "Thử tìm kiếm với từ khóa khác"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((quiz, i) => (
            <QuizCard
              key={`${quiz._id}-${quiz.classroom._id}-${i}`}
              quiz={quiz}
              onStart={() => navigate(`/student/quizzes/${quiz._id}`)}
              onGoClass={() => navigate("/student/classrooms")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuizCard
// ─────────────────────────────────────────────────────────────────────────────
function QuizCard({
  quiz,
  onStart,
  onGoClass,
}: {
  quiz: QuizWithClass;
  onStart: () => void;
  onGoClass: () => void;
}) {
  const badgeCls =
    SUBJECT_COLOR[quiz.subject] ?? "bg-muted text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-ring/50 hover:shadow-sm transition-all group">
      {/* Subject + class tag */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide shrink-0 ${badgeCls}`}
        >
          {quiz.subject}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGoClass();
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/25 bg-primary/5 text-primary text-[10px] font-medium hover:bg-primary/15 transition-colors min-w-0 max-w-[150px]"
        >
          <ClassIcon className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{quiz.classroom.name}</span>
        </button>
      </div>

      {/* Title */}
      <h3 className="flex-1 text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {quiz.title}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {quiz.questionCount ?? "?"} câu
        </span>
        <span className="flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {quiz.duration} phút
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
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
            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
          />
        </svg>
        Bắt đầu làm
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center py-16">
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

const ClassIcon = ({ className }: { className?: string }) => (
  <svg
    className={className ?? "w-4 h-4"}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
    />
  </svg>
);
