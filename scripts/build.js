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

if (!html.includes('PWA_NATIVE_INSTALL_V3')) {
  html = html.replace('</head>', `
<!-- PWA_NATIVE_INSTALL_V3: Chromium controls the native address-bar install UI -->
<link rel="manifest" href="/manifest.webmanifest?v=6">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">
<link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png">
<meta name="application-name" content="Music Player">
<meta name="theme-color" content="#121212">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Music Player">
<meta name="msapplication-TileColor" content="#121212">
<script>
(() => {
  // Register immediately, before window.load, so Chromium can evaluate
  // installability as early as possible. Do not intercept beforeinstallprompt.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js?v=6', {
      scope: '/',
      updateViaCache: 'none'
    }).catch(err => console.warn('Service worker registration failed', err));
  }
})();
</script>
</head>`);
}

fs.writeFileSync('dist/index.html', html);
console.log('Built drag reorder + multi-select + immediate native desktop PWA support');
