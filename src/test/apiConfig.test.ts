import { describe, expect, it } from "vitest";

import { buildApiUrl, getApiBaseUrlValidationError } from "@/lib/api";

describe("api configuration", () => {
  it("accepts a valid absolute backend URL", () => {
    const result = getApiBaseUrlValidationError("https://marketscope-backend1.onrender.com");

    expect(result).toBeNull();
  });

  it("rejects a missing API base URL", () => {
    const result = getApiBaseUrlValidationError("");

    expect(result).toContain("VITE_API_BASE_URL");
  });

  it("builds absolute backend URLs", () => {
    expect(buildApiUrl("https://marketscope-backend1.onrender.com", "/heatmap")).toBe(
      "https://marketscope-backend1.onrender.com/heatmap",
    );
  });
});