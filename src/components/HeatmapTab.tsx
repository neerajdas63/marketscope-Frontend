import { useState, useEffect, useMemo } from "react";
import { SectorBlock } from "./SectorBlock";
import { MarketData } from "@/data/mockData"; // sirf TYPE import
import { getAdaptiveBgColor } from "@/lib/market";
import { apiFetch } from "@/lib/api";

export function HeatmapTab() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch("/heatmap")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, []);

  // 6c: compute adaptive color range across ALL visible stocks
  const colorRange = useMemo(() => {
    if (!data) return undefined;
    const allPcts = data.sectors.flatMap((s) =>
      s.stocks.map((st) => st.change_pct),
    );
    if (allPcts.length === 0) return undefined;
    return { min: Math.min(...allPcts), max: Math.max(...allPcts) };
  }, [data]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-blue-400 text-lg">
        ⏳ Loading market data...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-lg">
        ❌ Backend not reachable. Start server: python main.py
      </div>
    );

  const sortedSectors = [...data!.sectors].sort(
    (a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct),
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5 p-4">
        {sortedSectors.map((sector) => (
          <SectorBlock
            key={sector.name}
            sector={sector}
            colorRange={colorRange}
          />
        ))}
      </div>

      {/* 6c: adaptive color scale legend */}
      {colorRange && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "8px 16px 14px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#444", fontSize: "10px" }}>Color Scale:</span>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "3px",
                backgroundColor: getAdaptiveBgColor(
                  colorRange.min,
                  colorRange.min,
                  colorRange.max,
                ),
              }}
            />
            <span
              style={{ color: "#FF5252", fontSize: "10px", fontWeight: 600 }}
            >
              {colorRange.min.toFixed(2)}%
            </span>
          </div>
          {[-0.5, 0, 0.5].map((v) => (
            <div
              key={v}
              style={{ display: "flex", alignItems: "center", gap: "3px" }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  backgroundColor: getAdaptiveBgColor(
                    v,
                    colorRange.min,
                    colorRange.max,
                  ),
                }}
              />
              <span style={{ color: "#888", fontSize: "9px" }}>
                {v > 0 ? "+" : ""}
                {v.toFixed(1)}%
              </span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "3px",
                backgroundColor: getAdaptiveBgColor(
                  colorRange.max,
                  colorRange.min,
                  colorRange.max,
                ),
              }}
            />
            <span
              style={{ color: "#00C853", fontSize: "10px", fontWeight: 600 }}
            >
              +{colorRange.max.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
