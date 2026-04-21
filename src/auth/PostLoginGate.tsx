import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { resolveAppAccess, type AppAccessDecision } from "@/auth/accessPolicy";
import { AuthLoadingScreen } from "@/components/AuthLoadingScreen";
import { LANDING_ROUTE } from "@/lib/authRoutes";

export function PostLoginGate() {
  const { session } = useAuth();
  const [decision, setDecision] = useState<AppAccessDecision | null>(null);

  useEffect(() => {
    if (!session) {
      setDecision(null);
      return;
    }

    let isMounted = true;

    resolveAppAccess(session).then((nextDecision) => {
      if (isMounted) {
        setDecision(nextDecision);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [session]);

  if (!session) {
    return <Navigate to={LANDING_ROUTE} replace />;
  }

  if (!decision) {
    return (
      <AuthLoadingScreen
        title="Preparing workspace"
        description="Checking your account access and syncing your trading workspace."
      />
    );
  }

  if (decision.status === "blocked") {
    return (
      <Navigate
        to={LANDING_ROUTE}
        replace
        state={{ accessError: decision.reason }}
      />
    );
  }

  return <Outlet />;
}
