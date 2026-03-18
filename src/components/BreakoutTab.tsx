import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";

const safe = (val: unknown, dec = 2): string => {
  const n = parseFloat(val as string);
  return isNaN(n) ? "--" : n.toFixed(dec);
};

interface BreakoutStock {
  symbol: string;
  ltp?: number;
  change_pct?: number;
  volume_ratio?: number;
  rsi?: number;
  fo?: boolean;
  breakout_score?: number;
  breakout_type?: string;
  signals?: string[];
  ath_proximity?: number;
  week52_high?: number;
  resistance_level?: number;
  relative_strength?: number;
  rfactor?: number;
  direction?: string;
}

type DirFilter = "ALL" | "LONG" | "SHORT";
type TypeFilter =
  | "ALL"
  | "EXPLOSIVE"
  | "STRONG"
  | "MODERATE"
  | "STRONG_SHORT"
  | "MODERATE_SHORT"
  | "WATCH_SHORT";

function getTypeStyle(
  type: string | undefined,
  direction: string | undefined
): { bg: string; color: string; label: string } {
  const t = (type || "").toUpperCase();
  const d = (direction || "LONG").toUpperCase();
  if (d === "SHORT") {
    if (t === "STRONG_SHORT" || t === "STRONG") return { bg: "#B71C1C", color: "#ffffff", label: "🔴 SHORT" };
    if (t === "MODERATE_SHORT" || t === "MODERATE") return { bg: "#E53935", color: "#ffffff", label: "🟠 SHORT" };
    if (t === "WATCH_SHORT") return { bg: "#FF7043", color: "#ffffff", label: "👀 WATCH" };
    return { bg: "#B71C1C", color: "#ffffff", label: "SHORT" };
  }
  if (t === "EXPLOSIVE") return { bg: "#FF6B00", color: "#ffffff", label: "EXPLOSIVE" };
  if (t === "STRONG") return { bg: "#00C853", color: "#000000", label: "STRONG" };
  if (t === "MODERATE") return { bg: "#FFD600", color: "#000000", label: "MODERATE" };
  return { bg: "#333333", color: "#cccccc", label: t || "LONG" };
}

