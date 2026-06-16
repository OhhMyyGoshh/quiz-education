import { AuthRepository } from "../repositories/auth.repository";
import { createTokenPair, verifyRefreshToken } from "../utils/helpers";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../errors/app.error";
import { UserRole } from "../models/user.model";

const repo = new AuthRepository();

const safeUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole = "student",
  ) {
    if (await repo.findByEmail(email))
      throw new ConflictError("Email already in use");
    const user = await repo.create({ name, email, password, role });
    const tokens = createTokenPair({
      userId: String(user._id),
      role: user.role,
    });
    await repo.updateRefreshToken(String(user._id), tokens.refreshToken);
    return { user: safeUser(user), tokens };
  },

  async login(email: string, password: string) {
    const user = await repo.findByEmail(email);
    if (!user || !(await user.comparePassword(password)))
      throw new UnauthorizedError("Invalid email or password");
    const tokens = createTokenPair({
      userId: String(user._id),
      role: user.role,
    });
    await repo.updateRefreshToken(String(user._id), tokens.refreshToken);
    return { user: safeUser(user), tokens };
  },

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    const user = await repo.findByIdWithRefreshToken(payload.userId);
    if (!user || user.refreshToken !== token)
      throw new UnauthorizedError("Invalid or expired refresh token");
    const tokens = createTokenPair({
      userId: String(user._id),
      role: user.role,
    });
    await repo.updateRefreshToken(String(user._id), tokens.refreshToken);
    return tokens;
  },

  async logout(userId: string) {
    if (!(await repo.findById(userId))) throw new NotFoundError("User");
    await repo.updateRefreshToken(userId, null);
  },

  async getMe(userId: string) {
    const user = await repo.findById(userId);
    if (!user) throw new NotFoundError("User");
    return safeUser(user);
  },
};
