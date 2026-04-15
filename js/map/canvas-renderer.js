import { VW, VH } from '../config.js';
import { LABEL_DATA } from '../data/labels.js';

// ──────────────────────────────────────
// Canvas base map renderer
// ──────────────────────────────────────
// Draws countries, borders, graticule, and geographic labels to a canvas.
// The canvas must render in the same coordinate space as the SVG viewBox
// (0,0 to VW,VH) so that it aligns with the SVG overlay.

export function renderCanvas(ctx, canvas, countries, borders, proj, pathFactory, transform, opts) {
  const {
    activeSpheres, ISO_SPHERE, SPHERES,
    zoomLevel = 1, activeLabels, visibleBounds, skipLabels = false
  } = opts;

  const dpr = devicePixelRatio;
  const pw = canvas.width;   // pixel width
  const ph = canvas.height;  // pixel height

  // Reset transform and clear
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pw, ph);

  // Map viewBox coords to pixel coords (mimic SVG preserveAspectRatio xMidYMid meet)
  const sx = pw / VW;
  const sy = ph / VH;
  const s = Math.min(sx, sy);
  const ox = (pw - VW * s) / 2;
  const oy = (ph - VH * s) / 2;

  ctx.translate(ox, oy);
  ctx.scale(s, s);

  // Now in viewBox coordinate space — apply D3 zoom transform
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  // Build a canvas-aware path generator
  const canvasPath = d3.geoPath().projection(proj).context(ctx);

  // -- Sphere background (ocean) --
  ctx.fillStyle = '#04070E';
  ctx.beginPath();
  canvasPath({ type: 'Sphere' });
  ctx.fill();

  // -- Graticule --
  const step = zoomLevel >= 3 ? 15 : 30;
  const grat = d3.geoGraticule().step([step, step])();
  ctx.strokeStyle = '#0B1525';
  ctx.lineWidth = 0.5 / transform.k;
  ctx.beginPath();
  canvasPath(grat);
  ctx.stroke();

  // -- Countries (batched by sphere for fewer draw calls) --
  if (countries) {
    const groups = new Map();
    countries.features.forEach(feature => {
      const sk = ISO_SPHERE[+feature.id];
      const c = sk ? SPHERES[sk]?.color : '#1C2E44';
      const alpha = (sk && activeSpheres.has(sk)) ? 0.18 : 0.04;
      const key = c + alpha;
      let g = groups.get(key);
      if (!g) { g = { color: c, alpha, features: [] }; groups.set(key, g); }
      g.features.push(feature);
    });
    groups.forEach(({ color, alpha, features }) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      features.forEach(f => canvasPath(f));
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // -- Borders --
  if (borders) {
    ctx.strokeStyle = '#142030';
    ctx.lineWidth = 0.4 / transform.k;
    ctx.beginPath();
    canvasPath(borders);
    ctx.stroke();
  }

  // -- Geographic labels (skip during active zoom for performance) --
  if (!skipLabels) {
    renderLabels(ctx, proj, transform, zoomLevel, activeLabels, visibleBounds);
  }

  ctx.restore();
}

// ──────────────────────────────────────
// Label rendering
// ──────────────────────────────────────

// Label category descriptors — font and fill are set once per category
const LABEL_CONFIGS = [
  { key: 'countryNames', dataKey: 'countryNames', categoryMinZoom: 3, align: 'center',
    font: k => `400 ${Math.max(3, 8 / k)}px "IBM Plex Mono",monospace`,
    fill: k => `rgba(122,155,184,${Math.min(1, (k - 2) / .5) * .6})`, marker: null },
  { key: 'oceans', dataKey: 'oceans', categoryMinZoom: 0, align: 'center',
    font: k => `italic 300 ${Math.max(5, 14 / k)}px "IBM Plex Mono",monospace`,
    fill: () => 'rgba(74,144,217,0.35)', marker: null },
  { key: 'oceans', dataKey: 'seas', categoryMinZoom: 0, align: 'center',
    font: k => `italic 300 ${Math.max(3.5, 9 / k)}px "IBM Plex Mono",monospace`,
    fill: k => `rgba(74,144,217,${Math.min(1, (k - 2) / .5) * .28})`, marker: null },
  { key: 'capitals', dataKey: 'capitals', categoryMinZoom: 0, align: 'left',
    font: k => `500 ${Math.max(3, 6 / k)}px "IBM Plex Mono",monospace`,
    fill: k => `rgba(200,168,75,${Math.min(1, (k - 3.5) / .5) * .7})`,
    marker: k => Math.max(1, 2 / k) },
  { key: 'cities', dataKey: 'cities', categoryMinZoom: 0, align: 'left',
    font: k => `300 ${Math.max(2.5, 5 / k)}px "IBM Plex Mono",monospace`,
    fill: k => `rgba(202,224,245,${Math.min(1, (k - 5) / .5) * .55})`,
    marker: k => Math.max(.8, 1.5 / k) },
  { key: 'rivers', dataKey: 'rivers', categoryMinZoom: 0, align: 'center',
    font: k => `italic 300 ${Math.max(3, 6 / k)}px "IBM Plex Mono",monospace`,
    fill: k => `rgba(56,184,216,${Math.min(1, (k - 3.5) / .5) * .4})`, marker: null },
  { key: 'mountains', dataKey: 'mountains', categoryMinZoom: 0, align: 'center',
    font: k => `400 ${Math.max(3, 6 / k)}px "IBM Plex Mono",monospace`,
    fill: k => `rgba(232,150,60,${Math.min(1, (k - 3.5) / .5) * .4})`, marker: null }
];

function renderLabels(ctx, proj, transform, zoomLevel, activeLabels, visibleBounds) {
  if (!activeLabels || !LABEL_DATA) return;

  const k = transform.k;
  const occupiedCells = new Set();
  const cellSize = 60;

  // Numeric keys for faster Set lookups
  function cellKey(col, row) { return col * 100000 + row; }

  function isOccupied(sx, sy, textWidth) {
    const baseCol = Math.floor(sx / cellSize);
    const row = Math.floor(sy / cellSize);
    const cols = Math.ceil(textWidth / cellSize) + 1;
    for (let dc = 0; dc < cols; dc++) {
      if (occupiedCells.has(cellKey(baseCol + dc, row))) return true;
    }
    return false;
  }

  function markOccupied(sx, sy, textWidth) {
    const baseCol = Math.floor(sx / cellSize);
    const row = Math.floor(sy / cellSize);
    const cols = Math.ceil(textWidth / cellSize) + 1;
    for (let dc = 0; dc < cols; dc++) {
      occupiedCells.add(cellKey(baseCol + dc, row));
    }
  }

  const hasB = !!visibleBounds;
  const bW = hasB ? visibleBounds.west : 0;
  const bE = hasB ? visibleBounds.east : 0;
  const bS = hasB ? visibleBounds.south : 0;
  const bN = hasB ? visibleBounds.north : 0;

  for (const cat of LABEL_CONFIGS) {
    if (!activeLabels.has(cat.key)) continue;
    if (zoomLevel < cat.categoryMinZoom) continue;
    const labels = LABEL_DATA[cat.dataKey];
    if (!labels) continue;

    // Set font and style once per category
    ctx.font = cat.font(k);
    ctx.textAlign = cat.align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = cat.fill(k);
    const dotR = cat.marker ? cat.marker(k) : 0;

    for (let i = 0, len = labels.length; i < len; i++) {
      const label = labels[i];
      if (zoomLevel < label.minZoom) continue;
      // Bounds check before projection (cheap)
      if (hasB && (label.lon < bW || label.lon > bE || label.lat < bS || label.lat > bN)) continue;
      const pos = proj([label.lon, label.lat]);
      if (!pos) continue;
      const tw = ctx.measureText(label.name).width;
      const totalW = dotR ? tw + dotR * 3 : tw;

      if (!isOccupied(pos[0], pos[1], totalW)) {
        if (dotR) {
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText(label.name, pos[0] + dotR * 2, pos[1]);
        } else {
          ctx.fillText(label.name, pos[0], pos[1]);
        }
        markOccupied(pos[0], pos[1], totalW);
      }
    }
  }
}
