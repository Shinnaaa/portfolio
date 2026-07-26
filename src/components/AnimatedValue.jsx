import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../lib/format";

function useAnimatedNumber(value, duration = 900) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    cancelAnimationFrame(frameRef.current);
    startRef.current = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return display;
}

export default function AnimatedValue({ value, className }) {
  const animated = useAnimatedNumber(value || 0, 900);
  return <span className={className}>{formatCurrency(animated)}</span>;
}
