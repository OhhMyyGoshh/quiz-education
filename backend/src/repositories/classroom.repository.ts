// src/repositories/classroom.repository.ts
import Classroom, { IClassroom } from "../models/classroom.model";
import mongoose from "mongoose";

// Populated views trả về từ DB
const POPULATE_STUDENTS = { path: "students", select: "name email" };
const POPULATE_QUIZZES = {
  path: "quizzes",
  select: "title subject duration isPublished questionCount",
};
const POPULATE_TEACHER = { path: "teacherId", select: "name email" };

export const classroomRepository = {
  // ── Create ─────────────────────────────────────────────────────────────────
  async create(data: {
    name: string;
    description: string;
    teacherId: string;
  }): Promise<IClassroom> {
    return Classroom.create(data);
  },

  // ── Find by id (raw, no populate) ─────────────────────────────────────────
  async findById(id: string): Promise<IClassroom | null> {
    return Classroom.findById(id);
  },

  // ── Find by id with full populate (teacher view) ──────────────────────────
  async findByIdPopulated(id: string): Promise<IClassroom | null> {
    return Classroom.findById(id)
      .populate(POPULATE_STUDENTS)
      .populate(POPULATE_QUIZZES);
  },

  // ── Find active classes by teacher ────────────────────────────────────────
  async findByTeacher(teacherId: string): Promise<IClassroom[]> {
    return Classroom.find({ teacherId, isActive: true })
      .populate(POPULATE_STUDENTS)
      .populate(POPULATE_QUIZZES)
      .sort("-createdAt");
  },

  // ── Find active classes a student is enrolled in ──────────────────────────
  async findByStudent(studentId: string): Promise<IClassroom[]> {
    return Classroom.find({
      students: new mongoose.Types.ObjectId(studentId),
      isActive: true,
    })
      .populate(POPULATE_TEACHER)
      .populate(POPULATE_QUIZZES)
      .sort("-createdAt");
  },

  // ── Find by join code ─────────────────────────────────────────────────────
  async findByCode(code: string): Promise<IClassroom | null> {
    return Classroom.findOne({ code: code.toUpperCase(), isActive: true });
  },

  // ── Check student already enrolled ───────────────────────────────────────
  async isEnrolled(classId: string, studentId: string): Promise<boolean> {
    const count = await Classroom.countDocuments({
      _id: classId,
      students: new mongoose.Types.ObjectId(studentId),
    });
    return count > 0;
  },

  // ── Update basic info ─────────────────────────────────────────────────────
  async updateInfo(
    id: string,
    teacherId: string,
    data: { name?: string; description?: string },
  ): Promise<IClassroom | null> {
    return Classroom.findOneAndUpdate(
      { _id: id, teacherId },
      { $set: data },
      { new: true },
    );
  },

  // ── Soft delete ───────────────────────────────────────────────────────────
  async softDelete(id: string, teacherId: string): Promise<boolean> {
    const res = await Classroom.updateOne(
      { _id: id, teacherId },
      { $set: { isActive: false } },
    );
    return res.modifiedCount > 0;
  },

  // ── Push student ──────────────────────────────────────────────────────────
  async addStudent(classId: string, studentId: string): Promise<void> {
    await Classroom.updateOne(
      { _id: classId },
      { $addToSet: { students: new mongoose.Types.ObjectId(studentId) } },
    );
  },

  // ── Pull student ──────────────────────────────────────────────────────────
  async removeStudent(classId: string, studentId: string): Promise<void> {
    await Classroom.updateOne(
      { _id: classId },
      { $pull: { students: new mongoose.Types.ObjectId(studentId) } },
    );
  },

  // ── Push quiz ─────────────────────────────────────────────────────────────
  async addQuiz(classId: string, quizId: string): Promise<boolean> {
    const res = await Classroom.updateOne(
      { _id: classId, quizzes: { $ne: new mongoose.Types.ObjectId(quizId) } },
      { $push: { quizzes: new mongoose.Types.ObjectId(quizId) } },
    );
    return res.modifiedCount > 0;
  },

  // ── Pull quiz ─────────────────────────────────────────────────────────────
  async removeQuiz(classId: string, quizId: string): Promise<void> {
    await Classroom.updateOne(
      { _id: classId },
      { $pull: { quizzes: new mongoose.Types.ObjectId(quizId) } },
    );
  },

  // ── Admin: all classrooms ─────────────────────────────────────────────────
  async findAll(): Promise<IClassroom[]> {
    return Classroom.find().populate(POPULATE_TEACHER).sort("-createdAt");
  },
};
