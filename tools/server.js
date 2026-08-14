/* Liten lokal webserver, så du kan teste appen slik den oppfører seg i drift
 * (service worker og installasjon krever http/https – ikke file://).
 *
 * Kjør:  node tools/server.js      →  http://localhost:8080
 * Åpne adressen på mobilen din over samme wifi ved å bytte ut localhost med
 * maskinens IP-adresse.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rot = path.join(__dirname, '..');
const port = Number(process.argv[2] || 8080);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json'
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const fil = path.join(rot, rel);
  if (!fil.startsWith(rot) || !fs.existsSync(fil) || fs.statSync(fil).isDirectory()) {
    res.writeHead(404); res.end('Fant ikke ' + rel); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fil)] || 'application/octet-stream' });
  fs.createReadStream(fil).pipe(res);
}).listen(port, () => {
  console.log('🏰 OpenWorld kjører:');
  console.log('   http://localhost:' + port);
  for (const navn of Object.keys(os.networkInterfaces())) {
    for (const n of os.networkInterfaces()[navn]) {
      if (n.family === 'IPv4' && !n.internal) {
        console.log('   http://' + n.address + ':' + port + '   ← åpne denne på mobilen');
      }
    }
  }
});
