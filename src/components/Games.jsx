import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { X, Copy, RotateCcw, Check } from "lucide-react";
import { COLORS } from "../data/colors.js";

// "Get Fun" — small games for the shop. Everything here is loaded only when a customer opens a game,
// and the whole feature is switched on in Admin → Get Fun (OFF by default).
const head = { fontFamily: "'Fraunces', serif", fontWeight: 600, color: COLORS.maroonDark };
const photoOf = (p) => (p && ((p.photos && p.photos[0]) || (p.variants && p.variants[0] && p.variants[0].photo))) || "";
const CLD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
// A square picture of the right size (Cloudinary only; any other link is used as it is).
const sq = (url, w) => { const m = typeof url === "string" ? CLD.exec(url) : null; return m ? `${m[1]}f_auto,q_auto,c_fill,g_auto,w_${w},h_${w}/${m[2]}` : url; };
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const today = () => new Date().toISOString().slice(0, 10);
const lsGet = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export const MATCH_SIZES = { "3x4": [3, 4], "4x4": [4, 4], "4x5": [4, 5], "5x6": [5, 6], "6x6": [6, 6] };
export const GAME_LIST = [["match", "Yarn match", "🧶", "Find the matching pairs"], ["puzzle", "Photo puzzle", "🧩", "Slide the pieces back into place"], ["wheel", "Spin the wheel", "🎁", "Spin and win a discount"]];

const pill = (bg, color, border) => ({ background: bg, color, border: border || "none", borderRadius: 999, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" });

function Prize({ code, text, onShop }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard.writeText(code).then(() => setCopied(true)).catch(() => setCopied(true)); } catch (e) { setCopied(true); } setTimeout(() => setCopied(false), 1800); };
  return (
    <div style={{ background: "#fff", border: `2px dashed ${COLORS.gold}`, borderRadius: 16, padding: "14px 16px", textAlign: "center", marginTop: 14 }}>
      {text ? <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.maroonDark, marginBottom: 6 }}>{text}</div> : null}
      {code ? (<>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, color: COLORS.maroonDark }}>{code}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={copy} style={{ ...pill(COLORS.gold, "#fff"), display: "inline-flex", alignItems: "center", gap: 6 }}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy code"}</button>
          <button type="button" onClick={onShop} style={pill(COLORS.navy, "#fff")}>Start shopping</button>
        </div>
        <div style={{ fontSize: 12, color: "#7A6E64", marginTop: 8 }}>Type this code in your cart.</div>
      </>) : null}
    </div>
  );
}

// One reward per game per day, so the discount cannot be farmed by replaying.
function useReward(cfgGame, name) {
  const [won, setWon] = useState(null);
  const claim = useCallback((overrideCode, overrideText) => {
    const code = String(overrideCode !== undefined ? overrideCode : (cfgGame && cfgGame.code) || "").trim();
    const text = overrideText !== undefined ? overrideText : (cfgGame && cfgGame.prizeText) || "";
    if (!code) { setWon({ code: "", text: "" }); return; }
    const key = "ttc_game_" + name;
    const prev = lsGet(key);
    if (prev === today()) { setWon({ code: "", text: "You already won today's prize. Come back tomorrow for another!" }); return; }
    lsSet(key, today());
    setWon({ code, text });
  }, [cfgGame, name]);
  return [won, claim, () => setWon(null)];
}

