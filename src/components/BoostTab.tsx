import { useState, useMemo, useEffect } from "react";
import { BoostStock } from "@/data/boostMockData";
import { BoostCard } from "./BoostCard";
import { apiUrl } from "@/lib/api";

type Direction = "ALL" | "GAINERS" | "LOSERS";
type SortBy = "boost_score" | "change_pct" | "vol_surge";

export function BoostTab() {
  const [stocks, setStocks] = useState<BoostStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl("/boost?limit=50"))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setStocks(d.stocks || []);
        setLastUpdated(d.last_updated || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(`Backend error: ${err.message}. Start server: python main.py`);
        setLoading(false);
      });
  }, []);

  const [foOnly, setFoOnly] = useState<boolean>(false);
  const [minScore, setMinScore] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("boost_score");

  const filtered = useMemo(() => {
    return stocks
      .filter((s) => !foOnly || s.fo)
      .filter((s) => s.boost_score >= minScore)
      .filter(
        (s) =>
          direction === "ALL" ||
          (direction === "GAINERS" && s.change_pct > 0) ||
          (direction === "LOSERS" && s.change_pct < 0)
      )
      .sort((a, b) => {
        if (sortBy === "boost_score") return b.boost_score - a.boost_score;
        if (sortBy === "change_pct") return Math.abs(b.change_pct) - Math.abs(a.change_pct);
        return b.vol_surge - a.vol_surge;
      });
  }, [stocks, foOnly, minScore, direction, sortBy]);

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#2979FF", fontSize: "16px" }}>
        ⏳ Loading Boost data...
      </div>
    );

  if (error)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
        <span style={{ color: "#F44336", fontSize: "16px" }}>❌ {error}</span>
      </div>
    );

  if (stocks.length === 0)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#555", fontSize: "16px" }}>
        No boost data available
      </div>
    );

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>

      {/* Filter Bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "#0d0d0d",
          borderBottom: "1px solid #222222",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* F&O Toggle */}
          <button
            onClick={() => setFoOnly(!foOnly)}
            style={{
              padding: "5px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              backgroundColor: foOnly ? "#2979FF" : "#1a1a1a",
              color: foOnly ? "#ffffff" : "#666666",
              transition: "background-color 0.15s ease, color 0.15s ease",
            }}
          >
            F&amp;O Only
          </button>

          {/* Min Score Slider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "#888888", fontSize: "12px" }}>
              Min Score:{" "}
              <strong style={{ color: "#cccccc" }}>{minScore.toFixed(1)}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ accentColor: "#2979FF", cursor: "pointer", width: "100px" }}
            />
          </div>

          {/* Direction Buttons */}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["ALL", "GAINERS", "LOSERS"] as Direction[]).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirection(dir)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  backgroundColor: direction === dir ? "#2979FF" : "#1a1a1a",
                  color: direction === dir ? "#ffffff" : "#666666",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
              >
                {dir === "GAINERS" ? "GAINERS ▲" : dir === "LOSERS" ? "LOSERS ▼" : dir}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            style={{
              backgroundColor: "#1a1a1a",
              color: "#cccccc",
              border: "1px solid #333333",
              borderRadius: "6px",
              padding: "5px 10px",
              fontSize: "12px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="boost_score">Boost Score ↓</option>
            <option value="change_pct">% Change ↓</option>
            <option value="vol_surge">Volume ↓</option>
          </select>

          {/* Updated time */}
          <span
            style={{
              color: "#444444",
              fontSize: "11px",
              marginLeft: "auto",
              whiteSpace: "nowrap",
            }}
          >
            Updated: {lastUpdated}
          </span>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ color: "#555555", fontSize: "13px", padding: "8px 16px" }}>
        Showing {filtered.length} stocks
      </div>

      {/* Card Grid or Empty State */}
      {filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 16px",
            gap: "8px",
            color: "#555555",
          }}
        >
          <span style={{ fontSize: "16px" }}>🔍 No stocks match current filters</span>
          <span style={{ fontSize: "13px" }}>Try adjusting the filters above</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {filtered.map((stock) => (
            <BoostCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
