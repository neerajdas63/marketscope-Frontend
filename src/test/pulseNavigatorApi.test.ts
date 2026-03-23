import { describe, expect, it } from "vitest";

import { createEmptyPulseNavigatorResponse, mergePulseNavigatorResponse } from "@/data/pulseNavigatorData";
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
          leader_long: { symbol: "RELIANCE", direction: "LONG", score: 88.4 },
          leader_short: { symbol: "HDFCBANK", direction: "SHORT", score: 75.1 },
          fresh_long: { symbol: "SBIN", direction: "LONG", score: 71.9 },
          fresh_short: { symbol: "AXISBANK", direction: "SHORT", score: 68.2 },
          strongest_sector: { sector: "Banks", score: 83.2 },
          leaders_overview: { primary: "Leadership is broadening", secondary: "Longs still lead, but shorts remain actionable." },
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
                  session_leader_score: 91.6,
                  direction_confidence: 79,
                  actionability_label: "clean_setup",
                  leader_reason: "Held leadership from the open and stayed above VWAP.",
                  reasons: ["Relative strength improving", "Trend aligned", "No extension warnings"],
                  ui_tags: ["VWAP", "F&O"],
                  change_pct: 2.9,
                  distance_from_vwap_pct: 1.1,
                  relative_strength: 2.1,
                  pulse_trend_label: "Rising",
                  latest_bar_time: "10:45",
                  warning_flags: [],
                  score_change_10m: 5.8,
                },
              ],
            },
          },
          leaders: {
            longs: [
              {
                symbol: "RELIANCE",
                sector: "Energy",
                direction: "LONG",
                momentum_pulse_score: 88.4,
                session_leader_score: 91.6,
                leader_reason: "Held leadership from the open and stayed above VWAP.",
                change_pct: 2.9,
                distance_from_vwap_pct: 1.1,
                pulse_trend_label: "Rising",
              },
            ],
            shorts: [
              {
                symbol: "HDFCBANK",
                sector: "Banks",
                direction: "SHORT",
                momentum_pulse_score: 75.1,
                session_leader_score: 78.4,
                leader_reason: "Persistent intraday weakness with failed VWAP reclaim.",
                change_pct: -1.9,
                distance_from_vwap_pct: -0.8,
                pulse_trend_label: "Falling",
              },
            ],
          },
          fresh: {
            longs: [
              {
                symbol: "SBIN",
                sector: "Banks",
                direction: "LONG",
                momentum_pulse_score: 71.9,
                direction_confidence: 72,
                reasons: ["Fresh trend expansion"],
                ui_tags: ["Fresh"],
                change_pct: 1.8,
                relative_strength: 1.4,
                pulse_trend_label: "Rising",
                pulse_trend_strength: 6.8,
                latest_bar_time: "10:45",
                warning_flags: ["Near resistance"],
                score_change_10m: 6.2,
              },
            ],
            shorts: [
              {
                symbol: "AXISBANK",
                sector: "Banks",
                direction: "SHORT",
                momentum_pulse_score: 68.2,
                reasons: ["Fresh downside extension"],
                change_pct: -1.2,
                pulse_trend_label: "Falling",
                pulse_trend_strength: 5.4,
                score_change_10m: 4.7,
              },
            ],
          },
          sectors: {
            sectors: [
              {
                sector: "Banks",
                sector_direction: "LONG",
                sector_score: 83.2,
                market_relative_score: 4.6,
                average_change_pct: 1.4,
                candidate_count: 7,
                best_stock: {
                  symbol: "SBIN",
                  sector: "Banks",
                  direction: "LONG",
                  momentum_pulse_score: 71.9,
                  direction_confidence: 72,
                  actionability_label: "clean_setup",
                  reasons: ["Aligned with sector trend", "Persistent relative strength"],
                  change_pct: 1.8,
                  relative_strength: 1.4,
                  pulse_trend_label: "Rising",
                  pulse_trend_strength: 6.8,
                },
                leader: { symbol: "SBIN", direction: "LONG", momentum_pulse_score: 71.9 },
                challenger: { symbol: "ICICIBANK", direction: "LONG", momentum_pulse_score: 66.1 },
                laggard: { symbol: "AUBANK", direction: "SHORT", momentum_pulse_score: 41.5 },
                top_stocks: [
                  { symbol: "SBIN", direction: "LONG", momentum_pulse_score: 71.9 },
                  { symbol: "ICICIBANK", direction: "LONG", momentum_pulse_score: 66.1 },
                  { symbol: "BANKBARODA", direction: "LONG", momentum_pulse_score: 61.4 },
                ],
              },
            ],
          },
        },
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
    );

    expect(response.status).toBe("ready");
    expect(response.benchmark.value).toBe("+0.82%");
    expect(response.hero.leader_long?.primary).toBe("RELIANCE");
    expect(response.hero.fresh_short?.primary).toBe("AXISBANK");
    expect(response.hero.leaders_overview?.primary).toBe("Leadership is broadening");
    expect(response.tabs.discover.buckets[0]?.stocks[0]?.actionability_label).toBe("clean_setup");
    expect(response.tabs.leaders.longs[0]?.leader_reason).toContain("above VWAP");
    expect(response.tabs.fresh.longs[0]?.warning_count).toBe(1);
    expect(response.tabs.fresh.shorts[0]?.symbol).toBe("AXISBANK");
    expect(response.tabs.sectors.sectors[0]?.best_stock?.symbol).toBe("SBIN");
    expect(response.tabs.sectors.sectors[0]?.sector_direction).toBe("LONG");
    expect(response.tabs.sectors.sectors[0]?.candidate_count).toBe(7);
    expect(response.tabs.sectors.sectors[0]?.top_stocks).toHaveLength(3);
  });

  it("falls back to the legacy hero and fresh payload shape when new fields are missing", () => {
    const response = normalizePulseNavigatorResponse(
      {
        status: "ready",
        hero: {
          best_long: { symbol: "TCS", direction: "LONG", score: 64.5 },
          best_short: { symbol: "INFY", direction: "SHORT", score: 61.3 },
          best_fresh: { symbol: "SBIN", direction: "LONG", score: 58.4 },
        },
        tabs: {
          discover: {
            buckets: {
              curated_now: [
                { symbol: "TCS", direction: "LONG", momentum_pulse_score: 64.5 },
                { symbol: "INFY", direction: "SHORT", momentum_pulse_score: 61.3 },
              ],
            },
          },
          fresh: {
            stocks: [
              { symbol: "SBIN", direction: "LONG", momentum_pulse_score: 58.4, score_change_10m: 4.2 },
              { symbol: "AXISBANK", direction: "SHORT", momentum_pulse_score: 55.1, score_change_10m: 3.8 },
            ],
          },
        },
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
    );

    expect(response.hero.leader_long?.primary).toBe("TCS");
    expect(response.hero.leader_short?.primary).toBe("INFY");
    expect(response.hero.fresh_long?.primary).toBe("SBIN");
    expect(response.hero.fresh_short).toBeNull();
    expect(response.tabs.leaders.longs[0]?.symbol).toBe("TCS");
    expect(response.tabs.leaders.shorts[0]?.symbol).toBe("INFY");
    expect(response.tabs.fresh.longs[0]?.symbol).toBe("SBIN");
    expect(response.tabs.fresh.shorts[0]?.symbol).toBe("AXISBANK");
  });

  it("normalizes a tab-specific sectors payload", () => {
    const response = normalizePulseNavigatorResponse(
      {
        tab: "sectors",
        title: "Top Sector Opportunities",
        sectors: [
          {
            sector: "Auto",
            best_stock: { symbol: "M&M", direction: "LONG", momentum_pulse_score: 68.2 },
            top_stocks: [
              { symbol: "M&M", direction: "LONG", momentum_pulse_score: 68.2 },
              { symbol: "TATAMOTORS", direction: "LONG", momentum_pulse_score: 62.4 },
            ],
          },
        ],
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
      "sectors",
    );

    expect(response.tabs.sectors.sectors).toHaveLength(1);
    expect(response.tabs.sectors.sectors[0]?.sector).toBe("Auto");
    expect(response.tabs.sectors.sectors[0]?.best_stock?.symbol).toBe("M&M");
    expect(response.tabs.sectors.sectors[0]?.sector_direction).toBe("LONG");
    expect(response.tabs.sectors.sectors[0]?.sector_score).toBe(68.2);
    expect(response.tabs.sectors.sectors[0]?.top_stocks.map((stock) => stock.symbol)).toEqual(["M&M", "TATAMOTORS"]);
  });

  it("normalizes sectors from a full response root path when tabs.sectors is absent", () => {
    const response = normalizePulseNavigatorResponse(
      {
        status: "ready",
        hero: {
          strongest_sector: { sector: "Banks", score: 83.2 },
        },
        sectors: [
          {
            sector: "Banks",
            best_stock: { symbol: "SBIN", direction: "LONG", momentum_pulse_score: 71.9 },
            top_stocks: [
              { symbol: "SBIN", direction: "LONG", momentum_pulse_score: 71.9 },
              { symbol: "ICICIBANK", direction: "LONG", momentum_pulse_score: 66.1 },
            ],
          },
        ],
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
    );

    expect(response.hero.strongest_sector?.primary).toBe("Banks");
    expect(response.tabs.sectors.sectors).toHaveLength(1);
    expect(response.tabs.sectors.sectors[0]?.sector).toBe("Banks");
    expect(response.tabs.sectors.sectors[0]?.best_stock?.symbol).toBe("SBIN");
  });

  it("keeps legacy sector payloads renderable", () => {
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
    expect(response.tabs.sectors.sectors[0]?.best_stock?.symbol).toBe("M&M");
    expect(response.tabs.sectors.sectors[0]?.sector_direction).toBe("LONG");
    expect(response.tabs.sectors.sectors[0]?.sector_score).toBe(68.2);
    expect(response.tabs.sectors.sectors[0]?.top_stocks.map((stock) => stock.symbol)).toEqual(["M&M", "TATAMOTORS", "ASHOKLEY"]);
  });

  it("preserves prior curated data during stale_refreshing when sections come back empty", () => {
    const current = normalizePulseNavigatorResponse(
      {
        status: "ready",
        last_updated: "10:45 IST",
        benchmark_change_pct: 0.82,
        hero: {
          market_mode: { primary: "Risk On", secondary: "Broad participation" },
          leader_long: { symbol: "RELIANCE", direction: "LONG", score: 88.4 },
          leader_short: { symbol: "HDFCBANK", direction: "SHORT", score: 75.1 },
          fresh_long: { symbol: "SBIN", direction: "LONG", score: 71.9 },
          strongest_sector: { sector: "Banks", score: 83.2 },
        },
        tabs: {
          discover: {
            buckets: {
              curated_now: [{ symbol: "RELIANCE", direction: "LONG", momentum_pulse_score: 88.4 }],
            },
          },
          leaders: {
            longs: [{ symbol: "RELIANCE", direction: "LONG", momentum_pulse_score: 88.4 }],
            shorts: [{ symbol: "HDFCBANK", direction: "SHORT", momentum_pulse_score: 75.1 }],
          },
          fresh: {
            longs: [{ symbol: "SBIN", direction: "LONG", momentum_pulse_score: 71.9 }],
            shorts: [],
          },
          sectors: {
            sectors: [{ sector: "Banks", leader: { symbol: "SBIN", direction: "LONG", momentum_pulse_score: 71.9 } }],
          },
        },
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
    );

    const incoming = createEmptyPulseNavigatorResponse({ limit: 12, preset: "balanced", direction: "ALL" });
    incoming.status = "stale_refreshing";

    const merged = mergePulseNavigatorResponse(current, incoming);

    expect(merged.status).toBe("stale_refreshing");
    expect(merged.hero.leader_long?.primary).toBe("RELIANCE");
    expect(merged.tabs.discover.buckets[0]?.stocks[0]?.symbol).toBe("RELIANCE");
    expect(merged.tabs.leaders.longs[0]?.symbol).toBe("RELIANCE");
    expect(merged.tabs.fresh.longs[0]?.symbol).toBe("SBIN");
    expect(merged.tabs.sectors.sectors[0]?.best_stock?.symbol ?? merged.tabs.sectors.sectors[0]?.leader?.symbol).toBe("SBIN");
    expect(merged.benchmark.value).toBe("+0.82%");
    expect(merged.last_updated).toBe("10:45 IST");
  });

  it("does not invent unavailable hero data when stale_refreshing includes a real highlight", () => {
    const current = createEmptyPulseNavigatorResponse({ limit: 12, preset: "balanced", direction: "ALL" });
    const incoming = normalizePulseNavigatorResponse(
      {
        status: "stale_refreshing",
        hero: {
          leader_long: { symbol: "TCS", direction: "LONG", score: 64.5 },
        },
      },
      { limit: 12, preset: "balanced", direction: "ALL" },
    );

    const merged = mergePulseNavigatorResponse(current, incoming);

    expect(merged.hero.leader_long?.primary).toBe("TCS");
    expect(merged.hero.leader_short).toBeNull();
  });
});