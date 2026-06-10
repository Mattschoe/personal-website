/* =====================================================================
   Flow Field — interactive hero-circle effect.

   A framework-agnostic TS port of the design prototype's `scaffold` +
   `createFlowField` (`circle-effects-a.js`). Hundreds of palette particles
   stream like water along a divergence-free curl current; the cursor is a
   soft obstacle they get mildly "annoyed" by and slip AROUND — no pull, no
   vortex, no speed-up. Pure canvas/DOM: no React, no SSR-unsafe top-level
   access. The tuning constants are the result of Matt's iteration — do not
   tweak without re-checking the look.
   ===================================================================== */

export interface EffectInstance {
  destroy(): void;
}

export interface FlowFieldOptions {
  /** Palette hexes the particles are drawn in (order set by the caller). */
  colors: string[];
  /** Background hex, read from the theme at init (paints the watery trails). */
  bg: string;
  /** When false (reduced motion), paint one resting frame and don't loop. */
  animate: boolean;
}

// Fixed palette hexes — constant across themes (only --bg is theme-dependent).
export const PALETTE = {
  sage: '#ACCAB2',
  beeswax: '#E9A752',
  grenadine: '#D44720',
  latte: '#78614D',
} as const;

// Flow Field color order, from the prototype FX entry id `flow`.
export const FLOW_COLORS: string[] = [
  PALETTE.latte,
  PALETTE.sage,
  PALETTE.beeswax,
  PALETTE.grenadine,
];

interface Pointer {
  x: number;
  y: number;
  tx: number;
  ty: number;
  inside: boolean;
  down: boolean;
}

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: Pointer,
  t: number,
) => void;

interface Scaffold {
  ctx: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;
  pointer: Pointer;
  loop(fn: DrawFn, animate: boolean): void;
  destroy(): void;
}

