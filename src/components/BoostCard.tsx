import {
  type BoostComponents,
  type BoostDirection,
  BoostStock,
} from "@/data/boostMockData";

interface BoostCardProps {
  stock: BoostStock;
}

const safe = (val: unknown, decimals = 1): string => {
  const num = parseFloat(val as string);
  if (val === undefined || val === null || isNaN(num)) return "--";
  return num.toFixed(decimals);
};

const safeNum = (val: unknown, fallback = 0): number => {
  const num = parseFloat(val as string);
  return isNaN(num) ? fallback : num;
};

function getBoostColor(score: number): string {
  if (score >= 3.5) return "#00C853";
  if (score >= 2.5) return "#FFD600";
  return "#F44336";
}

function getBoostLabel(score: number): {
  text: string;
  bg: string;
  color: string;
} {
  if (score >= 3.5)
    return { text: "STRONG", bg: "rgba(0,200,83,0.2)", color: "#00C853" };
  if (score >= 2.5)
    return { text: "MODERATE", bg: "rgba(255,214,0,0.2)", color: "#FFD600" };
  return { text: "WEAK", bg: "rgba(102,102,102,0.3)", color: "#888888" };
}

function getVwapColor(pct: number): string {
  if (pct > 0.5) return "#00C853";
  if (pct < -0.5) return "#F44336";
  return "#888888";
}

function formatNumber(value?: number, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}

