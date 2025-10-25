import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { startGame, move as moveApi, restart as restartApi } from "./api";
import Board from "./components/Board";
import Controls from "./components/Controls";
import "./styles.css";

function randomUserId() {
  return "u_" + Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const [userId] = useState(() => randomUserId());
  const [size, setSize] = useState(4);
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoverPos, setHoverPos] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [changedSet, setChangedSet] = useState(new Set());
  const [hint, setHint] = useState("Use Arrow keys or WASD. Drag a tile to move.");
  const [showHelp, setShowHelp] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [scoreDeltaFlash, setScoreDeltaFlash] = useState(0);
  const audioCtxRef = useRef(null);

  const clearHintLater = useCallback((ms = 700) => {
    const id = setTimeout(() => setHint("Use Arrow keys or WASD. Drag a tile to move."), ms);
    return () => clearTimeout(id);
  }, []);

  const canInput = useMemo(() => !loading && !gameOver && !won, [loading, gameOver, won]);
  const boardRef = useRef(null);

  const bootstrap = useCallback(async (s) => {
    setLoading(true);
    try {
      const state = await startGame(userId, s);
      setBoard(state.board);
      setScore(state.score);
      setGameOver(state.gameOver);
      setWon(state.won);
      setChangedSet(new Set());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    bootstrap(size);
  }, [bootstrap, size]);

  const handleMove = useCallback(
    async (direction) => {
      if (!canInput) return;
      setLoading(true);
      try {
        const prev = board;
        const prevScore = score;
        const state = await moveApi(userId, direction);
        setBoard(state.board);
        setScore(state.score);
        setGameOver(state.gameOver);
        setWon(state.won);

        if (Array.isArray(prev) && Array.isArray(state.board) && prev.length === state.board.length) {
          const next = state.board;
          const changed = new Set();
          for (let i = 0; i < next.length; i++) {
            for (let j = 0; j < next[i].length; j++) {
              if (next[i][j] !== 0 && prev[i][j] !== next[i][j]) {
                changed.add(`${i}-${j}`);
              }
            }
          }
          setChangedSet(changed);
          setTimeout(() => setChangedSet(new Set()), 250);
        } else {
          setChangedSet(new Set());
        }

        // Score delta and effects
        const delta = (state.score ?? 0) - (prevScore ?? 0);
        if (delta > 0) {
          setScoreDeltaFlash(delta);
          // auto-clear popup
          setTimeout(() => setScoreDeltaFlash(0), 900);
          // play a short beep using Web Audio
          try {
            if (!audioCtxRef.current) {
              const Ctx = window.AudioContext || window.webkitAudioContext;
              if (Ctx) audioCtxRef.current = new Ctx();
            }
            const ctx = audioCtxRef.current;
            if (ctx && ctx.state === 'suspended') {
              // resume on user gesture driven callback
              ctx.resume().catch(() => {});
            }
            if (ctx) {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.type = 'sine';
              // frequency based a bit on delta (clamped)
              const freq = Math.min(1200, 300 + delta * 5);
              o.frequency.value = freq;
              g.gain.value = 0.2; // louder
              o.connect(g);
              g.connect(ctx.destination);
              o.start();
              // quick envelope
              const now = ctx.currentTime;
              g.gain.setValueAtTime(0.2, now);
              g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
              o.stop(now + 0.3);
            }
          } catch (_) {
            // ignore audio errors silently
          }
        } else if (state.moved) {
          // Tiles moved but no merge (no score change): play a softer, lower tick
          try {
            if (!audioCtxRef.current) {
              const Ctx = window.AudioContext || window.webkitAudioContext;
              if (Ctx) audioCtxRef.current = new Ctx();
            }
            const ctx = audioCtxRef.current;
            if (ctx && ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            if (ctx) {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.type = 'triangle';
              o.frequency.value = 220;
              g.gain.value = 0.12;
              o.connect(g);
              g.connect(ctx.destination);
              o.start();
              const now = ctx.currentTime;
              g.gain.setValueAtTime(0.12, now);
              g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
              o.stop(now + 0.18);
            }
          } catch (_) {
            // ignore audio errors silently
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, canInput, board, score]
  );

  // keyboard + drag controls remain same
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!canInput) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = (e.key || "").toLowerCase();
      let direction = null;
      switch (k) {
        case "arrowup":
        case "w":
          direction = "up";
          break;
        case "arrowdown":
        case "s":
          direction = "down";
          break;
        case "arrowleft":
        case "a":
          direction = "left";
          break;
        case "arrowright":
        case "d":
          direction = "right";
          break;
        default:
          break;
      }
      if (direction) {
        e.preventDefault();
        handleMove(direction);
        setHint(`Moving ${direction}`);
        clearHintLater(600);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleMove, canInput]);

  // Open end modal when win or game over happens
  useEffect(() => {
    if (won || gameOver) setShowEnd(true);
  }, [won, gameOver]);

  // Enable swipe/drag gestures on the board element
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onDown = (e) => {
      if (!canInput) return;
      const p = e.touches ? e.touches[0] : e;
      startX = p.clientX;
      startY = p.clientY;
      tracking = true;
    };
    const onUp = (e) => {
      if (!tracking) return;
      tracking = false;
      const p = e.changedTouches ? e.changedTouches[0] : e;
      const dx = (p.clientX || 0) - startX;
      const dy = (p.clientY || 0) - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const threshold = 24; 
      let dir = null;
      if (absX > absY && absX > threshold) dir = dx > 0 ? 'right' : 'left';
      else if (absY > threshold) dir = dy > 0 ? 'down' : 'up';
      if (dir) {
        handleMove(dir);
        setHint(`Moving ${dir}`);
        clearHintLater(600);
      }
    };

    el.addEventListener('pointerdown', onDown, { passive: true });
    el.addEventListener('pointerup', onUp, { passive: true });
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchend', onUp, { passive: true });
    el.addEventListener('mousedown', onDown, { passive: true });
    el.addEventListener('mouseup', onUp, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchend', onUp);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
    };
  }, [boardRef, canInput, handleMove, clearHintLater]);

  const clearTransient = () => {
    setHoverPos(null);
    setDragging(false);
    setDragDirection(null);
    setDragIndex(null);
  };

  const onRestart = async () => {
    setShowEnd(false);
    setLoading(true);
    try {
      clearTransient();
      const state = await restartApi(userId, size);
      setBoard(state.board);
      setScore(state.score);
      setGameOver(state.gameOver);
      setWon(state.won);
    } finally {
      setLoading(false);
    }
  };

  const onSizeChange = (nextSize) => {
    const s = Number(nextSize) || 4;
    setSize(s);
    clearTransient();
  };

  useEffect(() => {
    const updateBoardSize = () => {
      const vh = window.innerHeight || 0;
      const vw = window.innerWidth || 0;
      const header = document.querySelector('.game-header');
      const controls = document.querySelector('.controls');
      const banners = Array.from(document.querySelectorAll('.banner'));
      const headerH = header ? header.offsetHeight : 0;
      const controlsH = controls ? controls.offsetHeight : 0;
      const bannersH = banners.reduce((sum, el) => sum + el.offsetHeight, 0);
      const verticalPadding = 24; 
      const availableH = Math.max(120, vh - (headerH + controlsH + bannersH + verticalPadding));
      const maxByViewport = Math.min(vw, vh) * 0.9;
      const sizePx = Math.floor(Math.min(600, maxByViewport, availableH));
      const container = document.querySelector('.game-container');
      if (container && sizePx > 0) {
        container.style.setProperty('--board-size', `${sizePx}px`);
      }
    };
    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, [won, gameOver, loading, size]);

  return (
    <div className="game-container">
      <header className="game-header">
        <h1 className="title">GAME 2048</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowHelp(true)} aria-label="How to play instructions">
            <span aria-hidden>🛈</span>
            How to Play
          </button>
        </div>
        <div className="status-bar">
          <div className="score-wrap">
            {scoreDeltaFlash > 0 && (
              <span className="score-delta" aria-live="polite">+{scoreDeltaFlash}</span>
            )}
            <div className="score-box">
              <span>Score</span>
              <strong>{score}</strong>
            </div>
          </div>
          <div className="size-selector">
            <label>Size</label>
            <select value={size} onChange={(e) => onSizeChange(e.target.value)} disabled={loading}>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} x {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="board-wrapper">
        {(!board || board.length === 0) && (
          <div className="loader-overlay" aria-live="polite" aria-busy="true">
            <div className="spinner" />
          </div>
        )}
        <Board
          board={board}
          onHover={(i, j) => setHoverPos(i == null ? null : { i, j })}
          hoverPos={hoverPos}
          dragging={dragging}
          dragDirection={dragDirection}
          dragIndex={dragIndex}
          changedSet={changedSet}
          ref={boardRef}
        />
      </div>

      <Controls onRestart={onRestart} disabled={loading} hint={hint} />

      {loading && <div className="loading">⏳ Thinking...</div>}

      {showHelp && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="modal">
            <div className="modal-header">
              <h2 id="help-title" className="modal-title">How to Play 2048</h2>
              <button className="btn btn-close" onClick={() => setShowHelp(false)} aria-label="Close help">✕</button>
            </div>
            <div className="modal-body">
              <p className="lead">Merge tiles with the same number to reach <span className="badge badge-gold">2048</span>!</p>
              <div className="modal-grid">
                <div className="card c1">
                  <h3>Controls</h3>
                  <ul>
                    <li><strong>Keyboard:</strong> Arrow keys or WASD</li>
                    <li><strong>Drag:</strong> Swipe/drag tiles in a direction</li>
                  </ul>
                </div>
                <div className="card c2">
                  <h3>Rules</h3>
                  <ul>
                    <li>Each move slides all tiles in that direction.</li>
                    <li>Tiles with the <strong>same value</strong> merge into one.</li>
                    <li>Every move spawns a <strong>2</strong> or <strong>4</strong>.</li>
                  </ul>
                </div>
                <div className="card c3">
                  <h3>Goal</h3>
                  <ul>
                    <li>Create a tile with <strong>2048</strong> to win.</li>
                    <li>Game ends when no moves are left.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEnd && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="end-title">
          <div className={`modal ${won ? 'modal-win' : 'modal-lose'}`}>
            <div className="modal-header">
              <h2 id="end-title" className="modal-title">{won ? '🎉 You Win!' : '💀 Game Over'}</h2>
              <button className="btn btn-close" onClick={() => setShowEnd(false)} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              {won ? (
                <>
                  <p className="lead">Amazing! You reached the <span className="badge badge-gold">2048</span> tile.</p>
                  <ul>
                    <li>Keep going to chase even higher tiles!</li>
                    <li>Or restart for a fresh challenge.</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="lead">No more moves are available.</p>
                  <ul>
                    <li>Try planning merges two steps ahead.</li>
                    <li>Keep your highest tile in a corner.</li>
                  </ul>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn" onClick={onRestart} aria-label="Restart game">🔄 Restart</button>
                <button className="btn btn-secondary" onClick={() => setShowEnd(false)} aria-label="Close dialog">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
