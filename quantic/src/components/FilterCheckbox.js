"use client";

export default function FilterCheckbox({ checked, onChange, label, badge = null }) {
  return (
    <label className={`bored-filter-checkbox ${checked ? "is-checked" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="bored-checkbox-hidden"
      />
      <span className="bored-checkbox-pill">
        <span className="checkbox-indicator">
          {checked ? "✓" : "○"}
        </span>
        <span className="checkbox-text">{label}</span>
        {badge && <span className="checkbox-badge">{badge}</span>}
      </span>
    </label>
  );
}
