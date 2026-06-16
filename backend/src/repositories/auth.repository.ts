import User, { IUser } from "../models/user.model";

export class AuthRepository {
  findByEmail = (email: string) => User.findOne({ email }).select("+password");
  findById = (id: string) => User.findById(id);
  create = (data: Partial<IUser>) => User.create(data);
  findByIdWithRefreshToken = (id: string) =>
    User.findById(id).select("+refreshToken");
  updateRefreshToken = (id: string, token: string | null) =>
    User.findByIdAndUpdate(id, { refreshToken: token });
}
