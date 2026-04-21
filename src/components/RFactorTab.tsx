import { useState, useMemo, useEffect } from "react";
import { getPreScoreValue, getTriggerScoreValue } from "@/data/mockData";
import { rfactorMockData, RFactorData } from "@/data/rfactorMockData";
import { RFactorCard } from "./RFactorCard";
import { fetchRFactorData, type RFactorSortBy } from "@/lib/api";

type Direction = "ALL" | "LONG" | "SHORT" | "NEUTRAL";

function getDirectionValue(stock: RFactorData["stocks"][number]) {
  return (
    stock.inferred_direction ??
    (stock.change_pct > 0 ? "LONG" : stock.change_pct < 0 ? "SHORT" : "NEUTRAL")
  );
}

function getTierPenalty(
  stock: RFactorData["stocks"][number],
  sortBy: RFactorSortBy,
) {
  const tier = stock.tier?.toLowerCase();
  const opportunityScore = stock.opportunity_score ?? Number.NEGATIVE_INFINITY;
  const triggerScore = getTriggerScoreValue(stock) ?? Number.NEGATIVE_INFINITY;
  const hasExceptionalSetup = opportunityScore >= 8 || triggerScore >= 75;

  if (hasExceptionalSetup) {
    return 0;
  }

  if (tier === "very_weak") {
    return sortBy === "trend"
      ? 0.15
      : sortBy === "opportunity" || sortBy === "pre_score"
        ? 0.4
        : 4;
  }

  if (tier === "weak") {
    return sortBy === "trend"
      ? 0.08
      : sortBy === "opportunity" || sortBy === "pre_score"
        ? 0.2
        : 2;
  }

  return 0;
}

function getSortValue(
  stock: RFactorData["stocks"][number],
  sortBy: RFactorSortBy,
) {
  if (sortBy === "opportunity")
    return stock.opportunity_score ?? Number.NEGATIVE_INFINITY;
  if (sortBy === "trend")
    return stock.rfactor_trend_15m ?? Number.NEGATIVE_INFINITY;
  if (sortBy === "pre_score")
    return getPreScoreValue(stock) ?? Number.NEGATIVE_INFINITY;
  if (sortBy === "trigger_score")
    return getTriggerScoreValue(stock) ?? Number.NEGATIVE_INFINITY;
  if (sortBy === "direction_conf")
    return stock.direction_conf ?? Number.NEGATIVE_INFINITY;
  return stock.rfactor;
}

export function RFactorTab() {
  const [sortBy, setSortBy] = useState<RFactorSortBy>("rfactor");
  const [data, setData] = useState<RFactorData>(rfactorMockData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const hasVisibleData = data.stocks.length > 0;

    if (hasVisibleData) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchRFactorData(sortBy, controller.signal)
      .then((nextData) => {
        if (nextData) {
          setData(nextData);
          setError(false);
        } else {
          setData((currentData) =>
            currentData.stocks.length > 0 ? currentData : rfactorMockData,
          );
          setError(true);
        }
      })
      .catch((fetchError) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setData((currentData) =>
          currentData.stocks.length > 0 ? currentData : rfactorMockData,
        );
        setError(true);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });

    return () => controller.abort();
  }, [sortBy]);

  const [foOnly, setFoOnly] = useState<boolean>(false);
  const [minScore, setMinScore] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>("ALL");
  const maxRFactor = useMemo(() => {
    const highestScore = data.stocks.reduce(
      (currentMax, stock) => Math.max(currentMax, stock.rfactor),
      0,
    );
    return Math.max(100, Math.ceil(highestScore / 10) * 10);
  }, [data]);

  const filtered = useMemo(() => {
    return [...data.stocks]
      .filter((s) => !foOnly || s.fo)
      .filter((s) => s.rfactor >= minScore)
      .filter((s) => direction === "ALL" || getDirectionValue(s) === direction)
      .sort((a, b) => {
        const adjustedA = getSortValue(a, sortBy) - getTierPenalty(a, sortBy);
        const adjustedB = getSortValue(b, sortBy) - getTierPenalty(b, sortBy);

        return adjustedB - adjustedA;
      });
  }, [data, foOnly, minScore, direction, sortBy]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-blue-400 text-lg">
        ⏳ Loading R-Factor data...
      </div>
    );

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      {refreshing && !loading && (
        <div className="flex items-center justify-center gap-2 py-2 text-blue-300 text-xs bg-[#101726] border-b border-blue-950">
          Refreshing R-Factor data...
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center gap-2 py-2 text-yellow-500 text-xs bg-[#1a1100] border-b border-yellow-900">
          ⚠️ Backend not reachable — showing mock data. Start server:{" "}
          <code>python main.py</code>
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "#888888", fontSize: "12px" }}>
              Min Score:{" "}
              <strong style={{ color: "#cccccc" }}>{minScore}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={maxRFactor}
              step={5}
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
            {(["ALL", "LONG", "SHORT", "NEUTRAL"] as Direction[]).map((dir) => (
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
                {dir}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RFactorSortBy)}
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
            disabled={refreshing}
          >
            <option value="rfactor">R-Factor</option>
            <option value="opportunity">Opportunity</option>
            <option value="trend">Trend 15m</option>
            <option value="pre_score">Pre Score</option>
            <option value="trigger_score">Trigger Score</option>
            <option value="direction_conf">Direction Conf</option>
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
          <span style={{ fontSize: "16px" }}>
            🔍 No stocks match current filters
          </span>
          <span style={{ fontSize: "13px" }}>
            Try adjusting the filters above
          </span>
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
