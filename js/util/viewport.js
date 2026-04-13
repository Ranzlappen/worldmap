export function getVisibleBounds(transform, canvasWidth, canvasHeight, proj) {
  try {
    const w = canvasWidth / devicePixelRatio;
    const h = canvasHeight / devicePixelRatio;

    // Inverse transform: screen coords → SVG coords → geo coords
    const topLeft = proj.invert([
      (0 - transform.x) / transform.k,
      (0 - transform.y) / transform.k
    ]);
    const bottomRight = proj.invert([
      (w - transform.x) / transform.k,
      (h - transform.y) / transform.k
    ]);

    if (!topLeft || !bottomRight) return null;

    return {
      west: Math.min(topLeft[0], bottomRight[0]),
      east: Math.max(topLeft[0], bottomRight[0]),
      north: Math.max(topLeft[1], bottomRight[1]),
      south: Math.min(topLeft[1], bottomRight[1])
    };
  } catch (e) {
    return null; // projection inversion failed at edge
  }
}
