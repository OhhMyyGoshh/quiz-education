import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../errors/app.error";
import { UserRole } from "../models/user.model";

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ─── PATTERN: Prototype ───────────────────────────────────────────────────────
// Clone payload từ JWT — tách khỏi object gốc của jwt.verify
// Tránh vô tình mutate object được cache bởi thư viện
const clonePayload = (raw: object): TokenPayload =>
  Object.assign({}, raw) as TokenPayload;

// ─── PATTERN: Iterator ────────────────────────────────────────────────────────
// Duyệt tuần tự qua danh sách roles được phép
// Dừng ngay khi tìm thấy — không cần biết cấu trúc bên trong
const hasRole = (allowedRoles: UserRole[], userRole: UserRole): boolean => {
  const iterator = allowedRoles[Symbol.iterator]();
  let current = iterator.next();
  while (!current.done) {
    if (current.value === userRole) return true;
    current = iterator.next();
  }
  return false;
};

// ─── PATTERN: Facade ──────────────────────────────────────────────────────────
// Che giấu toàn bộ logic: đọc header → tách token → verify → clone payload
// Controller/route chỉ thấy: req.user đã được gắn sẵn
const extractAndVerifyToken = (req: Request): TokenPayload => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const raw = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as object;
    return clonePayload(raw); // Prototype: clone trước khi gắn vào req
  } catch (err: any) {
    if (err.name === "TokenExpiredError")
      throw new UnauthorizedError("Token expired");
    throw new UnauthorizedError("Invalid token");
  }
};

// ─── PATTERN: Template Method ────────────────────────────────────────────────
// Định nghĩa skeleton cố định cho middleware chain:
//   Bước 1 — extractAndVerifyToken (Facade)
//   Bước 2 — gắn req.user (Prototype)
//   Bước 3 — kiểm tra role nếu có (Iterator)
//   Bước 4 — next()
// Thứ tự này KHÔNG thay đổi — chỉ bước 3 là optional

const runAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
  allowedRoles?: UserRole[],
) => {
  try {
    // Bước 1 + 2: Facade extract + Prototype clone → gắn vào req
    req.user = extractAndVerifyToken(req);

    // Bước 3: Iterator duyệt roles nếu có yêu cầu phân quyền
    if (allowedRoles && allowedRoles.length > 0) {
      if (!hasRole(allowedRoles, req.user.role)) {
        throw new ForbiddenError(`Requires role: ${allowedRoles.join(" or ")}`);
      }
    }

    // Bước 4: tiếp tục pipeline
    next();
  } catch (err) {
    next(err);
  }
};

// ─── PATTERN: Proxy ───────────────────────────────────────────────────────────
// Đứng trước controller — kiểm soát quyền truy cập mà controller không hay biết
// authenticate: chỉ xác thực token
// authorize:    xác thực + kiểm tra role (truyền roles linh hoạt)

export const authenticate = (req: Request, res: Response, next: NextFunction) =>
  runAuthMiddleware(req, res, next);

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) =>
    runAuthMiddleware(req, res, next, roles);

// Shortcuts rõ nghĩa cho từng role
export const adminOnly = authorize("admin");
export const teacherUp = authorize("admin", "teacher");
export const studentUp = authorize("admin", "teacher", "student");
