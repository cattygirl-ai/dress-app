import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import teacupImg from "../assets/teacup_3match.png";
import macaronImg from "../assets/macaron_3match.png";
import jamImg from "../assets/jam_3match.png";
import sugarImg from "../assets/sugar_3match.png";
import tartImg from "../assets/tart_3match.png";
import cookieImg from "../assets/cookie_3match.png";

const ROWS = 6;
const COLS = 6;
const TYPES = 6;
const NAMES = ["Teacup", "Macaron", "Jam", "Sugar", "Tart", "Cookie"];
const IMAGES = [teacupImg, macaronImg, jamImg, sugarImg, tartImg, cookieImg];

const tileAnimations = [
  { y: [0, -2, 0], rotate: [0, -2, 2, 0] },
  { y: [0, -4, 0], scale: [1, 1.05, 1] },
  { scale: [1, 1.03, 1], rotate: [0, 1, -1, 0] },
  { x: [0, -1, 1, -1, 0], rotate: [0, -3, 3, -2, 2, 0] },
  { y: [0, -3, 0], rotate: [0, 1, -1, 0] },
  { rotate: [0, -4, 4, 0], y: [0, -2, 0] },
];

const LEVELS = [
  { id: 1, moves: 30, objective: { type: "collect", item: 1, amount: 10 } },
  { id: 2, moves: 30, objective: { type: "collect", item: 0, amount: 15 } },
  { id: 3, moves: 30, objective: { type: "score", amount: 150 } },
];

function randType() {
  return Math.floor(Math.random() * TYPES);
}

function makeCell(type) {
  return { type };
}

function normalizeCell(cell) {
  if (!cell) return null;
  if (typeof cell === "number") return makeCell(cell);
  if (typeof cell === "object" && typeof cell.type === "number") return makeCell(cell.type);
  return null;
}

function normalizeBoard(board) {
  if (!Array.isArray(board) || board.length !== ROWS) return null;
  const normalized = board.map((row) => (Array.isArray(row) && row.length === COLS ? row.map(normalizeCell) : null));
  if (normalized.some((row) => row === null || row.some((cell) => cell === null))) return null;
  return normalized;
}

function makeBoardNoMatches() {
  const board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let tile;
      do {
        tile = makeCell(randType());
      } while (
        (c >= 2 && board[r][c - 1]?.type === tile.type && board[r][c - 2]?.type === tile.type) ||
        (r >= 2 && board[r - 1][c]?.type === tile.type && board[r - 2][c]?.type === tile.type)
      );
      board[r][c] = tile;
    }
  }
  return board;
}

function collectMatchMetadata(board) {
  const matched = new Set();

  const markRun = (orientation, startRow, startCol, length) => {
    if (length < 3) return;
    for (let k = 0; k < length; k++) {
      const row = orientation === "row" ? startRow : startRow + k;
      const col = orientation === "row" ? startCol + k : startCol;
      matched.add(`${row}:${col}`);
    }
  };

  // rows
  for (let r = 0; r < ROWS; r++) {
    let cur = null;
    let start = 0;
    let len = 0;
    for (let c = 0; c < COLS; c++) {
      const t = board[r][c]?.type ?? null;
      if (cur === null) {
        if (t !== null) { cur = t; start = c; len = 1; }
      } else if (t === cur) len++; else { markRun("row", r, start, len); cur = t; start = c; len = t === null ? 0 : 1; }
    }
    if (cur !== null) markRun("row", r, start, len);
  }

  // cols
  for (let c = 0; c < COLS; c++) {
    let cur = null;
    let start = 0;
    let len = 0;
    for (let r = 0; r < ROWS; r++) {
      const t = board[r][c]?.type ?? null;
      if (cur === null) {
        if (t !== null) { cur = t; start = r; len = 1; }
      } else if (t === cur) len++; else { markRun("col", start, c, len); cur = t; start = r; len = t === null ? 0 : 1; }
    }
    if (cur !== null) markRun("col", start, c, len);
  }

  const matches = Array.from(matched).map((k) => k.split(":").map(Number));
  return { hasMatch: matched.size > 0, matches, clearedCount: matched.size };
}

function swap(board, r1, c1, r2, c2) {
  const nb = board.map((row) => row.slice());
  const tmp = nb[r1][c1]; nb[r1][c1] = nb[r2][c2]; nb[r2][c2] = tmp; return nb;
}

function hasPossibleMoves(board) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const dirs = [[1,0],[0,1]];
    for (const [dr,dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= ROWS || nc >= COLS) continue;
      if (collectMatchMetadata(swap(board, r, c, nr, nc)).hasMatch) return true;
    }
  }
  return false;
}

