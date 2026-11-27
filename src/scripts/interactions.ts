// Small mouse-reactive touches shared across pages. Skipped on touch screens and for reduced motion.
const fancy =
  window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fancy) {
  // Magnetic buttons: they lean toward the cursor.
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic || 0.3);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

// Project rows: a red cut path traces around the row the cursor is on.
document.querySelectorAll<HTMLElement>('[data-cutline]').forEach((el) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'cutline');
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '1.5');
  rect.setAttribute('y', '1.5');
  rect.setAttribute('rx', '6');
  rect.setAttribute('pathLength', '100');
  svg.appendChild(rect);
  el.appendChild(svg);
  const size = () => {
    const { width, height } = el.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    rect.setAttribute('width', String(Math.max(0, width - 3)));
    rect.setAttribute('height', String(Math.max(0, height - 3)));
  };
  size();
  new ResizeObserver(size).observe(el);
});

// Click a figure in a write-up to see it large. Esc, the backdrop or Close shuts it.
const figs = document.querySelectorAll<HTMLElement>('.prose figure.fig img, .prose figure.fig .cutfile');
if (figs.length) {
  const box = document.createElement('dialog');
  box.className = 'lightbox';
  document.body.appendChild(box);
  box.addEventListener('click', () => box.close());
  figs.forEach((img) => {
    img.addEventListener('click', () => {
      const fig = img.closest('figure')!;
      const copy = fig.cloneNode(true) as HTMLElement;
      copy.querySelector('img')?.removeAttribute('loading');
      copy.style.transform = '';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'close';
      close.textContent = 'Close';
      box.replaceChildren(close, copy);
      box.showModal();
    });
  });
}
