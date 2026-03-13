import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HeatmapTab } from "@/components/HeatmapTab";
import { ScannerTab } from "@/components/ScannerTab";
import { BoostTab } from "@/components/BoostTab";
import { SectorScopeTab } from "@/components/SectorScopeTab";
import { RFactorTab } from "@/components/RFactorTab";
import { BreakoutTab } from "@/components/BreakoutTab";
import { SectorMomentumTab } from "@/components/SectorMomentumTab";
import { MorningWatchlist } from "@/components/MorningWatchlist";
import { OiTab } from "@/components/OiTab";
import { TradePlannerTab } from "@/components/TradePlannerTab";
import { BreadthTab } from "@/components/BreadthTab";
import { FiftyTwoWeekTab } from "@/components/FiftyTwoWeekTab";
import { FoRadarTab } from "@/components/FoRadarTab";
import { MomentumPulseTab } from "@/components/MomentumPulseTab";
import { SequenceSignalsTab } from "@/components/SequenceSignalsTab";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || "Unknown error" };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "12px" }}>
          <span style={{ color: "#F44336", fontSize: "16px" }}>
            ❌ {this.props.name} crashed: {this.state.error}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<
    "heatmap" | "scanner" | "boost" | "breakout" | "52w" | "oi" | "breadth" |
    "opening" | "sectorscope" | "rfactor" | "planner" | "watchlist" | "foradar" | "momentum-pulse" | "sequence-signals"
  >("heatmap");
  const [refreshTrigger] = useState<number>(0);

  const TAB_LABELS: Record<string, string> = {
    heatmap:    "HEATMAP",
    scanner:    "SCANNER",
    boost:      "BOOST",
    breakout:   "BREAKOUT",
    "52w":      "52W",
    oi:         "OI",
    breadth:    "BREADTH",
    opening:    "OPENING",
    sectorscope:"SECTOR SCOPE",
    rfactor:    "RFACTOR",
    planner:    "PLANNER",
    watchlist:  "WATCHLIST",
    foradar:    "F&O RADAR",
    "momentum-pulse": "MOMENTUM PULSE",
    "sequence-signals": "SEQUENCE SIGNALS",
  };

  const ALL_TABS = [
    "heatmap","scanner","boost","breakout","52w","oi","breadth",
    "opening","sectorscope","rfactor","momentum-pulse","sequence-signals","planner","foradar","watchlist",
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-1 px-4 pt-3 pb-1 bg-background">
        {ALL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-bold rounded-t transition-all duration-200 ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="transition-opacity duration-200">
        {activeTab === "heatmap" && (
          <ErrorBoundary name="HeatmapTab"><HeatmapTab /></ErrorBoundary>
        )}
        {activeTab === "scanner" && (
          <ErrorBoundary name="ScannerTab"><ScannerTab /></ErrorBoundary>
        )}
        {activeTab === "boost" && (
          <ErrorBoundary name="BoostTab"><BoostTab /></ErrorBoundary>
        )}
        {activeTab === "breakout" && (
          <ErrorBoundary name="BreakoutTab"><BreakoutTab refreshTrigger={refreshTrigger} /></ErrorBoundary>
        )}
        {activeTab === "52w" && (
          <ErrorBoundary name="FiftyTwoWeekTab"><FiftyTwoWeekTab /></ErrorBoundary>
        )}
        {activeTab === "oi" && (
          <ErrorBoundary name="OiTab"><OiTab /></ErrorBoundary>
        )}
        {activeTab === "breadth" && (
          <ErrorBoundary name="BreadthTab"><BreadthTab /></ErrorBoundary>
        )}
        {activeTab === "opening" && (
          <ErrorBoundary name="SectorMomentumTab"><SectorMomentumTab /></ErrorBoundary>
        )}
        {activeTab === "sectorscope" && (
          <ErrorBoundary name="SectorScopeTab"><SectorScopeTab /></ErrorBoundary>
        )}
        {activeTab === "rfactor" && (
          <ErrorBoundary name="RFactorTab"><RFactorTab /></ErrorBoundary>
        )}
        {activeTab === "momentum-pulse" && (
          <ErrorBoundary name="MomentumPulseTab"><MomentumPulseTab /></ErrorBoundary>
        )}
        {activeTab === "sequence-signals" && (
          <ErrorBoundary name="SequenceSignalsTab"><SequenceSignalsTab /></ErrorBoundary>
        )}
        {activeTab === "planner" && (
          <ErrorBoundary name="TradePlannerTab"><TradePlannerTab /></ErrorBoundary>
        )}
        {activeTab === "foradar" && (
          <ErrorBoundary name="FoRadarTab"><FoRadarTab /></ErrorBoundary>
        )}
        {activeTab === "watchlist" && (
          <ErrorBoundary name="MorningWatchlist"><MorningWatchlist /></ErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default Index;
