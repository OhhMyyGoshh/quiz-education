export interface QuizSummary {
  _id: string;
  title: string;
  description: string;
  subject: string;
  duration: number;
  questionCount: number;
  createdBy: { name: string };
  createdAt: string;
}

export interface QuizDetail {
  _id: string;
  title: string;
  subject: string;
  duration: number;
  questions: {
    _id: string;
    text: string;
    order: number;
    choices: { text: string }[];
  }[];
}

const BASE = "/api/quizzes/public";
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth") || "{}").accessToken ?? ""}`,
});
const handleRes = async (res: globalThis.Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data.data;
};

export const studentQuizApi = {
  getAll: (params: { search?: string; subject?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.subject) q.set("subject", params.subject);
    if (params.page) q.set("page", String(params.page));
    return fetch(`${BASE}?${q}`, { headers: authHeader() }).then(
      handleRes,
    ) as Promise<{
      quizzes: QuizSummary[];
      total: number;
      totalPages: number;
      page: number;
    }>;
  },
  getById: (id: string) =>
    fetch(`${BASE}/${id}`, { headers: authHeader() }).then(
      handleRes,
    ) as Promise<QuizDetail>,
};
