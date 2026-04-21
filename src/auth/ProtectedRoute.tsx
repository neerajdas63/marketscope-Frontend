import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { AuthLoadingScreen } from "@/components/AuthLoadingScreen";
import { APP_ROUTE, LANDING_ROUTE } from "@/lib/authRoutes";

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AuthLoadingScreen
        title="Loading MarketScope"
        description="Resolving your session and preparing the workspace."
      />
    );
  }

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTE} replace />;
  }

  return <Outlet />;
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AuthLoadingScreen
        title="Checking session"
        description="Resolving your authenticated workspace."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={LANDING_ROUTE} replace />;
  }

  return <Outlet />;
}
