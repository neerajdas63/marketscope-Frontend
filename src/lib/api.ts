import type { BreakoutLevel, InferredDirection, InsightValue, SetupStage } from "@/data/mockData";
import type { RFactorData, RFactorStock } from "@/data/rfactorMockData";

function readApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim();
}

export function getApiBaseUrlValidationError(baseUrl = readApiBaseUrl()) {
  if (!baseUrl) {
    return "VITE_API_BASE_URL is missing. Set it to your backend origin, for example https://marketscope-backend1.onrender.com.";
  }

  try {
    const parsedUrl = new URL(baseUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "VITE_API_BASE_URL must start with http:// or https://.";
    }

    return null;
  } catch {
    return "VITE_API_BASE_URL must be a valid absolute URL.";
  }
}

export function getApiBaseUrl() {
  const validationError = getApiBaseUrlValidationError();

  if (validationError) {
    throw new Error(validationError);
  }

  return readApiBaseUrl()!.replace(/\/$/, "");
}

export const API_BASE_URL = readApiBaseUrl()?.replace(/\/$/, "") ?? "";

export function buildApiUrl(baseUrl: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

export function apiUrl(path: string) {
  return buildApiUrl(getApiBaseUrl(), path);
}

export type RFactorSortBy = "rfactor" | "opportunity" | "trend" | "pre_score" | "trigger_score" | "direction_conf";

const VALID_SETUP_STAGES: SetupStage[] = ["WARMING", "PRE_SIGNAL", "BREAKING", "CONFIRMED", "EXTENDED", "NEUTRAL"];

const LEGACY_STAGE_ALIASES: Record<string, SetupStage> = {
  Building: "WARMING",
  Triggering: "BREAKING",
  Extended: "EXTENDED",
  Neutral: "NEUTRAL",
};

const VALID_DIRECTIONS: InferredDirection[] = ["LONG", "SHORT", "NEUTRAL"];

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

function asOptionalNumber(value: unknown) {
  return asFiniteNumber(value);
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

function asSetupStage(value: unknown): SetupStage | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = LEGACY_STAGE_ALIASES[value] ?? value;

  return VALID_SETUP_STAGES.includes(normalized as SetupStage)
    ? (normalized as SetupStage)
    : undefined;
}

function asOptionalDirection(value: unknown): InferredDirection | undefined {
  return typeof value === "string" && VALID_DIRECTIONS.includes(value as InferredDirection)
    ? (value as InferredDirection)
    : undefined;
}

function asOptionalBreakoutLevel(value: unknown): BreakoutLevel | undefined {
  const numericValue = asFiniteNumber(value);
  if (numericValue !== undefined) {
    return numericValue;
  }

  return asOptionalString(value);
}

function asOptionalInsightValue(value: unknown): InsightValue | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  const numericValue = asFiniteNumber(value);
  if (numericValue !== undefined) {
    return numericValue;
  }

  return asOptionalString(value);
}

function asTrendPoints(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const points = value
    .map((point) => asFiniteNumber(point))
    .filter((point): point is number => point !== undefined);

  return points.length > 0 ? points : undefined;
}

function asBreakoutLevels(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const levels = value
    .map((level) => asOptionalBreakoutLevel(level))
    .filter((level): level is BreakoutLevel => level !== undefined);

  return levels.length > 0 ? levels : undefined;
}

