import React, { useEffect, useState } from "react";

// The big home-page heading with two optional effects (both switched on from
// the admin panel):
//   • reveal  — words come in one after another (rise / fade / blur / slide / zoom)
//   • rotator — one word keeps changing (rise / fade / slide / flip / blur / zoom)
// With both off it prints the heading exactly as before.

const css = `
@keyframes ttcRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes ttcFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes ttcBlurIn { from { opacity: 0; filter: blur(10px); transform: translateY(4px); } to { opacity: 1; filter: blur(0); transform: none; } }
@keyframes ttcSlideIn { from { opacity: 0; transform: translateX(-26px); } to { opacity: 1; transform: none; } }
@keyframes ttcZoomIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: none; } }
.ttc-reveal .ttc-w { display: inline-block; opacity: 0; animation: ttcRise 0.8s cubic-bezier(.22,.61,.36,1) forwards; animation-delay: calc(var(--i) * var(--ttc-step, 140ms)); }
.ttc-reveal.rv-fade .ttc-w { animation-name: ttcFadeIn; animation-duration: 1s; }
.ttc-reveal.rv-blur .ttc-w { animation-name: ttcBlurIn; animation-duration: 0.9s; }
.ttc-reveal.rv-slide .ttc-w { animation-name: ttcSlideIn; }
.ttc-reveal.rv-zoom .ttc-w { animation-name: ttcZoomIn; animation-duration: 0.7s; }

.ttc-rot { display: inline-grid; vertical-align: bottom; perspective: 500px; }
.ttc-rot > span { grid-area: 1 / 1; opacity: 0; transform: translateY(8px); transition: opacity .5s ease, transform .5s ease; }
.ttc-rot > span.on { opacity: 1; transform: none; }
/* other transitions: the old word leaves while the new one arrives */
.ttc-rot.fx-fade > span { transform: none; transition: opacity .6s ease; }
.ttc-rot[class*="fx-"] > span.on { opacity: 1; transform: none; filter: none; }
.ttc-rot.fx-slide > span { transform: translateY(100%); transition: opacity .45s ease, transform .5s cubic-bezier(.22,.61,.36,1); }
.ttc-rot.fx-slide > span.out { opacity: 0; transform: translateY(-100%); }
.ttc-rot.fx-flip > span { transform: rotateX(90deg); transform-origin: 50% 100%; transition: opacity .45s ease, transform .55s ease; }
.ttc-rot.fx-flip > span.out { opacity: 0; transform: rotateX(-90deg); transform-origin: 50% 0; }
.ttc-rot.fx-blur > span { transform: none; filter: blur(10px); transition: opacity .55s ease, filter .55s ease; }
.ttc-rot.fx-blur > span.on { filter: blur(0); }
.ttc-rot.fx-zoom > span { transform: scale(0.5); transition: opacity .5s ease, transform .5s cubic-bezier(.34,1.56,.64,1); }
.ttc-rot.fx-zoom > span.out { opacity: 0; transform: scale(1.5); }
@media (prefers-reduced-motion: reduce) {
  .ttc-reveal .ttc-w { animation: none; opacity: 1; }
  .ttc-rot > span { transition: none; }
}
`;

function RotatingWord({ words, speed, fx }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(-1);
  useEffect(() => {
    if (words.length < 2) return undefined;
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const timer = setInterval(() => setI((n) => { setPrev(n); return (n + 1) % words.length; }), Math.max(1200, Number(speed) || 2200));
    return () => clearInterval(timer);
  }, [words.length, speed]);
  const kind = ["fade", "slide", "flip", "blur", "zoom"].includes(fx) ? " fx-" + fx : "";
  return (
    <span className={"ttc-rot" + kind} aria-hidden="true">
      {words.map((w, n) => (
        <span key={w + n} className={n === i ? "on" : n === prev ? "out" : ""}>{w}</span>
      ))}
    </span>
  );
}

// "love," -> ["", "love", ","]
function splitWord(word) {
  const m = /^([^\p{L}\p{N}]*)([\p{L}\p{N}'’-]+)([^\p{L}\p{N}]*)$/u.exec(word);
  return m ? [m[1], m[2], m[3]] : ["", word, ""];
}

export default function HeroHeading({ lines, reveal, revealStyle, revealStep, rotatorWords, rotatorTarget, rotatorSpeed, rotatorFx, className, style }) {
  const fullText = lines.join(" ");
  const canRotate = Array.isArray(rotatorWords) && rotatorWords.filter(Boolean).length >= 2;
  const target = String(rotatorTarget || "").trim().toLowerCase();
  let rotatedOnce = false;
  let index = 0;

  const body = lines.map((line, li) => (
    <React.Fragment key={li}>
      {li > 0 && <br />}
      {line.split(" ").map((word, wi) => {
        const [pre, core, post] = splitWord(word);
        const rotate = canRotate && !rotatedOnce && target && core.toLowerCase() === target;
        if (rotate) rotatedOnce = true;
        const i = index++;
        const inner = rotate ? (
          <>
            {pre}
            <RotatingWord words={rotatorWords.filter(Boolean)} speed={rotatorSpeed} fx={rotatorFx} />
            {post}
          </>
        ) : word;
        return (
          <React.Fragment key={wi}>
            {reveal || rotate ? (
              <span className={reveal ? "ttc-w" : undefined} style={{ "--i": i, display: rotate && !reveal ? "inline-block" : undefined }} aria-hidden="true">{inner}</span>
            ) : inner}
            {" "}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  ));

  const rv = reveal && ["fade", "blur", "slide", "zoom"].includes(revealStyle) ? " rv-" + revealStyle : "";
  const step = Math.min(600, Math.max(40, Number(revealStep) || 140));
  return (
    <h1 className={`${className || ""}${reveal ? " ttc-reveal" : ""}${rv}`} style={{ ...style, "--ttc-step": `${step}ms` }} aria-label={fullText}>
      <style>{css}</style>
      {body}
    </h1>
  );
}
