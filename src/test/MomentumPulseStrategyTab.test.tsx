import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MomentumPulseStrategyTab } from "@/components/MomentumPulseStrategyTab";
import {
  createEmptyMomentumPulseStrategyResponse,
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

function createLiveResponse(query: MomentumPulseStrategyQuery): MomentumPulseStrategyResponse {
  const response = createEmptyMomentumPulseStrategyResponse(query);

  response.mode = "live";
  response.status = "ready";
  response.message = "Live strategy feed ready";
  response.last_updated = "2026-04-21 10:05 IST";
  response.market_data_last_updated = "2026-04-21 10:04 IST";
  response.benchmark_change_pct = 0.84;
  response.total = 2;
  response.total_candidates = 18;
  response.summary = {
    total: 2,
    a_plus_count: 1,
    a_count: 1,
    failed_or_chop_count: 0,
    no_trade_count: 0,
    long_count: 1,
    short_count: 1,
    enter_now_count: 1,
    enter_on_retest_count: 1,
    avoid_count: 0,
    avg_volume_ratio: 1.73,
    avg_range_ratio: 1.29,
    avg_execution_rank: 3.5,
    avg_abs_change_pct: 1.94,
    a_plus_common: {
      avg_score: 15.8,
      avg_vwap_dist: 0.46,
      avg_volume_ratio: 1.82,
      avg_range_ratio: 1.31,
    },
    a_common: {
      avg_score: 10.4,
      avg_vwap_dist: -0.32,
      avg_volume_ratio: 1.64,
      avg_range_ratio: 1.27,
    },
  };
  response.overall_summary = {
    total: 18,
    a_plus_count: 2,
    a_count: 4,
    failed_or_chop_count: 6,
    no_trade_count: 6,
    long_count: 10,
    short_count: 8,
    enter_now_count: 3,
    enter_on_retest_count: 4,
    avoid_count: 11,
    avg_volume_ratio: 1.18,
    avg_range_ratio: 1.07,
    avg_execution_rank: 8.4,
    avg_abs_change_pct: 2.11,
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
      trade_date: "2026-04-21",
      scan_time: "09:42",
      trade_side: "LONG",
      grade: "A_PLUS",
      entry_state: "ENTER_NOW",
      execution_rank: 2,
      eligible_time_window: true,
      score: 15.8,
      momentum_pulse_score: 78.2,
      grade_stability_score: 86.4,
      chase_risk: "LOW",
      retest_ok: true,
      price_at_scan: 2845.4,
      prev_close: 2798.2,
      vwap: 2832.3,
      or_high: 2840.1,
      or_low: 2818.6,
      or_stretch_pct: 0.38,
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
      major_risks: ["momentum_decay_watch"],
      grade_history: ["A", "A_PLUS"],
      warning_flags: ["low_volume_confirmation_watch"],
      entry_notes: ["Direct entry: breakout candle close above OR high"],
      stop_notes: ["Primary stop: OR high retest zone ke neeche"],
      exit_notes: ["Partial after first sharp expansion"],
    },
    {
      symbol: "TCS",
      trade_date: "2026-04-21",
      scan_time: "09:45",
      trade_side: "SHORT",
      grade: "A",
      entry_state: "ENTER_ON_RETEST",
      execution_rank: 5,
      eligible_time_window: true,
      score: 10.4,
      momentum_pulse_score: 63.1,
      grade_stability_score: 71.2,
      chase_risk: "MEDIUM",
      retest_ok: false,
      price_at_scan: 3642.7,
      prev_close: 3678.9,
      vwap: 3651.2,
      or_high: 3663.8,
      or_low: 3644.4,
      or_stretch_pct: -0.27,
      vwap_distance_pct: -0.32,
      volume_ratio: 1.64,
      range_ratio: 1.27,
      entry_price: 3641.9,
      stop_loss: 3654.2,
      target_1: 3625.5,
      target_2: 3613.1,
      rr_t1: 1.33,
      rr_t2: 2.34,
      reasons: ["Opening range breakdown", "Selling pressure broad tha"],
      major_risks: ["retest_failure_risk"],
      grade_history: ["FAILED_OR_CHOP", "A"],
      warning_flags: ["one_bar_spike"],
      entry_notes: ["Enter on clean retest reject"],
      stop_notes: ["VWAP reclaim invalidates"],
      exit_notes: ["Trail after first flush"],
    },
  ];
  response.best_stocks = {
    overall_best: [response.rows[0]],
    best_longs: [response.rows[0]],
    best_shorts: [response.rows[1]],
    avoid_list: [
      {
        ...response.rows[1],
        symbol: "INFY",
        grade: "NO_TRADE",
        entry_state: "AVOID_CHASE",
        execution_rank: 14,
        chase_risk: "HIGH",
        reasons: ["Extended from VWAP"],
        major_risks: ["extended", "one_bar_spike"],
      },
    ],
  };

  return response;
}

