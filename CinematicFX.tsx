"use client";

import { useEffect, useRef, type CSSProperties } from "react";

export default function CinematicFX() {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const cat = root.querySelector<HTMLElement>(".fx-cat-cursor");
    const trailDots = Array.from(root.querySelectorAll<HTMLElement>(".fx-cat-trail-dot"));
    if (!cat) return;

    let x = window.innerWidth * 0.5;
    let y = window.innerHeight * 0.5;
    let tx = x;
    let ty = y;
    let raf = 0;
    let lastScroll = window.scrollY;
    let lastTime = performance.now();
    const trail = trailDots.map(() => ({ x, y }));

    const tick = () => {
      raf = 0;
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.12;
      cat.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      for (let i = 0; i < trail.length; i += 1) {
        const point = trail[i];
        const targetX = i === 0 ? x : trail[i - 1].x;
        const targetY = i === 0 ? y : trail[i - 1].y;
        const follow = 0.18 - i * 0.018;
        point.x += (targetX - point.x) * Math.max(0.08, follow);
        point.y += (targetY - point.y) * Math.max(0.06, follow);
        trailDots[i]?.style.setProperty("--trail-x", `${point.x}px`);
        trailDots[i]?.style.setProperty("--trail-y", `${point.y}px`);
      }
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      tx = event.clientX;
      ty = event.clientY;
      root.style.setProperty("--fx-pointer-x", `${event.clientX}px`);
      root.style.setProperty("--fx-pointer-y", `${event.clientY}px`);
      root.classList.add("fx-pointer-active");
      schedule();
    };


    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        const now = performance.now();
        const dy = window.scrollY - lastScroll;
        const dt = Math.max(16, now - lastTime);
        const velocity = Math.max(-3, Math.min(3, (dy / dt) * 14));
        root.style.setProperty("--fx-scroll-velocity", velocity.toFixed(3));
        root.style.setProperty("--fx-scroll-shift", `${(-velocity * 18).toFixed(1)}px`);
        root.style.setProperty("--fx-scroll-skew", `${(velocity * 0.45).toFixed(2)}deg`);
        lastScroll = window.scrollY;
        lastTime = now;
      });
    };

    const magneticTargets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".light-cake-button, .firework-button, .maki-lock, .letter-envelope, .letter-close, .maki-reset, .wish-choice, .wish-seal-button"
      )
    );

    const handlers = magneticTargets.map((el) => {
      const move = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const max = 130;
        const distance = Math.hypot(dx, dy);
        if (distance > max) return;
        const force = Math.pow(1 - distance / max, 2);
        el.style.setProperty("--mag-x", `${(dx * 0.12 * force).toFixed(1)}px`);
        el.style.setProperty("--mag-y", `${(dy * 0.12 * force).toFixed(1)}px`);
      };
      const leave = () => {
        el.style.setProperty("--mag-x", "0px");
        el.style.setProperty("--mag-y", "0px");
      };
      el.addEventListener("pointermove", move, { passive: true });
      el.addEventListener("pointerleave", leave, { passive: true });
      return { el, move, leave };
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        el.style.removeProperty("--mag-x");
        el.style.removeProperty("--mag-y");
      });
    };
  }, []);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      const sunset = Math.min(1, Math.max(0, (progress - 0.10) / 0.14));
      const night = Math.min(1, Math.max(0, (progress - 0.24) / 0.18));
      // A compact site needs a compact day: sunrise begins immediately,
      // sunset arrives early, and full night is reached around the middle.
      const sunTravel = Math.min(1, progress / 0.24);
      const sunAngle = -Math.PI * 0.82 + sunTravel * Math.PI * 0.96;
      const sunX = Math.cos(sunAngle) * 42;
      const sunY = Math.sin(sunAngle) * 38 - 4;
      const sunScale = Math.max(0.05, 1 - sunTravel * 0.96);
      const moonTravel = Math.min(1, Math.max(0, (progress - 0.24) / 0.68));
      const viewportWidth = window.innerWidth || 1000;
      const viewportHeight = window.innerHeight || 800;
      const moonAngle = -Math.PI * 0.76 + moonTravel * Math.PI * 1.52;
      const moonX = Math.cos(moonAngle) * viewportWidth * 0.46;
      const moonY = Math.sin(moonAngle) * viewportHeight * 0.23;

      world.style.setProperty("--dn-progress", progress.toFixed(4));
      world.style.setProperty("--dn-sunset", sunset.toFixed(4));
      world.style.setProperty("--dn-night", night.toFixed(4));
      world.style.setProperty("--dn-stars", Math.min(1, Math.max(0, (night - .01) * 1.28)).toFixed(4));
      world.style.setProperty("--dn-sun-x", sunX.toFixed(1));
      world.style.setProperty("--dn-sun-y", sunY.toFixed(1));
      world.style.setProperty("--dn-sun-scale", sunScale.toFixed(3));
      world.style.setProperty("--dn-moon-x", moonX.toFixed(1));
      world.style.setProperty("--dn-moon-y", moonY.toFixed(1));
      world.style.setProperty("--dn-scroll", window.scrollY.toFixed(1));
    };
    const schedule = () => { if (!raf) raf = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const stars = Array.from({ length: 72 }, (_, i) => {
    const x = (Math.sin((i + 1) * 91.7) * 43758.5) % 1;
    const y = (Math.sin((i + 1) * 47.3) * 15731.9) % 1;
    const f = (v: number) => Math.abs(v);
    return {
      left: `${(f(x) * 96 + 2).toFixed(3)}%`,
      top: `${(f(y) * 92 + 2).toFixed(3)}%`,
      size: `${(1.1 + f(Math.sin(i * 12.7)) * 2.2).toFixed(2)}px`,
      duration: `${(3.8 + f(Math.cos(i * 8.2)) * 4.2).toFixed(2)}s`,
      delay: `${(f(Math.sin(i * 3.1)) * 3.2).toFixed(2)}s`,
    };
  });

  return (
    <>
      <div ref={worldRef} className="day-night-world" aria-hidden="true">
        <div className="day-night-sky" />
        <div className="day-night-clouds" />
        <div className="day-night-horizon" />
        <div className="day-night-sun"><span className="day-night-sun-halo" /></div>
        <div className="day-night-twilight" />
        <div className="day-night-nightwash" />
        <div className="day-night-stars">
          {stars.map((star, i) => <span key={i} style={{ left: star.left, top: star.top, ['--star-size' as string]: star.size, ['--star-duration' as string]: star.duration, ['--star-delay' as string]: star.delay } as CSSProperties} />)}
        </div>
        <div className="day-night-moon" />
      </div>
      <div ref={rootRef} className="cinematic-fx" aria-hidden="true">
        <div className="fx-cat-trail" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => <span key={i} className="fx-cat-trail-dot" />)}
        </div>
        <div className="fx-cat-cursor" aria-hidden="true">
          <svg className="fx-cat-svg" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M65 61C83 66 103 58 111 43C115 35 112 24 104 20C96 16 88 21 85 28C80 18 71 12 59 13C47 14 39 21 36 31C26 23 15 26 11 34C6 44 13 55 24 57C32 59 39 55 43 49C47 55 55 59 65 61Z" fill="#fff8fc" stroke="#2b2530" strokeWidth="2.2" strokeLinejoin="round"/>
            <path d="M31 36L24 17L41 28" fill="#ffb7d9" stroke="#2b2530" strokeWidth="2.2" strokeLinejoin="round"/>
            <path d="M77 29L92 13L94 36" fill="#ffb7d9" stroke="#2b2530" strokeWidth="2.2" strokeLinejoin="round"/>
            <circle cx="53" cy="36" r="3.1" fill="#2b2530"/>
            <circle cx="70" cy="36" r="3.1" fill="#2b2530"/>
            <path d="M61 42C59 45 58 46 61 48C64 46 64 44 61 42Z" fill="#ff8fbd"/>
            <path d="M59 49C56 53 51 53 48 51M63 49C66 53 71 53 74 51" stroke="#2b2530" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M19 40L6 37M20 46L5 48M78 47C96 56 109 72 104 85C101 92 94 94 88 90" stroke="#fff8fc" strokeWidth="5.5" strokeLinecap="round"/>
            <path d="M78 47C96 56 109 72 104 85C101 92 94 94 88 90" stroke="#2b2530" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="fx-vignette" />
        <div className="fx-scan" />
      </div>
        <style jsx global>{`
          @media (hover:hover) and (pointer:fine) {
            html, body, body * { cursor: none !important; }
          }
          .fx-cat-cursor {
            position: fixed;
            left: 0; top: 0;
            width: 58px; height: 48px;
            margin: -25px 0 0 -20px;
            z-index: 10001;
            opacity: 0;
            pointer-events: none;
            transform-origin: 24px 22px;
            will-change: transform;
            filter: drop-shadow(0 7px 14px rgba(255,145,205,.22));
          }
          .fx-cat-svg { width: 100%; height: 100%; display: block; overflow: visible; }
          .fx-pointer-active .fx-cat-cursor { opacity: .98; }
          .fx-cat-trail {
            position: fixed; inset: 0; z-index: 10000; pointer-events: none;
          }
          .fx-cat-trail-dot {
            position: fixed; left: 0; top: 0;
            width: 5px; height: 5px;
            margin: -2.5px 0 0 -2.5px;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(255,240,250,.95) 0%, rgba(255,164,218,.72) 38%, rgba(255,164,218,0) 76%);
            box-shadow: 0 0 12px rgba(255,150,220,.45);
            opacity: .72;
            transform: translate3d(var(--trail-x,0px), var(--trail-y,0px), 0) scale(var(--trail-scale,1));
            transition: opacity .2s ease;
            will-change: transform;
          }
          .fx-cat-trail-dot:nth-child(1){--trail-scale:1}
          .fx-cat-trail-dot:nth-child(2){--trail-scale:.9}
          .fx-cat-trail-dot:nth-child(3){--trail-scale:.8}
          .fx-cat-trail-dot:nth-child(4){--trail-scale:.7}
          .fx-cat-trail-dot:nth-child(5){--trail-scale:.6}
          .fx-cat-trail-dot:nth-child(6){--trail-scale:.48}
          .fx-cat-trail-dot:nth-child(7){--trail-scale:.36}
          @keyframes fxCatBob {
            0%,100% { margin-top:-25px; }
            50% { margin-top:-27px; }
          }
          .fx-cat-cursor { animation: fxCatBob 1.05s ease-in-out infinite; }
          @media (max-width:768px) {
            .fx-cat-cursor, .fx-cat-trail { display:none !important; }
            .fx-vignette { background: radial-gradient(circle at center, transparent 44%, rgba(0,0,0,.2) 100%); }
          }
        `}</style>
    </>
  );
}
