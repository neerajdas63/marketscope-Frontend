import { useEffect, useMemo, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  createEmptySequenceSignalsResponse,
  type SequenceSignalQuery,
  type SequenceSignalQuerySide,
  type SequenceSignalQueryTimeframe,
  type SequenceSignalQueryType,
  type SequenceSignalRow,
  type SequenceSignalsResponse,
} from "@/data/sequenceSignalsData";
import { fetchSequenceSignalsData } from "@/lib/sequenceSignalsApi";

const LIMIT_OPTIONS = [25, 50, 100, 200] as const;
const TIMEFRAME_OPTIONS: SequenceSignalQueryTimeframe[] = [
  "ALL",
  "3m",
  "5m",
  "15m",
];
const SIDE_OPTIONS: SequenceSignalQuerySide[] = ["ALL", "BUY", "SELL"];
const TYPE_OPTIONS: SequenceSignalQueryType[] = ["ALL", "C2", "C3", "MTF"];

function formatCurrency(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function SummaryPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
}) {
  const styles =
    tone === "positive"
      ? {
          bg: "rgba(34, 197, 94, 0.12)",
          border: "rgba(34, 197, 94, 0.3)",
          color: "#4ADE80",
        }
      : tone === "negative"
        ? {
            bg: "rgba(239, 68, 68, 0.12)",
            border: "rgba(239, 68, 68, 0.3)",
            color: "#F87171",
          }
        : tone === "accent"
          ? {
              bg: "rgba(56, 189, 248, 0.12)",
              border: "rgba(56, 189, 248, 0.3)",
              color: "#7DD3FC",
            }
          : {
              bg: "rgba(148, 163, 184, 0.12)",
              border: "rgba(148, 163, 184, 0.24)",
              color: "#CBD5E1",
            };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "9999px",
        border: `1px solid ${styles.border}`,
        backgroundColor: styles.bg,
      }}
    >
      <span
        style={{
          color: "#94A3B8",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      <span style={{ color: styles.color, fontSize: "13px", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

function SideBadge({ side }: { side: SequenceSignalRow["side"] }) {
  const style =
    side === "BUY"
      ? {
          bg: "rgba(34, 197, 94, 0.14)",
          border: "rgba(34, 197, 94, 0.28)",
          color: "#4ADE80",
        }
      : {
          bg: "rgba(239, 68, 68, 0.14)",
          border: "rgba(239, 68, 68, 0.28)",
          color: "#F87171",
        };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "9999px",
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
        color: style.color,
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "0.05em",
      }}
    >
      {side}
    </span>
  );
}

function SignalTypeBadge({
  signalType,
}: {
  signalType: SequenceSignalRow["signal_type"];
}) {
  const styles =
    signalType === "C2"
      ? {
          bg: "rgba(59, 130, 246, 0.14)",
          border: "rgba(59, 130, 246, 0.28)",
          color: "#93C5FD",
        }
      : signalType === "C3"
        ? {
            bg: "rgba(245, 158, 11, 0.14)",
            border: "rgba(245, 158, 11, 0.28)",
            color: "#FBBF24",
          }
        : {
            bg: "rgba(168, 85, 247, 0.14)",
            border: "rgba(168, 85, 247, 0.28)",
            color: "#D8B4FE",
          };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "9999px",
        border: `1px solid ${styles.border}`,
        backgroundColor: styles.bg,
        color: styles.color,
        fontSize: "10px",
        fontWeight: 800,
      }}
    >
      {signalType}
    </span>
  );
}

function TimeframeBadge({
  timeframe,
}: {
  timeframe: SequenceSignalRow["timeframe"];
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "9999px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        color: "#CBD5E1",
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {timeframe}
    </span>
  );
}

function ObScoreBadge({ text, label }: { text: string; label: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 800 }}>
        {text || "--"}
      </span>
      <span
        style={{
          color: "#64748B",
          fontSize: "10px",
          textTransform: "uppercase",
        }}
      >
        {label || "OB Score"}
      </span>
    </div>
  );
}

