// ──────────────────────────────────────
// SVG Geographic Labels Layer
// ──────────────────────────────────────
// Renders all labels as SVG <text> elements once, then toggles
// visibility based on zoom level and active label categories.

export function renderLabels(gLabel, LABEL_DATA, proj) {
  if (!LABEL_DATA) return;

  // Oceans
  (LABEL_DATA.oceans || []).forEach(label => {
    const pos = proj([label.lon, label.lat]);
    if (!pos) return;
    gLabel.append('text')
      .attr('class', 'geo-label geo-label-ocean')
      .attr('data-category', 'oceans')
      .attr('data-min-zoom', label.minZoom)
      .attr('data-x', pos[0]).attr('data-y', pos[1])
      .attr('transform', `translate(${pos[0]},${pos[1]})`)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', '14px')
      .text(label.name);
  });

  // Seas
  (LABEL_DATA.seas || []).forEach(label => {
    const pos = proj([label.lon, label.lat]);
    if (!pos) return;
    gLabel.append('text')
      .attr('class', 'geo-label geo-label-sea')
      .attr('data-category', 'oceans')  // seas toggle with oceans
      .attr('data-min-zoom', label.minZoom)
      .attr('data-x', pos[0]).attr('data-y', pos[1])
      .attr('transform', `translate(${pos[0]},${pos[1]})`)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', '9px')
      .text(label.name);
  });

  // Country names
  (LABEL_DATA.countryNames || []).forEach(label => {
    const pos = proj([label.lon, label.lat]);
    if (!pos) return;
    gLabel.append('text')
      .attr('class', 'geo-label geo-label-country')
      .attr('data-category', 'countryNames')
      .attr('data-min-zoom', label.minZoom)
      .attr('data-x', pos[0]).attr('data-y', pos[1])
      .attr('transform', `translate(${pos[0]},${pos[1]})`)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', '8px')
      .text(label.name);
  });

  // Capitals (dot + text)
  (LABEL_DATA.capitals || []).forEach(label => {
    const pos = proj([label.lon, label.lat]);
    if (!pos) return;
    gLabel.append('circle')
      .attr('class', 'capital-dot')
      .attr('data-category', 'capitals')
      .attr('data-min-zoom', label.minZoom)
      .attr('cx', pos[0]).attr('cy', pos[1])
      .attr('r', 2).attr('data-r', 2);
    gLabel.append('text')
      .attr('class', 'geo-label geo-label-capital')
      .attr('data-category', 'capitals')
      .attr('data-min-zoom', label.minZoom)
      .attr('data-x', pos[0] + 4).attr('data-y', pos[1])
      .attr('transform', `translate(${pos[0] + 4},${pos[1]})`)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '6px')
      .text(label.name);
  });

  // Cities (dot + text)
  (LABEL_DATA.cities || []).forEach(label => {
    const pos = proj([label.lon, label.lat]);
    if (!pos) return;
    gLabel.append('circle')
      .attr('class', 'city-dot')
      .attr('data-category', 'cities')
      .attr('data-min-zoom', label.minZoom)
      .attr('cx', pos[0]).attr('cy', pos[1])
      .attr('r', 1.5).attr('data-r', 1.5);
    gLabel.append('text')
      .attr('class', 'geo-label geo-label-city')
      .attr('data-category', 'cities')
      .attr('data-min-zoom', label.minZoom)
      .attr('data-x', pos[0] + 3).attr('data-y', pos[1])
      .attr('transform', `translate(${pos[0] + 3},${pos[1]})`)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '5px')
      .text(label.name);
  });

  // Rivers
  (LABEL_DATA.rivers || []).forEach(label => {
    const pos = proj([label.lon, label.lat]);
    if (!pos) return;
    gLabel.append('text')
      .attr('class', 'geo-label geo-label-river')
      .attr('data-category', 'rivers')
      .attr('data-min-zoom', label.minZoom)
      .attr('data-x', pos[0]).attr('data-y', pos[1])
      .attr('transform', `translate(${pos[0]},${pos[1]})`)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', '6px')
      .text(label.name);
  });

  // Mountains
  (LABEL_DATA.mountains || []).forEach(label => {
    const pos = proj([label.lon, label.lat]);
    if (!pos) return;
    gLabel.append('text')
      .attr('class', 'geo-label geo-label-mountain')
      .attr('data-category', 'mountains')
      .attr('data-min-zoom', label.minZoom)
      .attr('data-x', pos[0]).attr('data-y', pos[1])
      .attr('transform', `translate(${pos[0]},${pos[1]})`)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', '6px')
      .text(label.name);
  });
}

export function updateLabelVisibility(gLabel, zoomLevel, k, activeLabels) {
  gLabel.selectAll('[data-category]').each(function () {
    const el = d3.select(this);
    const cat = el.attr('data-category');
    const minZoom = parseInt(el.attr('data-min-zoom'));
    const visible = activeLabels.has(cat) && zoomLevel >= minZoom;
    el.attr('opacity', visible ? 1 : 0)
      .attr('display', visible ? null : 'none');
  });
}
