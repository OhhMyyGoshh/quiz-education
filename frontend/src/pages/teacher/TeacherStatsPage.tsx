import { useState, useEffect } from "react";
import Sparkline from "../../components/Sparkline";
import { submissionApi, type ChartPoint } from "../../api/submissionApi";

interface TeacherStats {
  totalQuizzes: number;
  totalSubmissions: number;
  avgPercent: number;
  topQuizzes: { _id: string; title: string; count: number; avg: number }[];
  submissionsPerDay: ChartPoint[];
}

export default function TeacherStatsPage() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionApi
      .teacherStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  const s = stats!;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Thống kê của tôi
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Hiệu suất quiz của bạn
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Quiz đã tạo"
          value={s.totalQuizzes}
          color="text-primary"
          bg="bg-primary/10"
        />
        <KpiCard
          label="Lượt làm bài"
          value={s.totalSubmissions}
          color="text-chart-2"
          bg="bg-chart-2/10"
        />
        <KpiCard
          label="Điểm TB"
          value={`${s.avgPercent}%`}
          color="text-chart-3"
          bg="bg-chart-3/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
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
            <Empty />
          )}
        </div>

        {/* Top quizzes */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">
            Quiz được làm nhiều nhất
          </p>
          {s.topQuizzes.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {s.topQuizzes.map((q, i) => (
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
                  <div className="text-right">
                    <ScorePill pct={q.avg} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const KpiCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

const ScorePill = ({ pct }: { pct: number }) => (
  <span
    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${pct >= 70 ? "bg-primary/15 text-primary" : pct >= 50 ? "bg-chart-2/15 text-chart-2" : "bg-destructive/15 text-destructive"}`}
  >
    {pct}%
  </span>
);

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
const Empty = () => (
  <p className="text-xs text-muted-foreground text-center py-6">
    Chưa có dữ liệu
  </p>
);
