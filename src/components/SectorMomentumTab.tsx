import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface SectorResult {
  label: string;
  color: string;
  delta?: number;
}

interface SectorData {
  current?: number;
  snapshots?: Record<string, number | null>;
  result?: SectorResult;
}

interface SectorRow {
  name: string;
  current?: number;
  snapshots?: Record<string, number | null>;
  result?: SectorResult;
}

interface TopSector {
  name: string;
  change_pct: number;
  result?: SectorResult;
}

interface ApiResponse {
  sectors?: Record<string, SectorData>;
  slots?: string[];
  top_long?: TopSector[];
  top_short?: TopSector[];
  last_updated?: string;
  has_data?: boolean;
  is_live?: boolean;
  is_historical?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const safe = (val: unknown, dec = 2): string => {
  const n = parseFloat(val as string);
  return isNaN(n) ? "--" : n.toFixed(dec);
};

function fmtPct(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val as number)) return "--";
  const v = val as number;
  return `${v >= 0 ? "+" : ""}${safe(v, 2)}%`;
}

function getCellStyle(val: number | null | undefined): React.CSSProperties {
  if (val === null || val === undefined || isNaN(val as number)) {
    return { backgroundColor: "#1a1a1a", color: "#555555" };
  }
  let bg = "#7F0000";
  if (val >= 1.5) bg = "#1B5E20";
  else if (val >= 0.5) bg = "#2E7D32";
  else if (val >= 0) bg = "#388E3C";
  else if (val >= -0.5) bg = "#C62828";
  else if (val >= -1.5) bg = "#B71C1C";
  return { backgroundColor: bg, color: "#ffffff" };
}

const ALL_SLOTS = ["9:15", "9:20", "9:25", "9:30", "9:35",
                   "9:40", "9:45", "9:50", "9:55", "10:00"];

function isMarketHours(): boolean {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  return mins >= 9 * 60 + 15 && mins <= 10 * 60;
}

/** Returns true after the opening session (after 10:00 AM IST) */
function isAfterOpeningSession(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.getHours() * 60 + ist.getMinutes() > 10 * 60;
}

