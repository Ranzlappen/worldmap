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
import { LABEL_DATA } from './data/labels.js';
import { createProjection } from './map/projection.js';
import { getZoomLevel } from './map/zoom.js';
import { drawNodes, drawArcs, applyFilters, deselect } from './map/svg-overlay.js';
import { renderLabels, updateLabelVisibility } from './map/labels-layer.js';
import {
  activeSpheres, activeLayers, activeLabels,
  getSelectedId, setSelectedId
} from './ui/filters.js';
import { buildSidebar } from './ui/sidebar.js';
import { updateInfoPanel } from './ui/info-panel.js';
import { buildMobileSheet, openSheet, switchTab } from './ui/mobile-sheet.js';
import { initTooltip } from './ui/tooltip.js';

// ──────────────────────────────────────
// SVG SETUP
// ──────────────────────────────────────

const svg = d3.select('#map-svg')
  .attr('viewBox', `0 0 ${VW} ${VH}`)
  .attr('preserveAspectRatio', 'xMidYMid meet');

const { proj, path } = createProjection(VW, VH);

const root = svg.append('g').attr('id', 'root');

// SVG layer groups (back to front)
const gGrat  = root.append('g');
const gLand  = root.append('g');
const gBord  = root.append('g');
const gLabel = root.append('g').attr('id', 'g-labels');
const gArc   = root.append('g');
const gNode  = root.append('g');

// State
let countries = null;
let borders = null;
let currentZoomLevel = 1;

// ──────────────────────────────────────
// ZOOM
// ──────────────────────────────────────

const zoom = d3.zoom()
  .scaleExtent(SCALE_EXTENT)
  .on('zoom', e => {
    root.attr('transform', e.transform);

    // Counter-scale nodes and labels so they stay readable
    const k = e.transform.k;
    const newLevel = getZoomLevel(k);

    gNode.selectAll('.nd-core').attr('r', 5 / k);
    gNode.selectAll('.nd-ring').attr('r', 8.5 / k).attr('stroke-width', 1 / k);
    gNode.selectAll('.nd-halo').attr('r', 15 / k);
    gNode.selectAll('.nd-label').attr('font-size', (7 / k) + 'px').attr('y', 12 / k);
    gArc.selectAll('.arc').each(function () {
      const el = d3.select(this);
      const bw = parseFloat(el.attr('data-base-width') || 1.2);
      el.attr('stroke-width', bw / k);
    });

    // Update geographic label visibility when zoom level changes
    if (newLevel !== currentZoomLevel) {
      currentZoomLevel = newLevel;
      updateLabelVisibility(gLabel, currentZoomLevel, k, activeLabels);
    }
    // Counter-scale label font sizes
    gLabel.selectAll('.geo-label').attr('transform', function () {
      const x = this.getAttribute('data-x');
      const y = this.getAttribute('data-y');
      return `translate(${x},${y}) scale(${1/k})`;
    });
    gLabel.selectAll('.capital-dot, .city-dot').attr('r', function () {
      return parseFloat(this.getAttribute('data-r')) / k;
    });
  });

svg.call(zoom).on('dblclick.zoom', null);

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
// NODE SELECTION
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
// Redraw helpers (called by sidebar/filter changes)
// ──────────────────────────────────────

function redrawAll() {
  drawNodes(gNode, NODES, activeSpheres, SPHERES, proj, handleSelectNode, nodeMap);
  drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
  // Re-apply counter-scaling for current zoom
  const t = d3.zoomTransform(svg.node());
  const k = t.k;
  gNode.selectAll('.nd-core').attr('r', 5 / k);
  gNode.selectAll('.nd-ring').attr('r', 8.5 / k).attr('stroke-width', 1 / k);
  gNode.selectAll('.nd-halo').attr('r', 15 / k);
  gNode.selectAll('.nd-label').attr('font-size', (7 / k) + 'px').attr('y', 12 / k);
  gArc.selectAll('.arc').each(function () {
    const el = d3.select(this);
    const bw = parseFloat(el.attr('data-base-width') || 1.2);
    el.attr('stroke-width', bw / k);
  });
  const sel = getSelectedId();
  if (sel) {
    const node = nodeMap[sel];
    if (!node || !activeSpheres.has(node.sphere)) {
      setSelectedId(null);
      applyFilters(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap, null);
      updateInfoPanel(null);
    } else {
      updateInfoPanel(node, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES);
    }
  }
}

function redrawArcs() {
  drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
  const t = d3.zoomTransform(svg.node());
  gArc.selectAll('.arc').each(function () {
    const el = d3.select(this);
    const bw = parseFloat(el.attr('data-base-width') || 1.2);
    el.attr('stroke-width', bw / t.k);
  });
  const sel = getSelectedId();
  if (sel) updateInfoPanel(nodeMap[sel], LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES);
}

function onLabelToggle() {
  updateLabelVisibility(gLabel, currentZoomLevel, d3.zoomTransform(svg.node()).k, activeLabels);
}

// ──────────────────────────────────────
// INIT
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

  // Base map: sphere background + graticule
  gGrat.append('path').datum({ type: 'Sphere' }).attr('class', 'sphere-bg').attr('d', path);
  gGrat.append('path').datum(d3.geoGraticule().step([30, 30])()).attr('class', 'graticule').attr('d', path);

  // Countries with sphere-based fill
  gLand.selectAll('path')
    .data(countries.features).join('path')
    .attr('class', 'cpath').attr('d', path)
    .each(function (d) {
      const sk = ISO_SPHERE[+d.id];
      const c = sk ? SPHERES[sk].color : '#1C2E44';
      d3.select(this)
        .attr('fill', c).attr('fill-opacity', sk ? 0.18 : 0.09)
        .attr('stroke', c).attr('stroke-opacity', sk ? 0.25 : 0.10)
        .attr('stroke-width', 0.4).attr('data-sphere', sk || '');
    });

  // Borders
  gBord.append('path').datum(borders).attr('class', 'border-mesh').attr('d', path);

  // Geographic labels (SVG text elements)
  renderLabels(gLabel, LABEL_DATA, proj);
  updateLabelVisibility(gLabel, currentZoomLevel, 1, activeLabels);

  // Interactive overlay
  drawNodes(gNode, NODES, activeSpheres, SPHERES, proj, handleSelectNode, nodeMap);
  drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId);
  initTooltip(svg, SPHERES);

  // UI
  buildSidebar(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, activeLabels,
    redrawAll, redrawArcs, onLabelToggle);
  buildMobileSheet(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, nodeMap,
    redrawAll, redrawArcs);

  // Stats
  const totals = Object.fromEntries(Object.entries(CONNECTIONS).map(([k, v]) => [k, v.length]));
  console.log('Connection totals:', totals, 'Total:', Object.values(totals).reduce((a, b) => a + b, 0));
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
