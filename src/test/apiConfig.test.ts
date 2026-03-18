import { describe, expect, it } from "vitest";

import { buildApiUrl, getApiBaseUrlValidationError } from "@/lib/api";

describe("api configuration", () => {
  it("accepts a valid absolute backend URL", () => {
    const result = getApiBaseUrlValidationError("https://marketscope-backend1.onrender.com");

    expect(result).toBeNull();
  });

  it("rejects a missing API base URL", () => {
    const result = getApiBaseUrlValidationError("");

    expect(result).toContain("VITE_API_BASE_URL is missing");
  });

  it("rejects an API base URL pointing at the frontend origin", () => {
    const result = getApiBaseUrlValidationError("https://marketscope-frontend.vercel.app", "https://marketscope-frontend.vercel.app");

    expect(result).toContain("current frontend origin");
  });

  it("rejects Supabase hosts for backend data APIs", () => {
    const result = getApiBaseUrlValidationError("https://supabase.com");

    expect(result).toContain("Supabase host");
  });

  it("builds absolute backend URLs", () => {
    expect(buildApiUrl("https://marketscope-backend1.onrender.com", "/heatmap")).toBe(
      "https://marketscope-backend1.onrender.com/heatmap",
    );
  });
});