import { describe, expect, it } from "vitest";

import type { MomentumPulseStrategyReviewQuery } from "@/data/momentumPulseStrategyReviewData";
import { normalizeMomentumPulseStrategyReviewResponse } from "@/lib/momentumPulseStrategyReviewApi";

describe("normalizeMomentumPulseStrategyReviewResponse", () => {
  it("normalizes the review payload with ranked reasons and signal rows", () => {
    const query: MomentumPulseStrategyReviewQuery = {
      date: "2026-05-14",
      days: 1,
      limit: 200,
    };

    const response = normalizeMomentumPulseStrategyReviewResponse(
      {
        feature: "Momentum Pulse Strategy Review",
        feature_key: "momentum_pulse_strategy_review",
        mode: "review",
        status: "final",
        message: "Review ready",
        dates: ["2026-05-14"],
        total: 2,
        available_outcomes: ["WIN", "LOSS", "OPEN", "NO_DATA"],
        capture_status: {
          last_capture_time: "2026-05-14 12:01 IST",
          rows_seen: 24,
          signal_window_rows: 11,
          a_plus_a_seen: 3,
          a_plus_a_signal_window_seen: 2,
          recorded_count: 1,
          latest_signal_bar_time: "11:55",
          top_reasons_seen: [
            { label: "opening range breakout", count: 4 },
          ],
        },
        summary: {
          total_signals: 2,
          win_count: 1,
          loss_count: 1,
          open_count: 0,
          no_data_count: 0,
          win_rate_pct: 50,
          avg_execution_rank: 4.5,
          top_win_reasons: [
            { reason: "clean breakout continuation", count: 1 },
          ],
          top_loss_reasons: {
            reversal_fail: 1,
          },
        },
        rows: [
          {
            symbol: "RELIANCE",
            trade_date: "2026-05-14",
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
            symbol: "INFY",
            trade_date: "2026-05-14",
            signal_bar_time: "14:10",
            trade_side: "NO_TRADE",
            grade: "NO_TRADE",
            outcome: "NO_DATA",
          },
        ],
      },
      query,
    );

    expect(response.feature_key).toBe("momentum_pulse_strategy_review");
    expect(response.mode).toBe("review");
    expect(response.status).toBe("final");
    expect(response.summary.total_signals).toBe(2);
    expect(response.summary.win_rate_pct).toBe(50);
    expect(response.summary.top_win_reasons[0]).toEqual({
      label: "clean breakout continuation",
      count: 1,
    });
    expect(response.summary.top_loss_reasons[0]).toEqual({
      label: "reversal_fail",
      count: 1,
    });
    expect(response.capture_status.last_capture_time).toBe(
      "2026-05-14 12:01 IST",
    );
    expect(response.capture_status.rows_seen).toBe(24);
    expect(response.capture_status.a_plus_a_signal_window_seen).toBe(2);
    expect(response.capture_status.top_reasons_seen[0]).toEqual({
      label: "opening range breakout",
      count: 4,
    });
    expect(response.rows).toHaveLength(1);
    expect(response.rows[0]?.symbol).toBe("RELIANCE");
    expect(response.rows[0]?.outcome).toBe("WIN");
    expect(response.rows[0]?.win_loss_reason_codes).toContain("breakout_hold");
    expect(response.rows[0]?.major_risks).toContain("momentum_decay_watch");
    expect(response.available_outcomes).toContain("LOSS");
  });
});