function SignalRowCard({ row }: { row: SequenceSignalRow }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(9, 14, 28, 0.94))",
          border: "1px solid rgba(51, 65, 85, 0.7)",
          borderRadius: "14px",
          padding: "14px",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              style={{ color: "#F8FAFC", fontSize: "17px", fontWeight: 800 }}
            >
              {row.symbol}
            </div>
            <div
              style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}
            >
              {row.signal}
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <SideBadge side={row.side} />
            <SignalTypeBadge signalType={row.signal_type} />
            <TimeframeBadge timeframe={row.timeframe} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <div
              style={{
                color: "#64748B",
                fontSize: "10px",
                textTransform: "uppercase",
              }}
            >
              Signal Time
            </div>
            <div
              style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 700 }}
            >
              {row.signal_time}
            </div>
          </div>
          <div>
            <div
              style={{
                color: "#64748B",
                fontSize: "10px",
                textTransform: "uppercase",
              }}
            >
              Price
            </div>
            <div
              style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 700 }}
            >
              {formatCurrency(row.price)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 gap-3">
          <ObScoreBadge text={row.ob_score_text} label={row.ob_score_label} />
          {row.mtf_label ? (
            <span
              style={{ color: "#C4B5FD", fontSize: "11px", fontWeight: 700 }}
            >
              {row.mtf_label}
            </span>
          ) : null}
        </div>

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
          <div
            style={{
              marginTop: "10px",
              backgroundColor: "rgba(15, 23, 42, 0.66)",
              border: "1px solid rgba(51, 65, 85, 0.6)",
              borderRadius: "12px",
              padding: "12px",
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div
                  style={{
                    color: "#64748B",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Timestamp
                </div>
                <div
                  style={{
                    color: "#E2E8F0",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {row.signal_timestamp}
                </div>
              </div>
              <div>
                <div
                  style={{
                    color: "#64748B",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Rank
                </div>
                <div
                  style={{
                    color: "#E2E8F0",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  #{row.rank}
                </div>
              </div>
              <div>
                <div
                  style={{
                    color: "#64748B",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  Source
                </div>
                <div
                  style={{
                    color: "#E2E8F0",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {row.source}
                </div>
              </div>
              {row.mtf_label ? (
                <div>
                  <div
                    style={{
                      color: "#64748B",
                      fontSize: "10px",
                      textTransform: "uppercase",
                    }}
                  >
                    MTF Label
                  </div>
                  <div
                    style={{
                      color: "#E2E8F0",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {row.mtf_label}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function SequenceSignalsTab() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState<SequenceSignalQuery>({
    limit: 50,
    timeframe: "ALL",
    side: "ALL",
    signal_type: "ALL",
    session_date: "",
  });
  const [data, setData] = useState<SequenceSignalsResponse>(
    createEmptySequenceSignalsResponse(query),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchSequenceSignalsData(query, controller.signal)
      .then((response) => {
        setData(response);
      })
      .catch((fetchError) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load Sequence Signals",
        );
        setData(createEmptySequenceSignalsResponse(query));
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  const hasSignals = data.signals.length > 0;
  const isBackendError = data.status === "error";
  const emptyMessage =
    data.message || "No sequence signals found for the selected filters.";

  const metadataItems = useMemo(() => {
    return [
      data.source ? `Source: ${data.source}` : "",
      data.session_date ? `Session: ${data.session_date}` : "",
      data.market_data_last_updated
        ? `Market Data: ${data.market_data_last_updated}`
        : "",
      data.last_updated ? `Updated: ${data.last_updated}` : "",
    ].filter(Boolean);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-300 text-lg">
        Loading Sequence Signals...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-300 text-lg">
        {error}
      </div>
    );
  }

  if (isBackendError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-64 text-center">
        <div style={{ color: "#FCA5A5", fontSize: "18px", fontWeight: 700 }}>
          Sequence Signals returned an error
        </div>
        <div style={{ color: "#94A3B8", fontSize: "13px" }}>
          {data.message || "The backend reported an error."}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #07111f 0%, #0b1220 100%)",
        minHeight: "100vh",
      }}
    >
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
              <div
                style={{
                  color: "#7DD3FC",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Strategy Signal History
              </div>
              <div
                style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 800 }}
              >
                Sequence Signals
              </div>
              <div
                style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}
              >
                Same-day signal discovery across C2, C3, and MTF setups with
                backend-ranked ordering.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {metadataItems.map((item) => (
                <span key={item} style={{ color: "#64748B", fontSize: "11px" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mt-4">
            <SummaryPill
              label="Total"
              value={String(data.summary.total)}
              tone="accent"
            />
            <SummaryPill
              label="3m"
              value={String(data.summary.timeframes["3m"])}
            />
            <SummaryPill
              label="5m"
              value={String(data.summary.timeframes["5m"])}
            />
            <SummaryPill
              label="15m"
              value={String(data.summary.timeframes["15m"])}
            />
            <SummaryPill
              label="C2"
              value={String(data.summary.signal_types.C2)}
            />
            <SummaryPill
              label="C3"
              value={String(data.summary.signal_types.C3)}
            />
            <SummaryPill
              label="MTF"
              value={String(data.summary.signal_types.MTF)}
            />
            <SummaryPill
              label="Buy"
              value={String(data.summary.sides.BUY)}
              tone="positive"
            />
            <SummaryPill
              label="Sell"
              value={String(data.summary.sides.SELL)}
              tone="negative"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-4">
            <select
              value={query.timeframe}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  timeframe: event.target.value as SequenceSignalQueryTimeframe,
                }))
              }
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                color: "#E2E8F0",
                border: "1px solid rgba(71, 85, 105, 0.85)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              {TIMEFRAME_OPTIONS.map((timeframe) => (
                <option key={timeframe} value={timeframe}>
                  Timeframe: {timeframe}
                </option>
              ))}
            </select>

            <select
              value={query.side}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  side: event.target.value as SequenceSignalQuerySide,
                }))
              }
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                color: "#E2E8F0",
                border: "1px solid rgba(71, 85, 105, 0.85)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              {SIDE_OPTIONS.map((side) => (
                <option key={side} value={side}>
                  Side: {side}
                </option>
              ))}
            </select>

            <select
              value={query.signal_type}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  signal_type: event.target.value as SequenceSignalQueryType,
                }))
              }
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                color: "#E2E8F0",
                border: "1px solid rgba(71, 85, 105, 0.85)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              {TYPE_OPTIONS.map((signalType) => (
                <option key={signalType} value={signalType}>
                  Type: {signalType}
                </option>
              ))}
            </select>

            <select
              value={query.limit}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  limit: Number(event.target.value),
                }))
              }
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
                <option key={limit} value={limit}>
                  Limit: {limit}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={query.session_date ?? ""}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  session_date: event.target.value,
                }))
              }
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                color: "#E2E8F0",
                border: "1px solid rgba(71, 85, 105, 0.85)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
              }}
            />

            {query.session_date ? (
              <button
                type="button"
                onClick={() =>
                  setQuery((current) => ({ ...current, session_date: "" }))
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(71, 85, 105, 0.85)",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  color: "#CBD5E1",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                Clear Date
              </button>
            ) : null}
          </div>
        </div>

        {!hasSignals ? (
          <div className="flex flex-col items-center justify-center gap-2 mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-16 text-center">
            <div
              style={{ color: "#E2E8F0", fontSize: "18px", fontWeight: 700 }}
            >
              No Sequence Signals
            </div>
            <div
              style={{ color: "#94A3B8", fontSize: "13px", maxWidth: "560px" }}
            >
              {emptyMessage}
            </div>
          </div>
        ) : isMobile ? (
          <div className="grid grid-cols-1 gap-3 mt-4">
            {data.signals.map((row) => (
              <SignalRowCard
                key={`${row.symbol}-${row.signal_timestamp}-${row.rank}`}
                row={row}
              />
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
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow className="border-b border-slate-800/80 hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Rank
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Symbol
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Timeframe
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Side
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Type
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Signal
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Signal Time
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Price
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    OB Score
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    MTF
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Source
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.signals.map((row) => (
                  <TableRow
                    key={`${row.symbol}-${row.signal_timestamp}-${row.rank}`}
                    className="border-b border-slate-800/80 bg-transparent hover:bg-slate-900/70"
                  >
                    <TableCell className="py-3 text-slate-300">
                      #{row.rank}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-100">
                          {row.symbol}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {row.signal_timestamp}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <TimeframeBadge timeframe={row.timeframe} />
                    </TableCell>
                    <TableCell className="py-3">
                      <SideBadge side={row.side} />
                    </TableCell>
                    <TableCell className="py-3">
                      <SignalTypeBadge signalType={row.signal_type} />
                    </TableCell>
                    <TableCell className="py-3 text-slate-200 font-medium">
                      {row.signal}
                    </TableCell>
                    <TableCell className="py-3 text-slate-300">
                      {row.signal_time}
                    </TableCell>
                    <TableCell className="py-3 text-slate-200">
                      {formatCurrency(row.price)}
                    </TableCell>
                    <TableCell className="py-3">
                      <ObScoreBadge
                        text={row.ob_score_text}
                        label={row.ob_score_label}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-slate-300">
                      {row.mtf_label || "--"}
                    </TableCell>
                    <TableCell className="py-3 text-slate-400">
                      {row.source}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
