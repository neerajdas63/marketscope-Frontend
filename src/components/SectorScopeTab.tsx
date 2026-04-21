import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";

interface LiveStock {
  symbol: string;
  ltp?: number;
  change_pct?: number;
  volume_ratio?: number;
  scope_score?: number;
  boost_score?: number;
  rfactor?: number;
  rs_in_sector?: number;
  tier?: string;
  fo?: boolean;
}

interface LiveSector {
  sector: string;
  stocks: LiveStock[];
}

const safe = (val: unknown, decimals = 1): string => {
  const num = parseFloat(val as string);
  if (val === undefined || val === null || isNaN(num)) return "--";
  return num.toFixed(decimals);
};

const safeNum = (val: unknown, fallback = 0): number => {
  const num = parseFloat(val as string);
  return isNaN(num) ? fallback : num;
};

function getScoreColor(score: number): string {
  if (score >= 3.5) return "#00C853";
  if (score >= 2.5) return "#FFD600";
  return "#F44336";
}

function SectorRow({
  entry,
  isOpen,
  onToggle,
}: {
  entry: LiveSector;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const stocks = entry.stocks || [];
  const avgChange =
    stocks.length > 0
      ? stocks.reduce((sum, s) => sum + safeNum(s.change_pct), 0) /
        stocks.length
      : 0;
  const topStock = stocks[0];
  const isPositive = avgChange >= 0;
  const sectorName = entry.sector || "—";

  return (
    <div style={{ borderBottom: "1px solid #1e1e1e" }}>
      {/* Sector Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: isOpen ? "#161616" : "#0d0d0d",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          textAlign: "left",
        }}
        onMouseEnter={(e) => {
          if (!isOpen)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#141414";
        }}
        onMouseLeave={(e) => {
          if (!isOpen)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#0d0d0d";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{ color: "#cccccc", fontWeight: "bold", fontSize: "13px" }}
          >
            {sectorName}
          </span>
          <span
            style={{
              color: isPositive ? "#00C853" : "#F44336",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {isPositive ? "▲ +" : "▼ "}
            {safe(avgChange, 2)}%
          </span>
          {topStock && (
            <span style={{ color: "#555555", fontSize: "11px" }}>
              ★ {topStock.symbol}{" "}
              <span
                style={{ color: getScoreColor(safeNum(topStock.scope_score)) }}
              >
                {safe(topStock.scope_score, 2)}
              </span>
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#444444", fontSize: "11px" }}>
            {stocks.length} stocks
          </span>
          <span style={{ color: "#555555", fontSize: "13px" }}>
            {isOpen ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Expanded rows */}
      {isOpen && (
        <div style={{ backgroundColor: "#0a0a0a", padding: "0 16px 10px" }}>
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr 80px 60px 80px",
              padding: "6px 0",
              borderBottom: "1px solid #1e1e1e",
              marginBottom: "4px",
            }}
          >
            {["#", "Symbol", "% Chg", "Vol", "Score"].map((h) => (
              <span
                key={h}
                style={{
                  color: "#444444",
                  fontSize: "10px",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {stocks.map((stock, idx) => {
            const isTop = idx === 0;
            const chgPositive = safeNum(stock.change_pct) >= 0;
            return (
              <div
                key={stock.symbol}
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px 1fr 80px 60px 80px",
                  padding: "5px 0",
                  alignItems: "center",
                }}
              >
                {/* Rank */}
                <span style={{ color: "#444444", fontSize: "11px" }}>
                  {idx + 1}
                </span>

                {/* Symbol */}
                <span
                  style={{
                    color: "#cccccc",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {stock.symbol}
                </span>

                {/* % Change */}
                <span
                  style={{
                    color: chgPositive ? "#00C853" : "#F44336",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {chgPositive ? "+" : ""}
                  {safe(stock.change_pct, 2)}%
                </span>

                {/* Volume */}
                <span
                  style={{
                    color:
                      safeNum(stock.volume_ratio) > 2
                        ? "#FF6B00"
                        : safeNum(stock.volume_ratio) > 1.5
                          ? "#FFD600"
                          : "#888888",
                    fontSize: "12px",
                  }}
                >
                  {safe(stock.volume_ratio, 1)}x
                </span>

                {/* Score + star */}
                <span
                  style={{
                    color: getScoreColor(safeNum(stock.scope_score)),
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {isTop ? "⭐ " : ""}
                  {safe(stock.scope_score, 2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SectorScopeTab() {
  const [sectors, setSectors] = useState<LiveSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSectors, setOpenSectors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const doFetch = () => {
      setLoading(true);
      apiFetch("/sector-scope")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d) => {
          setSectors(d.sectors || d || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(
            `Backend error: ${err.message}. Start server: python main.py`,
          );
          setLoading(false);
        });
    };
    doFetch();
    const interval = setInterval(doFetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedSectors = useMemo(() => {
    return [...sectors].sort((a, b) => {
      const aStocks = a.stocks || [];
      const bStocks = b.stocks || [];
      const aAvg = aStocks.length
        ? aStocks.reduce((s, x) => s + safeNum(x.change_pct), 0) /
          aStocks.length
        : 0;
      const bAvg = bStocks.length
        ? bStocks.reduce((s, x) => s + safeNum(x.change_pct), 0) /
          bStocks.length
        : 0;
      return Math.abs(bAvg) - Math.abs(aAvg);
    });
  }, [sectors]);

  const toggleSector = (name: string) => {
    setOpenSectors((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          color: "#2979FF",
          fontSize: "16px",
        }}
      >
        ⏳ Loading Sector Scope...
      </div>
    );

  if (error)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span style={{ color: "#F44336", fontSize: "16px" }}>❌ {error}</span>
      </div>
    );

  return (
    <div style={{ backgroundColor: "#0d0d0d", minHeight: "100vh" }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid #222222",
          backgroundColor: "#0d0d0d",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ color: "#555555", fontSize: "12px" }}>
          {sortedSectors.length} sectors · sorted by move
        </span>
        <span style={{ color: "#444444", fontSize: "11px" }}>
          {sectors.length > 0 ? "Live" : ""}
        </span>
      </div>

      {/* Accordion list */}
      <div>
        {sortedSectors.map((entry) => (
          <SectorRow
            key={entry.sector}
            entry={entry}
            isOpen={openSectors.has(entry.sector)}
            onToggle={() => toggleSector(entry.sector)}
          />
        ))}
      </div>
    </div>
  );
}
