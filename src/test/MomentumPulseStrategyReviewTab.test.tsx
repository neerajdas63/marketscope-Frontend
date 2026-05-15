import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MomentumPulseStrategyReviewTab } from "@/components/MomentumPulseStrategyReviewTab";
import {
  createEmptyMomentumPulseStrategyReviewResponse,
  type MomentumPulseStrategyReviewQuery,
  type MomentumPulseStrategyReviewResponse,
} from "@/data/momentumPulseStrategyReviewData";

const reviewApiState = vi.hoisted(() => ({
  fetchMomentumPulseStrategyReviewData: vi.fn(),
}));

vi.mock("@/lib/momentumPulseStrategyReviewApi", () => ({
  fetchMomentumPulseStrategyReviewData:
    reviewApiState.fetchMomentumPulseStrategyReviewData,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

function createReviewResponse(
  query: MomentumPulseStrategyReviewQuery,
): MomentumPulseStrategyReviewResponse {
  const response = createEmptyMomentumPulseStrategyReviewResponse(query);

  response.status = "final";
  response.message = "Review complete";
  response.dates = [query.date ?? "2026-05-14"];
  response.total = 2;
  response.available_outcomes = ["WIN", "LOSS", "OPEN", "NO_DATA"];
  response.summary = {
    total_signals: 2,
    win_count: 1,
    loss_count: 1,
    open_count: 0,
    no_data_count: 0,
    win_rate_pct: 50,
    avg_execution_rank: 4.5,
    top_win_reasons: [{ label: "clean breakout continuation", count: 1 }],
    top_loss_reasons: [{ label: "reversal fail", count: 1 }],
  };
  response.rows = [
    {
      symbol: "RELIANCE",
      trade_date: query.date ?? "2026-05-14",
      signal_bar_time: "09:40",
      trade_side: "LONG",
      grade: "A_PLUS",
      entry_state: "ENTER_NOW",
      outcome: "WIN",
      outcome_event: "TARGET_1_HIT",
      outcome_reason: "Breakout sustained with strong follow-through",
      win_loss_reason_codes: ["breakout_hold", "volume_confirmed"],
      entry_price: 2860.5,
      stop_loss: 2849.2,
      target_1: 2876.4,
      target_2: 2889.8,
      exit_price: 2877.3,
      exit_time: "10:22",
      max_favorable_pct: 1.12,
      max_adverse_pct: -0.28,
      close_pnl_pct: 0.59,
      execution_rank: 2,
      score: 15.6,
      momentum_pulse_score: 79.4,
      volume_ratio: 1.86,
      range_ratio: 1.32,
      vwap_distance_pct: 0.48,
      chase_risk: "LOW",
      retest_ok: true,
      major_risks: ["momentum_decay_watch"],
      reversal_flags: [],
      reasons: ["Opening range breakout"],
    },
    {
      symbol: "TCS",
      trade_date: query.date ?? "2026-05-14",
      signal_bar_time: "09:35",
      trade_side: "SHORT",
      grade: "A",
      entry_state: "ENTER_ON_RETEST",
      outcome: "LOSS",
      outcome_event: "STOP_LOSS_HIT",
      outcome_reason: "Reversal from VWAP invalidated the short",
      win_loss_reason_codes: ["reversal_fail"],
      entry_price: 3618.1,
      stop_loss: 3631.4,
      target_1: 3601.5,
      target_2: 3588.7,
      exit_price: 3632.2,
      exit_time: "10:05",
      max_favorable_pct: 0.42,
      max_adverse_pct: -0.84,
      close_pnl_pct: -0.39,
      execution_rank: 7,
      score: 10.2,
      momentum_pulse_score: 64.3,
      volume_ratio: 1.41,
      range_ratio: 1.18,
      vwap_distance_pct: -0.25,
      chase_risk: "MEDIUM",
      retest_ok: false,
      major_risks: ["retest_failure_risk"],
      reversal_flags: ["bearish_reversal_watch"],
      reasons: ["Opening range breakdown"],
    },
  ];

  return response;
}

describe("MomentumPulseStrategyReviewTab", () => {
  beforeEach(() => {
    reviewApiState.fetchMomentumPulseStrategyReviewData.mockReset();
  });

  it("renders the review screen, summary cards, and row details", async () => {
    reviewApiState.fetchMomentumPulseStrategyReviewData.mockImplementation(
      async (query: MomentumPulseStrategyReviewQuery) =>
        createReviewResponse(query),
    );

    render(<MomentumPulseStrategyReviewTab />);

    await waitFor(() => {
      expect(
        screen.getByText("Momentum Pulse Strategy Review"),
      ).toBeInTheDocument();
      expect(screen.getByText("Top Win Reasons")).toBeInTheDocument();
      expect(screen.getAllByText("RELIANCE").length).toBeGreaterThan(0);
    });

    expect(
      reviewApiState.fetchMomentumPulseStrategyReviewData,
    ).toHaveBeenCalledTimes(1);
    expect(
      reviewApiState.fetchMomentumPulseStrategyReviewData.mock.calls[0]?.[0],
    ).toMatchObject({
      days: 1,
      limit: 200,
    });

    fireEvent.click(screen.getAllByRole("button", { name: "View" })[0]!);

    await waitFor(() => {
      expect(screen.getByText("Outcome Reason")).toBeInTheDocument();
      expect(screen.getByText("Win/Loss Reason Codes")).toBeInTheDocument();
      expect(screen.getByText("Major Risks")).toBeInTheDocument();
      expect(screen.getByText("Original Signal Reasons")).toBeInTheDocument();
    });
  });

  it("refetches when days change or refresh is clicked and filters outcomes locally", async () => {
    reviewApiState.fetchMomentumPulseStrategyReviewData.mockImplementation(
      async (query: MomentumPulseStrategyReviewQuery) =>
        createReviewResponse(query),
    );

    render(<MomentumPulseStrategyReviewTab />);

    await waitFor(() => {
      expect(
        reviewApiState.fetchMomentumPulseStrategyReviewData,
      ).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText("Days"), {
      target: { value: "15" },
    });

    await waitFor(() => {
      expect(
        reviewApiState.fetchMomentumPulseStrategyReviewData,
      ).toHaveBeenCalledTimes(2);
    });

    expect(
      reviewApiState.fetchMomentumPulseStrategyReviewData.mock.calls[1]?.[0],
    ).toMatchObject({
      days: 15,
      limit: 300,
    });

    fireEvent.change(screen.getByLabelText("Outcome filter"), {
      target: { value: "LOSS" },
    });

    expect(screen.getAllByText("TCS").length).toBeGreaterThan(0);
    expect(screen.queryByText("RELIANCE")).not.toBeInTheDocument();
    expect(
      reviewApiState.fetchMomentumPulseStrategyReviewData,
    ).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(
        reviewApiState.fetchMomentumPulseStrategyReviewData,
      ).toHaveBeenCalledTimes(3);
    });
  });

  it("shows the deployment note for empty review payloads", async () => {
    reviewApiState.fetchMomentumPulseStrategyReviewData.mockImplementation(
      async (query: MomentumPulseStrategyReviewQuery) => {
        const response = createEmptyMomentumPulseStrategyReviewResponse(query);
        response.capture_status = {
          last_capture_time: "2026-05-15 11:58 IST",
          rows_seen: 18,
          signal_window_rows: 7,
          a_plus_a_seen: 1,
          a_plus_a_signal_window_seen: 0,
          recorded_count: 0,
          latest_signal_bar_time: "11:50",
          top_reasons_seen: [{ label: "setup incomplete tha", count: 3 }],
        };
        return response;
      },
    );

    render(<MomentumPulseStrategyReviewTab />);

    await waitFor(() => {
      expect(
        screen.getByText("No review signals available"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Signals are recorded from live Strategy usage after deployment.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-05-15 11:58 IST")).toBeInTheDocument();
    expect(screen.getByText("Rows Seen")).toBeInTheDocument();
    expect(screen.getByText("Rows In 09:35-12:00")).toBeInTheDocument();
    expect(screen.getByText("A/A+ Seen")).toBeInTheDocument();
    expect(screen.getByText("A/A+ In Signal Window")).toBeInTheDocument();
    expect(screen.getByText("Recorded Count")).toBeInTheDocument();
    expect(screen.getByText("Latest Signal Bar Time")).toBeInTheDocument();
    expect(screen.getByText("Top Reasons Seen")).toBeInTheDocument();
    expect(screen.getByText("setup incomplete tha")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No A/A+ Strategy setups were captured during 09:35-12:00 for this date. Keep backend running during the signal window.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render NO_TRADE afternoon rows as review trades", async () => {
    reviewApiState.fetchMomentumPulseStrategyReviewData.mockImplementation(
      async (query: MomentumPulseStrategyReviewQuery) => {
        const response = createEmptyMomentumPulseStrategyReviewResponse(query);
        response.total = 1;
        response.rows = [
          {
            symbol: "INFY",
            trade_date: query.date ?? "2026-05-15",
            signal_bar_time: "14:20",
            trade_side: "NO_TRADE",
            grade: "NO_TRADE",
            entry_state: "",
            outcome: "NO_DATA",
            outcome_event: "",
            outcome_reason: "",
            win_loss_reason_codes: [],
            entry_price: null,
            stop_loss: null,
            target_1: null,
            target_2: null,
            exit_price: null,
            exit_time: "",
            max_favorable_pct: null,
            max_adverse_pct: null,
            close_pnl_pct: null,
            execution_rank: null,
            score: null,
            momentum_pulse_score: null,
            volume_ratio: null,
            range_ratio: null,
            vwap_distance_pct: null,
            chase_risk: "",
            retest_ok: null,
            major_risks: [],
            reversal_flags: [],
            reasons: [],
          },
        ];
        return response;
      },
    );

    render(<MomentumPulseStrategyReviewTab />);

    await waitFor(() => {
      expect(
        screen.getByText("No review signals available"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("INFY")).not.toBeInTheDocument();
  });
});
