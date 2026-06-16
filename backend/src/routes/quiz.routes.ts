import { Router } from "express";
import * as quizController from "../controllers/quiz.controller";
import {
  adminOnly,
  authenticate,
  studentUp,
  teacherUp,
} from "../middlewares/auth.middleware";
import {
  getPublicQuizById,
  getPublicQuizzes,
} from "../controllers/public.quiz.controller";
import { QuizRepository } from "../repositories/quiz.repository";
import { sendSuccess } from "../utils/helpers";

const router = Router();
// Public routes cho student — phải đứng TRƯỚC /:id
router.get("/public", authenticate, studentUp, getPublicQuizzes);
router.get("/public/:id", authenticate, studentUp, getPublicQuizById);
router.use(authenticate, teacherUp);
// Chỉ admin mới được gọi
router.get("/all", authenticate, adminOnly, async (req, res) => {
  const { search, page, limit } = req.query;
  const result = await new QuizRepository().findAll({
    search: search as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });
  return sendSuccess(res, result);
});
router.get("/", quizController.getQuizzes);
router.get("/:id", quizController.getQuizById);
router.post("/", quizController.createQuiz);
router.put("/:id", quizController.updateQuiz);
router.delete("/:id", quizController.deleteQuiz);
router.patch("/:id/publish", quizController.togglePublish);

export default router;
