import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface SectorBreadth {
  name: string;
  positive_pct: number; // 0–100
  total: number;
  positive: number;
}

interface BreadthData {
  advances: number;
  declines: number;
  unchanged: number;
  adr: number; // advance/decline ratio
  breadth_signal: "STRONG" | "MODERATE" | "WEAK" | "VERY_WEAK";
  above_vwap_pct: number; // % of all F&O stocks above VWAP
  nifty50_positive_pct: number; // % of Nifty50 positive
  positive_sectors: number;
  total_sectors: number;
  market_description: string;
  sectors: SectorBreadth[];
  last_updated: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK: BreadthData = {
  advances: 312,
  declines: 178,
  unchanged: 10,
  adr: 1.75,
  breadth_signal: "STRONG",
  above_vwap_pct: 68,
  nifty50_positive_pct: 72,
  positive_sectors: 7,
  total_sectors: 10,
  market_description:
    "7 out of 10 sectors are positive. Most stocks trading above VWAP. Broad market participation.",
  last_updated: "14:35:00",
  sectors: [
    { name: "IT", positive_pct: 82, total: 11, positive: 9 },
    { name: "AUTO", positive_pct: 75, total: 8, positive: 6 },
    { name: "BANKING", positive_pct: 70, total: 20, positive: 14 },
    { name: "PHARMA", positive_pct: 55, total: 18, positive: 10 },
    { name: "FMCG", positive_pct: 60, total: 10, positive: 6 },
    { name: "METALS", positive_pct: 45, total: 11, positive: 5 },
    { name: "ENERGY", positive_pct: 42, total: 7, positive: 3 },
    { name: "INFRA", positive_pct: 66, total: 9, positive: 6 },
    { name: "REALTY", positive_pct: 30, total: 7, positive: 2 },
    { name: "CHEMICALS", positive_pct: 58, total: 12, positive: 7 },
  ],
};

// ── API normalizer ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBreadthData(raw: any): BreadthData {
  // Map sector_breadth_list (preferred) or sector_breadth dict
  let sectors: SectorBreadth[] = [];
  if (Array.isArray(raw.sector_breadth_list)) {
    sectors = raw.sector_breadth_list.map((s: any) => ({
      name: s.name,
      positive_pct: s.pct_positive ?? s.positive_pct ?? 0,
      total: s.total ?? 0,
      positive:
        s.positive ??
        Math.round(((s.pct_positive ?? 0) / 100) * (s.total ?? 1)),
    }));
  } else if (raw.sector_breadth && typeof raw.sector_breadth === "object") {
    sectors = Object.entries(raw.sector_breadth).map(([name, pct]) => ({
      name,
      positive_pct: pct as number,
      total: 0,
      positive: 0,
    }));
  }
  const totalSectors = sectors.length;
  const positiveSectors = sectors.filter((s) => s.positive_pct >= 50).length;

