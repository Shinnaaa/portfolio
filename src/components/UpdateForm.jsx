import { useState } from "react";
import SmartInput from "./SmartInput";
import QuickAdjustPopover from "./QuickAdjustPopover";
import { formatCurrency } from "../lib/format";

const FIELDS = [
  { key: "stocks", label: "股票", en: "Stocks", hint: "证券 App「投信」合计評価額" },
  { key: "bonds", label: "长期债券", en: "Long-term Bonds", hint: "债券 ETF + PayPay 债券评价额" },
  { key: "gold", label: "黄金", en: "Gold", hint: "黄金基金 + PayPay 黄金评价额" },
  { key: "cash", label: "现金", en: "USD MMF", hint: "美元货币基金账户当前市值（自行换算为日元）" },
];

export default function UpdateForm({ editing, onSave, onCancel }) {
  const [values, setValues] = useState({
    stocks: editing.stocks ?? 0,
    bonds: editing.bonds ?? 0,
    gold: editing.gold ?? 0,
    cash: editing.cash ?? 0,
  });
  const [popoverField, setPopoverField] = useState(null);

  const setField = (key, value) => setValues({ ...values, [key]: value });

  const computedTotal = values.stocks + values.bonds + values.gold + values.cash;

  const handleSave = () => onSave(values);

  return (
    <div className="update">
      <div className="update-head">
        <h1>Update Values</h1>
        <p className="update-sub">四项都填当前市值（覆盖式），跟证券 / 货币基金 App 里看到的一致就行</p>
      </div>

      <div className="update-form">
        {FIELDS.map((field) => (
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
