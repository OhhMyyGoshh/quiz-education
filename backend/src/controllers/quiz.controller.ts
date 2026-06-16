import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendCreated } from "../utils/helpers";
import { quizService } from "../services/quiz.service";

const param = (req: Request, key: string) => String(req.params[key]);

export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const { search, subject, page, limit } = req.query;
  const result = await quizService.getAll({
    search: search as string,
    subject: subject as string,
    createdBy: String(req.user!.userId),
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });
  return sendSuccess(res, result);
});

export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.getById(param(req, "id"));
  return sendSuccess(res, quiz);
});

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.create(req.body, String(req.user!.userId));
  return sendCreated(res, quiz, "Quiz created successfully");
});

export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.update(
    param(req, "id"),
    req.body,
    String(req.user!.userId),
  );
  return sendSuccess(res, quiz, "Quiz updated successfully");
});

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  await quizService.delete(param(req, "id"), String(req.user!.userId));
  return sendSuccess(res, null, "Quiz deleted successfully");
});

export const togglePublish = asyncHandler(
  async (req: Request, res: Response) => {
    const quiz = await quizService.togglePublish(
      param(req, "id"),
      String(req.user!.userId),
    );
    return sendSuccess(res, quiz, "Quiz publish status updated");
  },
);
