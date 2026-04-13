export function initTooltip(svg, SPHERES) {
  const tip = document.getElementById('tip');
  svg.on('mousemove', e => {
    if (!tip.classList.contains('show')) return;
    tip.style.left = (e.clientX + 14) + 'px';
    tip.style.top = (e.clientY - 8) + 'px';
  });
}
