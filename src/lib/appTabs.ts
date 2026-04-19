export const APP_TABS = [
  "heatmap",
  "scanner",
  "boost",
  "breakout",
  "52w",
  "oi",
  "breadth",
  "opening",
  "sectorscope",
  "rfactor",
  "momentum-pulse",
  "momentum-pulse-strategy",
  "pulse-navigator",
  "sequence-signals",
  "planner",
  "foradar",
  "watchlist",
] as const;

export type AppTab = (typeof APP_TABS)[number];

export const DEFAULT_APP_TAB: AppTab = "heatmap";

export const APP_TAB_LABELS: Record<AppTab, string> = {
  heatmap: "HEATMAP",
  scanner: "SCANNER",
  boost: "BOOST",
  breakout: "BREAKOUT",
  "52w": "52W",
  oi: "OI",
  breadth: "BREADTH",
  opening: "OPENING",
  sectorscope: "SECTOR SCOPE",
  rfactor: "RFACTOR",
  planner: "TRADE GUARDIAN",
  watchlist: "WATCHLIST",
  foradar: "F&O RADAR",
  "momentum-pulse": "MOMENTUM PULSE",
  "momentum-pulse-strategy": "PULSE STRATEGY",
  "pulse-navigator": "PULSE NAVIGATOR",
  "sequence-signals": "SEQUENCE SIGNALS",
};

export function isAppTab(value: string | null | undefined): value is AppTab {
  return Boolean(value) && APP_TABS.includes(value as AppTab);
}

export function resolveAppTab(value: string | null | undefined): AppTab {
  return isAppTab(value) ? value : DEFAULT_APP_TAB;
}
