import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";

import DashboardLayout from "./components/Dashboardlayout";
import LoginPage from "./pages/Login";

import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
} from "./context/ProtectedRoute";
import { AdminDashboard, TeacherDashboard } from "./components/Dashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import TeacherQuizzesPage from "./pages/teacher/TeacherQuizzesPage";
import QuizFormPage from "./components/teacher/QuizFormPage";
import StudentQuizzesPage from "./pages/student/StudentQuizzesPage";
import StudentQuizPage from "./pages/student/StudentQuizPage";
import AdminQuizzesPage from "./pages/admin/AdminQuizzesPage";
import AdminStatsPage from "./pages/admin/AdminStatsPage";
import TeacherResultsPage from "./pages/teacher/TeacherResultsPage";
import TeacherStatsPage from "./pages/teacher/TeacherStatsPage";
import StudentResultsPage from "./pages/student/StudentResultsPage";
import TeacherClassroomsPage from "./pages/teacher/TeacherClassroomsPage";
import StudentClassroomsPage from "./pages/student/StudentClassroomsPage";
import { StudentDashboard } from "./components/student/StudentDashboard";
import RegisterPage from "./pages/Register";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
    <p className="text-6xl font-bold text-muted-foreground/30">404</p>
    <p className="text-sm text-muted-foreground">Trang không tồn tại</p>
    <a href="/" className="text-xs text-primary font-medium hover:underline">
      Về trang chủ
    </a>
  </div>
);

// ── Route tree ────────────────────────────────────────────────────────────────
//
//  /                         → redirect /login
//  /login                    → GuestRoute (đã login → dashboard)
//
//  /admin/*    → ProtectedRoute → RoleRoute(admin)    → DashboardLayout
//  /teacher/*  → ProtectedRoute → RoleRoute(teacher)  → DashboardLayout
//  /student/*  → ProtectedRoute → RoleRoute(student)  → DashboardLayout

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root → login */}
          <Route index element={<Navigate to="/login" replace />} />

          {/* Guest only */}
          <Route element={<GuestRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* ── Admin ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/users" element={<AdminUsersPage />} />
                <Route path="admin/quizzes" element={<AdminQuizzesPage />} />
                <Route path="admin/stats" element={<AdminStatsPage />} />
              </Route>
            </Route>
          </Route>

          {/* ── Teacher ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["teacher"]} />}>
              <Route element={<DashboardLayout />}>
                <Route
                  path="teacher/dashboard"
                  element={<TeacherDashboard />}
                />
                <Route
                  path="teacher/quizzes"
                  element={<TeacherQuizzesPage />}
                />
                <Route
                  path="teacher/classrooms"
                  element={<TeacherClassroomsPage />}
                />
                <Route
                  path="teacher/quizzes/create"
                  element={<QuizFormPage />}
                />
                <Route
                  path="teacher/quizzes/:id/edit"
                  element={<QuizFormPage />}
                />
                <Route
                  path="teacher/results"
                  element={<TeacherResultsPage />}
                />
                <Route path="teacher/stats" element={<TeacherStatsPage />} />
              </Route>
            </Route>
          </Route>

          {/* ── Student ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["student"]} />}>
              <Route element={<DashboardLayout />}>
                <Route
                  path="student/dashboard"
                  element={<StudentDashboard />}
                />
                <Route
                  path="student/quizzes"
                  element={<StudentQuizzesPage />}
                />
                <Route
                  path="student/classrooms"
                  element={<StudentClassroomsPage />}
                />
                <Route
                  path="student/quizzes/:id"
                  element={<StudentQuizPage />}
                />
                <Route
                  path="student/results"
                  element={<StudentResultsPage />}
                />
              </Route>
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
