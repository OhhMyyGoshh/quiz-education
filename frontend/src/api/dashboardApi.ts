// src/api/dashboardApi.ts
import type {
  AdminStats,
  TeacherStats,
  QuizListResponse,
  ResultListResponse,
} from "../types/dashboard.types";

const getToken = (): string => {
  try {
    return JSON.parse(localStorage.getItem("auth") ?? "{}").accessToken ?? "";
  } catch {
    return "";
  }
};

const authHeader = (): Record<string, string> => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data.data as T;
}

export const dashboardApi = {
  adminStats: () => get<AdminStats>("/api/submissions/admin/stats"),
  teacherStats: () => get<TeacherStats>("/api/submissions/teacher/stats"),
  myResults: () =>
    get<ResultListResponse>("/api/submissions/my-results?page=1&limit=5"),
  myQuizzes: () => get<QuizListResponse>("/api/quizzes?page=1&limit=5"),
  publicQuizzes: () =>
    get<QuizListResponse>("/api/quizzes/public?page=1&limit=5"),
};
