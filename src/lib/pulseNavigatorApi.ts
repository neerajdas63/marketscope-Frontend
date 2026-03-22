import { apiFetch } from "@/lib/api";
import {
  createEmptyPulseNavigatorResponse,
  type PulseNavigatorActionabilityLabel,
  type PulseNavigatorDirection,
  type PulseNavigatorDirectionFilter,
  type PulseNavigatorDiscoverBucket,
  type PulseNavigatorHeroHighlight,
  type PulseNavigatorInnerTab,
  type PulseNavigatorPreset,
  type PulseNavigatorQuery,
  type PulseNavigatorResponse,
  type PulseNavigatorSectorEntry,
  type PulseNavigatorStock,
} from "@/data/pulseNavigatorData";

const VALID_PRESETS: PulseNavigatorPreset[] = ["balanced", "safe", "aggressive", "fo_focus"];
const VALID_DIRECTIONS: PulseNavigatorDirection[] = ["LONG", "SHORT", "NEUTRAL"];
const VALID_DIRECTION_FILTERS: PulseNavigatorDirectionFilter[] = ["ALL", "LONG", "SHORT"];
const VALID_ACTIONABILITY: PulseNavigatorActionabilityLabel[] = [
  "clean_setup",
  "needs_pullback",
  "extended",
  "risky_spike",
  "neutral",
];
const DEFAULT_DISCOVER_BUCKETS = [
  "curated_now",
  "clean_setups",
  "early_movers",
  "trend_continuation",
  "late_strength",
] as const;

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

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function titleCase(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSignedPercent(value?: number, digits = 1) {
  if (value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function asPreset(value: unknown, fallback: PulseNavigatorPreset): PulseNavigatorPreset {
  return typeof value === "string" && VALID_PRESETS.includes(normalizeToken(value) as PulseNavigatorPreset)
    ? (normalizeToken(value) as PulseNavigatorPreset)
    : fallback;
}

function asDirection(value: unknown): PulseNavigatorDirection {
  return typeof value === "string" && VALID_DIRECTIONS.includes(value.toUpperCase() as PulseNavigatorDirection)
    ? (value.toUpperCase() as PulseNavigatorDirection)
    : "NEUTRAL";
}

function asDirectionFilter(value: unknown, fallback: PulseNavigatorDirectionFilter): PulseNavigatorDirectionFilter {
  return typeof value === "string" && VALID_DIRECTION_FILTERS.includes(value.toUpperCase() as PulseNavigatorDirectionFilter)
    ? (value.toUpperCase() as PulseNavigatorDirectionFilter)
    : fallback;
}

function asActionabilityLabel(value: unknown, warningFlags: string[], isExtended: boolean): PulseNavigatorActionabilityLabel {
  if (typeof value === "string") {
    const normalized = normalizeToken(value);
    if (VALID_ACTIONABILITY.includes(normalized as PulseNavigatorActionabilityLabel)) {
      return normalized as PulseNavigatorActionabilityLabel;
    }
  }

  if (isExtended) {
    return "extended";
  }

  if (warningFlags.length >= 2) {
    return "risky_spike";
  }

  return "neutral";
}

function normalizeHighlight(value: unknown): PulseNavigatorHeroHighlight | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return {
      primary: String(value),
      secondary: "",
    };
  }

  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const primary =
    asOptionalString(record.primary)
    ?? asOptionalString(record.symbol)
    ?? asOptionalString(record.sector)
    ?? asOptionalString(record.name)
    ?? asOptionalString(record.label)
    ?? asOptionalString(record.title)
    ?? asOptionalString(record.market_mode);
  const direction = asOptionalString(record.direction);
  const sector = asOptionalString(record.sector);
  const trend = asOptionalString(record.pulse_trend_label) ?? asOptionalString(record.trend_label);
  const score = asFiniteNumber(record.momentum_pulse_score) ?? asFiniteNumber(record.score);
  const extras = [
    direction,
    sector && sector !== primary ? sector : undefined,
    score !== undefined ? `Score ${score.toFixed(1)}` : undefined,
    trend,
  ].filter((item): item is string => Boolean(item));

  if (!primary && extras.length === 0) {
    return null;
  }

  return {
    primary: primary ?? "--",
    secondary: extras.join(" • "),
  };
}

function normalizeStock(value: unknown): PulseNavigatorStock | null {
  if (typeof value === "string") {
    return {
      symbol: value,
      sector: "Unknown",
      direction: "NEUTRAL",
      momentum_pulse_score: 0,
      session_leader_score: 0,
      direction_confidence: 0,
      actionability_label: "neutral",
      leader_reason: "",
      reasons: [],
      ui_tags: [],
      change_pct: 0,
      distance_from_vwap_pct: 0,
      relative_strength: 0,
      pulse_trend_label: "--",
      pulse_trend_strength: 0,
      latest_bar_time: "--",
      warning_flags: [],
      warning_count: 0,
      score_change_10m: 0,
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const symbol = asOptionalString(row.symbol) ?? asOptionalString(row.name);

  if (!symbol) {
    return null;
  }

  const warningFlags = asStringArray(row.warning_flags).length > 0
    ? asStringArray(row.warning_flags)
    : asStringArray(row.warnings);
  const isExtended = asOptionalBoolean(row.is_extended) ?? false;

  return {
    symbol,
    sector: asOptionalString(row.sector) ?? asOptionalString(row.group) ?? "Unknown",
    direction: asDirection(row.direction ?? row.inferred_direction),
    momentum_pulse_score: asFiniteNumber(row.momentum_pulse_score) ?? asFiniteNumber(row.score) ?? 0,
    session_leader_score: asFiniteNumber(row.session_leader_score) ?? 0,
    direction_confidence: asFiniteNumber(row.direction_confidence) ?? asFiniteNumber(row.direction_conf) ?? 0,
    actionability_label: asActionabilityLabel(row.actionability_label, warningFlags, isExtended),
    leader_reason: asOptionalString(row.leader_reason) ?? "",
    reasons: asStringArray(row.reasons).slice(0, 3),
    ui_tags: (asStringArray(row.ui_tags).length > 0 ? asStringArray(row.ui_tags) : asStringArray(row.tags)).slice(0, 4),
    change_pct: asFiniteNumber(row.change_pct) ?? asFiniteNumber(row.pct_change) ?? 0,
    distance_from_vwap_pct: asFiniteNumber(row.distance_from_vwap_pct) ?? 0,
    relative_strength: asFiniteNumber(row.relative_strength) ?? 0,
    pulse_trend_label: asOptionalString(row.pulse_trend_label) ?? "--",
    pulse_trend_strength: asFiniteNumber(row.pulse_trend_strength) ?? 0,
    latest_bar_time: asOptionalString(row.latest_bar_time) ?? asOptionalString(row.bar_time) ?? "--",
    warning_flags: warningFlags,
    warning_count: asFiniteNumber(row.warning_count) ?? warningFlags.length,
    score_change_10m: asFiniteNumber(row.score_change_10m) ?? 0,
  };
}

function normalizeDiscoverBuckets(value: unknown): PulseNavigatorDiscoverBucket[] {
  if (Array.isArray(value)) {
    return value
      .map((bucket, index) => {
        if (!bucket || typeof bucket !== "object") {
          return null;
        }

        const bucketRecord = bucket as Record<string, unknown>;
        const key = asOptionalString(bucketRecord.key) ?? asOptionalString(bucketRecord.slug) ?? `bucket_${index}`;
        const title = asOptionalString(bucketRecord.title) ?? titleCase(key);
        const rawStocks = Array.isArray(bucketRecord.stocks)
          ? bucketRecord.stocks
          : Array.isArray(bucketRecord.items)
            ? bucketRecord.items
            : [];

        return {
          key,
          title,
          stocks: rawStocks
            .map((stock) => normalizeStock(stock))
            .filter((stock): stock is PulseNavigatorStock => stock !== null),
        };
      })
      .filter((bucket): bucket is PulseNavigatorDiscoverBucket => bucket !== null);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const entries = Object.entries(record);
  const buckets = entries.length > 0
    ? entries
    : DEFAULT_DISCOVER_BUCKETS.map((key) => [key, []] as const);

  return buckets.map(([key, stocks]) => ({
    key,
    title: titleCase(key),
    stocks: (Array.isArray(stocks) ? stocks : [])
      .map((stock) => normalizeStock(stock))
      .filter((stock): stock is PulseNavigatorStock => stock !== null),
  }));
}

function normalizeSectorEntry(value: unknown, fallbackSector: string): PulseNavigatorSectorEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const sector = value as Record<string, unknown>;

  return {
    sector: asOptionalString(sector.sector) ?? asOptionalString(sector.name) ?? fallbackSector,
    leader: normalizeStock(sector.leader),
    challenger: normalizeStock(sector.challenger),
    laggard: normalizeStock(sector.laggard),
  };
}

function normalizeSectorEntries(value: unknown): PulseNavigatorSectorEntry[] {
  if (Array.isArray(value)) {
    return value
      .map((entry, index) => normalizeSectorEntry(entry, `Sector ${index + 1}`))
      .filter((entry): entry is PulseNavigatorSectorEntry => entry !== null);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([sectorName, sectorValue]) => normalizeSectorEntry(sectorValue, sectorName))
    .filter((entry): entry is PulseNavigatorSectorEntry => entry !== null);
}

function normalizeStatus(value: unknown) {
  if (typeof value === "string") {
    return normalizeToken(value);
  }

  return "ready";
}

function normalizeStockList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((stock) => normalizeStock(stock))
    .filter((stock): stock is PulseNavigatorStock => stock !== null);
}

function splitStocksByDirection(stocks: PulseNavigatorStock[]) {
  return {
    longs: stocks.filter((stock) => stock.direction === "LONG"),
    shorts: stocks.filter((stock) => stock.direction === "SHORT"),
  };
}

function inferBenchmarkTone(changePct?: number) {
  if (changePct === undefined || Number.isNaN(changePct) || changePct === 0) {
    return "neutral" as const;
  }

  return changePct > 0 ? "positive" as const : "negative" as const;
}

export function normalizePulseNavigatorResponse(
  payload: unknown,
  query: PulseNavigatorQuery,
  tab?: PulseNavigatorInnerTab,
): PulseNavigatorResponse {
  const empty = createEmptyPulseNavigatorResponse(query);

  if (!payload || typeof payload !== "object") {
    return empty;
  }

  const data = payload as Record<string, unknown>;
  const tabsData = data.tabs && typeof data.tabs === "object"
    ? (data.tabs as Record<string, unknown>)
    : data;
  const heroData = data.hero && typeof data.hero === "object"
    ? (data.hero as Record<string, unknown>)
    : {};
  const benchmarkChangePct = asFiniteNumber(data.benchmark_change_pct) ?? asFiniteNumber(data.benchmark_pct_change);
  const marketModeHighlight = normalizeHighlight(heroData.market_mode ?? data.market_mode);
  const benchmarkLabel = asOptionalString(data.benchmark_label) ?? "Benchmark";
  const benchmarkValue = asOptionalString(data.benchmark_value)
    ?? (benchmarkChangePct !== undefined ? formatSignedPercent(benchmarkChangePct, 2) : "--");
  const benchmarkDetail = marketModeHighlight?.primary
    ? `Mode ${marketModeHighlight.primary}`
    : "Market mode unavailable";

  const discoverSource = tab === "discover"
    ? data
    : (tabsData.discover && typeof tabsData.discover === "object" ? tabsData.discover as Record<string, unknown> : {});
  const leadersSource = tab === "leaders"
    ? data
    : (tabsData.leaders && typeof tabsData.leaders === "object" ? tabsData.leaders as Record<string, unknown> : {});
  const freshSource = tab === "fresh"
    ? data
    : (tabsData.fresh && typeof tabsData.fresh === "object" ? tabsData.fresh as Record<string, unknown> : {});
  const sectorsSource = tab === "sectors"
    ? data
    : (tabsData.sectors && typeof tabsData.sectors === "object" ? tabsData.sectors as Record<string, unknown> : {});

  const discoverBuckets = normalizeDiscoverBuckets(discoverSource.buckets ?? discoverSource.groups ?? discoverSource.sections);
  const discoverStocks = discoverBuckets.flatMap((bucket) => bucket.stocks);
  const legacyFreshStocks = normalizeStockList(
    Array.isArray(freshSource.stocks) ? freshSource.stocks : Array.isArray(freshSource.data) ? freshSource.data : [],
  );
  const explicitLeaderLongs = normalizeStockList(leadersSource.longs);
  const explicitLeaderShorts = normalizeStockList(leadersSource.shorts);
  const explicitFreshLongs = normalizeStockList(freshSource.longs);
  const explicitFreshShorts = normalizeStockList(freshSource.shorts);
  const hasExplicitLeaders = explicitLeaderLongs.length > 0 || explicitLeaderShorts.length > 0;
  const hasExplicitFresh = explicitFreshLongs.length > 0 || explicitFreshShorts.length > 0;
  const leaderFallback = discoverStocks.length > 0 ? discoverStocks : legacyFreshStocks;
  const splitLeaderFallback = splitStocksByDirection(leaderFallback);
  const splitFreshFallback = splitStocksByDirection(legacyFreshStocks);
  const sectorEntries = normalizeSectorEntries(sectorsSource.sectors ?? sectorsSource.data ?? sectorsSource.groups);

  return {
    status: normalizeStatus(data.status ?? data.state ?? (asOptionalBoolean(data.ready) ? "ready" : undefined)),
    last_updated: asOptionalString(data.last_updated) ?? asOptionalString(data.updated_at) ?? "",
    preset: asPreset(data.preset, query.preset),
    direction: asDirectionFilter(data.direction, query.direction),
    benchmark: {
      label: benchmarkLabel,
      value: benchmarkValue,
      detail: benchmarkDetail,
      tone: inferBenchmarkTone(benchmarkChangePct),
    },
    hero: {
      market_mode: marketModeHighlight,
      leader_long: normalizeHighlight(heroData.leader_long ?? heroData.best_long),
      leader_short: normalizeHighlight(heroData.leader_short ?? heroData.best_short),
      fresh_long: normalizeHighlight(heroData.fresh_long ?? heroData.best_fresh),
      fresh_short: normalizeHighlight(heroData.fresh_short),
      strongest_sector: normalizeHighlight(heroData.strongest_sector),
    },
    tabs: {
      discover: { buckets: discoverBuckets },
      leaders: {
        longs: hasExplicitLeaders ? explicitLeaderLongs : splitLeaderFallback.longs,
        shorts: hasExplicitLeaders ? explicitLeaderShorts : splitLeaderFallback.shorts,
      },
      fresh: {
        longs: hasExplicitFresh ? explicitFreshLongs : splitFreshFallback.longs,
        shorts: hasExplicitFresh ? explicitFreshShorts : splitFreshFallback.shorts,
      },
      sectors: { sectors: sectorEntries },
    },
  };
}

export async function fetchPulseNavigatorData(
  query: PulseNavigatorQuery,
  signal?: AbortSignal,
): Promise<PulseNavigatorResponse> {
  const params = new URLSearchParams({
    limit: String(query.limit),
    preset: query.preset,
    direction: query.direction,
  });

  const response = await apiFetch(`/pulse-navigator?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load /pulse-navigator (${response.status})`);
  }

  return normalizePulseNavigatorResponse(await response.json(), query);
}

export async function fetchPulseNavigatorTabData(
  tab: PulseNavigatorInnerTab,
  query: PulseNavigatorQuery,
  signal?: AbortSignal,
): Promise<PulseNavigatorResponse> {
  const params = new URLSearchParams({
    limit: String(query.limit),
    preset: query.preset,
    direction: query.direction,
  });
  const path = tab === "discover"
    ? "/pulse-navigator/discover"
    : tab === "leaders"
      ? "/pulse-navigator/leaders"
    : tab === "fresh"
      ? "/pulse-navigator/fresh"
      : "/pulse-navigator/sectors";
  const response = await apiFetch(`${path}?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }

  return normalizePulseNavigatorResponse(await response.json(), query, tab);
}