import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface OptionSummary {
  symbol: string;
  pcr: number;
  max_pain: number;
  current_price: number;
  top_supports: number[];   // put OI walls (strikes)
  top_resistances: number[]; // call OI walls (strikes)
}

interface OiStock {
  symbol: string;
  ltp: number;
  oi_signal: "LONG_BUILDUP" | "SHORT_BUILDUP" | "SHORT_COVERING" | "LONG_UNWINDING" | string;
  oi_change_pct: number;
  pcr: number;
  max_pain: number;
  distance_from_max_pain: number; // %
}

interface OiApiResponse {
  nifty: OptionSummary;
  banknifty: OptionSummary;
  stocks: OiStock[];
  last_updated: string;
}

// ── Mock fallback data ─────────────────────────────────────────────────────

const MOCK: OiApiResponse = {
  nifty: {
    symbol: "NIFTY",
    pcr: 1.18,
    max_pain: 22800,
    current_price: 22950,
    top_supports: [22700, 22500, 22300],
    top_resistances: [23000, 23200, 23500],
  },
  banknifty: {
    symbol: "BANKNIFTY",
    pcr: 0.84,
    max_pain: 49500,
    current_price: 49200,
    top_supports: [49000, 48500, 48000],
    top_resistances: [50000, 50500, 51000],
  },
  stocks: [
    { symbol: "RELIANCE", ltp: 2840, oi_signal: "LONG_BUILDUP", oi_change_pct: 12.4, pcr: 1.32, max_pain: 2800, distance_from_max_pain: 1.4 },
    { symbol: "TCS", ltp: 4195, oi_signal: "SHORT_BUILDUP", oi_change_pct: 8.7, pcr: 0.72, max_pain: 4200, distance_from_max_pain: -0.1 },
    { symbol: "INFY", ltp: 1862, oi_signal: "SHORT_COVERING", oi_change_pct: -5.2, pcr: 0.95, max_pain: 1850, distance_from_max_pain: 0.6 },
    { symbol: "HDFCBANK", ltp: 1720, oi_signal: "LONG_UNWINDING", oi_change_pct: -9.1, pcr: 1.05, max_pain: 1750, distance_from_max_pain: -1.7 },
    { symbol: "ICICIBANK", ltp: 1340, oi_signal: "LONG_BUILDUP", oi_change_pct: 15.6, pcr: 1.44, max_pain: 1300, distance_from_max_pain: 3.1 },
    { symbol: "AXISBANK", ltp: 1210, oi_signal: "SHORT_BUILDUP", oi_change_pct: 11.2, pcr: 0.68, max_pain: 1200, distance_from_max_pain: 0.8 },
    { symbol: "KOTAKBANK", ltp: 1890, oi_signal: "SHORT_COVERING", oi_change_pct: -7.3, pcr: 0.91, max_pain: 1900, distance_from_max_pain: -0.5 },
    { symbol: "MARUTI", ltp: 11410, oi_signal: "LONG_BUILDUP", oi_change_pct: 9.8, pcr: 1.28, max_pain: 11200, distance_from_max_pain: 1.9 },
    { symbol: "TATAMOTORS", ltp: 785, oi_signal: "LONG_UNWINDING", oi_change_pct: -6.4, pcr: 1.12, max_pain: 800, distance_from_max_pain: -1.9 },
    { symbol: "BAJFINANCE", ltp: 7100, oi_signal: "SHORT_BUILDUP", oi_change_pct: 13.5, pcr: 0.62, max_pain: 7200, distance_from_max_pain: -1.4 },
  ],
  last_updated: "14:35:00",
};

