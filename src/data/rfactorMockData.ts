import type { StockInsightFields } from "./mockData";

export interface RFactorStock extends StockInsightFields {
  symbol: string;
  sector: string;
  ltp: number;
  change_pct: number;
  volume_ratio: number;
  rfactor: number;
  rsi: number;
  mfi: number;
  relative_strength: number;
  fo: boolean;
  delivery_pct?: number;
  bid_ask_ratio?: number;
  oi_change_pct?: number;
}

export interface RFactorData {
  stocks: RFactorStock[];
  last_updated: string;
}

const baseRFactorStocks: RFactorStock[] = [
  {
    symbol: "TIINDIA",
    sector: "AUTO",
    ltp: 2849,
    change_pct: 3.47,
    volume_ratio: 2.1,
    rfactor: 78.5,
    rsi: 64.2,
    mfi: 61.8,
    relative_strength: 5.67,
    fo: true,
    rfactor_trend_15m: 1.4,
    rfactor_trend_acceleration: 0.3,
    rfactor_trend_points: [76.2, 77.1, 78.5],
    opportunity_score: 8.6,
    setup_stage: "CONFIRMED",
  },
  {
    symbol: "MUTHOOTFIN",
    sector: "BANKING & FINANCE",
    ltp: 1840,
    change_pct: 3.5,
    volume_ratio: 3.1,
    rfactor: 74.2,
    rsi: 66.1,
    mfi: 63.4,
    relative_strength: 4.9,
    fo: true,
    rfactor_trend_15m: 0.9,
    rfactor_trend_acceleration: 0.1,
    rfactor_trend_points: [73.1, 73.8, 74.2],
    opportunity_score: 7.4,
    setup_stage: "PRE_SIGNAL",
  },
  {
    symbol: "KEI",
    sector: "INFRA",
    ltp: 3800,
    change_pct: 2.5,
    volume_ratio: 3.4,
    rfactor: 70.1,
    rsi: 63.5,
    mfi: 61.0,
    relative_strength: 4.3,
    fo: true,
    rfactor_trend_15m: 0.6,
    rfactor_trend_acceleration: 0.2,
    rfactor_trend_points: [69.2, 69.7, 70.1],
    opportunity_score: 7.1,
    setup_stage: "WARMING",
  },
  {
    symbol: "BEL",
    sector: "PSU & DEFENCE",
    ltp: 290,
    change_pct: 2.1,
    volume_ratio: 2.6,
    rfactor: 66.7,
    rsi: 60.3,
    mfi: 57.4,
    relative_strength: 3.6,
    fo: true,
    rfactor_trend_15m: 1.2,
    rfactor_trend_acceleration: 0.5,
    rfactor_trend_points: [63.8, 65.1, 66.7],
    opportunity_score: 8.1,
    setup_stage: "BREAKING",
  },
  {
    symbol: "NATIONALUM",
    sector: "METALS",
    ltp: 363,
    change_pct: 2.4,
    volume_ratio: 2.8,
    rfactor: 71.8,
    rsi: 61.5,
    mfi: 60.2,
    relative_strength: 3.8,
    fo: true,
    rfactor_trend_15m: 0.4,
    rfactor_trend_acceleration: -0.1,
    rfactor_trend_points: [71.1, 71.5, 71.8],
    opportunity_score: 6.8,
    setup_stage: "EXTENDED",
  },
  {
    symbol: "MCX",
    sector: "BANKING & FINANCE",
    ltp: 6200,
    change_pct: 2.6,
    volume_ratio: 2.3,
    rfactor: 68.9,
    rsi: 62.1,
    mfi: 59.8,
    relative_strength: 4.1,
    fo: true,
    rfactor_trend_15m: 0.7,
    rfactor_trend_acceleration: 0.4,
    rfactor_trend_points: [67.4, 68.1, 68.9],
    opportunity_score: 7.7,
    setup_stage: "BREAKING",
  },
  {
    symbol: "PERSISTENT",
    sector: "IT",
    ltp: 5200,
    change_pct: -1.1,
    volume_ratio: 2.5,
    rfactor: 65.3,
    rsi: 58.3,
    mfi: 55.1,
    relative_strength: 2.1,
    fo: true,
    rfactor_trend_15m: -0.8,
    rfactor_trend_acceleration: -0.3,
    rfactor_trend_points: [67.2, 66.1, 65.3],
    opportunity_score: 5.4,
    setup_stage: "NEUTRAL",
  },
  {
    symbol: "CLEAN",
    sector: "CHEMICALS",
    ltp: 1850,
    change_pct: 1.0,
    volume_ratio: 2.2,
    rfactor: 58.6,
    rsi: 56.4,
    mfi: 53.9,
    relative_strength: 2.5,
    fo: false,
    rfactor_trend_15m: 0.5,
    rfactor_trend_acceleration: 0.2,
    rfactor_trend_points: [57.8, 58.2, 58.6],
    opportunity_score: 6.3,
    setup_stage: "WARMING",
  },
  {
    symbol: "HINDZINC",
    sector: "METALS",
    ltp: 490,
    change_pct: 2.3,
    volume_ratio: 1.8,
    rfactor: 59.4,
    rsi: 57.2,
    mfi: 54.6,
    relative_strength: 3.2,
    fo: true,
    rfactor_trend_15m: 0.3,
    rfactor_trend_acceleration: -0.2,
    rfactor_trend_points: [59.0, 59.2, 59.4],
    opportunity_score: 5.9,
    setup_stage: "PRE_SIGNAL",
  },
  {
    symbol: "LAURUSLABS",
    sector: "PHARMA",
    ltp: 580,
    change_pct: -0.8,
    volume_ratio: 1.9,
    rfactor: 61.2,
    rsi: 55.4,
    mfi: 52.3,
    relative_strength: 1.4,
    fo: true,
    rfactor_trend_15m: -0.4,
    rfactor_trend_acceleration: -0.1,
    rfactor_trend_points: [61.8, 61.5, 61.2],
    opportunity_score: 4.8,
    setup_stage: "NEUTRAL",
  },
  {
    symbol: "SUNPHARMA",
    sector: "PHARMA",
    ltp: 1720,
    change_pct: 1.0,
    volume_ratio: 1.6,
    rfactor: 55.1,
    rsi: 53.8,
    mfi: 51.2,
    relative_strength: 2.0,
    fo: true,
    rfactor_trend_15m: 0.2,
    opportunity_score: 5.2,
    setup_stage: "WARMING",
  },
  {
    symbol: "HAL",
    sector: "PSU & DEFENCE",
    ltp: 4200,
    change_pct: 1.1,
    volume_ratio: 1.5,
    rfactor: 54.3,
    rsi: 54.0,
    mfi: 51.8,
    relative_strength: 2.2,
    fo: true,
    rfactor_trend_15m: 0.1,
    rfactor_trend_points: [54.0, 54.1, 54.3],
    opportunity_score: 4.9,
    setup_stage: "PRE_SIGNAL",
  },
  {
    symbol: "ONGC",
    sector: "ENERGY",
    ltp: 260,
    change_pct: 0.9,
    volume_ratio: 1.7,
    rfactor: 52.8,
    rsi: 52.1,
    mfi: 50.3,
    relative_strength: 1.5,
    fo: true,
    rfactor_trend_15m: 0.4,
    rfactor_trend_acceleration: 0.2,
    rfactor_trend_points: [52.0, 52.4, 52.8],
    opportunity_score: 5.7,
    setup_stage: "WARMING",
  },
  {
    symbol: "ITC",
    sector: "FMCG",
    ltp: 450,
    change_pct: 0.3,
    volume_ratio: 1.2,
    rfactor: 42.3,
    rsi: 48.2,
    mfi: 46.5,
    relative_strength: 0.8,
    fo: true,
    rfactor_trend_15m: -0.1,
    opportunity_score: 3.4,
    setup_stage: "NEUTRAL",
  },
  {
    symbol: "NAVINFLUOR",
    sector: "CHEMICALS",
    ltp: 3400,
    change_pct: 0.7,
    volume_ratio: 1.4,
    rfactor: 44.8,
    rsi: 49.6,
    mfi: 47.2,
    relative_strength: 1.2,
    fo: false,
    rfactor_trend_15m: 0.6,
    rfactor_trend_acceleration: 0.3,
    rfactor_trend_points: [43.9, 44.3, 44.8],
    opportunity_score: 6.1,
    setup_stage: "BREAKING",
  },
  {
    symbol: "IRCTC",
    sector: "INFRA",
    ltp: 890,
    change_pct: 0.1,
    volume_ratio: 0.9,
    rfactor: 32.5,
    rsi: 44.3,
    mfi: 42.1,
    relative_strength: 0.3,
    fo: true,
    rfactor_trend_15m: 0.2,
    opportunity_score: 4.1,
    setup_stage: "WARMING",
  },
  {
    symbol: "TATASTEEL",
    sector: "METALS",
    ltp: 150,
    change_pct: -0.6,
    volume_ratio: 1.1,
    rfactor: 28.4,
    rsi: 41.2,
    mfi: 39.8,
    relative_strength: -1.2,
    fo: true,
    rfactor_trend_15m: -0.7,
    rfactor_trend_acceleration: -0.4,
    rfactor_trend_points: [29.9, 29.1, 28.4],
    opportunity_score: 2.6,
    setup_stage: "NEUTRAL",
  },
  {
    symbol: "RBLBANK",
    sector: "BANKING & FINANCE",
    ltp: 240,
    change_pct: -2.0,
    volume_ratio: 3.5,
    rfactor: 22.1,
    rsi: 35.4,
    mfi: 33.2,
    relative_strength: -3.5,
    fo: true,
    rfactor_trend_15m: -1.1,
    rfactor_trend_acceleration: -0.5,
    rfactor_trend_points: [24.0, 23.2, 22.1],
    opportunity_score: 1.9,
    setup_stage: "EXTENDED",
  },
  {
    symbol: "SWIGGY",
    sector: "FMCG",
    ltp: 420,
    change_pct: -4.2,
    volume_ratio: 4.1,
    rfactor: 15.3,
    rsi: 28.6,
    mfi: 25.4,
    relative_strength: -6.7,
    fo: false,
    rfactor_trend_15m: -1.4,
    rfactor_trend_acceleration: -0.6,
    rfactor_trend_points: [17.9, 16.5, 15.3],
    opportunity_score: 1.2,
    setup_stage: "EXTENDED",
  },
  {
    symbol: "RVNL",
    sector: "REALTY",
    ltp: 380,
    change_pct: -5.1,
    volume_ratio: 3.8,
    rfactor: 10.2,
    rsi: 22.3,
    mfi: 19.8,
    relative_strength: -7.8,
    fo: true,
    rfactor_trend_15m: -1.8,
    rfactor_trend_acceleration: -0.7,
    rfactor_trend_points: [13.6, 11.9, 10.2],
    opportunity_score: 0.8,
    setup_stage: "EXTENDED",
  },
];

