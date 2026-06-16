import { Navigate, Outlet } from "react-router";
import { useAuth, type UserRole } from "./AuthContext";

// Chặn route chưa đăng nhập → redirect /login
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

// Chặn route sai role → redirect về dashboard đúng của mình
export function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboard(user?.role)} replace />;
  }

  return <Outlet />;
}

// Redirect user đã login ra khỏi /login
export function GuestRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated)
    return <Navigate to={getDashboard(user?.role)} replace />;

  return <Outlet />;
}

export const getDashboard = (role?: UserRole | null): string => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/login";
  }
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <svg
      className="w-6 h-6 animate-spin text-primary"
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
  </div>
);
