import { useState, useMemo, useEffect } from "react";
import { mockData, Stock } from "@/data/mockData";
import { getChangeTextColor, formatCurrency, getSignal } from "@/lib/market";
import { apiFetch } from "@/lib/api";
import {
  formatInsightNumber,
  InsightTooltip,
  StageBadge,
  TrendIndicator,
} from "./StockInsightWidgets";

interface Filters {
  minMove: number;
  direction: "ALL" | "GAINERS" | "LOSERS";
  sectors: string[];
  foOnly: boolean;
  volumeSpike: number;
}

const allSectorNames = mockData.sectors.map((s) => s.name);

function compareOptionalNumbers(a?: number, b?: number, ascending = false) {
  const aValid = typeof a === "number" && !Number.isNaN(a);
  const bValid = typeof b === "number" && !Number.isNaN(b);

  if (!aValid && !bValid) return 0;
  if (!aValid) return 1;
  if (!bValid) return -1;

  return ascending ? a - b : b - a;
}

export function ScannerTab() {
  const [filters, setFilters] = useState<Filters>({
    minMove: 1,
    direction: "ALL",
    sectors: [],
    foOnly: false,
    volumeSpike: 0,
  });
  const [sortCol, setSortCol] = useState<string>("change_pct");
  const [sortAsc, setSortAsc] = useState(false);

  const [data, setData] = useState<{ stocks: (Stock & { sector: string })[] }>({
    stocks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/scanner?min_change=0")
      .then((r) => r.json())
      .then((d) => {
        if (d.stocks) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const deduplicated = useMemo(() => {
    const seen = new Set<string>();
    return data.stocks.filter((s) => {
      if (seen.has(s.symbol)) return false;
      seen.add(s.symbol);
      return true;
    });
  }, [data.stocks]);

  const filtered = useMemo(() => {
    const result = deduplicated.filter((s) => {
      if (Math.abs(s.change_pct) < filters.minMove) return false;
      if (filters.direction === "GAINERS" && s.change_pct <= 0) return false;
      if (filters.direction === "LOSERS" && s.change_pct >= 0) return false;
      if (filters.sectors.length > 0 && !filters.sectors.includes(s.sector))
        return false;
      if (filters.foOnly && !s.fo) return false;
      if (filters.volumeSpike > 0 && s.volume_ratio < filters.volumeSpike)
        return false;
      return true;
    });

    result.sort((a, b) => {
      if (
        sortCol === "rfactor" ||
        sortCol === "rfactor_trend_15m" ||
        sortCol === "opportunity_score"
      ) {
        return compareOptionalNumbers(a[sortCol], b[sortCol], sortAsc);
      }

      const key = sortCol as keyof typeof a;
      const av = a[key] as number;
      const bv = b[key] as number;
      if (typeof av === "number") return sortAsc ? av - bv : bv - av;
      return 0;
    });

    return result;
  }, [deduplicated, filters, sortCol, sortAsc]);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-blue-400 text-lg">
        ⏳ Loading scanner data...
      </div>
    );

  const toggleSector = (name: string) => {
    setFilters((f) => ({
      ...f,
      sectors: f.sectors.includes(name)
        ? f.sectors.filter((s) => s !== name)
        : [...f.sectors, name],
    }));
  };

  return (
    <div className="flex flex-col md:flex-row gap-0 min-h-[calc(100vh-120px)]">
      {/* Filter Panel */}
      <div className="w-full md:w-[250px] shrink-0 bg-market-surface border-r border-border p-4 space-y-5">
        <h3 className="text-sm font-bold text-primary tracking-wider">
          FILTERS
        </h3>

        <div>
          <label className="text-xs text-muted-foreground">Min % Move</label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={filters.minMove}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minMove: parseFloat(e.target.value) }))
            }
            className="w-full accent-primary mt-1"
          />
          <span className="text-xs text-foreground">{filters.minMove}%</span>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Direction
          </label>
          <div className="flex gap-1">
            {(["ALL", "GAINERS", "LOSERS"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setFilters((f) => ({ ...f, direction: d }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  filters.direction === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Sectors
          </label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {allSectorNames.map((name) => (
              <label
                key={name}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.sectors.includes(name)}
                  onChange={() => toggleSector(name)}
                  className="accent-primary w-3 h-3"
                />
                <span className="text-xs text-foreground">{name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">F&O Only</span>
          <button
            onClick={() => setFilters((f) => ({ ...f, foOnly: !f.foOnly }))}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              filters.foOnly ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${
                filters.foOnly ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Volume Spike
          </label>
          <select
            value={filters.volumeSpike}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                volumeSpike: parseFloat(e.target.value),
              }))
            }
            className="w-full bg-muted text-foreground text-xs rounded px-2 py-1.5 border border-border"
          >
            <option value={0}>Any</option>
            <option value={1.5}>&gt;1.5x</option>
            <option value={2}>&gt;2x</option>
            <option value={3}>&gt;3x</option>
          </select>
        </div>

        <button
          onClick={() =>
            setFilters({
              minMove: 1,
              direction: "ALL",
              sectors: [],
              foOnly: false,
              volumeSpike: 0,
            })
          }
          className="text-xs text-primary hover:underline"
        >
          RESET
        </button>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-market-header text-muted-foreground">
              {[
                { key: "#", label: "#", sortable: false },
                { key: "symbol", label: "Symbol", sortable: false },
                { key: "sector", label: "Sector", sortable: false },
                { key: "ltp", label: "LTP", sortable: true },
                { key: "change_pct", label: "% Change", sortable: true },
                { key: "rfactor", label: "R-Factor", sortable: true },
                { key: "rfactor_trend_15m", label: "Trend", sortable: true },
                {
                  key: "opportunity_score",
                  label: "Opportunity",
                  sortable: true,
                },
                { key: "volume_ratio", label: "Vol Ratio", sortable: true },
                { key: "signal", label: "Signal", sortable: false },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left font-semibold ${
                    col.sortable ? "cursor-pointer hover:text-foreground" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.key === "rfactor" ? (
                    <InsightTooltip
                      label="R-Factor"
                      description="Current strength / confirmation"
                    >
                      <span>{col.label}</span>
                    </InsightTooltip>
                  ) : col.key === "rfactor_trend_15m" ? (
                    <InsightTooltip
                      label="Trend"
                      description="Whether R-Factor is rising in recent candles"
                    >
                      <span>{col.label}</span>
                    </InsightTooltip>
                  ) : col.key === "opportunity_score" ? (
                    <InsightTooltip
                      label="Opportunity"
                      description="Early-entry quality before overextension"
                    >
                      <span>{col.label}</span>
                    </InsightTooltip>
                  ) : (
                    col.label
                  )}
                  {sortCol === col.key && (sortAsc ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock, i) => {
              const signal = getSignal(stock);
              return (
                <tr
                  key={stock.symbol + stock.sector}
                  className={
                    i % 2 === 0 ? "bg-market-surface" : "bg-market-surface-alt"
                  }
                >
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-bold text-foreground">
                    <div className="flex flex-col gap-1">
                      <span>{stock.symbol}</span>
                      <StageBadge stage={stock.setup_stage} className="w-fit" />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {stock.sector}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {formatCurrency(stock.ltp)}
                  </td>
                  <td
                    className={`px-3 py-2 font-bold ${getChangeTextColor(stock.change_pct)}`}
                  >
                    {stock.change_pct > 0 ? "+" : ""}
                    {stock.change_pct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-semibold tabular-nums text-emerald-300">
                      {formatInsightNumber(stock.rfactor, 1)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <TrendIndicator
                      compact
                      trend={stock.rfactor_trend_15m}
                      acceleration={stock.rfactor_trend_acceleration}
                      points={stock.rfactor_trend_points}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full border border-amber-200/15 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 tabular-nums">
                      Opportunity{" "}
                      {formatInsightNumber(stock.opportunity_score, 1)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        stock.volume_ratio >= 2
                          ? "bg-volume-hot/20 text-volume-hot"
                          : stock.volume_ratio >= 1.5
                            ? "bg-volume-warm/20 text-volume-warm"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stock.volume_ratio.toFixed(1)}x
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {signal.label &&
                      (() => {
                        let bg = "",
                          color = "",
                          border = "";
                        if (signal.label.includes("MOMENTUM")) {
                          bg = "#1B5E20";
                          color = "#00C853";
                          border = "#00C853";
                        } else if (signal.label.includes("VOLUME SPIKE")) {
                          bg = "rgba(230, 81, 0, 0.2)";
                          color = "#FF6D00";
                          border = "#FF6D00";
                        } else {
                          bg = "#1A237E";
                          color = "#2979FF";
                          border = "#2979FF";
                        }
                        return (
                          <span
                            style={{
                              backgroundColor: bg,
                              color,
                              border: `1px solid ${border}`,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {signal.label}
                          </span>
                        );
                      })()}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No stocks match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
