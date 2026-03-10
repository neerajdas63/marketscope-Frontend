import { useEffect, useMemo, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createEmptyMomentumPulseResponse,
  type MomentumPulseDirection,
  type MomentumPulseDirectionFilter,
  type MomentumPulseQuery,
  type MomentumPulseResponse,
  type MomentumPulseRow,
  type MomentumPulseTier,
  type MomentumPulseTrendLabel,
} from "@/data/momentumPulseData";
import { fetchMomentumPulseData } from "@/lib/momentumPulseApi";

const AUTO_REFRESH_MS = 300_000;

type SortKey =
  | "default"
  | "momentum_pulse_score"
  | "pulse_trend_strength"
  | "relative_strength"
  | "score_change_10m"
  | "volume_pace_ratio"
  | "range_expansion_ratio";

const LIMIT_OPTIONS: MomentumPulseQuery["limit"][] = [20, 40, 60, 100];
const DIRECTION_OPTIONS: MomentumPulseDirectionFilter[] = ["ALL", "LONG", "SHORT"];

const tierStyles: Record<MomentumPulseTier, { bg: string; border: string; color: string }> = {
  strong: { bg: "rgba(16, 185, 129, 0.14)", border: "rgba(16, 185, 129, 0.34)", color: "#34D399" },
  moderate: { bg: "rgba(56, 189, 248, 0.14)", border: "rgba(56, 189, 248, 0.3)", color: "#7DD3FC" },
  weak: { bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.3)", color: "#FBBF24" },
  veryweak: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.28)", color: "#FCA5A5" },
};

const trendStyles: Record<MomentumPulseTrendLabel, { bg: string; border: string; color: string }> = {
  Rising: { bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.28)", color: "#4ADE80" },
  Flat: { bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.24)", color: "#CBD5E1" },
  Falling: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.28)", color: "#F87171" },
};

function formatNumber(value?: number, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}

