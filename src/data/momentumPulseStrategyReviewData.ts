import type {
  MomentumPulseStrategyGrade,
  MomentumPulseStrategyTradeSide,
} from "@/data/momentumPulseStrategyData";

export type MomentumPulseStrategyReviewMode = "review";

export type KnownMomentumPulseStrategyReviewStatus =
  | "final"
  | "provisional"
  | "empty";

export type KnownMomentumPulseStrategyReviewOutcome =
  | "WIN"
  | "LOSS"
  | "OPEN"
  | "FLAT"
  | "NO_DATA";

export type MomentumPulseStrategyReviewOutcomeFilter =
  | "ALL"
  | KnownMomentumPulseStrategyReviewOutcome
  | string;

export interface MomentumPulseStrategyReviewReasonStat {
  label: string;
  count: number | null;
}

export interface MomentumPulseStrategyReviewSummary {
  total_signals: number;
  win_count: number;
  loss_count: number;
  open_count: number;
  no_data_count: number;
  win_rate_pct: number;
  avg_execution_rank: number;
  top_win_reasons: MomentumPulseStrategyReviewReasonStat[];
  top_loss_reasons: MomentumPulseStrategyReviewReasonStat[];
}

export interface MomentumPulseStrategyReviewRow {
  symbol: string;
  trade_date: string;
  signal_bar_time: string;
  trade_side: MomentumPulseStrategyTradeSide;
  grade: MomentumPulseStrategyGrade;
  entry_state: string;
  outcome: KnownMomentumPulseStrategyReviewOutcome | string;
  outcome_event: string;
  outcome_reason: string;
  win_loss_reason_codes: string[];
  entry_price: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
  exit_price: number | null;
  exit_time: string;
  max_favorable_pct: number | null;
  max_adverse_pct: number | null;
  close_pnl_pct: number | null;
  execution_rank: number | null;
  score: number | null;
  momentum_pulse_score: number | null;
  volume_ratio: number | null;
  range_ratio: number | null;
  vwap_distance_pct: number | null;
  chase_risk: string;
  retest_ok: boolean | null;
  major_risks: string[];
  reversal_flags: string[];
  reasons: string[];
}

export interface MomentumPulseStrategyReviewQuery {
  date?: string;
  days: number;
  limit: number;
}

export interface MomentumPulseStrategyReviewResponse {
  feature: string;
  feature_key: string;
  mode: MomentumPulseStrategyReviewMode | string;
  status: KnownMomentumPulseStrategyReviewStatus | string;
  message: string;
  dates: string[];
  rows: MomentumPulseStrategyReviewRow[];
  total: number;
  summary: MomentumPulseStrategyReviewSummary;
  available_outcomes: (KnownMomentumPulseStrategyReviewOutcome | string)[];
}

export function createEmptyMomentumPulseStrategyReviewSummary(): MomentumPulseStrategyReviewSummary {
  return {
    total_signals: 0,
    win_count: 0,
    loss_count: 0,
    open_count: 0,
    no_data_count: 0,
    win_rate_pct: 0,
    avg_execution_rank: 0,
    top_win_reasons: [],
    top_loss_reasons: [],
  };
}

export function createEmptyMomentumPulseStrategyReviewResponse(
  query: MomentumPulseStrategyReviewQuery,
): MomentumPulseStrategyReviewResponse {
  return {
    feature: "Momentum Pulse Strategy Review",
    feature_key: "momentum_pulse_strategy_review",
    mode: "review",
    status: "empty",
    message: "",
    dates: query.date ? [query.date] : [],
    rows: [],
    total: 0,
    summary: createEmptyMomentumPulseStrategyReviewSummary(),
    available_outcomes: ["WIN", "LOSS", "OPEN", "FLAT", "NO_DATA"],
  };
}
