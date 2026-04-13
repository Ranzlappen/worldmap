import { ZOOM_LEVELS } from '../config.js';
import { LABEL_DATA, LABEL_CATEGORIES } from '../data/labels.js';

// ──────────────────────────────────────
// Canvas base map renderer
// ──────────────────────────────────────
// Draws countries, borders, graticule, and geographic labels to a canvas.

export function initCanvasRenderer() {
  // placeholder for future atlas management
}

export function renderCanvas(ctx, canvas, countries, borders, proj, pathFactory, transform, opts) {
  const {
    activeSpheres, ISO_SPHERE, SPHERES, NODES, nodeMap,
    zoomLevel = 1, activeLabels, visibleBounds
  } = opts;

  const w = canvas.width / devicePixelRatio;
  const h = canvas.height / devicePixelRatio;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Apply zoom transform
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

  // -- Countries --
  if (countries) {
    countries.features.forEach(feature => {
      const sk = ISO_SPHERE[+feature.id];
      const c = sk ? SPHERES[sk]?.color : '#1C2E44';
      const on = sk ? activeSpheres.has(sk) : false;

      ctx.fillStyle = c;
      ctx.globalAlpha = on ? 0.18 : 0.04;
      ctx.beginPath();
      canvasPath(feature);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  // -- Borders --
  if (borders) {
    ctx.strokeStyle = '#142030';
    ctx.lineWidth = 0.4 / transform.k;
    ctx.beginPath();
    canvasPath(borders);
    ctx.stroke();
  }

  // -- Geographic labels --
  renderLabels(ctx, proj, transform, zoomLevel, activeLabels, visibleBounds, countries);

  ctx.restore();
}

// ──────────────────────────────────────
// Label rendering
// ──────────────────────────────────────

function renderLabels(ctx, proj, transform, zoomLevel, activeLabels, visibleBounds, countries) {
  if (!activeLabels || !LABEL_DATA) return;

  const k = transform.k;
  const occupiedCells = new Set();
  const cellSize = 60; // px grid cell for collision avoidance

  function isOccupied(sx, sy, textWidth) {
    const cols = Math.ceil(textWidth / cellSize) + 1;
    for (let dc = 0; dc < cols; dc++) {
      const key = `${Math.floor(sx / cellSize) + dc},${Math.floor(sy / cellSize)}`;
      if (occupiedCells.has(key)) return true;
    }
    return false;
  }

  function markOccupied(sx, sy, textWidth) {
    const cols = Math.ceil(textWidth / cellSize) + 1;
    for (let dc = 0; dc < cols; dc++) {
      occupiedCells.add(`${Math.floor(sx / cellSize) + dc},${Math.floor(sy / cellSize)}`);
    }
  }

  function inBounds(lon, lat) {
    if (!visibleBounds) return true;
    return lon >= visibleBounds.west && lon <= visibleBounds.east &&
           lat >= visibleBounds.south && lat <= visibleBounds.north;
  }

  // Country name labels from TopoJSON centroids
  if (activeLabels.has('countryNames') && zoomLevel >= 3 && countries) {
    const fontSize = Math.max(3, 8 / k);
    ctx.font = `400 ${fontSize}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Fade in between zoom 2.0 and 2.5 (level 3 starts at 2.0)
    const alpha = Math.min(1, (k - 2.0) / 0.5);
    ctx.fillStyle = `rgba(122, 155, 184, ${alpha * 0.6})`;

    if (LABEL_DATA.countryNames) {
      LABEL_DATA.countryNames.forEach(label => {
        if (zoomLevel < label.minZoom) return;
        if (!inBounds(label.lon, label.lat)) return;
        const pos = proj([label.lon, label.lat]);
        if (!pos) return;
        const tw = ctx.measureText(label.name).width;
        if (!isOccupied(pos[0], pos[1], tw)) {
          ctx.fillText(label.name, pos[0], pos[1]);
          markOccupied(pos[0], pos[1], tw);
        }
      });
    }
  }

  // Oceans
  if (activeLabels.has('oceans') && LABEL_DATA.oceans) {
    LABEL_DATA.oceans.forEach(label => {
      if (zoomLevel < label.minZoom) return;
      if (!inBounds(label.lon, label.lat)) return;
      const pos = proj([label.lon, label.lat]);
      if (!pos) return;
      const fontSize = Math.max(5, 14 / k);
      ctx.font = `italic 300 ${fontSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(74, 144, 217, 0.35)';
      const tw = ctx.measureText(label.name).width;
      if (!isOccupied(pos[0], pos[1], tw)) {
        ctx.fillText(label.name, pos[0], pos[1]);
        markOccupied(pos[0], pos[1], tw);
      }
    });
  }

  // Seas
  if (activeLabels.has('oceans') && LABEL_DATA.seas) {
    LABEL_DATA.seas.forEach(label => {
      if (zoomLevel < label.minZoom) return;
      if (!inBounds(label.lon, label.lat)) return;
      const pos = proj([label.lon, label.lat]);
      if (!pos) return;
      const fontSize = Math.max(3.5, 9 / k);
      ctx.font = `italic 300 ${fontSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const alpha = Math.min(1, (k - 2.0) / 0.5);
      ctx.fillStyle = `rgba(74, 144, 217, ${alpha * 0.28})`;
      const tw = ctx.measureText(label.name).width;
      if (!isOccupied(pos[0], pos[1], tw)) {
        ctx.fillText(label.name, pos[0], pos[1]);
        markOccupied(pos[0], pos[1], tw);
      }
    });
  }

  // Capitals
  if (activeLabels.has('capitals') && LABEL_DATA.capitals) {
    LABEL_DATA.capitals.forEach(label => {
      if (zoomLevel < label.minZoom) return;
      if (!inBounds(label.lon, label.lat)) return;
      const pos = proj([label.lon, label.lat]);
      if (!pos) return;
      const fontSize = Math.max(3, 6 / k);
      ctx.font = `500 ${fontSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const alpha = Math.min(1, (k - 3.5) / 0.5);
      ctx.fillStyle = `rgba(200, 168, 75, ${alpha * 0.7})`;
      const tw = ctx.measureText(label.name).width;
      const dotR = Math.max(1, 2 / k);
      if (!isOccupied(pos[0], pos[1], tw + dotR * 3)) {
        // Star marker for capitals
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(label.name, pos[0] + dotR * 2, pos[1]);
        markOccupied(pos[0], pos[1], tw + dotR * 3);
      }
    });
  }

  // Cities
  if (activeLabels.has('cities') && LABEL_DATA.cities) {
    LABEL_DATA.cities.forEach(label => {
      if (zoomLevel < label.minZoom) return;
      if (!inBounds(label.lon, label.lat)) return;
      const pos = proj([label.lon, label.lat]);
      if (!pos) return;
      const fontSize = Math.max(2.5, 5 / k);
      ctx.font = `300 ${fontSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const alpha = Math.min(1, (k - 5.0) / 0.5);
      ctx.fillStyle = `rgba(202, 224, 245, ${alpha * 0.55})`;
      const tw = ctx.measureText(label.name).width;
      const dotR = Math.max(0.8, 1.5 / k);
      if (!isOccupied(pos[0], pos[1], tw + dotR * 3)) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(label.name, pos[0] + dotR * 2, pos[1]);
        markOccupied(pos[0], pos[1], tw + dotR * 3);
      }
    });
  }

  // Rivers
  if (activeLabels.has('rivers') && LABEL_DATA.rivers) {
    LABEL_DATA.rivers.forEach(label => {
      if (zoomLevel < label.minZoom) return;
      if (!inBounds(label.lon, label.lat)) return;
      const pos = proj([label.lon, label.lat]);
      if (!pos) return;
      const fontSize = Math.max(3, 6 / k);
      ctx.font = `italic 300 ${fontSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const alpha = Math.min(1, (k - 3.5) / 0.5);
      ctx.fillStyle = `rgba(56, 184, 216, ${alpha * 0.4})`;
      const tw = ctx.measureText(label.name).width;
      if (!isOccupied(pos[0], pos[1], tw)) {
        ctx.fillText(label.name, pos[0], pos[1]);
        markOccupied(pos[0], pos[1], tw);
      }
    });
  }

  // Mountains
  if (activeLabels.has('mountains') && LABEL_DATA.mountains) {
    LABEL_DATA.mountains.forEach(label => {
      if (zoomLevel < label.minZoom) return;
      if (!inBounds(label.lon, label.lat)) return;
      const pos = proj([label.lon, label.lat]);
      if (!pos) return;
      const fontSize = Math.max(3, 6 / k);
      ctx.font = `400 ${fontSize}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const alpha = Math.min(1, (k - 3.5) / 0.5);
      ctx.fillStyle = `rgba(232, 150, 60, ${alpha * 0.4})`;
      const tw = ctx.measureText(label.name).width;
      if (!isOccupied(pos[0], pos[1], tw)) {
        ctx.fillText(label.name, pos[0], pos[1]);
        markOccupied(pos[0], pos[1], tw);
      }
    });
  }
}
