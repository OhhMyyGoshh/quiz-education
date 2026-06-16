import { useState, useEffect, useCallback } from "react";

import UserModal from "../../components/admin/modals/UserModal";
import DeleteConfirmModal from "../../components/admin/modals/DeleteConfirmModal";
import {
  userApi,
  type User,
  type UserFormData,
  type UserRole,
} from "../../api/userApi";

const ROLES: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
];

const roleBadge: Record<UserRole, string> = {
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  teacher: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  student: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getAll({
        search,
        role: roleFilter,
        page,
        limit: 10,
      });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleCreate = () => {
    setEditUser(null);
    setModalOpen(true);
  };
  const handleEdit = (u: User) => {
    setEditUser(u);
    setModalOpen(true);
  };
  const handleDelete = (u: User) => {
    setDeleteUser(u);
    setDeleteOpen(true);
  };

  const handleSave = async (data: UserFormData) => {
    if (editUser) {
      await userApi.update(editUser._id, data);
    } else {
      await userApi.create(data);
    }
    fetchUsers();
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    setDelLoading(true);
    try {
      await userApi.delete(deleteUser._id);
      setDeleteOpen(false);
      fetchUsers();
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Người dùng
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} tài khoản trong hệ thống
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Tạo người dùng
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-input border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:focus:border-sky-400 dark:focus:ring-sky-500/30 transition-all"
          />
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-sky-50 border border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRoleFilter(r.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                roleFilter === r.value
                  ? "bg-white text-sky-700 border border-sky-200 shadow-sm dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/30"
                  : "text-muted-foreground hover:text-sky-700 dark:hover:text-sky-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-sky-100 dark:border-sky-500/20 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-sky-50/70 dark:bg-sky-500/10">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Người dùng
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  <svg
                    className="w-5 h-5 animate-spin mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr
                  key={u._id}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase">
                          {u.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${roleBadge[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-700 hover:bg-sky-100 dark:hover:text-sky-300 dark:hover:bg-sky-500/15 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Trang {page} / {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .map((p, idx, arr) => (
                <>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span
                      key={`dot-${p}`}
                      className="px-1 text-muted-foreground text-xs"
                    >
                      …
                    </span>
                  )}
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === p
                        ? "bg-sky-600 text-white dark:bg-sky-500"
                        : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                </>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <UserModal
        open={modalOpen}
        user={editUser}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        name={deleteUser?.name ?? ""}
        loading={delLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
