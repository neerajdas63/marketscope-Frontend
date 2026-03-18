import { apiFetch } from "@/lib/api";
import {
  createEmptySequenceSignalsResponse,
  type SequenceSignalFilterSide,
  type SequenceSignalFilterTimeframe,
  type SequenceSignalFilterType,
  type SequenceSignalQuery,
  type SequenceSignalRow,
  type SequenceSignalRowSide,
  type SequenceSignalRowTimeframe,
  type SequenceSignalRowType,
  type SequenceSignalsFilters,
  type SequenceSignalsResponse,
  type SequenceSignalsSummary,
} from "@/data/sequenceSignalsData";

const VALID_QUERY_TIMEFRAMES = ["ALL", "3m", "5m", "15m"] as const;
const VALID_FILTER_TIMEFRAMES: SequenceSignalFilterTimeframe[] = ["ALL", "3M", "5M", "15M"];
const VALID_SIDES: SequenceSignalFilterSide[] = ["ALL", "BUY", "SELL"];
const VALID_TYPES: SequenceSignalFilterType[] = ["ALL", "C2", "C3", "MTF"];
const VALID_ROW_TIMEFRAMES: SequenceSignalRowTimeframe[] = ["3m", "5m", "15m"];
const VALID_ROW_SIDES: SequenceSignalRowSide[] = ["BUY", "SELL"];
const VALID_ROW_TYPES: SequenceSignalRowType[] = ["C2", "C3", "MTF"];

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

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asFilterTimeframe(value: unknown, fallback: SequenceSignalFilterTimeframe): SequenceSignalFilterTimeframe {
  return typeof value === "string" && VALID_FILTER_TIMEFRAMES.includes(value as SequenceSignalFilterTimeframe)
    ? (value as SequenceSignalFilterTimeframe)
    : fallback;
}

function asFilterSide(value: unknown, fallback: SequenceSignalFilterSide): SequenceSignalFilterSide {
  return typeof value === "string" && VALID_SIDES.includes(value as SequenceSignalFilterSide)
    ? (value as SequenceSignalFilterSide)
    : fallback;
}

function asFilterType(value: unknown, fallback: SequenceSignalFilterType): SequenceSignalFilterType {
  return typeof value === "string" && VALID_TYPES.includes(value as SequenceSignalFilterType)
    ? (value as SequenceSignalFilterType)
    : fallback;
}

function normalizeFilters(value: unknown, query: SequenceSignalQuery): SequenceSignalsFilters {
  if (!value || typeof value !== "object") {
    return createEmptySequenceSignalsResponse(query).filters;
  }

  const filters = value as Record<string, unknown>;
  return {
    timeframe: asFilterTimeframe(filters.timeframe, createEmptySequenceSignalsResponse(query).filters.timeframe),
    side: asFilterSide(filters.side, query.side),
    signal_type: asFilterType(filters.signal_type, query.signal_type),
    limit: asFiniteNumber(filters.limit) ?? query.limit,
  };
}

