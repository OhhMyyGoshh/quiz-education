import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendCreated } from "../utils/helpers";
import { authService } from "../services/auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(
    req.body.name,
    req.body.email,
    req.body.password,
    req.body.role,
  );
  return sendCreated(res, result, "Registered successfully");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);
  return sendSuccess(res, result, "Login successful");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  return sendSuccess(res, tokens, "Token refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.userId);
  return sendSuccess(res, null, "Logged out successfully");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  return sendSuccess(res, user, "Current user");
});