function normalizeRFactorStock(value: unknown): RFactorStock | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const stock = value as Record<string, unknown>;
  const symbol = asOptionalString(stock.symbol);
  const sector = asOptionalString(stock.sector) ?? "Unknown";
  const ltp = asFiniteNumber(stock.ltp);
  const changePct = asFiniteNumber(stock.change_pct);
  const volumeRatio = asFiniteNumber(stock.volume_ratio);
  const rfactor = asFiniteNumber(stock.rfactor);
  const rsi = asFiniteNumber(stock.rsi);
  const mfi = asFiniteNumber(stock.mfi);
  const relativeStrength = asFiniteNumber(stock.relative_strength);
  const fo = asOptionalBoolean(stock.fo) ?? false;

  if (
    !symbol ||
    ltp === undefined ||
    changePct === undefined ||
    volumeRatio === undefined ||
    rfactor === undefined ||
    rsi === undefined ||
    mfi === undefined ||
    relativeStrength === undefined
  ) {
    return null;
  }

  return {
    symbol,
    sector,
    ltp,
    change_pct: changePct,
    volume_ratio: volumeRatio,
    rfactor,
    rsi,
    mfi,
    relative_strength: relativeStrength,
    fo,
    delivery_pct: asOptionalNumber(stock.delivery_pct),
    bid_ask_ratio: asOptionalNumber(stock.bid_ask_ratio),
    oi_change_pct: asOptionalNumber(stock.oi_change_pct),
    tier: asOptionalString(stock.tier),
    opportunity_score: asOptionalNumber(stock.opportunity_score),
    rfactor_trend_15m: asOptionalNumber(stock.rfactor_trend_15m),
    rfactor_trend_acceleration: asOptionalNumber(stock.rfactor_trend_acceleration),
    rfactor_trend_points: asTrendPoints(stock.rfactor_trend_points),
    setup_stage: asSetupStage(stock.setup_stage),
    pre_score: asOptionalNumber(stock.pre_score) ?? asOptionalNumber(stock.prescore),
    prescore: asOptionalNumber(stock.prescore),
    trigger_score: asOptionalNumber(stock.trigger_score) ?? asOptionalNumber(stock.triggerscore),
    triggerscore: asOptionalNumber(stock.triggerscore),
    alert_stage: asOptionalString(stock.alert_stage) ?? asOptionalString(stock.alertstage) ?? asOptionalString(stock.setup_stage),
    alertstage: asOptionalString(stock.alertstage),
    inferred_direction: asOptionalDirection(stock.inferred_direction),
    direction_conf: asOptionalNumber(stock.direction_conf),
    compression: asOptionalNumber(stock.compression),
    obv_slope_score: asOptionalNumber(stock.obv_slope_score),
    vol_accel: asOptionalNumber(stock.vol_accel),
    rsi_slope_5m: asOptionalNumber(stock.rsi_slope_5m),
    nearest_level: asOptionalBreakoutLevel(stock.nearest_level),
    proximity_score: asOptionalNumber(stock.proximity_score),
    dist_pct: asOptionalNumber(stock.dist_pct),
    breakout_levels: asBreakoutLevels(stock.breakout_levels),
    breakout_quality: asOptionalInsightValue(stock.breakout_quality),
    vwap_acceptance: asOptionalInsightValue(stock.vwap_acceptance),
    is_chase: asOptionalBoolean(stock.is_chase) ?? asOptionalBoolean(stock.ischase),
    ischase: asOptionalBoolean(stock.ischase),
    chase_reason: asOptionalString(stock.chase_reason) ?? asOptionalString(stock.chasereason),
    chasereason: asOptionalString(stock.chasereason),
  };
}

function getRFactorStocksEnvelope(payload: unknown) {
  if (Array.isArray(payload)) {
    return { stocks: payload, lastUpdated: undefined };
  }

  if (!payload || typeof payload !== "object") {
    return { stocks: [], lastUpdated: undefined };
  }

  const data = payload as Record<string, unknown>;

  if (Array.isArray(data.stocks)) {
    return { stocks: data.stocks, lastUpdated: asOptionalString(data.last_updated) };
  }

  if (Array.isArray(data.data)) {
    return { stocks: data.data, lastUpdated: asOptionalString(data.last_updated) };
  }

  return { stocks: [], lastUpdated: asOptionalString(data.last_updated) };
}

export async function fetchRFactorData(sortBy: RFactorSortBy, signal?: AbortSignal): Promise<RFactorData | null> {
  const response = await fetch(apiUrl(`/rfactor?sort_by=${sortBy}`), { signal });

  if (!response.ok) {
    throw new Error(`Failed to load /rfactor (${response.status})`);
  }

  const payload = await response.json();
  const { stocks, lastUpdated } = getRFactorStocksEnvelope(payload);
  const normalizedStocks = stocks
    .map((stock) => normalizeRFactorStock(stock))
    .filter((stock): stock is RFactorStock => stock !== null);

  if (normalizedStocks.length === 0 && stocks.length > 0) {
    return null;
  }

  return {
    stocks: normalizedStocks,
    last_updated:
      lastUpdated ??
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
  };
}