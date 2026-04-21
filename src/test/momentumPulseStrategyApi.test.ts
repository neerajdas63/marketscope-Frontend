import { describe, expect, it } from "vitest";

import type { MomentumPulseStrategyQuery } from "@/data/momentumPulseStrategyData";
import { normalizeMomentumPulseStrategyResponse } from "@/lib/momentumPulseStrategyApi";

describe("normalizeMomentumPulseStrategyResponse", () => {
  it("normalizes the live strategy payload with enriched backend fields", () => {
    const query: MomentumPulseStrategyQuery = {
      limit: 40,
      direction: "ALL",
      grade: "ALL",
    };

    const response = normalizeMomentumPulseStrategyResponse(
      {
        feature: "Momentum Pulse Strategy",
        feature_key: "momentum_pulse_strategy",
        mode: "live",
        status: "ready",
        message: "Backend snapshot ready",
        last_updated: "2026-04-21 10:05 IST",
        market_data_last_updated: "2026-04-21 10:04 IST",
        benchmark_change_pct: 0.84,
        direction: "ALL",
        grade: "ALL",
        total: 2,
        total_candidates: 18,
        available_directions: ["ALL", "LONG", "SHORT"],
        available_grades: ["ALL", "A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"],
        summary: {
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
        },
        overall_summary: {
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
        },
        best_stocks: {
          overall_best: [
            {
              symbol: "RELIANCE",
              scan_time: "09:42",
              trade_side: "LONG",
              grade: "A_PLUS",
              entry_state: "ENTER_NOW",
              execution_rank: 2,
              price_at_scan: 2845.4,
              entry_price: 2845.45,
              stop_loss: 2835.85,
              target_1: 2862.65,
              target_2: 2875.55,
              major_risks: ["momentum_decay_watch"],
              reasons: ["Opening range breakout"],
            },
          ],
          best_longs: [],
          best_shorts: [],
          avoid_list: [],
        },
        rows: [
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
        ],
      },
      query,
    );

    expect(response.feature_key).toBe("momentum_pulse_strategy");
    expect(response.mode).toBe("live");
    expect(response.status).toBe("ready");
    expect(response.total_candidates).toBe(18);
    expect(response.summary.enter_now_count).toBe(1);
    expect(response.summary.avg_execution_rank).toBe(3.5);
    expect(response.overall_summary.avoid_count).toBe(11);
    expect(response.best_stocks.overall_best[0]?.symbol).toBe("RELIANCE");
    expect(response.best_stocks.overall_best[0]?.entry_state).toBe("ENTER_NOW");
    expect(response.rows[0]?.symbol).toBe("RELIANCE");
    expect(response.rows[0]?.trade_side).toBe("LONG");
    expect(response.rows[0]?.execution_rank).toBe(2);
    expect(response.rows[0]?.grade_stability_score).toBe(86.4);
    expect(response.rows[0]?.retest_ok).toBe(true);
    expect(response.rows[0]?.major_risks).toContain("momentum_decay_watch");
    expect(response.rows[0]?.warning_flags).toContain("low_volume_confirmation_watch");
    expect(response.available_grades).toContain("FAILED_OR_CHOP");
  });
});
