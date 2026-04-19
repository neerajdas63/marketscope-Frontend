import { describe, expect, it } from "vitest";

import { DEFAULT_APP_TAB, isAppTab, resolveAppTab } from "@/lib/appTabs";

describe("appTabs", () => {
  it("accepts valid top-level tabs", () => {
    expect(isAppTab("pulse-navigator")).toBe(true);
    expect(isAppTab("momentum-pulse")).toBe(true);
    expect(isAppTab("momentum-pulse-strategy")).toBe(true);
  });

  it("rejects invalid tab values", () => {
    expect(isAppTab("discover")).toBe(false);
    expect(isAppTab("not-a-real-tab")).toBe(false);
    expect(isAppTab(null)).toBe(false);
  });

  it("falls back to the default tab for missing or invalid values", () => {
    expect(resolveAppTab(undefined)).toBe(DEFAULT_APP_TAB);
    expect(resolveAppTab("discover")).toBe(DEFAULT_APP_TAB);
    expect(resolveAppTab("heatmap")).toBe("heatmap");
  });
});
