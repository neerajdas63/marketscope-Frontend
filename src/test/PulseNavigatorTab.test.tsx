import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PulseNavigatorQuery, PulseNavigatorResponse, PulseNavigatorSectorEntry, PulseNavigatorStock } from "@/data/pulseNavigatorData";
import { createEmptyPulseNavigatorResponse } from "@/data/pulseNavigatorData";
import { PulseNavigatorTab } from "@/components/PulseNavigatorTab";
import { normalizePulseNavigatorResponse } from "@/lib/pulseNavigatorApi";

const pulseNavigatorApiState = vi.hoisted(() => ({
  fetchPulseNavigatorData: vi.fn(),
  fetchPulseNavigatorTabData: vi.fn(),
}));

vi.mock("@/lib/pulseNavigatorApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pulseNavigatorApi")>("@/lib/pulseNavigatorApi");

  return {
    ...actual,
    fetchPulseNavigatorData: pulseNavigatorApiState.fetchPulseNavigatorData,
    fetchPulseNavigatorTabData: pulseNavigatorApiState.fetchPulseNavigatorTabData,
  };
});

function createStock(symbol: string, direction: "LONG" | "SHORT", sector: string): PulseNavigatorStock {
  return {
    symbol,
    sector,
    direction,
    momentum_pulse_score: direction === "LONG" ? 78.4 : 72.1,
    session_leader_score: 0,
    direction_confidence: direction === "LONG" ? 82 : 76,
    actionability_label: "clean_setup",
    leader_reason: "",
    reasons: [`${symbol} is aligned with the sector pulse.`],
    ui_tags: [],
    change_pct: direction === "LONG" ? 1.6 : -1.3,
    distance_from_vwap_pct: direction === "LONG" ? 0.7 : -0.6,
    relative_strength: direction === "LONG" ? 1.8 : -1.5,
    pulse_trend_label: direction === "LONG" ? "Rising" : "Falling",
    pulse_trend_strength: direction === "LONG" ? 6.2 : 5.7,
    latest_bar_time: "10:12",
    warning_flags: [],
    warning_count: 0,
    score_change_10m: direction === "LONG" ? 4.1 : 3.6,
  };
}

function createSector(sectorName: string, direction: "LONG" | "SHORT", index: number): PulseNavigatorSectorEntry {
  const bestStock = createStock(`${sectorName.toUpperCase()}${index}`, direction, sectorName);
  const supportDirection = direction === "LONG" ? "LONG" : "SHORT";

  return {
    sector: sectorName,
    sector_direction: direction,
    best_stock: bestStock,
    leader: bestStock,
    challenger: createStock(`${sectorName.toUpperCase()}C${index}`, supportDirection, sectorName),
    laggard: createStock(`${sectorName.toUpperCase()}L${index}`, direction === "LONG" ? "SHORT" : "LONG", sectorName),
    sector_score: 80 - index,
    market_relative_score: 4.5 - index * 0.2,
    average_change_pct: direction === "LONG" ? 1.2 + index * 0.1 : -1.1 - index * 0.1,
    candidate_count: 6 - (index % 2),
    top_stocks: [
      bestStock,
      createStock(`${sectorName.toUpperCase()}T${index}`, supportDirection, sectorName),
      createStock(`${sectorName.toUpperCase()}X${index}`, supportDirection, sectorName),
    ],
  };
}

function createResponse(query: PulseNavigatorQuery): PulseNavigatorResponse {
  const response = createEmptyPulseNavigatorResponse(query);

  response.status = "ready";
  response.last_updated = "10:12 IST";
  response.hero.strongest_sector = {
    primary: "Top sector opportunities are broadening",
    secondary: "Energy and banks are leading the aligned setups.",
  };
  response.tabs.discover.buckets = [
    {
      key: "curated_now",
      title: "Curated Now",
      stocks: [createStock("RELIANCE", "LONG", "Energy")],
    },
  ];
  response.tabs.sectors.sectors = [
    createSector("Energy", "LONG", 1),
    createSector("Banks", "SHORT", 2),
    createSector("Auto", "LONG", 3),
    createSector("Metals", "SHORT", 4),
    createSector("Industrials", "LONG", 5),
    createSector("Pharma", "SHORT", 6),
  ];

  return response;
}

describe("PulseNavigatorTab", () => {
  beforeEach(() => {
    pulseNavigatorApiState.fetchPulseNavigatorData.mockReset();
    pulseNavigatorApiState.fetchPulseNavigatorTabData.mockReset();
  });

  it("renders only the top five sectors and preserves LONG/SHORT separation in the sectors tab", async () => {
    const query: PulseNavigatorQuery = { limit: 12, preset: "balanced", direction: "ALL" };
    const response = createResponse(query);

    pulseNavigatorApiState.fetchPulseNavigatorData.mockResolvedValue(response);
    pulseNavigatorApiState.fetchPulseNavigatorTabData.mockResolvedValue(response);

    render(<PulseNavigatorTab />);

    await waitFor(() => {
      expect(screen.getByText("Pulse Navigator")).toBeInTheDocument();
    });

    const sectorsTab = screen.getByText("Sectors");

    fireEvent.mouseDown(sectorsTab);
    fireEvent.click(sectorsTab);
    fireEvent.keyDown(sectorsTab, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getAllByText("Best Stock in Sector")).toHaveLength(5);
      expect(screen.queryAllByText("Energy").length).toBeGreaterThan(0);
      expect(screen.queryAllByText("Industrials").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("Pharma")).not.toBeInTheDocument();
    expect(screen.getAllByText("Best Stock in Sector")).toHaveLength(5);
    expect(screen.getAllByText("Top Pulse Names")).toHaveLength(5);
    expect(screen.getAllByText("LONG").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SHORT").length).toBeGreaterThan(0);
  });

  it("does not show the sectors empty state when strongest-sector hero data and normalized sector cards are available", async () => {
    const query: PulseNavigatorQuery = { limit: 12, preset: "balanced", direction: "ALL" };
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
      query,
    );

    pulseNavigatorApiState.fetchPulseNavigatorData.mockResolvedValue(response);
    pulseNavigatorApiState.fetchPulseNavigatorTabData.mockResolvedValue(response);

    render(<PulseNavigatorTab />);

    await waitFor(() => {
      expect(screen.getByText("Pulse Navigator")).toBeInTheDocument();
    });

    const sectorsTab = screen.getByText("Sectors");

    fireEvent.mouseDown(sectorsTab);
    fireEvent.click(sectorsTab);
    fireEvent.keyDown(sectorsTab, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getAllByText("Best Stock in Sector")).toHaveLength(1);
    });

    expect(screen.queryByText("No Top Sector Opportunities available")).not.toBeInTheDocument();
    expect(screen.queryAllByText("Banks").length).toBeGreaterThan(0);
  });
});