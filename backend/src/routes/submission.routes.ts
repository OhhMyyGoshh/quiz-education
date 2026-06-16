import { Router } from "express";
import {
  authenticate,
  studentUp,
  teacherUp,
  adminOnly,
} from "../middlewares/auth.middleware";
import {
  submitQuiz,
  getMyResults,
  getQuizResults,
  getAdminStats,
  getTeacherStats,
} from "../controllers/submission.controller";

const router = Router();

// Student: nộp bài + xem kết quả của mình
router.post("/:quizId/submit", authenticate, studentUp, submitQuiz);
router.get("/my-results", authenticate, studentUp, getMyResults);

// Teacher: xem kết quả theo quiz + stats
router.get("/quiz/:quizId", authenticate, teacherUp, getQuizResults);
router.get("/teacher/stats", authenticate, teacherUp, getTeacherStats);

// Admin: stats tổng hợp
router.get("/admin/stats", authenticate, adminOnly, getAdminStats);

export default router;
