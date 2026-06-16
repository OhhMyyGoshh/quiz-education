import { QuizRepository, QuizQuery } from "../repositories/quiz.repository";
import { AppError, NotFoundError, ForbiddenError } from "../errors/app.error";
import { IQuestion } from "../models/quiz.model";

const repo = new QuizRepository();

const validateQuiz = (data: any) => {
  if (!data.title?.trim()) throw new AppError("Tiêu đề là bắt buộc", 422);
  if (!data.subject?.trim()) throw new AppError("Môn học là bắt buộc", 422);
  if (!data.duration || data.duration < 1)
    throw new AppError("Thời gian tối thiểu 1 phút", 422);
};

const validateQuestions = (questions: IQuestion[]) => {
  for (const [i, q] of questions.entries()) {
    if (!q.text?.trim())
      throw new AppError(`Câu ${i + 1}: nội dung câu hỏi là bắt buộc`, 422);
    if (!q.choices || q.choices.length < 2)
      throw new AppError(`Câu ${i + 1}: cần ít nhất 2 lựa chọn`, 422);
    const hasCorrect = q.choices.some((c) => c.isCorrect);
    if (!hasCorrect)
      throw new AppError(`Câu ${i + 1}: phải có ít nhất 1 đáp án đúng`, 422);
    for (const [j, c] of q.choices.entries()) {
      if (!c.text?.trim())
        throw new AppError(
          `Câu ${i + 1}, lựa chọn ${j + 1}: không được để trống`,
          422,
        );
    }
  }
};

export const quizService = {
  async getAll(query: QuizQuery) {
    return repo.findAll(query);
  },

  async getById(id: string) {
    const quiz = await repo.findById(id);
    if (!quiz) throw new NotFoundError("Quiz");
    return quiz;
  },

  async create(data: any, createdBy: string) {
    validateQuiz(data);
    if (data.questions?.length) validateQuestions(data.questions);

    const questions = (data.questions || []).map((q: IQuestion, i: number) => ({
      ...q,
      order: i + 1,
    }));

    return repo.create({ ...data, createdBy, questions });
  },

  async update(id: string, data: any, userId: string) {
    const quiz = await repo.findByIdAndOwner(id, userId);
    if (!quiz) throw new NotFoundError("Quiz");

    validateQuiz(data);
    if (data.questions?.length) validateQuestions(data.questions);

    const questions = (data.questions || []).map((q: IQuestion, i: number) => ({
      ...q,
      order: i + 1,
    }));

    return repo.update(id, { ...data, questions });
  },

  async delete(id: string, userId: string) {
    const quiz = await repo.findByIdAndOwner(id, userId);
    if (!quiz) throw new NotFoundError("Quiz");
    await repo.delete(id);
  },

  async togglePublish(id: string, userId: string) {
    const quiz = await repo.findByIdAndOwner(id, userId);
    if (!quiz) throw new NotFoundError("Quiz");
    return repo.update(id, { isPublished: !quiz.isPublished } as any);
  },
};
