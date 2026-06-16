// src/pages/student/StudentResultsPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface QuizRef {
  _id: string;
  title: string;
  subject: string;
  duration: number;
}

interface AnswerDetail {
  questionId: string;
  questionText: string;
  choiceIndex: number; // -1 = bỏ qua
  choiceText: string;
  isCorrect: boolean;
  correctChoiceIndex: number;
  correctChoiceText: string;
}

export interface MyResult {
  _id: string;
  quizId: QuizRef;
  score: number;
  total: number;
  percent: number;
  timeTaken: number;
  createdAt: string;
  answers: AnswerDetail[];
}

interface ResultsResponse {
  results: MyResult[];
  total: number;
  totalPages: number;
  page: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const getToken = (): string => {
  try {
    return JSON.parse(localStorage.getItem("auth") ?? "{}").accessToken ?? "";
  } catch {
    return "";
  }
};

async function fetchMyResults(page: number): Promise<ResultsResponse> {
  const res = await fetch(`/api/submissions/my-results?page=${page}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Lỗi tải kết quả");
  return data.data as ResultsResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtTime = (s: number): string =>
  `${Math.floor(s / 60)}p${String(s % 60).padStart(2, "0")}s`;

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
export default function StudentResultsPage() {
  const [results, setResults] = useState<MyResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyResults(page);
      setResults(res.results);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const avg = results.length
    ? Math.round(results.reduce((a, r) => a + r.percent, 0) / results.length)
    : 0;
  const best = results.length ? Math.max(...results.map((r) => r.percent)) : 0;
  const passed = results.filter((r) => r.percent >= 50).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Kết quả của tôi
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {total} lần làm bài
        </p>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Điểm TB" value={`${avg}%`} color="text-primary" />
          <SummaryCard
            label="Điểm cao nhất"
            value={`${best}%`}
            color="text-chart-2"
          />
          <SummaryCard
            label="Số lần đậu"
            value={`${passed}`}
            color="text-chart-3"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <ResultRow
              key={r._id}
              result={r}
              isOpen={expanded === r._id}
              onToggle={() => setExpanded(expanded === r._id ? null : r._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Trang {page} / {totalPages}
          </p>
          <div className="flex gap-1">
            <PageBtn
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Trước
            </PageBtn>
            <PageBtn
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Tiếp →
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResultRow
// ─────────────────────────────────────────────────────────────────────────────
function ResultRow({
  result,
  isOpen,
  onToggle,
}: {
  result: MyResult;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const passed = result.percent >= 50;
  const quiz = result.quizId;
  const badgeCls =
    SUBJECT_COLOR[quiz.subject] ?? "bg-muted text-muted-foreground";
  const scoreCls = passed
    ? "bg-primary/15 text-primary"
    : "bg-destructive/15 text-destructive";

  const wrong =
    result.answers?.filter((a) => !a.isCorrect && a.choiceIndex !== -1) ?? [];
  const skipped = result.answers?.filter((a) => a.choiceIndex === -1) ?? [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${scoreCls}`}
        >
          {result.percent}%
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {quiz.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${badgeCls}`}
            >
              {quiz.subject}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(result.createdAt).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>

        {/* Meta + wrong count badge */}
        <div className="text-right shrink-0 space-y-0.5 hidden sm:block">
          <p className="text-xs font-semibold text-foreground">
            {result.score}/{result.total} câu
          </p>
          {wrong.length > 0 ? (
            <p className="text-[10px] text-destructive font-medium">
              {wrong.length} câu sai
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              {fmtTime(result.timeTaken)}
            </p>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded */}
      {isOpen && (
        <div className="border-t border-border bg-muted/20">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 text-center px-4 pt-4 pb-3">
            <MiniStat label="Đúng" value={result.score} color="text-primary" />
            <MiniStat
              label="Sai"
              value={result.total - result.score}
              color="text-destructive"
            />
            <MiniStat
              label="Tổng câu"
              value={result.total}
              color="text-foreground"
            />
            <MiniStat
              label="Thời gian"
              value={fmtTime(result.timeTaken)}
              color="text-chart-2"
            />
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">
                Tỉ lệ đúng
              </span>
              <span
                className={`text-[10px] font-semibold ${passed ? "text-primary" : "text-destructive"}`}
              >
                {result.percent}% · {passed ? "Đậu ✓" : "Rớt ✗"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${passed ? "bg-primary" : "bg-destructive"}`}
                style={{ width: `${result.percent}%` }}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1.5 px-4 pb-4 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {quiz.duration} phút quy định · làm {fmtTime(result.timeTaken)}
          </div>

          {/* ── Câu sai ── */}
          {wrong.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <XCircle className="w-3.5 h-3.5" />
                {wrong.length} câu trả lời sai
              </div>
              {wrong.map((a) => (
                <WrongAnswerCard
                  key={String(a.questionId)}
                  answer={a}
                  index={result.answers.indexOf(a)}
                />
              ))}
            </div>
          )}

