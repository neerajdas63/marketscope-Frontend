export type PulseNavigatorPreset =
  | "balanced"
  | "safe"
  | "aggressive"
  | "fo_focus";

export type PulseNavigatorDirection = "LONG" | "SHORT" | "NEUTRAL";

export type PulseNavigatorDirectionFilter = "ALL" | "LONG" | "SHORT";

export type PulseNavigatorInnerTab =
  | "discover"
  | "leaders"
  | "fresh"
  | "sectors";

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
  session_leader_score: number;
  direction_confidence: number;
  actionability_label: PulseNavigatorActionabilityLabel;
  leader_reason: string;
  reasons: string[];
  ui_tags: string[];
  change_pct: number;
  distance_from_vwap_pct: number;
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
  sector_direction: PulseNavigatorDirection | null;
  best_stock: PulseNavigatorStock | null;
  leader: PulseNavigatorStock | null;
  challenger: PulseNavigatorStock | null;
  laggard: PulseNavigatorStock | null;
  sector_score: number | null;
  market_relative_score: number | null;
  average_change_pct: number | null;
  candidate_count: number | null;
  top_stocks: PulseNavigatorStock[];
}

export interface PulseNavigatorHeroHighlight {
  primary: string;
  secondary: string;
}

export interface PulseNavigatorHero {
  market_mode: PulseNavigatorHeroHighlight | null;
  leader_long: PulseNavigatorHeroHighlight | null;
  leader_short: PulseNavigatorHeroHighlight | null;
  fresh_long: PulseNavigatorHeroHighlight | null;
  fresh_short: PulseNavigatorHeroHighlight | null;
  strongest_sector: PulseNavigatorHeroHighlight | null;
  leaders_overview: PulseNavigatorHeroHighlight | null;
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
    leaders: {
      longs: PulseNavigatorStock[];
      shorts: PulseNavigatorStock[];
    };
    fresh: {
      longs: PulseNavigatorStock[];
      shorts: PulseNavigatorStock[];
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

export function hasPulseNavigatorHighlightData(
  value: PulseNavigatorHeroHighlight | null,
) {
  if (!value) {
    return false;
  }

  const primary = value.primary.trim();
  const secondary = value.secondary.trim();

  return (
    (primary.length > 0 && primary !== DEFAULT_HIGHLIGHT_PRIMARY) ||
    secondary.length > 0
  );
}

export function hasPulseNavigatorBenchmarkData(
  value: PulseNavigatorBenchmarkStrip,
) {
  return (
    value.label !== DEFAULT_BENCHMARK_LABEL ||
    value.value !== DEFAULT_BENCHMARK_VALUE ||
    value.detail !== DEFAULT_BENCHMARK_DETAIL
  );
}

export function hasPulseNavigatorHeroData(value: PulseNavigatorHero) {
  return (
    hasPulseNavigatorHighlightData(value.market_mode) ||
    hasPulseNavigatorHighlightData(value.leader_long) ||
    hasPulseNavigatorHighlightData(value.leader_short) ||
    hasPulseNavigatorHighlightData(value.fresh_long) ||
    hasPulseNavigatorHighlightData(value.fresh_short) ||
    hasPulseNavigatorHighlightData(value.strongest_sector) ||
    hasPulseNavigatorHighlightData(value.leaders_overview)
  );
}

export function hasPulseNavigatorDiscoverData(
  value: PulseNavigatorResponse["tabs"]["discover"],
) {
  return value.buckets.some((bucket) => bucket.stocks.length > 0);
}

export function hasPulseNavigatorLeadersData(
  value: PulseNavigatorResponse["tabs"]["leaders"],
) {
  return value.longs.length > 0 || value.shorts.length > 0;
}

export function hasPulseNavigatorFreshData(
  value: PulseNavigatorResponse["tabs"]["fresh"],
) {
  return value.longs.length > 0 || value.shorts.length > 0;
}

export function hasPulseNavigatorSectorsData(
  value: PulseNavigatorResponse["tabs"]["sectors"],
) {
  return value.sectors.length > 0;
}

export function hasPulseNavigatorUsableData(value: PulseNavigatorResponse) {
  return (
    hasPulseNavigatorHeroData(value.hero) ||
    hasPulseNavigatorDiscoverData(value.tabs.discover) ||
    hasPulseNavigatorLeadersData(value.tabs.leaders) ||
    hasPulseNavigatorFreshData(value.tabs.fresh) ||
    hasPulseNavigatorSectorsData(value.tabs.sectors)
  );
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
    benchmark: hasPulseNavigatorBenchmarkData(incoming.benchmark)
      ? incoming.benchmark
      : current.benchmark,
    hero: {
      market_mode: hasPulseNavigatorHighlightData(incoming.hero.market_mode)
        ? incoming.hero.market_mode
        : current.hero.market_mode,
      leader_long: hasPulseNavigatorHighlightData(incoming.hero.leader_long)
        ? incoming.hero.leader_long
        : current.hero.leader_long,
      leader_short: hasPulseNavigatorHighlightData(incoming.hero.leader_short)
        ? incoming.hero.leader_short
        : current.hero.leader_short,
      fresh_long: hasPulseNavigatorHighlightData(incoming.hero.fresh_long)
        ? incoming.hero.fresh_long
        : current.hero.fresh_long,
      fresh_short: hasPulseNavigatorHighlightData(incoming.hero.fresh_short)
        ? incoming.hero.fresh_short
        : current.hero.fresh_short,
      strongest_sector: hasPulseNavigatorHighlightData(
        incoming.hero.strongest_sector,
      )
        ? incoming.hero.strongest_sector
        : current.hero.strongest_sector,
      leaders_overview: hasPulseNavigatorHighlightData(
        incoming.hero.leaders_overview,
      )
        ? incoming.hero.leaders_overview
        : current.hero.leaders_overview,
    },
    tabs: {
      discover: hasPulseNavigatorDiscoverData(incoming.tabs.discover)
        ? incoming.tabs.discover
        : current.tabs.discover,
      leaders: hasPulseNavigatorLeadersData(incoming.tabs.leaders)
        ? incoming.tabs.leaders
        : current.tabs.leaders,
      fresh: hasPulseNavigatorFreshData(incoming.tabs.fresh)
        ? incoming.tabs.fresh
        : current.tabs.fresh,
      sectors: hasPulseNavigatorSectorsData(incoming.tabs.sectors)
        ? incoming.tabs.sectors
        : current.tabs.sectors,
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
      leader_long: null,
      leader_short: null,
      fresh_long: null,
      fresh_short: null,
      strongest_sector: null,
      leaders_overview: null,
    },
    tabs: {
      discover: { buckets: [] },
      leaders: { longs: [], shorts: [] },
      fresh: { longs: [], shorts: [] },
      sectors: { sectors: [] },
    },
  };
}
