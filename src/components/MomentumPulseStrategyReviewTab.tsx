import {
  Fragment,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type {
  MomentumPulseStrategyGrade,
  MomentumPulseStrategyTradeSide,
} from "@/data/momentumPulseStrategyData";
import {
  createEmptyMomentumPulseStrategyReviewResponse,
  type MomentumPulseStrategyReviewOutcomeFilter,
  type MomentumPulseStrategyReviewQuery,
  type MomentumPulseStrategyReviewReasonStat,
  type MomentumPulseStrategyReviewResponse,
  type MomentumPulseStrategyReviewRow,
} from "@/data/momentumPulseStrategyReviewData";
import { fetchMomentumPulseStrategyReviewData } from "@/lib/momentumPulseStrategyReviewApi";

const DEFAULT_DAYS = 1;
const DAYS_OPTIONS = [1, 5, 15];

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
  final: {
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.24)",
    color: "#4ADE80",
    label: "Final",
  },
  provisional: {
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.24)",
    color: "#93C5FD",
    label: "Provisional",
  },
  empty: {
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.24)",
    color: "#CBD5E1",
    label: "Empty",
  },
  loading: {
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.24)",
    color: "#7DD3FC",
    label: "Loading",
  },
};

const outcomeStyles: Record<
  string,
  { bg: string; border: string; color: string; label: string; rowClass: string }
> = {
  WIN: {
    bg: "rgba(34, 197, 94, 0.16)",
    border: "rgba(34, 197, 94, 0.3)",
    color: "#86EFAC",
    label: "WIN",
    rowClass: "bg-emerald-500/5",
  },
  LOSS: {
    bg: "rgba(239, 68, 68, 0.16)",
    border: "rgba(239, 68, 68, 0.3)",
    color: "#FCA5A5",
    label: "LOSS",
    rowClass: "bg-rose-500/5",
  },
  OPEN: {
    bg: "rgba(59, 130, 246, 0.16)",
    border: "rgba(59, 130, 246, 0.3)",
    color: "#93C5FD",
    label: "OPEN",
    rowClass: "bg-sky-500/5",
  },
  FLAT: {
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.28)",
    color: "#FCD34D",
    label: "FLAT",
    rowClass: "bg-amber-500/5",
  },
  NO_DATA: {
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.24)",
    color: "#CBD5E1",
    label: "NO DATA",
    rowClass: "bg-slate-500/5",
  },
};

function getTodayIstDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getLimitForDays(days: number) {
  return days > 1 ? 300 : 200;
}

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

function formatLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDatesCoverage(dates: string[]) {
  if (dates.length === 0) {
    return "--";
  }

  if (dates.length === 1) {
    return dates[0];
  }

  return `${dates[0]} to ${dates[dates.length - 1]} (${dates.length} days)`;
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

function getOutcomeStyle(outcome: string) {
  return (
    outcomeStyles[outcome] ?? {
      bg: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.24)",
      color: "#CBD5E1",
      label: outcome || "Unknown",
      rowClass: "bg-slate-500/5",
    }
  );
}

function getReasonPreview(row: MomentumPulseStrategyReviewRow) {
  if (row.outcome_reason) {
    return row.outcome_reason;
  }

  if (row.win_loss_reason_codes[0]) {
    return formatLabel(row.win_loss_reason_codes[0]);
  }

  if (row.reasons[0]) {
    return row.reasons[0];
  }

  return "--";
}

function ToneBadge({
  label,
  tone,
}: {
  label: string;
  tone: { bg: string; border: string; color: string };
}) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.border,
        color: tone.color,
      }}
    >
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardContent className="p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
        {helper ? (
          <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ChipList({
  values,
  emptyLabel = "None",
}: {
  values: string[];
  emptyLabel?: string;
}) {
  if (values.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
        >
          {formatLabel(value)}
        </span>
      ))}
    </div>
  );
}

