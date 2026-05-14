import { apiFetch } from "@/lib/api";
import {
  createEmptyMomentumPulseStrategyReviewResponse,
  createEmptyMomentumPulseStrategyReviewSummary,
  type KnownMomentumPulseStrategyReviewOutcome,
  type MomentumPulseStrategyReviewQuery,
  type MomentumPulseStrategyReviewReasonStat,
  type MomentumPulseStrategyReviewResponse,
  type MomentumPulseStrategyReviewRow,
  type MomentumPulseStrategyReviewSummary,
} from "@/data/momentumPulseStrategyReviewData";
import type {
  MomentumPulseStrategyGrade,
  MomentumPulseStrategyTradeSide,
} from "@/data/momentumPulseStrategyData";

const VALID_TRADE_SIDES: MomentumPulseStrategyTradeSide[] = [
  "LONG",
  "SHORT",
  "NO_TRADE",
];
const VALID_GRADES: MomentumPulseStrategyGrade[] = [
  "A_PLUS",
  "A",
  "FAILED_OR_CHOP",
  "NO_TRADE",
];
const VALID_OUTCOMES: KnownMomentumPulseStrategyReviewOutcome[] = [
  "WIN",
  "LOSS",
  "OPEN",
  "FLAT",
  "NO_DATA",
];

function asFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function asNullableNumber(value: unknown) {
  return asFiniteNumber(value) ?? null;
}

function asOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (typeof item === "number" || typeof item === "boolean") {
        return String(item);
      }

      return "";
    })
    .filter(Boolean);
}

function asTradeSide(value: unknown): MomentumPulseStrategyTradeSide {
  return typeof value === "string" &&
    VALID_TRADE_SIDES.includes(value as MomentumPulseStrategyTradeSide)
    ? (value as MomentumPulseStrategyTradeSide)
    : "NO_TRADE";
}

function asGrade(value: unknown): MomentumPulseStrategyGrade {
  return typeof value === "string" &&
    VALID_GRADES.includes(value as MomentumPulseStrategyGrade)
    ? (value as MomentumPulseStrategyGrade)
    : "NO_TRADE";
}

function normalizeReasonStat(value: unknown): MomentumPulseStrategyReviewReasonStat | null {
  if (typeof value === "string") {
    const label = value.trim();
    return label ? { label, count: null } : null;
  }

  if (Array.isArray(value)) {
    const label = asOptionalString(value[0])?.trim() ?? "";
    if (!label) {
      return null;
    }

    return {
      label,
      count: asFiniteNumber(value[1]) ?? null,
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const label =
    asOptionalString(data.label)?.trim() ??
    asOptionalString(data.reason)?.trim() ??
    asOptionalString(data.code)?.trim() ??
    "";

  if (!label) {
    return null;
  }

  return {
    label,
    count:
      asFiniteNumber(data.count) ??
      asFiniteNumber(data.total) ??
      asFiniteNumber(data.value) ??
      null,
  };
}

function normalizeReasonStats(
  value: unknown,
): MomentumPulseStrategyReviewReasonStat[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeReasonStat(item))
      .filter((item): item is MomentumPulseStrategyReviewReasonStat => item !== null);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([label, count]) => {
      const normalizedLabel = label.trim();
      if (!normalizedLabel) {
        return null;
      }

      return {
        label: normalizedLabel,
        count: asFiniteNumber(count) ?? null,
      };
    })
    .filter((item): item is MomentumPulseStrategyReviewReasonStat => item !== null);
}

function normalizeSummary(value: unknown): MomentumPulseStrategyReviewSummary {
  if (!value || typeof value !== "object") {
    return createEmptyMomentumPulseStrategyReviewSummary();
  }

  const data = value as Record<string, unknown>;

  return {
    total_signals: asFiniteNumber(data.total_signals) ?? 0,
    win_count: asFiniteNumber(data.win_count) ?? 0,
    loss_count: asFiniteNumber(data.loss_count) ?? 0,
    open_count: asFiniteNumber(data.open_count) ?? 0,
    no_data_count: asFiniteNumber(data.no_data_count) ?? 0,
    win_rate_pct: asFiniteNumber(data.win_rate_pct) ?? 0,
    avg_execution_rank: asFiniteNumber(data.avg_execution_rank) ?? 0,
    top_win_reasons: normalizeReasonStats(data.top_win_reasons),
    top_loss_reasons: normalizeReasonStats(data.top_loss_reasons),
  };
}

