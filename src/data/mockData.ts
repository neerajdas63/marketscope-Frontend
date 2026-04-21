export type SetupStage =
  | "WARMING"
  | "PRE_SIGNAL"
  | "BREAKING"
  | "CONFIRMED"
  | "EXTENDED"
  | "NEUTRAL";

export type InferredDirection = "LONG" | "SHORT" | "NEUTRAL";

export type BreakoutLevel = number | string;

export type InsightValue = number | string | boolean;

export interface StockInsightFields {
  rfactor?: number;
  tier?: string;
  rfactor_trend_15m?: number;
  rfactor_trend_acceleration?: number;
  rfactor_trend_points?: number[];
  opportunity_score?: number;
  setup_stage?: SetupStage;
  pre_score?: number;
  prescore?: number;
  trigger_score?: number;
  triggerscore?: number;
  alert_stage?: string;
  alertstage?: string;
  inferred_direction?: InferredDirection;
  direction_conf?: number;
  compression?: number;
  obv_slope_score?: number;
  vol_accel?: number;
  rsi_slope_5m?: number;
  nearest_level?: BreakoutLevel;
  proximity_score?: number;
  dist_pct?: number;
  breakout_levels?: BreakoutLevel[];
  breakout_quality?: InsightValue;
  vwap_acceptance?: InsightValue;
  is_chase?: boolean;
  ischase?: boolean;
  chase_reason?: string;
  chasereason?: string;
}

export function getPreScoreValue(
  stock: Pick<StockInsightFields, "pre_score" | "prescore">,
) {
  return stock.pre_score ?? stock.prescore;
}

export function getTriggerScoreValue(
  stock: Pick<StockInsightFields, "trigger_score" | "triggerscore">,
) {
  return stock.trigger_score ?? stock.triggerscore;
}

export function getIsChaseValue(
  stock: Pick<StockInsightFields, "is_chase" | "ischase">,
) {
  return stock.is_chase ?? stock.ischase;
}

export function getChaseReasonValue(
  stock: Pick<StockInsightFields, "chase_reason" | "chasereason">,
) {
  return stock.chase_reason ?? stock.chasereason;
}

export function getAlertStageValue(
  stock: Pick<StockInsightFields, "alert_stage" | "alertstage" | "setup_stage">,
) {
  return stock.alert_stage ?? stock.alertstage ?? stock.setup_stage;
}

export interface Stock extends StockInsightFields {
  symbol: string;
  ltp: number;
  change_pct: number;
  volume_ratio: number;
  fo: boolean;
  relative_strength?: number; // vs Nifty; positive = outperforming
  vwap_position?:
    | "ABOVE"
    | "BELOW"
    | "AT_VWAP"
    | "EXTENDED_ABOVE"
    | "EXTENDED_BELOW";
}

export interface Sector {
  name: string;
  change_pct: number;
  stocks: Stock[];
}

export interface MarketData {
  sectors: Sector[];
  last_updated: string;
}