function RankedReasonList({
  title,
  items,
}: {
  title: string;
  items: MomentumPulseStrategyReviewReasonStat[];
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No reasons available yet.</div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
            >
              <div className="text-sm text-foreground">
                <span className="mr-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {index + 1}.
                </span>
                {item.label}
              </div>
              <div className="text-xs font-semibold text-muted-foreground">
                {item.count === null ? "--" : item.count}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ReviewDetails({ row }: { row: MomentumPulseStrategyReviewRow }) {
  return (
    <div className="grid gap-5 rounded-2xl border border-border/60 bg-background/70 p-4 md:grid-cols-2">
      <DetailBlock label="Outcome Reason">
        <div className="text-sm text-foreground">
          {row.outcome_reason || "No backend reason supplied."}
        </div>
      </DetailBlock>
      <DetailBlock label="Reason Preview">
        <div className="text-sm text-foreground">{getReasonPreview(row)}</div>
      </DetailBlock>
      <DetailBlock label="Win/Loss Reason Codes">
        <ChipList
          values={row.win_loss_reason_codes}
          emptyLabel="No win/loss codes"
        />
      </DetailBlock>
      <DetailBlock label="Major Risks">
        <ChipList values={row.major_risks} emptyLabel="No major risks" />
      </DetailBlock>
      <DetailBlock label="Reversal Flags">
        <ChipList values={row.reversal_flags} emptyLabel="No reversal flags" />
      </DetailBlock>
      <DetailBlock label="Original Signal Reasons">
        <ChipList values={row.reasons} emptyLabel="No signal reasons" />
      </DetailBlock>
    </div>
  );
}

function MobileReviewCard({
  row,
  index,
  expandedRowKey,
  setExpandedRowKey,
}: {
  row: MomentumPulseStrategyReviewRow;
  index: number;
  expandedRowKey: string | null;
  setExpandedRowKey: Dispatch<SetStateAction<string | null>>;
}) {
  const outcomeStyle = getOutcomeStyle(row.outcome);
  const rowKey = `${row.symbol}-${row.trade_date}-${index}`;
  const isExpanded = expandedRowKey === rowKey;

  return (
    <Card className={`border-border/70 bg-card/70 ${outcomeStyle.rowClass}`}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-foreground">{row.symbol}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {row.trade_date || "--"} | Signal {row.signal_bar_time || "--"}
            </div>
          </div>
          <ToneBadge label={outcomeStyle.label} tone={outcomeStyle} />
        </div>

        <div className="flex flex-wrap gap-2">
          <ToneBadge label={tradeSideStyles[row.trade_side].label} tone={tradeSideStyles[row.trade_side]} />
          <ToneBadge label={gradeStyles[row.grade].label} tone={gradeStyles[row.grade]} />
          {row.entry_state ? (
            <span className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {formatLabel(row.entry_state)}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Entry / Stop
            </div>
            <div className="mt-2 text-foreground">
              {formatCurrency(row.entry_price)} / {formatCurrency(row.stop_loss)}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Targets
            </div>
            <div className="mt-2 text-foreground">
              {formatCurrency(row.target_1)} / {formatCurrency(row.target_2)}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Exit
            </div>
            <div className="mt-2 text-foreground">
              {formatCurrency(row.exit_price)} {row.exit_time ? `@ ${row.exit_time}` : ""}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              MFE / MAE
            </div>
            <div className="mt-2 text-foreground">
              {formatPercent(row.max_favorable_pct)} / {formatPercent(row.max_adverse_pct)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-foreground">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Outcome Event
          </div>
          <div className="mt-2">{row.outcome_event || "--"}</div>
          <div className="mt-2 text-muted-foreground">{getReasonPreview(row)}</div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setExpandedRowKey((current) => (current === rowKey ? null : rowKey));
          }}
        >
          {isExpanded ? "Hide Details" : "View Details"}
        </Button>

        {isExpanded ? <ReviewDetails row={row} /> : null}
      </CardContent>
    </Card>
  );
}

function ReviewTable({
  rows,
  expandedRowKey,
  setExpandedRowKey,
}: {
  rows: MomentumPulseStrategyReviewRow[];
  expandedRowKey: string | null;
  setExpandedRowKey: Dispatch<SetStateAction<string | null>>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Signal Time</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Entry</TableHead>
            <TableHead>Stop</TableHead>
            <TableHead>T1</TableHead>
            <TableHead>T2</TableHead>
            <TableHead>Exit</TableHead>
            <TableHead>MFE %</TableHead>
            <TableHead>MAE %</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const outcomeStyle = getOutcomeStyle(row.outcome);
            const rowKey = `${row.symbol}-${row.trade_date}-${index}`;
            const isExpanded = expandedRowKey === rowKey;

            return (
              <Fragment key={rowKey}>
                <TableRow className={outcomeStyle.rowClass}>
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {row.symbol}
                  </TableCell>
                  <TableCell>{row.trade_date || "--"}</TableCell>
                  <TableCell>{row.signal_bar_time || "--"}</TableCell>
                  <TableCell>
                    <ToneBadge
                      label={tradeSideStyles[row.trade_side].label}
                      tone={tradeSideStyles[row.trade_side]}
                    />
                  </TableCell>
                  <TableCell>
                    <ToneBadge
                      label={gradeStyles[row.grade].label}
                      tone={gradeStyles[row.grade]}
                    />
                  </TableCell>
                  <TableCell>
                    <ToneBadge label={outcomeStyle.label} tone={outcomeStyle} />
                  </TableCell>
                  <TableCell>{row.outcome_event || "--"}</TableCell>
                  <TableCell>{formatCurrency(row.entry_price)}</TableCell>
                  <TableCell>{formatCurrency(row.stop_loss)}</TableCell>
                  <TableCell>{formatCurrency(row.target_1)}</TableCell>
                  <TableCell>{formatCurrency(row.target_2)}</TableCell>
                  <TableCell>
                    <div>{formatCurrency(row.exit_price)}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.exit_time || "--"}
                    </div>
                  </TableCell>
                  <TableCell>{formatPercent(row.max_favorable_pct)}</TableCell>
                  <TableCell>{formatPercent(row.max_adverse_pct)}</TableCell>
                  <TableCell className="max-w-[220px]">
                    <div className="line-clamp-2 text-sm text-foreground">
                      {getReasonPreview(row)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExpandedRowKey((current) =>
                          current === rowKey ? null : rowKey,
                        );
                      }}
                    >
                      {isExpanded ? "Hide" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded ? (
                  <TableRow>
                    <TableCell colSpan={17} className="bg-background/80">
                      <ReviewDetails row={row} />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index} className="border-border/70 bg-card/70">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/70 bg-card/70">
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function MomentumPulseStrategyReviewTab() {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(() => getTodayIstDate());
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [outcomeFilter, setOutcomeFilter] =
    useState<MomentumPulseStrategyReviewOutcomeFilter>("ALL");
  const [refreshTick, setRefreshTick] = useState(0);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [data, setData] = useState<MomentumPulseStrategyReviewResponse>(() =>
    createEmptyMomentumPulseStrategyReviewResponse({
      date: getTodayIstDate(),
      days: DEFAULT_DAYS,
      limit: getLimitForDays(DEFAULT_DAYS),
    }),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const query: MomentumPulseStrategyReviewQuery = {
      date: selectedDate || undefined,
      days,
      limit: getLimitForDays(days),
    };
    const controller = new AbortController();

    setIsLoading(true);
    setError("");
    setExpandedRowKey(null);

    void fetchMomentumPulseStrategyReviewData(query, controller.signal)
      .then((response) => {
        setData(response);
      })
      .catch((fetchError: unknown) => {
        if (
          fetchError instanceof Error &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        const nextData = createEmptyMomentumPulseStrategyReviewResponse(query);
        nextData.message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load strategy review.";
        setData(nextData);
        setError(nextData.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedDate, days, refreshTick]);

  const statusStyle = getStatusStyle(data.status);
  const availableOutcomes = [
    "ALL",
    ...data.available_outcomes.filter(
      (outcome, index, items) =>
        outcome && items.indexOf(outcome) === index && outcome !== "ALL",
    ),
  ];
  const visibleRows =
    outcomeFilter === "ALL"
      ? data.rows
      : data.rows.filter((row) => row.outcome === outcomeFilter);
  const reviewRangeLabel = formatDatesCoverage(data.dates);

  return (
    <div className="space-y-6 px-4 py-5 md:px-6">
      <Card className="border-border/70 bg-card/70">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl">Momentum Pulse Strategy Review</CardTitle>
                <ToneBadge label={statusStyle.label} tone={statusStyle} />
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>Mode: Review</span>
                <span>Dates: {reviewRangeLabel}</span>
                <span>Total Rows: {data.total}</span>
                <span>Fetch Limit: {getLimitForDays(days)}</span>
              </div>
              {data.message ? (
                <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                  {data.message}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-muted-foreground">Review date</span>
                <Input
                  aria-label="Review date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-muted-foreground">Days</span>
                <select
                  aria-label="Days"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={String(days)}
                  onChange={(event) => {
                    setDays(Number(event.target.value) || DEFAULT_DAYS);
                  }}
                >
                  {DAYS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} {option === 1 ? "Day" : "Days"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-muted-foreground">Outcome filter</span>
                <select
                  aria-label="Outcome filter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={outcomeFilter}
                  onChange={(event) => {
                    setOutcomeFilter(event.target.value);
                    setExpandedRowKey(null);
                  }}
                >
                  {availableOutcomes.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All Outcomes" : formatLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2 text-sm">
                <span className="font-medium text-muted-foreground">Refresh</span>
                <Button
                  className="w-full"
                  onClick={() => setRefreshTick((current) => current + 1)}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? <ReviewSkeleton /> : null}

      {!isLoading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <SummaryCard
              label="Total Signals"
              value={formatNumber(data.summary.total_signals, 0)}
              helper={`${data.total} rows loaded`}
            />
            <SummaryCard
              label="Wins"
              value={formatNumber(data.summary.win_count, 0)}
            />
            <SummaryCard
              label="Losses"
              value={formatNumber(data.summary.loss_count, 0)}
            />
            <SummaryCard
              label="Win Rate"
              value={formatPercent(data.summary.win_rate_pct)}
            />
            <SummaryCard
              label="Open"
              value={formatNumber(data.summary.open_count, 0)}
            />
            <SummaryCard
              label="No Data"
              value={formatNumber(data.summary.no_data_count, 0)}
            />
            <SummaryCard
              label="Avg Execution Rank"
              value={formatNumber(data.summary.avg_execution_rank, 1)}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <RankedReasonList
              title="Top Win Reasons"
              items={data.summary.top_win_reasons}
            />
            <RankedReasonList
              title="Top Loss Reasons"
              items={data.summary.top_loss_reasons}
            />
          </div>

          {data.status === "empty" || data.rows.length === 0 ? (
            <Card className="border-border/70 bg-card/70">
              <CardContent className="space-y-3 p-6">
                <div className="text-lg font-semibold text-foreground">
                  No review signals available
                </div>
                <div className="text-sm text-muted-foreground">
                  Signals are recorded from live Strategy usage after deployment.
                </div>
                <div className="text-sm text-muted-foreground">
                  Current request: {selectedDate || "latest"} | {days}{" "}
                  {days === 1 ? "day" : "days"} | limit {getLimitForDays(days)}
                </div>
              </CardContent>
            </Card>
          ) : visibleRows.length === 0 ? (
            <Card className="border-border/70 bg-card/70">
              <CardContent className="space-y-2 p-6">
                <div className="text-lg font-semibold text-foreground">
                  No rows match the selected outcome
                </div>
                <div className="text-sm text-muted-foreground">
                  Try a different outcome filter or refresh the current review.
                </div>
              </CardContent>
            </Card>
          ) : isMobile ? (
            <div className="space-y-4">
              {visibleRows.map((row, index) => (
                <MobileReviewCard
                  key={`${row.symbol}-${row.trade_date}-${index}`}
                  row={row}
                  index={index}
                  expandedRowKey={expandedRowKey}
                  setExpandedRowKey={setExpandedRowKey}
                />
              ))}
            </div>
          ) : (
            <ReviewTable
              rows={visibleRows}
              expandedRowKey={expandedRowKey}
              setExpandedRowKey={setExpandedRowKey}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
