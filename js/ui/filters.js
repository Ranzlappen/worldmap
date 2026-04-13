import { SPHERES } from '../data/spheres.js';
import { LAYERS } from '../data/layers.js';

export const activeSpheres = new Set(Object.keys(SPHERES));
export const activeLayers  = new Set(Object.keys(LAYERS));
export const activeLabels  = new Set(['countryNames', 'capitals', 'oceans']);

let selectedId = null;

export function getSelectedId() { return selectedId; }
export function setSelectedId(id) { selectedId = id; }
