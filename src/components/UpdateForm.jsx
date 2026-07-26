import { useState } from "react";
import SmartInput from "./SmartInput";
import QuickAdjustPopover from "./QuickAdjustPopover";
import { formatCurrency } from "../lib/format";

const INVESTMENT_FIELDS = [
  { key: "stocks", label: "股票", en: "Stocks", hint: "证券 App「投信」合计評価額" },
  { key: "bonds", label: "长期债券", en: "Long-term Bonds", hint: "债券 ETF + PayPay 债券评价额" },
  { key: "gold", label: "黄金", en: "Gold", hint: "黄金基金 + PayPay 黄金评价额" },
];

export default function UpdateForm({ editing, settings, onSave, onCancel }) {
  const [values, setValues] = useState({
    stocks: editing.stocks ?? 0,
    bonds: editing.bonds ?? 0,
    gold: editing.gold ?? 0,
    cashCNY: editing.cashCNY ?? 0,
  });
  const priorCashJPY = editing.cashJPY ?? 0;
  const [activities, setActivities] = useState([]);
  const [popoverField, setPopoverField] = useState(null);

  const netActivity = activities.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const newCashJPY = priorCashJPY + netActivity;

  const setField = (key, value) => setValues({ ...values, [key]: value });

  const addActivity = (partial) => {
    const id = Date.now() + Math.random();
    setActivities([...activities, { id, amount: partial?.amount ?? 0, note: partial?.note ?? "" }]);
  };
  const updateActivity = (id, patch) => {
    setActivities(activities.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const removeActivity = (id) => setActivities(activities.filter((a) => a.id !== id));

  const computedTotal = values.stocks + values.bonds + values.gold + newCashJPY + values.cashCNY * settings.jpyPerCny;

  const handleSave = () => {
    onSave({
      stocks: values.stocks,
      bonds: values.bonds,
      gold: values.gold,
      cashJPY: newCashJPY,
      cashCNY: values.cashCNY,
      activities: activities.map((a) => ({ amount: a.amount, note: a.note })),
    });
  };

  return (
    <div className="update">
      <div className="update-head">
        <h1>Update Values</h1>
        <p className="update-sub">投资三项填证券 App 当前「评价额」 · 现金用活动流记录工资 / 转账 / 加仓 / 提现</p>
      </div>

      <div className="update-section-label">
        <span className="sec-num">01</span>
        <span className="sec-title">Investments · 投资市值（覆盖式）</span>
      </div>
      <div className="update-form">
        {INVESTMENT_FIELDS.map((field) => (
          <div key={field.key} className="upd-row">
            <div className="upd-meta">
              <div className="upd-label">{field.label}</div>
              <div className="upd-en">{field.en}</div>
              <div className="upd-hint">{field.hint}</div>
            </div>
            <div className="upd-input-col">
              <div className="upd-input-wrap">
                <span className="upd-cur">¥</span>
                <SmartInput
                  className="upd-input"
                  value={values[field.key]}
                  onChange={(v) => setField(field.key, v)}
                  onFocus={(e) => e.target.select()}
                />
                <button type="button" className="upd-add-btn" title="加/减一笔" onClick={() => setPopoverField(field.key)}>
                  ＋
                </button>
                <span className="upd-cur-label">JPY</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="update-section-label">
        <span className="sec-num">02</span>
        <span className="sec-title">Cash JPY · 现金活动（增量式）</span>
      </div>
      <div className="update-form cash-form">
        <div className="cash-summary-row">
          <div className="cash-summary-cell">
            <div className="cash-cell-label">上次余额</div>
            <div className="cash-cell-value muted">{formatCurrency(priorCashJPY)}</div>
          </div>
          <div className="cash-summary-cell">
            <div className="cash-cell-label">本次净额</div>
            <div className={`cash-cell-value ${netActivity >= 0 ? "pos" : "neg"}`}>
              {netActivity >= 0 ? "+ " : "− "}
              {formatCurrency(Math.abs(netActivity))}
            </div>
          </div>
          <div className="cash-summary-cell cash-summary-final">
            <div className="cash-cell-label">新余额</div>
            <div className="cash-cell-value">{formatCurrency(newCashJPY)}</div>
          </div>
        </div>
        <div className="cash-activities">
          {activities.length === 0 && <div className="cash-empty">本次还没有活动 · 用下方按钮添加一条</div>}
          {activities.map((activity) => {
            const amount = Number(activity.amount) || 0;
            const isNegative = amount < 0;
            return (
              <div key={activity.id} className={`activity-row ${isNegative ? "neg" : "pos"}`}>
                <div className="act-sign-toggle">
                  <button
                    type="button"
                    className={`act-sign ${isNegative ? "" : "on"}`}
                    onClick={() => updateActivity(activity.id, { amount: Math.abs(amount) })}
                    title="收入 / 转入"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={`act-sign ${isNegative ? "on" : ""}`}
                    onClick={() => updateActivity(activity.id, { amount: -Math.abs(amount) })}
                    title="支出 / 转出"
                  >
                    −
                  </button>
                </div>
                <div className="act-amount-wrap">
                  <span className="act-cur">¥</span>
                  <SmartInput
                    className="act-input"
                    value={Math.abs(amount)}
                    onChange={(v) => updateActivity(activity.id, { amount: isNegative ? -v : v })}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <input
                  type="text"
                  className="act-note"
                  placeholder="备注（如：工资 / 中国汇款 / 买NISA）"
                  value={activity.note}
                  onChange={(e) => updateActivity(activity.id, { note: e.target.value })}
                />
                <button type="button" className="act-remove" title="删除" onClick={() => removeActivity(activity.id)}>
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <div className="cash-add-row">
          <div className="cash-add-label">添加活动：</div>
          <div className="cash-add-presets">
            <button onClick={() => addActivity({ note: "工资" })}>+ 工资</button>
            <button onClick={() => addActivity({ note: "中国汇款" })}>+ 汇款</button>
            <button onClick={() => addActivity({ note: "买 NISA", amount: 0 })}>− 买 NISA</button>
            <button onClick={() => addActivity({ note: "生活支出", amount: 0 })}>− 支出</button>
            <button onClick={() => addActivity({})}>+ 自定义</button>
          </div>
        </div>
      </div>

      <div className="update-section-label">
        <span className="sec-num">03</span>
        <span className="sec-title">Cash CNY · 人民币现金（覆盖式）</span>
      </div>
      <div className="update-form">
        <div className="upd-row">
          <div className="upd-meta">
            <div className="upd-label">现金</div>
            <div className="upd-en">Cash (CNY)</div>
            <div className="upd-hint">人民币账户余额（汇率 1 CNY = ¥{settings.jpyPerCny}）</div>
          </div>
          <div className="upd-input-col">
            <div className="upd-input-wrap">
              <span className="upd-cur">¥</span>
              <SmartInput
                className="upd-input"
                value={values.cashCNY}
                onChange={(v) => setField("cashCNY", v)}
                onFocus={(e) => e.target.select()}
              />
              <button type="button" className="upd-add-btn" title="加/减一笔" onClick={() => setPopoverField("cashCNY")}>
                ＋
              </button>
              <span className="upd-cur-label">CNY</span>
            </div>
          </div>
        </div>
      </div>

      <div className="update-form" style={{ padding: 0, background: "transparent", border: "none" }}>
        <div className="upd-total">
          <span className="upd-total-label">Computed Total</span>
          <span className="upd-total-value">{formatCurrency(computedTotal)}</span>
        </div>
      </div>

      <div className="update-actions">
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave}>
          Save &amp; Snapshot
        </button>
      </div>

      {popoverField && (
        <QuickAdjustPopover
          currentValue={values[popoverField] ?? 0}
          onApply={(v) => setField(popoverField, v)}
          onClose={() => setPopoverField(null)}
        />
      )}
    </div>
  );
}
