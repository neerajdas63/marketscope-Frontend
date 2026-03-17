import { useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type PulseNavigatorActionabilityLabel, type PulseNavigatorStock } from "@/data/pulseNavigatorData";

const directionStyles = {
  LONG: { color: "#4ADE80", background: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.25)" },
  SHORT: { color: "#F87171", background: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.25)" },
  NEUTRAL: { color: "#CBD5E1", background: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.22)" },
} as const;

const actionabilityStyles: Record<PulseNavigatorActionabilityLabel, { label: string; color: string; background: string; border: string }> = {
  clean_setup: {
    label: "Clean Setup",
    color: "#86EFAC",
    background: "rgba(22, 101, 52, 0.25)",
    border: "rgba(34, 197, 94, 0.28)",
  },
  needs_pullback: {
    label: "Needs Pullback",
    color: "#FCD34D",
    background: "rgba(146, 64, 14, 0.22)",
    border: "rgba(245, 158, 11, 0.28)",
  },
  extended: {
    label: "Extended",
    color: "#FDBA74",
    background: "rgba(154, 52, 18, 0.24)",
    border: "rgba(251, 146, 60, 0.3)",
  },
  risky_spike: {
    label: "Risky Spike",
    color: "#FCA5A5",
    background: "rgba(127, 29, 29, 0.25)",
    border: "rgba(248, 113, 113, 0.32)",
  },
  neutral: {
    label: "Watch",
    color: "#CBD5E1",
    background: "rgba(30, 41, 59, 0.5)",
    border: "rgba(100, 116, 139, 0.28)",
  },
};

function formatNumber(value: number, digits = 1) {
  if (Number.isNaN(value)) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}

function formatSignedPercent(value: number, digits = 1) {
  if (Number.isNaN(value)) {
    return "--";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function Stat({ label, value, valueStyle }: { label: string; value: string; valueStyle?: CSSProperties }) {
  return (
    <div>
      <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 700, marginTop: "4px", ...valueStyle }}>{value}</div>
    </div>
  );
}

export function PulseNavigatorStockCard({
  stock,
  emphasis = "default",
}: {
  stock: PulseNavigatorStock;
  emphasis?: "default" | "fresh" | "leader";
}) {
  const [warningsOpen, setWarningsOpen] = useState(false);
  const directionTone = directionStyles[stock.direction];
  const actionabilityTone = actionabilityStyles[stock.actionability_label];
  const showWarningToggle = stock.warning_count > 0 || stock.warning_flags.length > 0;
  const accentBorder = emphasis === "leader"
    ? actionabilityTone.border
    : emphasis === "fresh"
      ? "rgba(56, 189, 248, 0.28)"
      : "rgba(51, 65, 85, 0.72)";

  return (
    <div
      style={{
        background: emphasis === "leader"
          ? "linear-gradient(160deg, rgba(11, 18, 32, 0.96), rgba(15, 23, 42, 0.98))"
          : "rgba(9, 15, 28, 0.84)",
        borderRadius: "16px",
        border: `1px solid ${accentBorder}`,
        boxShadow: emphasis === "leader" ? `0 18px 42px -28px ${actionabilityTone.border}` : "none",
        padding: emphasis === "leader" ? "16px" : "14px",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div style={{ color: "#F8FAFC", fontSize: emphasis === "leader" ? "20px" : "18px", fontWeight: 800 }}>{stock.symbol}</div>
          <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}>{stock.sector}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            style={{
              color: directionTone.color,
              background: directionTone.background,
              border: `1px solid ${directionTone.border}`,
              fontSize: "11px",
              fontWeight: 700,
              borderRadius: "9999px",
              padding: "3px 10px",
            }}
          >
            {stock.direction}
          </span>
          <span
            style={{
              color: actionabilityTone.color,
              background: actionabilityTone.background,
              border: `1px solid ${actionabilityTone.border}`,
              fontSize: "11px",
              fontWeight: 700,
              borderRadius: "9999px",
              padding: "3px 10px",
            }}
          >
            {actionabilityTone.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <Stat label="Pulse Score" value={formatNumber(stock.momentum_pulse_score, 1)} valueStyle={{ color: "#F8FAFC", fontSize: emphasis === "leader" ? "18px" : "16px" }} />
        <Stat label="Confidence" value={`${formatNumber(stock.direction_confidence, 0)}%`} valueStyle={{ color: directionTone.color }} />
        <Stat label="Rel Strength" value={formatSignedPercent(stock.relative_strength, 1)} valueStyle={{ color: stock.relative_strength >= 0 ? "#86EFAC" : "#FCA5A5" }} />
        <Stat label="10m Delta" value={formatSignedPercent(stock.score_change_10m, 1)} valueStyle={{ color: stock.score_change_10m >= 0 ? "#7DD3FC" : "#FCA5A5" }} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: "#CFFAFE", fontSize: "12px", fontWeight: 700 }}>
            {stock.pulse_trend_label}
          </span>
          <span style={{ color: "#64748B", fontSize: "12px" }}>
            Trend {formatNumber(stock.pulse_trend_strength, 1)}
          </span>
        </div>
        <span style={{ color: "#94A3B8", fontSize: "12px" }}>
          {stock.latest_bar_time || "Latest bar --"}
        </span>
      </div>

      {stock.reasons.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 mt-4">
          {stock.reasons.slice(0, 3).map((reason) => (
            <div
              key={reason}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                color: "#CBD5E1",
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: actionabilityTone.color, marginTop: "2px" }}>•</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#64748B", fontSize: "12px", marginTop: "14px" }}>Awaiting fresh explanatory reasons.</div>
      )}

      {stock.ui_tags.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap mt-4">
          {stock.ui_tags.map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                border: "1px solid rgba(51, 65, 85, 0.8)",
                color: "#CBD5E1",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "9999px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {showWarningToggle ? (
        <Collapsible open={warningsOpen} onOpenChange={setWarningsOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full mt-4"
              style={{
                color: "#94A3B8",
                backgroundColor: "rgba(15, 23, 42, 0.55)",
                border: "1px solid rgba(51, 65, 85, 0.7)",
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                {stock.warning_count} warning{stock.warning_count === 1 ? "" : "s"}
              </span>
              <span className="flex items-center gap-1 text-xs">
                Details
                {warningsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              style={{
                marginTop: "8px",
                backgroundColor: "rgba(120, 53, 15, 0.12)",
                border: "1px solid rgba(180, 83, 9, 0.24)",
                borderRadius: "12px",
                padding: "12px",
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {stock.warning_flags.length > 0 ? stock.warning_flags.map((flag) => (
                  <span
                    key={flag}
                    style={{
                      backgroundColor: "rgba(120, 53, 15, 0.28)",
                      color: "#FDBA74",
                      borderRadius: "9999px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {flag}
                  </span>
                )) : (
                  <span style={{ color: "#FDBA74", fontSize: "12px" }}>Caution flags present</span>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}