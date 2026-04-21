import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SetupStage } from "@/data/mockData";
import { cn } from "@/lib/utils";

const stageStyles: Record<
  SetupStage,
  { background: string; border: string; color: string }
> = {
  WARMING: {
    background: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.32)",
    color: "#FBBF24",
  },
  PRE_SIGNAL: {
    background: "rgba(59, 130, 246, 0.14)",
    border: "rgba(59, 130, 246, 0.34)",
    color: "#60A5FA",
  },
  BREAKING: {
    background: "rgba(249, 115, 22, 0.14)",
    border: "rgba(249, 115, 22, 0.36)",
    color: "#FB923C",
  },
  CONFIRMED: {
    background: "rgba(34, 197, 94, 0.14)",
    border: "rgba(34, 197, 94, 0.36)",
    color: "#4ADE80",
  },
  EXTENDED: {
    background: "rgba(239, 68, 68, 0.14)",
    border: "rgba(239, 68, 68, 0.36)",
    color: "#F87171",
  },
  NEUTRAL: {
    background: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.25)",
    color: "#CBD5E1",
  },
};

function getTrendTone(trend?: number) {
  if (trend === undefined || trend === null || Number.isNaN(trend)) {
    return { color: "#94A3B8", arrow: "•" };
  }

  if (trend > 0) {
    return { color: "#4ADE80", arrow: "▲" };
  }

  if (trend < 0) {
    return { color: "#F87171", arrow: "▼" };
  }

  return { color: "#CBD5E1", arrow: "•" };
}

function buildSparkline(points?: number[]) {
  if (!points || points.length < 3) {
    return null;
  }

  const visiblePoints = points.slice(-5);
  const width = 42;
  const height = 14;
  const min = Math.min(...visiblePoints);
  const max = Math.max(...visiblePoints);
  const range = max - min || 1;

  const coords = visiblePoints.map((value, index) => {
    const x =
      visiblePoints.length === 1
        ? width / 2
        : (index / (visiblePoints.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y, value };
  });

  return {
    width,
    height,
    polyline: coords.map(({ x, y }) => `${x},${y}`).join(" "),
    coords,
  };
}

export function formatInsightNumber(value?: number, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

interface InsightTooltipProps {
  children: ReactNode;
  label: string;
  description: string;
}

export function InsightTooltip({
  children,
  label,
  description,
}: InsightTooltipProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center">{children}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs leading-relaxed">
          <div className="font-semibold text-foreground">{label}</div>
          <div className="text-muted-foreground">{description}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface StageBadgeProps {
  stage?: SetupStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  if (!stage) {
    return null;
  }

  const style = stageStyles[stage];

  return (
    <InsightTooltip
      label="Stage"
      description={
        stage === "WARMING"
          ? "Warming = pre-score is building but trigger quality is still weak"
          : stage === "PRE_SIGNAL"
            ? "Pre-signal = setup energy is improving but breakout is not confirmed yet"
            : stage === "BREAKING"
              ? "Breaking = fresh breakout or breakdown behavior is actively triggering"
              : stage === "CONFIRMED"
                ? "Confirmed = breakout has follow-through and hold behavior"
                : stage === "EXTENDED"
                  ? "Extended = chase-risk setup that is likely late or stretched"
                  : "Neutral = no clear early-entry edge"
      }
    >
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap",
          className,
        )}
        style={{
          backgroundColor: style.background,
          borderColor: style.border,
          color: style.color,
        }}
      >
        {stage}
      </span>
    </InsightTooltip>
  );
}

interface TrendIndicatorProps {
  trend?: number;
  acceleration?: number;
  points?: number[];
  compact?: boolean;
  className?: string;
}

export function TrendIndicator({
  trend,
  acceleration,
  points,
  compact = false,
  className,
}: TrendIndicatorProps) {
  const sparkline = buildSparkline(points);
  const tone = getTrendTone(trend);
  const text =
    trend === undefined || trend === null || Number.isNaN(trend)
      ? "--"
      : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5",
        compact ? "text-[10px]" : "text-xs",
        className,
      )}
    >
      <span
        className="font-semibold tabular-nums"
        style={{ color: tone.color }}
      >
        {tone.arrow} {text}
      </span>
      {sparkline && (
        <svg
          width={sparkline.width}
          height={sparkline.height + 2}
          viewBox={`0 0 ${sparkline.width} ${sparkline.height + 2}`}
          className="shrink-0 overflow-visible"
          aria-hidden="true"
        >
          <polyline
            points={sparkline.polyline}
            fill="none"
            stroke={tone.color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={
              acceleration === undefined
                ? 0.9
                : acceleration > 0
                  ? 1
                  : acceleration < 0
                    ? 0.75
                    : 0.85
            }
          />
          {sparkline.coords.map(({ x, y }, index) => (
            <circle
              key={`${x}-${y}-${index}`}
              cx={x}
              cy={y}
              r={index === sparkline.coords.length - 1 ? 2 : 1.5}
              fill={tone.color}
              opacity={index === sparkline.coords.length - 1 ? 1 : 0.8}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
