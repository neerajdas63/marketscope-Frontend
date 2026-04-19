import { useEffect, useMemo, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createEmptyMomentumPulseStrategyResponse,
  type MomentumPulseStrategyGrade,
  type MomentumPulseStrategyGradeFilter,
  type MomentumPulseStrategyQuery,
  type MomentumPulseStrategyResponse,
  type MomentumPulseStrategyRow,
  type MomentumPulseStrategySummary,
  type MomentumPulseStrategyTradeSide,
} from "@/data/momentumPulseStrategyData";
import { fetchMomentumPulseStrategyData } from "@/lib/momentumPulseStrategyApi";

const AUTO_REFRESH_MS = 300_000;

const DEFAULT_QUERY: MomentumPulseStrategyQuery = {
  limit: 40,
  direction: "ALL",
  grade: "ALL",
  includeVeryWeak: true,
};

const LIMIT_OPTIONS: MomentumPulseStrategyQuery["limit"][] = [20, 40, 60, 100];

const DEFAULT_DIRECTION_OPTIONS: MomentumPulseStrategyQuery["direction"][] = ["ALL", "LONG", "SHORT"];
const DEFAULT_GRADE_OPTIONS: MomentumPulseStrategyQuery["grade"][] = ["ALL", "A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"];

type SortKey = "default" | "score" | "volume_ratio" | "range_ratio" | "rr_t1" | "rr_t2";

const gradeStyles: Record<MomentumPulseStrategyGrade, { bg: string; border: string; color: string; label: string }> = {
  A_PLUS: { bg: "rgba(16, 185, 129, 0.18)", border: "rgba(16, 185, 129, 0.32)", color: "#6EE7B7", label: "A+" },
  A: { bg: "rgba(56, 189, 248, 0.14)", border: "rgba(56, 189, 248, 0.28)", color: "#7DD3FC", label: "A" },
  FAILED_OR_CHOP: { bg: "rgba(245, 158, 11, 0.16)", border: "rgba(245, 158, 11, 0.3)", color: "#FBBF24", label: "Failed/Chop" },
  NO_TRADE: { bg: "rgba(148, 163, 184, 0.14)", border: "rgba(148, 163, 184, 0.24)", color: "#CBD5E1", label: "No Trade" },
};

const tradeSideStyles: Record<MomentumPulseStrategyTradeSide, { bg: string; border: string; color: string; label: string }> = {
  LONG: { bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.28)", color: "#4ADE80", label: "LONG" },
  SHORT: { bg: "rgba(239, 68, 68, 0.14)", border: "rgba(239, 68, 68, 0.28)", color: "#F87171", label: "SHORT" },
  NO_TRADE: { bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.24)", color: "#CBD5E1", label: "NO TRADE" },
};

const statusStyles: Record<string, { bg: string; border: string; color: string; label: string }> = {
  ready: { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.24)", color: "#4ADE80", label: "Ready" },
  loading: { bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)", color: "#7DD3FC", label: "Loading" },
  warming_up: { bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.24)", color: "#FBBF24", label: "Warming Up" },
  error: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.24)", color: "#FCA5A5", label: "Error" },
};

function formatCurrency(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: digits,
  }).format(value);
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}

