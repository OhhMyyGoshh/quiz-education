// src/services/classroom.service.ts
import { classroomRepository } from "../repositories/classroom.repository";
import Quiz from "../models/quiz.model";
import {
  AppError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../errors/app.error";

export const classroomService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHER
  // ═══════════════════════════════════════════════════════════════════════════

  // Tạo lớp — code tự sinh trong model pre-validate
  async create(
    teacherId: string,
    data: { name: string; description?: string },
  ) {
    if (!data.name?.trim())
      throw new AppError("Tên lớp không được để trống", 422);
    return classroomRepository.create({
      name: data.name.trim(),
      description: data.description?.trim() ?? "",
      teacherId,
    });
  },

  // Danh sách lớp của teacher (có populate)
  async getByTeacher(teacherId: string) {
    return classroomRepository.findByTeacher(teacherId);
  },

  // Chi tiết 1 lớp — chỉ teacher sở hữu mới xem được
  async getOneAsTeacher(classId: string, teacherId: string) {
    const cls = await classroomRepository.findByIdPopulated(classId);
    if (!cls || !cls.isActive) throw new NotFoundError("Lớp học");
    if (String(cls.teacherId) !== teacherId) throw new ForbiddenError();
    return cls;
  },

  // Cập nhật tên/mô tả
  async updateInfo(
    classId: string,
    teacherId: string,
    data: { name?: string; description?: string },
  ) {
    const updated = await classroomRepository.updateInfo(
      classId,
      teacherId,
      data,
    );
    if (!updated) throw new NotFoundError("Lớp học");
    return updated;
  },

  // Soft delete
  async deleteClass(classId: string, teacherId: string) {
    const ok = await classroomRepository.softDelete(classId, teacherId);
    if (!ok) throw new NotFoundError("Lớp học");
  },

  // Kick học sinh
  async removeStudent(classId: string, teacherId: string, studentId: string) {
    const cls = await classroomRepository.findById(classId);
    if (!cls || !cls.isActive) throw new NotFoundError("Lớp học");
    if (String(cls.teacherId) !== teacherId) throw new ForbiddenError();
    await classroomRepository.removeStudent(classId, studentId);
    return classroomRepository.findByIdPopulated(classId);
  },

  // Gán quiz vào lớp — quiz phải thuộc teacher này
  async assignQuiz(classId: string, teacherId: string, quizId: string) {
    const cls = await classroomRepository.findById(classId);
    if (!cls || !cls.isActive) throw new NotFoundError("Lớp học");
    if (String(cls.teacherId) !== teacherId) throw new ForbiddenError();

    // Kiểm tra quiz thuộc teacher
    const quiz = await Quiz.findOne({ _id: quizId, createdBy: teacherId });
    if (!quiz) throw new NotFoundError("Quiz");

    const added = await classroomRepository.addQuiz(classId, quizId);
    if (!added) throw new ConflictError("Quiz đã được gán vào lớp này");

    return classroomRepository.findByIdPopulated(classId);
  },

  // Bỏ quiz khỏi lớp
  async removeQuiz(classId: string, teacherId: string, quizId: string) {
    const cls = await classroomRepository.findById(classId);
    if (!cls || !cls.isActive) throw new NotFoundError("Lớp học");
    if (String(cls.teacherId) !== teacherId) throw new ForbiddenError();
    await classroomRepository.removeQuiz(classId, quizId);
    return classroomRepository.findByIdPopulated(classId);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Tham gia lớp bằng mã
  async joinByCode(code: string, studentId: string) {
    if (!code?.trim()) throw new AppError("Vui lòng nhập mã lớp", 422);

    const cls = await classroomRepository.findByCode(code);
    if (!cls) throw new NotFoundError("Mã lớp không hợp lệ hoặc lớp đã đóng");

    const already = await classroomRepository.isEnrolled(
      String(cls._id),
      studentId,
    );
    if (already) throw new ConflictError("Bạn đã tham gia lớp học này rồi");

    await classroomRepository.addStudent(String(cls._id), studentId);
    return cls;
  },

  // Danh sách lớp student đang học
  async getEnrolled(studentId: string) {
    return classroomRepository.findByStudent(studentId);
  },

  // Rời khỏi lớp
  async leave(classId: string, studentId: string) {
    const cls = await classroomRepository.findById(classId);
    if (!cls || !cls.isActive) throw new NotFoundError("Lớp học");
    await classroomRepository.removeStudent(classId, studentId);
  },

  // Lấy quiz của lớp (chỉ isPublished) — student dùng để làm bài
  async getQuizzesForStudent(classId: string, studentId: string) {
    const enrolled = await classroomRepository.isEnrolled(classId, studentId);
    if (!enrolled) throw new ForbiddenError("Bạn chưa tham gia lớp học này");

    const cls = await classroomRepository.findByIdPopulated(classId);
    if (!cls || !cls.isActive) throw new NotFoundError("Lớp học");

    // Chỉ trả quiz đã publish
    return (cls.quizzes as any[]).filter((q: any) => q.isPublished === true);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════════════════

  async getAll() {
    return classroomRepository.findAll();
  },
};
