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

function createResponse(query: MomentumPulseStrategyQuery): MomentumPulseStrategyResponse {
  const response = createEmptyMomentumPulseStrategyResponse(query);

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
    },
  ];

  return response;
}

describe("MomentumPulseStrategyTab", () => {
  beforeEach(() => {
    strategyApiState.fetchMomentumPulseStrategyData.mockReset();
  });

  it("renders the backend-driven strategy screen and expands trade plan details", async () => {
    const query: MomentumPulseStrategyQuery = {
      limit: 40,
      direction: "ALL",
      grade: "ALL",
      includeVeryWeak: true,
    };

    strategyApiState.fetchMomentumPulseStrategyData.mockResolvedValue(createResponse(query));

    render(<MomentumPulseStrategyTab />);

    await waitFor(() => {
      expect(screen.getByText("Momentum Pulse Strategy")).toBeInTheDocument();
      expect(screen.getByText("RELIANCE")).toBeInTheDocument();
    });

    expect(screen.getAllByText("A+").length).toBeGreaterThan(0);
    expect(screen.getByText("Candidates")).toBeInTheDocument();

    fireEvent.click(screen.getByText("RELIANCE"));

    await waitFor(() => {
      expect(screen.getByText("Trade Plan")).toBeInTheDocument();
      expect(screen.getByText("Entry Notes")).toBeInTheDocument();
      expect(screen.getAllByText("Opening range breakout").length).toBeGreaterThan(0);
    });
  });
});
