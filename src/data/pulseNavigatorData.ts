export type PulseNavigatorPreset = "balanced" | "safe" | "aggressive" | "fo_focus";

export type PulseNavigatorDirection = "LONG" | "SHORT" | "NEUTRAL";

export type PulseNavigatorDirectionFilter = "ALL" | "LONG" | "SHORT";

export type PulseNavigatorInnerTab = "discover" | "fresh" | "sectors";

export type PulseNavigatorActionabilityLabel =
  | "clean_setup"
  | "needs_pullback"
  | "extended"
  | "risky_spike"
  | "neutral";

export interface PulseNavigatorStock {
  symbol: string;
  sector: string;
  direction: PulseNavigatorDirection;
  momentum_pulse_score: number;
  direction_confidence: number;
  actionability_label: PulseNavigatorActionabilityLabel;
  reasons: string[];
  ui_tags: string[];
  relative_strength: number;
  pulse_trend_label: string;
  pulse_trend_strength: number;
  latest_bar_time: string;
  warning_flags: string[];
  warning_count: number;
  score_change_10m: number;
}

export interface PulseNavigatorDiscoverBucket {
  key: string;
  title: string;
  stocks: PulseNavigatorStock[];
}

export interface PulseNavigatorSectorEntry {
  sector: string;
  leader: PulseNavigatorStock | null;
  challenger: PulseNavigatorStock | null;
  laggard: PulseNavigatorStock | null;
}

export interface PulseNavigatorHeroHighlight {
  primary: string;
  secondary: string;
}

export interface PulseNavigatorHero {
  market_mode: PulseNavigatorHeroHighlight | null;
  best_long: PulseNavigatorHeroHighlight | null;
  best_short: PulseNavigatorHeroHighlight | null;
  best_fresh: PulseNavigatorHeroHighlight | null;
  strongest_sector: PulseNavigatorHeroHighlight | null;
}

export interface PulseNavigatorBenchmarkStrip {
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "negative" | "neutral";
}

export interface PulseNavigatorResponse {
  status: string;
  last_updated: string;
  preset: PulseNavigatorPreset;
  direction: PulseNavigatorDirectionFilter;
  benchmark: PulseNavigatorBenchmarkStrip;
  hero: PulseNavigatorHero;
  tabs: {
    discover: {
      buckets: PulseNavigatorDiscoverBucket[];
    };
    fresh: {
      stocks: PulseNavigatorStock[];
    };
    sectors: {
      sectors: PulseNavigatorSectorEntry[];
    };
  };
}

export interface PulseNavigatorQuery {
  limit: number;
  preset: PulseNavigatorPreset;
  direction: PulseNavigatorDirectionFilter;
}

export function createEmptyPulseNavigatorResponse(
  query: PulseNavigatorQuery,
): PulseNavigatorResponse {
  return {
    status: "loading",
    last_updated: "",
    preset: query.preset,
    direction: query.direction,
    benchmark: {
      label: "Benchmark",
      value: "--",
      detail: "Market mode unavailable",
      tone: "neutral",
    },
    hero: {
      market_mode: null,
      best_long: null,
      best_short: null,
      best_fresh: null,
      strongest_sector: null,
    },
    tabs: {
      discover: { buckets: [] },
      fresh: { stocks: [] },
      sectors: { sectors: [] },
    },
  };
}