import { useState, useMemo, useEffect } from "react";
import { rfactorMockData, RFactorData } from "@/data/rfactorMockData";
import { RFactorCard } from "./RFactorCard";
import { apiUrl } from "@/lib/api";

type Direction = "ALL" | "GAINERS" | "LOSERS";
type SortBy = "rfactor" | "change_pct" | "volume_ratio";

export function RFactorTab() {
  const [data, setData] = useState<RFactorData>(rfactorMockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
  fetch(apiUrl("/rfactor?limit=50"))
    .then((r) => r.json())
    .then((d) => {
      console.log("LIVE DATA:", d.last_updated); // ← add karo
      setData(d);
      setLoading(false);
      setError(false);   // ← yeh line hai?
    })
    .catch((err) => {
      console.log("FETCH ERROR:", err); // ← add karo
      setLoading(false);
      setError(true);
    });
}, []);

  const [foOnly, setFoOnly] = useState<boolean>(false);
  const [minScore, setMinScore] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("rfactor");

  const filtered = useMemo(() => {
    return data.stocks
      .filter((s) => !foOnly || s.fo)
      .filter((s) => s.rfactor >= minScore)
      .filter(
        (s) =>
          direction === "ALL" ||
          (direction === "GAINERS" && s.change_pct > 0) ||
          (direction === "LOSERS" && s.change_pct < 0)
      )
      .sort((a, b) => {
        if (sortBy === "rfactor") return b.rfactor - a.rfactor;
        if (sortBy === "change_pct")
          return Math.abs(b.change_pct) - Math.abs(a.change_pct);
        return b.volume_ratio - a.volume_ratio;
      });
  }, [data, foOnly, minScore, direction, sortBy]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-blue-400 text-lg">
      ⏳ Loading R-Factor data...
    </div>
  );

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      {error && (
        <div className="flex items-center justify-center gap-2 py-2 text-yellow-500 text-xs bg-[#1a1100] border-b border-yellow-900">
          ⚠️ Backend not reachable — showing mock data. Start server: <code>python main.py</code>
        </div>
      )}
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
            style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}
          >
            <span style={{ color: "#888888", fontSize: "12px" }}>
              Min Score: <strong style={{ color: "#cccccc" }}>{minScore}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{
                accentColor: "#2979FF",
                cursor: "pointer",
                width: "100px",
              }}
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
            <option value="rfactor">R-Factor ↓</option>
            <option value="change_pct">% Change ↓</option>
            <option value="volume_ratio">Volume ↓</option>
          </select>

          {/* Updated time — pushed to the right */}
          <span
            style={{
              color: "#444444",
              fontSize: "11px",
              marginLeft: "auto",
              whiteSpace: "nowrap",
            }}
          >
            Updated: {data.last_updated}
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
            <RFactorCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
