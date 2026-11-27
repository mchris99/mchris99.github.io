// The hero: a name drawn as a red cut path on plywood. The cursor is the laser head;
// wherever it passes over the letters, they get engraved. If nobody moves the mouse,
// the laser rasters the whole name once on its own.

export async function startLaser(canvas: HTMLCanvasElement, lines: string[]) {
  const ctx = canvas.getContext('2d')!;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Big Shoulders Stencil Variable"';
  try {
    await document.fonts.load(`800 120px ${FONT}`);
  } catch {}

  const INK = '#1a120c';
  const CUT = '#e5302a';
  let w = 0,
    h = 0,
    dpr = 1;
  let fontSize = 100,
    lineH = 90,
    x0 = 0,
    y0 = 0,
    textW = 0;
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d')!;
  const scorch = document.createElement('canvas');
  const sctx = scorch.getContext('2d')!;
  const fill = document.createElement('canvas');
  const fctx = fill.getContext('2d', { willReadFrequently: true })!;
  const etched = document.createElement('canvas');
  const ectx = etched.getContext('2d')!;
  let dirty = true;
  let complete = false;

  let lx = -100,
    ly = -100,
    px = -100,
    py = -100,
    on = false;
  let auto: { t0: number; dur: number } | null = null;
  let userMoved = false;
  let clearing = 0; // frames left in the wipe after a click on the name
  const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

  const setFont = (c: CanvasRenderingContext2D) => {
    c.font = `800 ${fontSize}px ${FONT}`;
    c.textBaseline = 'alphabetic';
  };

  function layout() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    for (const c of [canvas, mask, scorch, fill, etched]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Fit the longest line to the width, and all lines to the height.
    setFont(ctx);
    ctx.font = `800 100px ${FONT}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const pad = Math.max(30, w * 0.035);
    fontSize = Math.min(((w - pad * 2) / widest) * 100, (h - pad * 2) / (lines.length * 0.86));
    lineH = fontSize * 0.86;
    x0 = pad;
    const block = lineH * (lines.length - 1) + fontSize * 0.74;
    y0 = (h - block) / 2 + fontSize * 0.74;
    setFont(ctx);
    textW = Math.max(...lines.map((l) => ctx.measureText(l).width));

    // Pre-render the solid letters once.
    fctx.clearRect(0, 0, w, h);
    setFont(fctx);
    fctx.fillStyle = INK;
    lines.forEach((l, i) => fctx.fillText(l, x0, y0 + i * lineH));
    mctx.clearRect(0, 0, w, h);
    sctx.clearRect(0, 0, w, h);
    if (complete || reduce) engraveAll();
    dirty = true;
  }

  function engraveAll() {
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, w, h);
    complete = true;
    dirty = true;
  }

  function burn(x: number, y: number, fromX: number, fromY: number) {
    const r = Math.max(14, fontSize * 0.13);
    const dist = Math.hypot(x - fromX, y - fromY);
    const steps = Math.max(1, Math.ceil(dist / (r * 0.4)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bx = fromX + (x - fromX) * t;
      const by = fromY + (y - fromY) * t;
      const g = mctx.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.7, 'rgba(0,0,0,0.9)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g;
      mctx.beginPath();
      mctx.arc(bx, by, r, 0, Math.PI * 2);
      mctx.fill();
      // faint scorch on the bare wood that fades away
      sctx.fillStyle = 'rgba(90,50,20,0.10)';
      sctx.beginPath();
      sctx.arc(bx, by, 3, 0, Math.PI * 2);
      sctx.fill();
    }
    // sparks only where the beam is over a letter
    if (fctx.getImageData(x * dpr, y * dpr, 1, 1).data[3] > 0 && sparks.length < 60) {
      for (let k = 0; k < 2; k++)
        sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2.5 - 0.5,
          life: 1,
        });
    }
    dirty = true;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // fade the scorch trail
    sctx.globalCompositeOperation = 'destination-out';
    sctx.fillStyle = 'rgba(0,0,0,0.03)';
    sctx.fillRect(0, 0, w, h);
    sctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(scorch, 0, 0, w, h);

    if (dirty) {
      ectx.globalCompositeOperation = 'source-over';
      ectx.clearRect(0, 0, w, h);
      ectx.drawImage(fill, 0, 0, w, h);
      ectx.globalCompositeOperation = 'destination-in';
      ectx.drawImage(mask, 0, 0, w, h);
      dirty = false;
    }
    ctx.drawImage(etched, 0, 0, w, h);

    // the cut path
    setFont(ctx);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = CUT;
    ctx.lineWidth = Math.max(1.5, fontSize / 90);
    lines.forEach((l, i) => ctx.strokeText(l, x0, y0 + i * lineH));

    // sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.12;
      s.life -= 0.04;
      if (s.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(255,${150 + 100 * s.life},60,${s.life})`;
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // the laser head
    if (on && !reduce) {
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26);
      g.addColorStop(0, 'rgba(255,250,235,1)');
      g.addColorStop(0.15, 'rgba(255,170,80,0.95)');
      g.addColorStop(0.5, 'rgba(229,48,42,0.35)');
      g.addColorStop(1, 'rgba(229,48,42,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(26,18,12,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx - 34, ly);
      ctx.lineTo(lx - 14, ly);
      ctx.moveTo(lx + 14, ly);
      ctx.lineTo(lx + 34, ly);
      ctx.moveTo(lx, ly - 34);
      ctx.lineTo(lx, ly - 14);
      ctx.moveTo(lx, ly + 14);
      ctx.lineTo(lx, ly + 34);
      ctx.stroke();
    }
  }

  // Raster path for the automatic pass: back-and-forth rows over the text block.
  function autoPos(p: number) {
    const top = y0 - fontSize * 0.78;
    const bottom = y0 + (lines.length - 1) * lineH + fontSize * 0.08;
    const rowH = Math.max(14, fontSize * 0.13) * 1.4;
    const rows = Math.max(2, Math.ceil((bottom - top) / rowH));
    const f = p * rows;
    const row = Math.min(rows - 1, Math.floor(f));
    const along = f - row;
    const x = row % 2 === 0 ? x0 + along * textW : x0 + (1 - along) * textW;
    return { x, y: top + (row + 0.5) * ((bottom - top) / rows) };
  }

  function frame(now: number) {
    if (clearing > 0) {
      clearing--;
      mctx.globalCompositeOperation = 'destination-out';
      mctx.fillStyle = 'rgba(0,0,0,0.28)';
      mctx.fillRect(0, 0, w, h);
      mctx.globalCompositeOperation = 'source-over';
      if (clearing === 0) mctx.clearRect(0, 0, w, h);
      dirty = true;
    }
    if (auto) {
      const p = Math.min(1, (now - auto.t0) / auto.dur);
      const pos = autoPos(p);
      if (px < -50) {
        px = pos.x;
        py = pos.y;
      }
      lx = pos.x;
      ly = pos.y;
      on = true;
      burn(lx, ly, px, py);
      px = lx;
      py = ly;
      if (p >= 1) {
        auto = null;
        on = false;
        engraveAll();
      }
    }
    draw();
    requestAnimationFrame(frame);
  }

  const host = canvas.parentElement!;
  host.addEventListener(
    'pointermove',
    (e) => {
      if (reduce) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (!userMoved && e.pointerType === 'mouse') userMoved = true;
      if (auto || clearing > 0) return; // let the automatic pass or the wipe finish
      if (!on) {
        px = x;
        py = y;
      }
      on = true;
      lx = x;
      ly = y;
      burn(lx, ly, px, py);
      px = lx;
      py = ly;
    },
    { passive: true },
  );
  host.addEventListener('pointerleave', () => {
    if (!auto) on = false;
  });

  // Clicking anywhere on the panel wipes the engraving so it can be engraved again.
  const panel = canvas.closest('.sheet') ?? canvas;
  panel.addEventListener('click', (e) => {
    if (reduce || (e.target as HTMLElement).closest('a, button')) return;
    auto = null;
    complete = false;
    clearing = 14;
    sctx.clearRect(0, 0, w, h);
  });

  let rt: number | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(layout, 120);
  });
  layout();

  if (reduce) {
    draw();
    return;
  }
  // One orchestrated moment: if no one starts engraving within a beat, the laser does it.
  window.setTimeout(() => {
    if (!userMoved) auto = { t0: performance.now(), dur: 2600 };
  }, 900);
  requestAnimationFrame(frame);
}
