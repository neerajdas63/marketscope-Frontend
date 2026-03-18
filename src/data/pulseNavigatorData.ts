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

const DEFAULT_BENCHMARK_LABEL = "Benchmark";
const DEFAULT_BENCHMARK_VALUE = "--";
const DEFAULT_BENCHMARK_DETAIL = "Market mode unavailable";
const DEFAULT_HIGHLIGHT_PRIMARY = "--";

export function hasPulseNavigatorHighlightData(value: PulseNavigatorHeroHighlight | null) {
  if (!value) {
    return false;
  }

  const primary = value.primary.trim();
  const secondary = value.secondary.trim();

  return (primary.length > 0 && primary !== DEFAULT_HIGHLIGHT_PRIMARY) || secondary.length > 0;
}

export function hasPulseNavigatorBenchmarkData(value: PulseNavigatorBenchmarkStrip) {
  return value.label !== DEFAULT_BENCHMARK_LABEL
    || value.value !== DEFAULT_BENCHMARK_VALUE
    || value.detail !== DEFAULT_BENCHMARK_DETAIL;
}

export function hasPulseNavigatorHeroData(value: PulseNavigatorHero) {
  return hasPulseNavigatorHighlightData(value.market_mode)
    || hasPulseNavigatorHighlightData(value.best_long)
    || hasPulseNavigatorHighlightData(value.best_short)
    || hasPulseNavigatorHighlightData(value.best_fresh)
    || hasPulseNavigatorHighlightData(value.strongest_sector);
}

export function hasPulseNavigatorDiscoverData(value: PulseNavigatorResponse["tabs"]["discover"]) {
  return value.buckets.some((bucket) => bucket.stocks.length > 0);
}

export function hasPulseNavigatorFreshData(value: PulseNavigatorResponse["tabs"]["fresh"]) {
  return value.stocks.length > 0;
}

export function hasPulseNavigatorSectorsData(value: PulseNavigatorResponse["tabs"]["sectors"]) {
  return value.sectors.length > 0;
}

export function hasPulseNavigatorUsableData(value: PulseNavigatorResponse) {
  return hasPulseNavigatorHeroData(value.hero)
    || hasPulseNavigatorDiscoverData(value.tabs.discover)
    || hasPulseNavigatorFreshData(value.tabs.fresh)
    || hasPulseNavigatorSectorsData(value.tabs.sectors);
}

export function mergePulseNavigatorResponse(
  current: PulseNavigatorResponse,
  incoming: PulseNavigatorResponse,
): PulseNavigatorResponse {
  if (incoming.status !== "stale_refreshing") {
    return incoming;
  }

  return {
    ...incoming,
    last_updated: incoming.last_updated || current.last_updated,
    benchmark: hasPulseNavigatorBenchmarkData(incoming.benchmark) ? incoming.benchmark : current.benchmark,
    hero: {
      market_mode: hasPulseNavigatorHighlightData(incoming.hero.market_mode) ? incoming.hero.market_mode : current.hero.market_mode,
      best_long: hasPulseNavigatorHighlightData(incoming.hero.best_long) ? incoming.hero.best_long : current.hero.best_long,
      best_short: hasPulseNavigatorHighlightData(incoming.hero.best_short) ? incoming.hero.best_short : current.hero.best_short,
      best_fresh: hasPulseNavigatorHighlightData(incoming.hero.best_fresh) ? incoming.hero.best_fresh : current.hero.best_fresh,
      strongest_sector: hasPulseNavigatorHighlightData(incoming.hero.strongest_sector)
        ? incoming.hero.strongest_sector
        : current.hero.strongest_sector,
    },
    tabs: {
      discover: hasPulseNavigatorDiscoverData(incoming.tabs.discover) ? incoming.tabs.discover : current.tabs.discover,
      fresh: hasPulseNavigatorFreshData(incoming.tabs.fresh) ? incoming.tabs.fresh : current.tabs.fresh,
      sectors: hasPulseNavigatorSectorsData(incoming.tabs.sectors) ? incoming.tabs.sectors : current.tabs.sectors,
    },
  };
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
      label: DEFAULT_BENCHMARK_LABEL,
      value: DEFAULT_BENCHMARK_VALUE,
      detail: DEFAULT_BENCHMARK_DETAIL,
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