// ── SummaryCard ─────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  borderColor,
  items,
  sectorMap,
  subtitle,
  pillSectors,
}: {
  title: string;
  borderColor: string;
  items: TopSector[];
  sectorMap: Record<string, SectorRow>;
  subtitle?: string;
  pillSectors?: { name: string; value: number }[];
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: "#161616",
        border: `1px solid ${borderColor}`,
        borderRadius: "10px",
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
        <div style={{ color: borderColor, fontWeight: "bold", fontSize: "13px" }}>{title}</div>
        {subtitle && <span style={{ color: "#555", fontSize: "10px" }}>{subtitle}</span>}
      </div>

      {/* Final snapshot pills (shown after 10 AM when live items are empty) */}
      {items.length === 0 && pillSectors && pillSectors.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {[...pillSectors].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).map((s) => (
            <span
              key={s.name}
              style={{
                backgroundColor: borderColor === "#00C853" ? "#00C85322" : "#FF174422",
                color: borderColor,
                border: `1px solid ${borderColor}44`,
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "20px",
                whiteSpace: "nowrap",
              }}
            >
              {s.name} {s.value >= 0 ? "+" : ""}{s.value.toFixed(2)}%
            </span>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: "#555", fontSize: "12px" }}>No data yet</div>
      ) : (
        items.map((s) => {
          const pos = s.change_pct >= 0;
          const result = s.result ?? sectorMap[s.name]?.result;
          return (
            <div
              key={s.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 0",
                borderBottom: "1px solid #222",
                fontSize: "12px",
                gap: "8px",
              }}
            >
              <span style={{ color: "#dddddd", fontWeight: 600, whiteSpace: "nowrap" }}>
                {s.name}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{ color: pos ? "#00C853" : "#F44336", fontWeight: 600 }}>
                  {pos ? "+" : ""}
                  {safe(s.change_pct, 2)}%
                </span>
                {result && (
                  <span
                    style={{
                      backgroundColor: result.color || "#333",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {result.label}
                  </span>
                )}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

function MomentumTable({
  sectors,
  isEod,
}: {
  sectors: SectorRow[];
  isEod: boolean;
}) {
  if (sectors.length === 0)
    return (
      <div style={{ color: "#555", padding: "24px 16px", fontSize: "13px" }}>
        No sector data available yet.
      </div>
    );

  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid #222",
        borderRadius: "8px",
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          minWidth: "1200px",
          fontSize: "11px",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "200px" }} />
          {ALL_SLOTS.map((t) => (
            <col key={t} style={{ width: "80px" }} />
          ))}
          <col style={{ width: "180px" }} />
        </colgroup>
        <thead>
          <tr>
            <th
              style={{
                position: "sticky",
                left: 0,
                zIndex: 3,
                backgroundColor: "#111111",
                color: "#888",
                textAlign: "left",
                padding: "9px 12px",
                borderBottom: "1px solid #2a2a2a",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              SECTOR
            </th>
            {ALL_SLOTS.map((t) => (
              <th
                key={t}
                style={{
                  backgroundColor: "#111111",
                  color: "#666",
                  padding: "9px 4px",
                  textAlign: "center",
                  borderBottom: "1px solid #2a2a2a",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </th>
            ))}
            <th
              style={{
                position: "sticky",
                right: 0,
                zIndex: 3,
                backgroundColor: "#111111",
                color: "#aaaaaa",
                padding: "9px 10px",
                textAlign: "center",
                borderBottom: "1px solid #2a2a2a",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              RESULT
            </th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((sector, ri) => {
            const rowBg = ri % 2 === 0 ? "#141414" : "#111111";
            // For EOD mode: the EOD snapshot value maps to the first column (9:15)
            const eodVal = isEod
              ? (sector.snapshots?.["EOD"] ?? sector.current ?? null)
              : null;
            return (
              <tr key={sector.name}>
                {/* Sticky SECTOR cell */}
                <td
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    backgroundColor: rowBg,
                    color: "#ffffff",
                    fontWeight: "bold",
                    padding: "8px 12px",
                    borderBottom: "1px solid #1e1e1e",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sector.name}
                </td>

                {/* Time-slot cells */}
                {ALL_SLOTS.map((t, idx) => {
                  // EOD mode: show value only in the first column
                  const val: number | null | undefined = isEod
                    ? (idx === 0 ? eodVal : null)
                    : (sector.snapshots?.[t] ?? null);
                  const isEmpty = val === null || val === undefined || isNaN(val as number);
                  const cellStyle = getCellStyle(isEmpty ? null : (val as number));
                  return (
                    <td
                      key={t}
                      style={{
                        ...cellStyle,
                        padding: "6px 4px",
                        textAlign: "center",
                        borderBottom: "1px solid #1e1e1e",
                        fontWeight: "normal",
                      }}
                    >
                      {isEmpty ? (
                        "--"
                      ) : (
                        <>
                          <div>{fmtPct(val as number)}</div>
                          {isEod && idx === 0 && (
                            <div style={{ fontSize: "9px", color: "#aaa", marginTop: "1px" }}>
                              (EOD)
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}

                {/* Sticky RESULT cell */}
                <td
                  style={{
                    position: "sticky",
                    right: 0,
                    zIndex: 1,
                    backgroundColor: sector.result?.color ?? "#1a1a2e",
                    color: "#ffffff",
                    fontWeight: "bold",
                    padding: "8px 10px",
                    borderBottom: "1px solid #1e1e1e",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                    {sector.result?.label ?? (isEod ? "BASE (EOD)" : "--")}
                  </div>
                  {sector.result?.delta !== undefined && (
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "10px",
                        opacity: 0.8,
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Δ {fmtPct(sector.result.delta)}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── ResultBanner ────────────────────────────────────────────────────────────

function ResultBanner({
  topLong,
  topShort,
  allSectors,
}: {
  topLong: TopSector[];
  topShort: TopSector[];
  allSectors: SectorRow[];
}) {
  const longNames = new Set(topLong.map((s) => s.name));
  const shortNames = new Set(topShort.map((s) => s.name));
  const neutral = allSectors.filter(
    (s) => !longNames.has(s.name) && !shortNames.has(s.name)
  );

  const hasContent = topLong.length > 0 || topShort.length > 0 || neutral.length > 0;
  if (!hasContent) return null;

  const sectorMap: Record<string, SectorRow> = {};
  allSectors.forEach((s) => { sectorMap[s.name] = s; });

  const fmtLong = (s: TopSector) => {
    const result = s.result ?? sectorMap[s.name]?.result;
    const label = result?.label ?? "UP";
    return `${s.name} (${label} ${fmtPct(s.change_pct)})`;
  };

  const fmtShort = (s: TopSector) => {
    const result = s.result ?? sectorMap[s.name]?.result;
    const label = result?.label ?? "DOWN";
    return `${s.name} (${label} ${fmtPct(s.change_pct)})`;
  };

  const fmtNeutral = (s: SectorRow) => {
    const label = s.result?.label ?? "STABLE →";
    return `${s.name} (${label} ${fmtPct(s.current)})`;
  };

  return (
    <div
      style={{
        backgroundColor: "#0f0f14",
        border: "1px solid #2a2a2a",
        borderRadius: "10px",
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "7px",
      }}
    >
      {topLong.length > 0 && (
        <div style={{ color: "#69F0AE", fontSize: "12px", lineHeight: "1.5" }}>
          ✅ TRADE LONG: {topLong.map(fmtLong).join(", ")}
        </div>
      )}
      {topShort.length > 0 && (
        <div style={{ color: "#FF5252", fontSize: "12px", lineHeight: "1.5" }}>
          🔴 TRADE SHORT: {topShort.map(fmtShort).join(", ")}
        </div>
      )}
      {neutral.length > 0 && (
        <div style={{ color: "#888888", fontSize: "12px", lineHeight: "1.5" }}>
          ⚪ NEUTRAL: {neutral.map(fmtNeutral).join(", ")}
        </div>
      )}
    </div>
  );
}

// ── Helpers (date) ────────────────────────────────────────────────────────

// Use getFullYear() NOT getYear() — getYear() returns years since 1900 (bug)
const getToday = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDate = (dateStr: string): boolean => {
  const year = parseInt(dateStr.split("-")[0], 10);
  return year >= 2020 && year <= 2030;
};

function fmtDisplayDate(dateStr: string): string {
  // dateStr = "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ── Main Component ─────────────────────────────────────────────────────────

export function SectorMomentumTab() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLiveRef = useRef(false);

  function buildUrl(mode: "today" | "yesterday" | "custom", custom: string): string | null {
    if (mode === "today") return apiUrl("/sector-momentum");
    const dateStr = mode === "yesterday" ? getYesterday() : custom;
    if (!isValidDate(dateStr)) {
      console.error("Invalid date:", dateStr);
      return null;
    }
    return apiUrl(`/sector-momentum/history?date=${dateStr}`);
  }

  function doFetch(mode: "today" | "yesterday" | "custom" = selectedDate, custom = customDate) {
    const isHistorical = mode !== "today";
    const url = buildUrl(mode, custom);
    if (!url) return;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: ApiResponse) => {
        setData(d);
        setError("");
        setLoading(false);

        if (isHistorical) {
          // No auto-refresh for historical
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          return;
        }

        // Adjust poll interval when is_live changes
        const nowLive = d.is_live ?? false;
        if (nowLive !== isLiveRef.current) {
          isLiveRef.current = nowLive;
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => doFetch("today", ""), nowLive ? 10_000 : 30_000);
        }
      })
      .catch((err: Error) => {
        setError(`Backend error: ${err.message}. Make sure the server is running.`);
        setLoading(false);
      });
  }

  // Re-fetch whenever selectedDate / customDate changes
  useEffect(() => {
    if (selectedDate === "custom" && !customDate) return; // wait for a date to be chosen
    setLoading(true);
    setData(null);
    setError("");
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    isLiveRef.current = false;
    doFetch(selectedDate, customDate);
    if (selectedDate === "today") {
      intervalRef.current = setInterval(() => doFetch("today", ""), 30_000);
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, customDate]);

  // ── Loading / error guards ───────────────────────────────────────────────

  if (loading)
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
        ⏳ Loading sector data…
      </div>
    );

  if (error && !data)
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

  const sectorsObj = data?.sectors || {};
  const slots = data?.slots || [];
  const isLive = data?.is_live ?? false;
  const isHistorical = selectedDate !== "today";
  const isEod = !isHistorical && slots.length === 1 && slots[0] === "EOD";
  const historicalDateStr =
    selectedDate === "yesterday" ? getYesterday() :
    selectedDate === "custom" ? customDate : "";

  const sectorList: SectorRow[] = Object.keys(sectorsObj).map(
    (name) => ({ name, ...sectorsObj[name] })
  );

  const topLong: TopSector[] = data?.top_long || [];
  const topShort: TopSector[] = data?.top_short || [];
  const lastUpdated = data?.last_updated || "";
  const hasData = (data?.has_data !== false) && sectorList.length > 0;

  const sectorMap: Record<string, SectorRow> = {};
  sectorList.forEach((s) => { sectorMap[s.name] = s; });

  const inMarket = isMarketHours();

  const btnBase: React.CSSProperties = {
    padding: "5px 12px",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "6px",
    border: "1px solid #333",
    cursor: "pointer",
    backgroundColor: "#1a1a1a",
    color: "#888",
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    backgroundColor: "#1565C0",
    border: "1px solid #2979FF",
    color: "#ffffff",
  };

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          backgroundColor: "#111111",
          borderBottom: "1px solid #222222",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "bold" }}>
          📊 Sector Momentum — 5-Min Tracker
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {!isHistorical && isLive ? (
            <>
              <style>{`@keyframes livepulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
              <span
                style={{
                  backgroundColor: "#1B5E20",
                  color: "#69F0AE",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  animation: "livepulse 2s ease-in-out infinite",
                }}
              >
                🟢 LIVE — refreshing every 10s
              </span>
            </>
          ) : !isHistorical && hasData ? (
            <span
              style={{
                backgroundColor: "#1a1a1a",
                color: "#888888",
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "6px",
                border: "1px solid #2a2a2a",
              }}
            >
              📊 Last available data
            </span>
          ) : null}
          {lastUpdated && (
            <span style={{ color: "#444", fontSize: "11px" }}>Updated {lastUpdated}</span>
          )}
        </div>
      </div>

      {/* ── Date selector bar ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#0f0f0f",
          borderBottom: "1px solid #1e1e1e",
          flexWrap: "wrap",
        }}
      >
        <button
          style={selectedDate === "today" ? btnActive : btnBase}
          onClick={() => { setSelectedDate("today"); }}
        >
          TODAY
        </button>
        <button
          style={selectedDate === "yesterday" ? btnActive : btnBase}
          onClick={() => { setSelectedDate("yesterday"); }}
        >
          YESTERDAY
        </button>
        <input
          type="date"
          value={selectedDate === "custom" ? customDate : ""}
          max={new Date().toISOString().split("T")[0]}
          min="2020-01-01"
          style={{
            padding: "5px 10px",
            background: selectedDate === "custom" ? "#1565C0" : "#2a2a2a",
            color: "#ffffff",
            border: `1px solid ${selectedDate === "custom" ? "#2979FF" : "#444"}`,
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            colorScheme: "dark",
            outline: "none",
          }}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            const year = parseInt(val.split("-")[0]);
            if (year < 2020 || year > 2030) return;
            setCustomDate(val);
            setSelectedDate("custom");
          }}
        />
      </div>

      {/* ── Historical banner ───────────────────────────────────────────── */}
      {isHistorical && historicalDateStr && (
        <div
          style={{
            margin: "12px 16px 0",
            backgroundColor: "#0d1a2e",
            border: "1px solid #1565C0",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#90CAF9",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          📅 Historical — {fmtDisplayDate(historicalDateStr)}
        </div>
      )}

      {/* ── Outside market hours banner (today only) ─────────────────────── */}
      {!isHistorical && !inMarket && (
        <div
          style={{
            margin: "12px 16px 0",
            backgroundColor: "#1c1c1c",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#888888",
            fontSize: "12px",
          }}
        >
          {isAfterOpeningSession()
            ? "📊 Opening session ended — showing final 10:00 AM snapshot"
            : "⏰ Live tracking activates at 9:15 AM — Showing last available data"}
        </div>
      )}

      {/* ── No data placeholder ─────────────────────────────────────────── */}
      {!hasData && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "45vh",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <span style={{ color: "#888888", fontSize: "15px", textAlign: "center" }}>
            No sector data available yet.
            <br />
            <span style={{ fontSize: "13px", color: "#555" }}>
              Tracking begins at 9:15 AM each trading day.
            </span>
          </span>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      {hasData && (
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Strong / Weak summary cards */}
          {(() => {
            const isFinal = !isHistorical && isAfterOpeningSession();
            const subtitle = isFinal ? "Final (10:00 AM)" : undefined;

            const finalLongPills: { name: string; value: number }[] =
              isFinal && topLong.length === 0
                ? sectorList
                    .map((s) => ({ name: s.name, value: (s.snapshots?.["10:00"] ?? s.current ?? null) as number | null }))
                    .filter((s): s is { name: string; value: number } => s.value !== null && s.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                : [];

            const finalShortPills: { name: string; value: number }[] =
              isFinal && topShort.length === 0
                ? sectorList
                    .map((s) => ({ name: s.name, value: (s.snapshots?.["10:00"] ?? s.current ?? null) as number | null }))
                    .filter((s): s is { name: string; value: number } => s.value !== null && s.value < 0)
                    .sort((a, b) => a.value - b.value)
                    .slice(0, 5)
                : [];

            return (
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <SummaryCard
                  title="📈 Strong Sectors"
                  borderColor="#00C853"
                  items={topLong}
                  sectorMap={sectorMap}
                  subtitle={subtitle}
                  pillSectors={finalLongPills}
                />
                <SummaryCard
                  title="📉 Weak Sectors"
                  borderColor="#F44336"
                  items={topShort}
                  sectorMap={sectorMap}
                  subtitle={subtitle}
                  pillSectors={finalShortPills}
                />
              </div>
            );
          })()}

          {/* Momentum table */}
          <MomentumTable
            sectors={sectorList}
            isEod={isEod}
          />

          {/* Result banner */}
          <ResultBanner
            topLong={topLong}
            topShort={topShort}
            allSectors={sectorList}
          />
        </div>
      )}

      {/* ── Stale data warning ──────────────────────────────────────────── */}
      {error && data && (
        <div
          style={{
            margin: "12px 16px",
            backgroundColor: "#1a0d0d",
            border: "1px solid #4a1010",
            borderRadius: "8px",
            padding: "8px 14px",
            color: "#FF8A80",
            fontSize: "12px",
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
