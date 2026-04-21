import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createEmptyMomentumPulseStrategyResponse,
  type MomentumPulseStrategyBestStocks,
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
};

const LIMIT_OPTIONS: MomentumPulseStrategyQuery["limit"][] = [20, 40, 60, 100];
const DEFAULT_DIRECTION_OPTIONS: MomentumPulseStrategyQuery["direction"][] = [
  "ALL",
  "LONG",
  "SHORT",
];
const DEFAULT_GRADE_OPTIONS: MomentumPulseStrategyQuery["grade"][] = [
  "ALL",
  "A_PLUS",
  "A",
  "FAILED_OR_CHOP",
  "NO_TRADE",
];

const gradeStyles: Record<
  MomentumPulseStrategyGrade,
  { bg: string; border: string; color: string; label: string }
> = {
  A_PLUS: {
    bg: "rgba(16, 185, 129, 0.18)",
    border: "rgba(16, 185, 129, 0.32)",
    color: "#6EE7B7",
    label: "A+",
  },
  A: {
    bg: "rgba(56, 189, 248, 0.14)",
    border: "rgba(56, 189, 248, 0.28)",
    color: "#7DD3FC",
    label: "A",
  },
  FAILED_OR_CHOP: {
    bg: "rgba(245, 158, 11, 0.16)",
    border: "rgba(245, 158, 11, 0.3)",
    color: "#FBBF24",
    label: "Failed/Chop",
  },
  NO_TRADE: {
    bg: "rgba(148, 163, 184, 0.14)",
    border: "rgba(148, 163, 184, 0.24)",
    color: "#CBD5E1",
    label: "No Trade",
  },
};

const tradeSideStyles: Record<
  MomentumPulseStrategyTradeSide,
  { bg: string; border: string; color: string; label: string }
> = {
  LONG: {
    bg: "rgba(34, 197, 94, 0.14)",
    border: "rgba(34, 197, 94, 0.28)",
    color: "#4ADE80",
    label: "LONG",
  },
  SHORT: {
    bg: "rgba(239, 68, 68, 0.14)",
    border: "rgba(239, 68, 68, 0.28)",
    color: "#F87171",
    label: "SHORT",
  },
  NO_TRADE: {
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.24)",
    color: "#CBD5E1",
    label: "NO TRADE",
  },
};

const statusStyles: Record<
  string,
  { bg: string; border: string; color: string; label: string }
> = {
  ready: {
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.24)",
    color: "#4ADE80",
    label: "Ready",
  },
  loading: {
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.24)",
    color: "#7DD3FC",
    label: "Loading",
  },
  warming_up: {
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.24)",
    color: "#FBBF24",
    label: "Warming Up",
  },
  disabled: {
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.24)",
    color: "#CBD5E1",
    label: "Disabled",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.24)",
    color: "#FCA5A5",
    label: "Error",
  },
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

function formatLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatGradeLabel(grade: MomentumPulseStrategyGradeFilter) {
  if (grade === "ALL") {
    return "All Grades";
  }

  return gradeStyles[grade].label;
}

function getStatusStyle(status: string) {
  return (
    statusStyles[status] ?? {
      bg: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.24)",
      color: "#CBD5E1",
      label: status || "Unknown",
    }
  );
}

function getEntryStateTone(entryState: string) {
  const normalized = entryState.trim().toUpperCase();

  if (normalized === "ENTER_NOW") {
    return {
      bg: "rgba(34, 197, 94, 0.16)",
      border: "rgba(34, 197, 94, 0.28)",
      color: "#4ADE80",
      label: "Enter Now",
    };
  }

  if (normalized === "ENTER_ON_RETEST") {
    return {
      bg: "rgba(56, 189, 248, 0.14)",
      border: "rgba(56, 189, 248, 0.28)",
      color: "#7DD3FC",
      label: "Enter On Retest",
    };
  }

  if (normalized === "WAIT_CONFIRMATION") {
    return {
      bg: "rgba(245, 158, 11, 0.16)",
      border: "rgba(245, 158, 11, 0.28)",
      color: "#FBBF24",
      label: "Wait Confirmation",
    };
  }

  if (normalized === "AVOID_CHASE") {
    return {
      bg: "rgba(239, 68, 68, 0.14)",
      border: "rgba(239, 68, 68, 0.28)",
      color: "#FCA5A5",
      label: "Avoid Chase",
    };
  }

  if (normalized === "CANCEL_SETUP") {
    return {
      bg: "rgba(148, 163, 184, 0.14)",
      border: "rgba(148, 163, 184, 0.24)",
      color: "#CBD5E1",
      label: "Cancel Setup",
    };
  }

  return {
    bg: "rgba(15, 23, 42, 0.9)",
    border: "rgba(71, 85, 105, 0.7)",
    color: "#CBD5E1",
    label: formatLabel(normalized || "UNKNOWN"),
  };
}

