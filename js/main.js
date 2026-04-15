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
import { getZoomLevel } from './map/zoom.js';
import { drawNodes, drawArcs, applyFilters, deselect, updateArcVisibility, updateNodeVisibility, getArcData } from './map/svg-overlay.js';
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
let countries = null;
let borders = null;
let rafId = null;
let zoomEndTimer = null;

// ──────────────────────────────────────
// Canvas render helpers
// ──────────────────────────────────────

function getCanvasOpts(transform, skipLabels) {
  return {
    activeSpheres, ISO_SPHERE, SPHERES,
    zoomLevel: getZoomLevel(transform.k),
    activeLabels,
    visibleBounds: getVisibleBounds(transform, canvas.width, canvas.height, proj),
    skipLabels
  };
}

function fullCanvasRender(transform) {
  renderCanvas(ctx, canvas, countries, borders, proj, path, transform, getCanvasOpts(transform, false));
}

// ──────────────────────────────────────
// Zoom handler
// ──────────────────────────────────────

function onZoom(e) {
  const transform = e.transform;
  // SVG overlay moves instantly via transform attribute
  root.attr('transform', transform);

  // rAF-throttled canvas redraw (skip labels during active zoom for performance)
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (countries) {
        renderCanvas(ctx, canvas, countries, borders, proj, path, transform, getCanvasOpts(transform, true));
      }
    });
  }

  // Debounced zoom-end: full redraw with labels + counter-scaling
  clearTimeout(zoomEndTimer);
  zoomEndTimer = setTimeout(() => onZoomEnd(transform), 150);
}

function onZoomEnd(transform) {
  if (!countries) return;
  fullCanvasRender(transform);

  // Counter-scale SVG overlay in single passes (no repeated selectAll)
  const invK = 1 / transform.k;

  // Nodes: one traversal per group instead of 4 root-level queries
  gNode.selectAll('.node').each(function () {
    const g = d3.select(this);
    g.select('.nd-core').attr('r', 5 * invK);
    g.select('.nd-ring').attr('r', 8.5 * invK).attr('stroke-width', invK);
    g.select('.nd-halo').attr('r', 15 * invK);
    g.select('.nd-label').attr('font-size', (7 * invK) + 'px').attr('y', 12 * invK);
  });

  // Arcs: iterate cached data (avoids DOM attribute reads for baseWidth)
  getArcData().forEach(arc => {
    arc.el.setAttribute('stroke-width', arc.baseWidth * invK);
  });
}

// Setup zoom directly (simpler than going through zoom.js indirection)
const zoomBehavior = d3.zoom()
  .scaleExtent(SCALE_EXTENT)
  .on('zoom', onZoom);
svg.call(zoomBehavior).on('dblclick.zoom', null);

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
  const dpr = devicePixelRatio;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

window.addEventListener('resize', debounce(() => {
  resizeCanvas();
  const transform = d3.zoomTransform(svg.node());
  fullCanvasRender(transform);
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
  fullCanvasRender(transform);

  // Draw interactive SVG overlay
  drawNodes(gNode, NODES, activeSpheres, SPHERES, proj, handleSelectNode, nodeMap);
  drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
  initTooltip(svg);

  // Build UI — filter toggles update visibility only (no SVG rebuild)
  buildSidebar(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, activeLabels, () => {
    const selectedId = getSelectedId();
    updateNodeVisibility(gNode, activeSpheres, CONNECTIONS, nodeMap, selectedId);
    updateArcVisibility(gArc, activeSpheres, activeLayers, CONNECTIONS, nodeMap, selectedId);
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
    // Re-render canvas for label/sphere toggle changes
    const t = d3.zoomTransform(svg.node());
    fullCanvasRender(t);
  }, () => {
    const selectedId = getSelectedId();
    updateArcVisibility(gArc, activeSpheres, activeLayers, CONNECTIONS, nodeMap, selectedId);
    if (selectedId) updateInfoPanel(nodeMap[selectedId], LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES);
  });

  buildMobileSheet(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, nodeMap, () => {
    const selectedId = getSelectedId();
    updateNodeVisibility(gNode, activeSpheres, CONNECTIONS, nodeMap, selectedId);
    updateArcVisibility(gArc, activeSpheres, activeLayers, CONNECTIONS, nodeMap, selectedId);
    const t = d3.zoomTransform(svg.node());
    fullCanvasRender(t);
  }, () => {
    const selectedId = getSelectedId();
    updateArcVisibility(gArc, activeSpheres, activeLayers, CONNECTIONS, nodeMap, selectedId);
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
