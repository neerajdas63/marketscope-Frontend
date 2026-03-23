import { useEffect, useMemo, useState } from "react";
import { Bell, Bot, CircleAlert, Crosshair, RefreshCw, ShieldAlert, Target, TrendingUp } from "lucide-react";

import {
  acknowledgeTradeGuardianAlert,
  closeTradeGuardianTrade,
  createTradeGuardianTrade,
  fetchTradeGuardianAlerts,
  fetchTradeGuardianSummary,
  fetchTradeGuardianTradeDetail,
  fetchTradeGuardianTrades,
  normalizeTradeGuardianDashboard,
  sendTradeGuardianTestTelegram,
  triggerTradeGuardianMonitor,
  type CreateTradeGuardianTradeInput,
  type TradeGuardianAlert,
  type TradeGuardianDashboardSummary,
  type TradeGuardianTrade,
  type TradeGuardianTradeDetail,
  type TradeGuardianTradeStatus,
} from "@/lib/tradeGuardianApi";

type TradeGuardianView = "add" | "active" | "alerts" | "detail" | "closed";

type TradeFormState = {
  symbol: string;
  direction: "LONG" | "SHORT";
  entry_price: string;
  stop_loss: string;
  target_1: string;
  target_2: string;
  quantity: string;
  notes: string;
};

const INITIAL_FORM: TradeFormState = {
  symbol: "",
  direction: "LONG",
  entry_price: "",
  stop_loss: "",
  target_1: "",
  target_2: "",
  quantity: "",
  notes: "",
};

const OPEN_STATUSES: TradeGuardianTradeStatus[] = ["pending", "active", "t1_hit"];
const CLOSED_STATUSES: TradeGuardianTradeStatus[] = ["t2_hit", "sl_hit", "closed_manual", "cancelled"];

