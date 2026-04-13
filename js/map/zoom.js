import { ZOOM_LEVELS } from '../config.js';
import { debounce } from '../util/debounce.js';

let currentLevel = 1;

export function getZoomLevel(k) {
  for (const z of ZOOM_LEVELS) {
    if (k >= z.min && k < z.max) return z.level;
  }
  return k < ZOOM_LEVELS[0].min ? 1 : 6;
}

export function getCurrentTransform(svg) {
  return d3.zoomTransform(svg.node());
}

export function setupZoom(svg, scaleExtent, onZoom, onZoomEnd) {
  const debouncedEnd = debounce((transform) => {
    onZoomEnd(transform);
  }, 150);

  const zoomBehavior = d3.zoom()
    .scaleExtent(scaleExtent)
    .on('zoom', e => {
      onZoom(e.transform);
      debouncedEnd(e.transform);
    });

  svg.call(zoomBehavior).on('dblclick.zoom', null);

  return { zoomBehavior };
}
