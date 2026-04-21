import { describe, expect, it } from "vitest";

import { getSupabaseUrlValidationError } from "@/lib/supabase";

describe("getSupabaseUrlValidationError", () => {
  it("rejects Supabase dashboard URLs", () => {
    const result = getSupabaseUrlValidationError(
      "https://supabase.com/dashboard/project/flbdwuhoyqbbidbkrmmi",
    );

    expect(result).toContain("project auth domain");
  });

  it("accepts Supabase project domains", () => {
    const result = getSupabaseUrlValidationError(
      "https://flbdwuhoyqbbidbkrmmi.supabase.co",
    );

    expect(result).toBeNull();
  });
});
