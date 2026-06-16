import Submission from "../models/submission.model";
import Quiz from "../models/quiz.model";
import { AppError, NotFoundError } from "../errors/app.error";

interface SubmitPayload {
  answers: { questionId: string; choiceIndex: number }[];
  timeTaken: number;
}

export const submissionService = {
  // ── Nộp bài & chấm điểm ───────────────────────────────────────────────────
  async submit(quizId: string, studentId: string, payload: SubmitPayload) {
    const quiz = await Quiz.findOne({ _id: quizId, isPublished: true });
    if (!quiz) throw new NotFoundError("Quiz");

    const answerMap = new Map(
      payload.answers.map((a) => [a.questionId, a.choiceIndex]),
    );

    const gradedAnswers = quiz.questions.map((q) => {
      const choiceIndex = answerMap.get(String(q._id));
      const isCorrect =
        choiceIndex !== undefined && q.choices[choiceIndex]?.isCorrect === true;
      return {
        questionId: q._id,
        choiceIndex: choiceIndex ?? -1,
        isCorrect,
      };
    });

    const score = gradedAnswers.filter((a) => a.isCorrect).length;
    const total = quiz.questions.length;
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    const submission = await Submission.create({
      quizId,
      studentId,
      answers: gradedAnswers,
      score,
      total,
      percent,
      timeTaken: payload.timeTaken,
    });

    return { submission, score, total, percent, answers: gradedAnswers };
  },

  // ── Lấy kết quả của student ────────────────────────────────────────────────
  async getMyResults(studentId: string, page = 1, limit = 10) {
    const [results, total] = await Promise.all([
      Submission.find({ studentId })
        .populate({
          path: "quizId",
          select: "title subject duration questions",
          // questions.choices chỉ lấy text, KHÔNG lấy isCorrect
          // (isCorrect đã lưu trong submission.answers[].isCorrect)
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Submission.countDocuments({ studentId }),
    ]);

    // Ẩn isCorrect khỏi choices trước khi trả về
    // (không cần vì student đã biết kết quả từ answers[].isCorrect)
    // Nhưng cần map để trả về cấu trúc gọn
    const mapped = results.map((sub) => {
      const quiz = sub.quizId as any;
      const questions = quiz?.questions ?? [];

      return {
        _id: sub._id,
        score: sub.score,
        total: sub.total,
        percent: sub.percent,
        timeTaken: sub.timeTaken,
        createdAt: sub.createdAt,
        quizId: {
          _id: quiz?._id,
          title: quiz?.title,
          subject: quiz?.subject,
          duration: quiz?.duration,
        },
        // answers kèm text câu hỏi + text đáp án đã chọn + đáp án đúng
        answers: sub.answers.map((ans) => {
          const q = questions.find(
            (qq: any) => String(qq._id) === String(ans.questionId),
          );
          const correctIdx =
            q?.choices?.findIndex((c: any) => c.isCorrect) ?? -1;
          return {
            questionId: ans.questionId,
            questionText: q?.text ?? "",
            choiceIndex: ans.choiceIndex,
            choiceText: q?.choices?.[ans.choiceIndex]?.text ?? "",
            isCorrect: ans.isCorrect,
            correctChoiceIndex: correctIdx,
            correctChoiceText: q?.choices?.[correctIdx]?.text ?? "",
          };
        }),
      };
    });

    return {
      results: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
  // ── Lấy kết quả theo quiz (teacher xem) ───────────────────────────────────
  async getByQuiz(quizId: string, page = 1, limit = 20) {
    const [results, total] = await Promise.all([
      Submission.find({ quizId })
        .populate("studentId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Submission.countDocuments({ quizId }),
    ]);
    const avgPercent =
      total > 0
        ? Math.round(
            await Submission.aggregate([
              {
                $match: {
                  quizId: (
                    await import("mongoose")
                  ).default.Types.ObjectId.createFromHexString(quizId),
                },
              },
              { $group: { _id: null, avg: { $avg: "$percent" } } },
            ]).then((r) => r[0]?.avg ?? 0),
          )
        : 0;
    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      avgPercent,
    };
  },

  // ── Stats cho admin ────────────────────────────────────────────────────────
  async getAdminStats() {
    const User = (await import("../models/user.model")).default;
    const Quiz = (await import("../models/quiz.model")).default;
    const mongoose = (await import("mongoose")).default;

    const [
      totalUsers,
      totalQuizzes,
      totalSubmissions,
      avgPercent,
      roleBreakdown,
      submissionsPerDay,
    ] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments({ isPublished: true }),
      Submission.countDocuments(),
      Submission.aggregate([
        { $group: { _id: null, avg: { $avg: "$percent" } } },
      ]).then((r) => Math.round(r[0]?.avg ?? 0)),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Submission.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            avgScore: { $avg: "$percent" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    return {
      totalUsers,
      totalQuizzes,
      totalSubmissions,
      avgPercent,
      roleBreakdown,
      submissionsPerDay,
    };
  },

  // ── Stats cho teacher ──────────────────────────────────────────────────────
  async getTeacherStats(teacherId: string) {
    const mongoose = (await import("mongoose")).default;
    const Quiz = (await import("../models/quiz.model")).default;

    const myQuizIds = await Quiz.find({ createdBy: teacherId }).distinct("_id");

    const [
      totalQuizzes,
      totalSubmissions,
      avgPercent,
      topQuizzes,
      submissionsPerDay,
    ] = await Promise.all([
      Quiz.countDocuments({ createdBy: teacherId }),
      Submission.countDocuments({ quizId: { $in: myQuizIds } }),
      Submission.aggregate([
        { $match: { quizId: { $in: myQuizIds } } },
        { $group: { _id: null, avg: { $avg: "$percent" } } },
      ]).then((r) => Math.round(r[0]?.avg ?? 0)),
      Submission.aggregate([
        { $match: { quizId: { $in: myQuizIds } } },
        {
          $group: {
            _id: "$quizId",
            count: { $sum: 1 },
            avg: { $avg: "$percent" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "quizzes",
            localField: "_id",
            foreignField: "_id",
            as: "quiz",
          },
        },
        { $unwind: "$quiz" },
        {
          $project: {
            title: "$quiz.title",
            count: 1,
            avg: { $round: ["$avg", 0] },
          },
        },
      ]),
      Submission.aggregate([
        { $match: { quizId: { $in: myQuizIds } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            avgScore: { $avg: "$percent" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    return {
      totalQuizzes,
      totalSubmissions,
      avgPercent,
      topQuizzes,
      submissionsPerDay,
    };
  },
};