function shuffleBoard(board) {
  const flat = board.flat();
  do {
    flat.sort(() => Math.random() - 0.5);
    let i = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) board[r][c] = flat[i++];
  } while (collectMatchMetadata(board).hasMatch || !hasPossibleMoves(board));
  return board;
}

function collapse(board) {
  const nb = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) if (board[r][c] !== null && board[r][c] !== undefined) nb[write--][c] = board[r][c];
    for (let r = write; r >= 0; r--) nb[r][c] = makeCell(randType());
  }
  return nb;
}

const STORAGE_KEY = "match3_save";
const SAVE_VERSION = 1;

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (save.version !== SAVE_VERSION) return null;
    return save;
  } catch {
    return null;
  }
}

function checkLevelComplete(levelObj, progress) {
  if (!levelObj) return false;
  if (levelObj.objective.type === "collect") return progress >= levelObj.objective.amount;
  if (levelObj.objective.type === "score") return progress >= levelObj.objective.amount;
  return false;
}

export default function Match3({ onClose, onCoinsEarned }) {
  const save = loadSave();
  const initialUnlocked = (() => {
    if (Array.isArray(save?.unlockedLevels) && save.unlockedLevels.length === LEVELS.length) return save.unlockedLevels;
    return Array.from({ length: LEVELS.length }, (_, i) => i === 0);
  })();
  const [unlockedLevels, setUnlockedLevels] = useState(() => initialUnlocked);
  const initialLevelIndex = (() => {
    const raw = typeof save?.levelIndex === 'number' ? save.levelIndex : 0;
    if (initialUnlocked[raw]) return raw;
    const first = initialUnlocked.findIndex(Boolean);
    return first >= 0 ? first : 0;
  })();
  const [levelIndex, setLevelIndex] = useState(() => initialLevelIndex);
  const [board, setBoard] = useState(() => normalizeBoard(save?.board) ?? makeBoardNoMatches());
  const [movesLeft, setMovesLeft] = useState(() => save?.movesLeft ?? LEVELS[initialLevelIndex].moves);
  const [levelProgress, setLevelProgress] = useState(() => save?.levelProgress ?? 0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  const [selected, setSelected] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const levelAdvanceScheduled = useRef(false);

  const currentLevel = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, levelIndex))];

  useEffect(() => {
    mounted.current = true;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => { mounted.current = false; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: SAVE_VERSION, board, levelIndex, movesLeft, levelProgress, unlockedLevels })
      );
    } catch {
      // ignore storage errors
    }
  }, [board, levelIndex, movesLeft, levelProgress, unlockedLevels]);

  const getSwipeDirection = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");

  const resolveCascade = async (startBoard) => {
    let nb = startBoard.map((r) => r.slice());
    while (true) {
      const meta = collectMatchMetadata(nb);
      if (!meta.hasMatch) break;

      // count collect progress for this step and total cleared for score
      let collectThis = 0;
      for (const [r,c] of meta.matches) {
        const t = nb[r][c]?.type ?? null;
        if (currentLevel.objective.type === "collect" && t === currentLevel.objective.item) collectThis++;
      }
      const scoreThis = meta.clearedCount * 5;

      // clear
      for (const [r,c] of meta.matches) nb[r][c] = null;

      // award 1 coin per cleared tile (user request)
      if (scoreThis > 0) onCoinsEarned?.(scoreThis);

      // update progress: collect or score objectives
      const willAdd = currentLevel.objective.type === "collect" ? collectThis : (currentLevel.objective.type === "score" ? scoreThis : 0);
      if (willAdd > 0) {
        setLevelProgress((p) => {
          const next = p + willAdd;
          if (checkLevelComplete(currentLevel, next) && !levelAdvanceScheduled.current) {
            levelAdvanceScheduled.current = true;
            setLevelComplete(true);
            // advance after a longer pause so banner stays visible; use functional update
            setTimeout(() => {
                setLevelIndex((i) => {
                  const nextIndex = Math.min(i + 1, LEVELS.length - 1);
                  setUnlockedLevels((u) => {
                    const nu = u.slice();
                    nu[nextIndex] = true;
                    return nu;
                  });
                  setMovesLeft(LEVELS[nextIndex]?.moves ?? 30);
                  setLevelProgress(0);
                  setBoard(makeBoardNoMatches());
                  setSelected(null);
                  setBusy(false);
                  setLevelComplete(false);
                  levelAdvanceScheduled.current = false;
                  return nextIndex;
                });
            }, 5000);
          }
          return next;
        });
      }

      if (!mounted.current) break;
      setBoard(nb.map((r) => r.slice()));
      await new Promise((res) => setTimeout(res, 160));
      nb = collapse(nb);
      if (!mounted.current) break;
      setBoard(nb.map((r) => r.slice()));
      await new Promise((res) => setTimeout(res, 180));
    }

    if (!hasPossibleMoves(nb)) {
      nb = shuffleBoard(nb);
      if (mounted.current) setBoard(nb.map((r) => r.slice()));
    }

    return { board: nb };
  };

  async function handleTileSwap(r1, c1, r2, c2) {
    if (busy) return;
    const swapped = swap(board, r1, c1, r2, c2);
    const meta = collectMatchMetadata(swapped);
    if (!meta.hasMatch) {
      setBusy(true);
      setBoard(swapped);
      await new Promise((r) => setTimeout(r, 150));
      setBoard(board);
      setBusy(false);
      return;
    }

    // consume a move
    setMovesLeft((m) => Math.max(0, m - 1));

    setBusy(true);
    if (mounted.current) setBoard(swapped);
    await resolveCascade(swapped);
    if (mounted.current) { setBusy(false); setSelected(null); }
  }

  function handlePointerDown(e, r, c) {
    if (busy) return;
    setDragStart({ r, c, x: e.clientX, y: e.clientY });
  }

  async function handlePointerUp(e, r, c) {
    if (!dragStart || busy) return setDragStart(null);
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const threshold = 18;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) { setSelected([r,c]); setDragStart(null); return; }
    const dir = getSwipeDirection(dx, dy);
    let nr = dragStart.r, nc = dragStart.c;
    if (dir === "left") nc -= 1; if (dir === "right") nc += 1; if (dir === "up") nr -= 1; if (dir === "down") nr += 1;
    setDragStart(null);
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    await handleTileSwap(dragStart.r, dragStart.c, nr, nc);
  }

  return (
    <div className="match3-overlay" role="dialog" aria-modal="true">
      <div className="match3-panel">
        <div className="match3-ui">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div className="match3-level">Level {LEVELS[levelIndex].id}</div>
            <button className="level-select-toggle" type="button" onClick={() => setShowLevelSelect((s) => !s)} aria-expanded={showLevelSelect}>
              Select Level
            </button>
            <button type="button" className="match3-close" aria-label="Close match3" onClick={() => onClose?.()}>✕</button>
          </div>
          <div className="match3-objective">
            {currentLevel.objective.type === "collect"
              ? `Collect ${currentLevel.objective.amount} ${NAMES[currentLevel.objective.item]}`
              : `Reach ${currentLevel.objective.amount} points`}
          </div>
          <div className="match3-objective-progress">
            {currentLevel.objective.type === "collect"
              ? `${NAMES[currentLevel.objective.item]}: ${levelProgress} / ${currentLevel.objective.amount}`
              : `Points: ${levelProgress} / ${currentLevel.objective.amount}`}
          </div>
          <div className="match3-progress-bar"><div className="match3-progress-fill" style={{ width: `${(levelProgress / (currentLevel.objective.amount || 1)) * 100}%` }} /></div>
          <div className="match3-moves">Moves: {movesLeft}</div>
        </div>

        {showLevelSelect && (
          <div className="match3-level-select">
            {LEVELS.map((lvl, idx) => (
              <button
                key={lvl.id}
                type="button"
                className={`level-button ${idx === levelIndex ? 'current' : ''} ${unlockedLevels[idx] ? 'unlocked' : 'locked'}`}
                onClick={() => {
                    if (!unlockedLevels[idx]) return;
                    setLevelIndex(idx);
                    setMovesLeft(LEVELS[idx].moves);
                    setLevelProgress(0);
                    setBoard(makeBoardNoMatches());
                    setSelected(null);
                    setBusy(false);
                    setShowLevelSelect(false);
                  }}
                disabled={!unlockedLevels[idx]}
              >
                {`Level ${lvl.id}`}
                {!unlockedLevels[idx] && ' 🔒'}
              </button>
            ))}
          </div>
        )}

        {levelComplete && <div className="level-complete-banner">🎉 Level Complete!</div>}

        <div className="match3-grid" style={{ "--cols": COLS }}>
          {board.map((row, r) => (
            <div className="match3-row" key={r}>
              {row.map((cell, c) => {
                const isSelected = selected && selected[0] === r && selected[1] === c;
                const typeIndex = cell && typeof cell === "object" ? cell.type : null;
                const label = typeIndex !== null ? NAMES[typeIndex] : "";
                const isEmpty = typeIndex === null;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`match3-tile ${isSelected ? "selected" : ""} ${isEmpty ? "empty" : ""}`}
                    onPointerDown={(e) => handlePointerDown(e, r, c)}
                    onPointerUp={(e) => handlePointerUp(e, r, c)}
                    aria-label={label}
                    title={label}
                    disabled={isEmpty}
                  >
                    {typeIndex !== null && (
                      <motion.img src={IMAGES[typeIndex]} className="tile-img" animate={tileAnimations[typeIndex]} transition={{ duration: 2 + (typeIndex * 0.2), repeat: Infinity }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
