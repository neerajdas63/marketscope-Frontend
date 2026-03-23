import { apiFetch } from "@/lib/api";

export type TradeGuardianDirection = "LONG" | "SHORT";

export type TradeGuardianTradeStatus =
  | "pending"
  | "active"
  | "t1_hit"
  | "t2_hit"
  | "sl_hit"
  | "closed_manual"
  | "cancelled"
  | "unknown";

export interface TradeGuardianTrade {
  id: string;
  symbol: string;
  direction: TradeGuardianDirection;
  entry_price: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
  quantity: number | null;
  notes: string;
  last_price: number | null;
  status: TradeGuardianTradeStatus;
  latest_alert: string;
  created_at: string;
  updated_at: string;
  activated_at: string;
  closed_at: string;
}

export interface TradeGuardianAlert {
  id: string;
  trade_id: string;
  alert_type: string;
  message: string;
  status: string;
  repeat_every_seconds: number | null;
  repeat_count: number;
  first_triggered_at: string;
  last_sent_at: string;
  acknowledged_at: string;
  resolved_at: string;
  last_price: number | null;
  related_symbol: string;
  related_direction: TradeGuardianDirection | null;
  related_trade_status: TradeGuardianTradeStatus;
}

export interface TradeGuardianTimelineEvent {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
  status: string;
  price: number | null;
}

export interface TradeGuardianTradeDetail {
  trade: TradeGuardianTrade | null;
  alerts: TradeGuardianAlert[];
  timeline: TradeGuardianTimelineEvent[];
}

export interface TradeGuardianDashboardSummary {
  pending_count: number;
  active_count: number;
  closed_count: number;
  unacknowledged_alert_count: number;
  repeating_alert_count: number;
  critical_alert_count: number;
  last_monitor_run_at: string;
  monitor_status: string;
  telegram_enabled: boolean | null;
}

export interface CreateTradeGuardianTradeInput {
  symbol: string;
  direction: TradeGuardianDirection;
  entry_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  quantity: number;
  notes: string;
}

const TRADE_GUARDIAN_BASE = "/api/trade-guardian";
const TRADE_STATUSES: TradeGuardianTradeStatus[] = [
  "pending",
  "active",
  "t1_hit",
  "t2_hit",
  "sl_hit",
  "closed_manual",
  "cancelled",
  "unknown",
];

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeDirection(value: unknown): TradeGuardianDirection | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.toUpperCase() === "SHORT" ? "SHORT" : value.toUpperCase() === "LONG" ? "LONG" : null;
}

function normalizeTradeStatus(value: unknown): TradeGuardianTradeStatus {
  if (typeof value !== "string") {
    return "unknown";
  }

  const normalized = normalizeToken(value);
  return TRADE_STATUSES.includes(normalized as TradeGuardianTradeStatus)
    ? (normalized as TradeGuardianTradeStatus)
    : "unknown";
}

function readArrayCandidate(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return [] as unknown[];
  }

  const candidates = [record.items, record.results, record.data, record.trades, record.alerts, record.timeline, record.events];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [] as unknown[];
}

function readLatestAlert(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return "";
  }

  return asString(record.message) || asString(record.alert_message) || asString(record.title);
}

export function normalizeTradeGuardianTrade(value: unknown): TradeGuardianTrade | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id) || asString(record.trade_id);
  const symbol = asString(record.symbol).toUpperCase();
  const direction = normalizeDirection(record.direction) ?? "LONG";

  if (!id && !symbol) {
    return null;
  }

  return {
    id: id || `${symbol}-${asString(record.created_at) || "trade"}`,
    symbol,
    direction,
    entry_price: asFiniteNumber(record.entry_price ?? record.entry),
    stop_loss: asFiniteNumber(record.stop_loss),
    target_1: asFiniteNumber(record.target_1 ?? record.target1),
    target_2: asFiniteNumber(record.target_2 ?? record.target2),
    quantity: asFiniteNumber(record.quantity),
    notes: asString(record.notes),
    last_price: asFiniteNumber(record.last_price ?? record.current_price ?? record.ltp),
    status: normalizeTradeStatus(record.status),
    latest_alert: readLatestAlert(record.latest_alert ?? record.last_alert),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at ?? record.last_updated),
    activated_at: asString(record.activated_at ?? record.entry_triggered_at),
    closed_at: asString(record.closed_at ?? record.exited_at),
  };
}

