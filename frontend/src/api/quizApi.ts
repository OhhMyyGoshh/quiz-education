export interface Choice {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id?: string;
  text: string;
  choices: Choice[];
  explanation: string;
  order: number;
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  subject: string;
  duration: number;
  questions: Question[];
  isPublished: boolean;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface QuizFormData {
  title: string;
  description: string;
  subject: string;
  duration: number;
  questions: Question[];
  isPublished?: boolean;
}

export const EMPTY_CHOICE = (): Choice => ({ text: "", isCorrect: false });
export const EMPTY_QUESTION = (): Question => ({
  text: "",
  explanation: "",
  order: 0,
  choices: [EMPTY_CHOICE(), EMPTY_CHOICE(), EMPTY_CHOICE(), EMPTY_CHOICE()],
});
export const EMPTY_FORM = (): QuizFormData => ({
  title: "",
  description: "",
  subject: "",
  duration: 30,
  questions: [],
});

const BASE = "/api/quizzes";
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth") || "{}").accessToken ?? ""}`,
});
const handleRes = async (res: globalThis.Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data.data;
};

export const quizApi = {
  getAll: (params: { search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.page) q.set("page", String(params.page));
    return fetch(`${BASE}?${q}`, { headers: authHeader() }).then(handleRes);
  },
  getById: (id: string) =>
    fetch(`${BASE}/${id}`, { headers: authHeader() }).then(
      handleRes,
    ) as Promise<Quiz>,
  create: (data: QuizFormData) =>
    fetch(BASE, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }).then(handleRes) as Promise<Quiz>,
  update: (id: string, data: QuizFormData) =>
    fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }).then(handleRes) as Promise<Quiz>,
  delete: (id: string) =>
    fetch(`${BASE}/${id}`, { method: "DELETE", headers: authHeader() }).then(
      handleRes,
    ),
  togglePublish: (id: string) =>
    fetch(`${BASE}/${id}/publish`, {
      method: "PATCH",
      headers: authHeader(),
    }).then(handleRes) as Promise<Quiz>,
};
