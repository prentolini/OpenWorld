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
  const nettleser = await chromium.launch({
    executablePath: finnChromium(),
    /* Testmaskinen har ikke GPU, så WebGL må kjøres i programvare */
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
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

  await steg('Karakter kan velges før start', async () => {
    const antall = await side.locator('[data-akt="velg-karakter"]').count();
    if (antall < 4) throw new Error('bare ' + antall + ' karakterer vist');
    await side.click('[data-akt="velg-karakter"][data-id="lard"]');
    const info = await side.textContent('#karakterInfo');
    if (!/Runa/.test(info)) throw new Error('karakterinfoen fulgte ikke valget');
  });

  await steg('Nytt rike kan grunnlegges', async () => {
    await side.fill('#navnFelt', 'Testborg');
    await side.click('#startKnapp');
    await side.waitForSelector('#app:not(.skjult)', { timeout: 5000 });
    await side.click('.modal-bunn .knapp');           // lukk velkomstmodalen
  });

  await steg('Karakterens egenskap virker på riket', async () => {
    const f = await side.evaluate(() => ({
      valgt: OW.App.s.karakter,
      rabatt: OW.App.d.forskrabatt,
      gave: OW.App.s.res.kunnskap
    }));
    if (f.valgt !== 'lard') throw new Error('feil karakter lagret: ' + f.valgt);
    if (f.rabatt < 0.11) throw new Error('forskningsrabatten mangler: ' + f.rabatt);
    if (f.gave < 100) throw new Error('startgaven kom ikke: ' + f.gave);
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

  const tre_d = await side.evaluate(() => !!OW.App.tre_d);
  console.log('  ℹ️  Visning: ' + (tre_d ? '3D (WebGL)' : '2D (reserveløsning)'));

  await steg('Byutsikten viser bygningen', async () => {
    if (!tre_d) { await side.waitForSelector('.skyline .hus', { timeout: 4000 }); return; }
    await side.waitForFunction(() => OW.Scene.antall > 1000, null, { timeout: 6000 });
    await side.waitForSelector('.by3d-etikett', { timeout: 4000 });
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

  await steg('3D-byen tegner geometri for hele riket', async () => {
    if (!tre_d) return;
    await side.click('#fane-by');
    await side.waitForTimeout(300);
    const f = await side.evaluate(() => ({
      terreng: OW.Scene.antall, bygg: OW.Scene.antallBygg, merker: OW.Scene.merker.length
    }));
    if (f.terreng < 3000) throw new Error('for lite terreng: ' + f.terreng + ' hjørner');
    /* husene har grunnmur, karmer, dører og tak – de skal være detaljerte */
    if (f.bygg < 8000) throw new Error('husene mangler detaljer: ' + f.bygg + ' hjørner');
    if (f.merker < 5) throw new Error('for få etiketter: ' + f.merker);
  });

  await steg('Bydel kan kjøpes og gjør byen større', async () => {
    await side.click('#fane-by');
    await side.waitForTimeout(300);
    const for_ = await side.evaluate(() => ({
      bydeler: OW.App.s.bydeler,
      radius: OW.Scene.byRadius,
      bygg: OW.Scene.antallBygg,
      poptak: OW.App.d.popTak
    }));
    await side.click('[data-akt="kjop-bydel"]');
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    await side.click('.modal-bunn .knapp.primar');
    await side.waitForTimeout(600);
    const etter = await side.evaluate(() => ({
      bydeler: OW.App.s.bydeler,
      radius: OW.Scene.byRadius,
      bygg: OW.Scene.antallBygg,
      poptak: OW.App.d.popTak
    }));
    if (etter.bydeler !== for_.bydeler + 1) throw new Error('bydelen ble ikke registrert');
    if (!tre_d) return;
    if (etter.radius <= for_.radius) throw new Error('byen ble ikke større: ' + for_.radius + ' → ' + etter.radius);
    if (etter.bygg <= for_.bygg) throw new Error('ingen nye hus i bydelen');
    if (etter.poptak <= for_.poptak) throw new Error('befolkningstaket økte ikke');
  });

  await steg('Skygger og hus tegnes uten WebGL-feil', async () => {
    if (!tre_d) return;
    await side.waitForTimeout(400);
    const kode = await side.evaluate(() => OW.Scene.gl.getError());
    if (kode !== 0) throw new Error('WebGL meldte feilkode ' + kode);
  });

  await steg('Klikk på en bygning i 3D åpner byggekortet', async () => {
    if (!tre_d) return;
    await side.evaluate(() => OW.Scene.velgBygg('radhus'));
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    const tittel = await side.textContent('#modalTittel');
    if (!/Rådhus/.test(tittel)) throw new Error('feil bygning i modalen: ' + tittel);
    await side.click('[data-akt="lukk-modal"]');
  });

  await steg('Strålen treffer riktig tomt', async () => {
    if (!tre_d) return;
    const treff = await side.evaluate(() => {
      const r = OW.Scene.lerret.getBoundingClientRect();
      /* midt i lerretet skal treffe rådhusets tomt i sentrum */
      return OW.Scene.byggPaaTomt(OW.Scene.tomtUnder(r.left + r.width / 2, r.top + r.height / 2));
    });
    if (treff !== 'radhus') throw new Error('midtpunktet traff «' + treff + '»');
  });

  await steg('3D-byen skjules i andre faner', async () => {
    if (!tre_d) return;
    await side.click('#fane-handel');
    await side.waitForTimeout(250);
    const skjult = await side.evaluate(() => document.getElementById('by3d').classList.contains('skjult') && !OW.Scene.synlig);
    if (!skjult) throw new Error('3D-byen tegner fortsatt utenfor By-fanen');
    await side.click('#fane-by');
    await side.waitForTimeout(250);
  });

  await steg('Herskeren og innbyggerne går rundt i byen', async () => {
    if (!tre_d) return;
    await side.waitForFunction(() => OW.Scene.antallFolk > 200, null, { timeout: 5000 });
    /* figurene skal faktisk flytte seg mellom to rammer */
    const a = await side.evaluate(() => { OW.Scene._tid += 3; return OW.Scene._tid; });
    const flyttet = await side.evaluate((t) => {
      const f1 = OW.By3D.byggFolk(OW.Scene.folk, t, OW.Scene.byRadius);
      const f2 = OW.By3D.byggFolk(OW.Scene.folk, t + 2, OW.Scene.byRadius);
      return f1.pos.some((v, i) => Math.abs(v - f2.pos[i]) > 0.01);
    }, a);
    if (!flyttet) throw new Error('figurene står stille');
  });

  await steg('Herskerportrettet åpner karakterkortet', async () => {
    await side.click('.by3d-hersker');
    await side.waitForSelector('#modalLag:not(.skjult)', { timeout: 3000 });
    const t = await side.textContent('#modalTittel');
    if (!/Runa/.test(t)) throw new Error('feil hersker i kortet: ' + t);
    await side.click('[data-akt="lukk-modal"]');
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
