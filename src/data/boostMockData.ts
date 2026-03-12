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
  sector: string;
  ltp: number;
  change_pct: number;
  fo: boolean;
  boost_score: number;     // 0–5 scale
  boost_direction?: BoostDirection;
  institutional_hint_score?: number;
  boost_components?: BoostComponents;
  vol_surge: number;       // volume ratio
  range_ratio: number;     // intraday range expansion vs avg
  near_20d_high: boolean;
  near_20d_low: boolean;
  vwap_pct: number;        // % deviation from VWAP
}

export interface BoostData {
  stocks: BoostStock[];
  last_updated: string;
}

export const boostMockData: BoostData = {
  stocks: [
    { symbol: "TIINDIA",    sector: "AUTO",              ltp: 2849, change_pct:  3.47, fo: true,  boost_score: 4.2, boost_direction: "up", institutional_hint_score: 74, boost_components: { relative_volume_burst: 84, price_velocity_burst: 77, range_expansion_quality: 71, directional_efficiency: 79, institutional_hint: 74, confidence: 82, data_mode: "intraday", details: "Broad-based demand with clean VWAP hold", daily_context: "Opening range continuation" }, vol_surge: 3.2, range_ratio: 2.1, near_20d_high: true,  near_20d_low: false, vwap_pct:  1.2 },
    { symbol: "MUTHOOTFIN", sector: "BANKING & FINANCE", ltp: 1840, change_pct:  3.50, fo: true,  boost_score: 3.9, boost_direction: "up", institutional_hint_score: 68, boost_components: { relative_volume_burst: 79, price_velocity_burst: 72, range_expansion_quality: 66, directional_efficiency: 70, institutional_hint: 68, confidence: 76, data_mode: "intraday", details: "Steady accumulation pattern", daily_context: "Sector leadership confirmation" }, vol_surge: 3.1, range_ratio: 1.9, near_20d_high: true,  near_20d_low: false, vwap_pct:  0.8 },
    { symbol: "KEI",        sector: "INFRA",             ltp: 3800, change_pct:  2.50, fo: true,  boost_score: 3.7, vol_surge: 3.4, range_ratio: 1.7, near_20d_high: true,  near_20d_low: false, vwap_pct:  1.5 },
    { symbol: "NATIONALUM", sector: "METALS",            ltp:  363, change_pct:  2.40, fo: true,  boost_score: 3.6, vol_surge: 2.8, range_ratio: 2.3, near_20d_high: false, near_20d_low: false, vwap_pct:  0.6 },
    { symbol: "MCX",        sector: "BANKING & FINANCE", ltp: 6200, change_pct:  2.60, fo: true,  boost_score: 3.5, vol_surge: 2.3, range_ratio: 1.8, near_20d_high: true,  near_20d_low: false, vwap_pct:  0.9 },
    { symbol: "BEL",        sector: "PSU & DEFENCE",     ltp:  290, change_pct:  2.10, fo: true,  boost_score: 3.2, vol_surge: 2.6, range_ratio: 1.6, near_20d_high: false, near_20d_low: false, vwap_pct:  0.4 },
    { symbol: "PERSISTENT", sector: "IT",                ltp: 5200, change_pct: -1.10, fo: true,  boost_score: 2.9, boost_direction: "down", institutional_hint_score: 41, vol_surge: 2.5, range_ratio: 1.4, near_20d_high: false, near_20d_low: false, vwap_pct: -0.7 },
    { symbol: "HINDZINC",   sector: "METALS",            ltp:  490, change_pct:  2.30, fo: true,  boost_score: 2.8, vol_surge: 1.8, range_ratio: 1.5, near_20d_high: false, near_20d_low: false, vwap_pct:  0.3 },
    { symbol: "CLEAN",      sector: "CHEMICALS",         ltp: 1850, change_pct:  1.00, fo: false, boost_score: 2.6, vol_surge: 2.2, range_ratio: 1.3, near_20d_high: false, near_20d_low: false, vwap_pct:  0.2 },
    { symbol: "LAURUSLABS", sector: "PHARMA",            ltp:  580, change_pct: -0.80, fo: true,  boost_score: 2.5, vol_surge: 1.9, range_ratio: 1.2, near_20d_high: false, near_20d_low: false, vwap_pct: -0.5 },
    { symbol: "SUNPHARMA",  sector: "PHARMA",            ltp: 1720, change_pct:  1.00, fo: true,  boost_score: 2.3, vol_surge: 1.6, range_ratio: 1.1, near_20d_high: false, near_20d_low: false, vwap_pct:  0.1 },
    { symbol: "HAL",        sector: "PSU & DEFENCE",     ltp: 4200, change_pct:  1.10, fo: true,  boost_score: 2.1, vol_surge: 1.5, range_ratio: 1.0, near_20d_high: false, near_20d_low: false, vwap_pct:  0.2 },
    { symbol: "ONGC",       sector: "ENERGY",            ltp:  260, change_pct:  0.90, fo: true,  boost_score: 1.9, vol_surge: 1.7, range_ratio: 0.9, near_20d_high: false, near_20d_low: false, vwap_pct: -0.3 },
    { symbol: "ITC",        sector: "FMCG",              ltp:  450, change_pct:  0.30, fo: true,  boost_score: 1.5, boost_direction: "flat", institutional_hint_score: 33, vol_surge: 1.2, range_ratio: 0.8, near_20d_high: false, near_20d_low: false, vwap_pct:  0.0 },
    { symbol: "IRCTC",      sector: "INFRA",             ltp:  890, change_pct:  0.10, fo: true,  boost_score: 1.2, vol_surge: 0.9, range_ratio: 0.7, near_20d_high: false, near_20d_low: false, vwap_pct: -0.1 },
    { symbol: "TATASTEEL",  sector: "METALS",            ltp:  150, change_pct: -0.60, fo: true,  boost_score: 1.0, vol_surge: 1.1, range_ratio: 0.9, near_20d_high: false, near_20d_low: true,  vwap_pct: -0.8 },
    { symbol: "RBLBANK",    sector: "BANKING & FINANCE", ltp:  240, change_pct: -2.00, fo: true,  boost_score: 0.8, vol_surge: 3.5, range_ratio: 2.4, near_20d_high: false, near_20d_low: true,  vwap_pct: -1.5 },
    { symbol: "SWIGGY",     sector: "FMCG",              ltp:  420, change_pct: -4.20, fo: false, boost_score: 0.5, vol_surge: 4.1, range_ratio: 3.1, near_20d_high: false, near_20d_low: true,  vwap_pct: -2.1 },
    { symbol: "RVNL",       sector: "REALTY",            ltp:  380, change_pct: -5.10, fo: true,  boost_score: 0.3, vol_surge: 3.8, range_ratio: 2.8, near_20d_high: false, near_20d_low: true,  vwap_pct: -2.8 },
  ],
  last_updated: "14:35:22",
};
