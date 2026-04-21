import { apiFetch } from "@/lib/api";
import {
  type MomentumPulseBehaviorState,
  createEmptyMomentumPulseResponse,
  type MomentumPulseDirection,
  type MomentumPulseDirectionFilter,
  type MomentumPulseQuery,
  type MomentumPulseResponse,
  type MomentumPulseRow,
  type MomentumPulseTier,
  type MomentumPulseTimeContextBucket,
  type MomentumPulseTrendLabel,
} from "@/data/momentumPulseData";

const VALID_DIRECTIONS: MomentumPulseDirection[] = ["LONG", "SHORT", "NEUTRAL"];
const VALID_DIRECTION_FILTERS: MomentumPulseDirectionFilter[] = [
  "ALL",
  ...VALID_DIRECTIONS,
];
const VALID_TIERS: MomentumPulseTier[] = [
  "strong",
  "moderate",
  "weak",
  "veryweak",
];
const VALID_TREND_LABELS: MomentumPulseTrendLabel[] = [
  "Rising",
  "Flat",
  "Falling",
];
const VALID_BEHAVIOR_STATES: MomentumPulseBehaviorState[] = [
  "EARLY",
  "ACTIVE",
  "LATE",
  "EXTENDED",
];
const VALID_TIME_CONTEXT_BUCKETS: MomentumPulseTimeContextBucket[] = [
  "DISCOVERY",
  "TREND",
  "LATE",
  "--",
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

function asOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return undefined;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asDirection(value: unknown): MomentumPulseDirection {
  return typeof value === "string" &&
    VALID_DIRECTIONS.includes(value as MomentumPulseDirection)
    ? (value as MomentumPulseDirection)
    : "NEUTRAL";
}

function asDirectionFilter(
  value: unknown,
  fallback: MomentumPulseDirectionFilter,
): MomentumPulseDirectionFilter {
  return typeof value === "string" &&
    VALID_DIRECTION_FILTERS.includes(value as MomentumPulseDirectionFilter)
    ? (value as MomentumPulseDirectionFilter)
    : fallback;
}

function asTier(value: unknown): MomentumPulseTier {
  return typeof value === "string" &&
    VALID_TIERS.includes(value as MomentumPulseTier)
    ? (value as MomentumPulseTier)
    : "moderate";
}

function asTrendLabel(value: unknown): MomentumPulseTrendLabel {
  return typeof value === "string" &&
    VALID_TREND_LABELS.includes(value as MomentumPulseTrendLabel)
    ? (value as MomentumPulseTrendLabel)
    : "Flat";
}

function asBehaviorState(
  value: unknown,
): MomentumPulseBehaviorState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  if (
    VALID_BEHAVIOR_STATES.includes(normalized as MomentumPulseBehaviorState)
  ) {
    return normalized as MomentumPulseBehaviorState;
  }

  if (normalized === "DISCOVERY") {
    return "EARLY";
  }

  if (normalized === "TREND") {
    return "ACTIVE";
  }

  if (normalized === "LATE") {
    return "LATE";
  }

  return undefined;
}

function asTimeContextBucket(
  value: unknown,
): MomentumPulseTimeContextBucket | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  return VALID_TIME_CONTEXT_BUCKETS.includes(
    normalized as MomentumPulseTimeContextBucket,
  )
    ? (normalized as MomentumPulseTimeContextBucket)
    : undefined;
}

function asNumberArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => asFiniteNumber(point))
    .filter((point): point is number => point !== undefined);
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeMomentumPulseRow(
  value: unknown,
  fallbackRank: number,
): MomentumPulseRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const symbol = asOptionalString(row.symbol);
  const ltp = asFiniteNumber(row.ltp);
  const changePct = asFiniteNumber(row.change_pct);
  const score = asFiniteNumber(row.momentum_pulse_score);

  if (
    !symbol ||
    ltp === undefined ||
    changePct === undefined ||
    score === undefined
  ) {
    return null;
  }

  const scoreTimeBucket = asOptionalString(row.score_time_bucket) ?? "--";
  const isExtended = asOptionalBoolean(row.is_extended) ?? false;
  const timeContextBucket =
    asTimeContextBucket(row.time_context_bucket) ??
    asTimeContextBucket(row.score_time_bucket) ??
    "--";
  const behaviorState =
    asBehaviorState(row.behavior_state) ??
    asBehaviorState(row.score_time_bucket) ??
    (isExtended ? "EXTENDED" : "ACTIVE");

  return {
    symbol,
    ltp,
    change_pct: changePct,
    direction: asDirection(row.direction),
    direction_confidence: asFiniteNumber(row.direction_confidence) ?? 0,
    momentum_pulse_score: score,
    tier: asTier(row.tier),
    rank: asFiniteNumber(row.rank) ?? fallbackRank,
    volume_pace_score: asFiniteNumber(row.volume_pace_score) ?? 0,
    volume_pace_ratio: asFiniteNumber(row.volume_pace_ratio) ?? 0,
    range_expansion_score: asFiniteNumber(row.range_expansion_score) ?? 0,
    range_expansion_ratio: asFiniteNumber(row.range_expansion_ratio) ?? 0,
    relative_strength: asFiniteNumber(row.relative_strength) ?? 0,
    long_relative_strength_score:
      asFiniteNumber(row.long_relative_strength_score) ?? 0,
    short_relative_strength_score:
      asFiniteNumber(row.short_relative_strength_score) ?? 0,
    long_directional_consistency_score:
      asFiniteNumber(row.long_directional_consistency_score) ?? 0,
    short_directional_consistency_score:
      asFiniteNumber(row.short_directional_consistency_score) ?? 0,
    long_vwap_alignment_score:
      asFiniteNumber(row.long_vwap_alignment_score) ?? 0,
    short_vwap_alignment_score:
      asFiniteNumber(row.short_vwap_alignment_score) ?? 0,
    pulse_trend_strength: asFiniteNumber(row.pulse_trend_strength) ?? 0,
    today_cum_volume: asFiniteNumber(row.today_cum_volume) ?? 0,
    avg_20d_cum_volume_same_time:
      asFiniteNumber(row.avg_20d_cum_volume_same_time) ?? 0,
    intraday_range_abs: asFiniteNumber(row.intraday_range_abs) ?? 0,
    intraday_range_pct: asFiniteNumber(row.intraday_range_pct) ?? 0,
    avg_20d_range_same_time_abs:
      asFiniteNumber(row.avg_20d_range_same_time_abs) ?? 0,
    avg_20d_range_pct_same_time:
      asFiniteNumber(row.avg_20d_range_pct_same_time) ?? 0,
    score_history: asNumberArray(row.score_history),
    score_change_5m: asFiniteNumber(row.score_change_5m) ?? 0,
    score_change_10m: asFiniteNumber(row.score_change_10m) ?? 0,
    score_change_15m: asFiniteNumber(row.score_change_15m) ?? 0,
    score_slope: asFiniteNumber(row.score_slope) ?? 0,
    score_acceleration: asFiniteNumber(row.score_acceleration) ?? 0,
    improving_streak: asFiniteNumber(row.improving_streak) ?? 0,
    weakening_streak: asFiniteNumber(row.weakening_streak) ?? 0,
    pulse_trend_label: asTrendLabel(row.pulse_trend_label),
    vwap: asFiniteNumber(row.vwap) ?? 0,
    distance_from_vwap_pct: asFiniteNumber(row.distance_from_vwap_pct) ?? 0,
    behavior_state: behaviorState,
    score_time_bucket: scoreTimeBucket,
    time_context_bucket: timeContextBucket,
    is_extended: isExtended,
    warning_flags: asStringArray(row.warning_flags),
    volume_surge: asOptionalBoolean(row.volume_surge) ?? false,
    range_expansion: asOptionalBoolean(row.range_expansion) ?? false,
    index_outperformer: asOptionalBoolean(row.index_outperformer) ?? false,
    trend_consistent: asOptionalBoolean(row.trend_consistent) ?? false,
    improving_now: asOptionalBoolean(row.improving_now) ?? false,
  };
}

function normalizeMomentumPulseEnvelope(
  payload: unknown,
  query: MomentumPulseQuery,
): MomentumPulseResponse {
  if (!payload || typeof payload !== "object") {
    return createEmptyMomentumPulseResponse(query);
  }

  const data = payload as Record<string, unknown>;
  const rawStocks = Array.isArray(data.stocks)
    ? data.stocks
    : Array.isArray(data.data)
      ? data.data
      : [];

  const stocks = rawStocks
    .map((row, index) => normalizeMomentumPulseRow(row, index + 1))
    .filter((row): row is MomentumPulseRow => row !== null);

  return {
    stocks,
    total: asFiniteNumber(data.total) ?? stocks.length,
    last_updated: asOptionalString(data.last_updated) ?? "",
    direction: asDirectionFilter(data.direction, query.direction),
    include_veryweak:
      asOptionalBoolean(data.include_veryweak) ?? query.includeVeryWeak,
    benchmark_change_pct: asFiniteNumber(data.benchmark_change_pct) ?? 0,
  };
}

export async function fetchMomentumPulseData(
  query: MomentumPulseQuery,
  signal?: AbortSignal,
): Promise<MomentumPulseResponse> {
  const params = new URLSearchParams({
    limit: String(query.limit),
    direction: query.direction,
    include_veryweak: String(query.includeVeryWeak),
  });

  const response = await apiFetch(`/momentum-pulse?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load /momentum-pulse (${response.status})`);
  }

  const payload = await response.json();
  return normalizeMomentumPulseEnvelope(payload, query);
}
