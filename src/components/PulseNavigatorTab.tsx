import { useEffect, useMemo, useState } from "react";
import { Compass, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";

import { PulseNavigatorSectorCard } from "@/components/PulseNavigatorSectorCard";
import { PulseNavigatorStockCard } from "@/components/PulseNavigatorStockCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createEmptyPulseNavigatorResponse,
  hasPulseNavigatorDiscoverData,
  hasPulseNavigatorFreshData,
  hasPulseNavigatorSectorsData,
  hasPulseNavigatorUsableData,
  mergePulseNavigatorResponse,
  type PulseNavigatorHeroHighlight,
  type PulseNavigatorInnerTab,
  type PulseNavigatorPreset,
  type PulseNavigatorQuery,
  type PulseNavigatorResponse,
} from "@/data/pulseNavigatorData";
import { fetchPulseNavigatorData, fetchPulseNavigatorTabData } from "@/lib/pulseNavigatorApi";

const DEFAULT_QUERY: PulseNavigatorQuery = {
  limit: 12,
  preset: "balanced",
  direction: "ALL",
};

const PRESET_OPTIONS: Array<{ label: string; value: PulseNavigatorPreset }> = [
  { label: "Balanced", value: "balanced" },
  { label: "Safe", value: "safe" },
  { label: "Aggressive", value: "aggressive" },
  { label: "F&O Focus", value: "fo_focus" },
];

const DIRECTION_OPTIONS: Array<{ label: string; value: PulseNavigatorQuery["direction"] }> = [
  { label: "All", value: "ALL" },
  { label: "Long", value: "LONG" },
  { label: "Short", value: "SHORT" },
];

function formatHighlightFallback(label: string): PulseNavigatorHeroHighlight {
  return {
    primary: "--",
    secondary: `${label} unavailable`,
  };
}

function copyForStatus(status: string) {
  if (status === "warming" || status === "warming_up") {
    return {
      title: "Pulse Navigator is warming up",
      body: "The backend is reachable, but the discovery layer is still preparing curated pulse output for the current preset.",
    };
  }

  if (status === "loading") {
    return {
      title: "Loading Pulse Navigator",
      body: "Pulling the current discovery snapshot and hero context.",
    };
  }

  return {
    title: "Pulse Navigator is waiting for data",
    body: "No curated pulse data is available yet for the current filters.",
  };
}

function HeroCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: PulseNavigatorHeroHighlight | null;
  accent: string;
}) {
  const resolved = value ?? formatHighlightFallback(label);

  return (
    <div
      style={{
        borderRadius: "16px",
        border: `1px solid ${accent}`,
        background: "rgba(9, 15, 28, 0.84)",
        padding: "14px",
      }}
    >
      <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 800, marginTop: "8px" }}>{resolved.primary}</div>
      <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "6px", minHeight: "18px" }}>{resolved.secondary || " "}</div>
    </div>
  );
}

