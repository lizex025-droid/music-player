const fs = require('fs');
require('./build-drag-reorder.js');
require('./build-multi-select.js');

fs.mkdirSync('dist', { recursive: true });

const copyFiles = [
  'apple-touch-icon.png',
  'apple-touch-icon-precomposed.png',
  'apple-touch-icon-180x180.png',
  'apple-touch-icon-180x180-precomposed.png',
  'manifest.webmanifest',
  'sw.js'
];

for (const file of copyFiles) {
  fs.copyFileSync(file, `dist/${file}`);
}

for (const size of [192, 512]) {
  const src = `pwa-icon-${size}.png.b64`;
  const out = `dist/pwa-icon-${size}.png`;
  fs.writeFileSync(out, Buffer.from(fs.readFileSync(src, 'utf8').trim(), 'base64'));
}

let html = fs.readFileSync('dist/index.html', 'utf8');

if (!html.includes('PWA_INSTALL_V2')) {
  html = html.replace('</head>', `
<link rel="manifest" href="/manifest.webmanifest">
<meta name="application-name" content="Music Player">
<meta name="mobile-web-app-capable" content="yes">
<meta name="msapplication-TileColor" content="#121212">
<style>
/* PWA_INSTALL_V2 */
#pwa-install-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 164px;
  z-index: 120;
  border: 0;
  border-radius: 999px;
  padding: 10px 16px;
  background: var(--accent, #1DB954);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0,0,0,.28);
}
#pwa-install-btn:active { transform: scale(.97); }
#pwa-install-btn.ready { box-shadow: 0 0 0 2px rgba(29,185,84,.22), 0 6px 20px rgba(0,0,0,.28); }
@media (max-width: 767px) { #pwa-install-btn { display: none !important; } }
@media (display-mode: standalone) { #pwa-install-btn { display: none !important; } }
</style>
</head>`);

  html = html.replace('<body>', `<body>
<button id="pwa-install-btn" type="button" aria-label="Install Music Player" title="Install Music Player">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 21h14"/></svg>
  Install App
</button>`);

  html = html.replace('</body>', `<script>
(() => {
  const installBtn = document.getElementById('pwa-install-btn');
  let deferredInstallPrompt = null;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

  function syncInstallButton() {
    if (!installBtn) return;
    if (!isDesktop() || isStandalone()) {
      installBtn.style.display = 'none';
      return;
    }
    installBtn.style.display = 'inline-flex';
    installBtn.classList.toggle('ready', !!deferredInstallPrompt);
    installBtn.title = deferredInstallPrompt
      ? 'Install Music Player'
      : 'Install this app from your browser';
  }

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  }

  registerSW();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    syncInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    syncInstallButton();
  });

  window.addEventListener('resize', syncInstallButton);

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (isStandalone()) {
        syncInstallButton();
        return;
      }

      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        try {
          await deferredInstallPrompt.userChoice;
        } catch (_) {}
        deferredInstallPrompt = null;
        syncInstallButton();
        return;
      }

      const isEdge = /Edg\//.test(navigator.userAgent);
      const isChrome = /Chrome\//.test(navigator.userAgent) && !isEdge;
      const message = isEdge
        ? 'In Microsoft Edge: click the three dots (…) → Apps → Install Music Player.'
        : isChrome
          ? 'In Chrome: click the Install icon in the address bar, or ⋮ → Cast, save, and share → Install page as app.'
          : 'Use your browser menu and choose Install app / Install page as app.';

      if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(message);
      else alert(message);
    });
  }

  syncInstallButton();
})();
</script>
</body>`);
}

fs.writeFileSync('dist/index.html', html);
console.log('Built drag reorder + multi-select + always-visible desktop PWA install support');
