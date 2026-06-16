import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/helpers";
import { QuizRepository } from "../repositories/quiz.repository";
import Quiz from "../models/quiz.model";
import { NotFoundError } from "../errors/app.error";

const repo = new QuizRepository();

// Chỉ lấy quiz đã publish — dành cho student
export const getPublicQuizzes = asyncHandler(
  async (req: Request, res: Response) => {
    const { search, subject, page, limit } = req.query;

    const filter: any = { isPublished: true };
    if (subject) filter.subject = { $regex: subject, $options: "i" };
    if (search)
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];

    const pg = page ? Number(page) : 1;
    const lim = limit ? Number(limit) : 12;

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .select(
          "title description subject duration isPublished createdBy createdAt",
        )
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim),
      Quiz.countDocuments(filter),
    ]);

    // Thêm questionCount vào từng quiz
    const withCount = await Promise.all(
      quizzes.map(async (q) => {
        const full = await Quiz.findById(q._id).select("questions");
        return { ...q.toObject(), questionCount: full?.questions?.length ?? 0 };
      }),
    );

    return sendSuccess(res, {
      quizzes: withCount,
      total,
      page: pg,
      limit: lim,
      totalPages: Math.ceil(total / lim),
    });
  },
);

export const getPublicQuizById = asyncHandler(
  async (req: Request, res: Response) => {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      isPublished: true,
    }).select("title subject duration questions");
    if (!quiz) throw new NotFoundError("Quiz");

    // Ẩn isCorrect khi trả về cho student
    const safe = {
      ...quiz.toObject(),
      questions: quiz.questions.map((q) => ({
        _id: q._id,
        text: q.text,
        order: q.order,
        choices: q.choices.map((c) => ({ text: c.text })), // không trả isCorrect
      })),
    };

    return sendSuccess(res, safe);
  },
);
