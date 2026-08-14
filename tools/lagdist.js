/* Samler spillfilene i dist/ – mappa som Capacitor pakker inn i app-ene,
 * og som kan lastes rett opp til en hvilken som helst webserver.
 * Kjør:  node tools/lagdist.js
 */
const fs = require('fs');
const path = require('path');

const rot = path.join(__dirname, '..');
const ut = path.join(rot, 'dist');

const TA_MED = [
  'index.html', 'styles.css', 'manifest.webmanifest', 'sw.js',
  'ikoner', 'src'
];

function kopier(fra, til) {
  const st = fs.statSync(fra);
  if (st.isDirectory()) {
    fs.mkdirSync(til, { recursive: true });
    for (const navn of fs.readdirSync(fra)) kopier(path.join(fra, navn), path.join(til, navn));
  } else {
    fs.mkdirSync(path.dirname(til), { recursive: true });
    fs.copyFileSync(fra, til);
  }
}

fs.rmSync(ut, { recursive: true, force: true });
let filer = 0, bytes = 0;
for (const navn of TA_MED) {
  const fra = path.join(rot, navn);
  if (!fs.existsSync(fra)) { console.error('  ⚠️  mangler: ' + navn); continue; }
  kopier(fra, path.join(ut, navn));
}

(function tell(mappe) {
  for (const navn of fs.readdirSync(mappe)) {
    const p = path.join(mappe, navn);
    const st = fs.statSync(p);
    if (st.isDirectory()) tell(p); else { filer++; bytes += st.size; }
  }
})(ut);

console.log('📦 dist/ er klar: ' + filer + ' filer, ' + (bytes / 1024).toFixed(0) + ' kB');
console.log('   Last opp mappa til en webserver, eller kjør «npx cap sync» for app-bygg.');
