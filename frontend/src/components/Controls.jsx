import React from 'react'

export default function Controls({ onRestart, disabled, hint }) {
  return (
    <div className="controls">
      <button className="btn" onClick={onRestart} disabled={disabled} aria-label="Restart game">
        <span aria-hidden>🔄</span>
        Restart
      </button>
      <div className="hint">{hint}</div>
    </div>
  )
}
