export type BoostDirection = "up" | "down" | "flat";

export interface BoostComponents {
  relative_volume_burst?: number;
  price_velocity_burst?: number;
  range_expansion_quality?: number;
  directional_efficiency?: number;
  institutional_hint?: number;
  confidence?: number;
  data_mode?: string;
  details?: string | Record<string, unknown>;
  daily_context?: string | Record<string, unknown>;
}

export interface BoostStock {
  symbol: string;
  ltp?: number;
  change_pct?: number;
  volume_ratio?: number;
  fo?: boolean;
  day_high?: number;
  day_low?: number;
  day_open?: number;
  vwap?: number;
  quote_source?: string;
  delivery_source?: string;
  delivery_pct?: number;
  bid_ask_ratio?: number;
  bid_qty?: number;
  ask_qty?: number;
  boost_score?: number;     // 0–5 scale
  boost_direction?: BoostDirection;
  institutional_hint_score?: number;
  boost_components?: BoostComponents;
}

export interface BoostData {
  stocks: BoostStock[];
  total: number;
  last_updated: string;
  status?: "ready" | "warming_up";
  message?: string;
}

export const boostMockData: BoostData = {
  stocks: [
    { symbol: "TIINDIA", ltp: 2849, change_pct: 3.47, volume_ratio: 3.2, fo: true, day_high: 2866, day_low: 2782, day_open: 2794, vwap: 2814, quote_source: "nse_quote", delivery_source: "bhavcopy", delivery_pct: 61.2, bid_ask_ratio: 1.6, bid_qty: 184320, ask_qty: 115040, boost_score: 4.2, boost_direction: "up", institutional_hint_score: 74, boost_components: { relative_volume_burst: 84, price_velocity_burst: 77, range_expansion_quality: 71, directional_efficiency: 79, institutional_hint: 74, confidence: 82, data_mode: "intraday", details: { note: "Broad-based demand with clean VWAP hold" }, daily_context: { setup: "Opening range continuation" } } },
    { symbol: "MUTHOOTFIN", ltp: 1840, change_pct: 3.5, volume_ratio: 3.1, fo: true, day_high: 1859, day_low: 1788, day_open: 1796, vwap: 1818, quote_source: "nse_quote", delivery_source: "bhavcopy", delivery_pct: 58.7, bid_ask_ratio: 1.4, bid_qty: 133120, ask_qty: 94720, boost_score: 3.9, boost_direction: "up", institutional_hint_score: 68, boost_components: { relative_volume_burst: 79, price_velocity_burst: 72, range_expansion_quality: 66, directional_efficiency: 70, institutional_hint: 68, confidence: 76, data_mode: "intraday", details: { note: "Steady accumulation pattern" }, daily_context: { setup: "Sector leadership confirmation" } } },
    { symbol: "PERSISTENT", ltp: 5200, change_pct: -1.1, volume_ratio: 2.5, fo: true, day_high: 5288, day_low: 5174, day_open: 5266, vwap: 5231, quote_source: "nse_quote", bid_ask_ratio: 0.82, bid_qty: 28160, ask_qty: 34320, boost_score: 2.9, boost_direction: "down", institutional_hint_score: 41 },
    { symbol: "ITC", ltp: 450, change_pct: 0.3, volume_ratio: 1.2, fo: true, day_high: 452.8, day_low: 447.9, day_open: 448.4, vwap: 449.7, quote_source: "nse_quote", boost_score: 1.5, boost_direction: "flat", institutional_hint_score: 33 },
  ],
  total: 4,
  last_updated: "14:35:22",
};
