import type { PulseNavigatorSectorEntry, PulseNavigatorStock } from "@/data/pulseNavigatorData";

function formatNumber(value: number, digits = 1) {
  if (Number.isNaN(value)) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}

function MiniMemberCard({
  label,
  stock,
  dominant = false,
}: {
  label: string;
  stock: PulseNavigatorStock | null;
  dominant?: boolean;
}) {
  if (!stock) {
    return (
      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          border: "1px dashed rgba(71, 85, 105, 0.7)",
          borderRadius: dominant ? "16px" : "14px",
          padding: dominant ? "16px" : "12px",
        }}
      >
        <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        <div style={{ color: "#94A3B8", fontSize: dominant ? "16px" : "14px", fontWeight: 700, marginTop: "8px" }}>No candidate</div>
      </div>
    );
  }

  const directionColor = stock.direction === "LONG" ? "#86EFAC" : stock.direction === "SHORT" ? "#FCA5A5" : "#CBD5E1";

  return (
    <div
      style={{
        background: dominant
          ? "linear-gradient(160deg, rgba(7, 20, 39, 0.98), rgba(14, 23, 38, 0.98))"
          : "rgba(9, 15, 28, 0.84)",
        border: `1px solid ${dominant ? "rgba(56, 189, 248, 0.35)" : "rgba(51, 65, 85, 0.72)"}`,
        borderRadius: dominant ? "16px" : "14px",
        padding: dominant ? "16px" : "12px",
      }}
    >
      <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div className="flex items-start justify-between gap-3 mt-2">
        <div>
          <div style={{ color: "#F8FAFC", fontSize: dominant ? "20px" : "16px", fontWeight: 800 }}>{stock.symbol}</div>
          <div style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}>{stock.sector}</div>
        </div>
        <div style={{ color: directionColor, fontSize: "12px", fontWeight: 700 }}>{stock.direction}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase" }}>Pulse Score</div>
          <div style={{ color: "#E2E8F0", fontSize: dominant ? "18px" : "15px", fontWeight: 800, marginTop: "4px" }}>
            {formatNumber(stock.momentum_pulse_score, 1)}
          </div>
        </div>
        <div>
          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase" }}>Confidence</div>
          <div style={{ color: directionColor, fontSize: dominant ? "18px" : "15px", fontWeight: 800, marginTop: "4px" }}>
            {formatNumber(stock.direction_confidence, 0)}%
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-4">
        <span style={{ color: "#7DD3FC", fontSize: "12px", fontWeight: 700 }}>{stock.pulse_trend_label}</span>
        <span style={{ color: "#64748B", fontSize: "12px" }}>{stock.latest_bar_time || "Latest bar --"}</span>
      </div>
    </div>
  );
}

export function PulseNavigatorSectorCard({ sector }: { sector: PulseNavigatorSectorEntry }) {
  return (
    <div
      style={{
        background: "rgba(9, 15, 28, 0.84)",
        borderRadius: "18px",
        border: "1px solid rgba(51, 65, 85, 0.7)",
        padding: "16px",
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div style={{ color: "#7DD3FC", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em" }}>Sector Leaders</div>
          <div style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>{sector.sector}</div>
        </div>
        <div style={{ color: "#64748B", fontSize: "12px" }}>Leader emphasized, challenger and laggard for quick comparison</div>
      </div>

      <div className="mt-4">
        <MiniMemberCard label="Leader" stock={sector.leader} dominant />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <MiniMemberCard label="Challenger" stock={sector.challenger} />
        <MiniMemberCard label="Laggard" stock={sector.laggard} />
      </div>
    </div>
  );
}