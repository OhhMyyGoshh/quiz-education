// src/components/Dashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../api/dashboardApi";
import type {
  AdminStats,
  TeacherStats,
  QuizSummary,
  RoleBreakdown,
  SubmissionPerDay,
  TopQuiz,
} from "../types/dashboard.types";

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────────────────────
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

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}
const KpiCard = ({ label, value, sub, icon, accent }: KpiCardProps) => (
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
      {sub && (
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
      )}
    </div>
  </div>
);

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}
const SectionHeader = ({ title, action }: SectionHeaderProps) => (
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

// ─────────────────────────────────────────────────────────────────────────────
// Quick links
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_ICONS: Record<string, React.ReactNode> = {
  users: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  ),
  quiz: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  result: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
      />
    </svg>
  ),
  chart: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  ),
  classroom: (
    <svg
      className="w-5 h-5"
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
  ),
};

interface QuickLinkProps {
  icon: string;
  label: string;
  sub: string;
  onClick: () => void;
}
const QuickLink = ({ icon, label, sub, onClick }: QuickLinkProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-ring/50 hover:bg-muted/30 transition-all text-left group"
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {QUICK_ICONS[icon]}
    </div>
    <div>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
    <svg
      className="w-4 h-4 text-muted-foreground ml-auto shrink-0 group-hover:text-foreground transition-colors"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  </button>
);