function formatPercent(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatRatio(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return `${value.toFixed(digits)}x`;
}

function formatGradeLabel(grade: MomentumPulseStrategyGradeFilter) {
  if (grade === "ALL") {
    return "All Grades";
  }

  return gradeStyles[grade].label;
}

function getStatusStyle(status: string) {
  return statusStyles[status] ?? { bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.24)", color: "#CBD5E1", label: status || "Unknown" };
}

function numericSortValue(row: MomentumPulseStrategyRow, key: Exclude<SortKey, "default">) {
  return row[key] ?? Number.NEGATIVE_INFINITY;
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "negative" | "warning" | "neutral";
}) {
  const color = tone === "positive"
    ? "#4ADE80"
    : tone === "negative"
      ? "#F87171"
      : tone === "warning"
        ? "#FBBF24"
        : "#CBD5E1";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-50">{value}</div>
      <div className="mt-1 text-xs" style={{ color }}>{detail}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function ToneBadge({
  label,
  background,
  border,
  color,
}: {
  label: string;
  background: string;
  border: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "9999px",
        border: `1px solid ${border}`,
        backgroundColor: background,
        color,
        fontSize: "10px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function GradeBadge({ grade }: { grade: MomentumPulseStrategyGrade }) {
  const style = gradeStyles[grade];
  return <ToneBadge label={style.label} background={style.bg} border={style.border} color={style.color} />;
}

function SideBadge({ side }: { side: MomentumPulseStrategyTradeSide }) {
  const style = tradeSideStyles[side];
  return <ToneBadge label={style.label} background={style.bg} border={style.border} color={style.color} />;
}

function ReasonTag({ text }: { text: string }) {
  return <ToneBadge label={text} background="rgba(15, 23, 42, 0.9)" border="rgba(71, 85, 105, 0.7)" color="#CBD5E1" />;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function NotesColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/45 p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{title}</div>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <div key={`${title}-${item}`} className="text-sm leading-6 text-slate-300">{item}</div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-500">No notes</div>
      )}
    </div>
  );
}

function TradePlanPanel({ row }: { row: MomentumPulseStrategyRow }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">Trade Plan</div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <DetailField label="Entry" value={formatCurrency(row.entry_price)} />
        <DetailField label="Stop" value={formatCurrency(row.stop_loss)} />
        <DetailField label="Target 1" value={formatCurrency(row.target_1)} />
        <DetailField label="Target 2" value={formatCurrency(row.target_2)} />
        <DetailField label="RR T1" value={formatNumber(row.rr_t1, 2)} />
        <DetailField label="RR T2" value={formatNumber(row.rr_t2, 2)} />
        <DetailField label="OR High" value={formatCurrency(row.or_high)} />
        <DetailField label="OR Low" value={formatCurrency(row.or_low)} />
      </div>
    </div>
  );
}

