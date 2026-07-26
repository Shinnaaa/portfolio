import { useState } from "react";
import { formatPercent } from "../lib/format";

const TARGET_FIELDS = [
  { key: "targetStocks", label: "股票 Stocks" },
  { key: "targetBonds", label: "长期债券 Long Bonds" },
  { key: "targetGold", label: "黄金 Gold" },
  { key: "targetCash", label: "现金 Cash" },
];

export default function Settings({ settings, onSave, sync, syncStatus, syncError, onConnectSync, onDisconnectSync, onManualPull }) {
  const [local, setLocal] = useState({ ...settings });
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);

  const targetSum = local.targetStocks + local.targetBonds + local.targetGold + local.targetCash;
  const targetsValid = Math.abs(targetSum - 1) < 0.001;

  const setNumberField = (key, raw) => {
    const num = raw === "" ? 0 : Number(raw);
    if (!isNaN(num)) setLocal({ ...local, [key]: num });
  };
  const setPercentField = (key, raw) => {
    const num = raw === "" ? 0 : Number(raw);
    if (!isNaN(num)) setLocal({ ...local, [key]: num / 100 });
  };

  return (
    <div className="settings">
      <div className="update-head">
        <h1>Settings</h1>
        <p className="update-sub">汇率、目标比例、再平衡阈值、跨设备同步。</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Cloud Sync</h2>
          <span className={`card-sub sync-status-${syncStatus}`}>
            {sync.enabled
              ? syncStatus === "syncing"
                ? "Syncing…"
                : syncStatus === "err"
                ? "Error"
                : sync.lastSyncAt
                ? `Last sync ${new Date(sync.lastSyncAt).toLocaleString()}`
                : "Connected"
              : "Not connected"}
          </span>
        </div>
        {sync.enabled ? (
          <>
            <p className="sync-text">
              已连接到 Gist <code>{sync.gistId.slice(0, 8)}…</code>
              {sync.lastSyncAt && <> · 最后同步 {new Date(sync.lastSyncAt).toLocaleString()}</>}
            </p>
            <p className="sync-text" style={{ fontSize: 13, color: "#7a7368" }}>
              数据每次更新后自动推送到 Gist（约 1.5 秒延迟）。在另一台设备上打开页面会自动从 Gist 拉取最新数据。
              如果手动拉取失败，可以点导航栏的 <strong>Synced</strong> 徽章手动刷新。
            </p>
            <div className="sync-actions">
              <button className="btn-ghost" onClick={onManualPull} disabled={syncStatus === "syncing"}>
                ↓ Pull from Gist
              </button>
              <button className="btn-ghost danger" onClick={onDisconnectSync}>
                Disconnect
              </button>
            </div>
            {syncError && <div className="sync-error">{syncError}</div>}
          </>
        ) : (
          <>
            <p className="sync-text">
              用 GitHub Gist 在多设备间自动同步数据。Token 仅保存在本机浏览器，不会上传到任何服务器。
              数据存放在你 GitHub 账号下的<strong>私密 Gist</strong>，只有你能访问。
            </p>
            <ol className="sync-steps">
              <li>
                访问{" "}
                <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noreferrer">
                  github.com/settings/tokens
                </a>
              </li>
              <li>
                点 <strong>Generate new token (Fine-grained)</strong>
              </li>
              <li>Token name 随便填（如 "Portfolio Sync"），Expiration 选 1 年或 No expiration</li>
              <li>
                <strong>Account permissions → Gists → Read and write</strong>
              </li>
              <li>
                Generate token，复制开头是 <code>github_pat_</code> 的字符串
              </li>
              <li>粘贴到下面 →</li>
            </ol>
            <div className="set-row sync-input-row">
              <div className="upd-input-wrap" style={{ flex: 1 }}>
                <input
                  type={showToken ? "text" : "password"}
                  className="upd-input"
                  placeholder="github_pat_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="upd-cur-label"
                  style={{ cursor: "pointer", background: "none", border: "none", borderLeft: "1px solid #2a2823" }}
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <div className="sync-actions">
              <button className="btn-primary" disabled={!tokenInput || syncStatus === "syncing"} onClick={() => onConnectSync(tokenInput.trim())}>
                {syncStatus === "syncing" ? "Connecting…" : "Connect Gist Sync"}
              </button>
            </div>
            {syncError && <div className="sync-error">{syncError}</div>}
          </>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Exchange Rate</h2>
        </div>
        <div className="set-row">
          <div className="set-meta">
            <div className="set-label">JPY per CNY</div>
            <div className="set-en">1 人民币 = ? 日元</div>
          </div>
          <div className="upd-input-wrap">
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              className="upd-input"
              value={local.jpyPerCny}
              onChange={(e) => setNumberField("jpyPerCny", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Target Allocation</h2>
          <span className={`card-sub ${targetsValid ? "" : "warn"}`}>
            sum {formatPercent(targetSum)} {targetsValid ? "✓" : "— must equal 100%"}
          </span>
        </div>
        {TARGET_FIELDS.map((field) => (
          <div key={field.key} className="set-row">
            <div className="set-meta">
              <div className="set-label">{field.label}</div>
            </div>
            <div className="upd-input-wrap">
              <input
                type="number"
                step="1"
                inputMode="decimal"
                className="upd-input"
                value={(local[field.key] * 100).toFixed(1)}
                onChange={(e) => setPercentField(field.key, e.target.value)}
              />
              <span className="upd-cur-label">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Rebalance Threshold</h2>
        </div>
        <div className="set-row">
          <div className="set-meta">
            <div className="set-label">Deviation tolerance</div>
            <div className="set-en">实际偏离目标超过此值时提示再平衡</div>
          </div>
          <div className="upd-input-wrap">
            <input
              type="number"
              step="1"
              inputMode="decimal"
              className="upd-input"
              value={(local.threshold * 100).toFixed(1)}
              onChange={(e) => setPercentField("threshold", e.target.value)}
            />
            <span className="upd-cur-label">%</span>
          </div>
        </div>
      </div>

      <div className="update-actions">
        <button className="btn-primary" disabled={!targetsValid} onClick={() => onSave(local)}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
