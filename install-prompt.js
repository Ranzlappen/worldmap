// PWA automatic native install prompt handler
(function () {
  let deferredPrompt = null;
  let promptShown = false;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    if (promptShown) return;
    deferredPrompt = e;
    promptShown = true;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choiceResult) {
      deferredPrompt = null;
    });
  });
})();
