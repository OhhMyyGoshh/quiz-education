import { useState, useEffect } from "react";
import type { User, UserFormData } from "../../../api/userApi";
import type { UserRole } from "../../../context/AuthContext";

interface Props {
  open: boolean;
  user?: User | null; // null = create, User = edit
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
}

const roles: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
];

const EMPTY: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "student",
};

export default function UserModal({ open, user, onClose, onSave }: Props) {
  const isEdit = !!user;
  const [form, setForm] = useState<UserFormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        user
          ? {
              name: user.name,
              email: user.email,
              role: user.role,
              password: "",
            }
          : EMPTY,
      );
      setErrors({});
      setApiErr("");
    }
  }, [open, user]);

  const set = (k: keyof UserFormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Partial<UserFormData> = {};
    if (!form.name.trim()) e.name = "Bắt buộc";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email không hợp lệ";
    if (!isEdit && (!form.password || form.password.length < 6))
      e.password = "Tối thiểu 6 ký tự";
    if (isEdit && form.password && form.password.length < 6)
      e.password = "Tối thiểu 6 ký tự";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiErr("");
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setApiErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl"
        style={{ animation: "fadeUp 0.2s ease both" }}
      >
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {isEdit ? "Chỉnh sửa người dùng" : "Tạo người dùng mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {apiErr && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              {apiErr}
            </div>
          )}

          {/* Name */}
          <Field label="Họ tên" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nguyễn Văn A"
              className={inputCls(!!errors.name)}
            />
          </Field>

          {/* Email */}
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="user@example.com"
              className={inputCls(!!errors.email)}
            />
          </Field>

          {/* Password */}
          <Field
            label={
              isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"
            }
            error={errors.password}
          >
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={isEdit ? "••••••••" : "Tối thiểu 6 ký tự"}
              className={inputCls(!!errors.password)}
            />
          </Field>

          {/* Role */}
          <Field label="Vai trò">
            <div className="grid grid-cols-3 gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set("role", r.value)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.role === r.value
                      ? "bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:border-sky-500"
                      : "bg-input border-border text-muted-foreground hover:text-foreground hover:border-ring"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 transition-colors disabled:opacity-60"
          >
            {loading && (
              <svg
                className="w-3.5 h-3.5 animate-spin"
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
            )}
            {isEdit ? "Lưu thay đổi" : "Tạo người dùng"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = (err: boolean) =>
  `w-full px-3 py-2.5 rounded-lg bg-input border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${
    err
      ? "border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-border focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
  }`;

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-foreground mb-1.5">
      {label}
    </label>
    {children}
    {error && <p className="text-destructive text-xs mt-1">{error}</p>}
  </div>
);
