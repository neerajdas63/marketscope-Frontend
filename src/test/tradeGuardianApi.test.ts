import { describe, expect, it } from "vitest";

import {
  normalizeTradeGuardianAlerts,
  normalizeTradeGuardianDashboard,
  normalizeTradeGuardianTradeDetail,
  normalizeTradeGuardianTradeList,
} from "@/lib/tradeGuardianApi";

describe("tradeGuardianApi", () => {
  it("normalizes trade lists from an envelope payload", () => {
    const trades = normalizeTradeGuardianTradeList({
      trades: [
        {
          id: "trade-1",
          symbol: "RELIANCE",
          direction: "LONG",
          entry_price: 2850,
          stop_loss: 2810,
          target_1: 2900,
          target_2: 2940,
          quantity: 100,
          notes: "ORB continuation",
          last_price: 2868.5,
          status: "active",
          latest_alert: { message: "Entry triggered" },
          created_at: "2026-03-23T09:17:00Z",
        },
      ],
    });

    expect(trades).toHaveLength(1);
    expect(trades[0]?.symbol).toBe("RELIANCE");
    expect(trades[0]?.latest_alert).toBe("Entry triggered");
    expect(trades[0]?.status).toBe("active");
  });

  it("normalizes alerts from list and preserves repeating reminder metadata", () => {
    const alerts = normalizeTradeGuardianAlerts({
      alerts: [
        {
          id: "alert-1",
          trade_id: "trade-1",
          alert_type: "stop_loss_hit",
          message: "Stop loss breached for RELIANCE",
          status: "sent",
          repeat_every_seconds: 60,
          repeat_count: 3,
          last_price: 2808,
          related_symbol: "RELIANCE",
          related_direction: "LONG",
          related_trade_status: "sl_hit",
        },
      ],
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.alert_type).toBe("stop_loss_hit");
    expect(alerts[0]?.repeat_every_seconds).toBe(60);
    expect(alerts[0]?.related_trade_status).toBe("sl_hit");
  });

  it("normalizes trade detail timeline and related alerts", () => {
    const detail = normalizeTradeGuardianTradeDetail({
      trade: {
        id: "trade-1",
        symbol: "SBIN",
        direction: "SHORT",
        entry_price: 812,
        stop_loss: 818,
        target_1: 805,
        target_2: 798,
        status: "t1_hit",
      },
      alerts: [
        {
          id: "alert-2",
          trade_id: "trade-1",
          alert_type: "target_1_hit",
          message: "Target 1 printed",
          related_symbol: "SBIN",
          related_direction: "SHORT",
          related_trade_status: "t1_hit",
        },
      ],
      timeline: [
        {
          id: "event-1",
          event_type: "entry_hit",
          message: "Entry activated",
          created_at: "2026-03-23T09:35:00Z",
          price: 812,
        },
      ],
    });

    expect(detail.trade?.symbol).toBe("SBIN");
    expect(detail.alerts[0]?.alert_type).toBe("target_1_hit");
    expect(detail.timeline[0]?.event_type).toBe("entry_hit");
  });

  it("derives dashboard counts from trades and alerts when summary fields are missing", () => {
    const trades = normalizeTradeGuardianTradeList([
      {
        id: "trade-1",
        symbol: "RELIANCE",
        direction: "LONG",
        status: "pending",
      },
      { id: "trade-2", symbol: "SBIN", direction: "SHORT", status: "active" },
      {
        id: "trade-3",
        symbol: "TCS",
        direction: "LONG",
        status: "closed_manual",
      },
    ]);
    const alerts = normalizeTradeGuardianAlerts([
      {
        id: "alert-1",
        alert_type: "stop_loss_hit",
        message: "SL breached",
        repeat_every_seconds: 60,
      },
      {
        id: "alert-2",
        alert_type: "target_1_hit",
        message: "T1 hit",
        acknowledged_at: "2026-03-23T10:00:00Z",
      },
    ]);
    const summary = normalizeTradeGuardianDashboard({}, trades, alerts);

    expect(summary.pending_count).toBe(1);
    expect(summary.active_count).toBe(1);
    expect(summary.closed_count).toBe(1);
    expect(summary.unacknowledged_alert_count).toBe(1);
    expect(summary.repeating_alert_count).toBe(1);
    expect(summary.critical_alert_count).toBe(1);
  });
});
