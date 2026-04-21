import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MomentumPulseTab } from "@/components/MomentumPulseTab";
import {
  createEmptyMomentumPulseResponse,
  type MomentumPulseQuery,
  type MomentumPulseResponse,
  type MomentumPulseRow,
} from "@/data/momentumPulseData";

const momentumPulseApiState = vi.hoisted(() => ({
  fetchMomentumPulseData: vi.fn(),
}));

vi.mock("@/lib/momentumPulseApi", () => ({
  fetchMomentumPulseData: momentumPulseApiState.fetchMomentumPulseData,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

function createRow(
  symbol: string,
  direction: MomentumPulseRow["direction"],
): MomentumPulseRow {
  return {
    symbol,
    ltp: direction === "LONG" ? 2845.4 : 3721.8,
    change_pct: direction === "LONG" ? 1.85 : -1.24,
    direction,
    direction_confidence: direction === "LONG" ? 82 : 77,
    momentum_pulse_score: direction === "LONG" ? 78.6 : 71.3,
    tier: direction === "LONG" ? "strong" : "moderate",
    rank: direction === "LONG" ? 1 : 2,
    volume_pace_score: 7.2,
    volume_pace_ratio: 1.8,
    range_expansion_score: 6.1,
    range_expansion_ratio: 1.5,
    relative_strength: direction === "LONG" ? 2.4 : -1.9,
    long_relative_strength_score: 7.8,
    short_relative_strength_score: 2.1,
    long_directional_consistency_score: 6.7,
    short_directional_consistency_score: 3.2,
    long_vwap_alignment_score: 8.1,
    short_vwap_alignment_score: 2.8,
    pulse_trend_strength: direction === "LONG" ? 5.6 : 4.8,
    today_cum_volume: 5_400_000,
    avg_20d_cum_volume_same_time: 3_200_000,
    intraday_range_abs: 68.2,
    intraday_range_pct: 2.4,
    avg_20d_range_same_time_abs: 42.7,
    avg_20d_range_pct_same_time: 1.6,
    score_history:
      direction === "LONG"
        ? [52, 56, 60, 66, 72, 78]
        : [74, 72, 69, 67, 64, 61],
    score_change_5m: direction === "LONG" ? 3.1 : -2.2,
    score_change_10m: direction === "LONG" ? 5.4 : -4.1,
    score_change_15m: direction === "LONG" ? 7.3 : -5.5,
    score_slope: direction === "LONG" ? 1.7 : -1.4,
    score_acceleration: direction === "LONG" ? 0.4 : -0.3,
    improving_streak: direction === "LONG" ? 4 : 0,
    weakening_streak: direction === "LONG" ? 0 : 3,
    pulse_trend_label: direction === "LONG" ? "Rising" : "Falling",
    vwap: direction === "LONG" ? 2832.4 : 3746.1,
    distance_from_vwap_pct: direction === "LONG" ? 0.46 : -0.65,
    behavior_state: direction === "LONG" ? "ACTIVE" : "LATE",
    score_time_bucket: direction === "LONG" ? "TREND" : "LATE",
    time_context_bucket: direction === "LONG" ? "TREND" : "LATE",
    is_extended: false,
    warning_flags: direction === "LONG" ? ["HIGH_BETA"] : ["NEAR_VWAP"],
    volume_surge: true,
    range_expansion: true,
    index_outperformer: direction === "LONG",
    trend_consistent: true,
    improving_now: direction === "LONG",
  };
}

function createResponse(query: MomentumPulseQuery): MomentumPulseResponse {
  const response = createEmptyMomentumPulseResponse(query);

  response.total = 2;
  response.last_updated = "2026-04-19 10:15 IST";
  response.benchmark_change_pct = 0.82;
  response.stocks = [createRow("RELIANCE", "LONG"), createRow("TCS", "SHORT")];

  return response;
}

describe("MomentumPulseTab", () => {
  beforeEach(() => {
    momentumPulseApiState.fetchMomentumPulseData.mockReset();
  });

  it("keeps the desktop table headers aligned with row cells and expanded details", async () => {
    const query: MomentumPulseQuery = {
      limit: 40,
      direction: "ALL",
      includeVeryWeak: false,
    };
    momentumPulseApiState.fetchMomentumPulseData.mockResolvedValue(
      createResponse(query),
    );

    render(<MomentumPulseTab />);

    await waitFor(() => {
      expect(screen.getByText("Momentum Pulse")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const headers = within(table).getAllByRole("columnheader");

    expect(headers).toHaveLength(15);
    expect(headers.map((header) => header.textContent)).toEqual(
      expect.arrayContaining(["5m Delta", "10m Trend"]),
    );

    fireEvent.click(within(table).getByText("RELIANCE"));

    const detailLabel = await screen.findByText("Volume Pace Score");
    expect(detailLabel.closest("td")).toHaveAttribute("colspan", "15");
  });
});
