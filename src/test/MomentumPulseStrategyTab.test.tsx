import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MomentumPulseStrategyTab } from "@/components/MomentumPulseStrategyTab";
import {
  createEmptyMomentumPulseStrategyResponse,
  type MomentumPulseStrategyPerformanceSummary,
  type MomentumPulseStrategyQuery,
  type MomentumPulseStrategyResponse,
} from "@/data/momentumPulseStrategyData";

const strategyApiState = vi.hoisted(() => ({
  fetchMomentumPulseStrategyData: vi.fn(),
}));

vi.mock("@/lib/momentumPulseStrategyApi", () => ({
  fetchMomentumPulseStrategyData: strategyApiState.fetchMomentumPulseStrategyData,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

const PERFORMANCE_SUMMARY: MomentumPulseStrategyPerformanceSummary = {
  trades: 8,
  wins: 5,
  losses: 3,
  win_rate: 62.5,
  target_1_hits: 4,
  target_2_hits: 2,
  stop_loss_hits: 2,
  avg_pnl_pct: 1.84,
  avg_rr: 1.63,
};

function createLiveResponse(query: MomentumPulseStrategyQuery): MomentumPulseStrategyResponse {
  const response = createEmptyMomentumPulseStrategyResponse(query);

  response.mode = "live";
  response.status = "ready";
  response.last_updated = "2026-04-19 10:05 IST";
  response.market_data_last_updated = "2026-04-19 10:04 IST";
  response.benchmark_change_pct = 0.84;
  response.total = 1;
  response.total_candidates = 12;
  response.summary = {
    total: 1,
    a_plus_count: 1,
    a_count: 0,
    failed_or_chop_count: 0,
    no_trade_count: 0,
    long_count: 1,
    short_count: 0,
    avg_volume_ratio: 1.82,
    avg_range_ratio: 1.31,
    avg_abs_change_pct: 1.64,
    a_plus_common: {
      avg_score: 15.8,
      avg_vwap_dist: 0.46,
      avg_volume_ratio: 1.82,
      avg_range_ratio: 1.31,
    },
    a_common: {
      avg_score: 0,
      avg_vwap_dist: 0,
      avg_volume_ratio: 0,
      avg_range_ratio: 0,
    },
  };
  response.overall_summary = {
    total: 12,
    a_plus_count: 2,
    a_count: 3,
    failed_or_chop_count: 4,
    no_trade_count: 3,
    long_count: 7,
    short_count: 5,
    avg_volume_ratio: 1.11,
    avg_range_ratio: 1.06,
    avg_abs_change_pct: 1.92,
    a_plus_common: {
      avg_score: 14.7,
      avg_vwap_dist: 0.42,
      avg_volume_ratio: 1.66,
      avg_range_ratio: 1.27,
    },
    a_common: {
      avg_score: 10.8,
      avg_vwap_dist: 0.31,
      avg_volume_ratio: 1.14,
      avg_range_ratio: 1.08,
    },
  };
  response.rows = [
    {
      symbol: "RELIANCE",
      trade_date: "2026-04-19",
      scan_time: "09:42",
      trade_side: "LONG",
      grade: "A_PLUS",
      eligible_time_window: true,
      score: 15.8,
      price_at_scan: 2845.4,
      prev_close: 2798.2,
      vwap: 2832.3,
      or_high: 2840.1,
      or_low: 2818.6,
      vwap_distance_pct: 0.46,
      volume_ratio: 1.82,
      range_ratio: 1.31,
      entry_price: 2845.45,
      stop_loss: 2835.85,
      target_1: 2862.65,
      target_2: 2875.55,
      rr_t1: 1.79,
      rr_t2: 3.13,
      reasons: ["Opening range breakout", "Price VWAP ke upar sustain"],
      entry_notes: ["Direct entry: breakout candle close above OR high"],
      stop_notes: ["Primary stop: OR high retest zone ke neeche"],
      exit_notes: ["Partial after first sharp expansion"],
      historical_outcome: "",
      historical_exit_time: "",
      historical_exit_price: null,
      historical_pnl_pct: null,
      historical_rr_realized: null,
      historical_outcome_reason: "",
    },
  ];

  return response;
}

function createHistoricalResponse(query: MomentumPulseStrategyQuery, date: string): MomentumPulseStrategyResponse {
  const response = createLiveResponse({ ...query, date });

  response.mode = "historical";
  response.requested_date = date;
  response.performance_summary = PERFORMANCE_SUMMARY;
  response.overall_performance_summary = {
    ...PERFORMANCE_SUMMARY,
    trades: 24,
    wins: 14,
    losses: 10,
  };
  response.rows = [
    {
      ...response.rows[0],
      trade_date: date,
      historical_outcome: "TARGET_1_HIT",
      historical_exit_time: "10:22",
      historical_exit_price: 2860.15,
      historical_pnl_pct: 0.98,
      historical_rr_realized: 1.21,
      historical_outcome_reason: "Booked after first expansion and lost follow-through into lunch.",
    },
  ];

  return response;
}

function renderStrategy(initialEntry = "/?tab=momentum-pulse-strategy") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MomentumPulseStrategyTab />
    </MemoryRouter>,
  );
}

describe("MomentumPulseStrategyTab", () => {
  beforeEach(() => {
    strategyApiState.fetchMomentumPulseStrategyData.mockReset();
  });

  it("renders the live strategy screen and expands trade plan details", async () => {
    strategyApiState.fetchMomentumPulseStrategyData.mockImplementation(async (query: MomentumPulseStrategyQuery) => createLiveResponse(query));

    renderStrategy();

    await waitFor(() => {
      expect(screen.getByText("Momentum Pulse Strategy")).toBeInTheDocument();
      expect(screen.getByText("RELIANCE")).toBeInTheDocument();
    });

    expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(1);
    expect(strategyApiState.fetchMomentumPulseStrategyData.mock.calls[0]?.[0]).toMatchObject({
      limit: 40,
      direction: "ALL",
      grade: "ALL",
      includeVeryWeak: true,
    });

    fireEvent.click(screen.getByText("RELIANCE"));

    await waitFor(() => {
      expect(screen.getByText("Trade Plan")).toBeInTheDocument();
      expect(screen.getByText("Entry Notes")).toBeInTheDocument();
      expect(screen.getAllByText("Opening range breakout").length).toBeGreaterThan(0);
    });
  });

  it("keeps historical mode manual and only loads replay after clicking Load History", async () => {
    strategyApiState.fetchMomentumPulseStrategyData.mockImplementation(async (query: MomentumPulseStrategyQuery) => (
      query.date ? createHistoricalResponse(query, query.date) : createLiveResponse(query)
    ));

    renderStrategy();

    await waitFor(() => {
      expect(screen.getByText("RELIANCE")).toBeInTheDocument();
    });

    expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Historical" }));
    fireEvent.change(screen.getByDisplayValue(""), { target: { value: "2026-04-17" } });

    await waitFor(() => {
      expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Load History" }));

    await waitFor(() => {
      expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Replay Performance")).toBeInTheDocument();
      expect(screen.getByText("Historical: 2026-04-17")).toBeInTheDocument();
    });

    expect(strategyApiState.fetchMomentumPulseStrategyData.mock.calls[1]?.[0]).toMatchObject({
      date: "2026-04-17",
      limit: 40,
      direction: "ALL",
      grade: "ALL",
      includeVeryWeak: true,
    });
  });

  it("initializes historical mode from the URL date param and fetches once", async () => {
    strategyApiState.fetchMomentumPulseStrategyData.mockImplementation(async (query: MomentumPulseStrategyQuery) => createHistoricalResponse(query, query.date ?? "2026-04-17"));

    renderStrategy("/?tab=momentum-pulse-strategy&mode=historical&date=2026-04-17");

    await waitFor(() => {
      expect(screen.getByText("Historical: 2026-04-17")).toBeInTheDocument();
      expect(screen.getByText("Replay Performance")).toBeInTheDocument();
      expect(screen.getAllByText("Trades").length).toBeGreaterThan(0);
    });

    expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(1);
    expect(strategyApiState.fetchMomentumPulseStrategyData.mock.calls[0]?.[0]).toMatchObject({
      date: "2026-04-17",
      limit: 40,
      direction: "ALL",
      grade: "ALL",
      includeVeryWeak: true,
    });
  });
});
