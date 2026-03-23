import type { PulseNavigatorActionabilityLabel, PulseNavigatorSectorEntry, PulseNavigatorStock } from "@/data/pulseNavigatorData";

const directionStyles = {
  LONG: { color: "#86EFAC", background: "rgba(22, 101, 52, 0.18)", border: "rgba(34, 197, 94, 0.3)" },
  SHORT: { color: "#FCA5A5", background: "rgba(127, 29, 29, 0.18)", border: "rgba(248, 113, 113, 0.3)" },
  NEUTRAL: { color: "#CBD5E1", background: "rgba(30, 41, 59, 0.7)", border: "rgba(100, 116, 139, 0.3)" },
} as const;

const actionabilityLabels: Record<PulseNavigatorActionabilityLabel, string> = {
  clean_setup: "Clean Setup",
  needs_pullback: "Needs Pullback",
  extended: "Extended",
  risky_spike: "Risky Spike",
  neutral: "Watch",
};

function formatNumber(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}

function formatSignedPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ color: accent ?? "#E2E8F0", fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>{value}</div>
    </div>
  );
}

function SummaryChip({ label, value, accent = "#7DD3FC" }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid rgba(51, 65, 85, 0.72)",
        background: "rgba(15, 23, 42, 0.72)",
        padding: "10px 12px",
        minWidth: "120px",
      }}
    >
      <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ color: accent, fontSize: "14px", fontWeight: 800, marginTop: "4px" }}>{value}</div>
    </div>
  );
}

function CompactStockRow({ stock }: { stock: PulseNavigatorStock }) {
  const directionTone = directionStyles[stock.direction];

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid rgba(51, 65, 85, 0.72)",
        background: "rgba(15, 23, 42, 0.72)",
        padding: "10px 12px",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 800 }}>{stock.symbol}</div>
          <div style={{ color: "#94A3B8", fontSize: "11px", marginTop: "2px" }}>{stock.sector}</div>
        </div>
        <span
          style={{
            color: directionTone.color,
            background: directionTone.background,
            border: `1px solid ${directionTone.border}`,
            borderRadius: "9999px",
            fontSize: "10px",
            fontWeight: 800,
            padding: "3px 8px",
          }}
        >
          {stock.direction}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <Stat label="Pulse" value={formatNumber(stock.momentum_pulse_score, 1)} />
        <Stat label="Trend" value={formatNumber(stock.pulse_trend_strength, 1)} accent="#CFFAFE" />
        <Stat label="Day" value={formatSignedPercent(stock.change_pct, 1)} accent={stock.change_pct >= 0 ? "#86EFAC" : "#FCA5A5"} />
      </div>
    </div>
  );
}

