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

if (!html.includes('PWA_INSTALL_V3')) {
  html = html.replace('</head>', `
<link rel="manifest" href="/manifest.webmanifest?v=3">
<meta name="application-name" content="Music Player">
<meta name="mobile-web-app-capable" content="yes">
<meta name="msapplication-TileColor" content="#121212">
<script>
/* PWA_INSTALL_V3: capture Chromium install event as early as possible */
window.__musicPlayerInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  window.__musicPlayerInstallPrompt = event;
  window.dispatchEvent(new Event('musicplayer-install-ready'));
});
</script>
<style>
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
#pwa-install-btn.ready { box-shadow: 0 0 0 2px rgba(29,185,84,.35), 0 6px 20px rgba(0,0,0,.28); }
#pwa-help-backdrop {
  display:none; position:fixed; inset:0; z-index:998; background:rgba(0,0,0,.66);
}
#pwa-help {
  display:none; position:fixed; z-index:999; left:50%; top:50%; transform:translate(-50%,-50%);
  width:min(430px, calc(100% - 36px)); padding:22px; border-radius:18px;
  background:var(--surface,#1e1e1e); color:var(--text,#fff); box-shadow:0 18px 60px rgba(0,0,0,.5);
}
#pwa-help h3 { margin:0 0 10px; font-size:20px; }
#pwa-help p { margin:0 0 14px; color:var(--text2,#b3b3b3); line-height:1.5; }
.pwa-help-actions { display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
.pwa-help-actions button { border:0; border-radius:999px; padding:10px 16px; font:inherit; font-weight:700; cursor:pointer; }
#pwa-help-close { background:var(--surface2,#2a2a2a); color:var(--text,#fff); }
#pwa-help-refresh { background:var(--accent,#1DB954); color:#fff; }
@media (max-width: 767px) { #pwa-install-btn { display: none !important; } }
@media (display-mode: standalone) { #pwa-install-btn { display: none !important; } }
</style>
</head>`);

  html = html.replace('<body>', `<body>
<button id="pwa-install-btn" type="button" aria-label="Install Music Player" title="Install Music Player">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 21h14"/></svg>
  Install App
</button>
<div id="pwa-help-backdrop"></div>
<div id="pwa-help" role="dialog" aria-modal="true" aria-labelledby="pwa-help-title">
  <h3 id="pwa-help-title">Install Music Player</h3>
  <p id="pwa-help-text">Preparing installation…</p>
  <div class="pwa-help-actions">
    <button id="pwa-help-close" type="button">Close</button>
    <button id="pwa-help-refresh" type="button">Refresh PWA</button>
  </div>
</div>`);

  html = html.replace('</body>', `<script>
(() => {
  const installBtn = document.getElementById('pwa-install-btn');
  const help = document.getElementById('pwa-help');
  const backdrop = document.getElementById('pwa-help-backdrop');
  const helpText = document.getElementById('pwa-help-text');
  const closeBtn = document.getElementById('pwa-help-close');
  const refreshBtn = document.getElementById('pwa-help-refresh');

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

  function getPrompt() { return window.__musicPlayerInstallPrompt || null; }

  function syncInstallButton() {
    if (!installBtn) return;
    if (!isDesktop() || isStandalone()) {
      installBtn.style.display = 'none';
      return;
    }
    installBtn.style.display = 'inline-flex';
    installBtn.classList.toggle('ready', !!getPrompt());
    installBtn.textContent = getPrompt() ? 'Install App' : 'Install App';
  }

  function showHelp(message) {
    if (helpText) helpText.textContent = message;
    if (help) help.style.display = 'block';
    if (backdrop) backdrop.style.display = 'block';
  }

  function hideHelp() {
    if (help) help.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
  }

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/sw.js?v=3', { scope: '/' });
      await navigator.serviceWorker.ready;
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  }

  registerSW().then(() => {
    setTimeout(syncInstallButton, 250);
  });

  window.addEventListener('musicplayer-install-ready', syncInstallButton);
  window.addEventListener('beforeinstallprompt', syncInstallButton);
  window.addEventListener('appinstalled', () => {
    window.__musicPlayerInstallPrompt = null;
    syncInstallButton();
    hideHelp();
  });
  window.addEventListener('resize', syncInstallButton);

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (isStandalone()) {
        syncInstallButton();
        return;
      }

      const promptEvent = getPrompt();
      if (promptEvent) {
        try {
          await promptEvent.prompt();
          await promptEvent.userChoice;
        } catch (err) {
          console.warn('Install prompt failed', err);
        }
        window.__musicPlayerInstallPrompt = null;
        syncInstallButton();
        return;
      }

      const isEdge = /Edg\//.test(navigator.userAgent);
      const isChrome = /Chrome\//.test(navigator.userAgent) && !isEdge;
      if (isEdge) {
        showHelp('Edge has not exposed the install prompt yet. Click … in the top-right → Apps → Install Music Player. If that option is missing, click Refresh PWA below once, then try again.');
      } else if (isChrome) {
        showHelp('Chrome has not exposed the install prompt yet. Look for the install icon in the right side of the address bar, or use ⋮ → Cast, save, and share → Install page as app. If it is missing, click Refresh PWA below once, then try again.');
      } else {
        showHelp('This browser did not provide the PWA install prompt. Use its menu and choose Install app / Install page as app, or open this site in Chrome or Edge.');
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', hideHelp);
  if (backdrop) backdrop.addEventListener('click', hideHelp);
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing…';
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch (_) {}
      location.reload();
    });
  }

  syncInstallButton();
})();
</script>
</body>`);
}

fs.writeFileSync('dist/index.html', html);
console.log('Built drag reorder + multi-select + fixed desktop PWA install prompt support');
