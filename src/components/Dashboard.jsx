import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ReferenceLine } from "recharts";
import AnimatedValue from "./AnimatedValue";
import { CATEGORY_COLORS, formatCurrency, formatPercent } from "../lib/format";

function AllocationTooltip({ active, payload, total }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const share = total > 0 ? item.value / total : 0;
  return (
    <div className="tt">
      <div className="tt-label">{item.name}</div>
      <div className="tt-value">{formatCurrency(item.value)}</div>
      <div className="tt-sub">{formatPercent(share)} of total</div>
    </div>
  );
}

function DeviationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="tt">
      <div className="tt-label">{item.payload.name}</div>
      <div className="tt-value">
        {item.value >= 0 ? "+" : ""}
        {item.value.toFixed(2)} pp
      </div>
    </div>
  );
}

const BALANCE_HINTS = [
  [0.9, "✓ 接近完美配比"],
  [0.7, "稳步接近目标"],
  [0.4, "正在分配中"],
];

function balanceHint(score) {
  for (const [threshold, hint] of BALANCE_HINTS) {
    if (score > threshold) return hint;
  }
  return "起步阶段 · 现金占比仍高";
}

export default function Dashboard({ computed, holdings, settings, onUpdate }) {
  const { total, cats, mom, balanceScore, totalDev } = computed;
  const pieData = cats.map((c) => ({ name: c.label, value: c.value, key: c.key }));
  const devData = cats.map((c) => ({
    name: c.label,
    dev: c.dev * 100,
    fill: c.inThreshold ? "#7a8b6f" : c.dev > 0 ? "#b8694e" : "#4e7fb8",
  }));

  return (
    <div className="dash">
      <section className="hero">
        <div className="hero-row">
          <div className="hero-block hero-total">
            <div className="hero-label">Total Assets</div>
            <AnimatedValue value={total} className="hero-value" />
            <div className="hero-sub-row">
              <span className="hero-sub">
                ≈ ¥{Math.round(total / settings.jpyPerCny).toLocaleString("en-US")} CNY
              </span>
              {mom && (
                <span className={`hero-delta ${mom.delta >= 0 ? "pos" : "neg"}`}>
                  <span className="delta-arrow">{mom.delta >= 0 ? "▲" : "▼"}</span>
                  <span className="delta-value">{formatCurrency(Math.abs(mom.delta))}</span>
                  <span className="delta-pct">
                    ({mom.delta >= 0 ? "+" : ""}
                    {(mom.deltaPct * 100).toFixed(2)}%)
                  </span>
                  <span className="delta-since">vs {mom.ym}</span>
                </span>
              )}
            </div>
          </div>
          <button className="hero-cta" onClick={onUpdate}>
            <span>Update Market Values</span>
            <span className="arrow">→</span>
          </button>
        </div>
        <div
          className="balance-bar-wrap"
          title={`Total deviation: ${(totalDev * 100).toFixed(1)} percentage points · 0 = perfect 25/25/25/25`}
        >
          <div className="balance-bar-label">
            <span className="bal-name">Balance Score</span>
            <span className="bal-num">
              {(balanceScore * 100).toFixed(0)}
              <span className="bal-num-unit">/100</span>
            </span>
          </div>
          <div className="balance-bar-track">
            <div className="balance-bar-fill" style={{ width: `${balanceScore * 100}%` }} />
          </div>
          <div className="balance-bar-hint">{balanceHint(balanceScore)}</div>
        </div>
        <div className="kpi-grid">
          {cats.map((c) => (
            <div key={c.key} className={`kpi ${c.action}`}>
              <div className="kpi-top">
                <span className="kpi-label">{c.label}</span>
                <span className="kpi-share">{formatPercent(c.share)}</span>
              </div>
              <div className="kpi-value">{formatCurrency(c.value)}</div>
              <div className="kpi-bar">
                <div className="kpi-bar-target" style={{ left: `${c.target * 100}%` }} />
                <div className="kpi-bar-fill" style={{ width: `${Math.min(100, c.share * 100)}%` }} />
              </div>
              <div className="kpi-bot">
                <span className="kpi-target">target {formatPercent(c.target, 0)}</span>
                <span className={`kpi-dev ${c.dev >= 0 ? "pos" : "neg"}`}>
                  {c.dev >= 0 ? "+" : ""}
                  {formatPercent(c.dev)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card rebalance">
        <div className="card-head">
          <h2>Rebalance Recommendations</h2>
          <span className="card-sub">Threshold ±{formatPercent(settings.threshold, 0)}</span>
        </div>
        <div className="reb-list">
          {cats.map((c) => (
            <div key={c.key} className={`reb-row reb-${c.action}`}>
              <div className="reb-label">
                <div className="reb-cat">{c.label}</div>
                <div className="reb-en">{c.subtitle}</div>
              </div>
              <div className="reb-numbers">
                <div className="reb-now">
                  <span className="lbl">now</span>
                  <span className="val">{formatCurrency(c.value)}</span>
                  <span className="pct">{formatPercent(c.share)}</span>
                </div>
                <div className="reb-arrow">→</div>
                <div className="reb-target">
                  <span className="lbl">target</span>
                  <span className="val">{formatCurrency(c.targetAmt)}</span>
                  <span className="pct">{formatPercent(c.target)}</span>
                </div>
              </div>
              <div className="reb-action">
                {c.action === "hold" && <span className="badge hold">✓ Within threshold</span>}
                {c.action === "add" && <span className="badge add">＋ Add {formatCurrency(c.diff)}</span>}
                {c.action === "reduce" && <span className="badge reduce">− Reduce {formatCurrency(-c.diff)}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="charts-row">
        <div className="card chart-card">
          <div className="card-head">
            <h2>Allocation</h2>
            <span className="card-sub">current</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#0f0f0e"
                  strokeWidth={3}
                >
                  {pieData.map((c) => (
                    <Cell key={c.key} fill={CATEGORY_COLORS[c.key]} />
                  ))}
                </Pie>
                <Tooltip content={<AllocationTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {cats.map((c) => (
              <div key={c.key} className="legend-item">
                <span className="dot" style={{ background: CATEGORY_COLORS[c.key] }} />
                <span className="legend-label">{c.label}</span>
                <span className="legend-pct">{formatPercent(c.share)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-head">
            <h2>Deviation from Target</h2>
            <span className="card-sub">percentage points</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={devData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis
                  dataKey="name"
                  stroke="#7a7368"
                  tick={{ fontSize: 11, fontFamily: "Georgia, serif" }}
                  axisLine={{ stroke: "#3a3833" }}
                />
                <YAxis
                  stroke="#7a7368"
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={{ stroke: "#3a3833" }}
                  tickFormatter={(v) => v.toFixed(0) + "%"}
                />
                <ReferenceLine y={settings.threshold * 100} stroke="#7a8b6f" strokeDasharray="3 3" />
                <ReferenceLine y={-settings.threshold * 100} stroke="#7a8b6f" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#5a554d" />
                <Tooltip content={<DeviationTooltip />} cursor={{ fill: "rgba(232,227,216,0.04)" }} />
                <Bar dataKey="dev" radius={[2, 2, 0, 0]}>
                  {devData.map((c, i) => (
                    <Cell key={i} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card breakdown">
        <div className="card-head">
          <h2>Holdings Breakdown</h2>
          <span className="card-sub">{holdings.updatedAt ? `as of ${holdings.updatedAt.slice(0, 10)}` : "no updates yet"}</span>
        </div>
        <div className="table-scroll">
          <table className="bd-table">
            <thead>
              <tr>
                <th className="left">Category</th>
                <th>Currency</th>
                <th>Value</th>
                <th>JPY Equivalent</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="left">
                  <span className="dot inline" style={{ background: CATEGORY_COLORS.stocks }} />
                  股票 Stocks
                </td>
                <td>JPY</td>
                <td className="num">{formatCurrency(holdings.stocks)}</td>
                <td className="num">{formatCurrency(holdings.stocks)}</td>
                <td className="num">{formatPercent(total ? holdings.stocks / total : 0)}</td>
              </tr>
              <tr>
                <td className="left">
                  <span className="dot inline" style={{ background: CATEGORY_COLORS.bonds }} />
                  长期债券 Long Bonds
                </td>
                <td>JPY</td>
                <td className="num">{formatCurrency(holdings.bonds)}</td>
                <td className="num">{formatCurrency(holdings.bonds)}</td>
                <td className="num">{formatPercent(total ? holdings.bonds / total : 0)}</td>
              </tr>
              <tr>
                <td className="left">
                  <span className="dot inline" style={{ background: CATEGORY_COLORS.gold }} />
                  黄金 Gold
                </td>
                <td>JPY</td>
                <td className="num">{formatCurrency(holdings.gold)}</td>
                <td className="num">{formatCurrency(holdings.gold)}</td>
                <td className="num">{formatPercent(total ? holdings.gold / total : 0)}</td>
              </tr>
              <tr>
                <td className="left sub-row">
                  <span className="dot inline" style={{ background: CATEGORY_COLORS.cash }} />
                  现金 Cash (JPY)
                </td>
                <td>JPY</td>
                <td className="num">{formatCurrency(holdings.cashJPY)}</td>
                <td className="num">{formatCurrency(holdings.cashJPY)}</td>
                <td className="num">{formatPercent(total ? holdings.cashJPY / total : 0)}</td>
              </tr>
              <tr>
                <td className="left sub-row">
                  <span className="dot inline" style={{ background: CATEGORY_COLORS.cash, opacity: 0.6 }} />
                  现金 Cash (CNY)
                </td>
                <td>CNY</td>
                <td className="num">¥{(holdings.cashCNY || 0).toLocaleString("en-US")}</td>
                <td className="num">{formatCurrency(holdings.cashCNY * settings.jpyPerCny)}</td>
                <td className="num">
                  {formatPercent(total ? (holdings.cashCNY * settings.jpyPerCny) / total : 0)}
                </td>
              </tr>
              <tr className="total-row">
                <td className="left">Total</td>
                <td>—</td>
                <td className="num">—</td>
                <td className="num">{formatCurrency(total)}</td>
                <td className="num">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
