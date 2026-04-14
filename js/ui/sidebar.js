import { LABEL_CATEGORIES } from '../data/labels.js';

export function buildSidebar(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, activeLabels, onSphereChange, onLayerChange, onLabelChange) {
  // ── Spheres ──
  const sg = document.getElementById('sph-leg');
  Object.entries(SPHERES).forEach(([k, s]) => {
    const d = document.createElement('div');
    d.className = 'sph-chip on';
    d.dataset.key = k;
    d.innerHTML = '<div class="sph-dot" style="background:' + s.color + '"></div><span class="sph-lbl">' + s.label + '</span>';
    d.addEventListener('click', () => {
      const on = activeSpheres.has(k);
      if (on) activeSpheres.delete(k); else activeSpheres.add(k);
      d.classList.toggle('on', !on === false);
      d.classList.toggle('off', on);
      d.classList.toggle('on', !on);
      onSphereChange();
    });
    sg.appendChild(d);
  });

  // ── Layers ──
  const ll = document.getElementById('lyr-list');
  Object.entries(LAYERS).forEach(([k, layer]) => {
    const row = document.createElement('div');
    row.className = 'lyr-row';
    const tog = document.createElement('div');
    tog.className = 'tog on';
    tog.style.setProperty('--tc', layer.color);
    const lbl = document.createElement('span');
    lbl.className = 'lyr-name'; lbl.textContent = layer.label;
    const icon = document.createElement('i');
    icon.className = 'lyr-icon'; icon.textContent = layer.icon;
    const cnt = document.createElement('span');
    cnt.className = 'lyr-count'; cnt.textContent = (CONNECTIONS[k] || []).length;
    row.append(tog, icon, lbl, cnt);
    row.addEventListener('click', () => {
      const on = activeLayers.has(k);
      if (on) activeLayers.delete(k); else activeLayers.add(k);
      tog.classList.toggle('on', !on);
      onLayerChange();
    });
    ll.appendChild(row);
  });

  // ── Labels ──
  buildLabelToggles(activeLabels, onLabelChange || onSphereChange);
}

function buildLabelToggles(activeLabels, onLabelChange) {
  const sidebar = document.querySelector('.sb-scroll');
  const sec = document.createElement('div');
  sec.className = 'sb-sec';

  const ttl = document.createElement('div');
  ttl.className = 'sb-ttl';
  ttl.textContent = 'Labels';
  sec.appendChild(ttl);

  const list = document.createElement('div');
  list.id = 'lbl-list';

  LABEL_CATEGORIES.forEach(cat => {
    const row = document.createElement('div');
    row.className = 'lyr-row';

    const tog = document.createElement('div');
    const isOn = activeLabels.has(cat.key);
    tog.className = 'tog' + (isOn ? ' on' : '');
    tog.style.setProperty('--tc', cat.color);

    const icon = document.createElement('i');
    icon.className = 'lyr-icon';
    icon.textContent = cat.icon;

    const lbl = document.createElement('span');
    lbl.className = 'lyr-name';
    lbl.textContent = cat.label;

    row.append(tog, icon, lbl);
    row.addEventListener('click', () => {
      const on = activeLabels.has(cat.key);
      if (on) activeLabels.delete(cat.key); else activeLabels.add(cat.key);
      tog.classList.toggle('on', !on);
      onLabelChange();
    });
    list.appendChild(row);
  });

  sec.appendChild(list);
  sidebar.appendChild(sec);
}
