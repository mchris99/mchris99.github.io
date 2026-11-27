// Turns Markdown images into captioned figures.
//   ![Caption](photo.jpg)                      -> one figure, caption under it
//   ![First](a.jpg) ![Second](b.jpg)           -> images on the same line sit side by side
// SVG drawings (cut files) get a plywood backdrop so their lines show on the dark site.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const isBlank = (n) => n.type === 'text' && !n.value.trim();
const isImg = (n) => n.type === 'element' && n.tagName === 'img';
const isBr = (n) => n.type === 'element' && n.tagName === 'br';

function srcOf(img) {
  const p = img.properties || {};
  return String(p.src || p.__ASTRO_IMAGE_ || '');
}

// Put a local SVG straight into the page so CSS can give its hairline laser strokes
// a visible on-screen width. The file itself is untouched.
function inlineSvg(img, file) {
  const src = srcOf(img);
  if (!file?.path || /^(https?:)?\/\//.test(src) || src.startsWith('/')) return null;
  try {
    let svg = readFileSync(resolve(dirname(file.path), decodeURI(src)), 'utf8');
    svg = svg.replace(/<\?xml[^>]*>/, '').replace(/<!DOCTYPE[^>]*>/i, '');
    const alt = String(img.properties?.alt || '').replace(/"/g, '&quot;');
    svg = svg.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
      const clean = attrs.replace(/\s(width|height)="[^"]*"/g, '');
      return `<svg${clean} class="cutfile" role="img" aria-label="${alt}" preserveAspectRatio="xMidYMid meet">`;
    });
    return { type: 'raw', value: svg };
  } catch {
    return null;
  }
}

function figure(img, file) {
  const alt = String(img.properties?.alt || '').trim();
  const drawing = /\.svg\b/i.test(srcOf(img));
  img.properties = { ...img.properties, loading: 'lazy', decoding: 'async' };
  const children = [(drawing && inlineSvg(img, file)) || img];
  if (alt) children.push({ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: alt }] });
  return {
    type: 'element',
    tagName: 'figure',
    properties: { className: drawing ? ['fig', 'drawing', 'ply'] : ['fig'] },
    children,
  };
}

function walk(node, file) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'element' && child.tagName === 'p') {
      const kids = child.children.filter((k) => !isBlank(k) && !isBr(k));
      if (kids.length && kids.every(isImg)) {
        const figs = kids.map((k) => figure(k, file));
        if (figs.length === 1) return figs[0];
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['gallery'], dataCount: String(figs.length) },
          children: figs,
        };
      }
    }
    walk(child, file);
    return child;
  });
}

export default function rehypeFigures() {
  return (tree, file) => walk(tree, file);
}