export const mockData: MarketData = {
  sectors: [
    {
      name: "PHARMA",
      change_pct: -1.24,
      stocks: [
        {
          symbol: "DRREDDY",
          ltp: 1240,
          change_pct: -2.1,
          volume_ratio: 1.8,
          fo: true,
        },
        {
          symbol: "SUNPHAR",
          ltp: 1682,
          change_pct: -1.8,
          volume_ratio: 2.4,
          fo: true,
        },
        {
          symbol: "LAURUSL",
          ltp: 580,
          change_pct: -1.2,
          volume_ratio: 1.2,
          fo: false,
        },
        {
          symbol: "BIOCON",
          ltp: 312,
          change_pct: 0.4,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "ALKEM",
          ltp: 5210,
          change_pct: -0.9,
          volume_ratio: 1.1,
          fo: false,
        },
        {
          symbol: "TORNTPH",
          ltp: 3100,
          change_pct: -1.5,
          volume_ratio: 1.6,
          fo: true,
        },
        {
          symbol: "DIVIS",
          ltp: 5800,
          change_pct: 0.3,
          volume_ratio: 0.8,
          fo: true,
        },
        {
          symbol: "MANKIND",
          ltp: 2400,
          change_pct: -0.7,
          volume_ratio: 1.3,
          fo: false,
        },
      ],
    },
    {
      name: "AUTO",
      change_pct: 0.45,
      stocks: [
        {
          symbol: "MARUTI",
          ltp: 11200,
          change_pct: 1.2,
          volume_ratio: 2.1,
          fo: true,
        },
        {
          symbol: "M&M",
          ltp: 2955,
          change_pct: 0.8,
          volume_ratio: 1.4,
          fo: true,
        },
        {
          symbol: "EICHERMOT",
          ltp: 4810,
          change_pct: -0.3,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "TATAMOTO",
          ltp: 780,
          change_pct: 0.5,
          volume_ratio: 1.7,
          fo: true,
        },
        {
          symbol: "BAJAJ-AUTO",
          ltp: 8900,
          change_pct: 0.2,
          volume_ratio: 0.7,
          fo: true,
        },
        {
          symbol: "UNOMINDA",
          ltp: 680,
          change_pct: -0.8,
          volume_ratio: 1.1,
          fo: false,
        },
      ],
    },
    {
      name: "REALTY",
      change_pct: -0.85,
      stocks: [
        {
          symbol: "GODREJPROP",
          ltp: 2100,
          change_pct: -1.5,
          volume_ratio: 2.8,
          fo: true,
        },
        {
          symbol: "PRESTIGE",
          ltp: 1650,
          change_pct: -0.9,
          volume_ratio: 1.3,
          fo: false,
        },
        {
          symbol: "DLF",
          ltp: 740,
          change_pct: -0.6,
          volume_ratio: 1.1,
          fo: true,
        },
        {
          symbol: "LODHA",
          ltp: 1200,
          change_pct: -1.1,
          volume_ratio: 1.9,
          fo: true,
        },
        {
          symbol: "PHOENIXLTD",
          ltp: 1500,
          change_pct: 0.4,
          volume_ratio: 0.8,
          fo: false,
        },
        {
          symbol: "OBEROIRLTY",
          ltp: 1800,
          change_pct: -0.3,
          volume_ratio: 0.6,
          fo: true,
        },
      ],
    },
    {
      name: "IT",
      change_pct: 0.92,
      stocks: [
        {
          symbol: "INFY",
          ltp: 1820,
          change_pct: 1.4,
          volume_ratio: 2.2,
          fo: true,
        },
        {
          symbol: "TCS",
          ltp: 4100,
          change_pct: 0.7,
          volume_ratio: 1.3,
          fo: true,
        },
        {
          symbol: "WIPRO",
          ltp: 560,
          change_pct: 0.9,
          volume_ratio: 1.6,
          fo: true,
        },
        {
          symbol: "HCLTECH",
          ltp: 1650,
          change_pct: 1.1,
          volume_ratio: 1.8,
          fo: true,
        },
        {
          symbol: "TECHM",
          ltp: 1720,
          change_pct: 2.1,
          volume_ratio: 3.1,
          fo: true,
        },
        {
          symbol: "MPHASIS",
          ltp: 2800,
          change_pct: 0.5,
          volume_ratio: 1.0,
          fo: false,
        },
        {
          symbol: "PERSISTENT",
          ltp: 5200,
          change_pct: 1.8,
          volume_ratio: 2.5,
          fo: true,
        },
      ],
    },
    {
      name: "BANKING & FINANCE",
      change_pct: -0.32,
      stocks: [
        {
          symbol: "HDFCBANK",
          ltp: 1780,
          change_pct: -0.4,
          volume_ratio: 1.2,
          fo: true,
        },
        {
          symbol: "ICICIBANK",
          ltp: 1240,
          change_pct: 0.3,
          volume_ratio: 1.1,
          fo: true,
        },
        {
          symbol: "SBIN",
          ltp: 780,
          change_pct: -0.8,
          volume_ratio: 1.5,
          fo: true,
        },
        {
          symbol: "KOTAKBANK",
          ltp: 1950,
          change_pct: -0.5,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "AXISBANK",
          ltp: 1150,
          change_pct: 0.2,
          volume_ratio: 1.0,
          fo: true,
        },
        {
          symbol: "BAJFIN",
          ltp: 7200,
          change_pct: -1.2,
          volume_ratio: 2.0,
          fo: true,
        },
        {
          symbol: "RBLBANK",
          ltp: 240,
          change_pct: -2.1,
          volume_ratio: 3.5,
          fo: true,
        },
        {
          symbol: "BANDHANBNK",
          ltp: 190,
          change_pct: -1.8,
          volume_ratio: 2.9,
          fo: true,
        },
      ],
    },
    {
      name: "METALS",
      change_pct: 1.35,
      stocks: [
        {
          symbol: "TATASTEEL",
          ltp: 150,
          change_pct: 1.8,
          volume_ratio: 2.6,
          fo: true,
        },
        {
          symbol: "JSWSTEEL",
          ltp: 920,
          change_pct: 1.5,
          volume_ratio: 2.1,
          fo: true,
        },
        {
          symbol: "HINDALCO",
          ltp: 640,
          change_pct: 0.9,
          volume_ratio: 1.4,
          fo: true,
        },
        {
          symbol: "VEDL",
          ltp: 460,
          change_pct: 2.3,
          volume_ratio: 3.2,
          fo: true,
        },
        {
          symbol: "COALINDIA",
          ltp: 410,
          change_pct: 0.6,
          volume_ratio: 1.0,
          fo: true,
        },
      ],
    },
    {
      name: "FMCG",
      change_pct: -0.18,
      stocks: [
        {
          symbol: "HINDUNILVR",
          ltp: 2400,
          change_pct: -0.3,
          volume_ratio: 0.8,
          fo: true,
        },
        {
          symbol: "ITC",
          ltp: 450,
          change_pct: 0.1,
          volume_ratio: 1.1,
          fo: true,
        },
        {
          symbol: "NESTLEIND",
          ltp: 24000,
          change_pct: -0.5,
          volume_ratio: 0.7,
          fo: false,
        },
        {
          symbol: "DABUR",
          ltp: 560,
          change_pct: -0.2,
          volume_ratio: 0.9,
          fo: false,
        },
        {
          symbol: "GODREJCP",
          ltp: 1100,
          change_pct: 0.4,
          volume_ratio: 1.2,
          fo: true,
        },
        {
          symbol: "COLPAL",
          ltp: 2800,
          change_pct: -0.6,
          volume_ratio: 0.8,
          fo: false,
        },
      ],
    },
    {
      name: "ENERGY",
      change_pct: 0.65,
      stocks: [
        {
          symbol: "RELIANCE",
          ltp: 2940,
          change_pct: 0.8,
          volume_ratio: 1.5,
          fo: true,
        },
        {
          symbol: "ONGC",
          ltp: 260,
          change_pct: 1.1,
          volume_ratio: 1.9,
          fo: true,
        },
        {
          symbol: "NTPC",
          ltp: 355,
          change_pct: 0.5,
          volume_ratio: 1.2,
          fo: true,
        },
        {
          symbol: "POWERGRID",
          ltp: 290,
          change_pct: 0.3,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "ADANIGREEN",
          ltp: 1800,
          change_pct: 1.4,
          volume_ratio: 2.3,
          fo: true,
        },
      ],
    },
    {
      name: "MEDIA",
      change_pct: -0.55,
      stocks: [
        {
          symbol: "ZEEL",
          ltp: 135,
          change_pct: -1.2,
          volume_ratio: 1.8,
          fo: true,
        },
        {
          symbol: "PVRINOX",
          ltp: 1420,
          change_pct: -0.4,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "SUNTV",
          ltp: 680,
          change_pct: 0.3,
          volume_ratio: 1.1,
          fo: true,
        },
        {
          symbol: "NETWORK18",
          ltp: 72,
          change_pct: -0.8,
          volume_ratio: 1.4,
          fo: false,
        },
      ],
    },
    {
      name: "TELECOM",
      change_pct: 0.38,
      stocks: [
        {
          symbol: "BHARTIARTL",
          ltp: 1580,
          change_pct: 0.6,
          volume_ratio: 1.3,
          fo: true,
        },
        {
          symbol: "IDEA",
          ltp: 14,
          change_pct: 0.2,
          volume_ratio: 2.1,
          fo: true,
        },
        {
          symbol: "TATACOMM",
          ltp: 1720,
          change_pct: 0.4,
          volume_ratio: 0.8,
          fo: false,
        },
      ],
    },
    {
      name: "INFRA",
      change_pct: 0.72,
      stocks: [
        {
          symbol: "LTIM",
          ltp: 5600,
          change_pct: 1.1,
          volume_ratio: 1.7,
          fo: true,
        },
        {
          symbol: "ADANIENT",
          ltp: 2800,
          change_pct: 0.8,
          volume_ratio: 2.0,
          fo: true,
        },
        {
          symbol: "ADANIPORTS",
          ltp: 1200,
          change_pct: 0.5,
          volume_ratio: 1.3,
          fo: true,
        },
        {
          symbol: "IRCTC",
          ltp: 890,
          change_pct: 0.3,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "SIEMENS",
          ltp: 5400,
          change_pct: 1.2,
          volume_ratio: 1.5,
          fo: false,
        },
      ],
    },
    {
      name: "CHEMICALS",
      change_pct: -0.42,
      stocks: [
        {
          symbol: "PIDILITIND",
          ltp: 2700,
          change_pct: -0.6,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "SRF",
          ltp: 2400,
          change_pct: -0.8,
          volume_ratio: 1.3,
          fo: true,
        },
        {
          symbol: "ATUL",
          ltp: 6800,
          change_pct: 0.2,
          volume_ratio: 0.7,
          fo: false,
        },
        {
          symbol: "DEEPAKNI",
          ltp: 2100,
          change_pct: -0.5,
          volume_ratio: 1.1,
          fo: true,
        },
      ],
    },
    {
      name: "NIFTY 50",
      change_pct: 0.28,
      stocks: [
        {
          symbol: "RELIANCE",
          ltp: 2940,
          change_pct: 0.8,
          volume_ratio: 1.5,
          fo: true,
        },
        {
          symbol: "HDFCBANK",
          ltp: 1780,
          change_pct: -0.4,
          volume_ratio: 1.2,
          fo: true,
        },
        {
          symbol: "INFY",
          ltp: 1820,
          change_pct: 1.4,
          volume_ratio: 2.2,
          fo: true,
        },
        {
          symbol: "TCS",
          ltp: 4100,
          change_pct: 0.7,
          volume_ratio: 1.3,
          fo: true,
        },
        {
          symbol: "ICICIBANK",
          ltp: 1240,
          change_pct: 0.3,
          volume_ratio: 1.1,
          fo: true,
        },
        {
          symbol: "SBIN",
          ltp: 780,
          change_pct: -0.8,
          volume_ratio: 1.5,
          fo: true,
        },
        {
          symbol: "BHARTIARTL",
          ltp: 1580,
          change_pct: 0.6,
          volume_ratio: 1.3,
          fo: true,
        },
      ],
    },
    {
      name: "NIFTY MIDCAP",
      change_pct: 0.55,
      stocks: [
        {
          symbol: "PERSISTENT",
          ltp: 5200,
          change_pct: 1.8,
          volume_ratio: 2.5,
          fo: true,
        },
        {
          symbol: "LODHA",
          ltp: 1200,
          change_pct: -1.1,
          volume_ratio: 1.9,
          fo: true,
        },
        {
          symbol: "IRCTC",
          ltp: 890,
          change_pct: 0.3,
          volume_ratio: 0.9,
          fo: true,
        },
        {
          symbol: "GODREJPROP",
          ltp: 2100,
          change_pct: -1.5,
          volume_ratio: 2.8,
          fo: true,
        },
        {
          symbol: "MANKIND",
          ltp: 2400,
          change_pct: -0.7,
          volume_ratio: 1.3,
          fo: false,
        },
        {
          symbol: "UNOMINDA",
          ltp: 680,
          change_pct: -0.8,
          volume_ratio: 1.1,
          fo: false,
        },
      ],
    },
  ],
  last_updated: "14:35:22",
};
