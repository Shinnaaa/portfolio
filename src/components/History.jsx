import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { CATEGORY_COLORS, TOOLTIP_LABELS, formatCurrency } from "../lib/format";

function TotalOverTimeTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      {payload.map((item) => (
        <div className="tt-row" key={item.dataKey}>
          <span className="tt-key" style={{ color: item.color }}>
            {TOOLTIP_LABELS[item.dataKey] || item.dataKey}
          </span>
          <span className="tt-val">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DriftTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const sum = payload.reduce((s, item) => s + (item.value || 0), 0);
  return (
    <div className="tt">
      <div className="tt-label">{label}</div>
      {payload.map((item) => {
        const pct = sum > 0 ? (item.value / sum) * 100 : 0;
        return (
          <div className="tt-row" key={item.dataKey}>
            <span className="tt-key" style={{ color: item.color }}>
              {TOOLTIP_LABELS[item.dataKey] || item.dataKey}
            </span>
            <span className="tt-val">{pct.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function History({ snapshots, onClear, onExport, onImport }) {
  const rows = snapshots.map((snap) => ({
    ...snap,
    total: snap.stocks + snap.bonds + snap.gold + snap.cash,
  }));

  return (
    <div className="history">
      <div className="update-head">
        <h1>History</h1>
        <p className="update-sub">
          {rows.length === 0 ? "尚无快照。每次保存市值时，会自动按月记录一条快照。" : `共 ${rows.length} 条月度快照。`}
        </p>
      </div>

      {rows.length > 0 && (
        <>
          <div className="card">
            <div className="card-head">
              <h2>Total Assets Over Time</h2>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rows} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid stroke="#2a2823" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="ym" stroke="#7a7368" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#3a3833" }} />
                  <YAxis
                    stroke="#7a7368"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={{ stroke: "#3a3833" }}
                    tickFormatter={(v) => "¥" + (v / 10000).toFixed(0) + "万"}
                  />
                  <Tooltip content={<TotalOverTimeTooltip />} />
                  <Line type="monotone" dataKey="total" stroke="#c8a96a" strokeWidth={2.5} dot={{ fill: "#c8a96a", r: 4, stroke: "#0f0f0e", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="stocks" stroke={CATEGORY_COLORS.stocks} strokeWidth={1.5} dot={false} opacity={0.7} />
                  <Line type="monotone" dataKey="bonds" stroke={CATEGORY_COLORS.bonds} strokeWidth={1.5} dot={false} opacity={0.7} />
                  <Line type="monotone" dataKey="gold" stroke={CATEGORY_COLORS.gold} strokeWidth={1.5} dot={false} opacity={0.7} />
                  <Line type="monotone" dataKey="cash" stroke={CATEGORY_COLORS.cash} strokeWidth={1.5} dot={false} opacity={0.7} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              <div className="legend-item">
                <span className="dot" style={{ background: "#c8a96a" }} />
                <span className="legend-label">Total</span>
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.stocks }} />
                <span className="legend-label">股票</span>
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.bonds }} />
                <span className="legend-label">债券</span>
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.gold }} />
                <span className="legend-label">黄金</span>
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.cash }} />
                <span className="legend-label">现金</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Allocation Drift</h2>
              <span className="card-sub">how your mix evolved</span>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={rows} margin={{ top: 20, right: 30, left: 0, bottom: 10 }} stackOffset="expand">
                  <defs>
                    <linearGradient id="g-stocks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.stocks} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.stocks} stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="g-bonds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.bonds} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.bonds} stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.gold} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.gold} stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="g-cash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS.cash} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={CATEGORY_COLORS.cash} stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2a2823" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="ym" stroke="#7a7368" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#3a3833" }} />
                  <YAxis
                    stroke="#7a7368"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={{ stroke: "#3a3833" }}
                    tickFormatter={(v) => Math.round(v * 100) + "%"}
                    domain={[0, 1]}
                  />
                  <Tooltip content={<DriftTooltip />} />
                  <ReferenceLine y={0.25} stroke="#e8e3d8" strokeDasharray="2 2" strokeOpacity={0.3} />
                  <ReferenceLine y={0.5} stroke="#e8e3d8" strokeDasharray="2 2" strokeOpacity={0.3} />
                  <ReferenceLine y={0.75} stroke="#e8e3d8" strokeDasharray="2 2" strokeOpacity={0.3} />
                  <Area type="monotone" dataKey="stocks" stackId="1" stroke={CATEGORY_COLORS.stocks} fill="url(#g-stocks)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="bonds" stackId="1" stroke={CATEGORY_COLORS.bonds} fill="url(#g-bonds)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="gold" stackId="1" stroke={CATEGORY_COLORS.gold} fill="url(#g-gold)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="cash" stackId="1" stroke={CATEGORY_COLORS.cash} fill="url(#g-cash)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.stocks }} />
                <span className="legend-label">股票</span>
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.bonds }} />
                <span className="legend-label">债券</span>
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.gold }} />
                <span className="legend-label">黄金</span>
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS.cash }} />
                <span className="legend-label">现金</span>
              </div>
              <div className="legend-item" style={{ marginLeft: "auto", opacity: 0.6 }}>
                <span style={{ display: "inline-block", width: 14, height: 1, borderTop: "1px dashed #e8e3d8", marginRight: 6 }} />
                <span className="legend-label">25 / 50 / 75% guides</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Snapshot Log</h2>
            </div>
            <div className="table-scroll">
              <table className="bd-table">
                <thead>
                  <tr>
                    <th className="left">Month</th>
                    <th>Stocks</th>
                    <th>Bonds</th>
                    <th>Gold</th>
                    <th>Cash</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.ym}>
                      <td className="left mono">{r.ym}</td>
                      <td className="num">{formatCurrency(r.stocks)}</td>
                      <td className="num">{formatCurrency(r.bonds)}</td>
                      <td className="num">{formatCurrency(r.gold)}</td>
                      <td className="num">{formatCurrency(r.cash)}</td>
                      <td className="num bold">{formatCurrency(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="card sync-card">
        <div className="card-head">
          <h2>Data Sync</h2>
          <span className="card-sub">手动版</span>
        </div>
        <p className="sync-text">
          数据保存在浏览器 localStorage 中。要在手机/电脑间同步，请在一台设备上 <strong>Export</strong>，
          把生成的 JSON 文件放进 iCloud Drive / Google Drive， 再在另一台设备上 <strong>Import</strong>。建议每月更新后导出一次作备份。
        </p>
        <div className="sync-actions">
          <button className="btn-primary" onClick={onExport}>
            ↓ Export JSON
          </button>
          <button className="btn-ghost" onClick={onImport}>
            ↑ Import JSON
          </button>
          {snapshots.length > 0 && (
            <button className="btn-ghost danger" onClick={onClear}>
              Clear Snapshots
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
