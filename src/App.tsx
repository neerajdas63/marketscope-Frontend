import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/auth/AuthProvider";
import { PostLoginGate } from "@/auth/PostLoginGate";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/ProtectedRoute";
import { APP_ROUTE, LANDING_ROUTE } from "@/lib/authRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path={LANDING_ROUTE} element={<Landing />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<PostLoginGate />}>
                <Route path={APP_ROUTE} element={<Index />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
