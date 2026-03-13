export type SequenceSignalStatus = "ready" | "error";

export type SequenceSignalQueryTimeframe = "ALL" | "3m" | "5m" | "15m";

export type SequenceSignalQuerySide = "ALL" | "BUY" | "SELL";

export type SequenceSignalQueryType = "ALL" | "C2" | "C3" | "MTF";

export type SequenceSignalFilterTimeframe = "ALL" | "3M" | "5M" | "15M";

export type SequenceSignalFilterSide = "ALL" | "BUY" | "SELL";

export type SequenceSignalFilterType = "ALL" | "C2" | "C3" | "MTF";

export type SequenceSignalRowTimeframe = "3m" | "5m" | "15m";

export type SequenceSignalRowSide = "BUY" | "SELL";

export type SequenceSignalRowType = "C2" | "C3" | "MTF";

export interface SequenceSignalsFilters {
  timeframe: SequenceSignalFilterTimeframe;
  side: SequenceSignalFilterSide;
  signal_type: SequenceSignalFilterType;
  limit: number;
}

export interface SequenceSignalsSummary {
  total: number;
  timeframes: {
    "3m": number;
    "5m": number;
    "15m": number;
  };
  signal_types: {
    C2: number;
    C3: number;
    MTF: number;
  };
  sides: {
    BUY: number;
    SELL: number;
  };
}

export interface SequenceSignalRow {
  symbol: string;
  timeframe: SequenceSignalRowTimeframe;
  side: SequenceSignalRowSide;
  signal_type: SequenceSignalRowType;
  signal: string;
  signal_time: string;
  signal_timestamp: string;
  price: number;
  ob_score: number;
  ob_score_text: string;
  ob_score_label: string;
  mtf_label?: string;
  source: "yfinance" | string;
  rank: number;
}

export interface SequenceSignalsResponse {
  status: SequenceSignalStatus;
  message: string;
  source: string;
  session_date: string;
  market_data_last_updated: string;
  last_updated: string;
  filters: SequenceSignalsFilters;
  summary: SequenceSignalsSummary;
  signals: SequenceSignalRow[];
}

export interface SequenceSignalsQuery {
  limit: number;
  timeframe: SequenceSignalQueryTimeframe;
  side: SequenceSignalQuerySide;
  signal_type: SequenceSignalQueryType;
  session_date?: string;
}

export function createEmptySequenceSignalsResponse(
  query: SequenceSignalsQuery,
): SequenceSignalsResponse {
  return {
    status: "ready",
    message: "",
    source: "yfinance",
    session_date: query.session_date ?? "",
    market_data_last_updated: "",
    last_updated: "",
    filters: {
      timeframe: query.timeframe === "ALL" ? "ALL" : query.timeframe.toUpperCase() as SequenceSignalFilterTimeframe,
      side: query.side,
      signal_type: query.signal_type,
      limit: query.limit,
    },
    summary: {
      total: 0,
      timeframes: { "3m": 0, "5m": 0, "15m": 0 },
      signal_types: { C2: 0, C3: 0, MTF: 0 },
      sides: { BUY: 0, SELL: 0 },
    },
    signals: [],
  };
}