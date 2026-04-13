// ──────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────

export const VW = 1200;
export const VH = 620;

// Zoom‐level thresholds (scale → level)
export const ZOOM_LEVELS = [
  { min: 0.5, max: 1.0,  level: 1, name: 'world' },
  { min: 1.0, max: 2.0,  level: 2, name: 'continental' },
  { min: 2.0, max: 3.5,  level: 3, name: 'regional' },
  { min: 3.5, max: 5.0,  level: 4, name: 'country' },
  { min: 5.0, max: 7.0,  level: 5, name: 'detail' },
  { min: 7.0, max: 10.0, level: 6, name: 'max' }
];

export const SCALE_EXTENT = [0.5, 10];

// Atlas URLs for multi-resolution loading
export const ATLAS_URLS = {
  low:    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
  medium: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json',
  high:   'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json'
};