          {/* ── Câu bỏ qua ── */}
          {skipped.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MinusCircle className="w-3.5 h-3.5" />
                {skipped.length} câu bỏ qua
              </div>
              {skipped.map((a) => (
                <SkippedCard
                  key={String(a.questionId)}
                  answer={a}
                  index={result.answers.indexOf(a)}
                />
              ))}
            </div>
          )}

          {/* ── Perfect ── */}
          {wrong.length === 0 && skipped.length === 0 && (
            <div className="flex items-center gap-2 px-4 pb-4 text-primary text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              Tất cả câu trả lời đều chính xác!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WrongAnswerCard
// ─────────────────────────────────────────────────────────────────────────────
function WrongAnswerCard({
  answer,
  index,
}: {
  answer: AnswerDetail;
  index: number;
}) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 space-y-1.5">
      {/* Câu hỏi */}
      <p className="text-xs text-foreground font-medium leading-snug">
        <span className="text-muted-foreground font-normal mr-1">
          Câu {index + 1}.
        </span>
        {answer.questionText || "(Không có nội dung câu hỏi)"}
      </p>
      {/* Bạn chọn */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-semibold text-destructive/80 shrink-0">
          Bạn chọn:
        </span>
        <span className="text-[10px] text-destructive line-through leading-snug">
          {answer.choiceText
            ? answer.choiceText
            : `Đáp án ${String.fromCharCode(65 + answer.choiceIndex)}`}
        </span>
      </div>
      {/* Đáp án đúng */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-semibold text-primary/80 shrink-0">
          Đáp án đúng:
        </span>
        <span className="text-[10px] text-primary font-medium leading-snug">
          {answer.correctChoiceText
            ? answer.correctChoiceText
            : `Đáp án ${String.fromCharCode(65 + answer.correctChoiceIndex)}`}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkippedCard
// ─────────────────────────────────────────────────────────────────────────────
function SkippedCard({
  answer,
  index,
}: {
  answer: AnswerDetail;
  index: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-1.5">
      <p className="text-xs text-foreground font-medium leading-snug">
        <span className="text-muted-foreground font-normal mr-1">
          Câu {index + 1}.
        </span>
        {answer.questionText || "(Không có nội dung câu hỏi)"}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-semibold text-primary/80 shrink-0">
          Đáp án đúng:
        </span>
        <span className="text-[10px] text-primary font-medium leading-snug">
          {answer.correctChoiceText
            ? answer.correctChoiceText
            : `Đáp án ${String.fromCharCode(65 + answer.correctChoiceIndex)}`}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
const SummaryCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const MiniStat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) => (
  <div>
    <p className={`text-sm font-bold ${color}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const PageBtn = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
  >
    {children}
  </button>
);

const Empty = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
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
          d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375m-8.25-3h8.25"
        />
      </svg>
    </div>
    <p className="text-sm font-medium text-foreground">Chưa có kết quả nào</p>
    <p className="text-xs text-muted-foreground mt-1">Hãy làm thử một quiz!</p>
  </div>
);
