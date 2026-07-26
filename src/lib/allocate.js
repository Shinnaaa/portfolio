// Suggests how to split a new contribution across stocks/bonds/gold (cash is
// the source of the funds, never a target). Two modes:
//  - "smart": fills the most-underweight categories first, then spills any
//    remainder across categories proportional to their target weight.
//  - "proportional": always splits strictly by target weight.
export function computeAllocation(amount, mode, total, cats) {
  if (!amount || amount <= 0) return { suggestions: null, projection: null };

  const nonCash = cats.filter((c) => c.key !== "cash");
  const targetWeightSum = nonCash.reduce((sum, c) => sum + c.target, 0);
  const withGap = nonCash.map((c) => ({
    ...c,
    targetValue: total * c.target,
    gap: Math.max(0, total * c.target - c.value),
  }));

  let suggestions;
  if (mode === "proportional") {
    suggestions = withGap.map((c) => {
      const allocated = amount * (c.target / targetWeightSum);
      return { key: c.key, label: c.label, amount: allocated, currentValue: c.value, newValue: c.value + allocated };
    });
  } else {
    const totalGap = withGap.reduce((sum, c) => sum + c.gap, 0);
    let raw;
    if (amount <= totalGap) {
      raw = withGap.map((c) => {
        const allocated = totalGap > 0 ? amount * (c.gap / totalGap) : 0;
        return { key: c.key, label: c.label, amount: allocated, currentValue: c.value, newValue: c.value + allocated };
      });
    } else {
      const remaining = amount - totalGap;
      raw = withGap.map((c) => {
        const allocated = c.gap + remaining * (c.target / targetWeightSum);
        return { key: c.key, label: c.label, amount: allocated, currentValue: c.value, newValue: c.value + allocated };
      });
    }
    // Round to the nearest 100 for tidy numbers, then nudge the largest
    // category so the rounded amounts still sum to the exact input.
    const rounded = raw.map((c) => ({ ...c, amount: Math.round(c.amount / 100) * 100 }));
    const roundedTotal = rounded.reduce((sum, c) => sum + c.amount, 0);
    const remainder = amount - roundedTotal;
    if (remainder !== 0) {
      const largestIdx = rounded.reduce((best, c, i) => (c.amount > rounded[best].amount ? i : best), 0);
      rounded[largestIdx].amount += remainder;
    }
    suggestions = rounded.map((c) => ({ ...c, newValue: c.currentValue + c.amount }));
  }

  const totalAllocated = suggestions.reduce((sum, c) => sum + c.amount, 0);
  const projection = cats.map((c) => {
    const s = suggestions.find((x) => x.key === c.key);
    if (!s) {
      // Cash funds the allocation, so it absorbs the full amount moved out.
      const newValue = c.value - totalAllocated;
      return { ...c, newValue, newShare: total > 0 ? newValue / total : 0 };
    }
    return { ...c, newValue: s.newValue, newShare: total > 0 ? s.newValue / total : 0 };
  });

  return { suggestions, projection };
}
