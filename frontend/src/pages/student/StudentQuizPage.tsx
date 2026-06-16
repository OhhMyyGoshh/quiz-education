import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { studentQuizApi, type QuizDetail } from "../../api/studentQuizApi";
import { submissionApi } from "../../api/submissionApi";

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "intro" | "doing" | "submitting" | "finished";
type Answers = Record<string, number>;

interface ScoreResult {
  correct: number;
  total: number;
  percent: number;
  answers: { questionId: string; choiceIndex: number; isCorrect: boolean }[];
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function StudentQuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [submitErr, setSubmitErr] = useState("");
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch quiz
  useEffect(() => {
    if (!id) return;
    studentQuizApi
      .getById(id)
      .then((q) => {
        setQuiz(q);
        setTimeLeft(q.duration * 60);
      })
      .catch(() => navigate("/student/quizzes"))
      .finally(() => setFetching(false));
  }, [id]);

  // ── Submit — gọi API chấm điểm & lưu DB ───────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!quiz || !id) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("submitting");
    setSubmitErr("");

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    const payload = quiz.questions.map((q) => ({
      questionId: String(q._id),
      choiceIndex: answers[String(q._id)] ?? -1,
    }));

    try {
      const res = await submissionApi.submit(id, {
        answers: payload,
        timeTaken,
      });
      setScore({
        correct: res.score,
        total: res.total,
        percent: res.percent,
        answers: res.answers,
      });
      setPhase("finished");
    } catch (err: any) {
      setSubmitErr(err.message ?? "Nộp bài thất bại. Vui lòng thử lại.");
      setPhase("doing"); // cho phép thử lại
    }
  }, [quiz, answers, id]);

  // Timer
  useEffect(() => {
    if (phase !== "doing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, handleSubmit]);

  const startQuiz = () => {
    startTimeRef.current = Date.now();
    setPhase("doing");
  };

  const selectAnswer = (qId: string, ci: number) =>
    setAnswers((a) => ({ ...a, [qId]: ci }));

  const goTo = (i: number) => setCurrent(i);
  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => {
    if (!quiz) return;
    if (current < quiz.questions.length - 1) setCurrent((c) => c + 1);
    else handleSubmit();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (fetching || !quiz) return <Spinner full />;

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro")
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-primary px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-7 h-7 text-white"
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
            </div>
            <h1 className="text-lg font-bold text-white">{quiz.title}</h1>
            <p className="text-white/70 text-xs mt-1">{quiz.subject}</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox
                icon={<ClockIcon />}
                label="Số câu hỏi"
                value={`${quiz.questions.length} câu`}
              />
              <InfoBox
                icon={<QuizIcon />}
                label="Thời gian"
                value={`${quiz.duration} phút`}
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-semibold">Lưu ý trước khi bắt đầu:</p>
              <ul className="space-y-0.5 list-disc list-inside text-amber-600 dark:text-amber-500">
                <li>Bộ đếm thời gian sẽ chạy ngay khi bắt đầu</li>
                <li>Hết giờ sẽ tự động nộp bài</li>
                <li>Mỗi câu chỉ chọn được 1 đáp án</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/student/quizzes")}
                className="flex-1 py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={startQuiz}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
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
                Bắt đầu
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // ── SUBMITTING ─────────────────────────────────────────────────────────────
  if (phase === "submitting")
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm text-muted-foreground">Đang chấm điểm...</p>
      </div>
    );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "finished" && score) {
    const passed = score.percent >= 50;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div
            className={`px-6 py-8 text-center ${passed ? "bg-primary" : "bg-destructive"}`}
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-3">
              {passed ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-white"
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
              )}
            </div>
            <p className="text-white/80 text-xs mb-1">
              {passed ? "Chúc mừng!" : "Cố gắng hơn nhé!"}
            </p>
            <p className="text-4xl font-bold text-white">{score.percent}%</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <StatBox
                label="Đúng"
                value={score.correct}
                color="text-primary"
              />
              <StatBox
                label="Sai"
                value={score.total - score.correct}
                color="text-destructive"
              />
              <StatBox
                label="Tổng câu"
                value={score.total}
                color="text-foreground"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Kết quả</span>
                <span>
                  {score.correct}/{score.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${passed ? "bg-primary" : "bg-destructive"}`}
                  style={{ width: `${score.percent}%` }}
                />
              </div>
            </div>

            {/* Chi tiết từng câu */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Chi tiết</p>
              <div className="grid grid-cols-5 gap-1.5">
                {score.answers.map((a, i) => (
                  <div
                    key={i}
                    title={`Câu ${i + 1}: ${a.isCorrect ? "Đúng" : a.choiceIndex === -1 ? "Bỏ qua" : "Sai"}`}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold ${
                      a.choiceIndex === -1
                        ? "bg-muted text-muted-foreground"
                        : a.isCorrect
                          ? "bg-primary/15 text-primary"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-primary/15 shrink-0" />
                  Đúng
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-destructive/15 shrink-0" />
                  Sai
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-muted shrink-0" />
                  Bỏ qua
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => navigate("/student/results")}
                className="flex-1 py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Xem kết quả
              </button>
              <button
                onClick={() => {
                  setAnswers({});
                  setCurrent(0);
                  setTimeLeft(quiz.duration * 60);
                  setScore(null);
                  setPhase("intro");
                }}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Làm lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DOING ──────────────────────────────────────────────────────────────────
  const q = quiz.questions[current];
  const answered = Object.keys(answers).length;
  const isLastQ = current === quiz.questions.length - 1;
  const isUrgent = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>
              Câu {current + 1} / {quiz.questions.length}
            </span>
            <span>{answered} đã trả lời</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{
                width: `${((current + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
            isUrgent
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-muted border-border text-foreground"
          }`}
        >
          {isUrgent && (
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          )}
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
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {fmt(timeLeft)}
        </div>
      </div>

      {/* Submit error */}
      {submitErr && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
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
          {submitErr}
          <button
            onClick={() => setSubmitErr("")}
            className="ml-auto text-destructive/70 hover:text-destructive"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                  Câu {current + 1}
                </span>
                {answers[q._id!] !== undefined && (
                  <span className="text-[10px] font-medium text-primary/70 flex items-center gap-1">
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
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Đã chọn
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {q.text}
              </p>
            </div>

            <div className="space-y-2.5">
              {q.choices.map((c, ci) => {
                const selected = answers[q._id!] === ci;
                return (
                  <button
                    key={ci}
                    onClick={() => selectAnswer(q._id!, ci)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm text-left transition-all ${
                      selected
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-border text-foreground hover:border-ring/50 hover:bg-muted/50"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + ci)}
                    </span>
                    <span className="flex-1 leading-snug">{c.text}</span>
                    {selected && (
                      <svg
                        className="w-4 h-4 text-primary shrink-0"
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
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={prev}
                disabled={current === 0}
                className="flex-1 py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <button
                onClick={next}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-opacity ${
                  isLastQ
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-foreground hover:bg-accent"
                }`}
              >
                {isLastQ ? "Nộp bài" : "Tiếp →"}
              </button>
            </div>
          </div>
        </div>

        {/* Navigator sidebar */}
        <div className="w-48 shrink-0 border-l border-border bg-card p-4 overflow-y-auto hidden md:block">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Câu hỏi
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {quiz.questions.map((qq, i) => {
              const isDone = answers[qq._id!] !== undefined;
              const isCurrent = i === current;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : isDone
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-1.5 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary/15 shrink-0" />
              Đã trả lời
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-muted shrink-0" />
              Chưa trả lời
            </div>
          </div>

          <button
            onClick={() => handleSubmit()}
            className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Nộp bài
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────
const InfoBox = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="bg-muted rounded-lg p-3 flex flex-col items-center gap-1.5 text-center">
    <span className="text-primary">{icon}</span>
    <span className="text-xs font-semibold text-foreground">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);

const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="bg-muted rounded-lg p-3">
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const Spinner = ({ full }: { full?: boolean }) => (
  <div className={`flex items-center justify-center ${full ? "h-64" : ""}`}>
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

const ClockIcon = () => (
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
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const QuizIcon = () => (
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
);
