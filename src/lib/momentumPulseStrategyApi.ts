import { apiFetch } from "@/lib/api";
import {
  createEmptyMomentumPulseStrategyBestStocks,
  createEmptyMomentumPulseStrategyResponse,
  createEmptyMomentumPulseStrategySummary,
  type MomentumPulseStrategyBestStocks,
  type MomentumPulseStrategyDirectionFilter,
  type MomentumPulseStrategyGrade,
  type MomentumPulseStrategyGradeFilter,
  type MomentumPulseStrategyQuery,
  type MomentumPulseStrategyResponse,
  type MomentumPulseStrategyRow,
  type MomentumPulseStrategySummary,
  type MomentumPulseStrategyTradeSide,
} from "@/data/momentumPulseStrategyData";

const VALID_DIRECTION_FILTERS: MomentumPulseStrategyDirectionFilter[] = ["ALL", "LONG", "SHORT"];
const VALID_GRADE_FILTERS: MomentumPulseStrategyGradeFilter[] = ["ALL", "A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"];
const VALID_GRADES: MomentumPulseStrategyGrade[] = ["A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"];
const VALID_TRADE_SIDES: MomentumPulseStrategyTradeSide[] = ["LONG", "SHORT", "NO_TRADE"];

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
  return typeof value === "string" && VALID_TRADE_SIDES.includes(value as MomentumPulseStrategyTradeSide)
    ? (value as MomentumPulseStrategyTradeSide)
    : "NO_TRADE";
}

function asGrade(value: unknown): MomentumPulseStrategyGrade {
  return typeof value === "string" && VALID_GRADES.includes(value as MomentumPulseStrategyGrade)
    ? (value as MomentumPulseStrategyGrade)
    : "NO_TRADE";
}

function asDirectionFilter(
  value: unknown,
  fallback: MomentumPulseStrategyDirectionFilter,
): MomentumPulseStrategyDirectionFilter {
  return typeof value === "string" && VALID_DIRECTION_FILTERS.includes(value as MomentumPulseStrategyDirectionFilter)
    ? (value as MomentumPulseStrategyDirectionFilter)
    : fallback;
}

function asGradeFilter(
  value: unknown,
  fallback: MomentumPulseStrategyGradeFilter,
): MomentumPulseStrategyGradeFilter {
  return typeof value === "string" && VALID_GRADE_FILTERS.includes(value as MomentumPulseStrategyGradeFilter)
    ? (value as MomentumPulseStrategyGradeFilter)
    : fallback;
}

function normalizeSummaryCommon(value: unknown) {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    avg_score: asFiniteNumber(data.avg_score) ?? 0,
    avg_vwap_dist: asFiniteNumber(data.avg_vwap_dist) ?? 0,
    avg_volume_ratio: asFiniteNumber(data.avg_volume_ratio) ?? 0,
    avg_range_ratio: asFiniteNumber(data.avg_range_ratio) ?? 0,
  };
}

function normalizeSummary(value: unknown): MomentumPulseStrategySummary {
  if (!value || typeof value !== "object") {
    return createEmptyMomentumPulseStrategySummary();
  }

  const data = value as Record<string, unknown>;

  return {
    total: asFiniteNumber(data.total) ?? 0,
    a_plus_count: asFiniteNumber(data.a_plus_count) ?? 0,
    a_count: asFiniteNumber(data.a_count) ?? 0,
    failed_or_chop_count: asFiniteNumber(data.failed_or_chop_count) ?? 0,
    no_trade_count: asFiniteNumber(data.no_trade_count) ?? 0,
    long_count: asFiniteNumber(data.long_count) ?? 0,
    short_count: asFiniteNumber(data.short_count) ?? 0,
    enter_now_count: asFiniteNumber(data.enter_now_count) ?? 0,
    enter_on_retest_count: asFiniteNumber(data.enter_on_retest_count) ?? 0,
    avoid_count: asFiniteNumber(data.avoid_count) ?? 0,
    avg_volume_ratio: asFiniteNumber(data.avg_volume_ratio) ?? 0,
    avg_range_ratio: asFiniteNumber(data.avg_range_ratio) ?? 0,
    avg_execution_rank: asFiniteNumber(data.avg_execution_rank) ?? 0,
    avg_abs_change_pct: asFiniteNumber(data.avg_abs_change_pct) ?? 0,
    a_plus_common: normalizeSummaryCommon(data.a_plus_common),
    a_common: normalizeSummaryCommon(data.a_common),
  };
}

function normalizeDirectionOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return ["ALL", "LONG", "SHORT"] satisfies MomentumPulseStrategyDirectionFilter[];
  }

  const normalized = value.filter(
    (item): item is MomentumPulseStrategyDirectionFilter =>
      typeof item === "string" && VALID_DIRECTION_FILTERS.includes(item as MomentumPulseStrategyDirectionFilter),
  );

  return normalized.length > 0 ? normalized : ["ALL", "LONG", "SHORT"];
}

function normalizeGradeOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return ["ALL", "A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"] satisfies MomentumPulseStrategyGradeFilter[];
  }

  const normalized = value.filter(
    (item): item is MomentumPulseStrategyGradeFilter =>
      typeof item === "string" && VALID_GRADE_FILTERS.includes(item as MomentumPulseStrategyGradeFilter),
  );

  return normalized.length > 0 ? normalized : ["ALL", "A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"];
}

