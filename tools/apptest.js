/* Sjekker at spillet oppfører seg som en installerbar app.
 * Kjør:  node tools/apptest.js
 *
 * Starter en liten HTTP-server (service workers virker ikke fra file://),
 * laster spillet, og kontrollerer manifest, ikoner, offline-drift og at
 * installasjonsflyten finnes.
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require(process.env.PW_MODULE || 'playwright');

const rot = path.join(__dirname, '..');
const PORT = 8931;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json'
};

function finnChromium() {
  if (process.env.CHROMIUM_STI) return process.env.CHROMIUM_STI;
  const mappe = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(mappe)) return undefined;
  for (const m of fs.readdirSync(mappe)) {
    for (const k of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const sti = path.join(mappe, m, k);
      if (fs.existsSync(sti)) return sti;
    }
  }
  return undefined;
}

const tjener = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const fil = path.join(rot, rel);
  if (!fil.startsWith(rot) || !fs.existsSync(fil) || fs.statSync(fil).isDirectory()) {
    res.writeHead(404); res.end('nope'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fil)] || 'application/octet-stream' });
  fs.createReadStream(fil).pipe(res);
});

(async () => {
  await new Promise(r => tjener.listen(PORT, r));
  const nettleser = await chromium.launch({
    executablePath: finnChromium(),
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  const kontekst = await nettleser.newContext({ viewport: { width: 390, height: 844 } });
  const side = await kontekst.newPage();

  const feil = [];
  side.on('pageerror', e => feil.push('JS-feil: ' + e.message));
  const steg = async (navn, fn) => {
    try { await fn(); console.log('  ✅ ' + navn); }
    catch (e) { feil.push(navn + ' → ' + e.message); console.log('  ❌ ' + navn + ': ' + e.message); }
  };

  console.log('\n📲 Apptest (http://localhost:' + PORT + ')\n');
  await side.goto('http://localhost:' + PORT + '/index.html');
  await side.waitForSelector('#startKnapp');

  await steg('Manifestet er gyldig og komplett', async () => {
    const m = await side.evaluate(async () => {
      const lenke = document.querySelector('link[rel=manifest]');
      if (!lenke) throw new Error('ingen manifestlenke i HTML');
      const r = await fetch(lenke.href);
      return r.json();
    });
    for (const felt of ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color']) {
      if (!m[felt]) throw new Error('manifest mangler «' + felt + '»');
    }
    if (m.display !== 'standalone') throw new Error('display må være standalone');
    if (m.icons.length < 2) throw new Error('for få ikoner');
    if (!m.icons.some(i => i.purpose === 'maskable')) throw new Error('mangler maskerbart ikon');
  });

  await steg('Alle ikonfilene finnes og er ekte PNG-er', async () => {
    const filer = ['ikoner/ikon-192.png', 'ikoner/ikon-512.png',
                   'ikoner/ikon-maskbar-512.png', 'ikoner/apple-touch-icon.png'];
    for (const f of filer) {
      const b = fs.readFileSync(path.join(rot, f));
      if (b.length < 500) throw new Error(f + ' er mistenkelig liten');
      if (b[1] !== 0x50 || b[2] !== 0x4e || b[3] !== 0x47) throw new Error(f + ' er ikke en PNG');
    }
  });

  await steg('iOS-taggene for hjemskjerm er på plass', async () => {
    const tagger = await side.evaluate(() => ({
      capable: !!document.querySelector('meta[name="apple-mobile-web-app-capable"]'),
      ikon: !!document.querySelector('link[rel="apple-touch-icon"]'),
      tittel: !!document.querySelector('meta[name="apple-mobile-web-app-title"]'),
      tema: !!document.querySelector('meta[name="theme-color"]')
    }));
    for (const k in tagger) if (!tagger[k]) throw new Error('mangler ' + k);
  });

  await steg('Service worker registreres og tar kontroll', async () => {
    await side.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 });
  });

  await steg('Hele spillet ligger i offline-bufferen', async () => {
    const mangler = await side.evaluate(async () => {
      const navn = await caches.keys();
      const c = await caches.open(navn[0]);
      const lagret = (await c.keys()).map(r => new URL(r.url).pathname);
      const maa = ['/index.html', '/styles.css', '/src/ui/app.js', '/src/core/engine.js',
                   '/src/by3d/scene.js', '/src/by3d/hus.js', '/manifest.webmanifest'];
      return maa.filter(f => !lagret.includes(f));
    });
    if (mangler.length) throw new Error('ikke bufret: ' + mangler.join(', '));
  });

  await steg('Spillet starter uten nett', async () => {
    /* Start et rike, slå av nettet, og last inn på nytt */
    await side.click('#startKnapp');
    await side.waitForSelector('#app:not(.skjult)');
    await side.click('.modal-bunn .knapp');
    await side.waitForTimeout(400);

    await kontekst.setOffline(true);
    await side.reload();
    await side.waitForSelector('#fortsettKnapp:not(.skjult)', { timeout: 10000 });
    await side.click('#fortsettKnapp');
    await side.waitForSelector('#app:not(.skjult)', { timeout: 10000 });
    const kjorer = await side.evaluate(() => !!(OW.App.s && OW.App.d && OW.App.tre_d));
    if (!kjorer) throw new Error('spillet startet ikke offline');
    await kontekst.setOffline(false);
  });

  await steg('Installasjonshjelpen finnes for begge plattformer', async () => {
    await side.evaluate(() => OW.App.installer());
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    const t = await side.textContent('#modalKropp');
    if (!/Hjem-skjerm|startskjerm/i.test(t)) throw new Error('mangler framgangsmåte');
    await side.click('[data-akt="lukk-modal"]');
  });

  await steg('Innstillingene tilbyr installasjon', async () => {
    await side.click('[data-akt="innstillinger"]');
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    const h = await side.innerHTML('#modalKropp');
    if (!/data-akt="installer"|Kjører som app/.test(h)) throw new Error('ingen installasjonsvalg');
    await side.click('[data-akt="lukk-modal"]');
  });

  await side.screenshot({ path: path.join(rot, 'skjermbilder', 'app-offline.png') });

  await nettleser.close();
  tjener.close();
  console.log(feil.length
    ? '\n❌ ' + feil.length + ' feil:\n' + feil.map(f => '  · ' + f).join('\n')
    : '\n🎉 Spillet er en fullverdig installerbar app.');
  process.exit(feil.length ? 1 : 0);
})();