function BreakoutCard({ stock }: { stock: BreakoutStock }) {
  const isShort = (stock.direction || "LONG").toUpperCase() === "SHORT";
  const isPositive = (stock.change_pct ?? 0) >= 0;
  const scorePct = Math.min(((stock.breakout_score ?? 0) / 15) * 100, 100);
  const typeStyle = getTypeStyle(stock.breakout_type, stock.direction);
  const barColor = isShort ? "#F44336" : scorePct >= 66 ? "#00C853" : scorePct >= 40 ? "#FFD600" : "#FF6B00";
  const chipBg = isShort ? "#4a1010" : "#0d2137";
  const chipText = isShort ? "#FF8A80" : "#82B1FF";
  const chipBorder = isShort ? "#6a2020" : "#1a3a5a";

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderLeft: `4px solid ${isShort ? "#F44336" : "#00C853"}`,
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Line 1: Symbol + type badge + FO badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "15px" }}>
          {stock.symbol}
        </span>
        {stock.breakout_type && (
          <span
            style={{
              backgroundColor: typeStyle.bg,
              color: typeStyle.color,
              fontSize: "10px",
              fontWeight: "bold",
              padding: "2px 7px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
            }}
          >
            {typeStyle.label}
          </span>
        )}
        {stock.fo && (
          <span
            style={{
              backgroundColor: "#1565C0",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "2px 7px",
              borderRadius: "4px",
            }}
          >
            F&O
          </span>
        )}
      </div>

      {/* Line 2: LTP | change | volume */}
      <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#aaaaaa" }}>
        <span style={{ color: "#dddddd" }}>₹{safe(stock.ltp, 2)}</span>
        <span style={{ color: isPositive ? "#00C853" : "#F44336", fontWeight: 600 }}>
          {isPositive ? "▲ +" : "▼ "}
          {safe(stock.change_pct, 2)}%
        </span>
        <span>Vol {safe(stock.volume_ratio, 2)}x</span>
      </div>

      {/* Line 3: Score progress bar */}
      <div>
        <div
          style={{
            height: "6px",
            backgroundColor: "#2a2a2a",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${scorePct}%`,
              backgroundColor: barColor,
              borderRadius: "3px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div style={{ color: "#888888", fontSize: "11px", marginTop: "3px" }}>
          Score: {safe(stock.breakout_score, 1)}/15
        </div>
      </div>

      {/* Line 4: Signal chips */}
      {stock.signals && stock.signals.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {stock.signals.map((sig, i) => (
            <span
              key={i}
              style={{
                backgroundColor: chipBg,
                color: chipText,
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "20px",
                border: `1px solid ${chipBorder}`,
                whiteSpace: "nowrap",
              }}
            >
              {sig}
            </span>
          ))}
        </div>
      )}

      {/* Line 5: Stats row */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          fontSize: "11px",
          color: "#888888",
          flexWrap: "wrap",
        }}
      >
        <span>
          RSI:{" "}
          <span style={{ color: "#cccccc" }}>{safe(stock.rsi, 1)}</span>
        </span>
        <span>
          52W Proximity:{" "}
          <span style={{ color: "#cccccc" }}>{safe(stock.ath_proximity, 1)}%</span>
        </span>
        <span>
          Resist:{" "}
          <span style={{ color: "#cccccc" }}>₹{safe(stock.resistance_level, 2)}</span>
        </span>
      </div>
    </div>
  );
}

export function BreakoutTab({ refreshTrigger }: { refreshTrigger?: number }) {
  const [breakouts, setBreakouts] = useState<BreakoutStock[]>([]);
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [dirFilter, setDirFilter] = useState<DirFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  // Defined as a plain function; only calls stable state setters so stale-closure
  // risk is minimal even when captured by setTimeout/setInterval.
  function doFetch() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    apiFetch("/breakout", { signal: controller.signal })
      .then((r) => {
        clearTimeout(timeout);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setBreakouts(d.breakouts || []);
        setIsBackendLoading(!!d.is_loading);
        setLastUpdated(d.last_updated || "");
        setInitialFetchDone(true);
        setError("");
      })
      .catch((err) => {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          setError("Backend is taking too long. Will retry automatically.");
          setInitialFetchDone(true);
          setTimeout(doFetch, 15000);
        } else {
          setError(`Backend error: ${err.message}. Make sure the server is running.`);
          setInitialFetchDone(true);
        }
      });
  }

  // Initial fetch + re-fetch on refreshTrigger
  useEffect(() => {
    setInitialFetchDone(false);
    setError("");
    doFetch();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 5 s while the backend is still computing
  useEffect(() => {
    if (isBackendLoading) {
      const interval = setInterval(doFetch, 5000);
      return () => clearInterval(interval);
    }
  }, [isBackendLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helpers
  const isLong = (s: BreakoutStock) => (s.direction || "LONG").toUpperCase() === "LONG";
  const isShortStock = (s: BreakoutStock) => (s.direction || "LONG").toUpperCase() === "SHORT";
  const matchesType = (s: BreakoutStock, t: TypeFilter) => {
    if (t === "ALL") return true;
    const bt = (s.breakout_type || "").toUpperCase();
    if (t === "STRONG_SHORT") return bt === "STRONG_SHORT" || bt === "STRONG";
    if (t === "MODERATE_SHORT") return bt === "MODERATE_SHORT" || bt === "MODERATE";
    return bt === t;
  };

  const filtered = useMemo(() => {
    return breakouts
      .filter((s) => {
        if (dirFilter === "LONG") return isLong(s);
        if (dirFilter === "SHORT") return isShortStock(s);
        return true;
      })
      .filter((s) => matchesType(s, typeFilter))
      .slice()
      .sort((a, b) => (b.breakout_score ?? 0) - (a.breakout_score ?? 0));
  }, [breakouts, dirFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const longs = useMemo(() => breakouts.filter(isLong), [breakouts]); // eslint-disable-line react-hooks/exhaustive-deps
  const shorts = useMemo(() => breakouts.filter(isShortStock), [breakouts]); // eslint-disable-line react-hooks/exhaustive-deps

  const pool = dirFilter === "LONG" ? longs : dirFilter === "SHORT" ? shorts : breakouts;

  // Counts for type-filter row
  const typeCounts: Record<TypeFilter, number> = useMemo(() => ({
    ALL: pool.length,
    EXPLOSIVE: pool.filter((s) => (s.breakout_type || "").toUpperCase() === "EXPLOSIVE").length,
    STRONG: pool.filter((s) => (s.breakout_type || "").toUpperCase() === "STRONG").length,
    MODERATE: pool.filter((s) => (s.breakout_type || "").toUpperCase() === "MODERATE").length,
    STRONG_SHORT: shorts.filter((s) => { const t = (s.breakout_type || "").toUpperCase(); return t === "STRONG_SHORT" || t === "STRONG"; }).length,
    MODERATE_SHORT: shorts.filter((s) => { const t = (s.breakout_type || "").toUpperCase(); return t === "MODERATE_SHORT" || t === "MODERATE"; }).length,
    WATCH_SHORT: shorts.filter((s) => (s.breakout_type || "").toUpperCase() === "WATCH_SHORT").length,
  }), [pool, shorts]); // eslint-disable-line react-hooks/exhaustive-deps

  const DIR_OPTIONS: { key: DirFilter; label: string }[] = [
    { key: "ALL", label: "ALL" },
    { key: "LONG", label: "📈 LONG" },
    { key: "SHORT", label: "📉 SHORT" },
  ];

  const TYPE_OPTIONS_LONG: { key: TypeFilter; label: string }[] = [
    { key: "ALL", label: "ALL" },
    { key: "EXPLOSIVE", label: "🚀 EXPLOSIVE" },
    { key: "STRONG", label: "✅ STRONG" },
    { key: "MODERATE", label: "🟡 MODERATE" },
  ];

  const TYPE_OPTIONS_SHORT: { key: TypeFilter; label: string }[] = [
    { key: "ALL", label: "ALL" },
    { key: "STRONG_SHORT", label: "🔴 STRONG SHORT" },
    { key: "MODERATE_SHORT", label: "🟠 MODERATE SHORT" },
    { key: "WATCH_SHORT", label: "👀 WATCH SHORT" },
  ];

  const typeOptions = dirFilter === "SHORT" ? TYPE_OPTIONS_SHORT : TYPE_OPTIONS_LONG;

  // ── Loading states ────────────────────────────────────────────────────────

  // Before the first response arrives
  if (!initialFetchDone && !error)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          color: "#2979FF",
          fontSize: "16px",
        }}
      >
        ⏳ Loading Breakout data...
      </div>
    );

  // Hard error with no cached data
  if (error && breakouts.length === 0)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span style={{ color: "#F44336", fontSize: "16px" }}>❌ {error}</span>
      </div>
    );

  // Backend still scanning & no data yet — pulsing hint (tab switching still works)
  if (isBackendLoading && breakouts.length === 0)
    return (
      <>
        <style>{`@keyframes bpulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
            gap: "12px",
          }}
        >
          <span
            style={{
              color: "#888888",
              fontSize: "16px",
              animation: "bpulse 2s ease-in-out infinite",
            }}
          >
            ⏳ Scanning stocks for breakouts... (first load takes ~30s)
          </span>
        </div>
      </>
    );

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      {/* Background-refresh banner (data present but backend still updating) */}
      {isBackendLoading && breakouts.length > 0 && (
        <div
          style={{
            backgroundColor: "#161616",
            borderBottom: "1px solid #222222",
            padding: "5px 16px",
            color: "#555555",
            fontSize: "12px",
          }}
        >
          🔄 Refreshing in background...
        </div>
      )}

      {/* Filter Bar — Row 1: Direction */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px 0 16px",
          backgroundColor: "#111111",
          flexWrap: "wrap",
        }}
      >
        {DIR_OPTIONS.map(({ key, label }) => {
          const isActive = dirFilter === key;
          const accentColor = key === "SHORT" ? "#F44336" : key === "LONG" ? "#00C853" : "#2979FF";
          const count = key === "ALL" ? breakouts.length : key === "LONG" ? longs.length : shorts.length;
          return (
            <button
              key={key}
              onClick={() => { setDirFilter(key); setTypeFilter("ALL"); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "6px 6px 0 0",
                border: `1px solid ${isActive ? accentColor : "#2a2a2a"}`,
                borderBottom: isActive ? "1px solid #111111" : "1px solid #2a2a2a",
                backgroundColor: isActive ? "#161616" : "#1a1a1a",
                color: isActive ? accentColor : "#888888",
                fontSize: "12px",
                fontWeight: isActive ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              {label}
              <span
                style={{
                  backgroundColor: isActive ? accentColor : "#2a2a2a",
                  color: isActive ? "#ffffff" : "#888888",
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        {lastUpdated && (
          <span style={{ marginLeft: "auto", color: "#444444", fontSize: "11px" }}>
            Updated {lastUpdated}
          </span>
        )}
      </div>

      {/* Filter Bar — Row 2: Type */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#111111",
          borderBottom: "1px solid #222222",
          flexWrap: "wrap",
        }}
      >
        {typeOptions.map(({ key, label }) => {
          const isActive = typeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "6px",
                border: isActive ? "1px solid #2979FF" : "1px solid #222222",
                backgroundColor: isActive ? "#1a2a4a" : "#161616",
                color: isActive ? "#2979FF" : "#666666",
                fontSize: "11px",
                fontWeight: isActive ? "bold" : "normal",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {label}
              <span
                style={{
                  backgroundColor: isActive ? "#2979FF" : "#222222",
                  color: isActive ? "#ffffff" : "#666666",
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                }}
              >
                {typeCounts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            color: "#555555",
            fontSize: "16px",
          }}
        >
          No breakout stocks found today
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "12px",
            padding: "16px",
          }}
        >
          {filtered.map((stock) => (
            <BreakoutCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
