import { Sector } from "@/data/mockData";
import { StockTile } from "./StockTile";
import { getChangeTextColor } from "@/lib/market";

interface SectorBlockProps {
  sector: Sector;
  colorRange?: { min: number; max: number };
}

export function SectorBlock({ sector, colorRange }: SectorBlockProps) {
  const sortedStocks = [...sector.stocks].sort(
    (a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct),
  );
  const arrow = sector.change_pct >= 0 ? "▲" : "▼";
  const colorClass = getChangeTextColor(sector.change_pct);

  return (
    <div className="bg-market-surface rounded-lg overflow-hidden border border-border/50">
      <div className="flex items-center justify-between px-3 py-2 bg-market-header">
        <span className="text-sm font-bold text-foreground tracking-wide">
          {sector.name}
        </span>
        <span className={`text-sm font-bold ${colorClass}`}>
          {arrow} {sector.change_pct > 0 ? "+" : ""}
          {sector.change_pct.toFixed(2)}%
        </span>
      </div>
      <div className="flex flex-wrap gap-[3px] p-2">
        {sortedStocks.map((stock) => (
          <StockTile key={stock.symbol} stock={stock} colorRange={colorRange} />
        ))}
      </div>
    </div>
  );
}