function normalizeSummary(value: unknown): SequenceSignalsSummary {
  const fallback: SequenceSignalsSummary = {
    total: 0,
    timeframes: { "3m": 0, "5m": 0, "15m": 0 },
    signal_types: { C2: 0, C3: 0, MTF: 0 },
    sides: { BUY: 0, SELL: 0 },
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const summary = value as Record<string, unknown>;
  const timeframes = summary.timeframes && typeof summary.timeframes === "object"
    ? summary.timeframes as Record<string, unknown>
    : {};
  const signalTypes = summary.signal_types && typeof summary.signal_types === "object"
    ? summary.signal_types as Record<string, unknown>
    : {};
  const sides = summary.sides && typeof summary.sides === "object"
    ? summary.sides as Record<string, unknown>
    : {};

  return {
    total: asFiniteNumber(summary.total) ?? 0,
    timeframes: {
      "3m": asFiniteNumber(timeframes["3m"]) ?? 0,
      "5m": asFiniteNumber(timeframes["5m"]) ?? 0,
      "15m": asFiniteNumber(timeframes["15m"]) ?? 0,
    },
    signal_types: {
      C2: asFiniteNumber(signalTypes.C2) ?? 0,
      C3: asFiniteNumber(signalTypes.C3) ?? 0,
      MTF: asFiniteNumber(signalTypes.MTF) ?? 0,
    },
    sides: {
      BUY: asFiniteNumber(sides.BUY) ?? 0,
      SELL: asFiniteNumber(sides.SELL) ?? 0,
    },
  };
}

function normalizeSignalRow(value: unknown, fallbackRank: number): SequenceSignalRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const symbol = asOptionalString(row.symbol);
  const timeframe = asOptionalString(row.timeframe);
  const side = asOptionalString(row.side);
  const signalType = asOptionalString(row.signal_type);
  const signal = asOptionalString(row.signal);
  const signalTime = asOptionalString(row.signal_time);
  const signalTimestamp = asOptionalString(row.signal_timestamp);
  const price = asFiniteNumber(row.price);
  const obScore = asFiniteNumber(row.ob_score);

  if (
    !symbol ||
    !timeframe ||
    !side ||
    !signalType ||
    !signal ||
    !signalTime ||
    !signalTimestamp ||
    price === undefined ||
    obScore === undefined ||
    !VALID_ROW_TIMEFRAMES.includes(timeframe as SequenceSignalRowTimeframe) ||
    !VALID_ROW_SIDES.includes(side as SequenceSignalRowSide) ||
    !VALID_ROW_TYPES.includes(signalType as SequenceSignalRowType)
  ) {
    return null;
  }

  return {
    symbol,
    timeframe: timeframe as SequenceSignalRowTimeframe,
    side: side as SequenceSignalRowSide,
    signal_type: signalType as SequenceSignalRowType,
    signal,
    signal_time: signalTime,
    signal_timestamp: signalTimestamp,
    price,
    ob_score: obScore,
    ob_score_text: asOptionalString(row.ob_score_text) ?? `${obScore}/6`,
    ob_score_label: asOptionalString(row.ob_score_label) ?? "OB Score",
    mtf_label: asOptionalString(row.mtf_label) ?? "",
    source: asOptionalString(row.source) ?? "yfinance",
    rank: asFiniteNumber(row.rank) ?? fallbackRank,
  };
}

function normalizeSequenceSignalsResponse(payload: unknown, query: SequenceSignalQuery): SequenceSignalsResponse {
  if (!payload || typeof payload !== "object") {
    return createEmptySequenceSignalsResponse(query);
  }

  const data = payload as Record<string, unknown>;
  const rawSignals = Array.isArray(data.signals) ? data.signals : [];
  const signals = rawSignals
    .map((row, index) => normalizeSignalRow(row, index + 1))
    .filter((row): row is SequenceSignalRow => row !== null);

  return {
    status: asOptionalString(data.status) === "error" ? "error" : "ready",
    message: asOptionalString(data.message) ?? "",
    source: asOptionalString(data.source) ?? "yfinance",
    session_date: asOptionalString(data.session_date) ?? query.session_date ?? "",
    market_data_last_updated: asOptionalString(data.market_data_last_updated) ?? "",
    last_updated: asOptionalString(data.last_updated) ?? "",
    filters: normalizeFilters(data.filters, query),
    summary: normalizeSummary(data.summary),
    signals,
  };
}

export async function fetchSequenceSignalsData(
  query: SequenceSignalQuery,
  signal?: AbortSignal,
): Promise<SequenceSignalsResponse> {
  const params = new URLSearchParams({
    limit: String(query.limit),
    timeframe: VALID_QUERY_TIMEFRAMES.includes(query.timeframe) ? query.timeframe : "ALL",
    side: query.side,
    signal_type: query.signal_type,
  });

  if (query.session_date) {
    params.set("session_date", query.session_date);
  }

  const response = await apiFetch(`/sequence-signals?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load /sequence-signals (${response.status})`);
  }

  const payload = await response.json();
  return normalizeSequenceSignalsResponse(payload, query);
}