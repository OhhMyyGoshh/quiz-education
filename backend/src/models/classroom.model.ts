// src/models/classroom.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IClassroom extends Document {
  name: string;
  description: string;
  code: string; // Mã tham gia 6 ký tự, uppercase
  teacherId: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  quizzes: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true, // index để join by code nhanh
    },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    quizzes: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Auto-generate mã 6 ký tự nếu chưa có
ClassroomSchema.pre("validate", function (next) {
  if (!this.code) {
    this.code = Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  next;
});

export default mongoose.model<IClassroom>("Classroom", ClassroomSchema);
