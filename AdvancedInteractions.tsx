"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Star = {
  x: string;
  y: string;
  s: string;
  d: string;
  dur: string;
};

function deterministic(index: number, salt: number) {
  const x = Math.sin((index + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const MAGNETIC_SELECTOR =
  ".light-cake-button, .firework-button, .maki-lock, .letter-envelope, .letter-close, .maki-reset, .wish-choice, .wish-seal-button";

export default function AdvancedInteractions() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [wishStar, setWishStar] = useState(false);
  const filmLabelRef = useRef<HTMLSpanElement>(null);
  const previousMagneticRef = useRef<HTMLElement | null>(null);

  const starLayers = useMemo(() => {
    return [0, 1, 2].map((layer) =>
      Array.from({ length: layer === 0 ? 20 : layer === 1 ? 28 : 36 }, (_, i) => ({
        x: `${(deterministic(i, 10 + layer) * 96 + 2).toFixed(2)}%`,
        y: `${(deterministic(i, 30 + layer) * 94 + 2).toFixed(2)}%`,
        s: `${(0.9 + deterministic(i, 50 + layer) * (layer === 0 ? 1.8 : 2.7)).toFixed(2)}px`,
        d: `${(deterministic(i, 70 + layer) * 3.5).toFixed(2)}s`,
        dur: `${(2.6 + deterministic(i, 90 + layer) * 4.8).toFixed(2)}s`,
      }))
    );
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    document.documentElement.classList.add("advanced-motion-enabled");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return () => document.documentElement.classList.remove("advanced-motion-enabled");

    let raf = 0;
    let filmTimer = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let lastMemoryIndex = -1;

    const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
    const ease = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

    const update = () => {
      raf = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = clamp01(window.scrollY / maxScroll);
      const now = performance.now();
      const dt = Math.max(16, now - lastT);
      const velocity = Math.max(-2.8, Math.min(2.8, ((window.scrollY - lastY) / dt) * 14));
      lastY = window.scrollY;
      lastT = now;

      root.style.setProperty("--advanced-scroll", scrollProgress.toFixed(4));
      root.style.setProperty("--advanced-velocity", velocity.toFixed(3));
      root.style.setProperty("--advanced-speed", Math.abs(velocity).toFixed(3));
      root.style.setProperty("--advanced-pointer-x", `${pointerX}px`);
      root.style.setProperty("--advanced-pointer-y", `${pointerY}px`);

      const memories = Array.from(document.querySelectorAll<HTMLElement>(".memory-slide"));
      let activeMemory = -1;
      let activeDistance = Number.POSITIVE_INFINITY;
      const viewport = Math.max(1, window.innerHeight);
      const viewportCenter = viewport * 0.5;

      memories.forEach((slide, index) => {
        const rect = slide.getBoundingClientRect();
        const length = Math.max(1, rect.height - viewport);
        const progress = clamp01(-rect.top / length);
        const centerDistance = Math.abs(rect.top + rect.height * 0.5 - viewportCenter);
        if (centerDistance < activeDistance && rect.bottom > 0 && rect.top < viewport) {
          activeDistance = centerDistance;
          activeMemory = index;
        }

        const focus = ease(Math.max(0, 1 - Math.abs(progress - 0.42) / 0.42));
        const breakout = Math.sin(progress * Math.PI);
        const exit = ease((progress - 0.76) / 0.24);

        slide.style.setProperty("--advanced-photo-zoom", `${(focus * 0.12).toFixed(3)}`);
        slide.style.setProperty("--glass-drift-x", `${(velocity * -3.2).toFixed(1)}px`);
        slide.style.setProperty("--glass-drift-y", `${(-Math.sin(progress * Math.PI) * 8 + velocity * 1.8).toFixed(1)}px`);
        slide.style.setProperty("--glass-tilt-y", `${(velocity * 0.62).toFixed(2)}deg`);
        slide.style.setProperty("--glass-tilt-x", `${(-velocity * 0.22).toFixed(2)}deg`);
        slide.style.setProperty("--photo-break-x", `${((index % 2 === 0 ? 1 : -1) * breakout * 22).toFixed(1)}px`);
        slide.style.setProperty("--photo-break-y", `${(-breakout * 42 + exit * -42).toFixed(1)}px`);
        slide.style.setProperty("--photo-break-scale", `${(1 + breakout * 0.08 + exit * 0.05).toFixed(3)}`);
        slide.style.setProperty("--photo-break-rotate", `${((index % 2 === 0 ? 1 : -1) * breakout * 1.8).toFixed(2)}deg`);
        slide.style.setProperty("--memory-stage-glass-x", `${(velocity * -1.7).toFixed(1)}px`);
      });

      if (activeMemory !== -1 && activeMemory !== lastMemoryIndex) {
        lastMemoryIndex = activeMemory;
        const label = memories[activeMemory]?.dataset.memory ?? String(activeMemory + 1).padStart(2, "0");
        filmLabelRef.current?.replaceChildren(document.createTextNode(`MEMORY ${label}`));
        root.classList.remove("film-cutting");
        void root.offsetWidth;
        root.classList.add("film-cutting");
        window.clearTimeout(filmTimer);
        filmTimer = window.setTimeout(() => root.classList.remove("film-cutting"), 560);
      }

      // Candle physics: write only variables. The page CSS composes them with the flicker animation.
      const flame = document.querySelector<HTMLElement>(".cake-lit .candle-flame");
      const cakeStage = document.querySelector<HTMLElement>(".cake-lit .cake-stage");
      if (flame && cakeStage) {
        const rect = cakeStage.getBoundingClientRect();
        const cx = rect.left + rect.width * 0.5;
        const cy = rect.top + rect.height * 0.18;
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        const distance = Math.hypot(dx, dy);
        const influence = clamp01(1 - distance / 260);
        flame.style.setProperty("--candle-bend", `${(dx * 0.038 * influence).toFixed(2)}deg`);
        flame.style.setProperty("--candle-sway", `${(dy * -0.016 * influence).toFixed(2)}px`);
        flame.style.setProperty("--candle-scale", `${(1 + influence * 0.16).toFixed(3)}`);
      }

      // Balloon physics: animation stays in charge of the fall; these vars add a live gust around the pointer.
      document.querySelectorAll<HTMLElement>(".cake-lit .cake-balloon").forEach((balloon, index) => {
        const rect = balloon.getBoundingClientRect();
        const bx = rect.left + rect.width * 0.5;
        const by = rect.top + rect.height * 0.5;
        const distance = Math.hypot(pointerX - bx, pointerY - by);
        const influence = clamp01(1 - distance / 260);
        const strength = Math.pow(influence, 2) * 22;
        const awayX = distance > 1 ? (bx - pointerX) / distance : 0;
        const awayY = distance > 1 ? (by - pointerY) / distance : -1;
        balloon.style.setProperty("--pointer-drift-x", `${(awayX * strength).toFixed(1)}px`);
        balloon.style.setProperty("--pointer-drift-y", `${(awayY * strength * 0.65).toFixed(1)}px`);
        balloon.style.setProperty("--pointer-rot", `${(Math.sin((window.scrollY + index * 90) * 0.006) * 4 + awayX * influence * 5).toFixed(2)}deg`);
      });

      // Parallax glass world.
      const glassX = ((pointerX / Math.max(1, window.innerWidth)) - 0.5) * 34;
      const glassY = ((pointerY / Math.max(1, window.innerHeight)) - 0.5) * 22;
      root.style.setProperty("--glass-x", `${glassX.toFixed(1)}px`);
      root.style.setProperty("--glass-y", `${glassY.toFixed(1)}px`);
      root.style.setProperty("--glass-scroll", `${(-scrollProgress * 180).toFixed(1)}px`);

      // Cat companion has a long intentional path through the page.
      const cat = root.querySelector<HTMLElement>(".fx-companion-cat");
      if (cat) {
        cat.style.setProperty("--cat-x", `${12 + scrollProgress * 76}%`);
        cat.style.setProperty("--cat-y", `${68 - scrollProgress * 34}%`);
        cat.style.setProperty("--cat-wiggle", `${(Math.sin(now * 0.002) * 2.8 + velocity * 1.3).toFixed(2)}deg`);
      }
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      root.style.setProperty("--advanced-pointer-x", `${pointerX}px`);
      root.style.setProperty("--advanced-pointer-y", `${pointerY}px`);

      const target = (event.target as Element | null)?.closest<HTMLElement>(MAGNETIC_SELECTOR) ?? null;
      if (previousMagneticRef.current && previousMagneticRef.current !== target) {
        previousMagneticRef.current.style.setProperty("--mag-x", "0px");
        previousMagneticRef.current.style.setProperty("--mag-y", "0px");
      }
      previousMagneticRef.current = target;

      if (target && event.pointerType !== "touch") {
        const rect = target.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width * 0.5);
        const dy = event.clientY - (rect.top + rect.height * 0.5);
        const distance = Math.hypot(dx, dy);
        const max = 150;
        const force = distance < max ? Math.pow(1 - distance / max, 2) : 0;
        target.style.setProperty("--mag-x", `${(dx * 0.15 * force).toFixed(1)}px`);
        target.style.setProperty("--mag-y", `${(dy * 0.15 * force).toFixed(1)}px`);
      }
      schedule();
    };

    const onPointerLeave = () => {
      const target = previousMagneticRef.current;
      target?.style.setProperty("--mag-x", "0px");
      target?.style.setProperty("--mag-y", "0px");
      previousMagneticRef.current = null;
    };

    const onScroll = () => schedule();
    const onResize = () => schedule();

    // Wish-to-star uses delegation so the sealed wish button can be created/replaced later.
    const onWishClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(".wish-ready-button");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      root.style.setProperty("--wish-start-x", `${rect.left + rect.width * 0.5 - rootRect.left}px`);
      root.style.setProperty("--wish-start-y", `${rect.top + rect.height * 0.5 - rootRect.top}px`);
      setWishStar(true);
      root.classList.remove("wish-star-launch");
      void root.offsetWidth;
      root.classList.add("wish-star-launch");
      window.setTimeout(() => root.classList.remove("wish-star-launch"), 2400);
    };

    document.addEventListener("click", onWishClick);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    schedule();

    return () => {
      document.documentElement.classList.remove("advanced-motion-enabled");
      document.removeEventListener("click", onWishClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(filmTimer);
      if (raf) window.cancelAnimationFrame(raf);
      previousMagneticRef.current?.style.removeProperty("--mag-x");
      previousMagneticRef.current?.style.removeProperty("--mag-y");
    };
  }, []);

  return (
    <div ref={rootRef} className="advanced-interactions" aria-hidden="false">
      <div className="depth-starfield" aria-hidden="true">
        {starLayers.map((layer, layerIndex) => (
          <div key={layerIndex} className={`depth-stars depth-stars-${layerIndex + 1}`}>
            {layer.map((star, i) => (
              <span
                key={i}
                style={{
                  left: star.x,
                  top: star.y,
                  ["--star-size" as string]: star.s,
                  ["--star-delay" as string]: star.d,
                  ["--star-duration" as string]: star.dur,
                } as CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="glass-parallax-world" aria-hidden="true">
        <span className="glass-pane glass-pane-a" />
        <span className="glass-pane glass-pane-b" />
        <span className="glass-pane glass-pane-c" />
        <span className="glass-grid" />
      </div>

      <div className="film-cut" aria-hidden="true">
        <span ref={filmLabelRef}>MEMORY 01</span>
        <i />
      </div>

      <div className="fx-companion-cat" aria-hidden="true">
        <svg viewBox="0 0 140 110" className="fx-companion-svg">
          <path d="M68 64C92 72 119 62 128 43C132 34 127 22 117 19C108 16 99 22 96 30C91 18 79 11 65 13C51 14 42 22 39 33C28 24 15 28 11 39C7 50 16 61 29 62C38 63 45 58 49 51C53 58 60 62 68 64Z" fill="#fff8fb" stroke="#302934" strokeWidth="2.3" strokeLinejoin="round" />
          <path d="M33 39L25 17L44 29" fill="#ffb9dc" stroke="#302934" strokeWidth="2.2" />
          <path d="M88 30L104 15L103 39" fill="#ffb9dc" stroke="#302934" strokeWidth="2.2" />
          <circle cx="58" cy="40" r="4" fill="#2d2731" />
          <circle cx="79" cy="39" r="4" fill="#2d2731" />
          <path d="M67 48 Q69 51 72 48" stroke="#2d2731" strokeWidth="2" strokeLinecap="round" />
          <path d="M47 73 Q68 86 88 73" stroke="#fff8fb" strokeWidth="11" strokeLinecap="round" />
          <path d="M94 66 C119 71 128 91 117 101" stroke="#fff8fb" strokeWidth="9" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {wishStar && <div className="wish-star-projectile" aria-hidden="true"><span /></div>}

      <div className="glass-depth-vignette" aria-hidden="true" />

      <style jsx global>{`
        .advanced-interactions {
          position: fixed;
          inset: 0;
          z-index: 118;
          pointer-events: none;
          overflow: hidden;
        }

        .depth-starfield {
          position: absolute;
          inset: -10vh -8vw;
          opacity: var(--advanced-night-stars, 0);
          transition: opacity .2s linear;
        }
        .depth-stars { position: absolute; inset: 0; }
        .depth-stars span {
          position: absolute;
          width: var(--star-size);
          height: var(--star-size);
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 7px rgba(255,255,255,.78), 0 0 16px rgba(188,212,255,.38);
          animation: advancedStarTwinkle var(--star-duration) ease-in-out var(--star-delay) infinite;
        }
        .depth-stars-1 { transform: translate3d(0, calc(var(--advanced-scroll, 0) * -140px), 0); opacity: .9; }
        .depth-stars-2 { transform: translate3d(0, calc(var(--advanced-scroll, 0) * -74px), 0); opacity: .62; }
        .depth-stars-3 { transform: translate3d(0, calc(var(--advanced-scroll, 0) * -30px), 0); opacity: .42; }
        @keyframes advancedStarTwinkle {
          0%,100% { opacity: .16; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.35); }
        }

        .glass-parallax-world {
          position: absolute;
          inset: -18%;
          transform: translate3d(var(--glass-x,0px), calc(var(--glass-y,0px) + var(--glass-scroll,0px)), 0);
          transform-origin: center;
          opacity: .64;
          mix-blend-mode: screen;
          filter: blur(.1px);
        }
        .glass-pane,
        .glass-grid {
          position: absolute;
          display: block;
          pointer-events: none;
        }
        .glass-pane {
          border: 1px solid rgba(255,255,255,.065);
          background:
            linear-gradient(135deg, rgba(255,255,255,.055), rgba(255,255,255,.008) 42%, rgba(145,132,255,.04)),
            radial-gradient(circle at 20% 10%, rgba(255,177,224,.08), transparent 38%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 24px 80px rgba(0,0,0,.08);
          backdrop-filter: blur(2px);
        }
        .glass-pane-a { width: 54vw; height: 36vh; left: -6vw; top: 14vh; transform: perspective(1200px) rotateY(18deg) rotateZ(-4deg); }
        .glass-pane-b { width: 42vw; height: 48vh; right: -8vw; top: 31vh; transform: perspective(1200px) rotateY(-22deg) rotateZ(7deg); }
        .glass-pane-c { width: 30vw; height: 24vh; left: 37vw; bottom: -7vh; transform: perspective(1200px) rotateY(8deg) rotateX(12deg) rotateZ(-8deg); }
        .glass-grid {
          inset: 4% 7%;
          background:
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 72px 72px;
          opacity: .26;
        }

        .film-cut {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%) scale(.96);
          opacity: 0;
          width: min(460px,70vw);
          text-align: center;
          font-size: 9px;
          letter-spacing: .42em;
          color: rgba(255,255,255,.82);
        }
        .film-cut i {
          display: block;
          width: 100%;
          height: 1px;
          margin-top: 16px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
        }
        .film-cutting .film-cut { animation: filmCut .56s cubic-bezier(.16,1,.3,1); }
        @keyframes filmCut {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(1.08); filter: blur(10px); }
          22% { opacity: .58; }
          48% { opacity: .22; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(.96); filter: blur(0); }
        }

        .fx-companion-cat {
          position: absolute;
          left: var(--cat-x,12%);
          top: var(--cat-y,65%);
          width: 88px;
          transform: translate(-50%,-50%) rotate(var(--cat-wiggle,0deg));
          opacity: .42;
          filter: drop-shadow(0 10px 22px rgba(255,169,214,.15));
          transition: left .18s linear, top .18s linear;
        }
        .fx-companion-svg { width:100%; height:auto; display:block; }
        .advanced-motion-enabled .fx-companion-cat { animation: companionFloat 3.8s ease-in-out infinite; }
        @keyframes companionFloat { 50% { translate: 0 -8px; } }

        .wish-star-projectile {
          position: fixed;
          left: 0;
          top: 0;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 18px #fff, 0 0 46px rgba(125,249,255,.72);
          opacity: 0;
          transform: translate3d(var(--wish-start-x,50vw), var(--wish-start-y,60vh), 0) scale(.3);
        }
        .wish-star-projectile::before,
        .wish-star-projectile::after,
        .wish-star-projectile span::before,
        .wish-star-projectile span::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 28px;
          border-radius: 99px;
          background: linear-gradient(180deg, #fff, rgba(255,255,255,0));
          transform-origin: 50% 0;
        }
        .wish-star-projectile::before { transform: translate(-50%,-50%) rotate(0deg); }
        .wish-star-projectile::after { transform: translate(-50%,-50%) rotate(90deg); }
        .wish-star-projectile span::before { transform: translate(-50%,-50%) rotate(45deg); }
        .wish-star-projectile span::after { transform: translate(-50%,-50%) rotate(135deg); }
        .wish-star-launch .wish-star-projectile {
          animation: wishStarFly 2.35s cubic-bezier(.2,.8,.2,1) forwards;
        }
        @keyframes wishStarFly {
          0% { opacity: 0; transform: translate3d(var(--wish-start-x), var(--wish-start-y), 0) scale(.25) rotate(0deg); }
          12% { opacity: 1; }
          54% { opacity: 1; transform: translate3d(50vw, 25vh, 0) scale(1.15) rotate(130deg); }
          78% { opacity: 1; transform: translate3d(72vw, 13vh, 0) scale(.8) rotate(220deg); }
          100% { opacity: 0; transform: translate3d(84vw, 7vh, 0) scale(.08) rotate(360deg); }
        }

        /* sound system intentionally removed */
        .glass-depth-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 42%, rgba(0,0,0,.08) 72%, rgba(0,0,0,.25) 100%);
          opacity: .34;
        }

        .advanced-motion-enabled .memory-stage {
          transform: translate3d(
            calc(var(--igloo-inner-y,0px) * .35 + var(--glass-drift-x,0px)),
            calc(var(--igloo-inner-y,0px) + var(--glass-drift-y,0px)),
            0
          ) rotateX(var(--glass-tilt-x,0deg)) rotateY(var(--glass-tilt-y,0deg)) scale(var(--igloo-scale-inner,1));
          transition: transform .16s linear;
        }

        .advanced-motion-enabled .memory-stage .photo-image-wrap {
          overflow: visible;
        }
        .advanced-motion-enabled .memory-stage .photo-card {
          transform:
            translate3d(var(--photo-break-x,0px), var(--photo-break-y,0px), 0)
            scale(var(--memory-card-scale,1));
          transition: transform .16s linear, box-shadow .45s ease;
        }
        .advanced-motion-enabled .memory-stage .photo-image {
          transform:
            translate3d(var(--photo-break-x,0px), var(--photo-break-y,0px), 0)
            rotate(var(--photo-break-rotate,0deg))
            scale(calc(var(--memory-image-scale,1) * var(--photo-break-scale,1) + var(--advanced-photo-zoom,0)));
        }

        /* Compose pointer physics into the existing balloon fall animation instead of competing with it. */
        .advanced-motion-enabled .cake-balloon {
          --pointer-drift-x: 0px;
          --pointer-drift-y: 0px;
          --pointer-rot: 0deg;
        }

        .advanced-motion-enabled .light-cake-button:hover,
        .advanced-motion-enabled .firework-button:hover,
        .advanced-motion-enabled .maki-lock:hover,
        .advanced-motion-enabled .letter-envelope:hover {
          filter: brightness(1.08);
        }

        @media (max-width: 768px) {
          .glass-parallax-world { opacity: .3; }
          .fx-companion-cat { width: 62px; opacity: .25; }
          .film-cut { width: 78vw; }
          .depth-starfield { inset: -4vh -12vw; }
        }

        @media (prefers-reduced-motion: reduce) {
          .advanced-interactions { display: none; }
        }
      `}</style>
    </div>
  );
}
