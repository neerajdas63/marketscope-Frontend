import { useState, useMemo, useEffect } from "react";
import { type BoostComponents, type BoostDirection, BoostStock } from "@/data/boostMockData";
import { BoostCard } from "./BoostCard";
import { apiFetch } from "@/lib/api";

type Direction = "ALL" | "GAINERS" | "LOSERS";
type SortBy = "backend" | "boost_score" | "change_pct" | "vol_surge";

type BoostStatus = "ready" | "warming_up";

interface BoostResponse {
  stocks: BoostStock[];
  total: number;
  lastUpdated: string;
  status: BoostStatus;
  message: string;
}

const VALID_BOOST_DIRECTIONS: BoostDirection[] = ["up", "down", "flat"];

function asFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function asOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return undefined;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asBoostDirection(value: unknown): BoostDirection | undefined {
  return typeof value === "string" && VALID_BOOST_DIRECTIONS.includes(value as BoostDirection)
    ? (value as BoostDirection)
    : undefined;
}

function asBoostComponents(value: unknown): BoostComponents | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const components = value as Record<string, unknown>;

  return {
    relative_volume_burst: asFiniteNumber(components.relative_volume_burst),
    price_velocity_burst: asFiniteNumber(components.price_velocity_burst),
    range_expansion_quality: asFiniteNumber(components.range_expansion_quality),
    directional_efficiency: asFiniteNumber(components.directional_efficiency),
    institutional_hint: asFiniteNumber(components.institutional_hint),
    confidence: asFiniteNumber(components.confidence),
    data_mode: asOptionalString(components.data_mode),
    details: typeof components.details === "string" || (components.details && typeof components.details === "object")
      ? (components.details as string | Record<string, unknown>)
      : undefined,
    daily_context: typeof components.daily_context === "string" || (components.daily_context && typeof components.daily_context === "object")
      ? (components.daily_context as string | Record<string, unknown>)
      : undefined,
  };
}

function normalizeBoostStock(value: unknown): BoostStock | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const stock = value as Record<string, unknown>;
  const symbol = asOptionalString(stock.symbol);
  if (!symbol) {
    return null;
  }

  return {
    symbol,
    ltp: asFiniteNumber(stock.ltp),
    change_pct: asFiniteNumber(stock.change_pct),
    volume_ratio: asFiniteNumber(stock.volume_ratio),
    fo: asOptionalBoolean(stock.fo) ?? false,
    day_high: asFiniteNumber(stock.day_high),
    day_low: asFiniteNumber(stock.day_low),
    day_open: asFiniteNumber(stock.day_open),
    vwap: asFiniteNumber(stock.vwap),
    quote_source: asOptionalString(stock.quote_source),
    delivery_source: asOptionalString(stock.delivery_source),
    delivery_pct: asFiniteNumber(stock.delivery_pct),
    bid_ask_ratio: asFiniteNumber(stock.bid_ask_ratio),
    bid_qty: asFiniteNumber(stock.bid_qty),
    ask_qty: asFiniteNumber(stock.ask_qty),
    boost_score: asFiniteNumber(stock.boost_score),
    boost_direction: asBoostDirection(stock.boost_direction),
    institutional_hint_score: asFiniteNumber(stock.institutional_hint_score),
    boost_components: asBoostComponents(stock.boost_components),
  };
}

function normalizeBoostPayload(payload: unknown): BoostResponse {
  if (!payload || typeof payload !== "object") {
    return { stocks: [], total: 0, lastUpdated: "", status: "ready", message: "" };
  }

  const data = payload as Record<string, unknown>;
  const rawStocks = Array.isArray(data.stocks) ? data.stocks : [];

  return {
    stocks: rawStocks
      .map((stock) => normalizeBoostStock(stock))
      .filter((stock): stock is BoostStock => stock !== null),
    total: asFiniteNumber(data.total) ?? rawStocks.length,
    lastUpdated: asOptionalString(data.last_updated) ?? "",
    status: asOptionalString(data.status) === "warming_up" ? "warming_up" : "ready",
    message: asOptionalString(data.message) ?? "",
  };
}

export function BoostTab() {
  const [response, setResponse] = useState<BoostResponse>({ stocks: [], total: 0, lastUpdated: "", status: "ready", message: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit] = useState<number>(50);
  const [foOnly, setFoOnly] = useState<boolean>(false);
  const [minScore, setMinScore] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("backend");

  useEffect(() => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      limit: String(limit),
      fo_only: String(foOnly),
      min_score: String(minScore),
    });

    apiFetch(`/boost?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const normalized = normalizeBoostPayload(d);
        setResponse(normalized);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Backend error: ${err.message}. Start server: python main.py`);
        setLoading(false);
      });
  }, [limit, foOnly, minScore]);

  const filtered = useMemo(() => {
    const stocks = response.stocks ?? [];

    return stocks
      .filter(
        (s) =>
          direction === "ALL" ||
          (direction === "GAINERS" && (s.change_pct ?? 0) > 0) ||
          (direction === "LOSERS" && (s.change_pct ?? 0) < 0)
      )
      .sort((a, b) => {
        if (sortBy === "backend") return 0;
        if (sortBy === "boost_score") return (b.boost_score ?? 0) - (a.boost_score ?? 0);
        if (sortBy === "change_pct") return Math.abs(b.change_pct ?? 0) - Math.abs(a.change_pct ?? 0);
        return (b.volume_ratio ?? 0) - (a.volume_ratio ?? 0);
      });
  }, [response.stocks, direction, sortBy]);

  const hasStocks = Array.isArray(response.stocks) && response.stocks.length > 0;
  const isWarmingUp = response.status === "warming_up";

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

  if (isWarmingUp)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: "10px", color: "#2979FF", fontSize: "16px" }}>
        <span>⏳ Intraday Boost is warming up...</span>
        <span style={{ color: "#888888", fontSize: "13px" }}>{response.message || "Waiting for the backend to publish the first boost snapshot."}</span>
      </div>
    );

  if (!hasStocks)
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
            <option value="backend">Backend Order</option>
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
            Updated: {response.lastUpdated}
          </span>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ color: "#555555", fontSize: "13px", padding: "8px 16px" }}>
        Showing {filtered.length} of {response.total} stocks
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
