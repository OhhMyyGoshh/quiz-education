// src/types/dashboard.types.ts

export interface RoleBreakdown {
  _id: string;
  count: number;
}

export interface SubmissionPerDay {
  _id: string; // "YYYY-MM-DD"
  count: number;
}

export interface TopQuiz {
  _id: string;
  title: string;
  count: number;
  avg: number;
}

export interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  totalSubmissions: number;
  avgPercent: number;
  roleBreakdown: RoleBreakdown[];
  submissionsPerDay: SubmissionPerDay[];
}

export interface TeacherStats {
  totalQuizzes: number;
  totalSubmissions: number;
  avgPercent: number;
  topQuizzes: TopQuiz[];
  submissionsPerDay: SubmissionPerDay[];
}

export interface QuizSummary {
  _id: string;
  title: string;
  subject: string;
  duration: number;
  isPublished: boolean;
  questionCount?: number;
}

export interface QuizListResponse {
  quizzes: QuizSummary[];
  total: number;
  page: number;
}

export interface ResultSummary {
  _id: string;
  quizId: { _id: string; title: string };
  score: number;
  total: number;
  percent: number;
  createdAt: string;
}

export interface ResultListResponse {
  results: ResultSummary[];
  total: number;
  page: number;
}
