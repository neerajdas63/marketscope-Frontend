import { describe, expect, it } from "vitest";

import { normalizeMomentumPulseStrategyResponse } from "@/lib/momentumPulseStrategyApi";
import type { MomentumPulseStrategyQuery } from "@/data/momentumPulseStrategyData";

describe("normalizeMomentumPulseStrategyResponse", () => {
  it("normalizes the strategy payload and preserves backend trade plan fields", () => {
    const query: MomentumPulseStrategyQuery = {
      limit: 40,
      direction: "ALL",
      grade: "ALL",
      includeVeryWeak: true,
    };

    const response = normalizeMomentumPulseStrategyResponse(
      {
        feature: "Momentum Pulse Strategy",
        feature_key: "momentum_pulse_strategy",
        mode: "historical",
        requested_date: "2026-04-17",
        status: "ready",
        message: "Backend snapshot ready",
        last_updated: "2026-04-19 10:05 IST",
        market_data_last_updated: "2026-04-19 10:04 IST",
        benchmark_change_pct: 0.84,
        direction: "ALL",
        grade: "ALL",
        total: 1,
        total_candidates: 12,
        available_directions: ["ALL", "LONG", "SHORT"],
        available_grades: ["ALL", "A_PLUS", "A", "FAILED_OR_CHOP", "NO_TRADE"],
        summary: {
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
        },
        overall_summary: {
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
        },
        rows: [
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
            historical_outcome: "TARGET_1_HIT",
            historical_exit_time: "10:22",
            historical_exit_price: 2860.15,
            historical_pnl_pct: 0.98,
            historical_rr_realized: 1.21,
            historical_outcome_reason: "Booked after first expansion and lost follow-through into lunch.",
          },
        ],
        performance_summary: {
          trades: 8,
          wins: 5,
          losses: 3,
          win_rate: 62.5,
          target_1_hits: 4,
          target_2_hits: 2,
          stop_loss_hits: 2,
          avg_pnl_pct: 1.84,
          avg_rr: 1.63,
        },
        overall_performance_summary: {
          trades: 24,
          wins: 14,
          losses: 10,
          win_rate: 58.33,
          target_1_hits: 12,
          target_2_hits: 5,
          stop_loss_hits: 6,
          avg_pnl_pct: 1.27,
          avg_rr: 1.41,
        },
      },
      query,
    );

    expect(response.feature_key).toBe("momentum_pulse_strategy");
    expect(response.mode).toBe("historical");
    expect(response.requested_date).toBe("2026-04-17");
    expect(response.status).toBe("ready");
    expect(response.total_candidates).toBe(12);
    expect(response.summary.a_plus_count).toBe(1);
    expect(response.overall_summary.long_count).toBe(7);
    expect(response.performance_summary?.wins).toBe(5);
    expect(response.overall_performance_summary?.trades).toBe(24);
    expect(response.rows[0]?.symbol).toBe("RELIANCE");
    expect(response.rows[0]?.trade_side).toBe("LONG");
    expect(response.rows[0]?.grade).toBe("A_PLUS");
    expect(response.rows[0]?.entry_price).toBe(2845.45);
    expect(response.rows[0]?.historical_outcome).toBe("TARGET_1_HIT");
    expect(response.rows[0]?.historical_pnl_pct).toBe(0.98);
    expect(response.rows[0]?.reasons).toContain("Opening range breakout");
    expect(response.available_grades).toContain("FAILED_OR_CHOP");
  });
});
