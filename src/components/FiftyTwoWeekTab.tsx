import { useState, useEffect, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type BreakoutType = "AT_HIGH" | "ABOVE_HIGH";
type Strength = "STRONG" | "MODERATE";

interface W52Stock {
  symbol: string;
  sector: string;
  ltp: number;
  week52_high: number;
  pct_from_high: number;   // negative = below high, 0 = at, positive = above
  volume_ratio: number;
  breakout_type: BreakoutType;
  strength: Strength;
  rfactor: number;
}

interface W52Response {
  stocks: W52Stock[];
  last_updated: string;
  scan_date: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK: W52Response = {
  scan_date: "2026-03-04",
  last_updated: "14:35:00",
  stocks: [
    { symbol: "INFY",       sector: "IT",            ltp: 1862, week52_high: 1880, pct_from_high: -0.96, volume_ratio: 3.1, breakout_type: "AT_HIGH",    strength: "STRONG",   rfactor: 82 },
    { symbol: "RELIANCE",   sector: "ENERGY",        ltp: 2855, week52_high: 2840, pct_from_high:  0.53, volume_ratio: 2.4, breakout_type: "ABOVE_HIGH", strength: "STRONG",   rfactor: 78 },
    { symbol: "ICICIBANK",  sector: "BANKING",       ltp: 1345, week52_high: 1352, pct_from_high: -0.52, volume_ratio: 2.8, breakout_type: "AT_HIGH",    strength: "STRONG",   rfactor: 74 },
    { symbol: "TIINDIA",    sector: "AUTO",          ltp: 2870, week52_high: 2860, pct_from_high:  0.35, volume_ratio: 2.1, breakout_type: "ABOVE_HIGH", strength: "MODERATE", rfactor: 71 },
    { symbol: "MUTHOOTFIN", sector: "FINANCE",       ltp: 1855, week52_high: 1860, pct_from_high: -0.27, volume_ratio: 3.5, breakout_type: "AT_HIGH",    strength: "STRONG",   rfactor: 76 },
    { symbol: "KEI",        sector: "INFRA",         ltp: 3820, week52_high: 3810, pct_from_high:  0.26, volume_ratio: 2.2, breakout_type: "ABOVE_HIGH", strength: "MODERATE", rfactor: 68 },
    { symbol: "NATIONALUM", sector: "METALS",        ltp: 368,  week52_high: 370,  pct_from_high: -0.54, volume_ratio: 2.7, breakout_type: "AT_HIGH",    strength: "STRONG",   rfactor: 65 },
    { symbol: "HAL",        sector: "DEFENCE",       ltp: 4235, week52_high: 4230, pct_from_high:  0.12, volume_ratio: 2.0, breakout_type: "ABOVE_HIGH", strength: "MODERATE", rfactor: 63 },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

const safe = (v: unknown, d = 2) => {
  const n = parseFloat(v as string);
  return isNaN(n) ? "--" : n.toFixed(d);
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function SkeletonRow() {
  const pulse: React.CSSProperties = { backgroundColor: "#1e1e1e", borderRadius: "4px", animation: "w52Pulse 1.4s ease-in-out infinite" };
  return (
    <tr>
      {[120, 80, 90, 80, 80, 80, 80, 60].map((w, i) => (
        <td key={i} style={{ padding: "10px 8px", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ ...pulse, width: `${w}px`, height: "12px" }} />
        </td>
      ))}
    </tr>
  );
}

// ── Badge components ───────────────────────────────────────────────────────

function TypeBadge({ type }: { type: BreakoutType }) {
  const cfg =
    type === "ABOVE_HIGH"
      ? { bg: "#00C85322", color: "#00C853", border: "#00C85344", label: "▲ ABOVE HIGH" }
      : { bg: "#FFD60022", color: "#FFD600", border: "#FFD60044", label: "≈ AT HIGH" };
  return (
    <span style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

function StrengthBadge({ strength }: { strength: Strength }) {
  const cfg =
    strength === "STRONG"
      ? { bg: "#00C85322", color: "#00C853", border: "#00C85444" }
      : { bg: "#FFD60022", color: "#FFD600", border: "#FFD60044" };
  return (
    <span style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>
      {strength === "STRONG" ? "🔥 STRONG" : "✅ MODERATE"}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function FiftyTwoWeekTab() {
  const [data, setData] = useState<W52Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [strengthFilter, setStrengthFilter] = useState<Strength | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<BreakoutType | "ALL">("ALL");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function doFetch() {
    apiFetch("/52w-breakouts")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: W52Response) => {
        setData(d); setIsOffline(false);
        setLastUpdated(fmtTime(new Date())); setLoading(false);
      })
      .catch(() => {
        setData(MOCK); setIsOffline(true);
        setLastUpdated(fmtTime(new Date())); setLoading(false);
      });
  }

  useEffect(() => {
    doFetch();
    // No auto-refresh: results are cached server-side; user can manually refresh
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const stocks = data?.stocks ?? [];

  const filtered = useMemo(() => {
    return stocks
      .filter((s) => strengthFilter === "ALL" || s.strength === strengthFilter)
      .filter((s) => typeFilter === "ALL" || s.breakout_type === typeFilter)
      .sort((a, b) => {
        const sOrd = { STRONG: 0, MODERATE: 1 };
        const sd = sOrd[a.strength] - sOrd[b.strength];
        return sd !== 0 ? sd : b.volume_ratio - a.volume_ratio;
      });
  }, [stocks, strengthFilter, typeFilter]);

  const thStyle: React.CSSProperties = {
    backgroundColor: "#111", color: "#666", padding: "9px 10px",
    textAlign: "left", borderBottom: "1px solid #2a2a2a",
    fontWeight: 600, whiteSpace: "nowrap", fontSize: "11px",
  };
  const tdStyle: React.CSSProperties = {
    padding: "9px 10px", borderBottom: "1px solid #1a1a1a",
    fontSize: "12px", color: "#ccc", whiteSpace: "nowrap",
  };

  const btnBase: React.CSSProperties = {
    padding: "4px 12px", fontSize: "11px", fontWeight: 600,
    borderRadius: "6px", border: "1px solid #333",
    cursor: "pointer", backgroundColor: "#1a1a1a", color: "#888",
  };
  const btnActive: React.CSSProperties = { ...btnBase, backgroundColor: "#1565C0", border: "1px solid #2979FF", color: "#fff" };

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      <style>{`@keyframes w52Pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", backgroundColor: "#111", borderBottom: "1px solid #222", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div style={{ color: "#ccc", fontSize: "13px", fontWeight: "bold" }}>🚀 52-Week High Breakout Scanner</div>
          <div style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>Stocks within 0.5% of 52W High with 2x+ Volume — Institutional Breakouts Only</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isOffline && (
            <span style={{ color: "#FFD600", fontSize: "11px", backgroundColor: "#1a1400", border: "1px solid #5a4400", padding: "3px 10px", borderRadius: "6px" }}>
              ⚠️ Backend offline — mock data
            </span>
          )}
          {lastUpdated && <span style={{ color: "#444", fontSize: "11px" }}>Last updated: {lastUpdated}</span>}
          <button onClick={doFetch} style={{ ...btnBase, padding: "5px 14px" }}>↻ Refresh</button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "#0f0f0f", borderBottom: "1px solid #1e1e1e", flexWrap: "wrap" }}>
        <span style={{ color: "#555", fontSize: "11px" }}>TYPE:</span>
        {(["ALL", "ABOVE_HIGH", "AT_HIGH"] as const).map((f) => (
          <button key={f} style={typeFilter === f ? btnActive : btnBase} onClick={() => setTypeFilter(f)}>
            {f === "ALL" ? "ALL" : f === "ABOVE_HIGH" ? "▲ ABOVE HIGH" : "≈ AT HIGH"}
            <span style={{ marginLeft: "5px", backgroundColor: "#0d0d0d", color: "#aaa", fontSize: "10px", padding: "1px 5px", borderRadius: "3px" }}>
              {f === "ALL" ? stocks.length : stocks.filter((s) => s.breakout_type === f).length}
            </span>
          </button>
        ))}

        <div style={{ width: "1px", height: "20px", backgroundColor: "#333" }} />

        <span style={{ color: "#555", fontSize: "11px" }}>STRENGTH:</span>
        {(["ALL", "STRONG", "MODERATE"] as const).map((f) => (
          <button key={f} style={strengthFilter === f ? btnActive : btnBase} onClick={() => setStrengthFilter(f)}>
            {f}
            <span style={{ marginLeft: "5px", backgroundColor: "#0d0d0d", color: "#aaa", fontSize: "10px", padding: "1px 5px", borderRadius: "3px" }}>
              {f === "ALL" ? stocks.length : stocks.filter((s) => s.strength === f).length}
            </span>
          </button>
        ))}

        <span style={{ marginLeft: "auto", color: "#444", fontSize: "11px" }}>
          Showing {filtered.length} of {stocks.length} breakouts
        </span>
      </div>

      {/* Table */}
      <div style={{ padding: "14px 16px" }}>
        {loading ? (
          <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: "8px" }}>
            <table style={{ borderCollapse: "collapse", minWidth: "900px", width: "100%" }}>
              <tbody>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "40vh", gap: "12px" }}>
            <span style={{ fontSize: "32px" }}>📭</span>
            <span style={{ color: "#555", fontSize: "14px" }}>No institutional breakouts detected today</span>
            <span style={{ color: "#444", fontSize: "12px" }}>Requirements: within 0.5% of 52W High, volume ratio ≥ 2x</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: "8px" }}>
            <table style={{ borderCollapse: "collapse", minWidth: "900px", fontSize: "12px", width: "100%" }}>
              <thead>
                <tr>
                  {["SYMBOL", "SECTOR", "LTP", "52W HIGH", "% FROM HIGH", "VOL RATIO", "TYPE", "STRENGTH", "RFACTOR"].map((h, i) => (
                    <th key={h} style={{ ...thStyle, textAlign: i <= 1 ? "left" : "center" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, ri) => {
                  const rowBg = ri % 2 === 0 ? "#141414" : "#111";
                  const pctColor = row.pct_from_high >= 0 ? "#00C853" : "#FFD600";
                  const volColor = row.volume_ratio >= 3 ? "#00C853" : "#FFD600";
                  return (
                    <tr key={row.symbol}>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, fontWeight: 700, color: "#fff" }}>{row.symbol}</td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, color: "#aaa" }}>{row.sector}</td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>₹{row.ltp.toLocaleString("en-IN")}</td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center", color: "#888" }}>₹{row.week52_high.toLocaleString("en-IN")}</td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center", color: pctColor, fontWeight: 600 }}>
                        {row.pct_from_high >= 0 ? "+" : ""}{safe(row.pct_from_high, 2)}%
                      </td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center", color: volColor, fontWeight: 600 }}>
                        {safe(row.volume_ratio, 1)}x
                      </td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>
                        <TypeBadge type={row.breakout_type} />
                      </td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>
                        <StrengthBadge strength={row.strength} />
                      </td>
                      <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center", color: row.rfactor >= 70 ? "#00C853" : row.rfactor >= 50 ? "#FFD600" : "#888", fontWeight: 600 }}>
                        {row.rfactor}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
