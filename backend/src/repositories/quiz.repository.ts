import Quiz, { IQuiz } from "../models/quiz.model";

export interface QuizQuery {
  search?: string;
  subject?: string;
  page?: number;
  limit?: number;
  createdBy?: string;
}

export class QuizRepository {
  async findAll({
    search,
    subject,
    createdBy,
    page = 1,
    limit = 10,
  }: QuizQuery) {
    const filter: any = {};
    if (createdBy) filter.createdBy = createdBy;
    if (subject) filter.subject = { $regex: subject, $options: "i" };
    if (search)
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .select("-questions")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Quiz.countDocuments(filter),
    ]);

    return {
      quizzes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return Quiz.findById(id).populate("createdBy", "name email");
  }

  async findByIdAndOwner(id: string, createdBy: string) {
    return Quiz.findOne({ _id: id, createdBy });
  }

  async create(data: Partial<IQuiz>) {
    return Quiz.create(data);
  }

  async update(id: string, data: Partial<IQuiz>) {
    return Quiz.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return Quiz.findByIdAndDelete(id);
  }
}