// ── API normalizer ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOptionSummary(raw: any, fallbackSymbol: string): OptionSummary {
  return {
    symbol:           raw?.symbol            ?? fallbackSymbol,
    pcr:              raw?.pcr               ?? 1.0,
    max_pain:         raw?.max_pain          ?? 0,
    // API may use spot_price, ltp, or underlying_price instead of current_price
    current_price:    raw?.current_price     ?? raw?.spot_price ?? raw?.ltp ?? raw?.underlying_price ?? 0,
    top_supports:     Array.isArray(raw?.top_supports)    ? raw.top_supports    : [],
    top_resistances:  Array.isArray(raw?.top_resistances) ? raw.top_resistances : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOiStock(raw: any): OiStock {
  return {
    symbol:                 raw?.symbol                 ?? "",
    ltp:                    raw?.ltp                    ?? 0,
    oi_signal:              raw?.oi_signal              ?? "LONG_BUILDUP",
    oi_change_pct:          raw?.oi_change_pct          ?? 0,
    pcr:                    raw?.pcr                    ?? 1.0,
    max_pain:               raw?.max_pain               ?? 0,
    distance_from_max_pain: raw?.distance_from_max_pain ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOiResponse(raw: any): OiApiResponse {
  // API may nest index data in different ways
  const niftyRaw     = raw?.nifty     ?? raw?.NIFTY     ?? raw?.indices?.nifty     ?? null;
  const bankniftyRaw = raw?.banknifty ?? raw?.BANKNIFTY ?? raw?.indices?.banknifty ?? null;
  return {
    nifty:       normalizeOptionSummary(niftyRaw,     "NIFTY"),
    banknifty:   normalizeOptionSummary(bankniftyRaw, "BANKNIFTY"),
    stocks:      Array.isArray(raw?.stocks) ? raw.stocks.map(normalizeOiStock) : [],
    last_updated: raw?.last_updated ?? "",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

const safe = (v: unknown, d = 2) => {
  const n = parseFloat(v as string);
  return isNaN(n) ? "--" : n.toFixed(d);
};

function isMarketHours(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 && mins <= 15 * 60 + 30;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── OI Signal config ───────────────────────────────────────────────────────

const SIGNAL_CFG: Record<string, { bg: string; color: string; label: string }> = {
  LONG_BUILDUP:    { bg: "#00C85322", color: "#00C853", label: "LONG BUILD" },
  SHORT_BUILDUP:   { bg: "#FF174422", color: "#FF1744", label: "SHORT BUILD" },
  SHORT_COVERING:  { bg: "#FFD60022", color: "#FFD600", label: "SHORT COVER" },
  LONG_UNWINDING:  { bg: "#FF6D0022", color: "#FF6D00", label: "LONG UNWIND" },
};

function SignalBadge({ signal }: { signal: string }) {
  const cfg = SIGNAL_CFG[signal] ?? { bg: "#33333322", color: "#888", label: signal };
  return (
    <span
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}44`,
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: "4px",
        whiteSpace: "nowrap",
        letterSpacing: "0.3px",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ── PCR Gauge (SVG arc) ────────────────────────────────────────────────────

function PcrGauge({ pcr }: { pcr: number }) {
  // Arc from 180° to 0° (half circle). Value clamped 0–2.
  const clamped = Math.min(Math.max(pcr, 0), 2);
  const angle = (clamped / 2) * 180; // 0–180 degrees
  const deg = 180 - angle; // start=180 end=0, rotate from left

  const cx = 70, cy = 70, r = 55;
  // Convert degrees to radians for the needle tip
  const rad = ((180 - angle) * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad);
  const ny = cy - r * Math.sin(rad);

  // Arc color zones: red < 0.7, green > 1.2, yellow in between
  const color = pcr < 0.7 ? "#FF1744" : pcr > 1.2 ? "#00C853" : "#FFD600";
  const label = pcr < 0.7 ? "BEARISH" : pcr > 1.2 ? "BULLISH" : "NEUTRAL";
  const labelColor = pcr < 0.7 ? "#FF1744" : pcr > 1.2 ? "#00C853" : "#FFD600";

  // Build arc path for 3 colored zones
  function arcPath(startDeg: number, endDeg: number, fill: string) {
    const s = ((180 - startDeg) * Math.PI) / 180;
    const e = ((180 - endDeg) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s); const y1 = cy - r * Math.sin(s);
    const x2 = cx + r * Math.cos(e); const y2 = cy - r * Math.sin(e);
    const large = endDeg - startDeg > 90 ? 1 : 0;
    return <path key={fill + startDeg} d={`M${x1} ${y1} A${r} ${r} 0 ${large} 0 ${x2} ${y2}`} stroke={fill} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.3" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="140" height="80" viewBox="0 0 140 85">
        {/* Background track */}
        <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="#2a2a2a" strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Colored zones */}
        {arcPath(0, 63, "#FF1744")}
        {arcPath(63, 108, "#FFD600")}
        {arcPath(108, 180, "#00C853")}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        {/* Center labels */}
        <text x={cx} y={cy + 18} textAnchor="middle" fill={labelColor} fontSize="10" fontWeight="bold">{label}</text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#aaa" fontSize="9">PCR {safe(pcr, 2)}</text>
      </svg>
    </div>
  );
}

// ── Option Chain Summary Card ──────────────────────────────────────────────

function OptionChainCard({ data }: { data: OptionSummary }) {
  const cur = data.current_price ?? 0;
  const mp  = data.max_pain      ?? 0;
  const mpDiff = cur - mp;
  const mpPct = mp > 0 ? ((mpDiff / mp) * 100).toFixed(2) : "0.00";
  const mpColor = mpDiff >= 0 ? "#00C853" : "#FF1744";

  return (
    <div
      style={{
        flex: 1,
        minWidth: "280px",
        backgroundColor: "#161616",
        border: "1px solid #2a2a2a",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ color: "#cccccc", fontWeight: "bold", fontSize: "13px", borderBottom: "1px solid #222", paddingBottom: "8px" }}>
        {data.symbol} Option Chain Summary
      </div>

      {/* PCR Gauge */}
      <PcrGauge pcr={data.pcr} />

      {/* Max Pain */}
      <div style={{ backgroundColor: "#111", borderRadius: "8px", padding: "10px 12px" }}>
        <div style={{ color: "#888", fontSize: "10px", marginBottom: "4px" }}>MAX PAIN</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>₹{data.max_pain.toLocaleString("en-IN")}</span>
          <span style={{ color: mpColor, fontSize: "11px", fontWeight: 600 }}>
            {mpDiff >= 0 ? "+" : ""}{mpPct}% from current
          </span>
        </div>
        <div style={{ color: "#666", fontSize: "10px", marginTop: "2px" }}>
          Current: ₹{cur > 0 ? cur.toLocaleString("en-IN") : "--"}
        </div>
      </div>

      {/* Supports + Resistances */}
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#888", fontSize: "10px", marginBottom: "6px" }}>🟢 PUT WALLS (Support)</div>
          {data.top_supports.map((s) => (
            <div key={s} style={{ color: "#00C853", fontSize: "12px", fontWeight: 600, padding: "3px 0", borderBottom: "1px solid #1a1a1a" }}>
              ₹{s.toLocaleString("en-IN")}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#888", fontSize: "10px", marginBottom: "6px" }}>🔴 CALL WALLS (Resistance)</div>
          {data.top_resistances.map((r) => (
            <div key={r} style={{ color: "#FF1744", fontSize: "12px", fontWeight: 600, padding: "3px 0", borderBottom: "1px solid #1a1a1a" }}>
              ₹{r.toLocaleString("en-IN")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  const pulse: React.CSSProperties = { backgroundColor: "#1e1e1e", borderRadius: "4px", animation: "oiPulse 1.4s ease-in-out infinite" };
  return (
    <tr>
      {[120, 80, 100, 80, 60, 80, 100].map((w, i) => (
        <td key={i} style={{ padding: "10px 8px", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ ...pulse, width: `${w}px`, height: "12px" }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

type SignalFilter = "ALL" | "LONG_BUILDUP" | "SHORT_BUILDUP" | "SHORT_COVERING" | "LONG_UNWINDING";

export function OiTab() {
  const [data, setData] = useState<OiApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [signalFilter, setSignalFilter] = useState<SignalFilter>("ALL");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function doFetch() {
    apiFetch("/oi/bulk?symbols=ALL_FO_SYMBOLS")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: unknown) => {
        setData(normalizeOiResponse(d));
        setIsOffline(false);
        setLastUpdated(fmtTime(new Date()));
        setLoading(false);
      })
      .catch(() => {
        setData(MOCK);
        setIsOffline(true);
        setLastUpdated(fmtTime(new Date()));
        setLoading(false);
      });
  }

  useEffect(() => {
    doFetch();
    if (isMarketHours()) {
      intervalRef.current = setInterval(doFetch, 5 * 60 * 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const stocks = data?.stocks ?? [];
  const filtered = signalFilter === "ALL" ? stocks : stocks.filter((s) => s.oi_signal === signalFilter);
  const sorted = [...filtered].sort((a, b) => Math.abs(b.oi_change_pct) - Math.abs(a.oi_change_pct));

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
      <style>{`@keyframes oiPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", backgroundColor: "#111", borderBottom: "1px solid #222", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ color: "#ccc", fontSize: "13px", fontWeight: "bold" }}>📊 OI Analysis</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isOffline && (
            <span style={{ color: "#FFD600", fontSize: "11px", backgroundColor: "#1a1400", border: "1px solid #5a4400", padding: "3px 10px", borderRadius: "6px" }}>
              ⚠️ Backend offline — mock data
            </span>
          )}
          {lastUpdated && <span style={{ color: "#444", fontSize: "11px" }}>Last updated: {lastUpdated}</span>}
        </div>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Index Option Chain cards */}
        {loading ? (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ flex: 1, minWidth: "280px", height: "320px", backgroundColor: "#161616", borderRadius: "10px", animation: "oiPulse 1.4s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <OptionChainCard data={data!.nifty} />
            <OptionChainCard data={data!.banknifty} />
          </div>
        )}

        {/* Signal filter */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: "11px", marginRight: "4px" }}>FILTER:</span>
          {(["ALL", "LONG_BUILDUP", "SHORT_BUILDUP", "SHORT_COVERING", "LONG_UNWINDING"] as SignalFilter[]).map((f) => (
            <button key={f} style={signalFilter === f ? btnActive : btnBase} onClick={() => setSignalFilter(f)}>
              {f === "ALL" ? "ALL" : (SIGNAL_CFG[f]?.label ?? f)}
              <span style={{ marginLeft: "5px", backgroundColor: "#0d0d0d", color: "#aaa", fontSize: "10px", padding: "1px 5px", borderRadius: "3px" }}>
                {f === "ALL" ? stocks.length : stocks.filter((s) => s.oi_signal === f).length}
              </span>
            </button>
          ))}
          <span style={{ marginLeft: "auto", color: "#444", fontSize: "11px" }}>
            Showing {sorted.length} of {stocks.length} stocks
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: "8px" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "900px", fontSize: "12px", width: "100%" }}>
            <thead>
              <tr>
                {["SYMBOL", "LTP", "OI SIGNAL", "OI CHANGE %", "PCR", "MAX PAIN", "DIST FROM MAX PAIN", "SIGNAL"].map((h, i) => (
                  <th key={h} style={{ ...thStyle, textAlign: i === 0 ? "left" : "center" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : sorted.length === 0
                ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#555" }}>No OI data for this filter.</td></tr>
                )
                : sorted.map((row, ri) => {
                    const rowBg = ri % 2 === 0 ? "#141414" : "#111";
                    const oiChgColor = row.oi_change_pct >= 0 ? "#00C853" : "#FF1744";
                    const distColor = Math.abs(row.distance_from_max_pain) <= 0.5 ? "#FFD600" : row.distance_from_max_pain > 0 ? "#00C853" : "#FF1744";
                    return (
                      <tr key={row.symbol}>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, fontWeight: 700, color: "#fff" }}>{row.symbol}</td>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>₹{row.ltp != null ? row.ltp.toLocaleString("en-IN") : "--"}</td>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>
                          <SignalBadge signal={row.oi_signal} />
                        </td>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center", color: oiChgColor, fontWeight: 600 }}>
                          {row.oi_change_pct >= 0 ? "+" : ""}{safe(row.oi_change_pct, 1)}%
                        </td>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center", color: row.pcr < 0.7 ? "#FF1744" : row.pcr > 1.2 ? "#00C853" : "#FFD600", fontWeight: 600 }}>
                          {safe(row.pcr, 2)}
                        </td>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>₹{row.max_pain != null ? row.max_pain.toLocaleString("en-IN") : "--"}</td>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center", color: distColor, fontWeight: 600 }}>
                          {row.distance_from_max_pain >= 0 ? "+" : ""}{safe(row.distance_from_max_pain, 2)}%
                        </td>
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>
                          <SignalBadge signal={row.oi_signal} />
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