describe("MomentumPulseStrategyTab", () => {
  beforeEach(() => {
    strategyApiState.fetchMomentumPulseStrategyData.mockReset();
  });

  it("renders the live strategy screen with best stock buckets and expandable details", async () => {
    strategyApiState.fetchMomentumPulseStrategyData.mockImplementation(async (query: MomentumPulseStrategyQuery) => createLiveResponse(query));

    render(<MomentumPulseStrategyTab />);

    await waitFor(() => {
      expect(screen.getByText("Momentum Pulse Strategy")).toBeInTheDocument();
      expect(screen.getAllByText("RELIANCE").length).toBeGreaterThan(0);
    });

    expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(1);
    expect(strategyApiState.fetchMomentumPulseStrategyData.mock.calls[0]?.[0]).toMatchObject({
      limit: 40,
      direction: "ALL",
      grade: "ALL",
    });

    expect(screen.queryByRole("button", { name: "Historical" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load History" })).not.toBeInTheDocument();
    expect(screen.getByText("Overall Best")).toBeInTheDocument();
    expect(screen.getByText("Best Longs")).toBeInTheDocument();
    expect(screen.getByText("Avoid List")).toBeInTheDocument();
    expect(screen.getAllByText("Enter Now").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Avg Execution Rank").length).toBeGreaterThan(0);

    const relianceTargets = screen.getAllByText("RELIANCE");
    fireEvent.click(relianceTargets[relianceTargets.length - 1] as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText("Signal Snapshot")).toBeInTheDocument();
      expect(screen.getByText("Major Risks")).toBeInTheDocument();
      expect(screen.getByText("Grade History")).toBeInTheDocument();
      expect(screen.getByText("Warning Flags")).toBeInTheDocument();
    });
  });

  it("refetches with updated live filters and refresh button", async () => {
    strategyApiState.fetchMomentumPulseStrategyData.mockImplementation(async (query: MomentumPulseStrategyQuery) => createLiveResponse(query));

    render(<MomentumPulseStrategyTab />);

    await waitFor(() => {
      expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByDisplayValue("Direction: ALL"), { target: { value: "LONG" } });

    await waitFor(() => {
      expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(2);
    });

    expect(strategyApiState.fetchMomentumPulseStrategyData.mock.calls[1]?.[0]).toMatchObject({
      limit: 40,
      direction: "LONG",
      grade: "ALL",
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(strategyApiState.fetchMomentumPulseStrategyData).toHaveBeenCalledTimes(3);
    });
  });

  it("shows a passive message when backend does not return a live payload", async () => {
    strategyApiState.fetchMomentumPulseStrategyData.mockImplementation(async (query: MomentumPulseStrategyQuery) => {
      const response = createLiveResponse(query);
      response.mode = "historical";
      response.status = "disabled";
      return response;
    });

    render(<MomentumPulseStrategyTab />);

    await waitFor(() => {
      expect(screen.getByText("Live strategy view is unavailable right now")).toBeInTheDocument();
    });

    expect(screen.queryByText("Overall Best")).not.toBeInTheDocument();
  });
});
