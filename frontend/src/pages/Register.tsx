// src/pages/RegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { UserRole } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = "Họ tên tối thiểu 2 ký tự";
    if (!email || !emailRe.test(email)) e.email = "Vui lòng nhập email hợp lệ";
    if (!password || password.length < 6)
      e.password = "Mật khẩu tối thiểu 6 ký tự";
    if (password !== confirmPassword)
      e.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Đăng ký thất bại");

      setSuccess(true);

      setTimeout(() => {
        if (role === "admin") navigate("/admin");
        else if (role === "teacher") navigate("/teacher");
        else navigate("/student");
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background font-sans">
      {/* ── Left panel — identical to Login ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary overflow-hidden">
        {/* bg layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_80%,rgba(0,0,0,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(255,255,255,0.08),transparent)]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute bottom-28 right-16 w-48 h-48 rounded-full border border-white/[0.07]" />
        <div className="absolute bottom-14 left-44 w-24 h-24 rounded-full border border-white/15" />

        {/* brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-white font-semibold tracking-wide text-lg">
            Quiz Education
          </span>
        </div>

        {/* bottom text */}
        <div className="relative z-10">
          <h1 className="text-white font-bold text-4xl leading-tight tracking-tight mb-4">
            Bắt đầu hành trình.
            <br />
            <span className="font-light text-3xl text-white/70">
              Miễn phí, ngay hôm nay.
            </span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Tạo tài khoản trong vài giây — tham gia lớp học, làm quiz và theo
            dõi kết quả học tập theo thời gian thực.
          </p>
          <div className="flex gap-2 mt-6 flex-wrap">
            {["Admin", "Teacher", "Student"].map((r) => (
              <span
                key={r}
                className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest border border-white/20 text-white/75 bg-white/[0.08] backdrop-blur"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16 bg-background">
        <div
          className="w-full max-w-sm"
          style={{ animation: "fadeUp 0.45s ease both" }}
        >
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">
              Tạo tài khoản
            </h2>
            <p className="text-sm text-muted-foreground">
              Chọn vai trò và điền thông tin bên dưới
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted mb-5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  role === r.value
                    ? "bg-card text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Error alert */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success alert */}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs mb-4">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Đăng ký thành công! Đang chuyển hướng...
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <Field label="Họ và tên" error={errors.name}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  className={inputCls(!!errors.name)}
                />
              </div>
            </Field>

            {/* Email */}
            <Field label="Email" error={errors.email}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className={inputCls(!!errors.email)}
                />
              </div>
            </Field>

            {/* Password */}
            <Field label="Mật khẩu" error={errors.password}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  className={`${inputCls(!!errors.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength(password) >= i
                            ? i <= 1
                              ? "bg-destructive"
                              : i <= 2
                                ? "bg-amber-400"
                                : i <= 3
                                  ? "bg-chart-2"
                                  : "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {strengthLabel(password)}
                  </p>
                </div>
              )}
            </Field>

            {/* Confirm password */}
            <Field label="Xác nhận mật khẩu" error={errors.confirmPassword}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className={`${inputCls(!!errors.confirmPassword)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {/* Match indicator */}
                {confirmPassword.length > 0 && !errors.confirmPassword && (
                  <CheckCircle className="absolute right-9 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                )}
              </div>
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold tracking-wide transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Tạo tài khoản
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
const inputCls = (hasError: boolean) =>
  `w-full pl-9 pr-3 py-2.5 rounded-lg bg-input border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${
    hasError
      ? "border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-border focus:border-ring focus:ring-2 focus:ring-ring/20"
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

// Password strength: 1–4
function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(score, pw.length > 0 ? 1 : 0);
}

function strengthLabel(pw: string): string {
  const s = passwordStrength(pw);
  return ["", "Yếu", "Trung bình", "Khá mạnh", "Mạnh"][s] ?? "";
}
