import { describe, expect, it } from "vitest";

import { resolveAppAccess } from "@/auth/accessPolicy";

describe("resolveAppAccess", () => {
  it("allows authenticated users until backend membership enforcement is added", async () => {
    const result = await resolveAppAccess({} as never);

    expect(result).toEqual({ status: "allowed" });
  });
});
