import { useState, useEffect, useCallback } from "react";
import { quizApi, type Quiz } from "../../api/quizApi";
import { submissionApi, type QuizResult } from "../../api/submissionApi";

const fmt = (s: number) =>
  `${Math.floor(s / 60)}p${String(s % 60).padStart(2, "0")}s`;

export default function TeacherResultsPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [avgPercent, setAvgPercent] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loadingQ, setLoadingQ] = useState(true);
  const [loadingR, setLoadingR] = useState(false);

  // Load danh sách quiz của teacher
  useEffect(() => {
    quizApi
      .getAll({})
      .then((res) => {
        setQuizzes(res.quizzes);
        if (res.quizzes.length > 0) setSelectedId(res.quizzes[0]._id);
      })
      .finally(() => setLoadingQ(false));
  }, []);

  // Load results khi chọn quiz
  const fetchResults = useCallback(async () => {
    if (!selectedId) return;
    setLoadingR(true);
    try {
      const res = await submissionApi.quizResults(selectedId, page);
      setResults(res.results);
      setAvgPercent(res.avgPercent);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } finally {
      setLoadingR(false);
    }
  }, [selectedId, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);
  useEffect(() => {
    setPage(1);
  }, [selectedId]);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Kết quả học sinh
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Xem kết quả từng quiz
        </p>
      </div>

      {loadingQ ? (
        <Loader />
      ) : quizzes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          Bạn chưa có quiz nào
        </div>
      ) : (
        <>
          {/* Quiz selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground outline-none focus:border-ring transition-all"
            >
              {quizzes.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.title}
                </option>
              ))}
            </select>

            {/* Summary */}
            {!loadingR && total > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">
                  <span className="font-semibold text-foreground">{total}</span>{" "}
                  lượt nộp
                </span>
                <span
                  className={`px-3 py-1.5 rounded-lg font-semibold ${
                    avgPercent >= 70
                      ? "bg-primary/15 text-primary"
                      : avgPercent >= 50
                        ? "bg-chart-2/15 text-chart-2"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  TB {avgPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Học sinh
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Điểm
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Thời gian làm
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Ngày nộp
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingR ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <Loader inline />
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground text-xs"
                    >
                      Chưa có học sinh nào nộp bài
                    </td>
                  </tr>
                ) : (
                  results.map((r, i) => (
                    <tr
                      key={r._id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 ? "bg-muted/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="text-primary text-[9px] font-bold uppercase">
                              {r.studentId.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {r.studentId.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.studentId.email}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              r.percent >= 70
                                ? "bg-primary/15 text-primary"
                                : r.percent >= 50
                                  ? "bg-chart-2/15 text-chart-2"
                                  : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {r.percent}%
                          </span>
                          <span className="text-muted-foreground">
                            {r.score}/{r.total}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmt(r.timeTaken)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const Loader = ({ inline }: { inline?: boolean }) => (
  <div className={`flex items-center justify-center ${inline ? "" : "h-64"}`}>
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
