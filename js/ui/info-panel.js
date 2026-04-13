export function updateInfoPanel(node, LAYERS, CONNECTIONS, activeLayers, activeSpheres, nodeMap, SPHERES) {
  const infoEl = document.getElementById('info');
  if (!node) { infoEl.classList.remove('open'); return; }

  document.getElementById('inf-name').textContent = node.label;
  const sp = SPHERES[node.sphere];
  document.getElementById('inf-dot').style.background = sp.color;
  document.getElementById('inf-sphere').textContent = sp.label;
  document.getElementById('inf-sphere').style.color = sp.color;
  document.getElementById('inf-desc').textContent = node.desc;

  const cont = document.getElementById('info-conns');
  cont.innerHTML = '';
  let total = 0;

  Object.keys(LAYERS).forEach(lk => {
    if (!activeLayers.has(lk)) return;
    const def = LAYERS[lk];
    const rows = (CONNECTIONS[lk] || []).filter(([a, b]) => a === node.id || b === node.id)
      .map(([a, b, str]) => ({ other: nodeMap[a === node.id ? b : a], str }))
      .filter(r => r.other && activeSpheres.has(r.other.sphere))
      .sort((a, b) => b.str - a.str);
    if (!rows.length) return;
    total += rows.length;

    const hdr = document.createElement('div');
    hdr.className = 'conn-grp-hdr';
    hdr.style.color = def.color;
    hdr.textContent = def.icon + ' ' + def.label + ' (' + rows.length + ')';
    cont.appendChild(hdr);

    rows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'conn-row';
      row.innerHTML =
        '<div class="conn-pip" style="background:' + def.color + '"></div>' +
        '<div class="conn-name">' + r.other.label + '</div>' +
        '<div class="conn-bar-bg"><div class="conn-bar-fg" style="width:' + r.str + '%;background:' + def.color + '"></div></div>' +
        '<div class="conn-pct">' + r.str + '%</div>';
      cont.appendChild(row);
    });
  });

  if (!total) {
    cont.innerHTML = '<div class="no-conn">No active connections match current filters.</div>';
  }

  if (window.innerWidth > 768) infoEl.classList.add('open');
}