// ---------------------------------------------------------------- Yarn match
function MatchGame({ cfg, products, onShop }) {
  const g = cfg.match || {};
  const [sizeKey, setSizeKey] = useState(MATCH_SIZES[g.size] ? g.size : "4x5");
  const [round, setRound] = useState(0);
  const [won, claim] = useReward(g, "match");
  const faces = useMemo(() => {
    const [c, r] = MATCH_SIZES[sizeKey] || [4, 5];
    const pool = shuffle((products || []).filter((p) => photoOf(p)));
    const pairs = Math.min(Math.floor((c * r) / 2), pool.length);
    const chosen = pool.slice(0, pairs);
    return { cols: c, cards: shuffle([...chosen, ...chosen].map((p, i) => ({ key: i, id: p.id, photo: photoOf(p), name: p.name }))), pairs };
  }, [sizeKey, round, products]); // eslint-disable-line
  const [open, setOpen] = useState([]);
  const [done, setDone] = useState([]);
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);
  useEffect(() => { setOpen([]); setDone([]); setMoves(0); lock.current = false; }, [faces]);
  const finished = faces.pairs > 0 && done.length === faces.cards.length;
  useEffect(() => { if (finished) claim(); }, [finished]); // eslint-disable-line
  const tap = (i) => {
    if (lock.current || open.includes(i) || done.includes(i)) return;
    const next = [...open, i]; setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1); lock.current = true;
      const [a, b] = next;
      if (faces.cards[a].id === faces.cards[b].id) { setTimeout(() => { setDone((d) => [...d, a, b]); setOpen([]); lock.current = false; }, 450); }
      else setTimeout(() => { setOpen([]); lock.current = false; }, 800);
    }
  };
  if (!faces.pairs) return <p style={{ fontSize: 13.5, color: "#5A4E46" }}>This game needs a few products with photos.</p>;
  const w = faces.cols >= 6 ? 12 : 100 / faces.cols;
  return (
    <div>
      {g.choose && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {Object.keys(MATCH_SIZES).map((k) => (<button key={k} type="button" onClick={() => setSizeKey(k)} style={{ ...pill(k === sizeKey ? COLORS.maroon : "transparent", k === sizeKey ? "#fff" : COLORS.maroon, `1.5px solid ${COLORS.maroon}`), padding: "6px 12px", fontSize: 12.5 }}>{MATCH_SIZES[k][0] * MATCH_SIZES[k][1]} tiles</button>))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A4E46", marginBottom: 8 }}><span>Pairs found {done.length / 2} / {faces.pairs}</span><span>Moves {moves}</span></div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${faces.cols}, 1fr)`, gap: faces.cols >= 5 ? 6 : 8 }}>
        {faces.cards.map((c, i) => {
          const show = open.includes(i) || done.includes(i);
          return (
            <button key={c.key} type="button" onClick={() => tap(i)} aria-label={show ? c.name : "Hidden tile"} style={{ aspectRatio: "1", padding: 0, border: done.includes(i) ? "2px solid #6bbf86" : show ? `2px solid ${COLORS.gold}` : "none", borderRadius: 12, overflow: "hidden", cursor: "pointer", background: show ? "#fff" : COLORS.maroon, color: "rgba(255,255,255,0.55)", fontSize: 18, position: "relative", transition: "transform .25s ease", transform: show ? "none" : "scale(0.98)" }}>
              {show ? <img src={sq(c.photo, 160)} alt={c.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: done.includes(i) ? 0.75 : 1 }} /> : "?"}
            </button>
          );
        })}
      </div>
      {finished && <><div style={{ textAlign: "center", marginTop: 14, ...head, fontSize: 20 }}>You did it in {moves} moves! 🎉</div>{won && <Prize code={won.code} text={won.text} onShop={onShop} />}</>}
      <div style={{ textAlign: "center", marginTop: 14 }}><button type="button" onClick={() => setRound((r) => r + 1)} style={{ ...pill("transparent", COLORS.maroon, `1.5px solid ${COLORS.maroon}`), display: "inline-flex", alignItems: "center", gap: 6 }}><RotateCcw size={15} /> New game</button></div>
    </div>
  );
}

// ---------------------------------------------------------------- Photo puzzle (sliding)
function makeBoard(n) {
  const b = Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n)); // last is the blank (0)
  let blank = n * n - 1; let prev = -1;
  for (let s = 0; s < 40 * n * n; s++) {
    const r = Math.floor(blank / n), c = blank % n; const opts = [];
    if (r > 0) opts.push(blank - n); if (r < n - 1) opts.push(blank + n); if (c > 0) opts.push(blank - 1); if (c < n - 1) opts.push(blank + 1);
    const pick = opts.filter((o) => o !== prev); const m = pick[Math.floor(Math.random() * pick.length)];
    b[blank] = b[m]; b[m] = 0; prev = blank; blank = m;
  }
  return b;
}
const solved = (b) => b.every((v, i) => v === (i + 1) % b.length);

