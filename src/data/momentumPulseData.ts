export type MomentumPulseDirection = "LONG" | "SHORT" | "NEUTRAL";

export type MomentumPulseDirectionFilter = "ALL" | MomentumPulseDirection;

export type MomentumPulseTier = "strong" | "moderate" | "weak" | "veryweak";

export type MomentumPulseTrendLabel = "Rising" | "Flat" | "Falling";

export type MomentumPulseBehaviorState =
  | "EARLY"
  | "ACTIVE"
  | "LATE"
  | "EXTENDED";

export type MomentumPulseTimeContextBucket =
  | "DISCOVERY"
  | "TREND"
  | "LATE"
  | "--";

export interface MomentumPulseRow {
  symbol: string;
  ltp: number;
  change_pct: number;
  direction: MomentumPulseDirection;
  direction_confidence: number;
  momentum_pulse_score: number;
  tier: MomentumPulseTier;
  rank: number;
  volume_pace_score: number;
  volume_pace_ratio: number;
  range_expansion_score: number;
  range_expansion_ratio: number;
  relative_strength: number;
  long_relative_strength_score: number;
  short_relative_strength_score: number;
  long_directional_consistency_score: number;
  short_directional_consistency_score: number;
  long_vwap_alignment_score: number;
  short_vwap_alignment_score: number;
  pulse_trend_strength: number;
  today_cum_volume: number;
  avg_20d_cum_volume_same_time: number;
  intraday_range_abs: number;
  intraday_range_pct: number;
  avg_20d_range_same_time_abs: number;
  avg_20d_range_pct_same_time: number;
  score_history: number[];
  score_change_5m: number;
  score_change_10m: number;
  score_change_15m: number;
  score_slope: number;
  score_acceleration: number;
  improving_streak: number;
  weakening_streak: number;
  pulse_trend_label: MomentumPulseTrendLabel;
  vwap: number;
  distance_from_vwap_pct: number;
  behavior_state: MomentumPulseBehaviorState;
  score_time_bucket: string;
  time_context_bucket: MomentumPulseTimeContextBucket | string;
  is_extended: boolean;
  warning_flags: string[];
  volume_surge: boolean;
  range_expansion: boolean;
  index_outperformer: boolean;
  trend_consistent: boolean;
  improving_now: boolean;
}

export interface MomentumPulseResponse {
  stocks: MomentumPulseRow[];
  total: number;
  last_updated: string;
  direction: MomentumPulseDirectionFilter;
  include_veryweak: boolean;
  benchmark_change_pct: number;
}

export interface MomentumPulseQuery {
  limit: 20 | 40 | 60 | 100;
  direction: MomentumPulseDirectionFilter;
  includeVeryWeak: boolean;
}

export function createEmptyMomentumPulseResponse(
  query: MomentumPulseQuery,
): MomentumPulseResponse {
  return {
    stocks: [],
    total: 0,
    last_updated: "",
    direction: query.direction,
    include_veryweak: query.includeVeryWeak,
    benchmark_change_pct: 0,
  };
}
