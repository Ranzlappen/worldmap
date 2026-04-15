export function initTooltip(svg) {
  const tip = document.getElementById('tip');
  let rafId = 0;
  svg.on('mousemove', e => {
    if (!tip.classList.contains('show')) return;
    if (!rafId) {
      const x = e.clientX, y = e.clientY;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        tip.style.transform = `translate(${x + 14}px,${y - 8}px)`;
      });
    }
  });
}
