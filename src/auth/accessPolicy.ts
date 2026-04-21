import type { Session } from "@supabase/supabase-js";

export type AppAccessDecision =
  | { status: "allowed" }
  | { status: "blocked"; reason: string };

export const MEMBERSHIP_ENFORCEMENT_STATUS = "pending" as const;
export const MEMBERSHIP_ENFORCEMENT_NOTE =
  "Backend membership enforcement is intentionally pending. resolveAppAccess currently allows authenticated Supabase users until the backend entitlement check is connected.";

export async function resolveAppAccess(
  _session: Session,
): Promise<AppAccessDecision> {
  return { status: "allowed" };
}
