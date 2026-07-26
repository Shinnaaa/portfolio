import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dashboard from "./components/Dashboard";
import UpdateForm from "./components/UpdateForm";
import AllocateFunds from "./components/AllocateFunds";
import Settings from "./components/Settings";
import History from "./components/History";
import { computePortfolio } from "./lib/compute";
import { todayISO, currentYearMonth } from "./lib/format";
import {
  DATA_VERSION,
  DEFAULT_HOLDINGS,
  DEFAULT_SETTINGS,
  loadPortfolioData,
  savePortfolioData,
  loadSyncSettings,
  saveSyncSettings,
} from "./lib/storage";
import { getOrCreateGist, readGist, updateGist, verifyToken, GIST_FILENAME } from "./lib/gistSync";

function loadPrivacyMode() {
  try {
    return localStorage.getItem("pp:privacy") === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [snapshots, setSnapshots] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [privacy, setPrivacy] = useState(loadPrivacyMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const togglePrivacy = () => {
    const next = !privacy;
    setPrivacy(next);
    try {
      localStorage.setItem("pp:privacy", next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  const [sync, setSync] = useState(loadSyncSettings());
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncError, setSyncError] = useState(null);
  const skipNextPush = useRef(false);
  const hasSyncedOnce = useRef(false);
  const [toast, setToast] = useState(null);

  // Load persisted data once on mount.
  useEffect(() => {
    const data = loadPortfolioData();
    if (data) {
      if (data.holdings) setHoldings({ ...DEFAULT_HOLDINGS, ...data.holdings });
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (data.snapshots) setSnapshots(data.snapshots);
    }
    setLoaded(true);
  }, []);

  // Pull once from Gist on first load if sync is enabled.
  useEffect(() => {
    if (!loaded || !sync.enabled || !sync.token || !sync.gistId || hasSyncedOnce.current) return;
    hasSyncedOnce.current = true;
    (async () => {
      setSyncStatus("syncing");
      try {
        const { data, updatedAt } = await readGist(sync.token, sync.gistId);
        if (data.holdings) {
          skipNextPush.current = true;
          setHoldings({ ...DEFAULT_HOLDINGS, ...data.holdings });
        }
        if (data.settings) {
          skipNextPush.current = true;
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
        if (Array.isArray(data.snapshots)) {
          skipNextPush.current = true;
          setSnapshots(data.snapshots);
        }
        const nextSync = { ...sync, lastSyncAt: updatedAt };
        setSync(nextSync);
        saveSyncSettings(nextSync);
        setSyncStatus("ok");
      } catch (err) {
        setSyncStatus("err");
        setSyncError(err.message);
      }
    })();
  }, [loaded, sync.enabled, sync.token, sync.gistId]);

  // Persist to localStorage on every change, once initial load has happened.
  useEffect(() => {
    if (!loaded) return;
    savePortfolioData({ version: DATA_VERSION, holdings, settings, snapshots, savedAt: new Date().toISOString() });
  }, [holdings, settings, snapshots, loaded]);

  // Debounced push to Gist. Skipped once right after a pull, so we don't
  // immediately echo back what we just received.
  useEffect(() => {
    if (!loaded || !sync.enabled || !sync.token || !sync.gistId) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const { updatedAt } = await updateGist(sync.token, sync.gistId, {
          version: DATA_VERSION,
          holdings,
          settings,
          snapshots,
          savedAt: new Date().toISOString(),
        });
        const nextSync = { ...sync, lastSyncAt: updatedAt };
        setSync(nextSync);
        saveSyncSettings(nextSync);
        setSyncStatus("ok");
        setSyncError(null);
      } catch (err) {
        setSyncStatus("err");
        setSyncError(err.message);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [holdings, settings, snapshots, loaded, sync.enabled, sync.token, sync.gistId]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  const exportJSON = () => {
    const payload = { version: DATA_VERSION, exportedAt: new Date().toISOString(), holdings, settings, snapshots };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `portfolio-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("已导出 portfolio JSON");
  };

  const triggerImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
      if (!window.confirm("确认导入此文件？当前数据将被覆盖（建议先 Export 备份）。")) {
        e.target.value = "";
        return;
      }
      if (parsed.holdings) setHoldings({ ...DEFAULT_HOLDINGS, ...parsed.holdings });
      if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      if (Array.isArray(parsed.snapshots)) setSnapshots(parsed.snapshots);
      showToast("已导入数据");
    } catch (err) {
      showToast("导入失败：" + err.message, "err");
    }
    e.target.value = "";
  };

  const connectSync = useCallback(
    async (token) => {
      if (!token) return;
      setSyncStatus("syncing");
      setSyncError(null);
      try {
        await verifyToken(token);
        const gist = await getOrCreateGist(token, sync.gistId);
        const nextSync = { token, gistId: gist.id, enabled: true, lastSyncAt: gist.updated_at };
        setSync(nextSync);
        saveSyncSettings(nextSync);

        const remoteData = JSON.parse(gist.files[GIST_FILENAME].content || "{}");
        const remoteHasData =
          remoteData.holdings &&
          (remoteData.holdings.stocks || remoteData.holdings.bonds || remoteData.holdings.gold || remoteData.holdings.cash);
        const localHasData = holdings.stocks || holdings.bonds || holdings.gold || holdings.cash || snapshots.length > 0;

        const pullRemote = () => {
          if (remoteData.holdings) {
            skipNextPush.current = true;
            setHoldings({ ...DEFAULT_HOLDINGS, ...remoteData.holdings });
          }
          if (remoteData.settings) {
            skipNextPush.current = true;
            setSettings({ ...DEFAULT_SETTINGS, ...remoteData.settings });
          }
          if (Array.isArray(remoteData.snapshots)) {
            skipNextPush.current = true;
            setSnapshots(remoteData.snapshots);
          }
        };
        const pushLocal = () =>
          updateGist(token, gist.id, { version: DATA_VERSION, holdings, settings, snapshots, savedAt: new Date().toISOString() });

        if (remoteHasData && localHasData) {
          const useRemote = window.confirm(
            "远端 Gist 已有数据，本地也有数据。\n\n点「确定」= 用远端数据覆盖本地（推荐第二台设备选这个）\n点「取消」= 用本地数据覆盖远端（第一次设置时选这个）"
          );
          if (useRemote) pullRemote();
          else await pushLocal();
        } else if (remoteHasData) {
          pullRemote();
        } else if (localHasData) {
          await pushLocal();
        }

        hasSyncedOnce.current = true;
        setSyncStatus("ok");
        showToast("Gist 同步已连接");
      } catch (err) {
        setSyncStatus("err");
        setSyncError(err.message);
        showToast("连接失败：" + err.message, "err");
      }
    },
    [sync.gistId, holdings, settings, snapshots]
  );

  const disconnectSync = () => {
    if (!window.confirm("断开 Gist 同步？本地数据保留，但不再自动同步。Token 也会从浏览器删除。")) return;
    const nextSync = { token: "", gistId: "", enabled: false, lastSyncAt: null };
    setSync(nextSync);
    saveSyncSettings(nextSync);
    setSyncStatus("idle");
    showToast("已断开同步");
  };

  const manualPull = async () => {
    if (!sync.token || !sync.gistId) return;
    setSyncStatus("syncing");
    try {
      const { data, updatedAt } = await readGist(sync.token, sync.gistId);
      if (data.holdings) {
        skipNextPush.current = true;
        setHoldings({ ...DEFAULT_HOLDINGS, ...data.holdings });
      }
      if (data.settings) {
        skipNextPush.current = true;
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
      if (Array.isArray(data.snapshots)) {
        skipNextPush.current = true;
        setSnapshots(data.snapshots);
      }
      const nextSync = { ...sync, lastSyncAt: updatedAt };
      setSync(nextSync);
      saveSyncSettings(nextSync);
      setSyncStatus("ok");
      showToast("已从 Gist 拉取最新数据");
    } catch (err) {
      setSyncStatus("err");
      setSyncError(err.message);
      showToast("拉取失败：" + err.message, "err");
    }
  };

  const handleSaveUpdate = (update) => {
    const nextHoldings = { ...editingSnapshot, ...update, updatedAt: new Date().toISOString() };
    setHoldings(nextHoldings);
    const ym = currentYearMonth();
    const snapshot = {
      ym,
      date: todayISO(),
      stocks: nextHoldings.stocks,
      bonds: nextHoldings.bonds,
      gold: nextHoldings.gold,
      cash: nextHoldings.cash,
    };
    const withoutThisMonth = snapshots.filter((s) => s.ym !== ym);
    setSnapshots([...withoutThisMonth, snapshot].sort((a, b) => a.ym.localeCompare(b.ym)));
    setActiveTab("dashboard");
    showToast("已保存并记录月度快照");
  };

  const computed = useMemo(() => computePortfolio(holdings, settings, snapshots), [holdings, settings, snapshots]);

  const openUpdate = () => {
    setEditingSnapshot({ ...holdings });
    setActiveTab("update");
  };

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f0f0e",
          color: "#e8e3d8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ opacity: 0.4, letterSpacing: "0.2em", fontSize: 11, textTransform: "uppercase" }}>Loading portfolio…</div>
      </div>
    );
  }

  return (
    <div className="pp-app" data-privacy={privacy ? "1" : "0"}>
      <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={handleImportFile} />
      <header className="pp-header">
        <div className="pp-header-inner">
          <div className="pp-brand">
            <div className="pp-brand-mark">PP</div>
            <div className="pp-brand-text">
              <div className="pp-brand-title">Permanent Portfolio</div>
              <div className="pp-brand-sub">恒久投資組合 · {todayISO()}</div>
            </div>
          </div>
          <nav className="pp-nav">
            <div className="pp-tabs">
              <button className={activeTab === "dashboard" ? "on" : ""} onClick={() => { setActiveTab("dashboard"); setMenuOpen(false); }}>
                Overview
              </button>
              <button className={activeTab === "update" ? "on" : ""} onClick={() => { openUpdate(); setMenuOpen(false); }}>
                Update
              </button>
              <button className={activeTab === "allocate" ? "on" : ""} onClick={() => { setActiveTab("allocate"); setMenuOpen(false); }}>
                Allocate
              </button>
              <button className={activeTab === "history" ? "on" : ""} onClick={() => { setActiveTab("history"); setMenuOpen(false); }}>
                History
              </button>
              <button className={activeTab === "settings" ? "on" : ""} onClick={() => { setActiveTab("settings"); setMenuOpen(false); }}>
                Settings
              </button>
            </div>
            <div className="pp-tools">
              {sync.enabled && (
                <button
                  className={`sync-pill sync-${syncStatus}`}
                  onClick={manualPull}
                  title={syncError || (sync.lastSyncAt ? `Last sync ${new Date(sync.lastSyncAt).toLocaleString()}` : "Click to pull latest")}
                >
                  <span className="sync-dot" />
                  <span className="sync-text">{syncStatus === "syncing" ? "Syncing" : syncStatus === "err" ? "Sync error" : "Synced"}</span>
                </button>
              )}
              <div className="pp-tools-inline">
                <button className={`ic privacy-toggle ${privacy ? "on" : ""}`} title={privacy ? "Show amounts" : "Hide amounts (privacy mode)"} onClick={togglePrivacy}>
                  {privacy ? "◐" : "○"}
                </button>
                <button className="ic" title="Export JSON" onClick={exportJSON}>
                  ↓
                </button>
                <button className="ic" title="Import JSON" onClick={triggerImportClick}>
                  ↑
                </button>
              </div>
              <button className={`ic pp-menu-btn ${menuOpen ? "on" : ""}`} title="More" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
                ⋯
              </button>
            </div>
          </nav>
          {menuOpen && (
            <>
              <div className="pp-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="pp-menu" role="menu">
                <button className={`pp-menu-item ${privacy ? "on" : ""}`} onClick={() => { togglePrivacy(); setMenuOpen(false); }}>
                  <span className="pp-menu-icon">{privacy ? "◐" : "○"}</span>
                  <span className="pp-menu-label">{privacy ? "Show amounts" : "Hide amounts"}</span>
                  <span className="pp-menu-sub">{privacy ? "取消隐私模式" : "隐私模式"}</span>
                </button>
                <button className="pp-menu-item" onClick={() => { exportJSON(); setMenuOpen(false); }}>
                  <span className="pp-menu-icon">↓</span>
                  <span className="pp-menu-label">Export JSON</span>
                  <span className="pp-menu-sub">导出备份</span>
                </button>
                <button className="pp-menu-item" onClick={() => { triggerImportClick(); setMenuOpen(false); }}>
                  <span className="pp-menu-icon">↑</span>
                  <span className="pp-menu-label">Import JSON</span>
                  <span className="pp-menu-sub">导入数据</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="pp-main">
        {activeTab === "dashboard" && <Dashboard computed={computed} holdings={holdings} settings={settings} onUpdate={openUpdate} />}
        {activeTab === "update" && <UpdateForm editing={editingSnapshot} onSave={handleSaveUpdate} onCancel={() => setActiveTab("dashboard")} />}
        {activeTab === "settings" && (
          <Settings
            settings={settings}
            onSave={(s) => { setSettings(s); showToast("设置已保存"); }}
            sync={sync}
            syncStatus={syncStatus}
            syncError={syncError}
            onConnectSync={connectSync}
            onDisconnectSync={disconnectSync}
            onManualPull={manualPull}
          />
        )}
        {activeTab === "allocate" && <AllocateFunds computed={computed} />}
        {activeTab === "history" && (
          <History
            snapshots={snapshots}
            onClear={() => {
              if (window.confirm("清空所有历史快照？此操作不可撤销。")) {
                setSnapshots([]);
                showToast("已清空快照");
              }
            }}
            onExport={exportJSON}
            onImport={triggerImportClick}
          />
        )}
      </main>

      <footer className="pp-footer">
        <span>Harry Browne · 1981</span>
        <span className="pp-dot">·</span>
        <span>Stocks / Bonds / Gold / Cash</span>
        <span className="pp-dot">·</span>
        <span>{holdings.updatedAt ? `Last update ${holdings.updatedAt.slice(0, 10)}` : "Never updated"}</span>
        <span className="pp-dot">·</span>
        <span>Data: localStorage</span>
      </footer>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
