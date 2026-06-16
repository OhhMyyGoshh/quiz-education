import { useState, useEffect } from "react";
import Sparkline from "../../components/Sparkline";
import { submissionApi, type ChartPoint } from "../../api/submissionApi";

interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  totalSubmissions: number;
  avgPercent: number;
  roleBreakdown: { _id: string; count: number }[];
  submissionsPerDay: ChartPoint[];
}

const roleLabel: Record<string, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};
const roleBadge: Record<string, string> = {
  admin: "bg-chart-3/15 text-chart-3",
  teacher: "bg-chart-2/15 text-chart-2",
  student: "bg-primary/15 text-primary",
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionApi
      .adminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const s = stats!;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Thống kê hệ thống
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tổng quan toàn bộ nền tảng
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Tổng người dùng"
          value={s.totalUsers}
          icon="users"
          color="primary"
        />
        <KpiCard
          label="Quiz đã xuất bản"
          value={s.totalQuizzes}
          icon="quiz"
          color="chart-2"
        />
        <KpiCard
          label="Lượt làm bài"
          value={s.totalSubmissions}
          icon="submit"
          color="chart-3"
        />
        <KpiCard
          label="Điểm trung bình"
          value={`${s.avgPercent}%`}
          icon="star"
          color="chart-4"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart lượt làm bài */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            Lượt làm bài theo ngày
          </p>
          <p className="text-xs text-muted-foreground mb-4">30 ngày gần nhất</p>
          {s.submissionsPerDay.length > 0 ? (
            <>
              <Sparkline data={s.submissionsPerDay} height={80} />
              <div className="flex items-end justify-between mt-2 text-[10px] text-muted-foreground">
                <span>{s.submissionsPerDay[0]?._id}</span>
                <span>
                  {s.submissionsPerDay[s.submissionsPerDay.length - 1]?._id}
                </span>
              </div>
            </>
          ) : (
            <Empty text="Chưa có lượt làm bài nào" />
          )}
        </div>

        {/* Role breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">
            Phân bổ người dùng
          </p>
          {s.roleBreakdown.length === 0 ? (
            <Empty text="Chưa có dữ liệu" />
          ) : (
            <div className="space-y-3">
              {s.roleBreakdown.map((r) => {
                const pct = Math.round((r.count / s.totalUsers) * 100);
                return (
                  <div key={r._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${roleBadge[r._id] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {roleLabel[r._id] ?? r._id}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {r.count}{" "}
                        <span className="text-muted-foreground font-normal">
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
      </div>
    </div>
  );
}

// ── Sub components ─────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    users: (
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
    ),
    quiz: (
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
    ),
    submit: (
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
    ),
    star: (
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
    ),
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div
        className={`w-8 h-8 rounded-lg bg-${color}/15 text-${color} flex items-center justify-center mb-3`}
      >
        {icons[icon]}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

const Loader = () => (
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

const Empty = ({ text }: { text: string }) => (
  <p className="text-xs text-muted-foreground text-center py-6">{text}</p>
);