function getChaseRiskTone(chaseRisk: string) {
  const normalized = chaseRisk.trim().toUpperCase();

  if (normalized === "LOW") {
    return {
      bg: "rgba(34, 197, 94, 0.16)",
      border: "rgba(34, 197, 94, 0.28)",
      color: "#4ADE80",
      label: "Low",
    };
  }

  if (normalized === "MEDIUM") {
    return {
      bg: "rgba(245, 158, 11, 0.16)",
      border: "rgba(245, 158, 11, 0.28)",
      color: "#FBBF24",
      label: "Medium",
    };
  }

  if (normalized === "HIGH") {
    return {
      bg: "rgba(239, 68, 68, 0.14)",
      border: "rgba(239, 68, 68, 0.28)",
      color: "#FCA5A5",
      label: "High",
    };
  }

  return {
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.24)",
    color: "#CBD5E1",
    label: formatLabel(normalized || "UNKNOWN"),
  };
}

function getRetestTone(retestOk: boolean | null) {
  if (retestOk === true) {
    return {
      bg: "rgba(34, 197, 94, 0.16)",
      border: "rgba(34, 197, 94, 0.28)",
      color: "#4ADE80",
      label: "Retest OK",
    };
  }

  if (retestOk === false) {
    return {
      bg: "rgba(148, 163, 184, 0.14)",
      border: "rgba(148, 163, 184, 0.24)",
      color: "#CBD5E1",
      label: "Retest Weak",
    };
  }

  return {
    bg: "rgba(15, 23, 42, 0.9)",
    border: "rgba(71, 85, 105, 0.7)",
    color: "#CBD5E1",
    label: "--",
  };
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
  return (
    <ToneBadge
      label={style.label}
      background={style.bg}
      border={style.border}
      color={style.color}
    />
  );
}

function SideBadge({ side }: { side: MomentumPulseStrategyTradeSide }) {
  const style = tradeSideStyles[side];
  return (
    <ToneBadge
      label={style.label}
      background={style.bg}
      border={style.border}
      color={style.color}
    />
  );
}

function EntryStateBadge({ entryState }: { entryState: string }) {
  if (!entryState) {
    return <span className="text-xs text-slate-500">--</span>;
  }

  const tone = getEntryStateTone(entryState);
  return (
    <ToneBadge
      label={tone.label}
      background={tone.bg}
      border={tone.border}
      color={tone.color}
    />
  );
}

function ChaseRiskBadge({ chaseRisk }: { chaseRisk: string }) {
  if (!chaseRisk) {
    return <span className="text-xs text-slate-500">--</span>;
  }

  const tone = getChaseRiskTone(chaseRisk);
  return (
    <ToneBadge
      label={tone.label}
      background={tone.bg}
      border={tone.border}
      color={tone.color}
    />
  );
}

function RetestBadge({ retestOk }: { retestOk: boolean | null }) {
  const tone = getRetestTone(retestOk);
  return (
    <ToneBadge
      label={tone.label}
      background={tone.bg}
      border={tone.border}
      color={tone.color}
    />
  );
}

function NeutralTag({ text }: { text: string }) {
  return (
    <ToneBadge
      label={text}
      background="rgba(15, 23, 42, 0.9)"
      border="rgba(71, 85, 105, 0.7)"
      color="#CBD5E1"
    />
  );
}

