export interface SectorScopeStock {
  symbol: string;
  change_pct: number;
  volume_ratio: number;
  score: number; // 0–5 scale
}

export interface SectorScopeEntry {
  name: string;
  avg_change_pct: number;
  stocks: SectorScopeStock[];
}

export interface SectorScopeData {
  sectors: SectorScopeEntry[];
  last_updated: string;
}

export const sectorScopeMockData: SectorScopeData = {
  sectors: [
    {
      name: "AUTO",
      avg_change_pct: 1.24,
      stocks: [
        { symbol: "TIINDIA", change_pct: 3.47, volume_ratio: 2.1, score: 4.2 },
        { symbol: "MARUTI", change_pct: 1.2, volume_ratio: 2.1, score: 3.1 },
        { symbol: "M&M", change_pct: 0.8, volume_ratio: 1.4, score: 2.7 },
        {
          symbol: "EICHERMOT",
          change_pct: -0.3,
          volume_ratio: 0.9,
          score: 1.8,
        },
        {
          symbol: "BAJAJ-AUTO",
          change_pct: -2.04,
          volume_ratio: 1.8,
          score: 1.4,
        },
      ],
    },
    {
      name: "BANKING & FINANCE",
      avg_change_pct: 1.33,
      stocks: [
        {
          symbol: "MUTHOOTFIN",
          change_pct: 3.5,
          volume_ratio: 3.1,
          score: 3.9,
        },
        { symbol: "MCX", change_pct: 2.6, volume_ratio: 2.3, score: 3.5 },
        { symbol: "HDFCBANK", change_pct: 0.9, volume_ratio: 1.3, score: 2.4 },
        { symbol: "ICICIBANK", change_pct: 0.6, volume_ratio: 1.1, score: 2.1 },
        { symbol: "RBLBANK", change_pct: -2.0, volume_ratio: 3.5, score: 0.8 },
      ],
    },
    {
      name: "METALS",
      avg_change_pct: 1.37,
      stocks: [
        {
          symbol: "NATIONALUM",
          change_pct: 2.4,
          volume_ratio: 2.8,
          score: 3.6,
        },
        { symbol: "HINDZINC", change_pct: 2.3, volume_ratio: 1.8, score: 2.8 },
        {
          symbol: "TATASTEEL",
          change_pct: -0.6,
          volume_ratio: 1.1,
          score: 1.0,
        },
        { symbol: "JSWSTEEL", change_pct: -0.9, volume_ratio: 1.2, score: 0.9 },
        { symbol: "HINDALCO", change_pct: 1.1, volume_ratio: 1.6, score: 2.3 },
      ],
    },
    {
      name: "IT",
      avg_change_pct: -0.55,
      stocks: [
        {
          symbol: "PERSISTENT",
          change_pct: -1.1,
          volume_ratio: 2.5,
          score: 2.9,
        },
        { symbol: "INFY", change_pct: -0.5, volume_ratio: 1.3, score: 2.2 },
        { symbol: "TCS", change_pct: -0.3, volume_ratio: 1.1, score: 2.0 },
        { symbol: "WIPRO", change_pct: -0.8, volume_ratio: 1.0, score: 1.6 },
        { symbol: "HCLTECH", change_pct: 0.1, volume_ratio: 0.9, score: 1.9 },
      ],
    },
    {
      name: "PHARMA",
      avg_change_pct: 0.1,
      stocks: [
        {
          symbol: "LAURUSLABS",
          change_pct: -0.8,
          volume_ratio: 1.9,
          score: 2.5,
        },
        { symbol: "SUNPHARMA", change_pct: 1.0, volume_ratio: 1.6, score: 2.3 },
        { symbol: "DRREDDY", change_pct: -2.1, volume_ratio: 1.8, score: 1.5 },
        {
          symbol: "TORNTPHARM",
          change_pct: 0.4,
          volume_ratio: 1.1,
          score: 2.0,
        },
        { symbol: "BIOCON", change_pct: 0.8, volume_ratio: 0.9, score: 1.7 },
      ],
    },
    {
      name: "INFRA",
      avg_change_pct: 1.3,
      stocks: [
        { symbol: "KEI", change_pct: 2.5, volume_ratio: 3.4, score: 3.7 },
        { symbol: "IRCTC", change_pct: 0.1, volume_ratio: 0.9, score: 1.2 },
        { symbol: "L&T", change_pct: 1.2, volume_ratio: 1.5, score: 2.6 },
        {
          symbol: "ADANIPORTS",
          change_pct: 0.8,
          volume_ratio: 1.2,
          score: 2.1,
        },
        { symbol: "NTPC", change_pct: 0.6, volume_ratio: 1.0, score: 1.8 },
      ],
    },
    {
      name: "PSU & DEFENCE",
      avg_change_pct: 1.6,
      stocks: [
        { symbol: "BEL", change_pct: 2.1, volume_ratio: 2.6, score: 3.2 },
        { symbol: "HAL", change_pct: 1.1, volume_ratio: 1.5, score: 2.1 },
        { symbol: "BHEL", change_pct: 1.3, volume_ratio: 1.7, score: 2.3 },
        { symbol: "COCHIN", change_pct: 0.8, volume_ratio: 1.1, score: 1.8 },
        { symbol: "MAZAGON", change_pct: 2.4, volume_ratio: 2.0, score: 3.0 },
      ],
    },
    {
      name: "ENERGY",
      avg_change_pct: 0.45,
      stocks: [
        { symbol: "ONGC", change_pct: 0.9, volume_ratio: 1.7, score: 1.9 },
        { symbol: "RELIANCE", change_pct: 0.4, volume_ratio: 1.1, score: 1.7 },
        { symbol: "BPCL", change_pct: 0.6, volume_ratio: 1.3, score: 1.8 },
        { symbol: "IOC", change_pct: 0.2, volume_ratio: 0.9, score: 1.4 },
        { symbol: "POWERGRID", change_pct: 0.3, volume_ratio: 1.0, score: 1.5 },
      ],
    },
    {
      name: "FMCG",
      avg_change_pct: -1.95,
      stocks: [
        { symbol: "ITC", change_pct: 0.3, volume_ratio: 1.2, score: 1.5 },
        { symbol: "SWIGGY", change_pct: -4.2, volume_ratio: 4.1, score: 0.5 },
        { symbol: "HUL", change_pct: -1.1, volume_ratio: 1.4, score: 1.2 },
        { symbol: "NESTLE", change_pct: -0.6, volume_ratio: 0.8, score: 1.6 },
        { symbol: "DABUR", change_pct: -0.9, volume_ratio: 1.0, score: 1.3 },
      ],
    },
    {
      name: "CHEMICALS",
      avg_change_pct: 0.85,
      stocks: [
        { symbol: "CLEAN", change_pct: 1.0, volume_ratio: 2.2, score: 2.6 },
        {
          symbol: "NAVINFLUOR",
          change_pct: 0.7,
          volume_ratio: 1.4,
          score: 2.0,
        },
        {
          symbol: "PIDILITIND",
          change_pct: 0.9,
          volume_ratio: 1.1,
          score: 1.9,
        },
        { symbol: "AAVAS", change_pct: 1.1, volume_ratio: 1.3, score: 2.2 },
        { symbol: "DEEPAKNTR", change_pct: 0.6, volume_ratio: 1.0, score: 1.7 },
      ],
    },
    {
      name: "REALTY",
      avg_change_pct: -3.05,
      stocks: [
        { symbol: "RVNL", change_pct: -5.1, volume_ratio: 3.8, score: 0.3 },
        { symbol: "DLF", change_pct: -2.4, volume_ratio: 2.1, score: 0.9 },
        {
          symbol: "GODREJPROP",
          change_pct: -1.8,
          volume_ratio: 1.5,
          score: 1.2,
        },
        { symbol: "PRESTIGE", change_pct: -2.9, volume_ratio: 1.9, score: 0.7 },
        {
          symbol: "OBEROIRLTY",
          change_pct: -3.0,
          volume_ratio: 2.2,
          score: 0.6,
        },
      ],
    },
  ],
  last_updated: "14:35:22",
};