function normalizeDates(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asOptionalString(item)?.trim() ?? "")
    .filter(Boolean);
}

function normalizeOutcome(value: unknown) {
  const outcome = asOptionalString(value)?.trim();
  return outcome || "NO_DATA";
}

function normalizeOutcomeOptions(
  value: unknown,
): (KnownMomentumPulseStrategyReviewOutcome | string)[] {
  if (!Array.isArray(value)) {
    return [...VALID_OUTCOMES];
  }

  const normalized = value
    .map((item) => asOptionalString(item)?.trim() ?? "")
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [...VALID_OUTCOMES];
}

function normalizeReviewRow(value: unknown): MomentumPulseStrategyReviewRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const symbol = asOptionalString(row.symbol)?.trim();

  if (!symbol) {
    return null;
  }

  return {
    symbol,
    trade_date: asOptionalString(row.trade_date) ?? "",
    signal_bar_time: asOptionalString(row.signal_bar_time) ?? "",
    trade_side: asTradeSide(row.trade_side ?? row.direction),
    grade: asGrade(row.grade),
    entry_state: asOptionalString(row.entry_state) ?? "",
    outcome: normalizeOutcome(row.outcome),
    outcome_event: asOptionalString(row.outcome_event) ?? "",
    outcome_reason: asOptionalString(row.outcome_reason) ?? "",
    win_loss_reason_codes: asStringArray(row.win_loss_reason_codes),
    entry_price: asNullableNumber(row.entry_price),
    stop_loss: asNullableNumber(row.stop_loss),
    target_1: asNullableNumber(row.target_1),
    target_2: asNullableNumber(row.target_2),
    exit_price: asNullableNumber(row.exit_price),
    exit_time: asOptionalString(row.exit_time) ?? "",
    max_favorable_pct: asNullableNumber(row.max_favorable_pct),
    max_adverse_pct: asNullableNumber(row.max_adverse_pct),
    close_pnl_pct: asNullableNumber(row.close_pnl_pct),
    execution_rank: asNullableNumber(row.execution_rank),
    score: asNullableNumber(row.score),
    momentum_pulse_score: asNullableNumber(row.momentum_pulse_score),
    volume_ratio: asNullableNumber(row.volume_ratio),
    range_ratio: asNullableNumber(row.range_ratio),
    vwap_distance_pct: asNullableNumber(row.vwap_distance_pct),
    chase_risk: asOptionalString(row.chase_risk) ?? "",
    retest_ok: asOptionalBoolean(row.retest_ok) ?? null,
    major_risks: asStringArray(row.major_risks),
    reversal_flags: asStringArray(row.reversal_flags),
    reasons: asStringArray(row.reasons),
  };
}

export function normalizeMomentumPulseStrategyReviewResponse(
  payload: unknown,
  query: MomentumPulseStrategyReviewQuery,
): MomentumPulseStrategyReviewResponse {
  if (!payload || typeof payload !== "object") {
    return createEmptyMomentumPulseStrategyReviewResponse(query);
  }

  const data = payload as Record<string, unknown>;
  const rawRows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.data)
      ? data.data
      : [];

  const rows = rawRows
    .map((row) => normalizeReviewRow(row))
    .filter((row): row is MomentumPulseStrategyReviewRow => row !== null);

  return {
    feature: asOptionalString(data.feature) ?? "Momentum Pulse Strategy Review",
    feature_key:
      asOptionalString(data.feature_key) ??
      "momentum_pulse_strategy_review",
    mode: asOptionalString(data.mode) ?? "review",
    status: asOptionalString(data.status) ?? "empty",
    message: asOptionalString(data.message) ?? "",
    dates: normalizeDates(data.dates),
    rows,
    total: asFiniteNumber(data.total) ?? rows.length,
    summary: normalizeSummary(data.summary),
    available_outcomes: normalizeOutcomeOptions(data.available_outcomes),
  };
}

export async function fetchMomentumPulseStrategyReviewData(
  query: MomentumPulseStrategyReviewQuery,
  signal?: AbortSignal,
): Promise<MomentumPulseStrategyReviewResponse> {
  const params = new URLSearchParams({
    days: String(query.days),
    limit: String(query.limit),
  });

  if (query.date) {
    params.set("date", query.date);
  }

  const response = await apiFetch(
    `/momentum-pulse/strategy-review?${params.toString()}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load /momentum-pulse/strategy-review (${response.status})`,
    );
  }

  const payload = await response.json();
  return normalizeMomentumPulseStrategyReviewResponse(payload, query);
}