function WarningTag({ text }: { text: string }) {
  return (
    <ToneBadge
      label={text}
      background="rgba(120, 53, 15, 0.22)"
      border="rgba(245, 158, 11, 0.28)"
      color="#FBBF24"
    />
  );
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
  const color =
    tone === "positive"
      ? "#4ADE80"
      : tone === "negative"
        ? "#F87171"
        : tone === "warning"
          ? "#FBBF24"
          : "#CBD5E1";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-50">{value}</div>
      <div className="mt-1 text-xs" style={{ color }}>
        {detail}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function NotesColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/45 p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {title}
      </div>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={`${title}-${item}`}
              className="text-sm leading-6 text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-500">No notes</div>
      )}
    </div>
  );
}

function TagGroup({
  title,
  items,
  tone,
  emptyText,
}: {
  title: string;
  items: string[];
  tone: "warning" | "neutral";
  emptyText: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {title}
      </div>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) =>
            tone === "warning" ? (
              <WarningTag key={`${title}-${item}`} text={item} />
            ) : (
              <NeutralTag key={`${title}-${item}`} text={item} />
            ),
          )}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-500">{emptyText}</div>
      )}
    </div>
  );
}

function TradePlanPanel({ row }: { row: MomentumPulseStrategyRow }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">
        Trade Plan
      </div>
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
        <EntryStateBadge entryState={row.entry_state} />
        <ChaseRiskBadge chaseRisk={row.chase_risk} />
        <RetestBadge retestOk={row.retest_ok} />
        {row.trade_date ? (
          <ToneBadge
            label={`Trade Date ${row.trade_date}`}
            background="rgba(15, 23, 42, 0.8)"
            border="rgba(71, 85, 105, 0.7)"
            color="#CBD5E1"
          />
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">
          Signal Snapshot
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          <DetailField
            label="Execution Rank"
            value={formatNumber(row.execution_rank, 1)}
          />
          <DetailField label="Score" value={formatNumber(row.score, 1)} />
          <DetailField
            label="Pulse Score"
            value={formatNumber(row.momentum_pulse_score, 1)}
          />
          <DetailField
            label="Grade Stability"
            value={formatNumber(row.grade_stability_score, 2)}
          />
          <DetailField
            label="OR Stretch %"
            value={formatPercent(row.or_stretch_pct)}
          />
          <DetailField
            label="Price"
            value={formatCurrency(row.price_at_scan)}
          />
          <DetailField label="VWAP" value={formatCurrency(row.vwap)} />
          <DetailField
            label="VWAP Dist %"
            value={formatPercent(row.vwap_distance_pct)}
          />
          <DetailField
            label="Volume Ratio"
            value={formatRatio(row.volume_ratio)}
          />
          <DetailField
            label="Range Ratio"
            value={formatRatio(row.range_ratio)}
          />
        </div>
      </div>

      <TradePlanPanel row={row} />

      <TagGroup
        title="Reasons"
        items={row.reasons}
        tone="neutral"
        emptyText="No reasons provided"
      />
      <TagGroup
        title="Major Risks"
        items={row.major_risks}
        tone="warning"
        emptyText="No major risks flagged"
      />
      <TagGroup
        title="Grade History"
        items={row.grade_history}
        tone="neutral"
        emptyText="No grade history provided"
      />
      <TagGroup
        title="Warning Flags"
        items={row.warning_flags}
        tone="warning"
        emptyText="No warning flags"
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <NotesColumn title="Entry Notes" items={row.entry_notes} />
        <NotesColumn title="Stop Notes" items={row.stop_notes} />
        <NotesColumn title="Exit Notes" items={row.exit_notes} />
      </div>
    </div>
  );
}

function StrategyPreview({ row }: { row: MomentumPulseStrategyRow }) {
  const preview =
    row.reasons[0] ?? row.major_risks[0] ?? "View strategy details";
  return <div className="mt-1 text-xs text-slate-500">{preview}</div>;
}

function DesktopStrategyRow({
  row,
  index,
  isOpen,
  onToggle,
}: {
  row: MomentumPulseStrategyRow;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow
        className="cursor-pointer border-b border-slate-800/80 bg-transparent hover:bg-slate-900/70"
        onClick={onToggle}
      >
        <TableCell className="py-3 text-slate-400">{index + 1}</TableCell>
        <TableCell className="py-3">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-100">{row.symbol}</span>
            <StrategyPreview row={row} />
          </div>
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {row.scan_time || "--"}
        </TableCell>
        <TableCell className="py-3">
          <SideBadge side={row.trade_side} />
        </TableCell>
        <TableCell className="py-3">
          <GradeBadge grade={row.grade} />
        </TableCell>
        <TableCell className="py-3">
          <EntryStateBadge entryState={row.entry_state} />
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatNumber(row.execution_rank, 1)}
        </TableCell>
        <TableCell className="py-3 text-slate-100 font-bold">
          {formatNumber(row.score, 1)}
        </TableCell>
        <TableCell className="py-3 text-slate-200">
          {formatCurrency(row.price_at_scan)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatPercent(row.vwap_distance_pct)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatRatio(row.volume_ratio)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatRatio(row.range_ratio)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatCurrency(row.entry_price)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatCurrency(row.stop_loss)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatCurrency(row.target_1)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatCurrency(row.target_2)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatNumber(row.rr_t1, 2)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatNumber(row.rr_t2, 2)}
        </TableCell>
        <TableCell className="py-3 text-slate-300">
          {formatNumber(row.grade_stability_score, 2)}
        </TableCell>
        <TableCell className="py-3">
          <ChaseRiskBadge chaseRisk={row.chase_risk} />
        </TableCell>
        <TableCell className="py-3">
          <RetestBadge retestOk={row.retest_ok} />
        </TableCell>
      </TableRow>
      {isOpen ? (
        <tr className="border-b border-slate-800/80">
          <td colSpan={21} className="bg-slate-950/45 p-3">
            <ExpandedStrategyDetails row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MobileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/45 p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MobileStrategyCard({
  row,
  index,
}: {
  row: MomentumPulseStrategyRow;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Rank {index + 1}
            </div>
            <div className="mt-1 text-lg font-extrabold text-slate-50">
              {row.symbol}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {row.scan_time || "--"}
            </div>
            <StrategyPreview row={row} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <GradeBadge grade={row.grade} />
            <SideBadge side={row.trade_side} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <EntryStateBadge entryState={row.entry_state} />
          <ChaseRiskBadge chaseRisk={row.chase_risk} />
          <RetestBadge retestOk={row.retest_ok} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <DetailField
            label="Execution Rank"
            value={formatNumber(row.execution_rank, 1)}
          />
          <DetailField label="Score" value={formatNumber(row.score, 1)} />
          <DetailField
            label="Price"
            value={formatCurrency(row.price_at_scan)}
          />
          <DetailField
            label="VWAP Dist %"
            value={formatPercent(row.vwap_distance_pct)}
          />
          <DetailField
            label="Volume Ratio"
            value={formatRatio(row.volume_ratio)}
          />
          <DetailField
            label="Range Ratio"
            value={formatRatio(row.range_ratio)}
          />
        </div>

        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            {open ? "Hide Details" : "Show Details"}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 space-y-4">
            <MobileSection title="Signal">
              <div className="grid grid-cols-2 gap-3">
                <DetailField
                  label="Entry State"
                  value={row.entry_state ? formatLabel(row.entry_state) : "--"}
                />
                <DetailField
                  label="Grade Stability"
                  value={formatNumber(row.grade_stability_score, 2)}
                />
                <DetailField
                  label="Pulse Score"
                  value={formatNumber(row.momentum_pulse_score, 1)}
                />
                <DetailField
                  label="OR Stretch %"
                  value={formatPercent(row.or_stretch_pct)}
                />
              </div>
              <div className="mt-4 space-y-4">
                <TagGroup
                  title="Reasons"
                  items={row.reasons}
                  tone="neutral"
                  emptyText="No reasons provided"
                />
                <TagGroup
                  title="Major Risks"
                  items={row.major_risks}
                  tone="warning"
                  emptyText="No major risks flagged"
                />
                <TagGroup
                  title="Grade History"
                  items={row.grade_history}
                  tone="neutral"
                  emptyText="No grade history provided"
                />
                <TagGroup
                  title="Warning Flags"
                  items={row.warning_flags}
                  tone="warning"
                  emptyText="No warning flags"
                />
              </div>
            </MobileSection>

            <MobileSection title="Levels">
              <TradePlanPanel row={row} />
            </MobileSection>

            <MobileSection title="Notes">
              <div className="grid grid-cols-1 gap-3">
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
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={`summary-${index}`}
            className="h-[108px] rounded-2xl bg-slate-800/80"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={`bucket-${index}`}
            className="h-[220px] rounded-2xl bg-slate-800/80"
          />
        ))}
      </div>
      <Skeleton className="h-[560px] rounded-2xl bg-slate-800/80" />
    </div>
  );
}

function EmptyState({
  query,
  message,
}: {
  query: MomentumPulseStrategyQuery;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-16 text-center">
      <div className="text-lg font-bold text-slate-100">
        No live strategy rows match the current filters
      </div>
      <div className="max-w-2xl text-sm text-slate-400">{message}</div>
      <div className="max-w-2xl text-sm text-slate-500">
        Direction: {query.direction}, Grade: {formatGradeLabel(query.grade)},
        Limit: {query.limit}
      </div>
    </div>
  );
}

function BestStockCard({ row }: { row: MomentumPulseStrategyRow }) {
  const preview =
    row.reasons[0] ?? row.major_risks[0] ?? "No reason preview available";

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-slate-100">
            {row.symbol}
          </div>
          <div className="mt-1 text-sm text-slate-400">{preview}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <GradeBadge grade={row.grade} />
          <SideBadge side={row.trade_side} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <EntryStateBadge entryState={row.entry_state} />
        <ToneBadge
          label={`Exec ${formatNumber(row.execution_rank, 1)}`}
          background="rgba(15, 23, 42, 0.9)"
          border="rgba(71, 85, 105, 0.7)"
          color="#CBD5E1"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <DetailField label="Price" value={formatCurrency(row.price_at_scan)} />
        <DetailField label="Entry" value={formatCurrency(row.entry_price)} />
        <DetailField label="Stop" value={formatCurrency(row.stop_loss)} />
        <DetailField label="Target 1" value={formatCurrency(row.target_1)} />
        <DetailField label="Target 2" value={formatCurrency(row.target_2)} />
        <DetailField
          label="VWAP Dist %"
          value={formatPercent(row.vwap_distance_pct)}
        />
      </div>

      {row.major_risks.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {row.major_risks.map((risk) => (
            <WarningTag key={`${row.symbol}-${risk}`} text={risk} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BestStockSection({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: MomentumPulseStrategyRow[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      {rows.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {rows.map((row, index) => (
            <BestStockCard key={`${title}-${row.symbol}-${index}`} row={row} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function PassiveState({ data }: { data: MomentumPulseStrategyResponse }) {
  const mode = data.mode || "unknown";
  const status = data.status || "unknown";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="text-lg font-bold text-slate-100">
        Live strategy view is unavailable right now
      </div>
      <div className="mt-2 text-sm text-slate-400">
        This tab only renders lightweight live payloads from{" "}
        <code>/momentum-pulse/strategy</code>. The backend returned mode{" "}
        <span className="font-semibold text-slate-200">{mode}</span> with status{" "}
        <span className="font-semibold text-slate-200">{status}</span>.
      </div>
    </div>
  );
}

export function MomentumPulseStrategyTab() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState<MomentumPulseStrategyQuery>(DEFAULT_QUERY);
  const [data, setData] = useState<MomentumPulseStrategyResponse>(
    createEmptyMomentumPulseStrategyResponse(DEFAULT_QUERY),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedOnceRef = useRef(false);

  useEffect(() => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (hasFetchedOnceRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    fetchMomentumPulseStrategyData(query, controller.signal)
      .then((nextData) => {
        if (abortControllerRef.current !== controller) {
          return;
        }

        hasFetchedOnceRef.current = true;
        setData(nextData);
        setError("");
      })
      .catch((fetchError) => {
        if (
          controller.signal.aborted ||
          abortControllerRef.current !== controller
        ) {
          return;
        }

        hasFetchedOnceRef.current = true;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load Momentum Pulse Strategy",
        );
        setData(createEmptyMomentumPulseStrategyResponse(query));
      })
      .finally(() => {
        if (abortControllerRef.current !== controller) {
          return;
        }

        abortControllerRef.current = null;
        setLoading(false);
        setRefreshing(false);
      });

    return () => controller.abort();
  }, [query, refreshTick]);

  useEffect(() => {
    if (data.mode !== "live" || data.status === "disabled") {
      return;
    }

    const interval = setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [data.mode, data.status]);

  const directionOptions =
    data.available_directions.length > 0
      ? data.available_directions
      : DEFAULT_DIRECTION_OPTIONS;
  const gradeOptions =
    data.available_grades.length > 0
      ? data.available_grades
      : DEFAULT_GRADE_OPTIONS;
  const statusStyle = getStatusStyle(loading ? "loading" : data.status);
  const benchmarkTone =
    data.benchmark_change_pct > 0
      ? "#4ADE80"
      : data.benchmark_change_pct < 0
        ? "#F87171"
        : "#CBD5E1";
  const showSkeleton = loading || data.status === "warming_up";
  const isPassiveState = data.status === "disabled" || data.mode !== "live";
  const summary: MomentumPulseStrategySummary = data.summary;
  const overallSummary: MomentumPulseStrategySummary = data.overall_summary;
  const bestStocks: MomentumPulseStrategyBestStocks = data.best_stocks;

  const safeOverallBest = bestStocks.overall_best.filter(
    (row) =>
      ["A_PLUS", "A"].includes(row.grade) &&
      ["LONG", "SHORT"].includes(row.trade_side) &&
      !["AVOID_CHASE", "CANCEL_SETUP"].includes(row.entry_state),
  );

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #07111f 0%, #0b1220 100%)",
        minHeight: "100vh",
      }}
    >
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">
                Backend Strategy Output
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-50">
                Momentum Pulse Strategy
              </div>
              <div className="mt-2 max-w-3xl text-sm text-slate-400">
                Live strategy feed from <code>/momentum-pulse/strategy</code>.
                Frontend sirf backend values render karta hai, strategy logic
                recompute nahi karta.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ToneBadge
                label={statusStyle.label}
                background={statusStyle.bg}
                border={statusStyle.border}
                color={statusStyle.color}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ToneBadge
              label={`Last Updated ${data.last_updated || "--"}`}
              background="rgba(15, 23, 42, 0.8)"
              border="rgba(71, 85, 105, 0.7)"
              color="#CBD5E1"
            />
            <ToneBadge
              label={`Market Data ${data.market_data_last_updated || "--"}`}
              background="rgba(15, 23, 42, 0.8)"
              border="rgba(71, 85, 105, 0.7)"
              color="#CBD5E1"
            />
            <ToneBadge
              label={`Benchmark ${formatPercent(data.benchmark_change_pct)}`}
              background="rgba(15, 23, 42, 0.8)"
              border="rgba(71, 85, 105, 0.7)"
              color={benchmarkTone}
            />
            <ToneBadge
              label={`Total Shown ${data.total}`}
              background="rgba(15, 23, 42, 0.8)"
              border="rgba(71, 85, 105, 0.7)"
              color="#CBD5E1"
            />
            <ToneBadge
              label={`Total Candidates ${data.total_candidates}`}
              background="rgba(15, 23, 42, 0.8)"
              border="rgba(71, 85, 105, 0.7)"
              color="#CBD5E1"
            />
          </div>

          {data.message ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              {data.message}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={query.direction}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  direction: event.target
                    .value as MomentumPulseStrategyQuery["direction"],
                }))
              }
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
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  grade: event.target
                    .value as MomentumPulseStrategyQuery["grade"],
                }))
              }
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
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  limit: Number(
                    event.target.value,
                  ) as MomentumPulseStrategyQuery["limit"],
                }))
              }
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
              onClick={() => setRefreshTick((value) => value + 1)}
              className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/40"
            >
              Refresh
            </button>

            <div className="ml-auto text-xs text-slate-500">
              Auto-refresh every 5m
            </div>
          </div>
        </div>

        {isPassiveState ? (
          <div className="mt-4">
            <PassiveState data={data} />
          </div>
        ) : showSkeleton ? (
          <div className="mt-4">
            <StrategySkeleton />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="A+"
                value={String(summary.a_plus_count)}
                detail="Strongest setups"
                tone="positive"
              />
              <SummaryCard
                label="A"
                value={String(summary.a_count)}
                detail="Positive but selective"
                tone="positive"
              />
              <SummaryCard
                label="Failed/Chop"
                value={String(summary.failed_or_chop_count)}
                detail="Chop or failed structure"
                tone="warning"
              />
              <SummaryCard
                label="No Trade"
                value={String(summary.no_trade_count)}
                detail="Muted or invalid setups"
                tone="neutral"
              />
              <SummaryCard
                label="Long"
                value={String(summary.long_count)}
                detail="Qualified long signals"
                tone="positive"
              />
              <SummaryCard
                label="Short"
                value={String(summary.short_count)}
                detail="Qualified short signals"
                tone="negative"
              />
              <SummaryCard
                label="Enter Now"
                value={String(summary.enter_now_count)}
                detail="Immediate execution bias"
                tone="positive"
              />
              <SummaryCard
                label="Enter On Retest"
                value={String(summary.enter_on_retest_count)}
                detail="Retest entry preferred"
                tone="neutral"
              />
              <SummaryCard
                label="Avoid"
                value={String(summary.avoid_count)}
                detail="Avoid chase or cancel"
                tone="negative"
              />
              <SummaryCard
                label="Avg Volume Ratio"
                value={formatRatio(summary.avg_volume_ratio)}
                detail="Filtered set average"
                tone="neutral"
              />
              <SummaryCard
                label="Avg Range Ratio"
                value={formatRatio(summary.avg_range_ratio)}
                detail="Filtered set average"
                tone="neutral"
              />
              <SummaryCard
                label="Avg Execution Rank"
                value={formatNumber(summary.avg_execution_rank, 1)}
                detail="Lower rank is stronger"
                tone="neutral"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <BestStockSection
                title="Overall Best"
                rows={safeOverallBest}
                emptyText="No overall best picks returned."
              />
              <BestStockSection
                title="Best Longs"
                rows={bestStocks.best_longs}
                emptyText="No long leaders returned."
              />
              <BestStockSection
                title="Best Shorts"
                rows={bestStocks.best_shorts}
                emptyText="No short leaders returned."
              />
              <BestStockSection
                title="Avoid List"
                rows={bestStocks.avoid_list}
                emptyText="No avoid list returned."
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Overall Summary
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
                <MiniStat
                  label="Candidates"
                  value={String(data.total_candidates)}
                />
                <MiniStat
                  label="Overall A+"
                  value={String(overallSummary.a_plus_count)}
                />
                <MiniStat
                  label="Overall A"
                  value={String(overallSummary.a_count)}
                />
                <MiniStat
                  label="Overall Long"
                  value={String(overallSummary.long_count)}
                />
                <MiniStat
                  label="Overall Short"
                  value={String(overallSummary.short_count)}
                />
                <MiniStat
                  label="Overall Enter Now"
                  value={String(overallSummary.enter_now_count)}
                />
                <MiniStat
                  label="Overall Retest"
                  value={String(overallSummary.enter_on_retest_count)}
                />
                <MiniStat
                  label="Avg Execution Rank"
                  value={formatNumber(overallSummary.avg_execution_rank, 1)}
                />
              </div>
            </div>

            <div className="mt-4">
              {data.rows.length === 0 ? (
                <EmptyState
                  query={query}
                  message="Backend returned no live strategy rows for the current filters."
                />
              ) : isMobile ? (
                <div className="grid grid-cols-1 gap-3">
                  {data.rows.map((row, index) => (
                    <MobileStrategyCard
                      key={`${row.symbol}-${row.scan_time}-${index}`}
                      row={row}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
                  <Table className="min-w-[2360px]">
                    <TableHeader>
                      <TableRow className="border-b border-slate-800/80 hover:bg-transparent">
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          #
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Symbol
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Time
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Side
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Grade
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Entry State
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Execution Rank
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Score
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Price
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          VWAP Dist %
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Volume Ratio
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Range Ratio
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Entry
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Stop
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Target 1
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Target 2
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          RR T1
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          RR T2
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Grade Stability
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Chase Risk
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide">
                          Retest OK
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.rows.map((row, index) => {
                        const rowKey = `${row.symbol}-${row.scan_time}-${index}`;

                        return (
                          <DesktopStrategyRow
                            key={rowKey}
                            row={row}
                            index={index}
                            isOpen={expandedKey === rowKey}
                            onToggle={() =>
                              setExpandedKey((current) =>
                                current === rowKey ? null : rowKey,
                              )
                            }
                          />
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
