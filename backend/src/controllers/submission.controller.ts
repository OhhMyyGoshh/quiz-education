import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendCreated } from "../utils/helpers";
import { submissionService } from "../services/submission.service";

const param = (req: Request, k: string) => String(req.params[k]);

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const result = await submissionService.submit(
    param(req, "quizId"),
    String(req.user!.userId),
    req.body,
  );
  return sendCreated(res, result, "Nộp bài thành công");
});

export const getMyResults = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const result = await submissionService.getMyResults(
      String(req.user!.userId),
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
    return sendSuccess(res, result);
  },
);

export const getQuizResults = asyncHandler(
  async (req: Request, res: Response) => {
    const { page } = req.query;
    const result = await submissionService.getByQuiz(
      param(req, "quizId"),
      page ? Number(page) : 1,
    );
    return sendSuccess(res, result);
  },
);

export const getAdminStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await submissionService.getAdminStats();
    return sendSuccess(res, stats);
  },
);

export const getTeacherStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await submissionService.getTeacherStats(
      String(req.user!.userId),
    );
    return sendSuccess(res, stats);
  },
);
