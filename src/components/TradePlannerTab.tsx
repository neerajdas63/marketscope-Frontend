import { useState, useEffect, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type Strategy =
  | "LONG_BREAKOUT" | "LONG_PULLBACK"
  | "SHORT_BREAKDOWN" | "SHORT_PULLBACK"
  | "RANGE_LONG" | "RANGE_SHORT"
  | "AVOID";
type Direction  = "LONG" | "SHORT";
type Confidence = "HIGH" | "MEDIUM" | "LOW";
type TrendBias  = "BULLISH" | "BEARISH" | "NEUTRAL";

interface TradePlan {
  symbol: string;
  ltp: number;
  direction: Direction;
  strategy: Strategy;
  confidence: Confidence;
  trend_bias: TrendBias;
  entry_low: number;
  entry_high: number;
  target1: number;
  target2: number;
  stop_loss: number;
  risk_reward: number;
  orb_high: number;
  orb_low: number;
  rfactor_score: number;
  vwap: number | null;
  rsi: number | null;
  delivery_pct: number | null;
  reasons: string[];
}

interface PlannerApiResponse {
  plans: TradePlan[];
  last_updated: string;
  long_count: number;
  short_count: number;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK: PlannerApiResponse = {
  last_updated: "14:35:00",
  long_count: 5,
  short_count: 2,
  plans: [
    {
      symbol: "RELIANCE", ltp: 2840, direction: "LONG", strategy: "LONG_BREAKOUT", confidence: "HIGH",
      trend_bias: "BULLISH", entry_low: 2850, entry_high: 2870, target1: 2920, target2: 2980,
      stop_loss: 2800, risk_reward: 2.5, orb_high: 2860, orb_low: 2810, rfactor_score: 78,
      vwap: 2845, rsi: 64, delivery_pct: 58,
      reasons: ["Above VWAP", "OI: Long Buildup", "2.4x Volume", "RSI 64"],
    },
    {
      symbol: "ICICIBANK", ltp: 1340, direction: "LONG", strategy: "LONG_BREAKOUT", confidence: "HIGH",
      trend_bias: "BULLISH", entry_low: 1345, entry_high: 1360, target1: 1400, target2: 1440,
      stop_loss: 1310, risk_reward: 2.1, orb_high: 1352, orb_low: 1318, rfactor_score: 74,
      vwap: 1338, rsi: 61, delivery_pct: 52,
      reasons: ["PCR Bullish", "Above ORB High", "Sector LONG", "Vol Surge"],
    },
    {
      symbol: "MARUTI", ltp: 11410, direction: "LONG", strategy: "LONG_PULLBACK", confidence: "HIGH",
      trend_bias: "BULLISH", entry_low: 11320, entry_high: 11380, target1: 11550, target2: 11700,
      stop_loss: 11200, risk_reward: 2.3, orb_high: 11420, orb_low: 11250, rfactor_score: 71,
      vwap: 11360, rsi: 57, delivery_pct: null,
      reasons: ["Pulled back to VWAP", "Support at ORB Low", "AUTO sector UP"],
    },
    {
      symbol: "TCS", ltp: 4195, direction: "LONG", strategy: "RANGE_LONG", confidence: "MEDIUM",
      trend_bias: "NEUTRAL", entry_low: 4160, entry_high: 4200, target1: 4260, target2: 4300,
      stop_loss: 4120, risk_reward: 1.6, orb_high: 4210, orb_low: 4162, rfactor_score: 65,
      vwap: 4190, rsi: 52, delivery_pct: 44,
      reasons: ["Consolidation range", "Average volume", "IT sector neutral"],
    },
    {
      symbol: "INFY", ltp: 1862, direction: "LONG", strategy: "LONG_BREAKOUT", confidence: "HIGH",
      trend_bias: "BULLISH", entry_low: 1870, entry_high: 1880, target1: 1940, target2: 1980,
      stop_loss: 1830, risk_reward: 2.8, orb_high: 1875, orb_low: 1840, rfactor_score: 82,
      vwap: 1855, rsi: 67, delivery_pct: 61,
      reasons: ["52W High proximity", "3.1x Volume", "IT sector LONG", "RSI 67"],
    },
    {
      symbol: "DRREDDY", ltp: 1220, direction: "SHORT", strategy: "SHORT_PULLBACK", confidence: "MEDIUM",
      trend_bias: "BEARISH", entry_low: 1230, entry_high: 1248, target1: 1180, target2: 1140,
      stop_loss: 1270, risk_reward: 1.9, orb_high: 1255, orb_low: 1215, rfactor_score: 44,
      vwap: 1240, rsi: 38, delivery_pct: null,
      reasons: ["Bounce to VWAP", "PHARMA weak", "Short OI buildup"],
    },
    {
      symbol: "BAJFINANCE", ltp: 7100, direction: "SHORT", strategy: "SHORT_BREAKDOWN", confidence: "HIGH",
      trend_bias: "BEARISH", entry_low: 7000, entry_high: 7050, target1: 6850, target2: 6700,
      stop_loss: 7200, risk_reward: 2.1, orb_high: 7180, orb_low: 6980, rfactor_score: 38,
      vwap: 7090, rsi: 32, delivery_pct: 70,
      reasons: ["Below VWAP", "OI Short Buildup", "Broke ORB Low", "RSI Weak"],
    },
    {
      symbol: "AXISBANK", ltp: 1210, direction: "LONG", strategy: "LONG_BREAKOUT", confidence: "MEDIUM",
      trend_bias: "BULLISH", entry_low: 1215, entry_high: 1225, target1: 1270, target2: 1310,
      stop_loss: 1190, risk_reward: 2.0, orb_high: 1220, orb_low: 1195, rfactor_score: 68,
      vwap: 1208, rsi: 59, delivery_pct: 48,
      reasons: ["Above ORB High", "Banking sector GREEN", "OI short cover"],
    },
    {
      symbol: "AVOID_EXAMPLE", ltp: 500, direction: "LONG", strategy: "AVOID", confidence: "LOW",
      trend_bias: "NEUTRAL", entry_low: 0, entry_high: 0, target1: 0, target2: 0,
      stop_loss: 0, risk_reward: 0.5, orb_high: 510, orb_low: 490, rfactor_score: 28,
      vwap: null, rsi: null, delivery_pct: null,
      reasons: ["Conflicting signals", "Low R-Factor"],
    },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

const safe = (v: unknown, d = 2) => {
  const n = parseFloat(v as string);
  return isNaN(n) ? "--" : n.toFixed(d);
};

/** Safe price formatter — guards against undefined/null fields */
const fmt = (v: unknown) => {
  const n = parseFloat(v as string);
  return isNaN(n) ? "--" : n.toLocaleString("en-IN");
};

// ── API normalizer — maps real API field names to internal interface ────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePlan(p: any): TradePlan {
  const dir: Direction = p.direction === "SHORT" ? "SHORT" : "LONG";
  return {
    symbol:        p.symbol        ?? "",
    ltp:           p.ltp           ?? 0,
    direction:     dir,
    strategy:      p.strategy      ?? "AVOID",
    confidence:    p.confidence    ?? "LOW",
    trend_bias:    p.trend_bias    ?? "NEUTRAL",
    // Support entry_zone_low / entry_low / entry_zone array
    entry_low:     p.entry_zone_low  ?? p.entry_low  ?? (Array.isArray(p.entry_zone) ? p.entry_zone[0] : 0),
    entry_high:    p.entry_zone_high ?? p.entry_high ?? (Array.isArray(p.entry_zone) ? p.entry_zone[1] : 0),
    // Support target_1 / target1
    target1:       p.target_1 ?? p.target1 ?? 0,
    target2:       p.target_2 ?? p.target2 ?? 0,
    stop_loss:     p.stop_loss   ?? 0,
    risk_reward:   p.risk_reward ?? p.rr ?? 0,
    orb_high:      p.orb_high   ?? 0,
    orb_low:       p.orb_low    ?? 0,
    rfactor_score: p.rfactor_score ?? 0,
    vwap:          p.vwap          ?? null,
    rsi:           p.rsi           ?? null,
    delivery_pct:  p.delivery_pct  ?? null,
    reasons:       Array.isArray(p.reasons) ? p.reasons : [],
  };
}

function isMarketHours(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 && mins <= 15 * 60 + 30;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Badge configs ──────────────────────────────────────────────────────────

const STRATEGY_CFG: Record<Strategy, { bg: string; color: string }> = {
  LONG_BREAKOUT:   { bg: "#0d2137", color: "#2979FF" },
  LONG_PULLBACK:   { bg: "#0d1f10", color: "#69F0AE" },
  SHORT_BREAKDOWN: { bg: "#2a0808", color: "#FF5252" },
  SHORT_PULLBACK:  { bg: "#2a1200", color: "#FF6D00" },
  RANGE_LONG:      { bg: "#1a0a2e", color: "#CE93D8" },
  RANGE_SHORT:     { bg: "#1a0a1e", color: "#F48FB1" },
  AVOID:           { bg: "#2a0000", color: "#FF1744" },
};

const CONFIDENCE_CFG: Record<Confidence, { bg: string; color: string }> = {
  HIGH:   { bg: "#00C85322", color: "#00C853" },
  MEDIUM: { bg: "#FFD60022", color: "#FFD600" },
  LOW:    { bg: "#33333322", color: "#888" },
};

const TREND_CFG: Record<TrendBias, { icon: string; color: string }> = {
  BULLISH: { icon: "↑", color: "#00C853" },
  BEARISH: { icon: "↓", color: "#FF1744" },
  NEUTRAL: { icon: "→", color: "#888" },
};

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ backgroundColor: bg, color, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.3px", border: `1px solid ${color}33`, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

// ── Trade Plan Card ────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: TradePlan }) {
  const stratCfg = STRATEGY_CFG[plan.strategy] ?? { bg: "#1a1a1a", color: "#888" };
  const confCfg = CONFIDENCE_CFG[plan.confidence];
  const trendCfg = TREND_CFG[plan.trend_bias];
  const rrColor = plan.risk_reward >= 2 ? "#00C853" : plan.risk_reward >= 1 ? "#FFD600" : "#FF1744";
  const isAvoid = plan.strategy === "AVOID";
  const isShort = plan.direction === "SHORT";
  const accentColor = isAvoid ? "#FF1744" : isShort ? "#FF1744" : "#00C853";

  // For SHORT: entry is at the HIGH of the zone; price moves down to targets
  const entryDisplay = isShort
    ? `₹${fmt(plan.entry_high)} (sell at high)`
    : `₹${fmt(plan.entry_low)} — ₹${fmt(plan.entry_high)}`;

  return (
    <div style={{
      backgroundColor: "#1a1a1a",
      border: `1px solid ${isAvoid ? "#4a0000" : isShort ? "#3a1212" : "#2a2a2a"}`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: "10px",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* Direction badge */}
        <span style={{
          backgroundColor: isShort ? "#3a0808" : "#083a08",
          color: isShort ? "#FF5252" : "#69F0AE",
          fontWeight: 700, fontSize: "11px",
          padding: "2px 8px", borderRadius: "4px",
          border: `1px solid ${isShort ? "#FF525244" : "#69F0AE44"}`,
        }}>
          {isShort ? "▼ SHORT" : "▲ LONG"}
        </span>
        <span style={{ color: "#fff", fontWeight: "bold", fontSize: "15px" }}>{plan.symbol}</span>
        <span style={{ color: "#aaa", fontSize: "12px" }}>₹{fmt(plan.ltp)}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <Badge text={plan.strategy} bg={stratCfg.bg} color={stratCfg.color} />
          <Badge text={plan.confidence} bg={confCfg.bg} color={confCfg.color} />
        </div>
      </div>

      {/* Trend bias + meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ color: trendCfg.color, fontWeight: "bold", fontSize: "12px" }}>
          {trendCfg.icon} {plan.trend_bias}
        </span>
        {plan.rsi != null && (
          <span style={{ color: "#888", fontSize: "11px" }}>RSI <span style={{ color: plan.rsi >= 60 ? "#FF9800" : plan.rsi <= 40 ? "#42A5F5" : "#aaa" }}>{plan.rsi.toFixed(0)}</span></span>
        )}
        {plan.vwap != null && (
          <span style={{ color: "#888", fontSize: "11px" }}>VWAP <span style={{ color: plan.ltp >= plan.vwap ? "#69F0AE" : "#FF5252" }}>₹{fmt(plan.vwap)}</span></span>
        )}
        {plan.delivery_pct != null && (
          <span style={{ color: "#888", fontSize: "11px" }}>Del <span style={{ color: "#aaa" }}>{plan.delivery_pct.toFixed(0)}%</span></span>
        )}
        <span style={{ marginLeft: "auto", color: "#666", fontSize: "11px" }}>RF: <span style={{ color: "#aaa" }}>{plan.rfactor_score}</span></span>
      </div>

      {isAvoid ? (
        <div style={{ backgroundColor: "#1a0000", border: "1px solid #4a0000", borderRadius: "6px", padding: "10px", color: "#FF8A80", fontSize: "12px", textAlign: "center" }}>
          ⛔ AVOID — No clean setup today
        </div>
      ) : (
        <>
          {/* Entry zone */}
          <div style={{ backgroundColor: isShort ? "#1a0d0d" : "#0d1a0d", border: `1px solid ${isShort ? "#3a1a1a" : "#1a3a1a"}`, borderRadius: "6px", padding: "8px 12px" }}>
            <div style={{ color: "#888", fontSize: "10px", marginBottom: "3px" }}>ENTRY ZONE{isShort ? " (SHORT — sell at high)" : ""}</div>
            <div style={{ color: isShort ? "#FF8A80" : "#69F0AE", fontWeight: "bold", fontSize: "14px" }}>
              {entryDisplay}
            </div>
          </div>

          {/* Targets + SL */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1, backgroundColor: "#0d1a0d", borderRadius: "6px", padding: "8px 10px", border: "1px solid #1a3a1a" }}>
              <div style={{ color: "#888", fontSize: "10px", marginBottom: "2px" }}>TARGET 1</div>
              <div style={{ color: "#00C853", fontWeight: "bold", fontSize: "13px" }}>₹{fmt(plan.target1)}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#0d1a0d", borderRadius: "6px", padding: "8px 10px", border: "1px solid #1a3a1a" }}>
              <div style={{ color: "#888", fontSize: "10px", marginBottom: "2px" }}>TARGET 2</div>
              <div style={{ color: "#00C853", fontWeight: "bold", fontSize: "13px" }}>₹{fmt(plan.target2)}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#1a0d0d", borderRadius: "6px", padding: "8px 10px", border: "1px solid #3a1a1a" }}>
              <div style={{ color: "#888", fontSize: "10px", marginBottom: "2px" }}>STOP LOSS</div>
              <div style={{ color: "#FF5252", fontWeight: "bold", fontSize: "13px" }}>₹{fmt(plan.stop_loss)}</div>
            </div>
          </div>

          {/* RR + ORB */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ color: "#888", fontSize: "11px" }}>Risk/Reward: </span>
              <span style={{ color: rrColor, fontWeight: "bold", fontSize: "12px" }}>1:{safe(plan.risk_reward, 1)}</span>
            </div>
            <div style={{ color: "#555", fontSize: "11px" }}>
              ORB H: <span style={{ color: "#FF9800" }}>₹{fmt(plan.orb_high)}</span>
              {"  "}L: <span style={{ color: "#42A5F5" }}>₹{fmt(plan.orb_low)}</span>
            </div>
          </div>
        </>
      )}

      {/* Reasons */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {plan.reasons.map((r) => (
          <span key={r} style={{ backgroundColor: "#1e1e1e", color: "#aaa", fontSize: "10px", padding: "2px 7px", borderRadius: "4px", border: "1px solid #333" }}>
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #222", borderRadius: "10px", padding: "14px", height: "240px", animation: "plannerPulse 1.4s ease-in-out infinite" }} />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function TradePlannerTab() {
  const [data, setData] = useState<PlannerApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [dirFilter, setDirFilter] = useState<Direction | "ALL">("ALL");
  const [stratFilter, setStratFilter] = useState<Strategy | "ALL">("ALL");
  const [confFilter, setConfFilter] = useState<Confidence | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function doFetch(dir?: Direction | "ALL") {
    const qs = dir && dir !== "ALL" ? `?direction=${dir}` : "";
    apiFetch(`/trade-plan/bulk${qs}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: unknown) => {
        const raw = d as { plans?: unknown[]; last_updated?: string; long_count?: number; short_count?: number };
        const normalized: PlannerApiResponse = {
          plans:       Array.isArray(raw.plans) ? raw.plans.map(normalizePlan) : [],
          last_updated: raw.last_updated ?? "",
          long_count:  raw.long_count  ?? 0,
          short_count: raw.short_count ?? 0,
        };
        setData(normalized); setIsOffline(false);
        setLastUpdated(fmtTime(new Date())); setLoading(false);
      })
      .catch(() => {
        setData(MOCK); setIsOffline(true);
        setLastUpdated(fmtTime(new Date())); setLoading(false);
      });
  }

  useEffect(() => {
    doFetch(dirFilter);
    if (isMarketHours()) {
      intervalRef.current = setInterval(() => doFetch(dirFilter), 5 * 60 * 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirFilter]);

  const plans = data?.plans ?? [];

  const filtered = useMemo(() => {
    return plans
      .filter((p) => dirFilter === "ALL" || p.direction === dirFilter)
      .filter((p) => stratFilter === "ALL" || p.strategy === stratFilter)
      .filter((p) => confFilter === "ALL" || p.confidence === confFilter)
      .filter((p) => !search || p.symbol.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const confOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        const cd = confOrder[a.confidence] - confOrder[b.confidence];
        if (cd !== 0) return cd;
        return b.rfactor_score - a.rfactor_score;
      });
  }, [plans, dirFilter, stratFilter, confFilter, search]);

  const inputStyle: React.CSSProperties = {
    padding: "5px 10px", background: "#2a2a2a", color: "#fff",
    border: "1px solid #444", borderRadius: "6px", fontSize: "12px",
    outline: "none", colorScheme: "dark" as React.CSSProperties["colorScheme"],
  };
  const btnBase: React.CSSProperties = {
    padding: "4px 12px", fontSize: "11px", fontWeight: 600,
    borderRadius: "6px", border: "1px solid #333",
    cursor: "pointer", backgroundColor: "#1a1a1a", color: "#888",
  };
  const btnActive: React.CSSProperties = { ...btnBase, backgroundColor: "#1565C0", border: "1px solid #2979FF", color: "#fff" };

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      <style>{`@keyframes plannerPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", backgroundColor: "#111", borderBottom: "1px solid #222", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ color: "#ccc", fontSize: "13px", fontWeight: "bold" }}>📋 Trade Planner</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isOffline && (
            <span style={{ color: "#FFD600", fontSize: "11px", backgroundColor: "#1a1400", border: "1px solid #5a4400", padding: "3px 10px", borderRadius: "6px" }}>
              ⚠️ Backend offline — mock data
            </span>
          )}
          {data && (
            <span style={{ color: "#555", fontSize: "11px" }}>
              <span style={{ color: "#69F0AE" }}>▲ {data.long_count} long</span>
              {" / "}
              <span style={{ color: "#FF5252" }}>▼ {data.short_count} short</span>
              {" · "}
              <span style={{ color: "#888" }}>showing {filtered.length}</span>
            </span>
          )}
          {lastUpdated && <span style={{ color: "#444", fontSize: "11px" }}>Last updated: {lastUpdated}</span>}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "#0f0f0f", borderBottom: "1px solid #1e1e1e", flexWrap: "wrap" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: "150px" }}
        />

        <div style={{ width: "1px", height: "20px", backgroundColor: "#333" }} />

        {/* Direction */}
        <span style={{ color: "#555", fontSize: "11px" }}>DIRECTION:</span>
        {(["ALL", "LONG", "SHORT"] as const).map((d) => {
          const isActive = dirFilter === d;
          const activeStyle: React.CSSProperties =
            d === "LONG"  ? { ...btnBase, backgroundColor: "#1B5E20", borderColor: "#00C853", color: "#69F0AE" } :
            d === "SHORT" ? { ...btnBase, backgroundColor: "#4a0000", borderColor: "#FF5252", color: "#FF8A80" } :
                            btnActive;
          return (
            <button key={d} style={isActive ? activeStyle : btnBase} onClick={() => setDirFilter(d)}>
              {d === "LONG" ? "▲ LONG" : d === "SHORT" ? "▼ SHORT" : d}
            </button>
          );
        })}

        <div style={{ width: "1px", height: "20px", backgroundColor: "#333" }} />

        {/* Strategy */}
        <span style={{ color: "#555", fontSize: "11px" }}>STRATEGY:</span>
        {(["ALL", "LONG_BREAKOUT", "LONG_PULLBACK", "SHORT_BREAKDOWN", "SHORT_PULLBACK", "RANGE_LONG", "RANGE_SHORT"] as const).map((s) => (
          <button key={s} style={stratFilter === s ? btnActive : btnBase} onClick={() => setStratFilter(s)}>
            {s.replace("_", " ")}
          </button>
        ))}

        <div style={{ width: "1px", height: "20px", backgroundColor: "#333" }} />

        {/* Confidence */}
        <span style={{ color: "#555", fontSize: "11px" }}>CONFIDENCE:</span>
        {(["ALL", "HIGH", "MEDIUM"] as const).map((c) => (
          <button key={c} style={confFilter === c ? { ...btnActive, ...(c === "HIGH" ? { backgroundColor: "#1B5E20", borderColor: "#00C853" } : c === "MEDIUM" ? { backgroundColor: "#5a4400", borderColor: "#FFD600" } : {}) } : btnBase} onClick={() => setConfFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ padding: "14px 16px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh", color: "#555", fontSize: "14px" }}>
            No trade setups found for the selected filters.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {filtered.map((p) => <PlanCard key={p.symbol} plan={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
