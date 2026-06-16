import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import {
  authenticate,
  adminOnly,
  teacherUp,
  studentUp,
} from "../middlewares/auth.middleware";
import { asyncHandler, sendSuccess } from "../utils/helpers";
import { AppError, ConflictError, NotFoundError } from "../errors/app.error";
import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
const router = Router();

// Public
router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/refresh", auth.refresh);

// Authenticated
router.post("/logout", authenticate, auth.logout);
router.get("/me", authenticate, auth.getMe);

// Role-based
router.get("/admin-only", authenticate, adminOnly, (_, res) =>
  res.json({ message: "Admin area" }),
);
router.get("/teacher-up", authenticate, teacherUp, (_, res) =>
  res.json({ message: "Teacher & Admin area" }),
);
router.get("/student-up", authenticate, studentUp, (_, res) =>
  res.json({ message: "All roles area" }),
);

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const { name, email } = req.body as { name?: string; email?: string };
    if (!name?.trim() && !email?.trim())
      throw new AppError("Không có thông tin nào để cập nhật", 422);

    if (email) {
      const exists = await userModel.exists({
        email,
        _id: { $ne: req.user!.userId },
      });
      if (exists) throw new ConflictError("Email này đã được sử dụng");
    }

    const updated = await userModel
      .findByIdAndUpdate(
        req.user!.userId,
        {
          ...(name?.trim() && { name: name.trim() }),
          ...(email?.trim() && { email: email.trim().toLowerCase() }),
        },
        { new: true },
      )
      .select("-password -refreshToken");

    if (!updated) throw new NotFoundError("User");
    return sendSuccess(res, updated, "Cập nhật thành công");
  }),
);

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
router.put(
  "/change-password",
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword)
      throw new AppError("Vui lòng điền đầy đủ thông tin", 422);
    if (newPassword.length < 6)
      throw new AppError("Mật khẩu mới tối thiểu 6 ký tự", 422);
    if (currentPassword === newPassword)
      throw new AppError("Mật khẩu mới phải khác mật khẩu cũ", 422);

    const user = await userModel.findById(req.user!.userId).select("+password");
    if (!user) throw new NotFoundError("User");

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError("Mật khẩu hiện tại không đúng", 401);

    user.password = newPassword; // pre-save hook sẽ hash
    await user.save();

    return sendSuccess(res, null, "Đổi mật khẩu thành công");
  }),
);

export default router;
