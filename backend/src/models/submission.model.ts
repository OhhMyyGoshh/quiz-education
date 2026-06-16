import mongoose, { Document, Schema } from "mongoose";

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  choiceIndex: number;
  isCorrect: boolean;
}

export interface ISubmission extends Document {
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number; // số câu đúng
  total: number; // tổng số câu
  percent: number; // score/total * 100
  timeTaken: number; // giây
  createdAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    choiceIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [AnswerSchema], default: [] },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percent: { type: Number, required: true },
    timeTaken: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model<ISubmission>("Submission", SubmissionSchema);
