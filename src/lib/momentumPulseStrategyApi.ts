import { apiFetch } from "@/lib/api";
import {
  createEmptyMomentumPulseStrategyResponse,
  createEmptyMomentumPulseStrategySummary,
  type MomentumPulseStrategyDirectionFilter,
  type MomentumPulseStrategyGrade,
  type MomentumPulseStrategyGradeFilter,
  type MomentumPulseStrategyMode,
  type MomentumPulseStrategyPerformanceSummary,
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
const VALID_MODES: MomentumPulseStrategyMode[] = ["live", "historical"];

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
    if (normalized === "true") return true;
    if (normalized === "false") return false;
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
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function asMode(value: unknown, fallback: MomentumPulseStrategyMode): MomentumPulseStrategyMode {
  return typeof value === "string" && VALID_MODES.includes(value as MomentumPulseStrategyMode)
    ? (value as MomentumPulseStrategyMode)
    : fallback;
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
    avg_volume_ratio: asFiniteNumber(data.avg_volume_ratio) ?? 0,
    avg_range_ratio: asFiniteNumber(data.avg_range_ratio) ?? 0,
    avg_abs_change_pct: asFiniteNumber(data.avg_abs_change_pct) ?? 0,
    a_plus_common: normalizeSummaryCommon(data.a_plus_common),
    a_common: normalizeSummaryCommon(data.a_common),
  };
}

function normalizePerformanceSummary(value: unknown): MomentumPulseStrategyPerformanceSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  return {
    trades: asFiniteNumber(data.trades) ?? 0,
    wins: asFiniteNumber(data.wins) ?? 0,
    losses: asFiniteNumber(data.losses) ?? 0,
    win_rate: asFiniteNumber(data.win_rate) ?? 0,
    target_1_hits: asFiniteNumber(data.target_1_hits) ?? 0,
    target_2_hits: asFiniteNumber(data.target_2_hits) ?? 0,
    stop_loss_hits: asFiniteNumber(data.stop_loss_hits) ?? 0,
    avg_pnl_pct: asFiniteNumber(data.avg_pnl_pct) ?? 0,
    avg_rr: asFiniteNumber(data.avg_rr) ?? 0,
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
    trade_side: asTradeSide(row.trade_side),
    grade: asGrade(row.grade),
    eligible_time_window: asOptionalBoolean(row.eligible_time_window) ?? false,
    score: asFiniteNumber(row.score) ?? 0,
    price_at_scan: asNullableNumber(row.price_at_scan),
    prev_close: asNullableNumber(row.prev_close),
    vwap: asNullableNumber(row.vwap),
    or_high: asNullableNumber(row.or_high),
    or_low: asNullableNumber(row.or_low),
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
    entry_notes: asStringArray(row.entry_notes),
    stop_notes: asStringArray(row.stop_notes),
    exit_notes: asStringArray(row.exit_notes),
    historical_outcome: asOptionalString(row.historical_outcome) ?? "",
    historical_exit_time: asOptionalString(row.historical_exit_time) ?? "",
    historical_exit_price: asNullableNumber(row.historical_exit_price),
    historical_pnl_pct: asNullableNumber(row.historical_pnl_pct),
    historical_rr_realized: asNullableNumber(row.historical_rr_realized),
    historical_outcome_reason: asOptionalString(row.historical_outcome_reason) ?? "",
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
  const fallbackMode: MomentumPulseStrategyMode = query.date ? "historical" : "live";

  return {
    feature: asOptionalString(data.feature) ?? "Momentum Pulse Strategy",
    feature_key: asOptionalString(data.feature_key) ?? "momentum_pulse_strategy",
    mode: asMode(data.mode, fallbackMode),
    requested_date: asOptionalString(data.requested_date) ?? query.date ?? "",
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
    performance_summary: normalizePerformanceSummary(data.performance_summary),
    overall_performance_summary: normalizePerformanceSummary(data.overall_performance_summary),
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
    include_veryweak: String(query.includeVeryWeak),
  });

  if (query.date) {
    params.set("date", query.date);
  }

  const response = await apiFetch(`/momentum-pulse/strategy?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load /momentum-pulse/strategy (${response.status})`);
  }

  const payload = await response.json();
  return normalizeMomentumPulseStrategyResponse(payload, query);
}
