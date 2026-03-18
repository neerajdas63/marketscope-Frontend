import { useState, useEffect, useRef } from "react";
import { morningWatchlistMockData } from "../data/morningWatchlistMockData";
import { apiFetch } from "@/lib/api";

// ── Date helpers ───────────────────────────────────────────────────────────

const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDate = (dateStr) => {
  const year = parseInt(dateStr.split("-")[0], 10);
  return year >= 2020 && year <= 2030;
};

const fmtDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

/** Returns true if current IST time is within 9:30–10:00 */
function isOrbWindow() {
  const now = new Date();
  // IST = UTC+5:30
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 3600000;
  const ist = new Date(istMs);
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 9 * 60 + 30 && mins <= 10 * 60;
}

function isBeforeMarket() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 3600000;
  const ist = new Date(istMs);
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins < 9 * 60 + 30;
}

function fmtTime(dateObj) {
  const utcMs = dateObj.getTime() + dateObj.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 3600000;
  const ist = new Date(istMs);
  const h = String(ist.getHours()).padStart(2, "0");
  const m = String(ist.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

const safe = (val, dec = 2) => {
  const n = parseFloat(val);
  return isNaN(n) ? "--" : n.toFixed(dec);
};

// ── Sub-components ─────────────────────────────────────────────────────────

function BiasBadge({ bias }) {
  const cfg = {
    LONG: { bg: "#00C853", text: "#fff" },
    SHORT: { bg: "#FF1744", text: "#fff" },
    WAIT: { bg: "#424242", text: "#9E9E9E" },
  };
  const c = cfg[bias] ?? cfg.WAIT;
  return (
    <span
      style={{
        backgroundColor: c.bg,
        color: c.text,
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: "4px",
        letterSpacing: "0.5px",
        whiteSpace: "nowrap",
      }}
    >
      {bias ?? "WAIT"}
    </span>
  );
}

function ScoreBar({ score, max = 8 }) {
  const pct = Math.min(100, Math.max(0, ((score ?? 0) / max) * 100));
  const barColor =
    pct >= 75 ? "#00C853" : pct >= 50 ? "#FFB300" : pct >= 25 ? "#FF6D00" : "#F44336";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div
        style={{
          width: "48px",
          height: "6px",
          backgroundColor: "#2a2a2a",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: "3px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ color: "#aaa", fontSize: "10px", minWidth: "18px" }}>
        {score ?? "--"}
      </span>
    </div>
  );
}

function SectorCard({ sector, rank }) {
  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const rankColor = rankColors[rank] ?? "#555";
  return (
    <div
      style={{
        flex: 1,
        minWidth: "160px",
        backgroundColor: "#161616",
        border: `1px solid ${rankColor}44`,
        borderRadius: "10px",
        padding: "12px 14px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          color: rankColor,
          fontSize: "18px",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        #{rank + 1}
      </div>
      <div style={{ color: "#aaa", fontSize: "10px", marginBottom: "4px" }}>
        TOP SECTOR
      </div>
      <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
        {sector.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <BiasBadge bias={sector.bias} />
        {sector.change_pct !== undefined && (
          <span
            style={{
              color: sector.change_pct >= 0 ? "#00C853" : "#FF1744",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {sector.change_pct >= 0 ? "+" : ""}
            {safe(sector.change_pct, 2)}%
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  const pulse = {
    backgroundColor: "#1e1e1e",
    borderRadius: "4px",
    animation: "skeletonPulse 1.4s ease-in-out infinite",
  };
  return (
    <tr>
      {[140, 80, 70, 70, 70, 80, 80, 70, 60, 80].map((w, i) => (
        <td key={i} style={{ padding: "10px 8px", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ ...pulse, width: `${w}px`, height: "12px" }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function MorningWatchlist() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const intervalRef = useRef(null);

  const dateStr = selectedDate === "today"
    ? getToday()
    : selectedDate === "yesterday"
    ? getYesterday()
    : customDate;

  function doFetch(date) {
    if (!date || !isValidDate(date)) return;
    apiFetch(`/morning-watchlist?date=${date}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setError("");
        setLoading(false);
        setGeneratedAt(fmtTime(new Date()));
      })
      .catch(() => {
        // Backend unavailable — fall back to mock data for front-end development
        setData(morningWatchlistMockData);
        setError("⚠️ Backend offline — showing mock data");
        setLoading(false);
        setGeneratedAt(fmtTime(new Date()));
      });
  }

  // Re-fetch when date selection changes
  useEffect(() => {
    const date =
      selectedDate === "today"
        ? getToday()
        : selectedDate === "yesterday"
        ? getYesterday()
        : customDate;

    if (selectedDate === "custom" && !customDate) return;

    setLoading(true);
    setData(null);
    setError("");
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

    doFetch(date);

    // Auto-refresh only for today within ORB window
    if (selectedDate === "today") {
      intervalRef.current = setInterval(() => {
        if (isOrbWindow()) doFetch(getToday());
      }, 60_000);
    }

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, customDate]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const rows = data?.watchlist ?? [];
  const topSectors = data?.top_sectors ?? [];

  const filtered =
    filter === "ALL" ? rows : rows.filter((r) => r.bias === filter);

  const filterCounts = {
    ALL: rows.length,
    LONG: rows.filter((r) => r.bias === "LONG").length,
    SHORT: rows.filter((r) => r.bias === "SHORT").length,
    WAIT: rows.filter((r) => r.bias === "WAIT").length,
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const thStyle = {
    backgroundColor: "#111111",
    color: "#666",
    padding: "9px 10px",
    textAlign: "left",
    borderBottom: "1px solid #2a2a2a",
    fontWeight: 600,
    whiteSpace: "nowrap",
    fontSize: "11px",
  };
  const tdStyle = {
    padding: "9px 10px",
    borderBottom: "1px solid #1a1a1a",
    fontSize: "12px",
    color: "#cccccc",
    whiteSpace: "nowrap",
  };

  const btnBase = {
    padding: "5px 14px",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "6px",
    border: "1px solid #333",
    cursor: "pointer",
    backgroundColor: "#1a1a1a",
    color: "#888",
  };
  const btnActive = {
    ...btnBase,
    backgroundColor: "#1565C0",
    border: "1px solid #2979FF",
    color: "#ffffff",
  };

  const filterBtn = (key) => ({
    ...(filter === key ? btnActive : btnBase),
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          backgroundColor: "#111111",
          borderBottom: "1px solid #222",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "bold" }}>
          🌅 Morning Watchlist
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {dateStr && (
            <span style={{ color: "#666", fontSize: "11px" }}>
              {fmtDisplayDate(dateStr)}
            </span>
          )}
          {generatedAt && (
            <span
              style={{
                backgroundColor: "#1a1a1a",
                color: "#888",
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "6px",
                border: "1px solid #2a2a2a",
              }}
            >
              Generated at {generatedAt}
            </span>
          )}
          {selectedDate === "today" && isOrbWindow() && (
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
                🟢 LIVE — refreshing every 60s
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Date selector ───────────────────────────────────────────────── */}
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
          onClick={() => setSelectedDate("today")}
        >
          TODAY
        </button>
        <button
          style={selectedDate === "yesterday" ? btnActive : btnBase}
          onClick={() => setSelectedDate("yesterday")}
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
            const year = parseInt(val.split("-")[0], 10);
            if (year < 2020 || year > 2030) return;
            setCustomDate(val);
            setSelectedDate("custom");
          }}
        />
      </div>

      {/* ── Before market hours notice ───────────────────────────────────── */}
      {selectedDate === "today" && isBeforeMarket() && (
        <div
          style={{
            margin: "12px 16px 0",
            backgroundColor: "#1c1c1c",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#888",
            fontSize: "12px",
          }}
        >
          ⏰ Market not open yet — Watchlist generates at 9:30 AM IST
        </div>
      )}

      {/* ── Historical banner ────────────────────────────────────────────── */}
      {selectedDate !== "today" && dateStr && (
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
          📅 Historical — {fmtDisplayDate(dateStr)}
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            margin: "12px 16px 0",
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

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Top sectors cards */}
        {(loading || topSectors.length > 0) && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {loading
              ? [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      minWidth: "160px",
                      height: "80px",
                      backgroundColor: "#161616",
                      borderRadius: "10px",
                      animation: "skeletonPulse 1.4s ease-in-out infinite",
                    }}
                  />
                ))
              : topSectors.slice(0, 3).map((s, i) => (
                  <SectorCard key={s.name ?? i} sector={s} rank={i} />
                ))}
          </div>
        )}

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {["ALL", "LONG", "SHORT", "WAIT"].map((f) => (
            <button key={f} style={filterBtn(f)} onClick={() => setFilter(f)}>
              {f}
              <span
                style={{
                  marginLeft: "6px",
                  backgroundColor: "#0d0d0d",
                  color: "#aaa",
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "3px",
                }}
              >
                {filterCounts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: "8px" }}>
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: "1000px",
              fontSize: "12px",
              width: "100%",
            }}
          >
            <thead>
              <tr>
                {[
                  "SYMBOL", "SECTOR", "BIAS",
                  "ORB HIGH", "ORB LOW", "CURRENT",
                  "PREV HIGH", "VOL RATIO", "SCORE", "ACTION",
                ].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      ...thStyle,
                      position: i === 0 ? "sticky" : undefined,
                      left: i === 0 ? 0 : undefined,
                      zIndex: i === 0 ? 3 : undefined,
                      textAlign: i === 0 ? "left" : "center",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        textAlign: "center",
                        padding: "32px",
                        color: "#555",
                        fontSize: "13px",
                      }}
                    >
                      {rows.length === 0
                        ? "No watchlist data available for this date."
                        : `No ${filter} setups found.`}
                    </td>
                  </tr>
                )
                : filtered.map((row, ri) => {
                    const rowBg = ri % 2 === 0 ? "#141414" : "#111111";
                    const isAboveOrb =
                      row.current_price != null &&
                      row.orb_high != null &&
                      row.current_price > row.orb_high;
                    const isBelowOrb =
                      row.current_price != null &&
                      row.orb_low != null &&
                      row.current_price < row.orb_low;
                    return (
                      <tr key={row.symbol ?? ri}>
                        {/* Symbol — sticky */}
                        <td
                          style={{
                            ...tdStyle,
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            backgroundColor: rowBg,
                            fontWeight: 700,
                            color: "#ffffff",
                          }}
                        >
                          {row.symbol ?? "--"}
                        </td>

                        {/* Sector */}
                        <td style={{ ...tdStyle, backgroundColor: rowBg, color: "#aaa" }}>
                          {row.sector ?? "--"}
                        </td>

                        {/* Bias badge */}
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>
                          <BiasBadge bias={row.bias} />
                        </td>

                        {/* ORB High */}
                        <td
                          style={{
                            ...tdStyle,
                            backgroundColor: rowBg,
                            textAlign: "center",
                            color: "#FF9800",
                          }}
                        >
                          {row.orb_high != null ? row.orb_high.toFixed(2) : "--"}
                        </td>

                        {/* ORB Low */}
                        <td
                          style={{
                            ...tdStyle,
                            backgroundColor: rowBg,
                            textAlign: "center",
                            color: "#42A5F5",
                          }}
                        >
                          {row.orb_low != null ? row.orb_low.toFixed(2) : "--"}
                        </td>

                        {/* Current Price */}
                        <td
                          style={{
                            ...tdStyle,
                            backgroundColor: rowBg,
                            textAlign: "center",
                            fontWeight: 600,
                            color: isAboveOrb
                              ? "#00C853"
                              : isBelowOrb
                              ? "#FF1744"
                              : "#cccccc",
                          }}
                        >
                          {row.current_price != null ? row.current_price.toFixed(2) : "--"}
                          {isAboveOrb && (
                            <span style={{ fontSize: "9px", marginLeft: "3px", color: "#00C853" }}>
                              ▲ORB
                            </span>
                          )}
                          {isBelowOrb && (
                            <span style={{ fontSize: "9px", marginLeft: "3px", color: "#FF1744" }}>
                              ▼ORB
                            </span>
                          )}
                        </td>

                        {/* Prev Day High */}
                        <td
                          style={{
                            ...tdStyle,
                            backgroundColor: rowBg,
                            textAlign: "center",
                            color: "#888",
                          }}
                        >
                          {row.prev_day_high != null ? row.prev_day_high.toFixed(2) : "--"}
                        </td>

                        {/* Volume Ratio */}
                        <td
                          style={{
                            ...tdStyle,
                            backgroundColor: rowBg,
                            textAlign: "center",
                            color:
                              row.volume_ratio >= 2
                                ? "#00C853"
                                : row.volume_ratio >= 1.5
                                ? "#FFB300"
                                : "#888",
                          }}
                        >
                          {row.volume_ratio != null ? `${row.volume_ratio.toFixed(1)}x` : "--"}
                        </td>

                        {/* Score bar */}
                        <td style={{ ...tdStyle, backgroundColor: rowBg, textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center" }}>
                            <ScoreBar score={row.score} />
                          </div>
                        </td>

                        {/* Action */}
                        <td
                          style={{
                            ...tdStyle,
                            backgroundColor: rowBg,
                            textAlign: "center",
                          }}
                        >
                          {row.action ? (
                            <span
                              style={{
                                backgroundColor:
                                  row.action === "BUY"
                                    ? "#00C85322"
                                    : row.action === "SELL"
                                    ? "#FF174422"
                                    : "#2a2a2a",
                                color:
                                  row.action === "BUY"
                                    ? "#00C853"
                                    : row.action === "SELL"
                                    ? "#FF1744"
                                    : "#888",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "4px",
                                border: `1px solid ${
                                  row.action === "BUY"
                                    ? "#00C85344"
                                    : row.action === "SELL"
                                    ? "#FF174444"
                                    : "#333"
                                }`,
                              }}
                            >
                              {row.action}
                            </span>
                          ) : (
                            <span style={{ color: "#444", fontSize: "11px" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Row count */}
        {!loading && filtered.length > 0 && (
          <div style={{ color: "#444", fontSize: "11px", textAlign: "right" }}>
            Showing {filtered.length} of {rows.length} stocks
          </div>
        )}
      </div>
    </div>
  );
}

export default MorningWatchlist;
