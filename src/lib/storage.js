const DATA_KEY = "pp:data:v1";
const SYNC_KEY = "pp:sync:v1";
export const DATA_VERSION = 1;

export const DEFAULT_HOLDINGS = {
  stocks: 132110,
  bonds: 34721,
  gold: 34716,
  cashJPY: 500000,
  cashCNY: 0,
  updatedAt: null,
};

export const DEFAULT_SETTINGS = {
  jpyPerCny: 21,
  targetStocks: 0.25,
  targetBonds: 0.25,
  targetGold: 0.25,
  targetCash: 0.25,
  threshold: 0.05,
};

export function loadPortfolioData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Load failed", err);
    return null;
  }
}

export function savePortfolioData(data) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Save failed", err);
  }
}

export function loadSyncSettings() {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    return raw
      ? JSON.parse(raw)
      : { token: "", gistId: "", enabled: false, lastSyncAt: null };
  } catch {
    return { token: "", gistId: "", enabled: false, lastSyncAt: null };
  }
}

export function saveSyncSettings(settings) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
