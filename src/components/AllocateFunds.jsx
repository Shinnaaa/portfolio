import { useMemo, useState } from "react";
import { computeAllocation } from "../lib/allocate";
import { CATEGORY_COLORS, formatCurrency } from "../lib/format";

const AMOUNT_PRESETS = [50000, 100000, 200000, 500000];

export default function AllocateFunds({ computed }) {
  const [amount, setAmount] = useState(100000);
  const [mode, setMode] = useState("smart");
  const { total, cats } = computed;

  const { suggestions, projection } = useMemo(
    () => computeAllocation(amount, mode, total, cats),
    [amount, mode, total, cats]
  );

  return (
    <div className="update">
      <div className="update-head">
        <h1>Allocate New Funds</h1>
        <p className="update-sub">输入这次新到账、还没分配的资金（工资/其他收入），自动按当前偏离度智能分配到股票/债券/黄金/现金(MMF) 四项。</p>
      </div>

      <div className="update-form">
        <div className="upd-row">
          <div className="upd-meta">
            <div className="upd-label">新到账金额</div>
            <div className="upd-en">New funds to allocate</div>
            <div className="upd-hint">这次新到账、尚未投入组合的资金（日元）</div>
          </div>
          <div className="upd-input-wrap">
            <span className="upd-cur">¥</span>
            <input
              type="number"
              inputMode="decimal"
              className="upd-input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
            />
            <span className="upd-cur-label">JPY</span>
          </div>
        </div>
        <div className="alloc-presets">
          {AMOUNT_PRESETS.map((preset) => (
            <button key={preset} className={`alloc-preset ${amount === preset ? "on" : ""}`} onClick={() => setAmount(preset)}>
              ¥{(preset / 10000).toFixed(0)}万
            </button>
          ))}
        </div>
        <div className="alloc-mode-row">
          <div className="alloc-mode-label">分配策略</div>
          <div className="alloc-mode-tabs">
            <button className={mode === "smart" ? "on" : ""} onClick={() => setMode("smart")}>
              <span className="m-title">Smart</span>
              <span className="m-sub">优先补齐最低配的</span>
            </button>
            <button className={mode === "proportional" ? "on" : ""} onClick={() => setMode("proportional")}>
              <span className="m-title">Proportional</span>
              <span className="m-sub">按目标比例平均分</span>
            </button>
          </div>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Suggested Allocation</h2>
            <span className="card-sub">{mode === "smart" ? "智能水位填充" : "按目标比例"}</span>
          </div>
          <div className="alloc-results">
            {suggestions.map((s) => {
              const pct = amount > 0 ? (s.amount / amount) * 100 : 0;
              const cat = cats.find((c) => c.key === s.key);
              return (
                <div key={s.key} className="alloc-row">
                  <div className="alloc-row-top">
                    <div className="alloc-row-label">
                      <span className="dot inline" style={{ background: CATEGORY_COLORS[s.key] }} />
                      <span className="alloc-row-name">{s.label}</span>
                      <span className="alloc-row-en">{cat?.subtitle}</span>
                    </div>
                    <div className="alloc-result-amount">{formatCurrency(s.amount)}</div>
                  </div>
                  <div className="alloc-row-bar">
                    <div className="alloc-row-bar-fill" style={{ width: `${pct}%`, background: CATEGORY_COLORS[s.key] }} />
                  </div>
                  <div className="alloc-row-bot">
                    <span className="alloc-pct">{pct.toFixed(1)}% of investment</span>
                    <span className="alloc-effect">
                      {formatCurrency(s.currentValue)} → {formatCurrency(s.newValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {projection && (
            <div className="alloc-projection">
              <div className="alloc-proj-head">After this allocation</div>
              <div className="alloc-proj-bars">
                {projection.map((p) => (
                  <div key={p.key} className="alloc-proj-row">
                    <span className="alloc-proj-name">{p.label}</span>
                    <div className="alloc-proj-bar">
                      <div
                        className="alloc-proj-bar-current"
                        style={{ width: `${p.share * 100}%`, background: CATEGORY_COLORS[p.key], opacity: 0.3 }}
                      />
                      <div className="alloc-proj-bar-new" style={{ width: `${p.newShare * 100}%`, background: CATEGORY_COLORS[p.key] }} />
                      <div className="alloc-proj-bar-target" style={{ left: `${p.target * 100}%` }} />
                    </div>
                    <span className="alloc-proj-pcts">
                      <span className="from">{(p.share * 100).toFixed(1)}%</span>
                      <span className="arr">→</span>
                      <span className="to">{(p.newShare * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="alloc-proj-legend">
                <span>
                  <span className="legend-swatch" style={{ background: "#9a9388", opacity: 0.3 }} />
                  before
                </span>
                <span>
                  <span className="legend-swatch" style={{ background: "#c8a96a" }} />
                  after
                </span>
                <span>
                  <span className="legend-swatch" style={{ background: "#e8e3d8", width: 1.5 }} />
                  target
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
