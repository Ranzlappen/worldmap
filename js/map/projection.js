// Equal Earth projection: equal-area, visually appealing, reduces size distortion

export function createProjection(VW, VH) {
  const proj = d3.geoEqualEarth().scale(185).translate([VW / 2, VH / 2 + 10]);
  const path = d3.geoPath().projection(proj);
  return { proj, path };
}
