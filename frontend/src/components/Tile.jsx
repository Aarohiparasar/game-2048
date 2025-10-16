import React from "react";
import './css/tiles.css'

function tileClass(value) {
  const base = "tile";
  if (!value) return `${base} t0`;
  const power = Math.log2(value);
  const clamped = Math.max(1, Math.min(11, power));
  return `${base} t${clamped}`;
}

export default function Tile({ value, i, j, onHover, extraClass, size }) {
  const cls = [tileClass(value), extraClass].filter(Boolean).join(" ");

  // Scale tile font for bigger boards
  const s = Number(size) || 4;
  const fontSize = `${Math.max(14, 32 - (s - 4) * 2)}px`; // 32px default, shrink by 2px per extra size
  const padding = `${Math.max(4, 12 - (s - 4))}px`; // smaller padding for bigger boards

  return (
    <div
      className={cls}
      data-value={value !== 0 ? value : ""}
      data-filled={value !== 0 ? "1" : "0"}
      onMouseEnter={onHover ? () => onHover(i, j) : undefined}
      onMouseLeave={onHover ? () => onHover(null, null) : undefined}
      style={{
        fontSize,
        padding,
      }}
    >
      {value !== 0 ? value : ""}
    </div>
  );
}
