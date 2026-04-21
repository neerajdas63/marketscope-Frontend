export type MomentumPulseStrategyDirectionFilter = "ALL" | "LONG" | "SHORT";

export type MomentumPulseStrategyTradeSide = "LONG" | "SHORT" | "NO_TRADE";

export type MomentumPulseStrategyGrade =
  | "A_PLUS"
  | "A"
  | "FAILED_OR_CHOP"
  | "NO_TRADE";

export type MomentumPulseStrategyGradeFilter =
  | "ALL"
  | MomentumPulseStrategyGrade;

export type MomentumPulseStrategyLimit = 20 | 40 | 60 | 100;

export type MomentumPulseStrategyMode = "live";

export type KnownMomentumPulseStrategyEntryState =
  | "ENTER_NOW"
  | "ENTER_ON_RETEST"
  | "WAIT_CONFIRMATION"
  | "AVOID_CHASE"
  | "CANCEL_SETUP";

export type KnownMomentumPulseStrategyChaseRisk = "LOW" | "MEDIUM" | "HIGH";

export interface MomentumPulseStrategySummaryCommon {
  avg_score: number;
  avg_vwap_dist: number;
  avg_volume_ratio: number;
  avg_range_ratio: number;
}

export interface MomentumPulseStrategySummary {
  total: number;
  a_plus_count: number;
  a_count: number;
  failed_or_chop_count: number;
  no_trade_count: number;
  long_count: number;
  short_count: number;
  enter_now_count: number;
  enter_on_retest_count: number;
  avoid_count: number;
  avg_volume_ratio: number;
  avg_range_ratio: number;
  avg_execution_rank: number;
  avg_abs_change_pct: number;
  a_plus_common: MomentumPulseStrategySummaryCommon;
  a_common: MomentumPulseStrategySummaryCommon;
}

export interface MomentumPulseStrategyRow {
  symbol: string;
  trade_date: string;
  scan_time: string;
  trade_side: MomentumPulseStrategyTradeSide;
  grade: MomentumPulseStrategyGrade;
  entry_state: KnownMomentumPulseStrategyEntryState | string;
  execution_rank: number | null;
  eligible_time_window: boolean;
  score: number;
  momentum_pulse_score: number | null;
  grade_stability_score: number | null;
  chase_risk: KnownMomentumPulseStrategyChaseRisk | string;
  retest_ok: boolean | null;
  price_at_scan: number | null;
  prev_close: number | null;
  vwap: number | null;
  or_high: number | null;
  or_low: number | null;
  or_stretch_pct: number | null;
  vwap_distance_pct: number | null;
  volume_ratio: number | null;
  range_ratio: number | null;
  entry_price: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
  rr_t1: number | null;
  rr_t2: number | null;
  reasons: string[];
  major_risks: string[];
  grade_history: string[];
  warning_flags: string[];
  entry_notes: string[];
  stop_notes: string[];
  exit_notes: string[];
}

export interface MomentumPulseStrategyBestStocks {
  overall_best: MomentumPulseStrategyRow[];
  best_longs: MomentumPulseStrategyRow[];
  best_shorts: MomentumPulseStrategyRow[];
  avoid_list: MomentumPulseStrategyRow[];
}

export interface MomentumPulseStrategyQuery {
  limit: MomentumPulseStrategyLimit;
  direction: MomentumPulseStrategyDirectionFilter;
  grade: MomentumPulseStrategyGradeFilter;
}

export interface MomentumPulseStrategyResponse {
  feature: string;
  feature_key: string;
  mode: MomentumPulseStrategyMode | string;
  status: string;
  message: string;
  last_updated: string;
  market_data_last_updated: string;
  benchmark_change_pct: number;
  direction: MomentumPulseStrategyDirectionFilter;
  grade: MomentumPulseStrategyGradeFilter;
  rows: MomentumPulseStrategyRow[];
  total: number;
  total_candidates: number;
  summary: MomentumPulseStrategySummary;
  overall_summary: MomentumPulseStrategySummary;
  best_stocks: MomentumPulseStrategyBestStocks;
  available_directions: MomentumPulseStrategyDirectionFilter[];
  available_grades: MomentumPulseStrategyGradeFilter[];
}

export function createEmptyMomentumPulseStrategySummary(): MomentumPulseStrategySummary {
  return {
    total: 0,
    a_plus_count: 0,
    a_count: 0,
    failed_or_chop_count: 0,
    no_trade_count: 0,
    long_count: 0,
    short_count: 0,
    enter_now_count: 0,
    enter_on_retest_count: 0,
    avoid_count: 0,
    avg_volume_ratio: 0,
    avg_range_ratio: 0,
    avg_execution_rank: 0,
    avg_abs_change_pct: 0,
    a_plus_common: {
      avg_score: 0,
      avg_vwap_dist: 0,
      avg_volume_ratio: 0,
      avg_range_ratio: 0,
    },
    a_common: {
      avg_score: 0,
      avg_vwap_dist: 0,
      avg_volume_ratio: 0,
      avg_range_ratio: 0,
    },
  };
}

export function createEmptyMomentumPulseStrategyBestStocks(): MomentumPulseStrategyBestStocks {
  return {
    overall_best: [],
    best_longs: [],
    best_shorts: [],
    avoid_list: [],
  };
}

export function createEmptyMomentumPulseStrategyResponse(
  query: MomentumPulseStrategyQuery,
): MomentumPulseStrategyResponse {
  return {
    feature: "Momentum Pulse Strategy",
    feature_key: "momentum_pulse_strategy",
    mode: "live",
    status: "loading",
    message: "",
    last_updated: "",
    market_data_last_updated: "",
    benchmark_change_pct: 0,
    direction: query.direction,
    grade: query.grade,
    rows: [],
    total: 0,
    total_candidates: 0,
    summary: createEmptyMomentumPulseStrategySummary(),
    overall_summary: createEmptyMomentumPulseStrategySummary(),
    best_stocks: createEmptyMomentumPulseStrategyBestStocks(),
    available_directions: ["ALL", "LONG", "SHORT"],
    available_grades: ["ALL", "A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"],
  };
}
