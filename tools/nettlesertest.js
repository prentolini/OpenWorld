/* Klikker seg gjennom spillet i en ekte nettleser og fanger opp JS-feil.
 * Kjør:  node tools/nettlesertest.js
 * Krever at Playwright er tilgjengelig i miljøet.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW_MODULE || 'playwright');

const filsti = 'file://' + path.join(__dirname, '..', 'index.html');
const skudd = path.join(__dirname, '..', 'skjermbilder');

/* Finn en Chromium som allerede finnes i miljøet (unngår nedlasting) */
function finnChromium() {
  if (process.env.CHROMIUM_STI) return process.env.CHROMIUM_STI;
  const rot = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(rot)) return undefined;
  for (const mappe of fs.readdirSync(rot)) {
    for (const kandidat of ['chrome-linux/chrome', 'chrome-linux/headless_shell',
                            'chrome-headless-shell-linux64/chrome-headless-shell']) {
      const sti = path.join(rot, mappe, kandidat);
      if (fs.existsSync(sti)) return sti;
    }
  }
  return undefined;
}

(async () => {
  const nettleser = await chromium.launch({ executablePath: finnChromium() });
  const side = await nettleser.newPage({ viewport: { width: 1280, height: 1000 } });

  const feil = [];
  side.on('pageerror', e => feil.push('JS-feil: ' + e.message));
  side.on('console', m => { if (m.type() === 'error') feil.push('Konsollfeil: ' + m.text()); });

  const steg = async (navn, fn) => {
    try { await fn(); console.log('  ✅ ' + navn); }
    catch (e) { feil.push(navn + ' → ' + e.message); console.log('  ❌ ' + navn + ': ' + e.message); }
  };

  await side.goto(filsti);
  console.log('\n🌐 Nettlesertest\n');

  await steg('Oppstartsskjermen vises', async () => {
    await side.waitForSelector('#startKnapp', { timeout: 5000 });
  });

  await steg('Nytt rike kan grunnlegges', async () => {
    await side.fill('#navnFelt', 'Testborg');
    await side.click('#startKnapp');
    await side.waitForSelector('#app:not(.skjult)', { timeout: 5000 });
    await side.click('.modal-bunn .knapp');           // lukk velkomstmodalen
  });

  await steg('Ressurslinjen fylles ut', async () => {
    const n = await side.locator('#ressurslinje .pille').count();
    if (n < 4) throw new Error('bare ' + n + ' ressurser vist');
  });

  await steg('Bygging starter og fullføres', async () => {
    await side.click('[data-akt="bygg"][data-id="tomrer"]');
    await side.waitForSelector('.ko-rad', { timeout: 3000 });
    await side.waitForFunction(() => OW.App.s.bygg.tomrer >= 1, null, { timeout: 20000 });
  });

  await steg('Byutsikten viser bygningen', async () => {
    await side.waitForSelector('.skyline .hus', { timeout: 4000 });
  });

  await steg('Alle faner kan åpnes', async () => {
    for (const f of ['verden', 'handel', 'forskning', 'oppdrag', 'rangering', 'sesong', 'butikk', 'by']) {
      await side.click('#fane-' + f);
      await side.waitForTimeout(120);
      const tomt = await side.locator('#innhold').innerHTML();
      if (tomt.trim().length < 50) throw new Error('fanen ' + f + ' er tom');
    }
  });

  /* Gi riket et forsprang så vi kan teste innhold fra senere epoker */
  await steg('Testtilstand kan settes', async () => {
    await side.evaluate(() => {
      const s = OW.App.s;
      s.era = 3;
      s.res = { tre: 5e5, stein: 5e5, mat: 5e5, jern: 5e5, gull: 5e5, kunnskap: 5e5 };
      s.krystall = 900;
      s.pop = 400;
      s.bygg = { radhus: 20, hus: 18, tomrer: 12, gard: 12, steinbrudd: 10, lager: 14, marked: 8, bibliotek: 8, havn: 4, kaserne: 5 };
      OW.App.tegn(true);
    });
  });

  await steg('Ekspedisjon kan sendes', async () => {
    await side.click('#fane-verden');
    await side.click('[data-akt="eksped"]');
    await side.waitForSelector('.fremdrift.gronn', { timeout: 3000 });
  });

  await steg('Handelsrute kan sendes', async () => {
    await side.click('#fane-handel');
    await side.click('[data-akt="rute"]');
    await side.waitForSelector('.fremdrift.bla', { timeout: 3000 });
  });

  await steg('Markedet kan handle', async () => {
    const for_ = await side.evaluate(() => OW.App.s.res.jern);
    await side.click('[data-akt="marked"][data-res="jern"][data-kjop="1"][data-antall="100"]');
    const etter = await side.evaluate(() => OW.App.s.res.jern);
    if (etter <= for_) throw new Error('jern økte ikke ved kjøp');
  });

  await steg('Forskning kan fullføres', async () => {
    await side.click('#fane-forskning');
    await side.click('[data-akt="forsk"]');
    const antall = await side.evaluate(() => Object.keys(OW.App.s.tech).length);
    if (antall < 1) throw new Error('ingen forskning registrert');
  });

  await steg('Spesialisering kan velges', async () => {
    await side.click('#fane-by');
    await side.click('[data-akt="velg-laug"][data-id="handel"]');
    await side.click('.modal-bunn .knapp.primar');
    const laug = await side.evaluate(() => OW.App.s.laug);
    if (!laug.includes('handel')) throw new Error('lauget ble ikke valgt');
  });

  await steg('Demo-kjøp fungerer', async () => {
    await side.click('#fane-butikk');
    await side.click('[data-akt="kjop"][data-id="medlemskap"]');
    await side.click('.modal-bunn .knapp.primar');
    const medlem = await side.evaluate(() => OW.App.s.premium.medlem);
    if (!medlem) throw new Error('medlemskapet ble ikke aktivert');
  });

  await steg('Hendelse kan besvares', async () => {
    await side.evaluate(() => { OW.E.trekkHendelse(OW.App.s); OW.App.steg(); });
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    await side.click('.modal-bunn .knapp');
    await side.waitForSelector('#modalLag', { state: 'hidden', timeout: 3000 });
    const svar = await side.evaluate(() => OW.App.s.stat.hendelser);
    if (svar < 1) throw new Error('hendelsen ble ikke registrert');
  });

  await steg('Hendelse som lukkes med kryss blokkerer ikke senere hendelser', async () => {
    await side.evaluate(() => { OW.E.trekkHendelse(OW.App.s); OW.App.steg(); });
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    await side.click('[data-akt="lukk-modal"]');
    const aktiv = await side.evaluate(() => OW.App.s.hendelse);
    if (aktiv) throw new Error('hendelsen ble hengende');
    await side.evaluate(() => { OW.E.trekkHendelse(OW.App.s); OW.App.steg(); });
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    await side.click('.modal-bunn .knapp');
  });

  await steg('Lagring overlever ny innlasting', async () => {
    const navn = await side.evaluate(() => { OW.lagre(OW.App.s); return OW.App.s.navn; });
    await side.reload();
    await side.waitForSelector('#fortsettKnapp:not(.skjult)', { timeout: 5000 });
    await side.click('#fortsettKnapp');
    await side.waitForSelector('#app:not(.skjult)', { timeout: 5000 });
    const etter = await side.evaluate(() => OW.App.s.navn);
    if (etter !== navn) throw new Error('feil rike lastet: ' + etter);
  });

  /* Skjermbilder til dokumentasjonen */
  await side.evaluate(() => { document.getElementById('modalLag').classList.add('skjult'); });

  fs.mkdirSync(skudd, { recursive: true });
  for (const f of ['by', 'verden', 'handel', 'oppdrag', 'rangering', 'butikk']) {
    await side.click('#fane-' + f);
    await side.waitForTimeout(450);
    await side.screenshot({ path: path.join(skudd, f + '.png'), fullPage: false });
  }
  console.log('  📸 Skjermbilder lagret i skjermbilder/');

  await nettleser.close();
  console.log(feil.length ? '\n❌ ' + feil.length + ' feil:\n' + feil.map(f => '  · ' + f).join('\n') : '\n🎉 Ingen feil.');
  process.exit(feil.length ? 1 : 0);
})();