function PuzzleGame({ cfg, products, onShop, onOpenProduct }) {
  const g = cfg.puzzle || {};
  const [n, setN] = useState(g.size === 4 || g.size === "4" ? 4 : 3);
  const [round, setRound] = useState(0);
  const [won, claim] = useReward(g, "puzzle");
  const pool = useMemo(() => {
    const all = (products || []).filter((p) => photoOf(p));
    const ids = Array.isArray(g.ids) ? g.ids : [];
    const chosen = g.pick === "chosen" && ids.length ? all.filter((p) => ids.includes(p.id)) : [];
    return chosen.length ? chosen : all;
  }, [products, g.pick, g.ids]);
  const prod = useMemo(() => {
    if (!pool.length) return null;
    const last = lsGet("ttc_puzzle_last");
    const others = pool.filter((p) => String(p.id) !== last);
    const p = (others.length ? others : pool)[Math.floor(Math.random() * (others.length ? others.length : pool.length))];
    lsSet("ttc_puzzle_last", String(p.id)); return p;
  }, [pool, round]); // eslint-disable-line
  const [board, setBoard] = useState(() => makeBoard(n));
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(false);
  useEffect(() => { setBoard(makeBoard(n)); setMoves(0); }, [n, round]);
  const finished = moves > 0 && solved(board);
  useEffect(() => { if (finished) claim(); }, [finished]); // eslint-disable-line
  const tap = (i) => {
    if (finished) return;
    const blank = board.indexOf(0); const r = Math.floor(i / n), c = i % n, br = Math.floor(blank / n), bc = blank % n;
    if (Math.abs(r - br) + Math.abs(c - bc) !== 1) return;
    const nb = [...board]; nb[blank] = nb[i]; nb[i] = 0; setBoard(nb); setMoves((m) => m + 1);
  };
  if (!prod) return <p style={{ fontSize: 13.5, color: "#5A4E46" }}>This game needs a few products with photos.</p>;
  const img = sq(photoOf(prod), 640);
  return (
    <div>
      {g.choose && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[3, 4].map((k) => (<button key={k} type="button" onClick={() => setN(k)} style={{ ...pill(k === n ? COLORS.maroon : "transparent", k === n ? "#fff" : COLORS.maroon, `1.5px solid ${COLORS.maroon}`), padding: "6px 12px", fontSize: 12.5 }}>{k * k - 1} pieces</button>))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5A4E46", marginBottom: 8 }}><span>Tap a piece next to the gap</span><span>Moves {moves}</span></div>
      <div style={{ position: "relative", width: "100%", maxWidth: 420, aspectRatio: "1", margin: "0 auto", borderRadius: 14, overflow: "hidden", background: COLORS.bgSoft, display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 2 }}>
        {board.map((v, i) => {
          if (!v && !finished) return <div key={i} style={{ background: "rgba(63,18,32,0.08)" }} />;
          const t = (v || n * n) - 1;
          return <button key={i} type="button" onClick={() => tap(i)} aria-label={"Piece " + (t + 1)} style={{ padding: 0, border: "none", cursor: "pointer", backgroundImage: `url(${img})`, backgroundSize: `${n * 100}% ${n * 100}%`, backgroundPosition: `${(t % n) * (100 / (n - 1))}% ${Math.floor(t / n) * (100 / (n - 1))}%`, backgroundColor: "#fff" }} />;
        })}
        {peek && <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" onMouseDown={() => setPeek(true)} onMouseUp={() => setPeek(false)} onMouseLeave={() => setPeek(false)} onTouchStart={() => setPeek(true)} onTouchEnd={() => setPeek(false)} style={pill("transparent", COLORS.maroon, `1.5px solid ${COLORS.maroon}`)}>Hold to peek</button>
        <button type="button" onClick={() => setRound((r) => r + 1)} style={{ ...pill("transparent", COLORS.maroon, `1.5px solid ${COLORS.maroon}`), display: "inline-flex", alignItems: "center", gap: 6 }}><RotateCcw size={15} /> New picture</button>
      </div>
      {finished && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <div style={{ ...head, fontSize: 20 }}>Puzzle solved in {moves} moves! 🎉</div>
          <div style={{ fontSize: 13.5, color: "#5A4E46", marginTop: 4 }}>{prod.name}</div>
          <button type="button" onClick={() => onOpenProduct && onOpenProduct(prod.id)} style={{ ...pill(COLORS.navy, "#fff"), marginTop: 10 }}>See this product</button>
          {won && <Prize code={won.code} text={won.text} onShop={onShop} />}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Spin the wheel
function WheelGame({ cfg, onShop }) {
  const g = cfg.wheel || {};
  const prizes = (Array.isArray(g.prizes) ? g.prizes : []).filter((p) => p && String(p.label || "").trim()).slice(0, 10);
  const list = prizes.length >= 2 ? prizes : [{ label: "Thank you", code: "" }, { label: "Try again", code: "" }];
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [used, setUsed] = useState(() => g.oncePerDay !== false && lsGet("ttc_wheel_day") === today());
  const seg = 360 / list.length;
  const palette = [COLORS.maroon, "#F3E9E2", COLORS.gold, "#F3E9E2", COLORS.navy, "#F3E9E2"];
  const stops = list.map((_, i) => { const c = palette[i % palette.length]; return `${c} ${i * seg}deg ${(i + 1) * seg}deg`; }).join(", ");
  const dark = (i) => ["#fff", COLORS.maroonDark, "#fff", COLORS.maroonDark, "#fff", COLORS.maroonDark][i % 6];
  const spin = () => {
    if (spinning || used) return;
    // Each prize has a "chance" (percent) set in the admin. Empty = equal chances; the numbers need not add up to 100.
    const w = list.map((p) => { const n = Number(p.chance); return Number.isFinite(n) && n > 0 ? n : 0; });
    const sum = w.reduce((x, y) => x + y, 0);
    let idx = Math.floor(Math.random() * list.length);
    if (sum > 0) { let r = Math.random() * sum; idx = w.findIndex((x) => { r -= x; return r < 0; }); if (idx < 0) idx = w.length - 1; }
    const target = 360 * 6 + (360 - (idx + 0.5) * seg);
    setSpinning(true); setRot((r) => r - (r % 360) + target);
    setTimeout(() => {
      setSpinning(false); setResult(list[idx]);
      if (g.oncePerDay !== false) { lsSet("ttc_wheel_day", today()); setUsed(true); }
    }, 4200);
  };
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 270, maxWidth: "88%", aspectRatio: "1", margin: "10px auto 0" }}>
        <div style={{ position: "absolute", left: "50%", top: -10, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "26px solid #d93a3a", zIndex: 3 }} />
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `6px solid ${COLORS.maroonDark}`, background: `conic-gradient(${stops})`, transform: `rotate(${rot}deg)`, transition: spinning ? "transform 4s cubic-bezier(.12,.6,.1,1)" : "none", position: "relative", boxShadow: "0 8px 22px rgba(60,30,40,0.25)" }}>
          {list.map((p, i) => (
            <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, transform: `rotate(${(i + 0.5) * seg}deg)` }}>
              <div style={{ position: "absolute", left: -38, top: -118, width: 76, textAlign: "center", fontSize: 11.5, fontWeight: 800, lineHeight: 1.15, color: dark(i) }}>{p.label}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 46, height: 46, margin: -23, borderRadius: "50%", background: COLORS.maroonDark }} />
        </div>
      </div>
      {!result && <button type="button" onClick={spin} disabled={spinning || used} style={{ ...pill(used ? "#B9AEA6" : COLORS.navy, "#fff"), marginTop: 18, minWidth: 180, cursor: used ? "default" : "pointer" }}>{spinning ? "Spinning…" : used ? "Come back tomorrow" : "Spin the wheel"}</button>}
      {used && !result && !spinning && <div style={{ fontSize: 12.5, color: "#7A6E64", marginTop: 8 }}>One spin a day.</div>}
      {result && (
        <div style={{ marginTop: 14 }}>
          <div style={{ ...head, fontSize: 21 }}>{result.code ? "You won " + result.label + "! 🎉" : result.label}</div>
          {result.code ? <Prize code={result.code} text={g.prizeText || ""} onShop={onShop} /> : <div style={{ fontSize: 13.5, color: "#5A4E46", marginTop: 6 }}>Better luck tomorrow!</div>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Window
export function GamesModal({ cfg, products, initial, onClose, onOpenProduct }) {
  const enabled = GAME_LIST.filter(([k]) => cfg[k] && cfg[k].on !== false);
  const [game, setGame] = useState(initial && enabled.some(([k]) => k === initial) ? initial : enabled.length === 1 ? enabled[0][0] : "");
  const onShop = () => onClose();
  const sel = enabled.find(([k]) => k === game);
  return (
    <div className="ttc-modal" role="dialog" aria-modal="true" aria-label={cfg.title} style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 12, overflowY: "auto" }}>
      <div className="ttc-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,36,32,0.55)" }} />
      <div className="ttc-modal-inner" style={{ position: "relative", background: COLORS.cream, borderRadius: 20, width: 560, maxWidth: "100%", margin: "20px 0", padding: "24px 18px 26px" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, background: COLORS.bgSoft, border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={18} /></button>
        <h2 style={{ ...head, fontSize: 24, margin: "0 0 4px", paddingRight: 40 }}>{sel ? sel[1] + " " + sel[2] : cfg.title}</h2>
        <p style={{ fontSize: 13.5, color: "#5A4E46", margin: "0 0 14px" }}>{sel ? sel[3] : cfg.subtitle}</p>
        {!sel && (
          <div style={{ display: "grid", gap: 10 }}>
            {enabled.map(([k, name, emoji, line]) => (
              <button key={k} type="button" onClick={() => setGame(k)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", background: "#fff", border: `1.5px solid ${COLORS.gold}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: 30 }}>{emoji}</span><span><b style={{ display: "block", color: COLORS.maroonDark, fontSize: 15.5 }}>{name}</b><span style={{ fontSize: 12.5, color: "#7A6E64" }}>{line}</span></span>
              </button>
            ))}
            {!enabled.length && <p style={{ fontSize: 13.5 }}>No games are switched on right now.</p>}
          </div>
        )}
        {sel && enabled.length > 1 && <button type="button" onClick={() => setGame("")} style={{ background: "none", border: "none", color: COLORS.maroon, textDecoration: "underline", fontSize: 12.5, cursor: "pointer", padding: 0, marginBottom: 10 }}>← All games</button>}
        {game === "match" && <MatchGame cfg={cfg} products={products} onShop={onShop} />}
        {game === "puzzle" && <PuzzleGame cfg={cfg} products={products} onShop={onShop} onOpenProduct={(id) => { onClose(); onOpenProduct && onOpenProduct(id); }} />}
        {game === "wheel" && <WheelGame cfg={cfg} onShop={onShop} />}
      </div>
    </div>
  );
}

// The home-page block (or footer link target). Shows one tile per switched-on game.
export function GamesSection({ cfg, onOpen }) {
  const enabled = GAME_LIST.filter(([k]) => cfg[k] && cfg[k].on !== false);
  if (!enabled.length) return null;
  return (
    <section id="get-fun" style={{ maxWidth: 1000, margin: "0 auto", padding: "8px 16px" }}>
      <div style={{ background: "rgba(251,246,240,0.82)", borderRadius: "var(--ttc-panel-radius, 24px)", padding: "22px 18px", textAlign: "center" }}>
        <h2 style={{ ...head, fontSize: 26, margin: "0 0 4px" }}>{cfg.title}</h2>
        <p style={{ fontSize: 13.5, color: "#5A4E46", margin: "0 0 14px" }}>{cfg.subtitle}</p>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, enabled.length)}, minmax(0, 1fr))`, gap: 10 }}>
          {enabled.map(([k, name, emoji]) => (
            <button key={k} type="button" onClick={() => onOpen(k)} style={{ background: "#fff", border: `1.5px solid ${COLORS.gold}`, borderRadius: 16, padding: "14px 6px", cursor: "pointer", minHeight: 88 }}>
              <span style={{ fontSize: 28, display: "block" }}>{emoji}</span><b style={{ fontSize: 13, color: COLORS.maroonDark }}>{name}</b>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