export function normalizeTradeGuardianAlert(value: unknown): TradeGuardianAlert | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = asString(record.id) || asString(record.alert_id);
  const relatedTrade = normalizeTradeGuardianTrade(record.trade);

  if (!id && !asString(record.alert_type) && !asString(record.message)) {
    return null;
  }

  return {
    id: id || `${asString(record.alert_type) || "alert"}-${asString(record.first_triggered_at)}`,
    trade_id: asString(record.trade_id) || relatedTrade?.id || "",
    alert_type: normalizeToken(asString(record.alert_type) || asString(record.type) || "alert"),
    message: asString(record.message) || asString(record.alert_message) || asString(record.title),
    status: normalizeToken(asString(record.status) || "pending"),
    repeat_every_seconds: asFiniteNumber(record.repeat_every_seconds ?? record.repeat_interval_seconds ?? record.remind_every_seconds),
    repeat_count: asFiniteNumber(record.repeat_count ?? record.reminder_count) ?? 0,
    first_triggered_at: asString(record.first_triggered_at ?? record.triggered_at),
    last_sent_at: asString(record.last_sent_at ?? record.sent_at),
    acknowledged_at: asString(record.acknowledged_at),
    resolved_at: asString(record.resolved_at),
    last_price: asFiniteNumber(record.last_price ?? record.current_price ?? record.ltp),
    related_symbol: asString(record.related_symbol) || relatedTrade?.symbol || asString(record.symbol),
    related_direction: normalizeDirection(record.related_direction ?? record.direction ?? relatedTrade?.direction),
    related_trade_status: normalizeTradeStatus(record.related_trade_status ?? record.trade_status ?? relatedTrade?.status),
  };
}

export function normalizeTradeGuardianTimelineEvent(value: unknown): TradeGuardianTimelineEvent | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const eventType = normalizeToken(asString(record.event_type) || asString(record.type) || asString(record.status) || "update");
  const message = asString(record.message) || asString(record.description) || asString(record.title);

  if (!message && !eventType) {
    return null;
  }

  return {
    id: asString(record.id) || `${eventType}-${asString(record.created_at)}`,
    event_type: eventType,
    message: message || eventType,
    created_at: asString(record.created_at ?? record.timestamp),
    status: normalizeToken(asString(record.status) || eventType),
    price: asFiniteNumber(record.price ?? record.last_price ?? record.ltp),
  };
}

export function normalizeTradeGuardianTradeList(payload: unknown) {
  return readArrayCandidate(payload)
    .map((trade) => normalizeTradeGuardianTrade(trade))
    .filter((trade): trade is TradeGuardianTrade => trade !== null);
}

export function normalizeTradeGuardianAlerts(payload: unknown) {
  return readArrayCandidate(payload)
    .map((alert) => normalizeTradeGuardianAlert(alert))
    .filter((alert): alert is TradeGuardianAlert => alert !== null);
}

function deriveSummaryCounts(trades: TradeGuardianTrade[], alerts: TradeGuardianAlert[]) {
  const pendingCount = trades.filter((trade) => trade.status === "pending").length;
  const activeCount = trades.filter((trade) => ["active", "t1_hit"].includes(trade.status)).length;
  const closedCount = trades.filter((trade) => ["t2_hit", "sl_hit", "closed_manual", "cancelled"].includes(trade.status)).length;
  const unresolvedAlerts = alerts.filter((alert) => !alert.acknowledged_at && !alert.resolved_at).length;
  const repeatingAlerts = alerts.filter((alert) => (alert.repeat_every_seconds ?? 0) > 0 && !alert.acknowledged_at && !alert.resolved_at).length;
  const criticalAlerts = alerts.filter((alert) => alert.alert_type === "stop_loss_hit" || alert.alert_type === "sl_hit").length;

  return {
    pendingCount,
    activeCount,
    closedCount,
    unresolvedAlerts,
    repeatingAlerts,
    criticalAlerts,
  };
}

export function normalizeTradeGuardianDashboard(payload: unknown, trades: TradeGuardianTrade[] = [], alerts: TradeGuardianAlert[] = []): TradeGuardianDashboardSummary {
  const record = asRecord(payload?.summary ?? payload?.dashboard ?? payload) ?? {};
  const derived = deriveSummaryCounts(trades, alerts);

  return {
    pending_count: asFiniteNumber(record.pending_count ?? record.pending_trades ?? record.pending) ?? derived.pendingCount,
    active_count: asFiniteNumber(record.active_count ?? record.active_trades ?? record.open_trades) ?? derived.activeCount,
    closed_count: asFiniteNumber(record.closed_count ?? record.closed_trades ?? record.completed_trades) ?? derived.closedCount,
    unacknowledged_alert_count: asFiniteNumber(record.unacknowledged_alert_count ?? record.active_alerts ?? record.unresolved_alerts) ?? derived.unresolvedAlerts,
    repeating_alert_count: asFiniteNumber(record.repeating_alert_count ?? record.repeating_alerts) ?? derived.repeatingAlerts,
    critical_alert_count: asFiniteNumber(record.critical_alert_count ?? record.stop_loss_alerts) ?? derived.criticalAlerts,
    last_monitor_run_at: asString(record.last_monitor_run_at ?? record.last_run_at ?? record.updated_at),
    monitor_status: normalizeToken(asString(record.monitor_status ?? record.status) || "ready"),
    telegram_enabled: typeof record.telegram_enabled === "boolean"
      ? record.telegram_enabled
      : typeof record.telegram_ready === "boolean"
        ? record.telegram_ready
        : null,
  };
}

