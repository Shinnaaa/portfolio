export const CATEGORY_COLORS = {
  stocks: "#c8a96a",
  bonds: "#6a8caa",
  gold: "#b8694e",
  cash: "#7a8b6f",
};

export const TOOLTIP_LABELS = {
  total: "Total",
  stocks: "股票",
  bonds: "债券",
  gold: "黄金",
  cash: "现金",
};

export function formatCurrency(value) {
  if (value == null || isNaN(value)) return "—";
  const sign = value < 0 ? "−" : "";
  return sign + "¥" + Math.abs(Math.round(value)).toLocaleString("en-US");
}

export function formatPercent(value, digits = 1) {
  if (value == null || isNaN(value)) return "—";
  return (value * 100).toFixed(digits) + "%";
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

// Parses a numeric expression that may include Chinese "万" (x10000), thousands
// separators, and a trailing "円". Returns null if the input isn't a safe
// arithmetic expression, since the result is evaluated with `Function`.
export function parseExpression(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (!/^[\d+\-*/.() \t万円,]+$/.test(trimmed)) return null;

  let expr = trimmed.replace(/,/g, "").replace(/円/g, "");
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*万/g, "($1*10000)");
  if (!/^[\d+\-*/.() \t]+$/.test(expr)) return null;

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    return typeof result !== "number" || !isFinite(result) ? null : result;
  } catch {
    return null;
  }
}
