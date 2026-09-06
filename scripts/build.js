const fs = require('fs');
require('./build-drag-reorder.js');
require('./build-multi-select.js');

const iconFiles = [
  'apple-touch-icon.png',
  'apple-touch-icon-precomposed.png',
  'apple-touch-icon-180x180.png',
  'apple-touch-icon-180x180-precomposed.png'
];

for (const file of iconFiles) {
  fs.copyFileSync(file, `dist/${file}`);
}

console.log('Built drag reorder + multi-select and copied resized iOS icons to dist');
