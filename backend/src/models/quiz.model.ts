import mongoose, { Document, Schema } from "mongoose";

export interface IChoice {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  _id?: mongoose.Types.ObjectId;
  text: string;
  choices: IChoice[];
  explanation?: string;
  order: number;
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  subject: string;
  duration: number; // phút
  questions: IQuestion[];
  createdBy: mongoose.Types.ObjectId;
  isPublished: boolean;
  // ── Cài đặt nâng cao ──────────────────────────────────────────────────────
  maxAttempts: number; // 0 = không giới hạn
  showAnswerAfter: boolean; // hiện đáp án đúng/sai sau khi nộp
  lockAnswers: boolean; // không cho đổi đáp án đã chọn
  createdAt: Date;
  updatedAt: Date;
}

const ChoiceSchema = new Schema<IChoice>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
);

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  choices: { type: [ChoiceSchema], required: true },
  explanation: { type: String },
  order: { type: Number, required: true },
});

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 },
    questions: { type: [QuestionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false },
    // ── Cài đặt nâng cao ────────────────────────────────────────────────────
    maxAttempts: { type: Number, default: 0, min: 0 },
    showAnswerAfter: { type: Boolean, default: true },
    lockAnswers: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IQuiz>("Quiz", QuizSchema);
