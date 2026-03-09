import { RFactorStock } from "@/data/rfactorMockData";
import {
  getAlertStageValue,
  getChaseReasonValue,
  getIsChaseValue,
  getPreScoreValue,
  getTriggerScoreValue,
  type InferredDirection,
} from "@/data/mockData";
import { formatInsightNumber, InsightTooltip, StageBadge, TrendIndicator } from "./StockInsightWidgets";

interface RFactorCardProps {
  stock: RFactorStock;
}

function getBorderColor(rfactor: number): string {
  if (rfactor >= 75) return "#00C853";
  if (rfactor >= 60) return "#FFD600";
  if (rfactor >= 40) return "#FF6B00";
  return "#F44336";
}

function getRsiMfiColor(value: number): string {
  if (value > 60) return "#00C853";
  if (value >= 40) return "#FFD600";
  return "#F44336";
}

function getDirectionTone(direction?: InferredDirection) {
  if (direction === "LONG") {
    return { color: "#4ADE80", background: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.28)" };
  }

  if (direction === "SHORT") {
    return { color: "#F87171", background: "rgba(248, 113, 113, 0.14)", border: "rgba(248, 113, 113, 0.28)" };
  }

  return { color: "#CBD5E1", background: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.25)" };
}

function formatMetricValue(value?: number | string | boolean, digits = 1) {
  if (value === undefined || value === null) {
    return "--";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
}

function formatConfidence(confidence?: number) {
  if (confidence === undefined || confidence === null || Number.isNaN(confidence)) {
    return "--";
  }

  const normalized = confidence <= 1 ? confidence * 100 : confidence;
  return Math.round(normalized).toString();
}

function formatLevel(value?: number | string) {
  if (value === undefined || value === null) {
    return "--";
  }

  if (typeof value === "number") {
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  return value;
}

function renderStat(label: string, value: string, color = "#ffffff") {
  return (
    <div>
      <div style={{ color: "#555555", fontSize: "10px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color, fontSize: "13px", fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

export function RFactorCard({ stock }: RFactorCardProps) {
  const resolvedPreScore = getPreScoreValue(stock);
  const resolvedTriggerScore = getTriggerScoreValue(stock);
  const chaseWarning = getIsChaseValue(stock);
  const chaseReason = getChaseReasonValue(stock);
  const alertStage = getAlertStageValue(stock);
  const inferredDirection =
    stock.inferred_direction ?? (stock.change_pct > 0 ? "LONG" : stock.change_pct < 0 ? "SHORT" : "NEUTRAL");
  const borderColor = getBorderColor(stock.rfactor);
  const isPositive = stock.change_pct >= 0;
  const progressWidth = `${Math.max(0, Math.min(stock.rfactor, 100))}%`;
  const trendLabel =
    stock.rfactor_trend_15m === undefined
      ? "Trend --"
      : `Trend ${stock.rfactor_trend_15m > 0 ? "+" : ""}${stock.rfactor_trend_15m.toFixed(2)}`;
  const opportunityLabel = `Opportunity ${formatInsightNumber(stock.opportunity_score, 1)}`;
  const directionTone = getDirectionTone(inferredDirection);
  const directionLabel = inferredDirection;
  const confidenceLabel = `Conf ${formatConfidence(stock.direction_conf)}`;

  return (
    <div
      style={{
        backgroundColor: "#111111",
        borderRadius: "8px",
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: chaseWarning ? "inset 0 0 0 1px rgba(249, 115, 22, 0.28)" : "none",
        padding: "14px",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#111111";
      }}
    >
      {/* Row 1 — Symbol + Badges */}
      <div className="flex items-center justify-between gap-2">
        <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "15px" }}>
          {stock.symbol}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
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
          <StageBadge stage={stock.setup_stage} />
          {alertStage && alertStage !== stock.setup_stage && (
            <span
              style={{
                backgroundColor: "#1f2937",
                color: "#cbd5e1",
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "9999px",
                border: "1px solid #334155",
              }}
            >
              {alertStage}
            </span>
          )}
          <span
            style={{
              backgroundColor: "#2a2a2a",
              color: "#888888",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "9999px",
            }}
          >
            {stock.sector}
          </span>
        </div>
      </div>

      {/* Row 2 — LTP + Change */}
      <div className="flex items-center justify-between mt-2">
        <span style={{ color: "#888888", fontSize: "13px" }}>
          ₹{stock.ltp.toLocaleString("en-IN")}
        </span>
        <span
          style={{
            color: isPositive ? "#00C853" : "#F44336",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}
          {stock.change_pct.toFixed(2)}%
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: directionTone.background,
            border: `1px solid ${directionTone.border}`,
            borderRadius: "9999px",
            padding: "3px 10px",
          }}
        >
          <span style={{ color: directionTone.color, fontSize: "11px", fontWeight: 700 }}>
            {directionLabel}
          </span>
          <span style={{ color: "#cbd5e1", fontSize: "11px", fontWeight: 600 }}>
            {confidenceLabel}
          </span>
        </div>
        {stock.tier && (
          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
            Tier {stock.tier}
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #222222", margin: "12px 0" }} />

      {/* Row 3 — R-Factor Label + Score */}
      <div className="flex items-center justify-between">
        <InsightTooltip
          label="R-Factor"
          description="Current strength / confirmation"
        >
          <span
            style={{
              color: "#555555",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            R-FACTOR
          </span>
        </InsightTooltip>
        <span
          style={{
            color: borderColor,
            fontWeight: "bold",
            fontSize: "22px",
            lineHeight: 1,
          }}
        >
          {stock.rfactor.toFixed(2)}
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
            backgroundColor: borderColor,
            height: "100%",
            borderRadius: "9999px",
            width: progressWidth,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div
          style={{
            backgroundColor: "#151515",
            border: "1px solid #242424",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <InsightTooltip
            label="Trend"
            description="Whether R-Factor is rising in recent candles"
          >
            <div style={{ color: "#555555", fontSize: "10px", textTransform: "uppercase" }}>
              Trend 15m
            </div>
          </InsightTooltip>
          <div className="mt-1.5">
            <TrendIndicator
              trend={stock.rfactor_trend_15m}
              acceleration={stock.rfactor_trend_acceleration}
              points={stock.rfactor_trend_points}
            />
          </div>
          <div style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, marginTop: "8px" }}>
            {trendLabel}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#151515",
            border: "1px solid #242424",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <InsightTooltip
            label="Opportunity"
            description="Early-entry quality before overextension"
          >
            <div style={{ color: "#555555", fontSize: "10px", textTransform: "uppercase" }}>
              Opportunity
            </div>
          </InsightTooltip>
          <div
            style={{
              color: "#FDBA74",
              fontSize: "18px",
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: "6px",
            }}
          >
            {formatInsightNumber(stock.opportunity_score, 1)}
          </div>
          <div style={{ color: "#FCD9AE", fontSize: "11px", fontWeight: 600, marginTop: "8px" }}>
            {opportunityLabel}
          </div>
        </div>
      </div>

      {(chaseWarning || chaseReason) && (
        <div
          style={{
            marginTop: "10px",
            backgroundColor: "rgba(249, 115, 22, 0.12)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.18)",
                color: "#FB923C",
                border: "1px solid rgba(251, 146, 60, 0.32)",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "9999px",
                padding: "2px 8px",
              }}
            >
              CHASE
            </span>
            <span style={{ color: "#FCD9AE", fontSize: "11px", fontWeight: 600 }}>
              {chaseReason ?? "Price is extended away from the ideal early-entry zone"}
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: "1px solid #222222", margin: "12px 0" }} />

      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {renderStat("RSI", stock.rsi.toFixed(1), getRsiMfiColor(stock.rsi))}
        {renderStat("MFI", stock.mfi.toFixed(1), getRsiMfiColor(stock.mfi))}
        {renderStat("RS", `${stock.relative_strength >= 0 ? "+" : ""}${stock.relative_strength.toFixed(2)}%`, stock.relative_strength >= 0 ? "#00C853" : "#F44336")}
        {renderStat("Pre", formatMetricValue(resolvedPreScore), "#93C5FD")}
        {renderStat("Trigger", formatMetricValue(resolvedTriggerScore), "#FBBF24")}
        {renderStat("Level", formatLevel(stock.nearest_level), "#E5E7EB")}
        {renderStat("Dist %", stock.dist_pct === undefined ? "--" : `${formatInsightNumber(stock.dist_pct, 2)}%`, "#E2E8F0")}
        {renderStat("VWAP Acc", formatMetricValue(stock.vwap_acceptance), "#A5F3FC")}
        {renderStat("Direction", directionLabel, directionTone.color)}
        {renderStat("Breakout", formatMetricValue(stock.breakout_quality), "#FDBA74")}
        {renderStat("Chase", chaseWarning ? "Risk" : "Clear", chaseWarning ? "#FB923C" : "#94A3B8")}
        {renderStat("Compression", formatMetricValue(stock.compression), "#C4B5FD")}
      </div>

      {(stock.breakout_levels?.length || stock.proximity_score !== undefined) && (
        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: "10px", color: "#64748B", fontSize: "11px", lineHeight: 1.5 }}>
          {stock.breakout_levels?.length ? (
            <InsightTooltip
              label="Breakout Levels"
              description={stock.breakout_levels.map((level) => formatLevel(level)).join(" / ")}
            >
              <span style={{ color: "#94A3B8", fontWeight: 600 }}>
                Levels ({stock.breakout_levels.length})
              </span>
            </InsightTooltip>
          ) : null}
          {stock.proximity_score !== undefined ? (
            <span>
              {stock.breakout_levels?.length ? "| " : ""}Proximity {formatInsightNumber(stock.proximity_score, 1)}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
