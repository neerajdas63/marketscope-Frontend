import { Stock } from "@/data/mockData";

export function getChangeColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 0.5) return "bg-neutral";
  if (pct > 0) {
    if (abs >= 3) return "bg-gain-strong";
    if (abs >= 1.5) return "bg-gain-medium";
    return "bg-gain-light";
  }
  if (abs >= 3) return "bg-loss-strong";
  if (abs >= 1.5) return "bg-loss-medium";
  return "bg-loss-light";
}

export function getChangeTextColor(pct: number): string {
  if (pct > 0) return "text-gain-medium";
  if (pct < 0) return "text-loss-medium";
  return "text-muted-foreground";
}

export function getTileFlex(pct: number): number {
  const abs = Math.abs(pct);
  if (abs >= 3) return 4;
  if (abs >= 2) return 3;
  if (abs >= 1) return 2;
  if (abs >= 0.5) return 1.5;
  return 1;
}

export function formatCurrency(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

export function getSignal(stock: Stock): { label: string; emoji: string } {
  if (stock.volume_ratio >= 2.5 && Math.abs(stock.change_pct) >= 1.5) {
    return stock.change_pct > 0
      ? { label: "MOMENTUM ▲", emoji: "" }
      : { label: "BREAKDOWN ▼", emoji: "" };
  }
  if (stock.volume_ratio >= 2) {
    return { label: "VOLUME SPIKE 🔥", emoji: "" };
  }
  return { label: "", emoji: "" };
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const day = ist.getDay();
  if (day === 0 || day === 6) return false;
  const hours = ist.getHours();
  const mins = ist.getMinutes();
  const totalMins = hours * 60 + mins;
  return totalMins >= 555 && totalMins <= 930; // 9:15 AM to 3:30 PM
}

/**
 * Returns an inline CSS background color for a stock tile using an adaptive
 * scale derived from the actual min/max change_pct in the visible dataset.
 * The middle 20% of the range is mapped to neutral grey.
 */
export function getAdaptiveBgColor(
  pct: number,
  minPct: number,
  maxPct: number,
): string {
  const range = maxPct - minPct || 1;
  const neutral = range * 0.1; // ±10% of range around 0 = neutral zone

  if (Math.abs(pct) <= neutral) return "#424242"; // neutral grey

  if (pct > 0) {
    const intensity = Math.min((pct - neutral) / (maxPct - neutral), 1);
    const r = Math.round(0 + intensity * 0);
    const g = Math.round(80 + intensity * 120);
    const b = Math.round(40 + intensity * 43);
    return `rgb(${r},${g},${b})`;
  }
  // pct < 0
  const intensity = Math.min(
    (Math.abs(pct) - neutral) / (Math.abs(minPct) - neutral || 1),
    1,
  );
  const r = Math.round(100 + intensity * 155);
  const g = Math.round(23 + intensity * 0);
  const b = Math.round(23 + intensity * 0);
  return `rgb(${r},${g},${b})`;
}
