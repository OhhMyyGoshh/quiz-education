// src/components/StudentDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle,
  BarChart2,
  Star,
  Trophy,
  School,
  Play,
  ClipboardList,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { classroomApi } from "../../api/classroomApi";
import type { ClassroomQuiz } from "../../types/classroom.types";
import type { ResultSummary } from "../../types/dashboard.types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ClassroomQuizItem extends ClassroomQuiz {
  classroomName: string;
}

interface ResultsResponse {
  results: ResultSummary[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetchers
// ─────────────────────────────────────────────────────────────────────────────
const getToken = (): string => {
  try {
    return JSON.parse(localStorage.getItem("auth") ?? "{}").accessToken ?? "";
  } catch {
    return "";
  }
};

async function fetchMyResults(): Promise<ResultsResponse> {
  const res = await fetch("/api/submissions/my-results?page=1&limit=5", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Lỗi");
  return data.data as ResultsResponse;
}

async function fetchClassroomQuizzes(): Promise<ClassroomQuizItem[]> {
  const enrolled = await classroomApi.enrolled();

  const results = await Promise.all(
    enrolled.map((cls) =>
      classroomApi
        .classQuizzes(cls._id)
        .then((quizzes) =>
          quizzes.map((q) => ({ ...q, classroomName: cls.name })),
        ),
    ),
  );

  // Flatten + dedup — 1 quiz có thể ở nhiều lớp, giữ lần đầu
  const seen = new Set<string>();
  const flat: ClassroomQuizItem[] = [];
  for (const q of results.flat()) {
    if (!seen.has(q._id)) {
      seen.add(q._id);
      flat.push(q);
    }
  }
  return flat.slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState<ResultSummary[]>([]);
  const [quizzes, setQuizzes] = useState<ClassroomQuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMyResults(), fetchClassroomQuizzes()])
      .then(([r, q]) => {
        setResults(r.results ?? []);
        setQuizzes(q);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = results.length;
  const avg = total
    ? Math.round(results.reduce((a, r) => a + r.percent, 0) / total)
    : 0;
  const best = total ? Math.max(...results.map((r) => r.percent)) : 0;
  const passed = results.filter((r) => r.percent >= 50).length;

  return (
    <div className="h-full overflow-y-auto">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-border bg-card/50">
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Xin chào, {user?.name} 👋
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Theo dõi kết quả học tập của bạn
        </p>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                label="Đã hoàn thành"
                value={total}
                accent="bg-primary/10 text-primary"
                icon={<CheckCircle className="w-4 h-4" />}
              />
              <KpiCard
                label="Điểm trung bình"
                value={`${avg}%`}
                accent="bg-chart-2/10 text-chart-2"
                icon={<BarChart2 className="w-4 h-4" />}
              />
              <KpiCard
                label="Điểm cao nhất"
                value={`${best}%`}
                accent="bg-chart-3/10 text-chart-3"
                icon={<Star className="w-4 h-4" />}
              />
              <KpiCard
                label="Số lần đậu"
                value={passed}
                accent="bg-chart-4/10 text-chart-4"
                icon={<Trophy className="w-4 h-4" />}
              />
            </div>

            {/* ── Two-column panels ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Kết quả gần đây */}
              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader
                  title="Kết quả gần đây"
                  action={
                    <button
                      onClick={() => navigate("/student/results")}
                      className="text-xs text-primary font-medium hover:opacity-75 transition-opacity"
                    >
                      Xem tất cả →
                    </button>
                  }
                />
                {results.length === 0 ? (
                  <Empty text="Chưa có kết quả nào. Hãy làm thử một quiz!" />
                ) : (
                  <div className="space-y-1">
                    {results.slice(0, 5).map((r) => {
                      const isPassed = r.percent >= 50;
                      return (
                        <div
                          key={r._id}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isPassed
                                ? "bg-primary/15 text-primary"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {r.percent}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {r.quizId?.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {r.score}/{r.total} câu ·{" "}
                              {new Date(r.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                          <ScorePill pct={r.percent} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quiz từ lớp học */}
              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader
                  title="Quiz từ lớp học"
                  action={
                    <button
                      onClick={() => navigate("/student/quizzes")}
                      className="text-xs text-primary font-medium hover:opacity-75 transition-opacity"
                    >
                      Xem tất cả →
                    </button>
                  }
                />
                {quizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Chưa có quiz nào từ lớp học
                    </p>
                    <button
                      onClick={() => navigate("/student/classrooms")}
                      className="text-xs text-primary font-medium hover:opacity-75 transition-opacity"
                    >
                      Tham gia lớp học →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {quizzes.map((q) => (
                      <div
                        key={`${q._id}-${q.classroomName}`}
                        onClick={() => navigate(`/student/quizzes/${q._id}`)}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {q.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {q.subject} · {q.duration} phút
                            </span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                              <School className="w-2.5 h-2.5" />
                              {q.classroomName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Quick links ── */}
            <div className="grid grid-cols-3 gap-3">
              <QuickLink
                icon={<Play className="w-5 h-5" />}
                label="Làm Quiz"
                sub="Quiz từ lớp học của bạn"
                onClick={() => navigate("/student/quizzes")}
              />
              <QuickLink
                icon={<School className="w-5 h-5" />}
                label="Lớp học"
                sub="Quản lý lớp đang tham gia"
                onClick={() => navigate("/student/classrooms")}
              />
              <QuickLink
                icon={<ClipboardList className="w-5 h-5" />}
                label="Kết quả của tôi"
                sub="Xem lịch sử làm bài"
                onClick={() => navigate("/student/results")}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  accent: string;
  icon: React.ReactNode;
}

const KpiCard = ({ label, value, accent, icon }: KpiCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground tracking-tight">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  </div>
);

const SectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-3">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {action}
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <p className="text-xs text-muted-foreground text-center py-6">{text}</p>
);

const ScorePill = ({ pct }: { pct: number }) => (
  <span
    className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
      pct >= 70
        ? "bg-primary/15 text-primary"
        : pct >= 50
          ? "bg-chart-2/15 text-chart-2"
          : "bg-destructive/15 text-destructive"
    }`}
  >
    {pct}%
  </span>
);

const QuickLink = ({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-ring/50 hover:bg-muted/30 transition-all text-left group"
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
  </button>
);
