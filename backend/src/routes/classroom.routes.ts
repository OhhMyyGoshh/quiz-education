// src/routes/classroom.routes.ts
//
// ⚠️  ROUTE ORDERING — Express match theo thứ tự từ trên xuống:
//    GET /enrolled  phải đứng TRƯỚC  GET /:id
//    GET /admin/all phải đứng TRƯỚC  GET /:id
//    POST /join     phải đứng TRƯỚC  POST /:id/quizzes
//
// Đăng ký trong server.ts:
//   import classroomRoutes from "./routes/classroom.routes";
//   app.use("/api/classrooms", classroomRoutes);

import { Router } from "express";
import {
  authenticate,
  teacherUp,
  studentUp,
  adminOnly,
} from "../middlewares/auth.middleware";
import {
  // Teacher
  createClassroom,
  getMyClassrooms,
  getClassroomDetail,
  updateClassroom,
  deleteClassroom,
  kickStudent,
  assignQuiz,
  removeQuiz,
  // Student
  joinClassroom,
  getEnrolled,
  leaveClassroom,
  getClassroomQuizzes,
  // Admin
  getAllClassrooms,
} from "../controllers/classroom.controller";

const router = Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT — static paths trước (tránh bị /:id nuốt)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/classrooms/join          → join bằng mã
router.post("/join", studentUp, joinClassroom);

// GET  /api/classrooms/enrolled      → danh sách lớp đang học
router.get("/enrolled", studentUp, getEnrolled);

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — static paths trước
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/classrooms/admin/all      → tất cả lớp trong hệ thống
router.get("/admin/all", adminOnly, getAllClassrooms);

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER — static paths trước
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/classrooms               → tạo lớp mới
router.post("/", teacherUp, createClassroom);

// GET  /api/classrooms/my            → lớp của teacher
router.get("/my", teacherUp, getMyClassrooms);

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT — param routes
// ═══════════════════════════════════════════════════════════════════════════

// GET    /api/classrooms/:id/quizzes → quiz published trong lớp (student làm bài)
router.get("/:id/quizzes", studentUp, getClassroomQuizzes);

// DELETE /api/classrooms/:id/leave   → rời khỏi lớp
router.delete("/:id/leave", studentUp, leaveClassroom);

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER — param routes
// ═══════════════════════════════════════════════════════════════════════════

// GET    /api/classrooms/:id                       → chi tiết lớp
router.get("/:id", teacherUp, getClassroomDetail);

// PUT    /api/classrooms/:id                       → cập nhật tên/mô tả
router.put("/:id", teacherUp, updateClassroom);

// DELETE /api/classrooms/:id                       → xóa lớp
router.delete("/:id", teacherUp, deleteClassroom);

// DELETE /api/classrooms/:id/students/:studentId   → kick học sinh
router.delete("/:id/students/:studentId", teacherUp, kickStudent);

// POST   /api/classrooms/:id/quizzes               → gán quiz
router.post("/:id/quizzes", teacherUp, assignQuiz);

// DELETE /api/classrooms/:id/quizzes/:quizId       → bỏ quiz
router.delete("/:id/quizzes/:quizId", teacherUp, removeQuiz);

export default router;
