// SVG overlay: interactive nodes and arcs

let arcDataStore = [];

export function getArcData() {
  return arcDataStore;
}

export function drawArcs(gArc, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, proj, getSelectedId) {
  gArc.selectAll('*').remove();
  arcDataStore = [];
  let count = 0;

  Object.keys(LAYERS).forEach((layer, li) => {
    if (!activeLayers.has(layer)) return;
    const def = LAYERS[layer];
    (CONNECTIONS[layer] || []).forEach(([from, to, str]) => {
      if (!nodeMap[from] || !nodeMap[to]) return;
      if (!activeSpheres.has(nodeMap[from].sphere) || !activeSpheres.has(nodeMap[to].sphere)) return;

      const pa = proj([nodeMap[from].lon, nodeMap[from].lat]);
      const pb = proj([nodeMap[to].lon, nodeMap[to].lat]);
      if (!pa || !pb) return;

      const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
      const dx = pb[0] - pa[0], dy = pb[1] - pa[1];
      const len = Math.hypot(dx, dy) || 1;
      const lift = Math.min(len * .28, 90);
      const sign = (li % 2 === 0) ? 1 : -1;
      const cx = mx - (dy / len) * lift * sign;
      const cy = my + (dx / len) * lift * .3;

      const baseWidth = Math.max(1.2, (str / 100) * 4);
      const el = gArc.append('path')
        .attr('class', 'arc')
        .attr('d', `M${pa[0]} ${pa[1]} Q${cx} ${cy} ${pb[0]} ${pb[1]}`)
        .attr('stroke', def.color)
        .attr('stroke-width', baseWidth)
        .attr('data-base-width', baseWidth)
        .attr('opacity', .6)
        .attr('data-from', from).attr('data-to', to)
        .attr('data-layer', layer).attr('data-str', str);

      arcDataStore.push({ el: el.node(), from, to, str, layer });
      count++;
    });
  });

  document.getElementById('stat-arcs').textContent = count;
  document.getElementById('sb-arc-count').textContent = count;
  const selectedId = getSelectedId();
  applyFilters(gArc, null, activeSpheres, activeLayers, CONNECTIONS, nodeMap, selectedId);
}

export function drawNodes(gNode, NODES, activeSpheres, SPHERES, proj, onSelect, nodeMap) {
  gNode.selectAll('*').remove();
  NODES.forEach(node => {
    if (!activeSpheres.has(node.sphere)) return;
    const pos = proj([node.lon, node.lat]);
    if (!pos) return;
    const color = SPHERES[node.sphere].color;
    const g = gNode.append('g').attr('class', 'node')
      .attr('transform', `translate(${pos[0]},${pos[1]})`)
      .attr('data-id', node.id);

    g.append('circle').attr('class', 'nd-halo').attr('r', 15).attr('fill', color).attr('fill-opacity', .06);
    g.append('circle').attr('class', 'nd-ring').attr('r', 8.5)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1).attr('stroke-opacity', .45);
    g.append('circle').attr('class', 'nd-core').attr('r', 5).attr('fill', color).attr('fill-opacity', .9);
    g.append('text').attr('class', 'nd-label').attr('y', 12).text(node.label);

    g.on('click', e => { e.stopPropagation(); onSelect(node); })
      .on('mouseenter', e => {
        const tip = document.getElementById('tip');
        const sp = SPHERES[node.sphere];
        tip.innerHTML = '<strong style="color:' + sp.color + '">' + node.label + '</strong><br><span style="font-size:.52rem;color:var(--muted)">' + sp.label + '</span>';
        tip.classList.add('show');
        tip.style.left = (e.clientX + 14) + 'px';
        tip.style.top = (e.clientY - 8) + 'px';
      })
      .on('mouseleave', () => {
        document.getElementById('tip').classList.remove('show');
      });
  });
}

export function applyFilters(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap, selectedId) {
  arcDataStore.forEach(arc => {
    const sphereOk = activeSpheres.has(nodeMap[arc.from]?.sphere) && activeSpheres.has(nodeMap[arc.to]?.sphere);
    const layerOk = activeLayers.has(arc.layer);
    const selOk = !selectedId || arc.from === selectedId || arc.to === selectedId;
    const vis = sphereOk && layerOk && selOk;
    d3.select(arc.el)
      .attr('opacity', vis ? (selectedId ? .9 : .62) : .04)
      .classed('sel', vis && !!selectedId);
  });

  if (gNode) {
    gNode.selectAll('.node').each(function () {
      const id = d3.select(this).attr('data-id');
      const sphereOk = activeSpheres.has(nodeMap[id]?.sphere);
      if (!sphereOk) { d3.select(this).attr('opacity', 0); return; }
      if (!selectedId) { d3.select(this).attr('opacity', 1); return; }
      const conn = getConnected(selectedId, CONNECTIONS);
      d3.select(this).attr('opacity', (id === selectedId || conn.has(id)) ? 1 : .15);
    });
  }
}

export function getConnected(id, CONNECTIONS) {
  const s = new Set();
  Object.values(CONNECTIONS).flat().forEach(([a, b]) => {
    if (a === id) s.add(b);
    if (b === id) s.add(a);
  });
  return s;
}

export function selectNode() {
  // Handled by main.js handleSelectNode
}

export function deselect(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap) {
  applyFilters(gArc, gNode, activeSpheres, activeLayers, CONNECTIONS, nodeMap, null);
}

export function initSvgOverlay() {
  // placeholder -- setup done in main.js
}
