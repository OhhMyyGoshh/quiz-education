import User, { IUser, UserRole } from "../models/user.model";

export interface UserQuery {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

// ─── PATTERN: Repository ──────────────────────────────────────────────────────
export class UserRepository {
  async findAll({ search, role, page = 1, limit = 10 }: UserQuery) {
    const filter: any = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return User.findById(id).select("-password -refreshToken");
  }

  async create(data: Partial<IUser>) {
    return User.create(data);
  }

  async update(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, { new: true }).select(
      "-password -refreshToken",
    );
  }

  async delete(id: string) {
    return User.findByIdAndDelete(id);
  }

  async emailExists(email: string, excludeId?: string) {
    const query: any = { email };
    if (excludeId) query._id = { $ne: excludeId };
    return User.exists(query);
  }
}