function WarmingState({ status }: { status: string }) {
  const content = copyForStatus(status);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-16 text-center">
      <div style={{ color: "#7DD3FC", fontSize: "18px", fontWeight: 700 }}>{content.title}</div>
      <div style={{ color: "#94A3B8", fontSize: "13px", maxWidth: "560px" }}>{content.body}</div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-16 text-center">
      <div style={{ color: "#E2E8F0", fontSize: "18px", fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#94A3B8", fontSize: "13px", maxWidth: "560px" }}>{body}</div>
    </div>
  );
}

export function PulseNavigatorTab() {
  const [query, setQuery] = useState<PulseNavigatorQuery>(DEFAULT_QUERY);
  const [activeTab, setActiveTab] = useState<PulseNavigatorInnerTab>("discover");
  const [data, setData] = useState<PulseNavigatorResponse>(createEmptyPulseNavigatorResponse(DEFAULT_QUERY));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [tabRefreshing, setTabRefreshing] = useState<Exclude<PulseNavigatorInnerTab, "discover"> | null>(null);
  const [tabRequestKeys, setTabRequestKeys] = useState<Record<Exclude<PulseNavigatorInnerTab, "discover">, string>>({
    fresh: "",
    sectors: "",
  });

  const queryKey = useMemo(() => `${query.limit}:${query.preset}:${query.direction}:${refreshTick}`, [query, refreshTick]);
  const hasVisibleData = useMemo(() => hasPulseNavigatorUsableData(data), [data]);

  useEffect(() => {
    const controller = new AbortController();

    setError("");

    if (hasVisibleData) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchPulseNavigatorData(query, controller.signal)
      .then((response) => {
        setData((current) => mergePulseNavigatorResponse(current, response));
        setTabRequestKeys({ fresh: "", sectors: "" });
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unable to load Pulse Navigator");

        if (!hasVisibleData) {
          setData(createEmptyPulseNavigatorResponse(query));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [hasVisibleData, query, refreshTick]);

  useEffect(() => {
    if (activeTab === "discover") {
      return;
    }

    if (tabRequestKeys[activeTab] === queryKey) {
      return;
    }

    const controller = new AbortController();
    setTabRefreshing(activeTab);

    fetchPulseNavigatorTabData(activeTab, query, controller.signal)
      .then((response) => {
        setData((current) => ({
          ...mergePulseNavigatorResponse(current, {
            ...current,
            status: current.status,
            last_updated: response.last_updated || current.last_updated,
            preset: response.preset,
            direction: response.direction,
            tabs: {
              ...current.tabs,
              [activeTab]: response.tabs[activeTab],
            },
          }),
        }));
        setTabRequestKeys((current) => ({ ...current, [activeTab]: queryKey }));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTabRequestKeys((current) => ({ ...current, [activeTab]: queryKey }));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setTabRefreshing((current) => (current === activeTab ? null : current));
        }
      });

    return () => controller.abort();
  }, [activeTab, query, queryKey, tabRequestKeys]);

  const benchmarkToneColor = data.benchmark.tone === "positive"
    ? "#86EFAC"
    : data.benchmark.tone === "negative"
      ? "#FCA5A5"
      : "#CBD5E1";
  const discoverHasData = hasPulseNavigatorDiscoverData(data.tabs.discover);
  const freshHasData = hasPulseNavigatorFreshData(data.tabs.fresh);
  const sectorsHasData = hasPulseNavigatorSectorsData(data.tabs.sectors);
  const isWarmingUp = data.status === "warming" || data.status === "warming_up";
  const isStaleRefreshing = data.status === "stale_refreshing";
  const showWaitingState = isWarmingUp && !hasVisibleData;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-300 text-lg">
        Loading Pulse Navigator...
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #07111f 0%, #0b1220 100%)", minHeight: "100vh" }}>
      {refreshing ? (
        <div className="flex items-center justify-center gap-2 py-2 text-cyan-200 text-xs bg-[#0a1a2d] border-b border-cyan-950/60">
          Refreshing Pulse Navigator...
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-center gap-2 py-2 text-amber-300 text-xs bg-[#23180a] border-b border-amber-950/60">
          {error}
        </div>
      ) : null}

      <div style={{ padding: "16px" }}>
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid rgba(51, 65, 85, 0.7)",
            background: "rgba(9, 15, 28, 0.84)",
            padding: "14px",
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div style={{ color: "#7DD3FC", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Curated Discovery Layer
              </div>
              <div style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>Pulse Navigator</div>
              <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px", maxWidth: "720px" }}>
                Discovery-first momentum curation built on the existing pulse engine, tuned for faster scanning instead of raw tables.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRefreshTick((value) => value + 1)}
              className="inline-flex items-center gap-2"
              style={{
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(34, 211, 238, 0.35)",
                backgroundColor: "rgba(8, 47, 73, 0.6)",
                color: "#CFFAFE",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-4">
            {PRESET_OPTIONS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setQuery((current) => ({ ...current, preset: preset.value }))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "9999px",
                  border: query.preset === preset.value ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(51, 65, 85, 0.85)",
                  backgroundColor: query.preset === preset.value ? "rgba(8, 47, 73, 0.58)" : "rgba(15, 23, 42, 0.82)",
                  color: query.preset === preset.value ? "#CFFAFE" : "#CBD5E1",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-3">
            {DIRECTION_OPTIONS.map((direction) => (
              <button
                key={direction.value}
                type="button"
                onClick={() => setQuery((current) => ({ ...current, direction: direction.value }))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: query.direction === direction.value ? "1px solid rgba(74, 222, 128, 0.4)" : "1px solid rgba(51, 65, 85, 0.85)",
                  backgroundColor: query.direction === direction.value ? "rgba(20, 83, 45, 0.45)" : "rgba(15, 23, 42, 0.82)",
                  color: query.direction === direction.value ? "#DCFCE7" : "#CBD5E1",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {direction.label}
              </button>
            ))}

            {isStaleRefreshing ? (
              <span
                style={{
                  color: "#CFFAFE",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(34, 211, 238, 0.28)",
                  backgroundColor: "rgba(8, 47, 73, 0.55)",
                }}
              >
                Refreshing in background
              </span>
            ) : null}

            <span style={{ color: "#64748B", fontSize: "11px", marginLeft: "auto" }}>
              Updated: {data.last_updated || "Waiting for first navigator snapshot..."}
            </span>
          </div>

          <div
            className="flex items-center justify-between gap-3 flex-wrap mt-4"
            style={{
              borderRadius: "14px",
              border: "1px solid rgba(51, 65, 85, 0.72)",
              background: "rgba(15, 23, 42, 0.72)",
              padding: "12px 14px",
            }}
          >
            <div className="flex items-center gap-2">
              <Compass size={16} color="#7DD3FC" />
              <span style={{ color: "#CBD5E1", fontSize: "12px", fontWeight: 700 }}>{data.benchmark.label}</span>
              <span style={{ color: benchmarkToneColor, fontSize: "12px", fontWeight: 800 }}>{data.benchmark.value}</span>
            </div>
            <div style={{ color: "#94A3B8", fontSize: "12px" }}>{data.benchmark.detail}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mt-4">
          <HeroCard label="Market Mode" value={data.hero.market_mode} accent="rgba(56, 189, 248, 0.28)" />
          <HeroCard label="Best Long" value={data.hero.best_long} accent="rgba(74, 222, 128, 0.28)" />
          <HeroCard label="Best Short" value={data.hero.best_short} accent="rgba(248, 113, 113, 0.28)" />
          <HeroCard label="Best Fresh" value={data.hero.best_fresh} accent="rgba(250, 204, 21, 0.28)" />
          <HeroCard label="Strongest Sector" value={data.hero.strongest_sector} accent="rgba(192, 132, 252, 0.28)" />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PulseNavigatorInnerTab)}>
          <TabsList className="h-auto flex flex-wrap justify-start rounded-xl bg-slate-950/70 border border-slate-800 p-1 mt-4">
            <TabsTrigger value="discover" className="data-[state=active]:bg-slate-900 data-[state=active]:text-slate-50 rounded-lg">
              <Sparkles size={14} />
              Discover
            </TabsTrigger>
            <TabsTrigger value="fresh" className="data-[state=active]:bg-slate-900 data-[state=active]:text-slate-50 rounded-lg">
              <TrendingUp size={14} />
              Fresh Movers
            </TabsTrigger>
            <TabsTrigger value="sectors" className="data-[state=active]:bg-slate-900 data-[state=active]:text-slate-50 rounded-lg">
              <Target size={14} />
              Sector Leaders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            {showWaitingState && !discoverHasData ? <WarmingState status={data.status} /> : null}
            {discoverHasData ? (
              <div className="grid grid-cols-1 gap-4 mt-4">
                {data.tabs.discover.buckets.map((bucket) => (
                  <section
                    key={bucket.key}
                    style={{
                      borderRadius: "18px",
                      border: "1px solid rgba(51, 65, 85, 0.7)",
                      background: "rgba(9, 15, 28, 0.84)",
                      padding: "16px",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 800 }}>{bucket.title}</div>
                        <div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>
                          {bucket.stocks.length > 0 ? `${bucket.stocks.length} curated names` : "No names in this bucket yet"}
                        </div>
                      </div>
                    </div>
                    {bucket.stocks.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4">
                        {bucket.stocks.map((stock) => (
                          <PulseNavigatorStockCard key={`${bucket.key}-${stock.symbol}`} stock={stock} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#94A3B8", fontSize: "13px", marginTop: "16px" }}>The backend did not return any symbols for this curated bucket.</div>
                    )}
                  </section>
                ))}
              </div>
            ) : null}
            {!showWaitingState && !discoverHasData ? (
              <EmptyState
                title="No Discover buckets available"
                body="The navigator returned no curated names for the current preset and direction. Try another preset or refresh after the next backend update."
              />
            ) : null}
          </TabsContent>

          <TabsContent value="fresh">
            {tabRefreshing === "fresh" ? (
              <div style={{ color: "#7DD3FC", fontSize: "12px", marginTop: "12px" }}>Refreshing Fresh Movers...</div>
            ) : null}
            {showWaitingState && !freshHasData ? <WarmingState status={data.status} /> : null}
            {freshHasData ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4">
                {data.tabs.fresh.stocks.map((stock) => (
                  <PulseNavigatorStockCard key={`fresh-${stock.symbol}`} stock={stock} emphasis="fresh" />
                ))}
              </div>
            ) : null}
            {!showWaitingState && !freshHasData ? (
              <EmptyState
                title="No Fresh Movers right now"
                body="Newly emerging names are not available for the current filters. Widen direction or switch to Discover for the broader curated set."
              />
            ) : null}
          </TabsContent>

          <TabsContent value="sectors">
            {tabRefreshing === "sectors" ? (
              <div style={{ color: "#7DD3FC", fontSize: "12px", marginTop: "12px" }}>Refreshing Sector Leaders...</div>
            ) : null}
            {showWaitingState && !sectorsHasData ? <WarmingState status={data.status} /> : null}
            {sectorsHasData ? (
              <div className="grid grid-cols-1 gap-4 mt-4">
                {data.tabs.sectors.sectors.map((sector) => (
                  <PulseNavigatorSectorCard key={sector.sector} sector={sector} />
                ))}
              </div>
            ) : null}
            {!showWaitingState && !sectorsHasData ? (
              <EmptyState
                title="No Sector Leaders available"
                body="Sector leadership data is currently empty for this preset. Refresh or switch back to Discover while the sector view catches up."
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}