// ---- shared scaffolding ---------------------------------------------------
// Returns null when there is no 2D context (e.g. jsdom) so callers can no-op.
function scaffold(canvas: HTMLCanvasElement): Scaffold | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const pointer: Pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, inside: false, down: false };

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function setP(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width;
    pointer.ty = (e.clientY - r.top) / r.height;
  }
  const onMove = (e: PointerEvent) => {
    setP(e);
    pointer.inside = true;
  };
  const onEnter = () => {
    pointer.inside = true;
  };
  const onLeave = () => {
    pointer.inside = false;
    pointer.tx = 0.5;
    pointer.ty = 0.5;
  };
  const onDown = (e: PointerEvent) => {
    pointer.down = true;
    setP(e);
  };
  const onUp = () => {
    pointer.down = false;
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerenter', onEnter);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);

  let raf = 0;
  let running = true;
  let drawFn: DrawFn | null = null;
  function step(t: number) {
    // ease pointer toward target
    pointer.x += (pointer.tx - pointer.x) * 0.12;
    pointer.y += (pointer.ty - pointer.y) * 0.12;
    if (drawFn) drawFn(ctx!, w, h, pointer, t);
  }
  function loop(fn: DrawFn, animate: boolean) {
    drawFn = fn;
    step(0); // paint an immediate first frame (resting state)
    if (!animate) return; // reduced motion: one resting frame, no rAF loop
    const tick = (t: number) => {
      if (!running) return;
      step(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function destroy() {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerenter', onEnter);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
  }
  return {
    ctx,
    get w() {
      return w;
    },
    get h() {
      return h;
    },
    pointer,
    loop,
    destroy,
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  c: string;
  spd: number;
  r: number;
}

/* =================================================================
   FLOW FIELD  (a stream you can disturb)
   Particles ride a divergence-free curl current with a dominant,
   slowly-rotating drift — so they STREAM across the circle like
   water, never clumping into static lanes. The cursor is not a
   magnet: it's a soft obstacle the particles get mildly "annoyed"
   by. They bunch aside, slip AROUND it (with a tiny jitter), then
   rejoin the current downstream. No pull, no vortex, no speed-up.
   ================================================================= */
export function createFlowField(
  canvas: HTMLCanvasElement,
  opt: FlowFieldOptions,
): EffectInstance {
  const s = scaffold(canvas);
  // No 2D context (jsdom / unsupported): a safe no-op instance.
  if (!s) return { destroy() {} };

  const cols = opt.colors;
  const N = 720;
  let parts: Particle[] = [];
  function seed(tt: number) {
    parts = Array.from({ length: N }, () => {
      const depth = Math.random(); // 0 = far/slow/small, 1 = near
      const o: Particle = {
        x: Math.random(),
        y: Math.random(), // normalized 0..1
        vx: 0,
        vy: 0,
        c: cols[(Math.random() * cols.length) | 0],
        spd: 0.7 + depth * 0.6, // parallax: nearer = faster
        r: 0.8 + depth * 1.7,
      };
      // pre-warm to the steady-state flow velocity so the stream is already
      // moving at full speed on the first frame — no "gaining motion" ramp.
      flow(o.x, o.y, tt, fv);
      o.vx = fv[0] * SPEED * o.spd;
      o.vy = fv[1] * SPEED * o.spd;
      return o;
    });
  }
  let seeded = false;
  let infl = 0; // eased cursor presence 0..1
  let intro = 0; // eased 0..1 reveal so the stream fades in from blank

  // tuning — everything is in normalized units / frame ------------
  const SPEED = 0.004; // flow speed scaler
  const DRIFT = 1.5; // constant stream bias (must dominate swirl)
  const ACC = 0.1; // how quickly a particle eases to flow velocity
  const VMAX = 0.013; // hard speed cap — kills any near-cursor sprint
  const REP_R = 0.17; // cursor "personal space" radius
  const REP = 0.006; // sideways shove strength
  const SLIDE = 0.0042; // tangential nudge => slip around, not bounce
  const JITTER = 0.0012; // tiny annoyed wobble
  const INTRO = 0.03; // per-frame ease of the blank -> full reveal (~1.5s)

  // divergence-free flow: velocity = curl of a streamfunction, so the
  // field has no sinks/sources => particles can't pile into lines.
  function flow(x: number, y: number, tt: number, out: [number, number]) {
    // octave 1
    const a1 = x * 3.1 + tt * 0.6;
    const b1 = y * 3.1 - tt * 0.5;
    let u = Math.sin(a1) * Math.cos(b1);
    let v = -Math.cos(a1) * Math.sin(b1);
    // octave 2 (finer, slower) for organic meander
    const a2 = x * 6.7 - tt * 0.4;
    const b2 = y * 6.7 + tt * 0.33;
    u += Math.sin(a2) * Math.cos(b2) * 0.45;
    v += -Math.cos(a2) * Math.sin(b2) * 0.45;
    // dominant drift — direction itself drifts slowly so the stream meanders
    const da = 0.35 + Math.sin(tt * 0.13) * 0.55;
    u += Math.cos(da) * DRIFT;
    v += Math.sin(da) * DRIFT;
    out[0] = u;
    out[1] = v;
  }

  const fv: [number, number] = [0, 0];
  s.loop((ctx, w, h, p, t) => {
    const tt = t * 0.0002;
    if (!seeded && w) {
      seed(tt);
      seeded = true;
    }
    // short watery trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = opt.bg;
    ctx.globalAlpha = 0.085;
    ctx.fillRect(0, 0, w, h);

    // Reveal the stream from blank: ramp stroke opacity 0 -> 1 on first load so
    // it "flows in" rather than popping. Static (reduced-motion) frame is full.
    intro += (1 - intro) * INTRO;
    ctx.globalAlpha = opt.animate ? intro : 1;

    const px = p.x;
    const py = p.y;
    infl += ((p.inside ? 1 : 0) - infl) * 0.08; // ease cursor in/out

    ctx.lineCap = 'round';
    for (const o of parts) {
      // --- target velocity from the streaming current
      flow(o.x, o.y, tt, fv);
      const tvx = fv[0] * SPEED * o.spd;
      const tvy = fv[1] * SPEED * o.spd;
      let ax = (tvx - o.vx) * ACC;
      let ay = (tvy - o.vy) * ACC;

      // --- cursor as a soft obstacle: shove aside + slide around
      if (infl > 0.01) {
        const dx = o.x - px;
        const dy = o.y - py; // points AWAY from cursor
        const d = Math.hypot(dx, dy) + 1e-4;
        if (d < REP_R) {
          const f = 1 - d / REP_R; // 0 at edge -> 1 at center
          const ff = f * f * infl; // smooth, eased by presence
          const nx = dx / d;
          const ny = dy / d;
          // push out of its personal space
          ax += nx * REP * ff;
          ay += ny * REP * ff;
          // tangential: pick the side that agrees with the local flow so the
          // particle skootches past instead of getting knocked backward
          const cross = tvx * ny - tvy * nx;
          const side = cross >= 0 ? 1 : -1;
          ax += -ny * SLIDE * ff * side;
          ay += nx * SLIDE * ff * side;
          // mildly annoyed wobble
          ax += (Math.random() - 0.5) * JITTER * ff;
          ay += (Math.random() - 0.5) * JITTER * ff;
        }
      }

      o.vx += ax;
      o.vy += ay;
      // hard speed cap — no insane sprints anywhere
      const sp = Math.hypot(o.vx, o.vy);
      if (sp > VMAX) {
        o.vx = (o.vx / sp) * VMAX;
        o.vy = (o.vy / sp) * VMAX;
      }
      o.x += o.vx;
      o.y += o.vy;

      // wrap softly at edges (circle clip hides the seam) so the
      // stream is endless and density stays even
      if (o.x < -0.06) o.x += 1.12;
      else if (o.x > 1.06) o.x -= 1.12;
      if (o.y < -0.06) o.y += 1.12;
      else if (o.y > 1.06) o.y -= 1.12;

      // draw a short streak along velocity — reads as flowing water
      const x2 = o.x * w;
      const y2 = o.y * h;
      const x1 = x2 - o.vx * w * 5.0;
      const y1 = y2 - o.vy * h * 5.0;
      ctx.strokeStyle = o.c;
      ctx.lineWidth = o.r;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }, opt.animate);

  return { destroy: s.destroy };
}