  return {
    advances: raw.advances ?? 0,
    declines: raw.declines ?? 0,
    unchanged: raw.unchanged ?? 0,
    adr: raw.advance_decline_ratio ?? raw.adr ?? 1,
    breadth_signal: raw.breadth_signal ?? "MODERATE",
    above_vwap_pct: raw.pct_above_vwap ?? raw.above_vwap_pct ?? 0,
    nifty50_positive_pct: raw.nifty50_breadth ?? raw.nifty50_positive_pct ?? 0,
    positive_sectors: positiveSectors,
    total_sectors: totalSectors,
    market_description:
      raw.market_description ??
      `${positiveSectors} of ${totalSectors} sectors positive.`,
    sectors,
    last_updated: raw.last_updated ?? "",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isMarketHours(): boolean {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 && mins <= 15 * 60 + 30;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function barColor(pct: number) {
  if (pct >= 60) return "#00C853";
  if (pct >= 40) return "#FFD600";
  return "#FF1744";
}

const SIGNAL_CFG: Record<
  BreadthData["breadth_signal"],
  { bg: string; color: string; border: string }
> = {
  STRONG: { bg: "#00C85322", color: "#00C853", border: "#00C85344" },
  MODERATE: { bg: "#FFD60022", color: "#FFD600", border: "#FFD60044" },
  WEAK: { bg: "#FF6D0022", color: "#FF6D00", border: "#FF6D0044" },
  VERY_WEAK: { bg: "#FF174422", color: "#FF1744", border: "#FF174444" },
};

// ── Donut Ring (pure SVG) ──────────────────────────────────────────────────

function DonutRing({
  pct,
  color,
  label,
  size = 100,
}: {
  pct: number;
  color: string;
  label: string;
  size?: number;
}) {
  const r = size * 0.35;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const cx = size / 2,
    cy = size / 2;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={size * 0.09}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={size * 0.2}
          fontWeight="bold"
          style={{
            transform: "rotate(90deg)",
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          {pct.toFixed(0)}%
        </text>
      </svg>
      <span style={{ color: "#888", fontSize: "11px" }}>{label}</span>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "120px",
        backgroundColor: "#161616",
        border: "1px solid #2a2a2a",
        borderRadius: "10px",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: "10px",
          marginBottom: "6px",
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div
        style={{ color, fontSize: "28px", fontWeight: "bold", lineHeight: 1 }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function BreadthTab() {
  const [data, setData] = useState<BreadthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function doFetch() {
    apiFetch("/breadth")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: unknown) => {
        setData(normalizeBreadthData(d));
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
    // Refresh every 60s always (breadth is lightweight)
    intervalRef.current = setInterval(doFetch, 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const pulse: React.CSSProperties = {
    animation: "breadthPulse 1.4s ease-in-out infinite",
    backgroundColor: "#1e1e1e",
    borderRadius: "8px",
  };

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      <style>{`@keyframes breadthPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          backgroundColor: "#111",
          borderBottom: "1px solid #222",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span style={{ color: "#ccc", fontSize: "13px", fontWeight: "bold" }}>
          📈 Market Breadth
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isOffline && (
            <span
              style={{
                color: "#FFD600",
                fontSize: "11px",
                backgroundColor: "#1a1400",
                border: "1px solid #5a4400",
                padding: "3px 10px",
                borderRadius: "6px",
              }}
            >
              ⚠️ Backend offline — mock data
            </span>
          )}
          {isMarketHours() && !loading && (
            <>
              <style>{`@keyframes livepulse2{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
              <span
                style={{
                  backgroundColor: "#1B5E20",
                  color: "#69F0AE",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  animation: "livepulse2 2s ease-in-out infinite",
                }}
              >
                🟢 Auto-refresh 60s
              </span>
            </>
          )}
          {lastUpdated && (
            <span style={{ color: "#444", fontSize: "11px" }}>
              Last updated: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* ── Row 1: 4 stat cards ── */}
        {loading ? (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ flex: 1, minWidth: "120px", height: "90px", ...pulse }}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <StatCard
              label="ADVANCES ↑"
              value={data!.advances}
              sub={`+${((data!.advances / (data!.advances + data!.declines)) * 100).toFixed(0)}%`}
              color="#00C853"
            />
            <StatCard
              label="DECLINES ↓"
              value={data!.declines}
              sub={`${((data!.declines / (data!.advances + data!.declines)) * 100).toFixed(0)}%`}
              color="#FF1744"
            />
            <StatCard
              label="ADR"
              value={data!.adr.toFixed(2)}
              sub={
                data!.adr >= 1.5
                  ? "Bullish"
                  : data!.adr >= 1
                    ? "Neutral"
                    : "Bearish"
              }
              color={
                data!.adr >= 1.5
                  ? "#00C853"
                  : data!.adr >= 1
                    ? "#FFD600"
                    : "#FF1744"
              }
            />
            <div
              style={{
                flex: 1,
                minWidth: "120px",
                backgroundColor: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  color: "#666",
                  fontSize: "10px",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                BREADTH
              </div>
              {(() => {
                const cfg = SIGNAL_CFG[data!.breadth_signal];
                return (
                  <span
                    style={{
                      backgroundColor: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {data!.breadth_signal}
                  </span>
                );
              })()}
              <div
                style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}
              >
                {data!.positive_sectors}/{data!.total_sectors} sectors positive
              </div>
            </div>
          </div>
        )}

        {/* ── Row 2: Sector bars + Donut rings ── */}
        {loading ? (
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div
              style={{ flex: 2, minWidth: "280px", height: "320px", ...pulse }}
            />
            <div
              style={{ flex: 1, minWidth: "200px", height: "320px", ...pulse }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            {/* Sector horizontal bar chart */}
            <div
              style={{
                flex: 2,
                minWidth: "280px",
                backgroundColor: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "#ccc",
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginBottom: "14px",
                }}
              >
                Sector Breadth
              </div>
              {[...data!.sectors]
                .sort((a, b) => b.positive_pct - a.positive_pct)
                .map((s) => {
                  const col = barColor(s.positive_pct);
                  return (
                    <div key={s.name} style={{ marginBottom: "10px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "3px",
                        }}
                      >
                        <span
                          style={{
                            color: "#aaa",
                            fontSize: "11px",
                            fontWeight: 600,
                            minWidth: "90px",
                          }}
                        >
                          {s.name}
                        </span>
                        <span
                          style={{
                            color: col,
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {s.positive_pct.toFixed(0)}% ({s.positive}/{s.total})
                        </span>
                      </div>
                      <div
                        style={{
                          backgroundColor: "#222",
                          borderRadius: "3px",
                          height: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${s.positive_pct}%`,
                            height: "100%",
                            backgroundColor: col,
                            borderRadius: "3px",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Donut rings */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  color: "#ccc",
                  fontWeight: "bold",
                  fontSize: "12px",
                  alignSelf: "flex-start",
                }}
              >
                Market Internals
              </div>
              <DonutRing
                pct={data!.above_vwap_pct}
                color="#2979FF"
                label="Above VWAP"
                size={120}
              />
              <DonutRing
                pct={data!.nifty50_positive_pct}
                color="#FF9800"
                label="Nifty50 Positive"
                size={100}
              />
            </div>
          </div>
        )}

        {/* ── Row 3: Market signal ── */}
        {!loading &&
          data &&
          (() => {
            const cfg = SIGNAL_CFG[data.breadth_signal];
            return (
              <div
                style={{
                  backgroundColor: "#111",
                  border: `1px solid ${cfg.border}`,
                  borderRadius: "10px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#888",
                      fontSize: "10px",
                      marginBottom: "6px",
                    }}
                  >
                    MARKET SIGNAL
                  </div>
                  <span
                    style={{
                      backgroundColor: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                      padding: "6px 16px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      fontSize: "18px",
                    }}
                  >
                    {data.breadth_signal}
                  </span>
                </div>
                <div
                  style={{
                    color: "#aaa",
                    fontSize: "13px",
                    flex: 1,
                    minWidth: "200px",
                  }}
                >
                  {data.market_description}
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
