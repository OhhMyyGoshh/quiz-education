import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendCreated } from "../utils/helpers";
import { userService } from "../services/user.service";

// Helper: lấy param an toàn, luôn trả về string
const param = (req: Request, key: string): string => String(req.params[key]);

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, role, page, limit } = req.query;
  const result = await userService.getAll({
    search: search as string,
    role: role as any,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });
  return sendSuccess(res, result);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getById(param(req, "id"));
  return sendSuccess(res, user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body);
  return sendCreated(res, user, "User created successfully");
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.update(param(req, "id"), req.body);
  return sendSuccess(res, user, "User updated successfully");
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.delete(param(req, "id"));
  return sendSuccess(res, null, "User deleted successfully");
});