export function PulseNavigatorSectorCard({ sector }: { sector: PulseNavigatorSectorEntry }) {
  const bestStock = sector.best_stock ?? sector.leader;
  const topStocks = (sector.top_stocks.length > 0
    ? sector.top_stocks
    : [bestStock, sector.challenger, sector.laggard].filter((stock): stock is PulseNavigatorStock => stock !== null)
  )
    .filter((stock, index, stocks) => stocks.findIndex((candidate) => candidate.symbol === stock.symbol) === index)
    .slice(0, 3);
  const sectorDirection = sector.sector_direction ?? bestStock?.direction ?? sector.leader?.direction ?? "NEUTRAL";
  const directionTone = directionStyles[sectorDirection];

  return (
    <div
      style={{
        background: "rgba(9, 15, 28, 0.84)",
        borderRadius: "18px",
        border: `1px solid ${directionTone.border}`,
        padding: "16px",
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div style={{ color: "#7DD3FC", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em" }}>Top Sector Opportunities</div>
          <div style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>{sector.sector}</div>
        </div>
        <span
          style={{
            color: directionTone.color,
            background: directionTone.background,
            border: `1px solid ${directionTone.border}`,
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: 800,
            padding: "4px 10px",
          }}
        >
          {sectorDirection}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-4">
        <SummaryChip label="Sector Score" value={formatNumber(sector.sector_score, 1)} accent="#F8FAFC" />
        <SummaryChip label="Relative Score" value={formatNumber(sector.market_relative_score, 1)} accent="#CFFAFE" />
        <SummaryChip
          label="Breadth"
          value={sector.candidate_count !== null ? `${sector.candidate_count} names` : "--"}
          accent={directionTone.color}
        />
        <SummaryChip label="Avg Change" value={formatSignedPercent(sector.average_change_pct, 1)} accent={sector.average_change_pct !== null && sector.average_change_pct >= 0 ? "#86EFAC" : "#FCA5A5"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] gap-4 mt-4">
        <div
          style={{
            borderRadius: "16px",
            border: `1px solid ${directionTone.border}`,
            background: "linear-gradient(160deg, rgba(7, 20, 39, 0.98), rgba(14, 23, 38, 0.98))",
            padding: "14px",
          }}
        >
          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Best Stock in Sector</div>
          {bestStock ? (
            <>
              <div className="flex items-start justify-between gap-3 mt-2 flex-wrap">
                <div>
                  <div style={{ color: "#F8FAFC", fontSize: "24px", fontWeight: 800 }}>{bestStock.symbol}</div>
                  <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}>{bestStock.sector}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span
                    style={{
                      color: directionStyles[bestStock.direction].color,
                      background: directionStyles[bestStock.direction].background,
                      border: `1px solid ${directionStyles[bestStock.direction].border}`,
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "4px 10px",
                    }}
                  >
                    {bestStock.direction}
                  </span>
                  <span
                    style={{
                      color: "#E2E8F0",
                      background: "rgba(15, 23, 42, 0.82)",
                      border: "1px solid rgba(71, 85, 105, 0.72)",
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                    }}
                  >
                    {actionabilityLabels[bestStock.actionability_label]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <Stat label="Pulse Score" value={formatNumber(bestStock.momentum_pulse_score, 1)} valueStyle={undefined} />
                <Stat label="Trend Strength" value={formatNumber(bestStock.pulse_trend_strength, 1)} accent="#CFFAFE" />
                <Stat label="Confidence" value={`${formatNumber(bestStock.direction_confidence, 0)}%`} accent={directionStyles[bestStock.direction].color} />
                <Stat label="Day Change" value={formatSignedPercent(bestStock.change_pct, 1)} accent={bestStock.change_pct >= 0 ? "#86EFAC" : "#FCA5A5"} />
                <Stat label="Rel Strength" value={formatSignedPercent(bestStock.relative_strength, 1)} accent={bestStock.relative_strength >= 0 ? "#86EFAC" : "#FCA5A5"} />
                <Stat label="Trend" value={bestStock.pulse_trend_label} accent={directionStyles[bestStock.direction].color} />
              </div>

              {bestStock.reasons.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {bestStock.reasons.slice(0, 2).map((reason) => (
                    <div
                      key={reason}
                      style={{
                        color: "#CBD5E1",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        borderRadius: "12px",
                        border: "1px solid rgba(51, 65, 85, 0.72)",
                        background: "rgba(15, 23, 42, 0.72)",
                        padding: "10px 12px",
                      }}
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ color: "#94A3B8", fontSize: "13px", marginTop: "10px" }}>No best stock was returned for this sector yet.</div>
          )}
        </div>

        <div>
          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Pulse Names</div>
          {topStocks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 mt-2">
              {topStocks.map((stock) => (
                <CompactStockRow key={`${sector.sector}-${stock.symbol}`} stock={stock} />
              ))}
            </div>
          ) : (
            <div
              style={{
                color: "#94A3B8",
                fontSize: "13px",
                marginTop: "10px",
                borderRadius: "12px",
                border: "1px dashed rgba(71, 85, 105, 0.7)",
                background: "rgba(15, 23, 42, 0.6)",
                padding: "12px",
              }}
            >
              No additional aligned names were returned for this sector.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}