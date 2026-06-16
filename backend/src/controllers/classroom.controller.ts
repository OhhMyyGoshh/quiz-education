// src/controllers/classroom.controller.ts
import { Request, Response } from "express";
import { classroomService } from "../services/classroom.service";
import { asyncHandler, sendSuccess, sendCreated } from "../utils/helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = (req: Request): string => String(req.user!.userId);
const param = (req: Request, key: string): string => String(req.params[key]);

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER controllers
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/classrooms
export const createClassroom = asyncHandler(
  async (req: Request, res: Response) => {
    const cls = await classroomService.create(uid(req), req.body);
    return sendCreated(res, cls, "Tạo lớp thành công");
  },
);

// GET /api/classrooms/my
export const getMyClassrooms = asyncHandler(
  async (req: Request, res: Response) => {
    const list = await classroomService.getByTeacher(uid(req));
    return sendSuccess(res, list);
  },
);

// GET /api/classrooms/:id
export const getClassroomDetail = asyncHandler(
  async (req: Request, res: Response) => {
    const cls = await classroomService.getOneAsTeacher(
      param(req, "id"),
      uid(req),
    );
    return sendSuccess(res, cls);
  },
);

// PUT /api/classrooms/:id
export const updateClassroom = asyncHandler(
  async (req: Request, res: Response) => {
    const cls = await classroomService.updateInfo(
      param(req, "id"),
      uid(req),
      req.body,
    );
    return sendSuccess(res, cls, "Cập nhật thành công");
  },
);

// DELETE /api/classrooms/:id
export const deleteClassroom = asyncHandler(
  async (req: Request, res: Response) => {
    await classroomService.deleteClass(param(req, "id"), uid(req));
    return sendSuccess(res, null, "Đã xóa lớp học");
  },
);

// DELETE /api/classrooms/:id/students/:studentId
export const kickStudent = asyncHandler(async (req: Request, res: Response) => {
  const cls = await classroomService.removeStudent(
    param(req, "id"),
    uid(req),
    param(req, "studentId"),
  );
  return sendSuccess(res, cls, "Đã xóa học sinh khỏi lớp");
});

// POST /api/classrooms/:id/quizzes
export const assignQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.body as { quizId: string };
  const cls = await classroomService.assignQuiz(
    param(req, "id"),
    uid(req),
    quizId,
  );
  return sendSuccess(res, cls, "Đã gán quiz vào lớp");
});

// DELETE /api/classrooms/:id/quizzes/:quizId
export const removeQuiz = asyncHandler(async (req: Request, res: Response) => {
  const cls = await classroomService.removeQuiz(
    param(req, "id"),
    uid(req),
    param(req, "quizId"),
  );
  return sendSuccess(res, cls, "Đã gỡ quiz khỏi lớp");
});

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT controllers
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/classrooms/join
export const joinClassroom = asyncHandler(
  async (req: Request, res: Response) => {
    const { code } = req.body as { code: string };
    const cls = await classroomService.joinByCode(code, uid(req));
    return sendSuccess(res, cls, `Đã tham gia lớp "${cls.name}"`);
  },
);

// GET /api/classrooms/enrolled
export const getEnrolled = asyncHandler(async (req: Request, res: Response) => {
  const list = await classroomService.getEnrolled(uid(req));
  return sendSuccess(res, list);
});

// DELETE /api/classrooms/:id/leave
export const leaveClassroom = asyncHandler(
  async (req: Request, res: Response) => {
    await classroomService.leave(param(req, "id"), uid(req));
    return sendSuccess(res, null, "Đã rời khỏi lớp học");
  },
);

// GET /api/classrooms/:id/quizzes — quiz của lớp dành cho student làm bài
export const getClassroomQuizzes = asyncHandler(
  async (req: Request, res: Response) => {
    const quizzes = await classroomService.getQuizzesForStudent(
      param(req, "id"),
      uid(req),
    );
    return sendSuccess(res, quizzes);
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN controllers
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/classrooms/admin/all
export const getAllClassrooms = asyncHandler(
  async (req: Request, res: Response) => {
    const list = await classroomService.getAll();
    return sendSuccess(res, list);
  },
);
