// ──────────────────────────────────────
// MAIN ENTRY POINT
// ──────────────────────────────────────
// Imports all modules and initialises the application.
// D3 and TopoJSON are loaded as CDN globals before this module runs.

import { VW, VH, SCALE_EXTENT, ATLAS_URLS } from './config.js';
import { SPHERES } from './data/spheres.js';
import { LAYERS } from './data/layers.js';
import { NODES, nodeMap } from './data/nodes.js';
import { CONNECTIONS } from './data/connections.js';
import { ISO_SPHERE } from './data/iso-sphere.js';
import { createProjection } from './map/projection.js';
import { setupZoom, getZoomLevel, getCurrentTransform } from './map/zoom.js';
import { drawNodes, drawArcs, applyFilters, deselect } from './map/svg-overlay.js';
import { renderCanvas } from './map/canvas-renderer.js';
import {
  activeSpheres, activeLayers, activeLabels,
  getSelectedId, setSelectedId
} from './ui/filters.js';
import { buildSidebar } from './ui/sidebar.js';
import { updateInfoPanel } from './ui/info-panel.js';
import { buildMobileSheet, openSheet, switchTab } from './ui/mobile-sheet.js';
import { initTooltip } from './ui/tooltip.js';
import { debounce } from './util/debounce.js';
import { getVisibleBounds } from './util/viewport.js';

// ──────────────────────────────────────
// INIT
// ──────────────────────────────────────

const svg = d3.select('#map-svg').attr('viewBox', `0 0 ${VW} ${VH}`)
  .attr('preserveAspectRatio', 'xMidYMid meet');

const { proj, path } = createProjection(VW, VH);

const root = svg.append('g').attr('id', 'root');

// Canvas element for base map
const mapDiv = document.getElementById('map');
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');

// SVG groups for interactive overlay (arcs + nodes only)
const gArc  = root.append('g');
const gNode = root.append('g');

// State
let worldData = null;   // current TopoJSON features
let countries = null;
let borders = null;

// ──────────────────────────────────────
// Zoom handler
// ──────────────────────────────────────

function onZoom(transform) {
  root.attr('transform', transform);
  // During zoom: CSS-transform the canvas for instant feedback
  canvas.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
  canvas.style.transformOrigin = '0 0';
}

function onZoomEnd(transform) {
  // On zoom end: redraw canvas at full resolution
  canvas.style.transform = '';
  renderCanvas(ctx, canvas, countries, borders, proj, path, transform, {
    activeSpheres, ISO_SPHERE, SPHERES, NODES, nodeMap,
    zoomLevel: getZoomLevel(transform.k),
    activeLabels,
    visibleBounds: getVisibleBounds(transform, canvas.width, canvas.height, proj)
  });

  // Counter-scale SVG overlay elements
  const k = transform.k;
  gNode.selectAll('.nd-core').attr('r', 5 / k);
  gNode.selectAll('.nd-ring').attr('r', 8.5 / k).attr('stroke-width', 1 / k);
  gNode.selectAll('.nd-halo').attr('r', 15 / k);
  gNode.selectAll('.nd-label').attr('font-size', (7 / k) + 'px').attr('y', 12 / k);

  gArc.selectAll('.arc').each(function () {
    const el = d3.select(this);
    const baseWidth = parseFloat(el.attr('data-base-width') || 1.2);
    el.attr('stroke-width', baseWidth / k);
  });
}

const { zoomBehavior } = setupZoom(svg, SCALE_EXTENT, onZoom, onZoomEnd);

// Click on empty space deselects
svg.on('click', e => {
  const cls = e.target.className?.baseVal || '';
  if (!cls.includes('node') && !cls.includes('nd-')) {
    deselect(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap);
    setSelectedId(null);
    updateInfoPanel(null);
    document.getElementById('sb-sel').textContent = 'none';
  }
});

// ──────────────────────────────────────
// Resize handler
// ──────────────────────────────────────

function resizeCanvas() {
  const rect = mapDiv.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

window.addEventListener('resize', debounce(() => {
  resizeCanvas();
  const transform = getCurrentTransform(svg);
  onZoomEnd(transform);
}, 150));

// ──────────────────────────────────────
// Node selection callback
// ──────────────────────────────────────

function handleSelectNode(node) {
  const currentId = getSelectedId();
  const newId = (currentId === node.id) ? null : node.id;
  setSelectedId(newId);
  applyFilters(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap, newId);
  updateInfoPanel(newId ? node : null, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES);
  document.getElementById('sb-sel').textContent = newId ? node.label : 'none';
  if (newId && window.innerWidth <= 768) {
    openSheet(true);
    switchTab('info');
  }
}

// ──────────────────────────────────────
// Load atlas and bootstrap
// ──────────────────────────────────────

async function init() {
  let world;
  try {
    world = await d3.json(ATLAS_URLS.low);
  } catch (e) {
    console.error('Atlas load failed', e);
    return;
  }

  countries = topojson.feature(world, world.objects.countries);
  borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);

  // Size canvas and do initial base map render
  resizeCanvas();
  const transform = d3.zoomIdentity;
  renderCanvas(ctx, canvas, countries, borders, proj, path, transform, {
    activeSpheres, ISO_SPHERE, SPHERES, NODES, nodeMap,
    zoomLevel: 1,
    activeLabels,
    visibleBounds: null
  });

  // Draw interactive SVG overlay
  drawNodes(gNode, NODES, activeSpheres, SPHERES, proj, handleSelectNode, nodeMap);
  drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
  initTooltip(svg, SPHERES);

  // Build UI
  buildSidebar(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, activeLabels, () => {
    drawNodes(gNode, NODES, activeSpheres, SPHERES, proj, handleSelectNode, nodeMap);
    drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
    const selectedId = getSelectedId();
    if (selectedId) {
      const node = nodeMap[selectedId];
      if (!node || !activeSpheres.has(node.sphere)) {
        setSelectedId(null);
        applyFilters(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap, null);
        updateInfoPanel(null);
      } else {
        updateInfoPanel(node, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES);
      }
    }
    // Re-render canvas for label toggle changes
    const t = getCurrentTransform(svg);
    onZoomEnd(t);
  }, () => {
    drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
    const selectedId = getSelectedId();
    if (selectedId) updateInfoPanel(nodeMap[selectedId], LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES);
  });

  buildMobileSheet(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, nodeMap, () => {
    drawNodes(gNode, NODES, activeSpheres, SPHERES, proj, handleSelectNode, nodeMap);
    drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
  }, () => {
    drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
    const selectedId = getSelectedId();
    if (selectedId) updateInfoPanel(nodeMap[selectedId], LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES);
  });

  // Stats
  const totals = Object.fromEntries(Object.entries(CONNECTIONS).map(([k, v]) => [k, v.length]));
  const totalCount = Object.values(totals).reduce((a, b) => a + b, 0);
  console.log('Connection totals:', totals, 'Total:', totalCount);
  document.getElementById('stat-nodes').textContent = NODES.length;

  // Close info panel
  document.getElementById('info-close').addEventListener('click', () => {
    deselect(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap);
    setSelectedId(null);
    updateInfoPanel(null);
    document.getElementById('sb-sel').textContent = 'none';
  });
}

init();
