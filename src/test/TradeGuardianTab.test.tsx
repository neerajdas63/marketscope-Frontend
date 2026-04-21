import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TradeGuardianTab } from "@/components/TradeGuardianTab";
import type { TradeGuardianTradeDetail } from "@/lib/tradeGuardianApi";

const tradeGuardianApiState = vi.hoisted(() => ({
  fetchTradeGuardianSummary: vi.fn(),
  fetchTradeGuardianTrades: vi.fn(),
  fetchTradeGuardianTradeDetail: vi.fn(),
  fetchTradeGuardianAlerts: vi.fn(),
  createTradeGuardianTrade: vi.fn(),
  closeTradeGuardianTrade: vi.fn(),
  acknowledgeTradeGuardianAlert: vi.fn(),
  triggerTradeGuardianMonitor: vi.fn(),
  sendTradeGuardianTestTelegram: vi.fn(),
}));

vi.mock("@/lib/tradeGuardianApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tradeGuardianApi")>(
    "@/lib/tradeGuardianApi",
  );

  return {
    ...actual,
    fetchTradeGuardianSummary: tradeGuardianApiState.fetchTradeGuardianSummary,
    fetchTradeGuardianTrades: tradeGuardianApiState.fetchTradeGuardianTrades,
    fetchTradeGuardianTradeDetail:
      tradeGuardianApiState.fetchTradeGuardianTradeDetail,
    fetchTradeGuardianAlerts: tradeGuardianApiState.fetchTradeGuardianAlerts,
    createTradeGuardianTrade: tradeGuardianApiState.createTradeGuardianTrade,
    closeTradeGuardianTrade: tradeGuardianApiState.closeTradeGuardianTrade,
    acknowledgeTradeGuardianAlert:
      tradeGuardianApiState.acknowledgeTradeGuardianAlert,
    triggerTradeGuardianMonitor:
      tradeGuardianApiState.triggerTradeGuardianMonitor,
    sendTradeGuardianTestTelegram:
      tradeGuardianApiState.sendTradeGuardianTestTelegram,
  };
});

function createDetail(): TradeGuardianTradeDetail {
  return {
    trade: {
      id: "trade-1",
      symbol: "RELIANCE",
      direction: "LONG",
      entry_price: 2850,
      stop_loss: 2810,
      target_1: 2900,
      target_2: 2940,
      quantity: 100,
      notes: "Opening range continuation",
      last_price: 2868,
      status: "active",
      latest_alert: "Entry triggered",
      created_at: "2026-03-23T09:17:00Z",
      updated_at: "2026-03-23T09:20:00Z",
      activated_at: "2026-03-23T09:18:00Z",
      closed_at: "",
    },
    alerts: [
      {
        id: "alert-1",
        trade_id: "trade-1",
        alert_type: "target_1_hit",
        message: "Target 1 reminder still active",
        status: "sent",
        repeat_every_seconds: 60,
        repeat_count: 2,
        first_triggered_at: "2026-03-23T09:30:00Z",
        last_sent_at: "2026-03-23T09:32:00Z",
        acknowledged_at: "",
        resolved_at: "",
        last_price: 2898,
        related_symbol: "RELIANCE",
        related_direction: "LONG",
        related_trade_status: "t1_hit",
      },
    ],
    timeline: [],
  };
}

describe("TradeGuardianTab", () => {
  beforeEach(() => {
    tradeGuardianApiState.fetchTradeGuardianSummary.mockReset();
    tradeGuardianApiState.fetchTradeGuardianTrades.mockReset();
    tradeGuardianApiState.fetchTradeGuardianTradeDetail.mockReset();
    tradeGuardianApiState.fetchTradeGuardianAlerts.mockReset();
    tradeGuardianApiState.createTradeGuardianTrade.mockReset();
    tradeGuardianApiState.closeTradeGuardianTrade.mockReset();
    tradeGuardianApiState.acknowledgeTradeGuardianAlert.mockReset();
    tradeGuardianApiState.triggerTradeGuardianMonitor.mockReset();
    tradeGuardianApiState.sendTradeGuardianTestTelegram.mockReset();

    tradeGuardianApiState.fetchTradeGuardianSummary.mockResolvedValue({
      pending_count: 1,
      active_count: 1,
      closed_count: 0,
      unacknowledged_alert_count: 1,
      repeating_alert_count: 1,
      critical_alert_count: 0,
      monitor_status: "ready",
      last_monitor_run_at: "2026-03-23T09:35:00Z",
    });
    tradeGuardianApiState.fetchTradeGuardianTrades.mockResolvedValue([
      {
        id: "trade-1",
        symbol: "RELIANCE",
        direction: "LONG",
        entry_price: 2850,
        stop_loss: 2810,
        target_1: 2900,
        target_2: 2940,
        quantity: 100,
        notes: "Opening range continuation",
        last_price: 2868,
        status: "active",
        latest_alert: "Entry triggered",
        created_at: "2026-03-23T09:17:00Z",
        updated_at: "2026-03-23T09:20:00Z",
        activated_at: "2026-03-23T09:18:00Z",
        closed_at: "",
      },
    ]);
    tradeGuardianApiState.fetchTradeGuardianAlerts.mockResolvedValue(
      createDetail().alerts,
    );
    tradeGuardianApiState.fetchTradeGuardianTradeDetail.mockResolvedValue(
      createDetail(),
    );
  });

  it("renders active trades, repeated alerts, and the add trade form", async () => {
    render(<TradeGuardianTab />);

    await waitFor(() => {
      expect(screen.getByText("Trade Guardian")).toBeInTheDocument();
      expect(screen.getByText("RELIANCE")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Alert Center/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Target 1 reminder still active"),
      ).toBeInTheDocument();
      expect(screen.getByText(/Repeating every 60s/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Add Trade/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Symbol")).toBeInTheDocument();
      expect(screen.getByLabelText("Stop Loss")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Trade" }),
      ).toBeInTheDocument();
    });
  });
});
