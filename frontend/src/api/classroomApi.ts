// src/api/classroomApi.ts
import type {
  Classroom,
  ClassroomQuiz,
  CreateClassroomPayload,
  JoinClassroomPayload,
} from "../types/classroom.types";

// ── Auth ──────────────────────────────────────────────────────────────────────
const getToken = (): string => {
  try {
    return JSON.parse(localStorage.getItem("auth") ?? "{}").accessToken ?? "";
  } catch {
    return "";
  }
};

const headers = (): Record<string, string> => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Base ──────────────────────────────────────────────────────────────────────
async function req<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data.data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER
// ─────────────────────────────────────────────────────────────────────────────
export const classroomApi = {
  create: (payload: CreateClassroomPayload) =>
    req<Classroom>("POST", "/api/classrooms", payload),

  myClasses: () => req<Classroom[]>("GET", "/api/classrooms/my"),

  getOne: (id: string) => req<Classroom>("GET", `/api/classrooms/${id}`),

  update: (id: string, payload: Partial<CreateClassroomPayload>) =>
    req<Classroom>("PUT", `/api/classrooms/${id}`, payload),

  remove: (id: string) => req<null>("DELETE", `/api/classrooms/${id}`),

  kickStudent: (classId: string, studentId: string) =>
    req<Classroom>(
      "DELETE",
      `/api/classrooms/${classId}/students/${studentId}`,
    ),

  assignQuiz: (classId: string, quizId: string) =>
    req<Classroom>("POST", `/api/classrooms/${classId}/quizzes`, { quizId }),

  removeQuiz: (classId: string, quizId: string) =>
    req<Classroom>("DELETE", `/api/classrooms/${classId}/quizzes/${quizId}`),

  // ─────────────────────────────────────────────────────────────────────────
  // STUDENT
  // ─────────────────────────────────────────────────────────────────────────
  join: (payload: JoinClassroomPayload) =>
    req<Classroom>("POST", "/api/classrooms/join", payload),

  enrolled: () => req<Classroom[]>("GET", "/api/classrooms/enrolled"),

  leave: (id: string) => req<null>("DELETE", `/api/classrooms/${id}/leave`),

  // Quiz published trong lớp — student dùng để chọn bài làm
  classQuizzes: (classId: string) =>
    req<ClassroomQuiz[]>("GET", `/api/classrooms/${classId}/quizzes`),
};
