import { Stock } from "@/data/mockData";
import {
  getChangeColor,
  getTileFlex,
  formatCurrency,
  getAdaptiveBgColor,
} from "@/lib/market";
import { useState } from "react";
import {
  formatInsightNumber,
  InsightTooltip,
  StageBadge,
  TrendIndicator,
} from "./StockInsightWidgets";

interface StockTileProps {
  stock: Stock;
  colorRange?: { min: number; max: number };
}

const VWAP_LABELS: Record<string, { label: string; color: string }> = {
  ABOVE: { label: "▲ ABOVE VWAP", color: "#00C853" },
  EXTENDED_ABOVE: { label: "▲▲ EXTENDED ABOVE", color: "#69F0AE" },
  AT_VWAP: { label: "≈ AT VWAP", color: "#FFD600" },
  BELOW: { label: "▼ BELOW VWAP", color: "#FF1744" },
  EXTENDED_BELOW: { label: "▼▼ EXTENDED BELOW", color: "#FF5252" },
};

export function StockTile({ stock, colorRange }: StockTileProps) {
  const [hovered, setHovered] = useState(false);
  const flex = getTileFlex(stock.change_pct);
  const hasInsights =
    stock.rfactor !== undefined ||
    stock.rfactor_trend_15m !== undefined ||
    (stock.rfactor_trend_points?.length ?? 0) >= 3 ||
    stock.opportunity_score !== undefined ||
    stock.setup_stage !== undefined;

  // 6c: use adaptive color when colorRange is provided, otherwise fall back to fixed classes
  const adaptiveBg = colorRange
    ? getAdaptiveBgColor(stock.change_pct, colorRange.min, colorRange.max)
    : null;
  const bg = colorRange ? undefined : getChangeColor(stock.change_pct);

  // 6a: relative strength badge
  const rs = stock.relative_strength;
  const rsBadge =
    rs !== undefined && rs > 0.5
      ? { label: "▲ NF", color: "#69F0AE", bg: "#003300" }
      : rs !== undefined && rs < -0.5
        ? { label: "▼ NF", color: "#FF5252", bg: "#330000" }
        : null;

  // 6b: vwap position
  const vwapInfo = stock.vwap_position
    ? VWAP_LABELS[stock.vwap_position]
    : null;

  return (
    <div
      className={`relative ${bg ?? ""} rounded ${hasInsights ? "min-h-[74px] items-stretch" : "min-h-[50px] items-center justify-center"} flex flex-col px-1.5 py-1.5 cursor-pointer transition-all duration-150 hover:brightness-125`}
      style={{ flex, ...(adaptiveBg ? { backgroundColor: adaptiveBg } : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex w-full items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="font-bold text-[11px] md:text-[11px] text-[9px] text-primary-foreground leading-tight truncate max-w-full">
            {stock.symbol}
          </div>
          <div className="text-[10px] md:text-[10px] text-[8px] text-primary-foreground/80 font-medium">
            {stock.change_pct > 0 ? "+" : ""}
            {stock.change_pct.toFixed(1)}%
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StageBadge stage={stock.setup_stage} className="px-1.5 text-[9px]" />
        </div>
      </div>

      {hasInsights && (
        <div className="mt-1 flex w-full flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <InsightTooltip
              label="R-Factor"
              description="Current strength / confirmation"
            >
              <div className="inline-flex items-center gap-1 text-[9px] text-primary-foreground/90">
                <span className="text-primary-foreground/55 uppercase tracking-[0.16em]">
                  RF
                </span>
                <span className="font-semibold tabular-nums">
                  {formatInsightNumber(stock.rfactor, 1)}
                </span>
              </div>
            </InsightTooltip>
            <InsightTooltip
              label="Opportunity"
              description="Early-entry quality before overextension"
            >
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-100 tabular-nums">
                <span className="uppercase tracking-[0.14em] text-amber-100/80">
                  Opp
                </span>
                <span>{formatInsightNumber(stock.opportunity_score, 1)}</span>
              </div>
            </InsightTooltip>
          </div>
          {(stock.rfactor_trend_15m !== undefined ||
            (stock.rfactor_trend_points?.length ?? 0) >= 3) && (
            <InsightTooltip
              label="Trend"
              description="Whether R-Factor is rising in recent candles"
            >
              <div className="flex items-center justify-between gap-2 text-[9px] text-primary-foreground/90">
                <span className="uppercase tracking-[0.16em] text-primary-foreground/55">
                  Trend
                </span>
                <TrendIndicator
                  compact
                  trend={stock.rfactor_trend_15m}
                  acceleration={stock.rfactor_trend_acceleration}
                  points={stock.rfactor_trend_points}
                />
              </div>
            </InsightTooltip>
          )}
        </div>
      )}

      {/* 6a: Relative Strength badge in top-right corner */}
      {rsBadge && (
        <span
          style={{
            position: "absolute",
            top: stock.setup_stage ? "24px" : "2px",
            right: "2px",
            backgroundColor: rsBadge.bg,
            color: rsBadge.color,
            fontSize: "7px",
            fontWeight: 700,
            padding: "1px 3px",
            borderRadius: "2px",
            lineHeight: 1,
            pointerEvents: "none",
          }}
        >
          {rsBadge.label}
        </span>
      )}

      {/* Hover tooltip with VWAP position (6b) */}
      {hovered && (
        <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded px-3 py-2 text-xs whitespace-nowrap shadow-lg pointer-events-none">
          <span className="text-foreground font-semibold">{stock.symbol}</span>
          <span className="text-muted-foreground">
            {" "}
            | LTP: {formatCurrency(stock.ltp)}
          </span>
          <span
            className={
              stock.change_pct >= 0 ? "text-gain-medium" : "text-loss-medium"
            }
          >
            {" "}
            | {stock.change_pct > 0 ? "+" : ""}
            {stock.change_pct.toFixed(1)}%
          </span>
          {vwapInfo && (
            <span style={{ color: vwapInfo.color }}> | {vwapInfo.label}</span>
          )}
          {rs !== undefined && (
            <span
              style={{
                color: rs > 0.5 ? "#69F0AE" : rs < -0.5 ? "#FF5252" : "#888",
              }}
            >
              {" "}
              | RS: {rs > 0 ? "+" : ""}
              {rs.toFixed(2)}
            </span>
          )}
          {stock.rfactor !== undefined && (
            <span className="text-primary-foreground/80">
              {" "}
              | RF: {formatInsightNumber(stock.rfactor, 1)}
            </span>
          )}
          {stock.rfactor_trend_15m !== undefined && (
            <span
              style={{
                color:
                  stock.rfactor_trend_15m > 0
                    ? "#4ADE80"
                    : stock.rfactor_trend_15m < 0
                      ? "#F87171"
                      : "#CBD5E1",
              }}
            >
              {" "}
              | Trend: {stock.rfactor_trend_15m > 0 ? "+" : ""}
              {stock.rfactor_trend_15m.toFixed(1)}
            </span>
          )}
          {stock.opportunity_score !== undefined && (
            <span style={{ color: "#FDBA74" }}>
              {" "}
              | Opportunity: {formatInsightNumber(stock.opportunity_score, 1)}
            </span>
          )}
          {stock.setup_stage && (
            <span className="text-primary-foreground/80">
              {" "}
              | Stage: {stock.setup_stage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