const MiniBarChart = ({ data }: { data: SubmissionPerDay[] }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 100;
  const H = 48;
  const bw = W / data.length - 1;
  return (
    <div>
      <svg viewBox={`0 0 100 ${H}`} className="w-full" style={{ height: 64 }}>
        {data.map((d, i) => {
          const h = Math.max((d.count / max) * (H - 4), 2);
          const x = i * (W / data.length);
          const y = H - h;
          return (
            <rect
              key={i}
              x={x + 0.5}
              y={y}
              width={Math.max(bw - 0.5, 1)}
              height={h}
              rx="1"
              fill="hsl(var(--primary))"
              opacity={0.7 + (d.count / max) * 0.3}
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{data[0]?._id?.slice(5)}</span>
        <span>{data[data.length - 1]?._id?.slice(5)}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};
const ROLE_BADGE: Record<string, string> = {
  admin: "bg-chart-3/15 text-chart-3",
  teacher: "bg-chart-2/15 text-chart-2",
  student: "bg-primary/15 text-primary",
};

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .adminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-border bg-card/50">
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Xin chào, {user?.name} 👋
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tổng quan hệ thống Quiz Education
        </p>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <Spinner />
        ) : !stats ? null : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                label="Tổng người dùng"
                value={stats.totalUsers}
                accent="bg-primary/10 text-primary"
                icon={
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
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                }
              />
              <KpiCard
                label="Quiz đã xuất bản"
                value={stats.totalQuizzes}
                accent="bg-chart-2/10 text-chart-2"
                icon={
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
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <KpiCard
                label="Lượt làm bài"
                value={stats.totalSubmissions}
                accent="bg-chart-3/10 text-chart-3"
                icon={
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
                      d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                    />
                  </svg>
                }
              />
              <KpiCard
                label="Điểm trung bình"
                value={`${stats.avgPercent}%`}
                accent="bg-chart-4/10 text-chart-4"
                icon={
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
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                }
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader
                  title="Phân bổ người dùng"
                  action={
                    <button
                      onClick={() => navigate("/admin/users")}
                      className="text-xs text-primary font-medium hover:opacity-75 transition-opacity"
                    >
                      Quản lý →
                    </button>
                  }
                />
                {stats.roleBreakdown.length === 0 ? (
                  <Empty text="Chưa có dữ liệu" />
                ) : (
                  <div className="space-y-3">
                    {stats.roleBreakdown.map((r: RoleBreakdown) => {
                      const pct =
                        stats.totalUsers > 0
                          ? Math.round((r.count / stats.totalUsers) * 100)
                          : 0;
                      return (
                        <div key={r._id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${ROLE_BADGE[r._id] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {ROLE_LABEL[r._id] ?? r._id}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {r.count}{" "}
                              <span className="text-muted-foreground font-normal text-[10px]">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader title="Lượt làm bài (30 ngày)" />
                {stats.submissionsPerDay.length === 0 ? (
                  <Empty text="Chưa có lượt làm bài nào" />
                ) : (
                  <MiniBarChart data={stats.submissionsPerDay} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <QuickLink
                icon="users"
                label="Quản lý người dùng"
                sub="Thêm, sửa, xoá tài khoản"
                onClick={() => navigate("/admin/users")}
              />
              <QuickLink
                icon="quiz"
                label="Quản lý Quiz"
                sub="Xem tất cả quiz hệ thống"
                onClick={() => navigate("/admin/quizzes")}
              />
              <QuickLink
                icon="chart"
                label="Thống kê chi tiết"
                sub="Biểu đồ và báo cáo"
                onClick={() => navigate("/admin/stats")}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.teacherStats(), dashboardApi.myQuizzes()])
      .then(([s, q]) => {
        setStats(s);
        setQuizzes(q.quizzes);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-border bg-card/50">
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Xin chào, {user?.name} 👋
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Quản lý quiz và theo dõi kết quả học sinh
        </p>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <KpiCard
                label="Quiz đã tạo"
                value={stats?.totalQuizzes ?? 0}
                accent="bg-primary/10 text-primary"
                icon={
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
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <KpiCard
                label="Lượt làm bài"
                value={stats?.totalSubmissions ?? 0}
                accent="bg-chart-2/10 text-chart-2"
                icon={
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
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                }
              />
              <KpiCard
                label="Điểm TB học sinh"
                value={`${stats?.avgPercent ?? 0}%`}
                accent="bg-chart-3/10 text-chart-3"
                icon={
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
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                }
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader
                  title="Quiz gần đây"
                  action={
                    <button
                      onClick={() => navigate("/teacher/quizzes/create")}
                      className="text-xs text-primary font-medium hover:opacity-75 transition-opacity flex items-center gap-1"
                    >
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
                      Tạo mới
                    </button>
                  }
                />
                {quizzes.length === 0 ? (
                  <Empty text="Chưa có quiz nào" />
                ) : (
                  <div className="space-y-2">
                    {quizzes.slice(0, 5).map((q: QuizSummary) => (
                      <div
                        key={q._id}
                        onClick={() =>
                          navigate(`/teacher/quizzes/${q._id}/edit`)
                        }
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {q.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {q.subject} · {q.duration} phút
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide shrink-0 ml-3 ${q.isPublished ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          {q.isPublished ? "Live" : "Nháp"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader
                  title="Quiz được làm nhiều nhất"
                  action={
                    <button
                      onClick={() => navigate("/teacher/results")}
                      className="text-xs text-primary font-medium hover:opacity-75 transition-opacity"
                    >
                      Xem kết quả →
                    </button>
                  }
                />
                {!stats?.topQuizzes?.length ? (
                  <Empty text="Chưa có dữ liệu" />
                ) : (
                  <div className="space-y-2.5">
                    {stats.topQuizzes.map((q: TopQuiz, i: number) => (
                      <div key={q._id} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {q.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {q.count} lượt · TB {q.avg}%
                          </p>
                        </div>
                        <ScorePill pct={q.avg} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <QuickLink
                icon="quiz"
                label="Tạo Quiz mới"
                sub="Thêm câu hỏi trắc nghiệm"
                onClick={() => navigate("/teacher/quizzes/create")}
              />
              <QuickLink
                icon="classroom"
                label="Lớp học"
                sub="Quản lý lớp và học sinh"
                onClick={() => navigate("/teacher/classrooms")}
              />
              <QuickLink
                icon="result"
                label="Xem kết quả"
                sub="Điểm số từng học sinh"
                onClick={() => navigate("/teacher/results")}
              />
              <QuickLink
                icon="chart"
                label="Thống kê"
                sub="Hiệu suất quiz của bạn"
                onClick={() => navigate("/teacher/stats")}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
