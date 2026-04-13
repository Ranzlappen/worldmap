import { getSelectedId } from './filters.js';
import { LABEL_CATEGORIES } from '../data/labels.js';

let sheetOpen = false;
let sheetTab = 'filters';

export function openSheet(open) {
  sheetOpen = open;
  const sheet = document.getElementById('sheet');
  if (open) {
    sheet.style.height = '58vh';
    document.getElementById('sheet-tabs').style.display = 'flex';
    document.getElementById('sheet-body').style.display = 'block';
  } else {
    sheet.style.height = '64px';
    document.getElementById('sheet-tabs').style.display = 'none';
    document.getElementById('sheet-body').style.display = 'none';
  }
}

export function switchTab(tab) {
  sheetTab = tab;
  document.querySelectorAll('.sh-tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  if (tab === 'filters') _renderFilters();
  else _renderInfo();
}

let _SPHERES, _LAYERS, _CONNECTIONS, _activeSpheres, _activeLayers, _nodeMap;
let _onSphereChange, _onLayerChange;

export function buildMobileSheet(SPHERES, LAYERS, CONNECTIONS, activeSpheres, activeLayers, nodeMap, onSphereChange, onLayerChange) {
  _SPHERES = SPHERES; _LAYERS = LAYERS; _CONNECTIONS = CONNECTIONS;
  _activeSpheres = activeSpheres; _activeLayers = activeLayers; _nodeMap = nodeMap;
  _onSphereChange = onSphereChange; _onLayerChange = onLayerChange;

  document.getElementById('sheet-handle').addEventListener('click', () => openSheet(!sheetOpen));
  document.querySelectorAll('.sh-tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });
  _renderFilters();
}

export function updateMobileInfo(node) {
  if (sheetTab === 'info') _renderInfo();
}

function _renderFilters() {
  const body = document.getElementById('sheet-body');
  body.innerHTML = '<div style="font-size:.5rem;color:var(--muted);text-transform:uppercase;letter-spacing:.14em;margin-bottom:.5rem;">Spheres</div>';

  const sg = document.createElement('div');
  sg.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:.8rem;';
  Object.entries(_SPHERES).forEach(([k, s]) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:.35rem;padding:5px 7px;border-radius:4px;border:1px solid var(--border);cursor:pointer;font-size:.6rem;color:var(--text);transition:opacity .2s;opacity:' + (_activeSpheres.has(k) ? 1 : .25) + ';';
    d.innerHTML = '<div style="width:7px;height:7px;border-radius:50%;background:' + s.color + ';flex-shrink:0"></div>' + s.label;
    d.addEventListener('click', () => {
      const on = _activeSpheres.has(k);
      if (on) _activeSpheres.delete(k); else _activeSpheres.add(k);
      d.style.opacity = on ? '.25' : '1';
      _onSphereChange();
    });
    sg.appendChild(d);
  });
  body.appendChild(sg);

  const lh = document.createElement('div');
  lh.style.cssText = 'font-size:.5rem;color:var(--muted);text-transform:uppercase;letter-spacing:.14em;margin-bottom:.5rem;';
  lh.textContent = 'Layers';
  body.appendChild(lh);

  Object.entries(_LAYERS).forEach(([k, layer]) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:.5rem;padding:5px 0;cursor:pointer;';
    const tog = document.createElement('div');
    const isOn = _activeLayers.has(k);
    tog.style.cssText = 'width:28px;height:15px;border-radius:8px;background:' + (isOn ? layer.color : 'var(--muted)') + ';position:relative;flex-shrink:0;transition:background .2s;';
    tog.innerHTML = '<div style="position:absolute;top:2px;left:' + (isOn ? '15' : '2') + 'px;width:11px;height:11px;border-radius:50%;background:#fff;transition:left .2s;"></div>';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:.65rem;color:var(--text);flex:1;';
    lbl.textContent = layer.icon + ' ' + layer.label;
    const cnt = document.createElement('span');
    cnt.style.cssText = 'font-size:.52rem;color:var(--muted);';
    cnt.textContent = (_CONNECTIONS[k] || []).length;
    row.append(tog, lbl, cnt);
    row.addEventListener('click', () => {
      const on = _activeLayers.has(k);
      if (on) _activeLayers.delete(k); else _activeLayers.add(k);
      tog.style.background = on ? 'var(--muted)' : layer.color;
      tog.firstChild.style.left = on ? '2px' : '15px';
      _onLayerChange();
    });
    body.appendChild(row);
  });
}

function _renderInfo() {
  const body = document.getElementById('sheet-body');
  const selectedId = getSelectedId();
  if (!selectedId) {
    body.innerHTML = '<div style="font-size:.62rem;color:var(--muted);text-align:center;padding:1rem 0;">Select a country node on the map.</div>';
    return;
  }
  const node = _nodeMap[selectedId];
  const sp = _SPHERES[node.sphere];
  body.innerHTML = '';

  const hdr = document.createElement('div');
  hdr.style.cssText = 'margin-bottom:.6rem;';
  hdr.innerHTML = '<div style="font-family:Cinzel,serif;font-size:.9rem;color:var(--white);">' + node.label + '</div>' +
    '<div style="display:flex;align-items:center;gap:5px;font-size:.52rem;margin-top:.15rem;">' +
      '<div style="width:6px;height:6px;border-radius:50%;background:' + sp.color + '"></div>' +
      '<span style="color:' + sp.color + '">' + sp.label + '</span>' +
    '</div>' +
    '<div style="font-size:.58rem;color:var(--text);line-height:1.6;margin-top:.4rem;opacity:.8;">' + node.desc + '</div>';
  body.appendChild(hdr);

  Object.keys(_LAYERS).forEach(lk => {
    if (!_activeLayers.has(lk)) return;
    const def = _LAYERS[lk];
    const rows = (_CONNECTIONS[lk] || []).filter(([a, b]) => a === node.id || b === node.id)
      .map(([a, b, str]) => ({ other: _nodeMap[a === node.id ? b : a], str }))
      .filter(r => r.other && _activeSpheres.has(r.other.sphere))
      .sort((a, b) => b.str - a.str);
    if (!rows.length) return;

    const gh = document.createElement('div');
    gh.style.cssText = 'font-size:.5rem;color:' + def.color + ';text-transform:uppercase;letter-spacing:.1em;padding:.4rem 0 .2rem;';
    gh.textContent = def.icon + ' ' + def.label + ' (' + rows.length + ')';
    body.appendChild(gh);

    rows.forEach(r => {
      const rr = document.createElement('div');
      rr.style.cssText = 'display:flex;align-items:center;gap:6px;padding:2px 0;font-size:.58rem;';
      rr.innerHTML = '<div style="width:5px;height:5px;border-radius:50%;background:' + def.color + ';flex-shrink:0"></div>' +
        '<span style="flex:1;color:var(--white)">' + r.other.label + '</span>' +
        '<div style="width:42px;height:3px;background:var(--border);border-radius:2px;overflow:hidden"><div style="height:100%;width:' + r.str + '%;background:' + def.color + '"></div></div>' +
        '<span style="font-size:.5rem;color:var(--muted);min-width:22px;text-align:right">' + r.str + '%</span>';
      body.appendChild(rr);
    });
  });
}