function ExpandedStrategyDetails({ row }: { row: MomentumPulseStrategyRow }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SideBadge side={row.trade_side} />
        <GradeBadge grade={row.grade} />
        <ToneBadge
          label={row.eligible_time_window ? "Eligible Window" : "Outside Window"}
          background={row.eligible_time_window ? "rgba(34, 197, 94, 0.12)" : "rgba(148, 163, 184, 0.12)"}
          border={row.eligible_time_window ? "rgba(34, 197, 94, 0.22)" : "rgba(148, 163, 184, 0.24)"}
          color={row.eligible_time_window ? "#4ADE80" : "#CBD5E1"}
        />
        {row.trade_date ? (
          <ToneBadge label={`Trade Date ${row.trade_date}`} background="rgba(15, 23, 42, 0.8)" border="rgba(71, 85, 105, 0.7)" color="#CBD5E1" />
        ) : null}
      </div>

      <TradePlanPanel row={row} />

      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Reasons</div>
        {row.reasons.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {row.reasons.map((reason) => (
              <ReasonTag key={`${row.symbol}-${reason}`} text={reason} />
            ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-500">No reasons provided</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <NotesColumn title="Entry Notes" items={row.entry_notes} />
        <NotesColumn title="Stop Notes" items={row.stop_notes} />
        <NotesColumn title="Exit Notes" items={row.exit_notes} />
      </div>
    </div>
  );
}

function DesktopStrategyRow({
  row,
  isOpen,
  onToggle,
}: {
  row: MomentumPulseStrategyRow;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer border-b border-slate-800/80 bg-transparent hover:bg-slate-900/70" onClick={onToggle}>
        <TableCell className="py-3">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-100">{row.symbol}</span>
            <div className="flex flex-wrap gap-1.5">
              <SideBadge side={row.trade_side} />
              <GradeBadge grade={row.grade} />
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3 text-slate-300">{row.scan_time || "--"}</TableCell>
        <TableCell className="py-3"><SideBadge side={row.trade_side} /></TableCell>
        <TableCell className="py-3"><GradeBadge grade={row.grade} /></TableCell>
        <TableCell className="py-3 text-slate-100 font-bold">{formatNumber(row.score, 1)}</TableCell>
        <TableCell className="py-3 text-slate-200">{formatCurrency(row.price_at_scan)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatCurrency(row.vwap)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatCurrency(row.or_high)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatCurrency(row.or_low)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatPercent(row.vwap_distance_pct)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatRatio(row.volume_ratio)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatRatio(row.range_ratio)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatCurrency(row.entry_price)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatCurrency(row.stop_loss)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatCurrency(row.target_1)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatCurrency(row.target_2)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatNumber(row.rr_t1, 2)}</TableCell>
        <TableCell className="py-3 text-slate-300">{formatNumber(row.rr_t2, 2)}</TableCell>
        <TableCell className="py-3">
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {row.reasons.slice(0, 2).map((reason) => (
              <ReasonTag key={`${row.symbol}-${reason}`} text={reason} />
            ))}
            {row.reasons.length === 0 ? <span className="text-xs text-slate-500">View plan</span> : null}
          </div>
        </TableCell>
      </TableRow>
      {isOpen ? (
        <tr className="border-b border-slate-800/80">
          <td colSpan={19} className="bg-slate-950/45 p-3">
            <ExpandedStrategyDetails row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/45 p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MobileStrategyCard({ row }: { row: MomentumPulseStrategyRow }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-slate-50">{row.symbol}</div>
            <div className="mt-1 text-sm text-slate-400">{row.scan_time || "--"}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <GradeBadge grade={row.grade} />
            <SideBadge side={row.trade_side} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <DetailField label="Score" value={formatNumber(row.score, 1)} />
          <DetailField label="Price" value={formatCurrency(row.price_at_scan)} />
          <DetailField label="VWAP Dist" value={formatPercent(row.vwap_distance_pct)} />
          <DetailField label="Vol / Range" value={`${formatRatio(row.volume_ratio)} / ${formatRatio(row.range_ratio)}`} />
        </div>

        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            {open ? "Hide Details" : "Show Signal, Levels, Notes"}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 space-y-4">
            <MobileSection title="Signal">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="VWAP" value={formatCurrency(row.vwap)} />
                <DetailField label="OR High" value={formatCurrency(row.or_high)} />
                <DetailField label="OR Low" value={formatCurrency(row.or_low)} />
                <DetailField label="Eligible" value={row.eligible_time_window ? "Yes" : "No"} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {row.reasons.length > 0 ? row.reasons.map((reason) => <ReasonTag key={`${row.symbol}-${reason}`} text={reason} />) : <span className="text-sm text-slate-500">No reasons provided</span>}
              </div>
            </MobileSection>

            <MobileSection title="Levels">
              <TradePlanPanel row={row} />
            </MobileSection>

            <MobileSection title="Notes">
              <div className="grid grid-cols-1 gap-4">
                <NotesColumn title="Entry Notes" items={row.entry_notes} />
                <NotesColumn title="Stop Notes" items={row.stop_notes} />
                <NotesColumn title="Exit Notes" items={row.exit_notes} />
              </div>
            </MobileSection>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function StrategySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <Skeleton className="h-3 w-24 bg-slate-800" />
            <Skeleton className="mt-3 h-8 w-20 bg-slate-800" />
            <Skeleton className="mt-2 h-3 w-32 bg-slate-800" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="mb-3 h-12 w-full bg-slate-800 last:mb-0" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: MomentumPulseStrategyQuery }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-16 text-center">
      <div className="text-lg font-bold text-slate-100">No strategy rows match the current filters</div>
      <div className="max-w-2xl text-sm text-slate-400">
        Direction: {query.direction}, Grade: {formatGradeLabel(query.grade)}, Limit: {query.limit}, Include Very Weak: {query.includeVeryWeak ? "On" : "Off"}
      </div>
    </div>
  );
}

export function MomentumPulseStrategyTab() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState<MomentumPulseStrategyQuery>(DEFAULT_QUERY);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [data, setData] = useState<MomentumPulseStrategyResponse>(createEmptyMomentumPulseStrategyResponse(DEFAULT_QUERY));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const hasRows = data.rows.length > 0;

    if (hasRows) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchMomentumPulseStrategyData(query, controller.signal)
      .then((nextData) => {
        setData(nextData);
        setError("");
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unable to load Momentum Pulse Strategy");
        if (!hasRows) {
          setData(createEmptyMomentumPulseStrategyResponse(query));
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

  const directionOptions = data.available_directions.length > 0 ? data.available_directions : DEFAULT_DIRECTION_OPTIONS;
  const gradeOptions = data.available_grades.length > 0 ? data.available_grades : DEFAULT_GRADE_OPTIONS;
  const showSkeleton = loading || data.status === "warming_up";
  const statusStyle = getStatusStyle(loading ? "loading" : data.status);
  const benchmarkTone = data.benchmark_change_pct > 0 ? "#4ADE80" : data.benchmark_change_pct < 0 ? "#F87171" : "#CBD5E1";

  const sortedRows = useMemo(() => {
    if (sortKey === "default") {
      return data.rows;
    }

    return [...data.rows].sort((left, right) => {
      const difference = numericSortValue(right, sortKey) - numericSortValue(left, sortKey);
      if (difference !== 0) {
        return difference;
      }

      return right.score - left.score;
    });
  }, [data.rows, sortKey]);

  const summary: MomentumPulseStrategySummary = data.summary;
  const overallSummary: MomentumPulseStrategySummary = data.overall_summary;

  return (
    <div style={{ background: "linear-gradient(180deg, #07111f 0%, #0b1220 100%)", minHeight: "100vh" }}>
      {refreshing ? (
        <div className="flex items-center justify-center gap-2 border-b border-cyan-950/60 bg-[#0a1a2d] py-2 text-xs text-cyan-200">
          Refreshing Momentum Pulse Strategy...
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-center gap-2 border-b border-amber-950/60 bg-[#23180a] py-2 text-xs text-amber-300">
          {error}
        </div>
      ) : null}

      <div style={{ padding: "16px" }}>
        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">Backend Strategy Output</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-50">Momentum Pulse Strategy</div>
              <div className="mt-2 max-w-3xl text-sm text-slate-400">
                Backend-driven grading, setup qualification, and trade plan from <code>/momentum-pulse/strategy</code>. Frontend sirf render karta hai, strategy recompute nahi karta.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ToneBadge label={statusStyle.label} background={statusStyle.bg} border={statusStyle.border} color={statusStyle.color} />
              <button
                type="button"
                onClick={() => setRefreshTick((value) => value + 1)}
                className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:border-cyan-300/40"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ToneBadge label={`Last Updated ${data.last_updated || "--"}`} background="rgba(15, 23, 42, 0.8)" border="rgba(71, 85, 105, 0.7)" color="#CBD5E1" />
            <ToneBadge label={`Market Data ${data.market_data_last_updated || "--"}`} background="rgba(15, 23, 42, 0.8)" border="rgba(71, 85, 105, 0.7)" color="#CBD5E1" />
            <ToneBadge label={`Benchmark ${formatPercent(data.benchmark_change_pct)}`} background="rgba(15, 23, 42, 0.8)" border="rgba(71, 85, 105, 0.7)" color={benchmarkTone} />
            <ToneBadge label={`Total ${data.total}`} background="rgba(15, 23, 42, 0.8)" border="rgba(71, 85, 105, 0.7)" color="#CBD5E1" />
            <ToneBadge label={`Candidates ${data.total_candidates}`} background="rgba(15, 23, 42, 0.8)" border="rgba(71, 85, 105, 0.7)" color="#CBD5E1" />
          </div>

          {data.message ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              {data.message}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={query.direction}
              onChange={(event) => setQuery((current) => ({ ...current, direction: event.target.value as MomentumPulseStrategyQuery["direction"] }))}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            >
              {directionOptions.map((direction) => (
                <option key={direction} value={direction}>
                  Direction: {direction}
                </option>
              ))}
            </select>

            <select
              value={query.grade}
              onChange={(event) => setQuery((current) => ({ ...current, grade: event.target.value as MomentumPulseStrategyQuery["grade"] }))}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            >
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  Grade: {formatGradeLabel(grade)}
                </option>
              ))}
            </select>

            <select
              value={query.limit}
              onChange={(event) => setQuery((current) => ({ ...current, limit: Number(event.target.value) as MomentumPulseStrategyQuery["limit"] }))}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            >
              {LIMIT_OPTIONS.map((limit) => (
                <option key={limit} value={limit}>
                  Limit: {limit}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setQuery((current) => ({ ...current, includeVeryWeak: !current.includeVeryWeak }))}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                query.includeVeryWeak
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                  : "border-slate-700 bg-slate-900/80 text-slate-200"
              }`}
            >
              Include Very Weak: {query.includeVeryWeak ? "On" : "Off"}
            </button>

            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            >
              <option value="default">Sort: Backend Rank</option>
              <option value="score">Sort: Score</option>
              <option value="volume_ratio">Sort: Volume Ratio</option>
              <option value="range_ratio">Sort: Range Ratio</option>
              <option value="rr_t1">Sort: RR T1</option>
              <option value="rr_t2">Sort: RR T2</option>
            </select>

            <div className="ml-auto text-xs text-slate-500">Auto refresh every 5m</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="A+" value={String(summary.a_plus_count)} detail="High conviction setups" tone="positive" />
          <SummaryCard label="A" value={String(summary.a_count)} detail="Actionable with confirmation" tone="positive" />
          <SummaryCard label="Failed/Chop" value={String(summary.failed_or_chop_count)} detail="Failed fast or chop risk" tone="warning" />
          <SummaryCard label="No Trade" value={String(summary.no_trade_count)} detail="Not eligible right now" tone="neutral" />
          <SummaryCard label="Long" value={String(summary.long_count)} detail="Qualified long side" tone="positive" />
          <SummaryCard label="Short" value={String(summary.short_count)} detail="Qualified short side" tone="negative" />
          <SummaryCard label="Avg Volume Ratio" value={formatRatio(summary.avg_volume_ratio)} detail="Filtered set average" tone="neutral" />
          <SummaryCard label="Avg Range Ratio" value={formatRatio(summary.avg_range_ratio)} detail="Filtered set average" tone="neutral" />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Overall Summary</div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
            <MiniStat label="Candidates" value={String(data.total_candidates)} />
            <MiniStat label="Overall A+" value={String(overallSummary.a_plus_count)} />
            <MiniStat label="Overall A" value={String(overallSummary.a_count)} />
            <MiniStat label="Overall Failed" value={String(overallSummary.failed_or_chop_count)} />
            <MiniStat label="Avg Abs Chg" value={formatPercent(overallSummary.avg_abs_change_pct)} />
            <MiniStat label="A+ Avg Score" value={formatNumber(overallSummary.a_plus_common.avg_score, 1)} />
            <MiniStat label="A Avg Score" value={formatNumber(overallSummary.a_common.avg_score, 1)} />
            <MiniStat label="Overall Vol / Range" value={`${formatRatio(overallSummary.avg_volume_ratio)} / ${formatRatio(overallSummary.avg_range_ratio)}`} />
          </div>
        </div>

        <div className="mt-4">
          {showSkeleton ? (
            <StrategySkeleton />
          ) : sortedRows.length === 0 ? (
            <EmptyState query={query} />
          ) : isMobile ? (
            <div className="grid grid-cols-1 gap-3">
              {sortedRows.map((row) => (
                <MobileStrategyCard key={`${row.symbol}-${row.scan_time}-${row.grade}`} row={row} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
              <Table className="min-w-[2100px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-800/80 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wide">Symbol</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Scan Time</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Side</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Grade</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Score</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Price</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">VWAP</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">OR High</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">OR Low</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">VWAP Dist</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Vol Ratio</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Range Ratio</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Entry</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Stop</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Target 1</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Target 2</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">RR T1</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">RR T2</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map((row) => {
                    const rowKey = `${row.symbol}-${row.scan_time}-${row.grade}`;

                    return (
                      <DesktopStrategyRow
                        key={rowKey}
                        row={row}
                        isOpen={expandedKey === rowKey}
                        onToggle={() => setExpandedKey((current) => (current === rowKey ? null : rowKey))}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