function formatPercent(value?: number, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatCompactQuantity(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  if (Math.abs(value) >= 1_00_00_000) {
    return `${(value / 1_00_00_000).toFixed(2)}Cr`;
  }

  if (Math.abs(value) >= 1_00_000) {
    return `${(value / 1_00_000).toFixed(2)}L`;
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toFixed(0);
}

function getDirectionBadgeStyle(direction: BoostDirection) {
  if (direction === "up") {
    return {
      label: "UP",
      bg: "rgba(34, 197, 94, 0.14)",
      border: "rgba(34, 197, 94, 0.28)",
      color: "#4ADE80",
    };
  }

  if (direction === "down") {
    return {
      label: "DOWN",
      bg: "rgba(239, 68, 68, 0.14)",
      border: "rgba(239, 68, 68, 0.28)",
      color: "#F87171",
    };
  }

  return {
    label: "FLAT",
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.24)",
    color: "#CBD5E1",
  };
}

function formatComponentValue(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function buildComponentsTooltip(components?: BoostComponents) {
  if (!components) {
    return undefined;
  }

  const rows = [
    ["Rel Vol Burst", formatComponentValue(components.relative_volume_burst)],
    ["Price Velocity", formatComponentValue(components.price_velocity_burst)],
    ["Range Quality", formatComponentValue(components.range_expansion_quality)],
    [
      "Directional Efficiency",
      formatComponentValue(components.directional_efficiency),
    ],
    ["Institutional Hint", formatComponentValue(components.institutional_hint)],
    ["Confidence", formatComponentValue(components.confidence)],
    ["Data Mode", formatComponentValue(components.data_mode)],
    ["Details", formatComponentValue(components.details)],
    ["Daily Context", formatComponentValue(components.daily_context)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return rows.length > 0
    ? rows.map(([label, value]) => `${label}: ${value}`).join("\n")
    : undefined;
}

export function BoostCard({ stock }: BoostCardProps) {
  const boostColor = getBoostColor(safeNum(stock.boost_score));
  const badge = getBoostLabel(safeNum(stock.boost_score));
  const isPositive = safeNum(stock.change_pct) >= 0;
  const directionBadge = getDirectionBadgeStyle(
    stock.boost_direction ?? "flat",
  );
  const institutionalHint = safeNum(stock.institutional_hint_score, Number.NaN);
  const hasInstitutionalHint = Number.isFinite(institutionalHint);
  const componentsTooltip = buildComponentsTooltip(stock.boost_components);
  const vwapDeltaPct =
    stock.vwap && stock.vwap !== 0
      ? ((safeNum(stock.ltp) - stock.vwap) / stock.vwap) * 100
      : undefined;

  return (
    <div
      style={{
        backgroundColor: "#111111",
        borderRadius: "8px",
        borderLeft: `4px solid ${boostColor}`,
        padding: "14px",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
      title={componentsTooltip}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#111111";
      }}
    >
      {/* Row 1 — Symbol + Badges */}
      <div className="flex items-center justify-between gap-2">
        <span
          style={{ color: "#ffffff", fontWeight: "bold", fontSize: "15px" }}
        >
          {stock.symbol}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {stock.fo && (
            <span
              style={{
                backgroundColor: "#1565C0",
                color: "#ffffff",
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "9999px",
              }}
            >
              F&amp;O
            </span>
          )}
          <span
            style={{
              backgroundColor: directionBadge.bg,
              border: `1px solid ${directionBadge.border}`,
              color: directionBadge.color,
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "9999px",
              letterSpacing: "0.05em",
            }}
          >
            {directionBadge.label}
          </span>
          <span
            style={{
              backgroundColor: "#2a2a2a",
              color: "#888888",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "9999px",
            }}
          >
            {stock.quote_source ?? "BOOST"}
          </span>
        </div>
      </div>

      {/* Row 2 — LTP + Change */}
      <div className="flex items-center justify-between mt-2">
        <span style={{ color: "#888888", fontSize: "13px" }}>
          ₹{safeNum(stock.ltp).toLocaleString("en-IN")}
        </span>
        <span
          style={{
            color: isPositive ? "#00C853" : "#F44336",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}
          {safe(stock.change_pct, 2)}%
        </span>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #222222", margin: "12px 0" }} />

      {/* Row 3 — Boost Score */}
      <div className="flex items-center justify-between">
        <span
          style={{
            color: "#555555",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          BOOST SCORE
        </span>
        <span
          style={{
            color: boostColor,
            fontWeight: "bold",
            fontSize: "22px",
            lineHeight: 1,
          }}
        >
          {safe(stock.boost_score, 1)}
        </span>
      </div>

      {/* Row 4 — Progress Bar */}
      <div
        style={{
          backgroundColor: "#222222",
          height: "6px",
          borderRadius: "9999px",
          marginTop: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: boostColor,
            height: "100%",
            borderRadius: "9999px",
            width: `${(safeNum(stock.boost_score) / 5) * 100}%`,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Row 5 — STRONG/MODERATE/WEAK Badge */}
      <div style={{ marginTop: "10px" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{
              backgroundColor: badge.bg,
              color: badge.color,
              fontSize: "11px",
              fontWeight: "bold",
              padding: "3px 10px",
              borderRadius: "4px",
              letterSpacing: "0.05em",
            }}
          >
            {badge.text}
          </span>
          {hasInstitutionalHint && (
            <span
              title="Institutional hint is a soft heuristic only, not a certainty label."
              style={{
                backgroundColor: "rgba(148, 163, 184, 0.12)",
                border: "1px solid rgba(148, 163, 184, 0.24)",
                color: "#CBD5E1",
                fontSize: "10px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "9999px",
                letterSpacing: "0.03em",
              }}
            >
              Inst. hint {institutionalHint.toFixed(0)}
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #222222", margin: "12px 0" }} />

      {/* Row 6 — Stats Grid 2x2 */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        <div>
          <div
            style={{
              color: "#555555",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            Vol Ratio
          </div>
          <div
            style={{
              color:
                safeNum(stock.volume_ratio) > 2
                  ? "#FF6B00"
                  : safeNum(stock.volume_ratio) > 1.5
                    ? "#FFD600"
                    : "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {formatNumber(stock.volume_ratio, 2)}x
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#555555",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            Delivery
          </div>
          <div
            style={{
              color:
                safeNum(stock.delivery_pct) >= 60
                  ? "#00C853"
                  : safeNum(stock.delivery_pct) >= 40
                    ? "#FFD600"
                    : "#888888",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {formatPercent(stock.delivery_pct)}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#555555",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            Bid / Ask
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#E5E7EB" }}>
            {formatNumber(stock.bid_ask_ratio, 2)}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#555555",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            VWAP Delta
          </div>
          <div
            style={{
              color: getVwapColor(vwapDeltaPct ?? Number.NaN),
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {formatPercent(vwapDeltaPct)}
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-y-2 gap-x-4"
        style={{ marginTop: "10px" }}
      >
        <div>
          <div
            style={{
              color: "#555555",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            Bid Qty
          </div>
          <div style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: 600 }}>
            {formatCompactQuantity(stock.bid_qty)}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#555555",
              fontSize: "10px",
              textTransform: "uppercase",
            }}
          >
            Ask Qty
          </div>
          <div style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: 600 }}>
            {formatCompactQuantity(stock.ask_qty)}
          </div>
        </div>
      </div>
    </div>
  );
}
