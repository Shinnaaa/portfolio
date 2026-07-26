import { useEffect, useRef, useState } from "react";
import { formatCurrency, parseExpression } from "../lib/format";

const PRESETS = [10000, 30000, 50000, 100000];

// A small popover for adding/subtracting a quick amount (or expression) from
// a value, used by the "+" button next to each holdings input.
export default function QuickAdjustPopover({ currentValue, onApply, onClose }) {
  const [sign, setSign] = useState("+");
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const parsed = parseExpression(text);
  const delta = parsed !== null ? (sign === "+" ? parsed : -parsed) : null;
  const nextValue = delta !== null ? Math.round(currentValue + delta) : null;

  const apply = () => {
    if (nextValue !== null) {
      onApply(nextValue);
      onClose();
    }
  };

  return (
    <>
      <div className="qa-backdrop" onClick={onClose} />
      <div className="qa-popover" onClick={(e) => e.stopPropagation()}>
        <div className="qa-head">
          <div className="qa-current-label">Current</div>
          <div className="qa-current-value">{formatCurrency(currentValue)}</div>
        </div>
        <div className="qa-body">
          <div className="qa-op-row">
            <button className={`qa-op-btn ${sign === "+" ? "on" : ""}`} onClick={() => setSign("+")}>
              +
            </button>
            <button className={`qa-op-btn ${sign === "-" ? "on" : ""}`} onClick={() => setSign("-")}>
              −
            </button>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              className="qa-input"
              placeholder="金额（支持 5万 / 50000+5000）"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nextValue !== null) apply();
              }}
            />
          </div>
          <div className="qa-presets">
            {PRESETS.map((p) => (
              <button key={p} className="qa-preset" onClick={() => setText(String(p))}>
                ¥{(p / 10000).toFixed(0)}万
              </button>
            ))}
          </div>
          {nextValue !== null && (
            <div className="qa-preview">
              <span className="qa-preview-arrow">→</span>
              <span className="qa-preview-value">{formatCurrency(nextValue)}</span>
              <span className="qa-preview-delta">
                ({sign === "+" ? "+" : "−"}
                {formatCurrency(parsed)})
              </span>
            </div>
          )}
        </div>
        <div className="qa-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={nextValue === null} onClick={apply}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