export function normalizeTradeGuardianTradeDetail(payload: unknown): TradeGuardianTradeDetail {
  const record = asRecord(payload) ?? {};
  const trade = normalizeTradeGuardianTrade(record.trade ?? payload);
  const alerts = normalizeTradeGuardianAlerts(record.alerts ?? record.related_alerts ?? []);
  const timeline = readArrayCandidate(record.timeline ?? record.events)
    .map((event) => normalizeTradeGuardianTimelineEvent(event))
    .filter((event): event is TradeGuardianTimelineEvent => event !== null);

  return {
    trade,
    alerts,
    timeline,
  };
}

async function readJson(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function extractApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === "string") {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return fallback;
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }

  if (Array.isArray(record.detail)) {
    const detailParts = record.detail
      .map((item) => {
        const detailRecord = asRecord(item);
        if (!detailRecord) {
          return typeof item === "string" ? item : "";
        }

        const location = Array.isArray(detailRecord.loc)
          ? detailRecord.loc.filter((part): part is string => typeof part === "string").join(".")
          : "";
        const message = asString(detailRecord.msg || detailRecord.message);

        return location && message ? `${location}: ${message}` : message || location;
      })
      .filter(Boolean);

    if (detailParts.length > 0) {
      return detailParts.join(" | ");
    }
  }

  return fallback;
}

async function createApiError(response: Response, fallback: string) {
  try {
    const payload = await readJson(response);
    return new Error(extractApiErrorMessage(payload, fallback));
  } catch {
    try {
      const text = await response.text();
      return new Error(text || fallback);
    } catch {
      return new Error(fallback);
    }
  }
}

async function postJson(path: string, body?: unknown) {
  const response = await apiFetch(path, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw await createApiError(response, `Request failed (${response.status})`);
  }

  return readJson(response);
}

export async function fetchTradeGuardianSummary(signal?: AbortSignal) {
  const response = await apiFetch(TRADE_GUARDIAN_BASE, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ${TRADE_GUARDIAN_BASE} (${response.status})`);
  }

  return readJson(response);
}

export async function fetchTradeGuardianTrades(signal?: AbortSignal) {
  const response = await apiFetch(`${TRADE_GUARDIAN_BASE}/trades`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ${TRADE_GUARDIAN_BASE}/trades (${response.status})`);
  }

  return normalizeTradeGuardianTradeList(await readJson(response));
}

export async function fetchTradeGuardianTradeDetail(tradeId: string, signal?: AbortSignal) {
  const response = await apiFetch(`${TRADE_GUARDIAN_BASE}/trades/${tradeId}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ${TRADE_GUARDIAN_BASE}/trades/${tradeId} (${response.status})`);
  }

  return normalizeTradeGuardianTradeDetail(await readJson(response));
}

export async function createTradeGuardianTrade(input: CreateTradeGuardianTradeInput) {
  const payload = await postJson(`${TRADE_GUARDIAN_BASE}/trades`, input);
  return normalizeTradeGuardianTradeDetail(payload);
}

export async function closeTradeGuardianTrade(tradeId: string) {
  const payload = await postJson(`${TRADE_GUARDIAN_BASE}/trades/${tradeId}/close`, {});
  return payload ? normalizeTradeGuardianTradeDetail(payload) : null;
}

export async function fetchTradeGuardianAlerts(signal?: AbortSignal) {
  const response = await apiFetch(`${TRADE_GUARDIAN_BASE}/alerts`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ${TRADE_GUARDIAN_BASE}/alerts (${response.status})`);
  }

  return normalizeTradeGuardianAlerts(await readJson(response));
}

export async function acknowledgeTradeGuardianAlert(alertId: string) {
  const payload = await postJson(`${TRADE_GUARDIAN_BASE}/alerts/${alertId}/acknowledge`, {});
  return payload ? normalizeTradeGuardianAlert(payload) : null;
}

export async function triggerTradeGuardianMonitor() {
  return postJson(`${TRADE_GUARDIAN_BASE}/monitor`, {});
}

export async function sendTradeGuardianTestTelegram() {
  return postJson(`${TRADE_GUARDIAN_BASE}/test-telegram`, {});
}