function formatPercent(value?: number, digits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatCurrency(value?: number, digits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: digits })}`;
}

function formatCompactVolume(value?: number) {
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

function getDirectionTone(direction: MomentumPulseDirection) {
  if (direction === "LONG") {
    return { color: "#4ADE80", bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.28)" };
  }

  if (direction === "SHORT") {
    return { color: "#F87171", bg: "rgba(239, 68, 68, 0.14)", border: "rgba(239, 68, 68, 0.28)" };
  }

  return { color: "#CBD5E1", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.25)" };
}

function buildSparkline(points: number[]) {
  if (points.length < 2) {
    return null;
  }

  const visiblePoints = points.slice(-12);
  const width = 68;
  const height = 20;
  const min = Math.min(...visiblePoints);
  const max = Math.max(...visiblePoints);
  const range = max - min || 1;

  return visiblePoints
    .map((value, index) => {
      const x = visiblePoints.length === 1 ? width / 2 : (index / (visiblePoints.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function getSparklineColor(direction: MomentumPulseDirection) {
  if (direction === "LONG") return "#4ADE80";
  if (direction === "SHORT") return "#F87171";
  return "#94A3B8";
}

function getDeltaTone(delta: number) {
  if (delta > 0) return "#4ADE80";
  if (delta < 0) return "#F87171";
  return "#CBD5E1";
}

function compareRows(a: MomentumPulseRow, b: MomentumPulseRow, sortKey: SortKey) {
  if (sortKey === "default") {
    return (
      b.momentum_pulse_score - a.momentum_pulse_score ||
      b.pulse_trend_strength - a.pulse_trend_strength ||
      b.direction_confidence - a.direction_confidence ||
      Math.abs(b.relative_strength) - Math.abs(a.relative_strength)
    );
  }

  if (sortKey === "relative_strength") {
    return Math.abs(b.relative_strength) - Math.abs(a.relative_strength);
  }

  return b[sortKey] - a[sortKey];
}

function SummaryChip({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "#4ADE80" : tone === "negative" ? "#F87171" : "#CBD5E1";
  const background = tone === "positive" ? "rgba(34, 197, 94, 0.12)" : tone === "negative" ? "rgba(239, 68, 68, 0.12)" : "rgba(148, 163, 184, 0.12)";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "9999px",
        border: "1px solid rgba(71, 85, 105, 0.35)",
        background,
      }}
    >
      <span style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <span style={{ color, fontSize: "13px", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "positive" | "negative" | "warning" }) {
  const styles =
    tone === "positive"
      ? { bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.28)", color: "#4ADE80" }
      : tone === "negative"
        ? { bg: "rgba(239, 68, 68, 0.14)", border: "rgba(239, 68, 68, 0.28)", color: "#F87171" }
        : tone === "warning"
          ? { bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.28)", color: "#FBBF24" }
          : { bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.24)", color: "#CBD5E1" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "9999px",
        border: `1px solid ${styles.border}`,
        backgroundColor: styles.bg,
        color: styles.color,
        fontSize: "10px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function PulseSparkline({ row }: { row: MomentumPulseRow }) {
  const polyline = buildSparkline(row.score_history);
  const color = getSparklineColor(row.direction);
  const deltaTone = getDeltaTone(row.score_change_10m);

  return (
    <div className="flex items-center gap-2">
      <svg width="68" height="22" viewBox="0 0 68 22" aria-hidden="true">
        {polyline ? (
          <polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <line x1="0" y1="11" x2="68" y2="11" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 3" />
        )}
      </svg>
      <span style={{ color: deltaTone, fontSize: "11px", fontWeight: 700 }}>
        {formatPercent(row.score_change_10m, 1)}
      </span>
    </div>
  );
}

function TierBadge({ tier }: { tier: MomentumPulseTier }) {
  const style = tierStyles[tier];

  return (
    <span
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        borderRadius: "9999px",
        padding: "2px 8px",
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {tier}
    </span>
  );
}

function TrendBadge({ label, strength }: { label: MomentumPulseTrendLabel; strength: number }) {
  const style = trendStyles[label];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        borderRadius: "9999px",
        padding: "2px 8px",
        fontSize: "10px",
        fontWeight: 700,
      }}
    >
      {label}
      <span style={{ color: "#E2E8F0" }}>{formatNumber(strength, 1)}</span>
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "#E2E8F0", fontSize: "12px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function MomentumPulseTopCard({ row }: { row: MomentumPulseRow }) {
  const directionTone = getDirectionTone(row.direction);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(14, 23, 38, 0.98), rgba(10, 15, 28, 0.96))",
        border: `1px solid ${directionTone.border}`,
        borderRadius: "14px",
        padding: "14px",
        minWidth: "220px",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div style={{ color: "#94A3B8", fontSize: "10px", textTransform: "uppercase" }}>Rank #{row.rank}</div>
          <div style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 800 }}>{row.symbol}</div>
        </div>
        <Badge tone={row.direction === "LONG" ? "positive" : row.direction === "SHORT" ? "negative" : "neutral"}>
          {row.direction}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-3 gap-3">
        <div>
          <div style={{ color: "#CBD5E1", fontSize: "12px" }}>{formatCurrency(row.ltp)}</div>
          <div style={{ color: row.change_pct >= 0 ? "#4ADE80" : "#F87171", fontSize: "12px", fontWeight: 700 }}>
            {formatPercent(row.change_pct)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase" }}>Pulse Score</div>
          <div style={{ color: "#F8FAFC", fontSize: "20px", fontWeight: 800 }}>{formatNumber(row.momentum_pulse_score, 1)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <TierBadge tier={row.tier} />
        <TrendBadge label={row.pulse_trend_label} strength={row.pulse_trend_strength} />
        {row.is_extended ? <Badge tone="warning">Extended</Badge> : null}
      </div>

      <div className="flex items-center justify-between mt-3 gap-3">
        <PulseSparkline row={row} />
        <div style={{ color: directionTone.color, fontSize: "12px", fontWeight: 700 }}>
          Conf {formatNumber(row.direction_confidence, 0)}
        </div>
      </div>

      {row.warning_flags.length > 0 ? (
        <div className="flex gap-1.5 flex-wrap mt-3">
          {row.warning_flags.slice(0, 3).map((flag) => (
            <Badge key={flag} tone="warning">{flag}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExpandedPulseDetails({ row }: { row: MomentumPulseRow }) {
  return (
    <div
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.66)",
        border: "1px solid rgba(51, 65, 85, 0.6)",
        borderRadius: "12px",
        padding: "12px",
        marginTop: "10px",
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DetailStat label="Volume Pace Score" value={formatNumber(row.volume_pace_score, 1)} />
        <DetailStat label="Range Expansion Score" value={formatNumber(row.range_expansion_score, 1)} />
        <DetailStat label="Long RS Score" value={formatNumber(row.long_relative_strength_score, 1)} />
        <DetailStat label="Short RS Score" value={formatNumber(row.short_relative_strength_score, 1)} />
        <DetailStat label="Long Consistency" value={formatNumber(row.long_directional_consistency_score, 1)} />
        <DetailStat label="Short Consistency" value={formatNumber(row.short_directional_consistency_score, 1)} />
        <DetailStat label="Long VWAP Align" value={formatNumber(row.long_vwap_alignment_score, 1)} />
        <DetailStat label="Short VWAP Align" value={formatNumber(row.short_vwap_alignment_score, 1)} />
        <DetailStat label="Today Cum Vol" value={formatCompactVolume(row.today_cum_volume)} />
        <DetailStat label="20D Same-Time Vol" value={formatCompactVolume(row.avg_20d_cum_volume_same_time)} />
        <DetailStat label="Intraday Range" value={formatNumber(row.intraday_range_abs, 2)} />
        <DetailStat label="Intraday Range %" value={formatPercent(row.intraday_range_pct)} />
        <DetailStat label="20D Range Abs" value={formatNumber(row.avg_20d_range_same_time_abs, 2)} />
        <DetailStat label="20D Range %" value={formatPercent(row.avg_20d_range_pct_same_time)} />
        <DetailStat label="Score Change 15m" value={formatPercent(row.score_change_15m, 1)} />
        <DetailStat label="Score Slope" value={formatNumber(row.score_slope, 2)} />
        <DetailStat label="Score Acceleration" value={formatNumber(row.score_acceleration, 2)} />
        <DetailStat label="Improving Streak" value={formatNumber(row.improving_streak, 0)} />
        <DetailStat label="Weakening Streak" value={formatNumber(row.weakening_streak, 0)} />
        <DetailStat label="VWAP" value={formatCurrency(row.vwap)} />
        <DetailStat label="Volume Surge" value={row.volume_surge ? "Yes" : "No"} />
        <DetailStat label="Range Expansion" value={row.range_expansion ? "Yes" : "No"} />
        <DetailStat label="Index Outperformer" value={row.index_outperformer ? "Yes" : "No"} />
        <DetailStat label="Trend Consistent" value={row.trend_consistent ? "Yes" : "No"} />
        <DetailStat label="Improving Now" value={row.improving_now ? "Yes" : "No"} />
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        {row.is_extended ? <Badge tone="warning">Extended</Badge> : null}
        {row.warning_flags.map((flag) => (
          <Badge key={flag} tone="warning">{flag}</Badge>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 mt-3 flex-wrap">
        <div>
          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase" }}>Score History</div>
          <PulseSparkline row={row} />
        </div>
        <DetailStat label="Time Bucket" value={row.score_time_bucket} />
      </div>
    </div>
  );
}

function DesktopRow({ row, isOpen, onToggle }: { row: MomentumPulseRow; isOpen: boolean; onToggle: () => void }) {
  const directionTone = getDirectionTone(row.direction);

  return (
    <>
      <TableRow className="border-b border-slate-800/80 bg-transparent hover:bg-slate-900/70 cursor-pointer" onClick={onToggle}>
        <TableCell className="py-3 text-slate-300">#{row.rank}</TableCell>
        <TableCell className="py-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-100">{row.symbol}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <TierBadge tier={row.tier} />
              {row.is_extended ? <Badge tone="warning">Extended</Badge> : null}
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3 text-slate-200">{formatCurrency(row.ltp)}</TableCell>
        <TableCell className="py-3">
          <span style={{ color: row.change_pct >= 0 ? "#4ADE80" : "#F87171", fontWeight: 700 }}>{formatPercent(row.change_pct)}</span>
        </TableCell>
        <TableCell className="py-3">
          <div className="inline-flex items-center gap-2 rounded-full px-2 py-1" style={{ backgroundColor: directionTone.bg, border: `1px solid ${directionTone.border}` }}>
            <span style={{ color: directionTone.color, fontWeight: 700, fontSize: "11px" }}>{row.direction}</span>
            <span className="text-slate-300 text-[11px] font-semibold">{formatNumber(row.direction_confidence, 0)}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 text-slate-100 font-bold">{formatNumber(row.momentum_pulse_score, 1)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatNumber(row.volume_pace_ratio, 2)}x</TableCell>
        <TableCell className="py-3 text-slate-300">{formatNumber(row.range_expansion_ratio, 2)}x</TableCell>
        <TableCell className="py-3">
          <span style={{ color: row.relative_strength >= 0 ? "#4ADE80" : "#F87171", fontWeight: 700 }}>
            {formatPercent(row.relative_strength)}
          </span>
        </TableCell>
        <TableCell className="py-3"><TrendBadge label={row.pulse_trend_label} strength={row.pulse_trend_strength} /></TableCell>
        <TableCell className="py-3 text-slate-300">{formatPercent(row.score_change_5m, 1)}</TableCell>
        <TableCell className="py-3"><PulseSparkline row={row} /></TableCell>
        <TableCell className="py-3 text-slate-300">{formatPercent(row.distance_from_vwap_pct)}</TableCell>
        <TableCell className="py-3 text-slate-400">{row.score_time_bucket}</TableCell>
        <TableCell className="py-3">
          <div className="flex gap-1 flex-wrap">
            {row.warning_flags.slice(0, 2).map((flag) => (
              <Badge key={flag} tone="warning">{flag}</Badge>
            ))}
          </div>
        </TableCell>
      </TableRow>
      {isOpen ? (
        <tr className="border-b border-slate-800/80">
          <td colSpan={14} className="p-3 bg-slate-950/60">
            <ExpandedPulseDetails row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MobileCard({ row }: { row: MomentumPulseRow }) {
  const [open, setOpen] = useState(false);
  const directionTone = getDirectionTone(row.direction);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        style={{
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(9, 14, 28, 0.94))",
          border: `1px solid ${directionTone.border}`,
          borderRadius: "14px",
          padding: "14px",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase" }}>Rank #{row.rank}</div>
            <div style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 800 }}>{row.symbol}</div>
            <div style={{ color: "#CBD5E1", fontSize: "12px", marginTop: "2px" }}>{formatCurrency(row.ltp)}</div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <Badge tone={row.direction === "LONG" ? "positive" : row.direction === "SHORT" ? "negative" : "neutral"}>{row.direction}</Badge>
            <TierBadge tier={row.tier} />
            {row.is_extended ? <Badge tone="warning">Extended</Badge> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <DetailStat label="Change" value={formatPercent(row.change_pct)} />
          <DetailStat label="Confidence" value={formatNumber(row.direction_confidence, 0)} />
          <DetailStat label="Pulse Score" value={formatNumber(row.momentum_pulse_score, 1)} />
          <DetailStat label="Trend" value={`${row.pulse_trend_label} ${formatNumber(row.pulse_trend_strength, 1)}`} />
          <DetailStat label="Volume Pace" value={`${formatNumber(row.volume_pace_ratio, 2)}x`} />
          <DetailStat label="Range Exp" value={`${formatNumber(row.range_expansion_ratio, 2)}x`} />
          <DetailStat label="RS" value={formatPercent(row.relative_strength)} />
          <DetailStat label="Score 5m" value={formatPercent(row.score_change_5m, 1)} />
          <DetailStat label="Score 10m" value={formatPercent(row.score_change_10m, 1)} />
          <DetailStat label="Dist VWAP" value={formatPercent(row.distance_from_vwap_pct)} />
          <DetailStat label="Time Bucket" value={row.score_time_bucket} />
        </div>

        <div className="flex items-center justify-between mt-3 gap-3">
          <PulseSparkline row={row} />
          <div style={{ color: "#94A3B8", fontSize: "11px" }}>VWAP {formatCurrency(row.vwap)}</div>
        </div>

        {row.warning_flags.length > 0 ? (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {row.warning_flags.map((flag) => (
              <Badge key={flag} tone="warning">{flag}</Badge>
            ))}
          </div>
        ) : null}

        <CollapsibleTrigger asChild>
          <button
            type="button"
            style={{
              width: "100%",
              marginTop: "12px",
              borderRadius: "10px",
              border: "1px solid rgba(51, 65, 85, 0.8)",
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              color: "#CBD5E1",
              fontSize: "12px",
              fontWeight: 700,
              padding: "10px 12px",
            }}
          >
            {open ? "Hide Details" : "Show Details"}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ExpandedPulseDetails row={row} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function MomentumPulseTab() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState<MomentumPulseQuery>({ limit: 40, direction: "ALL", includeVeryWeak: false });
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [data, setData] = useState<MomentumPulseResponse>(createEmptyMomentumPulseResponse(query));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const [error, setError] = useState<string>("");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const hasVisibleRows = data.stocks.length > 0;

    if (hasVisibleRows) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchMomentumPulseData(query, controller.signal)
      .then((nextData) => {
        setData(nextData);
        setWarmingUp(nextData.stocks.length === 0);
        setError("");
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unable to load Momentum Pulse");
        setWarmingUp(false);
        if (!hasVisibleRows) {
          setData(createEmptyMomentumPulseResponse(query));
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });

    return () => controller.abort();
  }, [query, refreshTick]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  const sortedRows = useMemo(() => {
    return [...data.stocks].sort((a, b) => compareRows(a, b, sortKey));
  }, [data.stocks, sortKey]);

  const topRows = sortedRows.slice(0, 4);
  const longCount = useMemo(() => sortedRows.filter((row) => row.direction === "LONG").length, [sortedRows]);
  const shortCount = useMemo(() => sortedRows.filter((row) => row.direction === "SHORT").length, [sortedRows]);
  const strongCount = useMemo(() => sortedRows.filter((row) => row.tier === "strong").length, [sortedRows]);
  const risingCount = useMemo(() => sortedRows.filter((row) => row.pulse_trend_label === "Rising").length, [sortedRows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-300 text-lg">
        Loading Momentum Pulse...
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #07111f 0%, #0b1220 100%)", minHeight: "100vh" }}>
      {refreshing ? (
        <div className="flex items-center justify-center gap-2 py-2 text-cyan-200 text-xs bg-[#0a1a2d] border-b border-cyan-950/60">
          Refreshing Momentum Pulse...
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-center gap-2 py-2 text-amber-300 text-xs bg-[#23180a] border-b border-amber-950/60">
          {error}
        </div>
      ) : null}

      <div style={{ padding: "16px" }}>
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid rgba(51, 65, 85, 0.7)",
            background: "rgba(9, 15, 28, 0.84)",
            padding: "14px",
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div style={{ color: "#7DD3FC", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Live Intraday Discovery
              </div>
              <div style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 800 }}>Momentum Pulse</div>
              <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}>
                Surface strong score + rising trend, early improvers, and strong shorts without hiding extended names.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setRefreshTick((value) => value + 1)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(34, 211, 238, 0.35)",
                  backgroundColor: "rgba(8, 47, 73, 0.6)",
                  color: "#CFFAFE",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                Refresh
              </button>
              <span style={{ color: "#64748B", fontSize: "11px" }}>
                Auto refresh every 5m
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mt-4">
            <SummaryChip label="Total" value={String(data.total || sortedRows.length)} />
            <SummaryChip
              label="Benchmark"
              value={formatPercent(data.benchmark_change_pct)}
              tone={data.benchmark_change_pct > 0 ? "positive" : data.benchmark_change_pct < 0 ? "negative" : "neutral"}
            />
            <SummaryChip label="Long" value={String(longCount)} tone="positive" />
            <SummaryChip label="Short" value={String(shortCount)} tone="negative" />
            <SummaryChip label="Strong" value={String(strongCount)} />
            <SummaryChip label="Rising" value={String(risingCount)} tone="positive" />
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-4">
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-800 bg-slate-950/60">
              {DIRECTION_OPTIONS.map((direction) => (
                <button
                  key={direction}
                  type="button"
                  onClick={() => setQuery((current) => ({ ...current, direction }))}
                  style={{
                    padding: "7px 11px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: query.direction === direction ? "#0F766E" : "transparent",
                    color: query.direction === direction ? "#F0FDFA" : "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {direction === "ALL" ? "All" : direction}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setQuery((current) => ({ ...current, includeVeryWeak: !current.includeVeryWeak }))}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(71, 85, 105, 0.85)",
                backgroundColor: query.includeVeryWeak ? "rgba(59, 130, 246, 0.18)" : "rgba(15, 23, 42, 0.8)",
                color: query.includeVeryWeak ? "#DBEAFE" : "#CBD5E1",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Include Very Weak: {query.includeVeryWeak ? "On" : "Off"}
            </button>

            <select
              value={query.limit}
              onChange={(event) => setQuery((current) => ({ ...current, limit: Number(event.target.value) as MomentumPulseQuery["limit"] }))}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                color: "#E2E8F0",
                border: "1px solid rgba(71, 85, 105, 0.85)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              {LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>{limit} names</option>
              ))}
            </select>

            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                color: "#E2E8F0",
                border: "1px solid rgba(71, 85, 105, 0.85)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              <option value="default">Sort: Default</option>
              <option value="momentum_pulse_score">Sort: Pulse Score</option>
              <option value="pulse_trend_strength">Sort: Trend Strength</option>
              <option value="relative_strength">Sort: Relative Strength</option>
              <option value="score_change_10m">Sort: Score Change 10m</option>
              <option value="volume_pace_ratio">Sort: Volume Pace</option>
              <option value="range_expansion_ratio">Sort: Range Expansion</option>
            </select>

            <span style={{ color: "#64748B", fontSize: "11px", marginLeft: "auto" }}>
              Updated: {data.last_updated || "Waiting for first pulse..."}
            </span>
          </div>
        </div>

        {topRows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
            {topRows.map((row) => (
              <MomentumPulseTopCard key={row.symbol} row={row} />
            ))}
          </div>
        ) : null}

        {warmingUp ? (
          <div className="flex flex-col items-center justify-center gap-2 mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-16 text-center">
            <div style={{ color: "#7DD3FC", fontSize: "18px", fontWeight: 700 }}>Momentum Pulse is warming up</div>
            <div style={{ color: "#94A3B8", fontSize: "13px", maxWidth: "560px" }}>
              The backend is reachable, but there are no live discovery names yet for the current filters. Try a manual refresh or widen the direction and very-weak settings.
            </div>
          </div>
        ) : null}

        {!warmingUp && sortedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-16 text-center">
            <div style={{ color: "#E2E8F0", fontSize: "18px", fontWeight: 700 }}>No discovery names match the current filters</div>
            <div style={{ color: "#94A3B8", fontSize: "13px" }}>Try switching direction, increasing the limit, or including very weak names.</div>
          </div>
        ) : null}

        {!warmingUp && sortedRows.length > 0 ? (
          isMobile ? (
            <div className="grid grid-cols-1 gap-3 mt-4">
              {sortedRows.map((row) => (
                <MobileCard key={row.symbol} row={row} />
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: "16px",
                borderRadius: "16px",
                border: "1px solid rgba(51, 65, 85, 0.7)",
                background: "rgba(9, 15, 28, 0.84)",
                overflow: "hidden",
              }}
            >
              <Table className="min-w-[1320px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-800/80 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wide">Rank</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Symbol</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">LTP</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Change</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Direction</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Score</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Vol Pace</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Range Exp</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Rel Strength</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Trend</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">5m / 10m</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">VWAP Dist</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Bucket</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map((row) => (
                    <DesktopRow
                      key={row.symbol}
                      row={row}
                      isOpen={expandedSymbol === row.symbol}
                      onToggle={() => setExpandedSymbol((current) => (current === row.symbol ? null : row.symbol))}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}