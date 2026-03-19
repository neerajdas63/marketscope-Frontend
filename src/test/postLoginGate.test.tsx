import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import { PostLoginGate } from "@/auth/PostLoginGate";

const authState = vi.hoisted(() => ({
  session: null as Session | null,
}));

const accessPolicyState = vi.hoisted(() => ({
  resolveAppAccess: vi.fn(),
}));

vi.mock("@/auth/AuthProvider", () => ({
  useAuth: () => ({
    session: authState.session,
  }),
}));

vi.mock("@/auth/accessPolicy", async () => {
  const actual = await vi.importActual<typeof import("@/auth/accessPolicy")>("@/auth/accessPolicy");

  return {
    ...actual,
    resolveAppAccess: accessPolicyState.resolveAppAccess,
  };
});

function renderGate() {
  return render(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route element={<PostLoginGate />}>
          <Route path="/app" element={<div>workspace</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("PostLoginGate", () => {
  it("keeps the workspace mounted while a refreshed session is revalidated", async () => {
    const firstSession = { access_token: "first" } as Session;
    const refreshedSession = { access_token: "second" } as Session;

    authState.session = firstSession;
    accessPolicyState.resolveAppAccess.mockReset();
    accessPolicyState.resolveAppAccess
      .mockResolvedValueOnce({ status: "allowed" })
      .mockImplementationOnce(() => new Promise(() => undefined));

    const view = renderGate();

    expect(screen.getByText("Preparing workspace")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("workspace")).toBeInTheDocument();
    });

    authState.session = refreshedSession;
    view.rerender(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<PostLoginGate />}>
            <Route path="/app" element={<div>workspace</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("workspace")).toBeInTheDocument();
    expect(screen.queryByText("Preparing workspace")).not.toBeInTheDocument();
  });
});