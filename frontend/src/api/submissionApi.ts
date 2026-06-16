const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth") || "{}").accessToken ?? ""}`,
});
const handleRes = async (r: globalThis.Response) => {
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || "Error");
  return d.data;
};

// ── Submission ────────────────────────────────────────────────────────────────
export const submissionApi = {
  submit: (
    quizId: string,
    data: {
      answers: { questionId: string; choiceIndex: number }[];
      timeTaken: number;
    },
  ) =>
    fetch(`/api/submissions/${quizId}/submit`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }).then(handleRes),

  myResults: (page = 1) =>
    fetch(`/api/submissions/my-results?page=${page}`, {
      headers: authHeader(),
    }).then(handleRes),

  quizResults: (quizId: string, page = 1) =>
    fetch(`/api/submissions/quiz/${quizId}?page=${page}`, {
      headers: authHeader(),
    }).then(handleRes),

  adminStats: () =>
    fetch("/api/submissions/admin/stats", { headers: authHeader() }).then(
      handleRes,
    ),

  teacherStats: () =>
    fetch("/api/submissions/teacher/stats", { headers: authHeader() }).then(
      handleRes,
    ),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MyResult {
  _id: string;
  quizId: { _id: string; title: string; subject: string; duration: number };
  score: number;
  total: number;
  percent: number;
  timeTaken: number;
  createdAt: string;
}

export interface QuizResult {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  score: number;
  total: number;
  percent: number;
  timeTaken: number;
  createdAt: string;
}

export interface ChartPoint {
  _id: string;
  count: number;
  avgScore: number;
}