const statusStyles: Record<TradeGuardianTradeStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-amber-500/30 bg-amber-500/10 text-amber-200" },
  active: { label: "Active", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" },
  t1_hit: { label: "T1 Hit", className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200" },
  t2_hit: { label: "T2 Hit", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" },
  sl_hit: { label: "SL Hit", className: "border-rose-500/40 bg-rose-500/15 text-rose-100" },
  closed_manual: { label: "Closed Manual", className: "border-slate-500/30 bg-slate-500/10 text-slate-200" },
  cancelled: { label: "Cancelled", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300" },
  unknown: { label: "Unknown", className: "border-slate-600/30 bg-slate-700/20 text-slate-300" },
};

const alertToneMap: Record<string, { label: string; cardClass: string; badgeClass: string }> = {
  entry_hit: {
    label: "Entry",
    cardClass: "border-cyan-500/25 bg-cyan-950/25",
    badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  },
  stop_loss_hit: {
    label: "Stop Loss",
    cardClass: "border-rose-500/35 bg-rose-950/25",
    badgeClass: "border-rose-500/40 bg-rose-500/15 text-rose-100",
  },
  sl_hit: {
    label: "Stop Loss",
    cardClass: "border-rose-500/35 bg-rose-950/25",
    badgeClass: "border-rose-500/40 bg-rose-500/15 text-rose-100",
  },
  target_1_hit: {
    label: "Target 1",
    cardClass: "border-amber-500/25 bg-amber-950/25",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  target_2_hit: {
    label: "Target 2",
    cardClass: "border-emerald-500/30 bg-emerald-950/20",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
};

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTimestamp(value: string) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortAlerts(alerts: TradeGuardianAlert[]) {
  return [...alerts].sort((left, right) => {
    const leftCritical = left.alert_type === "stop_loss_hit" || left.alert_type === "sl_hit" ? 1 : 0;
    const rightCritical = right.alert_type === "stop_loss_hit" || right.alert_type === "sl_hit" ? 1 : 0;
    if (leftCritical !== rightCritical) {
      return rightCritical - leftCritical;
    }

    const leftUnresolved = !left.acknowledged_at && !left.resolved_at ? 1 : 0;
    const rightUnresolved = !right.acknowledged_at && !right.resolved_at ? 1 : 0;
    if (leftUnresolved !== rightUnresolved) {
      return rightUnresolved - leftUnresolved;
    }

    return (right.last_sent_at || right.first_triggered_at).localeCompare(left.last_sent_at || left.first_triggered_at);
  });
}

function isAlertRepeating(alert: TradeGuardianAlert) {
  return (alert.repeat_every_seconds ?? 0) > 0 && !alert.acknowledged_at && !alert.resolved_at;
}

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-50">{value}</div>
      <div className="mt-1 text-xs" style={{ color: accent }}>{detail}</div>
    </div>
  );
}

function SectionButton({
  active,
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  icon: typeof ShieldAlert;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-slate-100"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function PriceCell({ label, value, highlight }: { label: string; value: number | null; highlight?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold" style={{ color: highlight ?? "#f8fafc" }}>{formatCurrency(value)}</div>
    </div>
  );
}

function TradeCard({
  trade,
  onView,
  onClose,
  closing,
}: {
  trade: TradeGuardianTrade;
  onView: () => void;
  onClose?: () => void;
  closing?: boolean;
}) {
  const statusMeta = statusStyles[trade.status];
  const isShort = trade.direction === "SHORT";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xl font-extrabold text-slate-50">{trade.symbol}</div>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${isShort ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>
              {trade.direction}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-400">{trade.latest_alert || "No alert emitted yet."}</div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>Created {formatTimestamp(trade.created_at)}</div>
          <div className="mt-1">Updated {formatTimestamp(trade.updated_at)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <PriceCell label="Entry" value={trade.entry_price} highlight="#f8fafc" />
        <PriceCell label="Stop Loss" value={trade.stop_loss} highlight="#fda4af" />
        <PriceCell label="Target 1" value={trade.target_1} highlight="#fcd34d" />
        <PriceCell label="Target 2" value={trade.target_2} highlight="#86efac" />
        <PriceCell label="Last Price" value={trade.last_price} highlight={isShort ? "#fca5a5" : "#7dd3fc"} />
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Lifecycle</div>
          <div className="mt-1 text-xs font-semibold text-slate-300">Act: {formatTimestamp(trade.activated_at)}</div>
          <div className="mt-1 text-xs font-semibold text-slate-400">Close: {formatTimestamp(trade.closed_at)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Qty {trade.quantity ?? "--"}
          {trade.notes ? ` • ${trade.notes}` : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-cyan-400/40 hover:text-cyan-100"
          >
            View Detail
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              disabled={closing}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {closing ? "Closing..." : "Close Trade"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  acknowledging,
  showAcknowledge = true,
}: {
  alert: TradeGuardianAlert;
  onAcknowledge: () => void;
  acknowledging: boolean;
  showAcknowledge?: boolean;
}) {
  const tone = alertToneMap[alert.alert_type] ?? {
    label: alert.alert_type.replace(/_/g, " "),
    cardClass: "border-slate-700 bg-slate-950/60",
    badgeClass: "border-slate-700 bg-slate-800/70 text-slate-200",
  };
  const repeating = isAlertRepeating(alert);
  const statusMeta = statusStyles[alert.related_trade_status];

  return (
    <article className={`rounded-2xl border p-4 ${tone.cardClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone.badgeClass}`}>{tone.label}</span>
            {repeating ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-100">
                Repeating every {alert.repeat_every_seconds}s
              </span>
            ) : null}
            {alert.acknowledged_at ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-100">
                Acknowledged
              </span>
            ) : null}
          </div>
          <div className="mt-3 text-base font-bold text-slate-50">{alert.message || "Alert message unavailable"}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{alert.related_symbol || "Unknown symbol"}</span>
            <span className="rounded-full border border-slate-700 px-2 py-0.5">{alert.related_direction ?? "--"}</span>
            <span className={`rounded-full border px-2 py-0.5 ${statusMeta.className}`}>{statusMeta.label}</span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>First {formatTimestamp(alert.first_triggered_at)}</div>
          <div className="mt-1">Last {formatTimestamp(alert.last_sent_at)}</div>
          <div className="mt-1">Last price {formatCurrency(alert.last_price)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Repeat count {alert.repeat_count}
          {alert.resolved_at ? ` • Resolved ${formatTimestamp(alert.resolved_at)}` : ""}
        </div>
        {showAcknowledge && !alert.acknowledged_at && !alert.resolved_at ? (
          <button
            type="button"
            onClick={onAcknowledge}
            disabled={acknowledging}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {acknowledging ? "Acknowledging..." : "Acknowledge Alert"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function TimelineCard({ detail }: { detail: TradeGuardianTradeDetail | null }) {
  if (!detail?.trade) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
        Select a trade from Active Trades or Closed Trades to inspect the backend timeline and alert history.
      </div>
    );
  }

  const trade = detail.trade;
  const statusMeta = statusStyles[trade.status];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-extrabold text-slate-50">{trade.symbol}</h3>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${trade.direction === "SHORT" ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>
                {trade.direction}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusMeta.className}`}>{statusMeta.label}</span>
            </div>
            <div className="mt-2 text-sm text-slate-400">{trade.notes || "No notes attached to this trade."}</div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Created {formatTimestamp(trade.created_at)}</div>
            <div className="mt-1">Updated {formatTimestamp(trade.updated_at)}</div>
            <div className="mt-1">Closed {formatTimestamp(trade.closed_at)}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <PriceCell label="Entry" value={trade.entry_price} />
          <PriceCell label="Stop Loss" value={trade.stop_loss} highlight="#fda4af" />
          <PriceCell label="Target 1" value={trade.target_1} highlight="#fcd34d" />
          <PriceCell label="Target 2" value={trade.target_2} highlight="#86efac" />
          <PriceCell label="Last Price" value={trade.last_price} highlight="#7dd3fc" />
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Execution</div>
            <div className="mt-1 text-sm font-bold text-slate-50">Qty {trade.quantity ?? "--"}</div>
            <div className="mt-1 text-xs text-slate-400">Activated {formatTimestamp(trade.activated_at)}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Timeline</div>
          <div className="mt-3 space-y-3">
            {detail.timeline.length > 0 ? detail.timeline.map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-100">{event.message}</div>
                  <div className="text-xs text-slate-500">{formatTimestamp(event.created_at)}</div>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {event.event_type.replace(/_/g, " ")}
                  {event.price !== null ? ` • ${formatCurrency(event.price)}` : ""}
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
                No backend timeline entries were returned yet for this trade.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Trade Alerts</div>
        <div className="mt-3 space-y-3">
          {sortAlerts(detail.alerts).length > 0 ? sortAlerts(detail.alerts).map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAcknowledge={() => undefined} acknowledging={false} showAcknowledge={false} />
          )) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
              No trade-specific alerts were returned with this detail payload.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function TradeGuardianTab() {
  const [view, setView] = useState<TradeGuardianView>("active");
  const [form, setForm] = useState<TradeFormState>(INITIAL_FORM);
  const [summary, setSummary] = useState<TradeGuardianDashboardSummary>(() => normalizeTradeGuardianDashboard({}));
  const [trades, setTrades] = useState<TradeGuardianTrade[]>([]);
  const [alerts, setAlerts] = useState<TradeGuardianAlert[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [detail, setDetail] = useState<TradeGuardianTradeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [closingTradeId, setClosingTradeId] = useState("");
  const [acknowledgingAlertId, setAcknowledgingAlertId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeTrades = useMemo(() => trades.filter((trade) => OPEN_STATUSES.includes(trade.status)), [trades]);
  const closedTrades = useMemo(() => trades.filter((trade) => CLOSED_STATUSES.includes(trade.status)), [trades]);
  const sortedAlerts = useMemo(() => sortAlerts(alerts), [alerts]);

  useEffect(() => {
    if (!selectedTradeId) {
      const fallbackTrade = activeTrades[0] ?? trades[0];
      if (fallbackTrade) {
        setSelectedTradeId(fallbackTrade.id);
      }
      return;
    }

    if (!trades.some((trade) => trade.id === selectedTradeId)) {
      const fallbackTrade = activeTrades[0] ?? trades[0];
      setSelectedTradeId(fallbackTrade?.id ?? "");
    }
  }, [activeTrades, selectedTradeId, trades]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWorkspace(initial = false) {
      setError("");
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [summaryResult, tradesResult, alertsResult] = await Promise.allSettled([
        fetchTradeGuardianSummary(controller.signal),
        fetchTradeGuardianTrades(controller.signal),
        fetchTradeGuardianAlerts(controller.signal),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      const nextTrades = tradesResult.status === "fulfilled" ? tradesResult.value : trades;
      const nextAlerts = alertsResult.status === "fulfilled" ? alertsResult.value : alerts;

      if (tradesResult.status === "fulfilled") {
        setTrades(tradesResult.value);
      }

      if (alertsResult.status === "fulfilled") {
        setAlerts(alertsResult.value);
      }

      if (summaryResult.status === "fulfilled") {
        setSummary(normalizeTradeGuardianDashboard(summaryResult.value, nextTrades, nextAlerts));
      } else {
        setSummary(normalizeTradeGuardianDashboard({}, nextTrades, nextAlerts));
      }

      if (summaryResult.status === "rejected" && tradesResult.status === "rejected" && alertsResult.status === "rejected") {
        setError(summaryResult.reason instanceof Error ? summaryResult.reason.message : "Unable to load Trade Guardian workspace");
      } else if (summaryResult.status === "rejected" || tradesResult.status === "rejected" || alertsResult.status === "rejected") {
        setError("Trade Guardian loaded partially. Some backend sections are temporarily unavailable.");
      }

      setLoading(false);
      setRefreshing(false);
    }

    loadWorkspace(true);
    const intervalId = window.setInterval(() => {
      loadWorkspace(false).catch(() => undefined);
    }, 15000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTradeId) {
      setDetail(null);
      return;
    }

    const controller = new AbortController();
    setDetailLoading(true);

    fetchTradeGuardianTradeDetail(selectedTradeId, controller.signal)
      .then((payload) => {
        setDetail(payload);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load trade detail");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedTradeId]);

  async function refreshWorkspaceNotice(message: string) {
    setNotice(message);
    const [summaryPayload, nextTrades, nextAlerts] = await Promise.all([
      fetchTradeGuardianSummary(),
      fetchTradeGuardianTrades(),
      fetchTradeGuardianAlerts(),
    ]);

    setTrades(nextTrades);
    setAlerts(nextAlerts);
    setSummary(normalizeTradeGuardianDashboard(summaryPayload, nextTrades, nextAlerts));
  }

  async function handleCreateTrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const payload: CreateTradeGuardianTradeInput = {
        symbol: form.symbol.trim().toUpperCase(),
        direction: form.direction,
        entry_price: Number(form.entry_price),
        stop_loss: Number(form.stop_loss),
        target_1: Number(form.target_1),
        target_2: Number(form.target_2),
        quantity: Number(form.quantity),
        notes: form.notes.trim(),
      };

      const created = await createTradeGuardianTrade(payload);
      await refreshWorkspaceNotice(`Trade created for ${payload.symbol}. Backend monitoring is now the source of truth.`);
      setForm(INITIAL_FORM);

      if (created.trade?.id) {
        setSelectedTradeId(created.trade.id);
        setView("detail");
      } else {
        setView("active");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create trade");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseTrade(tradeId: string) {
    if (!window.confirm("Close this trade? The backend will mark it closed_manual and stop live tracking for the open position.")) {
      return;
    }

    setClosingTradeId(tradeId);
    setError("");
    setNotice("");

    try {
      await closeTradeGuardianTrade(tradeId);
      await refreshWorkspaceNotice("Trade closed manually. Backend state refreshed.");
      setView("closed");
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Unable to close trade");
    } finally {
      setClosingTradeId("");
    }
  }

  async function handleAcknowledge(alertId: string) {
    setAcknowledgingAlertId(alertId);
    setError("");
    setNotice("");

    try {
      await acknowledgeTradeGuardianAlert(alertId);
      await refreshWorkspaceNotice("Alert acknowledged. Repeated reminders should now stop on the backend.");
    } catch (ackError) {
      setError(ackError instanceof Error ? ackError.message : "Unable to acknowledge alert");
    } finally {
      setAcknowledgingAlertId("");
    }
  }

  async function handleMonitorRefresh() {
    setMonitoring(true);
    setError("");
    setNotice("");

    try {
      await triggerTradeGuardianMonitor();
      await refreshWorkspaceNotice("Manual monitor refresh completed. Latest backend trade and alert state reloaded.");
    } catch (monitorError) {
      setError(monitorError instanceof Error ? monitorError.message : "Unable to trigger manual monitor refresh");
    } finally {
      setMonitoring(false);
    }
  }

  async function handleTestTelegram() {
    setTestingTelegram(true);
    setError("");
    setNotice("");

    try {
      await sendTradeGuardianTestTelegram();
      setNotice("Test Telegram alert requested. Confirm delivery from the backend alert channel.");
    } catch (telegramError) {
      setError(telegramError instanceof Error ? telegramError.message : "Unable to send test Telegram alert");
    } finally {
      setTestingTelegram(false);
    }
  }

  function updateForm<K extends keyof TradeFormState>(key: K, value: TradeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const selectedTrade = trades.find((trade) => trade.id === selectedTradeId) ?? detail?.trade ?? null;

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-lg text-cyan-300">Loading Trade Guardian...</div>;
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #07111f 0%, #0b1220 100%)", minHeight: "100vh" }}>
      {refreshing ? (
        <div className="flex items-center justify-center gap-2 border-b border-cyan-950/60 bg-[#0a1a2d] py-2 text-xs text-cyan-200">
          Refreshing live trade tracker...
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-center gap-2 border-b border-rose-950/60 bg-rose-950/30 py-2 text-xs text-rose-100">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="flex items-center justify-center gap-2 border-b border-emerald-950/60 bg-emerald-950/30 py-2 text-xs text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div className="p-4">
        <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),linear-gradient(180deg,rgba(9,15,28,0.95),rgba(9,15,28,0.85))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/80">Live Trade Tracker</div>
              <h1 className="mt-1 text-3xl font-black text-slate-50">Trade Guardian</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Manual trade entry with backend-owned live monitoring, Telegram alerts, and state transitions for entry, stop loss, and targets. The frontend only renders backend truth so the risk state stays impossible to miss.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleMonitorRefresh}
                disabled={monitoring}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={15} className={monitoring ? "animate-spin" : ""} />
                {monitoring ? "Refreshing monitor..." : "Manual Monitor Refresh"}
              </button>
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Bot size={15} />
                {testingTelegram ? "Sending test..." : "Send Test Telegram"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Pending Trades" value={String(summary.pending_count)} detail="Entry not hit yet" accent="#fcd34d" />
            <StatCard label="Active Trades" value={String(summary.active_count)} detail="Backend monitoring live" accent="#86efac" />
            <StatCard label="Closed Trades" value={String(summary.closed_count)} detail="T2, SL, manual, or cancelled" accent="#cbd5e1" />
            <StatCard label="Open Alerts" value={String(summary.unacknowledged_alert_count)} detail="Needs user attention" accent="#fda4af" />
            <StatCard label="Repeating Alerts" value={String(summary.repeating_alert_count)} detail="Still escalating until acknowledged" accent="#fbbf24" />
            <StatCard
              label="Monitor"
              value={summary.monitor_status.replace(/_/g, " ").toUpperCase()}
              detail={summary.last_monitor_run_at ? `Last run ${formatTimestamp(summary.last_monitor_run_at)}` : "Waiting for first backend run"}
              accent={summary.telegram_enabled === false ? "#fda4af" : "#7dd3fc"}
            />
          </div>
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          <SectionButton active={view === "active"} label={`Active Trades (${activeTrades.length})`} icon={Crosshair} onClick={() => setView("active")} />
          <SectionButton active={view === "add"} label="Add Trade" icon={TrendingUp} onClick={() => setView("add")} />
          <SectionButton active={view === "alerts"} label={`Alert Center (${sortedAlerts.length})`} icon={Bell} onClick={() => setView("alerts")} />
          <SectionButton active={view === "detail"} label="Trade Detail" icon={Target} onClick={() => setView("detail")} disabled={!selectedTradeId} />
          <SectionButton active={view === "closed"} label={`Closed / Review (${closedTrades.length})`} icon={ShieldAlert} onClick={() => setView("closed")} />
        </div>

        {view === "add" ? (
          <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-extrabold text-slate-50">Add Trade</h2>
                <p className="mt-1 text-sm text-slate-400">Create the trade manually. After submission, the backend owns state progression, alerting, and reminder cadence.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                Stop loss and target alerts remain visible until acknowledged.
              </div>
            </div>

            <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleCreateTrade}>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Symbol
                <input value={form.symbol} onChange={(event) => updateForm("symbol", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" placeholder="RELIANCE" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Direction
                <select value={form.direction} onChange={(event) => updateForm("direction", event.target.value as "LONG" | "SHORT")} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50">
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Entry Price
                <input value={form.entry_price} onChange={(event) => updateForm("entry_price", event.target.value)} type="number" step="0.01" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Stop Loss
                <input value={form.stop_loss} onChange={(event) => updateForm("stop_loss", event.target.value)} type="number" step="0.01" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Target 1
                <input value={form.target_1} onChange={(event) => updateForm("target_1", event.target.value)} type="number" step="0.01" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Target 2
                <input value={form.target_2} onChange={(event) => updateForm("target_2", event.target.value)} type="number" step="0.01" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Quantity
                <input value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} type="number" step="1" min="1" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" required />
              </label>
              <label className="md:col-span-2 xl:col-span-4 flex flex-col gap-2 text-sm font-semibold text-slate-200">
                Notes
                <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} rows={4} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50" placeholder="Why this trade exists, what invalidates it, and how you want the reminder cadence interpreted." />
              </label>
              <div className="md:col-span-2 xl:col-span-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="text-xs text-slate-400">Pending means the trade exists before entry. Active, T1, T2, SL, and alert lifecycles all come from the backend.</div>
                <button type="submit" disabled={submitting} className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? "Creating trade..." : "Create Trade"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {view === "active" ? (
          <section className="mt-4 space-y-4">
            {activeTrades.length > 0 ? activeTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onView={() => {
                  setSelectedTradeId(trade.id);
                  setView("detail");
                }}
                onClose={() => handleCloseTrade(trade.id)}
                closing={closingTradeId === trade.id}
              />
            )) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center text-sm text-slate-400">
                No pending or active trades are currently tracked by the backend. Add a trade to start the live guardian workflow.
              </div>
            )}
          </section>
        ) : null}

        {view === "alerts" ? (
          <section className="mt-4 space-y-4">
            {sortedAlerts.length > 0 ? sortedAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => handleAcknowledge(alert.id)}
                acknowledging={acknowledgingAlertId === alert.id}
              />
            )) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center text-sm text-slate-400">
                Alert Center is clear. No backend alerts are active right now.
              </div>
            )}
          </section>
        ) : null}

        {view === "detail" ? (
          <section className="mt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Selected Trade</div>
                <div className="mt-1 text-sm text-slate-200">{selectedTrade ? `${selectedTrade.symbol} • ${selectedTrade.direction} • ${statusStyles[selectedTrade.status].label}` : "No trade selected"}</div>
              </div>
              <select
                value={selectedTradeId}
                onChange={(event) => setSelectedTradeId(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/50"
              >
                {trades.map((trade) => (
                  <option key={trade.id} value={trade.id}>{trade.symbol} • {statusStyles[trade.status].label}</option>
                ))}
              </select>
            </div>
            {detailLoading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center text-sm text-cyan-200">Loading backend trade detail...</div>
            ) : (
              <TimelineCard detail={detail} />
            )}
          </section>
        ) : null}

        {view === "closed" ? (
          <section className="mt-4 space-y-4">
            {closedTrades.length > 0 ? closedTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onView={() => {
                  setSelectedTradeId(trade.id);
                  setView("detail");
                }}
              />
            )) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center text-sm text-slate-400">
                No completed trades are available for review yet.
              </div>
            )}
          </section>
        ) : null}

        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-400">
          <div className="flex items-center gap-2 text-slate-200"><CircleAlert size={16} /> Backend change context</div>
          <div className="mt-2">
            Trade Guardian state comes from the backend live tracker and Telegram system. A trade can move through pending, active, target, stop loss, manual close, or cancellation based on monitored market state. The frontend does not promote or suppress those transitions on its own.
          </div>
          <div className="mt-2">
            Stop loss alerts are rendered as the highest-priority visual state. Target alerts remain visible until acknowledged, and repeated alerts explicitly show that they are still escalating.
          </div>
        </section>
      </div>
    </div>
  );
}