export const rfactorMockData: RFactorData = {
  stocks: baseRFactorStocks.map((stock) => {
    const inferredDirection =
      stock.change_pct > 0.15
        ? "LONG"
        : stock.change_pct < -0.15
          ? "SHORT"
          : "NEUTRAL";
    const confidence =
      stock.opportunity_score !== undefined
        ? Math.max(42, Math.min(96, Math.round(stock.opportunity_score * 10)))
        : 50;
    const preScore =
      stock.opportunity_score !== undefined
        ? Number((stock.opportunity_score * 0.82).toFixed(1))
        : undefined;
    const triggerScore =
      stock.rfactor_trend_15m !== undefined
        ? Number(
            (
              Math.max(0, stock.opportunity_score ?? 0) * 0.6 +
              Math.abs(stock.rfactor_trend_15m) * 10
            ).toFixed(1),
          )
        : undefined;
    const breakoutQuality =
      triggerScore !== undefined
        ? Number(Math.min(99, triggerScore * 8).toFixed(1))
        : undefined;
    const vwapAcceptance =
      stock.rfactor_trend_15m !== undefined
        ? Number(
            Math.min(
              99,
              55 + Math.max(stock.rfactor_trend_15m, -2) * 18,
            ).toFixed(1),
          )
        : undefined;
    const distPct =
      stock.rfactor_trend_15m !== undefined
        ? Number(
            Math.max(0.12, Math.abs(stock.rfactor_trend_15m) * 0.35).toFixed(2),
          )
        : undefined;
    const nearestLevel = Number(
      (stock.ltp * (1 + (stock.change_pct >= 0 ? 0.008 : -0.008))).toFixed(2),
    );
    const isChase =
      stock.setup_stage === "EXTENDED" || (stock.opportunity_score ?? 0) < 2;

    return {
      ...stock,
      tier:
        stock.rfactor >= 70
          ? "strong"
          : stock.rfactor >= 50
            ? "building"
            : stock.rfactor >= 30
              ? "watch"
              : "weak",
      pre_score: preScore,
      trigger_score: triggerScore,
      alert_stage:
        stock.setup_stage === "CONFIRMED"
          ? "Follow-through"
          : stock.setup_stage === "BREAKING"
            ? "Trigger Live"
            : stock.setup_stage === "PRE_SIGNAL"
              ? "Early Build"
              : stock.setup_stage === "WARMING"
                ? "Monitoring"
                : stock.setup_stage === "EXTENDED"
                  ? "Late Move"
                  : "Neutral",
      inferred_direction: inferredDirection,
      direction_conf: confidence,
      compression: Number(
        Math.max(0.2, 2.8 - stock.volume_ratio * 0.3).toFixed(2),
      ),
      obv_slope_score: Number((stock.relative_strength / 2 + 50).toFixed(1)),
      vol_accel: Number((stock.volume_ratio * 18).toFixed(1)),
      rsi_slope_5m:
        stock.rfactor_trend_15m !== undefined
          ? Number((stock.rfactor_trend_15m * 1.8).toFixed(2))
          : undefined,
      nearest_level: nearestLevel,
      proximity_score:
        distPct !== undefined
          ? Number(Math.max(0, 100 - distPct * 32).toFixed(1))
          : undefined,
      dist_pct: distPct,
      breakout_levels: [
        Number((nearestLevel * 0.995).toFixed(2)),
        nearestLevel,
        Number((nearestLevel * 1.005).toFixed(2)),
      ],
      breakout_quality: breakoutQuality,
      vwap_acceptance: vwapAcceptance,
      is_chase: isChase,
      chase_reason: isChase
        ? "Move is already stretched away from the early-entry zone"
        : undefined,
    };
  }),
  last_updated: "14:35:22",
};
