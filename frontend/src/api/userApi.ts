export type UserRole = "admin" | "teacher" | "student";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

const BASE = "/api/users";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth") || "{}").accessToken ?? ""}`,
});

const handleRes = async (res: globalThis.Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data.data;
};

export const userApi = {
  getAll: (params: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.role) q.set("role", params.role);
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    return fetch(`${BASE}?${q}`, { headers: authHeader() }).then(
      handleRes,
    ) as Promise<UserListResponse>;
  },

  create: (data: UserFormData) =>
    fetch(BASE, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }).then(handleRes) as Promise<User>,

  update: (id: string, data: Partial<UserFormData>) =>
    fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }).then(handleRes) as Promise<User>,

  delete: (id: string) =>
    fetch(`${BASE}/${id}`, { method: "DELETE", headers: authHeader() }).then(
      handleRes,
    ),
};
