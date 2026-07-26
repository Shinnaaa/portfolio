import { useEffect, useState } from "react";
import { parseExpression } from "../lib/format";

// A numeric text input that accepts arithmetic expressions (e.g. "50000+3万")
// and previews the evaluated result before it's committed on blur.
export default function SmartInput({ value, onChange, className, placeholder, onFocus }) {
  const [text, setText] = useState(String(value ?? 0));
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setText(String(value ?? 0));
    setPreview(null);
  }, [value]);

  const commit = () => {
    const parsed = parseExpression(text);
    if (parsed !== null) {
      const rounded = Math.round(parsed);
      setText(String(rounded));
      setPreview(null);
      if (rounded !== value) onChange(rounded);
    } else {
      setText(String(value ?? 0));
      setPreview(null);
    }
  };

  const handleChange = (e) => {
    const next = e.target.value;
    setText(next);
    if (/[+\-*/]/.test(next.replace(/^-/, ""))) {
      const parsed = parseExpression(next);
      setPreview(parsed !== null ? Math.round(parsed) : null);
    } else {
      setPreview(null);
    }
  };

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        className={className}
        value={text}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.target.blur();
          }
          if (e.key === "Escape") {
            setText(String(value ?? 0));
            setPreview(null);
            e.target.blur();
          }
        }}
        onFocus={onFocus}
      />
      {preview !== null && preview !== Number(text) && (
        <span className="expr-preview" aria-hidden="true">
          = {preview.toLocaleString("en-US")}
        </span>
      )}
    </>
  );
}
