import jwt from "jsonwebtoken";
import { Response } from "express";
import { Request, NextFunction } from "express";
import { TokenPayload } from "../middlewares/auth.middleware";

// Token
export const createTokenPair = (payload: TokenPayload) => ({
  accessToken: jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "15m",
  }),
  refreshToken: jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  }),
});

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;

// Response factory
export const sendSuccess = (
  res: Response,
  data: unknown,
  message = "Success",
  status = 200,
) => res.status(status).json({ success: true, message, data });

export const sendCreated = (
  res: Response,
  data: unknown,
  message = "Created",
) => sendSuccess(res, data, message, 201);

// Async handler (Decorator)
type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;
export const asyncHandler =
  (fn: AsyncFn) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
