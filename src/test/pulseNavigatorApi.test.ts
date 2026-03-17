import { describe, expect, it } from "vitest";

import { normalizePulseNavigatorResponse } from "@/lib/pulseNavigatorApi";

describe("normalizePulseNavigatorResponse", () => {
  it("normalizes a full pulse navigator payload", () => {
    const response = normalizePulseNavigatorResponse(
      {
        status: "ready",
        last_updated: "10:45 IST",
        benchmark_change_pct: 0.82,
        hero: {
          market_mode: { primary: "Risk On", secondary: "Broad participation" },
          best_long: { symbol: "RELIANCE", direction: "LONG", score: 88.4 },
          best_short: { symbol: "HDFCBANK", direction: "SHORT", score: 75.1 },
          best_fresh: { symbol: "SBIN", direction: "LONG", score: 71.9 },
          strongest_sector: { sector: "Banks", score: 83.2 },
        },
        tabs: {
          discover: {
            buckets: {
              curated_now: [
                {
                  symbol: "RELIANCE",
                  sector: "Energy",
                  direction: "LONG",
                  momentum_pulse_score: 88.4,
                  direction_confidence: 79,
                  actionability_label: "clean_setup",
                  reasons: ["Relative strength improving", "Trend aligned", "No extension warnings"],
                  ui_tags: ["VWAP", "F&O"],
                  relative_strength: 2.1,
                  pulse_trend_label: "Rising",
                  latest_bar_time: "10:45",
                  warning_flags: [],
                  score_change_10m: 5.8,
                },
              ],
            },
          },
          fresh: {
            stocks: [
              {
                symbol: "SBIN",
                sector: "Banks",
                direction: "LONG",
                momentum_pulse_score: 71.9,
                direction_confidence: 72,
                reasons: ["Fresh trend expansion"],
                ui_tags: ["Fresh"],
                relative_strength: 1.4,
                pulse_trend_label: "Rising",
                latest_bar_time: "10:45",
                warning_flags: ["Near resistance"],
                score_change_10m: 6.2,
              },
            ],
          },
          sectors: {
            sectors: [
              {
                sector: "Banks",
                leader: { symbol: "SBIN", direction: "LONG", momentum_pulse_score: 71.9 },
                challenger: { symbol: "ICICIBANK", direction: "LONG", momentum_pulse_score: 66.1 },
                laggard: { symbol: "AUBANK", direction: "SHORT", momentum_pulse_score: 41.5 },
              },
            ],
          },
        },
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
    );

    expect(response.status).toBe("ready");
    expect(response.benchmark.value).toBe("+0.82%");
    expect(response.hero.best_long?.primary).toBe("RELIANCE");
    expect(response.tabs.discover.buckets[0]?.stocks[0]?.actionability_label).toBe("clean_setup");
    expect(response.tabs.fresh.stocks[0]?.warning_count).toBe(1);
    expect(response.tabs.sectors.sectors[0]?.leader?.symbol).toBe("SBIN");
  });

  it("normalizes a tab-specific sectors payload", () => {
    const response = normalizePulseNavigatorResponse(
      {
        sectors: {
          Auto: {
            leader: { symbol: "M&M", direction: "LONG", momentum_pulse_score: 68.2 },
            challenger: { symbol: "TATAMOTORS", direction: "LONG", momentum_pulse_score: 62.4 },
            laggard: { symbol: "ASHOKLEY", direction: "SHORT", momentum_pulse_score: 37.5 },
          },
        },
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
      "sectors",
    );

    expect(response.tabs.sectors.sectors).toHaveLength(1);
    expect(response.tabs.sectors.sectors[0]?.sector).toBe("Auto");
    expect(response.tabs.sectors.sectors[0]?.leader?.symbol).toBe("M&M");
  });
});