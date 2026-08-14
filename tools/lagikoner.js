/* Lager app-ikonene til hjemskjermen.
 * Kjør:  node tools/lagikoner.js
 *
 * Tegner ikonet som SVG og fotograferer det i flere størrelser. Da slipper vi
 * bildefiler i repoet som ingen vet hvordan ble til – ikonet ER denne koden.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW_MODULE || 'playwright');

const utMappe = path.join(__dirname, '..', 'ikoner');

function finnChromium() {
  if (process.env.CHROMIUM_STI) return process.env.CHROMIUM_STI;
  const rot = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(rot)) return undefined;
  for (const mappe of fs.readdirSync(rot)) {
    for (const kandidat of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const sti = path.join(rot, mappe, kandidat);
      if (fs.existsSync(sti)) return sti;
    }
  }
  return undefined;
}

/* padding = hvor mye luft rundt motivet. Maskerbare ikoner blir beskåret til
   en sirkel av Android, så der må motivet holde seg godt innenfor. */
function svg(padding) {
  const s = 512;
  const skala = 1 - padding * 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2f1e"/>
      <stop offset="55%" stop-color="#1d1712"/>
      <stop offset="100%" stop-color="#0f0d0b"/>
    </linearGradient>
    <linearGradient id="gull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbe08d"/>
      <stop offset="45%" stop-color="#f2c14e"/>
      <stop offset="100%" stop-color="#b9821f"/>
    </linearGradient>
    <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5f86ab"/>
      <stop offset="100%" stop-color="#2b3a44"/>
    </linearGradient>
  </defs>

  <rect width="${s}" height="${s}" fill="url(#bg)"/>
  <circle cx="${s / 2}" cy="${s * 0.34}" r="${s * 0.30}" fill="url(#himmel)" opacity="0.5"/>

  <g transform="translate(${s / 2} ${s / 2}) scale(${skala}) translate(${-s / 2} ${-s / 2})">
    <!-- fjell bak borgen -->
    <path d="M40 350 L150 215 L245 350 Z" fill="#2f3a42"/>
    <path d="M270 350 L385 200 L480 350 Z" fill="#26313a"/>

    <!-- bakken -->
    <path d="M28 352 h456 v40 a24 24 0 0 1 -24 24 h-408 a24 24 0 0 1 -24 -24 z" fill="#3d3323"/>

    <!-- sidetårn -->
    <path d="M96 200 h74 v152 h-74 z" fill="url(#gull)"/>
    <path d="M96 200 h18 v-26 h18 v26 h20 v-26 h18 v26 h-74 z" fill="url(#gull)"/>
    <path d="M342 200 h74 v152 h-74 z" fill="url(#gull)"/>
    <path d="M342 200 h18 v-26 h18 v26 h20 v-26 h18 v26 h-74 z" fill="url(#gull)"/>

    <!-- hovedtårn -->
    <path d="M196 132 h120 v220 h-120 z" fill="url(#gull)"/>
    <path d="M196 132 h24 v-32 h24 v32 h24 v-32 h24 v32 h24 v-32 h24 v32 z" fill="url(#gull)" opacity="0"/>
    <path d="M190 132 h132 v-30 h-24 v-22 h-24 v22 h-36 v-22 h-24 v22 h-24 z" fill="url(#gull)"/>

    <!-- port og vinduer -->
    <path d="M232 256 h48 v96 h-48 z" fill="#2a1f12"/>
    <path d="M232 256 a24 24 0 0 1 48 0 z" fill="#2a1f12"/>
    <rect x="120" y="240" width="26" height="38" rx="13" fill="#2a1f12"/>
    <rect x="366" y="240" width="26" height="38" rx="13" fill="#2a1f12"/>
    <rect x="243" y="170" width="26" height="40" rx="13" fill="#2a1f12"/>

    <!-- flagg -->
    <rect x="252" y="34" width="8" height="52" fill="#8a6a2a"/>
    <path d="M260 40 l64 14 -64 16 z" fill="#e0554b"/>
  </g>
</svg>`;
}

(async () => {
  fs.mkdirSync(utMappe, { recursive: true });
  const nettleser = await chromium.launch({ executablePath: finnChromium() });

  const bilder = [
    { fil: 'ikon-192.png', str: 192, padding: 0.06 },
    { fil: 'ikon-512.png', str: 512, padding: 0.06 },
    { fil: 'ikon-maskbar-512.png', str: 512, padding: 0.20 },   // Android beskjærer
    { fil: 'apple-touch-icon.png', str: 180, padding: 0.06 },
    { fil: 'ikon-1024.png', str: 1024, padding: 0.06 }          // til app-butikkene
  ];

  for (const b of bilder) {
    const side = await nettleser.newPage({ viewport: { width: b.str, height: b.str } });
    await side.setContent(
      `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${b.str}px;height:${b.str}px}</style>` +
      svg(b.padding));
    await side.locator('svg').screenshot({ path: path.join(utMappe, b.fil), omitBackground: true });
    await side.close();
    console.log('  ✅ ' + b.fil + '  (' + b.str + '×' + b.str + ')');
  }

  await nettleser.close();
  console.log('\n🎨 Ikonene ligger i ikoner/');
})();
