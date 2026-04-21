import { useState, useEffect, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type TradeSignal = "BUY" | "SELL" | "AVOID";
type OiSignal =
  | "LONG_BUILDUP"
  | "SHORT_BUILDUP"
  | "SHORT_COVERING"
  | "LONG_UNWINDING"
  | "NO_DATA"
  | string;

interface FoStock {
  symbol: string;
  ltp: number;
  change_pct: number;
  sector: string;
  pcr: number | null;
  pcr_signal: string;
  oi_signal: OiSignal;
  oi_change_pct: number;
  max_pain: number | null;
  dist_from_max_pain_pct: number | null;
  support_strikes: number[];
  resistance_strikes: number[];
  rfactor: number;
  rsi: number;
  vwap: number;
  above_vwap: boolean;
  delivery_pct: number | null;
  bid_ask_ratio: number | null;
  volume_ratio: number;
  trade_signal: TradeSignal;
  confidence: 1 | 2 | 3;
  reasons: string[];
}

interface FoRadarResponse {
  stocks: FoStock[];
  total: number;
  buy_count: number;
  sell_count: number;
  avoid_count: number;
  last_updated: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK: FoRadarResponse = {
  total: 10,
  buy_count: 4,
  sell_count: 3,
  avoid_count: 3,
  last_updated: "14:35:00",
  stocks: [
    {
      symbol: "RELIANCE",
      ltp: 2840,
      change_pct: 1.4,
      sector: "ENERGY",
      pcr: 1.32,
      pcr_signal: "BULLISH",
      oi_signal: "LONG_BUILDUP",
      oi_change_pct: 12.4,
      max_pain: 2800,
      dist_from_max_pain_pct: 1.4,
      support_strikes: [2800, 2750],
      resistance_strikes: [2900, 2950],
      rfactor: 78,
      rsi: 64,
      vwap: 2820,
      above_vwap: true,
      delivery_pct: 58,
      bid_ask_ratio: 1.2,
      volume_ratio: 2.4,
      trade_signal: "BUY",
      confidence: 3,
      reasons: [
        "Above VWAP",
        "OI: Long Buildup",
        "2.4x Volume",
        "RSI 64",
        "PCR Bullish",
      ],
    },
    {
      symbol: "ICICIBANK",
      ltp: 1340,
      change_pct: 0.9,
      sector: "BANKING",
      pcr: 1.44,
      pcr_signal: "BULLISH",
      oi_signal: "LONG_BUILDUP",
      oi_change_pct: 15.6,
      max_pain: 1300,
      dist_from_max_pain_pct: 3.1,
      support_strikes: [1300, 1280],
      resistance_strikes: [1360, 1380],
      rfactor: 74,
      rsi: 61,
      vwap: 1332,
      above_vwap: true,
      delivery_pct: 52,
      bid_ask_ratio: 1.1,
      volume_ratio: 1.9,
      trade_signal: "BUY",
      confidence: 3,
      reasons: ["PCR Bullish", "Above ORB High", "Sector LONG", "Vol Surge"],
    },
    {
      symbol: "INFY",
      ltp: 1862,
      change_pct: 1.8,
      sector: "IT",
      pcr: 0.95,
      pcr_signal: "NEUTRAL",
      oi_signal: "SHORT_COVERING",
      oi_change_pct: -5.2,
      max_pain: 1850,
      dist_from_max_pain_pct: 0.6,
      support_strikes: [1840, 1820],
      resistance_strikes: [1880, 1900],
      rfactor: 82,
      rsi: 67,
      vwap: 1850,
      above_vwap: true,
      delivery_pct: 61,
      bid_ask_ratio: 0.9,
      volume_ratio: 3.1,
      trade_signal: "BUY",
      confidence: 3,
      reasons: [
        "52W High proximity",
        "3.1x Volume",
        "IT sector LONG",
        "Short OI Covering",
      ],
    },
    {
      symbol: "MARUTI",
      ltp: 11410,
      change_pct: 0.7,
      sector: "AUTO",
      pcr: 1.28,
      pcr_signal: "BULLISH",
      oi_signal: "LONG_BUILDUP",
      oi_change_pct: 9.8,
      max_pain: 11200,
      dist_from_max_pain_pct: 1.9,
      support_strikes: [11200, 11000],
      resistance_strikes: [11500, 11700],
      rfactor: 71,
      rsi: 57,
      vwap: 11380,
      above_vwap: true,
      delivery_pct: null,
      bid_ask_ratio: 1.0,
      volume_ratio: 1.5,
      trade_signal: "BUY",
      confidence: 2,
      reasons: ["Pulled back to VWAP", "Support at ORB Low", "AUTO sector UP"],
    },
    {
      symbol: "TCS",
      ltp: 4195,
      change_pct: -0.2,
      sector: "IT",
      pcr: 0.88,
      pcr_signal: "NEUTRAL",
      oi_signal: "LONG_UNWINDING",
      oi_change_pct: -9.1,
      max_pain: 4200,
      dist_from_max_pain_pct: -0.1,
      support_strikes: [4150, 4100],
      resistance_strikes: [4250, 4300],
      rfactor: 65,
      rsi: 52,
      vwap: 4200,
      above_vwap: false,
      delivery_pct: 44,
      bid_ask_ratio: 0.8,
      volume_ratio: 1.0,
      trade_signal: "AVOID",
      confidence: 1,
      reasons: ["Consolidation range", "Average volume", "IT sector neutral"],
    },
    {
      symbol: "HDFCBANK",
      ltp: 1720,
      change_pct: -0.6,
      sector: "BANKING",
      pcr: 1.05,
      pcr_signal: "NEUTRAL",
      oi_signal: "LONG_UNWINDING",
      oi_change_pct: -9.1,
      max_pain: 1750,
      dist_from_max_pain_pct: -1.7,
      support_strikes: [1700, 1680],
      resistance_strikes: [1750, 1780],
      rfactor: 55,
      rsi: 48,
      vwap: 1728,
      above_vwap: false,
      delivery_pct: 39,
      bid_ask_ratio: null,
      volume_ratio: 0.9,
      trade_signal: "AVOID",
      confidence: 1,
      reasons: ["Below VWAP", "OI: Long Unwinding", "Weak RSI"],
    },
    {
      symbol: "DRREDDY",
      ltp: 1220,
      change_pct: -1.1,
      sector: "PHARMA",
      pcr: 0.72,
      pcr_signal: "BEARISH",
      oi_signal: "SHORT_BUILDUP",
      oi_change_pct: 8.7,
      max_pain: 1270,
      dist_from_max_pain_pct: -3.9,
      support_strikes: [1200, 1180],
      resistance_strikes: [1250, 1280],
      rfactor: 44,
      rsi: 38,
      vwap: 1240,
      above_vwap: false,
      delivery_pct: null,
      bid_ask_ratio: 0.6,
      volume_ratio: 1.6,
      trade_signal: "SELL",
      confidence: 2,
      reasons: [
        "Bounce to VWAP",
        "PHARMA weak",
        "Short OI buildup",
        "RSI Below 40",
      ],
    },
    {
      symbol: "BAJFINANCE",
      ltp: 7100,
      change_pct: -1.4,
      sector: "FINANCE",
      pcr: 0.62,
      pcr_signal: "BEARISH",
      oi_signal: "SHORT_BUILDUP",
      oi_change_pct: 13.5,
      max_pain: 7200,
      dist_from_max_pain_pct: -1.4,
      support_strikes: [7000, 6900],
      resistance_strikes: [7200, 7400],
      rfactor: 38,
      rsi: 32,
      vwap: 7150,
      above_vwap: false,
      delivery_pct: 70,
      bid_ask_ratio: 0.7,
      volume_ratio: 2.1,
      trade_signal: "SELL",
      confidence: 3,
      reasons: [
        "Below VWAP",
        "OI Short Buildup",
        "Broke ORB Low",
        "RSI Weak",
        "PCR Bearish",
      ],
    },
    {
      symbol: "AXISBANK",
      ltp: 1210,
      change_pct: 0.4,
      sector: "BANKING",
      pcr: 0.68,
      pcr_signal: "BEARISH",
      oi_signal: "SHORT_BUILDUP",
      oi_change_pct: 11.2,
      max_pain: 1200,
      dist_from_max_pain_pct: 0.8,
      support_strikes: [1200, 1190],
      resistance_strikes: [1220, 1240],
      rfactor: 68,
      rsi: 55,
      vwap: 1205,
      above_vwap: true,
      delivery_pct: 48,
      bid_ask_ratio: 0.9,
      volume_ratio: 1.4,
      trade_signal: "SELL",
      confidence: 2,
      reasons: ["OI: Short Buildup", "PCR Bearish", "Conflicting VWAP"],
    },
    {
      symbol: "KOTAKBANK",
      ltp: 1890,
      change_pct: -0.3,
      sector: "BANKING",
      pcr: 0.91,
      pcr_signal: "NEUTRAL",
      oi_signal: "SHORT_COVERING",
      oi_change_pct: -7.3,
      max_pain: 1900,
      dist_from_max_pain_pct: -0.5,
      support_strikes: [1880, 1860],
      resistance_strikes: [1920, 1940],
      rfactor: 60,
      rsi: 50,
      vwap: 1895,
      above_vwap: false,
      delivery_pct: null,
      bid_ask_ratio: null,
      volume_ratio: 0.8,
      trade_signal: "AVOID",
      confidence: 1,
      reasons: ["Consolidation", "Low volume", "No clear bias"],
    },
  ],
};

// ── Normalizer ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStock(s: any): FoStock {
  return {
    symbol: s.symbol ?? "",
    ltp: s.ltp ?? 0,
    change_pct: s.change_pct ?? 0,
    sector: s.sector ?? "",
    pcr: s.pcr ?? null,
    pcr_signal: s.pcr_signal ?? "NEUTRAL",
    oi_signal: s.oi_signal ?? "NO_DATA",
    oi_change_pct: s.oi_change_pct ?? 0,
    max_pain: s.max_pain ?? null,
    dist_from_max_pain_pct: s.dist_from_max_pain_pct ?? null,
    support_strikes: Array.isArray(s.support_strikes) ? s.support_strikes : [],
    resistance_strikes: Array.isArray(s.resistance_strikes)
      ? s.resistance_strikes
      : [],
    rfactor: s.rfactor ?? 0,
    rsi: s.rsi ?? 50,
    vwap: s.vwap ?? 0,
    above_vwap: s.above_vwap ?? false,
    delivery_pct: s.delivery_pct ?? null,
    bid_ask_ratio: s.bid_ask_ratio ?? null,
    volume_ratio: s.volume_ratio ?? 1,
    trade_signal: s.trade_signal ?? "AVOID",
    confidence: s.confidence ?? 1,
    reasons: Array.isArray(s.reasons) ? s.reasons : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeResponse(raw: any): FoRadarResponse {
  return {
    stocks: Array.isArray(raw.stocks) ? raw.stocks.map(normalizeStock) : [],
    total: raw.total ?? 0,
    buy_count: raw.buy_count ?? 0,
    sell_count: raw.sell_count ?? 0,
    avoid_count: raw.avoid_count ?? 0,
    last_updated: raw.last_updated ?? "",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (v: unknown) => {
  const n = parseFloat(v as string);
  return isNaN(n) ? "--" : n.toLocaleString("en-IN");
};
const fmtN = (v: unknown, d = 2) => {
  const n = parseFloat(v as string);
  return isNaN(n) ? "--" : n.toFixed(d);
};

function isMarketHours() {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const m = ist.getHours() * 60 + ist.getMinutes();
  return m >= 9 * 60 && m <= 15 * 60 + 30;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function stars(n: 1 | 2 | 3) {
  return "★".repeat(n) + "☆".repeat(3 - n);
}

// ── Badge & cell helpers ───────────────────────────────────────────────────

const SIGNAL_STYLE: Record<
  TradeSignal,
  { bg: string; border: string; color: string; icon: string }
> = {
  BUY: { bg: "#14532d", border: "#16a34a", color: "#4ade80", icon: "🟢" },
  SELL: { bg: "#450a0a", border: "#dc2626", color: "#f87171", icon: "🔴" },
  AVOID: { bg: "#1f2937", border: "#374151", color: "#9ca3af", icon: "⚪" },
};

const OI_BADGE: Record<string, { bg: string; color: string; short: string }> = {
  LONG_BUILDUP: { bg: "#14532d", color: "#4ade80", short: "LB" },
  SHORT_BUILDUP: { bg: "#450a0a", color: "#f87171", short: "SB" },
  SHORT_COVERING: { bg: "#1a3d1a", color: "#86efac", short: "SC" },
  LONG_UNWINDING: { bg: "#431407", color: "#fb923c", short: "LU" },
  NO_DATA: { bg: "#1f2937", color: "#6b7280", short: "—" },
};

function rsiColor(rsi: number) {
  if (rsi < 30) return "#f87171";
  if (rsi < 50) return "#fb923c";
  if (rsi <= 70) return "#4ade80";
  return "#f87171";
}

function pcrColor(pcr: number | null) {
  if (pcr == null) return "#6b7280";
  if (pcr > 1.1) return "#4ade80";
  if (pcr < 0.8) return "#f87171";
  return "#9ca3af";
}

// ── Tooltip state ──────────────────────────────────────────────────────────

function ReasonsCell({ reasons }: { reasons: string[] }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setVisible(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setVisible((v) => !v)}
        title="View reasons"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#6b7280",
          fontSize: "14px",
          padding: "0 4px",
        }}
      >
        ⓘ
      </button>
      {visible && reasons.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 999,
            right: 0,
            top: "22px",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "10px 14px",
            minWidth: "180px",
            boxShadow: "0 8px 24px #00000088",
          }}
        >
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {reasons.map((r) => (
              <li
                key={r}
                style={{
                  color: "#d1d5db",
                  fontSize: "11px",
                  display: "flex",
                  gap: "6px",
                }}
              >
                <span style={{ color: "#4ade80" }}>•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────

function SkeletonRow() {
  const pulse: React.CSSProperties = {
    backgroundColor: "#374151",
    borderRadius: "3px",
    animation: "foRadarPulse 1.4s ease-in-out infinite",
  };
  const widths = [80, 64, 60, 40, 60, 40, 36, 40, 60, 40, 32, 40, 20];
  return (
    <tr>
      {widths.map((w, i) => (
        <td
          key={i}
          style={{ padding: "11px 10px", borderBottom: "1px solid #1f2937" }}
        >
          <div style={{ ...pulse, width: `${w}px`, height: "11px" }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

type SortKey = "signal" | "confidence" | "rsi" | "rfactor";

export function FoRadarTab() {
  const [data, setData] = useState<FoRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const [signalFilter, setSignalFilter] = useState<TradeSignal | "ALL">("ALL");
  const [minConf, setMinConf] = useState<1 | 2 | 3>(1);
  const [sortKey, setSortKey] = useState<SortKey>("signal");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function doFetch(sig: TradeSignal | "ALL", conf: 1 | 2 | 3) {
    const qs = `?signal=${sig}&min_confidence=${conf}&limit=100`;
    apiFetch(`/fo-radar${qs}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: unknown) => {
        setData(normalizeResponse(d));
        setError(false);
        setLastUpdated(fmtTime(new Date()));
        setLoading(false);
      })
      .catch(() => {
        // Use mock so UI is never blank
        setData(normalizeResponse(MOCK));
        setError(true);
        setLastUpdated(fmtTime(new Date()));
        setLoading(false);
      });
  }

  useEffect(() => {
    setLoading(true);
    doFetch(signalFilter, minConf);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isMarketHours()) {
      intervalRef.current = setInterval(
        () => doFetch(signalFilter, minConf),
        5 * 60 * 1000,
      );
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
     
  }, [signalFilter, minConf]);

  const stocks = data?.stocks ?? [];

  const filtered = useMemo(() => {
    const list = stocks.filter(
      (s) =>
        (signalFilter === "ALL" || s.trade_signal === signalFilter) &&
        s.confidence >= minConf,
    );
    return [...list].sort((a, b) => {
      if (sortKey === "signal") {
        const order: Record<TradeSignal, number> = {
          BUY: 0,
          SELL: 1,
          AVOID: 2,
        };
        return order[a.trade_signal] - order[b.trade_signal];
      }
      if (sortKey === "confidence") return b.confidence - a.confidence;
      if (sortKey === "rsi") return a.rsi - b.rsi;
      if (sortKey === "rfactor") return b.rfactor - a.rfactor;
      return 0;
    });
  }, [stocks, signalFilter, minConf, sortKey]);

  // ── Styles ────────────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "5px",
    border: "1px solid #374151",
    backgroundColor: "#1f2937",
    color: "#6b7280",
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    backgroundColor: "#1d4ed8",
    borderColor: "#3b82f6",
    color: "#fff",
  };
  const thStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 2,
    backgroundColor: "#111827",
    color: "#6b7280",
    padding: "9px 10px",
    textAlign: "left",
    borderBottom: "2px solid #374151",
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  };
  const tdBase: React.CSSProperties = {
    padding: "9px 10px",
    borderBottom: "1px solid #1f2937",
    fontSize: "12px",
    whiteSpace: "nowrap",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        backgroundColor: "#111827",
        minHeight: "100vh",
        fontFamily: "inherit",
      }}
    >
      <style>{`
        @keyframes foRadarPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .fo-row:hover td { background-color: #374151 !important; }
      `}</style>

      {/* ── Header / filter bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          padding: "10px 16px",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1f2937",
        }}
      >
        {/* Signal filter */}
        <div style={{ display: "flex", gap: "5px" }}>
          {(["ALL", "BUY", "SELL", "AVOID"] as const).map((s) => {
            const active = signalFilter === s;
            const style: React.CSSProperties = active
              ? s === "BUY"
                ? {
                    ...btnActive,
                    backgroundColor: "#14532d",
                    borderColor: "#16a34a",
                    color: "#4ade80",
                  }
                : s === "SELL"
                  ? {
                      ...btnActive,
                      backgroundColor: "#450a0a",
                      borderColor: "#dc2626",
                      color: "#f87171",
                    }
                  : s === "AVOID"
                    ? {
                        ...btnActive,
                        backgroundColor: "#374151",
                        borderColor: "#6b7280",
                        color: "#d1d5db",
                      }
                    : btnActive
              : btnBase;
            return (
              <button key={s} style={style} onClick={() => setSignalFilter(s)}>
                {s === "BUY"
                  ? "🟢 BUY"
                  : s === "SELL"
                    ? "🔴 SELL"
                    : s === "AVOID"
                      ? "⚪ AVOID"
                      : "ALL"}
              </button>
            );
          })}
        </div>

        <div
          style={{ width: "1px", height: "20px", backgroundColor: "#374151" }}
        />

        {/* Min confidence */}
        <span style={{ color: "#6b7280", fontSize: "11px" }}>Min Conf:</span>
        {([1, 2, 3] as const).map((c) => (
          <button
            key={c}
            style={minConf === c ? { ...btnActive } : btnBase}
            onClick={() => setMinConf(c)}
            title={`Minimum confidence: ${c} star${c > 1 ? "s" : ""}`}
          >
            <span style={{ color: "#facc15" }}>{stars(c)}</span>
          </button>
        ))}

        <div
          style={{ width: "1px", height: "20px", backgroundColor: "#374151" }}
        />

        {/* Sort */}
        <span style={{ color: "#6b7280", fontSize: "11px" }}>Sort:</span>
        {(
          [
            ["signal", "Signal ↓"],
            ["confidence", "Conf ↓"],
            ["rsi", "RSI"],
            ["rfactor", "R-Factor"],
          ] as [SortKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            style={sortKey === key ? btnActive : btnBase}
            onClick={() => setSortKey(key)}
          >
            {label}
          </button>
        ))}

        {/* Summary counts */}
        {data && (
          <span
            style={{
              marginLeft: "auto",
              color: "#9ca3af",
              fontSize: "11px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <span>{data.total} stocks</span>
            <span style={{ color: "#374151" }}>|</span>
            <span style={{ color: "#4ade80" }}>🟢 {data.buy_count} BUY</span>
            <span style={{ color: "#f87171" }}>🔴 {data.sell_count} SELL</span>
            <span style={{ color: "#9ca3af" }}>
              ⚪ {data.avoid_count} AVOID
            </span>
          </span>
        )}
        {lastUpdated && (
          <span
            style={{
              color: "#374151",
              fontSize: "10px",
              marginLeft: data ? "8px" : "auto",
            }}
          >
            {lastUpdated}
          </span>
        )}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            margin: "10px 16px 0",
            backgroundColor: "#1c1200",
            border: "1px solid #78350f",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#fbbf24",
            fontSize: "12px",
          }}
        >
          ⚠ F&amp;O Radar data unavailable. The OI cache may still be loading —
          it refreshes automatically with each 5-minute market data cycle.
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: "auto", padding: "12px 16px" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: "1100px",
            tableLayout: "auto",
          }}
        >
          <thead>
            <tr>
              {[
                "SYMBOL",
                "SECTOR",
                "LTP",
                "CHG%",
                "SIGNAL",
                "CONF",
                "OI SIGNAL",
                "PCR",
                "MAX PAIN",
                "DIST",
                "RSI",
                "DELIVERY%",
                "REASONS",
              ].map((h, i) => (
                <th
                  key={h}
                  style={{ ...thStyle, textAlign: i <= 1 ? "left" : "center" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  style={{
                    textAlign: "center",
                    padding: "48px 16px",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  No stocks match the current filter. Try changing Signal or
                  Confidence.
                </td>
              </tr>
            ) : (
              filtered.map((s, ri) => {
                const rowBg = ri % 2 === 0 ? "#111827" : "#0f172a";
                const td = (
                  extra?: React.CSSProperties,
                ): React.CSSProperties => ({
                  ...tdBase,
                  backgroundColor: rowBg,
                  color: "#d1d5db",
                  ...extra,
                });
                const sigCfg = SIGNAL_STYLE[s.trade_signal];
                const oiBadge = OI_BADGE[s.oi_signal] ?? OI_BADGE.NO_DATA;
                const chgColor = s.change_pct >= 0 ? "#4ade80" : "#f87171";
                const distColor =
                  s.dist_from_max_pain_pct == null
                    ? "#6b7280"
                    : s.dist_from_max_pain_pct < 0
                      ? "#4ade80"
                      : "#f87171";

                return (
                  <tr key={s.symbol} className="fo-row">
                    {/* SYMBOL */}
                    <td style={td({ fontWeight: 700, color: "#f9fafb" })}>
                      <a
                        href={`https://www.nseindia.com/get-quotes/equity?symbol=${s.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#f9fafb", textDecoration: "none" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#93c5fd")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#f9fafb")
                        }
                      >
                        {s.symbol}
                      </a>
                    </td>

                    {/* SECTOR */}
                    <td style={td({ color: "#6b7280", fontSize: "11px" })}>
                      {s.sector || "—"}
                    </td>

                    {/* LTP */}
                    <td style={td({ textAlign: "center", color: "#f9fafb" })}>
                      ₹{fmt(s.ltp)}
                    </td>

                    {/* CHG% */}
                    <td
                      style={td({
                        textAlign: "center",
                        color: chgColor,
                        fontWeight: 600,
                      })}
                    >
                      {s.change_pct >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(s.change_pct).toFixed(2)}%
                    </td>

                    {/* SIGNAL */}
                    <td style={td({ textAlign: "center" })}>
                      <span
                        style={{
                          backgroundColor: sigCfg.bg,
                          border: `1px solid ${sigCfg.border}`,
                          color: sigCfg.color,
                          fontWeight: 700,
                          fontSize: "10px",
                          padding: "2px 9px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sigCfg.icon} {s.trade_signal}
                      </span>
                    </td>

                    {/* CONF */}
                    <td style={td({ textAlign: "center" })}>
                      <span
                        style={{
                          color: "#facc15",
                          fontSize: "12px",
                          letterSpacing: "1px",
                        }}
                      >
                        {stars(s.confidence)}
                      </span>
                    </td>

                    {/* OI SIGNAL */}
                    <td style={td({ textAlign: "center" })}>
                      <span
                        style={{
                          backgroundColor: oiBadge.bg,
                          color: oiBadge.color,
                          fontWeight: 700,
                          fontSize: "10px",
                          padding: "2px 7px",
                          borderRadius: "4px",
                        }}
                      >
                        {oiBadge.short}
                      </span>
                    </td>

                    {/* PCR */}
                    <td
                      style={td({
                        textAlign: "center",
                        color: pcrColor(s.pcr),
                        fontWeight: 600,
                      })}
                    >
                      {s.pcr != null ? fmtN(s.pcr, 2) : "—"}
                    </td>

                    {/* MAX PAIN */}
                    <td
                      style={td({
                        textAlign: "center",
                        color: s.max_pain != null ? "#d1d5db" : "#6b7280",
                      })}
                    >
                      {s.max_pain != null ? `₹${fmt(s.max_pain)}` : "—"}
                    </td>

                    {/* DIST FROM MAX PAIN */}
                    <td
                      style={td({
                        textAlign: "center",
                        color: distColor,
                        fontWeight: 600,
                      })}
                    >
                      {s.dist_from_max_pain_pct != null
                        ? `${s.dist_from_max_pain_pct >= 0 ? "+" : ""}${fmtN(s.dist_from_max_pain_pct, 2)}%`
                        : "—"}
                    </td>

                    {/* RSI */}
                    <td
                      style={td({
                        textAlign: "center",
                        color: rsiColor(s.rsi),
                        fontWeight: 600,
                      })}
                    >
                      {fmtN(s.rsi, 0)}
                    </td>

                    {/* DELIVERY% */}
                    <td
                      style={td({
                        textAlign: "center",
                        color: s.delivery_pct != null ? "#d1d5db" : "#6b7280",
                      })}
                    >
                      {s.delivery_pct != null
                        ? `${fmtN(s.delivery_pct, 1)}%`
                        : "—"}
                    </td>

                    {/* REASONS */}
                    <td style={td({ textAlign: "center" })}>
                      <ReasonsCell reasons={s.reasons} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
