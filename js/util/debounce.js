export function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function rafThrottle(fn) {
  let queued = false;
  return function (...args) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      fn.apply(this, args);
      queued = false;
    });
  };
}
