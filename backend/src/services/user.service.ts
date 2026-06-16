import { UserRepository, UserQuery } from "../repositories/user.repository";
import { AppError, ConflictError, NotFoundError } from "../errors/app.error";
import { UserRole } from "../models/user.model";

const repo = new UserRepository();

export const userService = {
  async getAll(query: UserQuery) {
    return repo.findAll(query);
  },

  async getById(id: string) {
    const user = await repo.findById(id);
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    if (!data.name?.trim()) throw new AppError("Name is required", 422);
    if (!data.email?.trim()) throw new AppError("Email is required", 422);
    if (!data.password?.trim()) throw new AppError("Password is required", 422);
    if (data.password.length < 6)
      throw new AppError("Password min 6 characters", 422);

    const exists = await repo.emailExists(data.email);
    if (exists) throw new ConflictError("Email already in use");

    const user = await repo.create(data);
    const { password, ...safe } = user.toObject();
    return safe;
  },

  async update(
    id: string,
    data: { name?: string; email?: string; role?: UserRole; password?: string },
  ) {
    const existing = await repo.findById(id);
    if (!existing) throw new NotFoundError("User");

    if (data.email) {
      const exists = await repo.emailExists(data.email, id);
      if (exists) throw new ConflictError("Email already in use");
    }

    // Nếu có password mới — cần qua model để trigger bcrypt pre-save
    if (data.password) {
      if (data.password.length < 6)
        throw new AppError("Password min 6 characters", 422);
      const { default: User } = await import("../models/user.model");
      const doc = await User.findById(id);
      if (!doc) throw new NotFoundError("User");
      Object.assign(doc, data);
      await doc.save();
      const { password, refreshToken, ...safe } = doc.toObject();
      return safe;
    }

    const updated = await repo.update(id, data);
    return updated;
  },

  async delete(id: string) {
    const user = await repo.findById(id);
    if (!user) throw new NotFoundError("User");
    await repo.delete(id);
  },
};