function normalizeStrategyRow(value: unknown): MomentumPulseStrategyRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const symbol = asOptionalString(row.symbol);

  if (!symbol) {
    return null;
  }

  return {
    symbol,
    trade_date: asOptionalString(row.trade_date) ?? "",
    scan_time: asOptionalString(row.scan_time) ?? "",
    trade_side: asTradeSide(row.trade_side ?? row.direction),
    grade: asGrade(row.grade),
    entry_state: asOptionalString(row.entry_state) ?? "",
    execution_rank: asNullableNumber(row.execution_rank),
    eligible_time_window: asOptionalBoolean(row.eligible_time_window) ?? false,
    score: asFiniteNumber(row.score) ?? 0,
    momentum_pulse_score: asNullableNumber(row.momentum_pulse_score),
    grade_stability_score: asNullableNumber(row.grade_stability_score),
    chase_risk: asOptionalString(row.chase_risk) ?? "",
    retest_ok: asOptionalBoolean(row.retest_ok) ?? null,
    price_at_scan: asNullableNumber(row.price_at_scan),
    prev_close: asNullableNumber(row.prev_close),
    vwap: asNullableNumber(row.vwap),
    or_high: asNullableNumber(row.or_high),
    or_low: asNullableNumber(row.or_low),
    or_stretch_pct: asNullableNumber(row.or_stretch_pct),
    vwap_distance_pct: asNullableNumber(row.vwap_distance_pct),
    volume_ratio: asNullableNumber(row.volume_ratio),
    range_ratio: asNullableNumber(row.range_ratio),
    entry_price: asNullableNumber(row.entry_price),
    stop_loss: asNullableNumber(row.stop_loss),
    target_1: asNullableNumber(row.target_1),
    target_2: asNullableNumber(row.target_2),
    rr_t1: asNullableNumber(row.rr_t1),
    rr_t2: asNullableNumber(row.rr_t2),
    reasons: asStringArray(row.reasons),
    major_risks: asStringArray(row.major_risks),
    grade_history: asStringArray(row.grade_history),
    warning_flags: asStringArray(row.warning_flags),
    entry_notes: asStringArray(row.entry_notes),
    stop_notes: asStringArray(row.stop_notes),
    exit_notes: asStringArray(row.exit_notes),
  };
}

function normalizeBestStockBucket(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeStrategyRow(item))
      .filter((item): item is MomentumPulseStrategyRow => item !== null);
  }

  const single = normalizeStrategyRow(value);
  return single ? [single] : [];
}

function normalizeBestStocks(value: unknown): MomentumPulseStrategyBestStocks {
  if (!value || typeof value !== "object") {
    return createEmptyMomentumPulseStrategyBestStocks();
  }

  const data = value as Record<string, unknown>;

  return {
    overall_best: normalizeBestStockBucket(data.overall_best),
    best_longs: normalizeBestStockBucket(data.best_longs),
    best_shorts: normalizeBestStockBucket(data.best_shorts),
    avoid_list: normalizeBestStockBucket(data.avoid_list),
  };
}

export function normalizeMomentumPulseStrategyResponse(
  payload: unknown,
  query: MomentumPulseStrategyQuery,
): MomentumPulseStrategyResponse {
  if (!payload || typeof payload !== "object") {
    return createEmptyMomentumPulseStrategyResponse(query);
  }

  const data = payload as Record<string, unknown>;
  const rawRows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.data)
      ? data.data
      : [];

  const rows = rawRows
    .map((row) => normalizeStrategyRow(row))
    .filter((row): row is MomentumPulseStrategyRow => row !== null);

  return {
    feature: asOptionalString(data.feature) ?? "Momentum Pulse Strategy",
    feature_key: asOptionalString(data.feature_key) ?? "momentum_pulse_strategy",
    mode: asOptionalString(data.mode) ?? "live",
    status: asOptionalString(data.status) ?? "ready",
    message: asOptionalString(data.message) ?? "",
    last_updated: asOptionalString(data.last_updated) ?? "",
    market_data_last_updated: asOptionalString(data.market_data_last_updated) ?? "",
    benchmark_change_pct: asFiniteNumber(data.benchmark_change_pct) ?? 0,
    direction: asDirectionFilter(data.direction, query.direction),
    grade: asGradeFilter(data.grade, query.grade),
    rows,
    total: asFiniteNumber(data.total) ?? rows.length,
    total_candidates: asFiniteNumber(data.total_candidates) ?? rows.length,
    summary: normalizeSummary(data.summary),
    overall_summary: normalizeSummary(data.overall_summary ?? data.summary),
    best_stocks: normalizeBestStocks(data.best_stocks),
    available_directions: normalizeDirectionOptions(data.available_directions),
    available_grades: normalizeGradeOptions(data.available_grades),
  };
}

export async function fetchMomentumPulseStrategyData(
  query: MomentumPulseStrategyQuery,
  signal?: AbortSignal,
): Promise<MomentumPulseStrategyResponse> {
  const params = new URLSearchParams({
    limit: String(query.limit),
    direction: query.direction,
    grade: query.grade,
  });

  const response = await apiFetch(`/momentum-pulse/strategy?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load /momentum-pulse/strategy (${response.status})`);
  }

  const payload = await response.json();
  return normalizeMomentumPulseStrategyResponse(payload, query);
}
