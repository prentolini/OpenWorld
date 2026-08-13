/* Simuleringstest for OpenWorld-motoren.
 * Kjør:  node tools/simulering.js [antall_dager] [sekunder_per_steg]
 *
 * Laster spillfilene uten nettleser og spiller riket automatisk med en enkel
 * "bot" for å sjekke at balansen og progresjonen faktisk henger sammen.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rot = path.join(__dirname, '..');
const filer = [
  'src/core/format.js',
  'src/data/eras.js',
  'src/data/buildings.js',
  'src/data/tech.js',
  'src/data/world.js',
  'src/data/progress.js',
  'src/data/shop.js',
  'src/core/state.js',
  'src/core/engine.js',
  'src/core/payments.js'
];

/* Falsk nettleser: klokke vi styrer selv */
let naa = Date.UTC(2026, 0, 1, 12, 0, 0);
const lager = {};
const sandkasse = {
  console,
  localStorage: {
    getItem: k => (k in lager ? lager[k] : null),
    setItem: (k, v) => { lager[k] = String(v); },
    removeItem: k => { delete lager[k]; }
  },
  Date: class extends Date {
    constructor(...a) { if (!a.length) super(naa); else super(...a); }
    static now() { return naa; }
  },
  Math, JSON, btoa: s => Buffer.from(s, 'binary').toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString('binary'),
  escape, unescape, encodeURIComponent, decodeURIComponent, isNaN, parseInt, parseFloat, Infinity, NaN
};
sandkasse.window = sandkasse;
vm.createContext(sandkasse);

for (const f of filer) {
  try {
    vm.runInContext(fs.readFileSync(path.join(rot, f), 'utf8'), sandkasse, { filename: f });
  } catch (e) {
    console.error('❌ Feil i ' + f + ': ' + e.message);
    process.exit(1);
  }
}
console.log('✅ Alle ' + filer.length + ' filer lastet uten syntaksfeil.\n');

const OW = sandkasse.OW;
OW.E.varsel = () => {};

/* ------------------------------------------------------------------ BOT */

const s = OW.nyTilstand('Testrike');
const DAGER = Number(process.argv[2] || 14);
/* Sekunder per tikk. Større steg = raskere kjøring, litt grovere oppløsning.
   Lange kjøringer (30 dager+) går fint med 15–30. */
const STEG = Number(process.argv[3] || (DAGER > 20 ? 20 : 5));
const TOTALT = DAGER * 86400;

/* Prioritert byggeliste – boten bygger det billigste av det den vil ha */
const onsket = [
  'tomrer', 'gard', 'hus', 'steinbrudd', 'lager', 'radhus',
  'marked', 'bibliotek', 'jerngruve', 'smie', 'festplass',
  'kaserne', 'havn', 'bymur', 'katedral',
  'universitet', 'bank', 'verft', 'ambassade', 'koloniverk',
  'verdensfyr', 'observatorium'
];

const merker = [];
let sisteEra = 0, sisteOppdrag = 0;

for (let t = 0; t < TOTALT; t += STEG) {
  naa += STEG * 1000;
  const d = OW.E.tikk(s, STEG, true);

  /* Fyll byggekøen slik en spiller ville gjort:
     1) lager når noe renner over, 2) hus når arbeidskraften svikter,
     3) spar til rådhuset når det blokkerer neste epoke, 4) ellers billigst. */
  const raad = id => OW.E.byggLast(s, id).ok && OW.E.harRaad(s, OW.E.byggKost(s, id, OW.E.nesteNiva(s, id)));
  while (s.ko.length < OW.E.koPlasser(s)) {
    const kravNa = OW.E.eraKrav(s, d);
    const overflod = OW.RESSURSER.some(r => r.id !== 'kunnskap' && s.res[r.id] >= d.lagerTak[r.id] * 0.95);
    let valgt = null;

    if (overflod && raad('lager')) valgt = 'lager';
    else if (d.eff < 0.9 && raad('hus')) valgt = 'hus';
    /* Blokkerer rådhuset neste epoke? Da sparer vi: bygg det når vi har råd, og
       ellers bare ting som koster en liten del av lageret, så vi nærmer oss. */
    const sparer = kravNa && kravNa.epoke.krav.radhus &&
                   OW.E.niva(s, 'radhus') < kravNa.epoke.krav.radhus;
    if (!valgt && sparer && raad('radhus')) valgt = 'radhus';

    if (!valgt) {
      let billigst = Infinity;
      for (const id of onsket) {
        if (id === 'radhus' || !raad(id)) continue;
        if (d.eff < 0.85 && OW.BYGG_INDEX[id].arbeidere && id !== 'hus') continue;
        const kost = OW.E.byggKost(s, id, OW.E.nesteNiva(s, id));
        /* Når vi sparer til rådhuset, ikke tøm lageret på småting */
        if (sparer && OW.RESSURSER.some(r => (kost[r.id] || 0) > s.res[r.id] * 0.35)) continue;
        const sum = Object.values(kost).reduce((a, b) => a + b, 0);
        if (sum < billigst) { billigst = sum; valgt = id; }
      }
    }
    if (!valgt) break;
    if (!OW.E.startBygg(s, d, valgt).ok) break;
  }

  /* Forsk på det billigste tilgjengelige */
  for (const tech of OW.TECH) {
    if (!OW.E.techLast(s, tech.id).ok) continue;
    if (s.res.kunnskap >= OW.E.techKost(s, d, tech.id)) OW.E.forsk(s, d, tech.id);
  }

  /* Send ekspedisjoner og karavaner */
  for (const o of OW.OMRADER) {
    if (s.ekspedisjoner.length >= OW.E.ekspPlasser(s)) break;
    if (OW.E.omradeLast(s, o.id).ok && OW.E.harRaad(s, o.kost)) OW.E.startEkspedisjon(s, d, o.id);
  }
  for (let i = OW.RUTER.length - 1; i >= 0; i--) {
    const r = OW.RUTER[i];
    if (s.karavaner.length >= d.ruterMaks) break;
    if (r.era <= s.era && OW.E.harRaad(s, r.inn)) OW.E.startKaravane(s, d, r.id);
  }

  /* Hendelser: velg alltid første alternativ */
  if (s.hendelse) OW.E.velgHendelse(s, d, 0);
  else if (naa >= s.nesteHendelse) OW.E.trekkHendelse(s);

  /* Oppdrag og epoker */
  if (OW.E.oppdragKlart(s, d)) OW.E.hentOppdrag(s, d);
  if (s.era === 2 && !s.gratisLaugBrukt) OW.E.velgGratisLaug(s, 'handel');
  const ek = OW.E.eraKrav(s, d);
  if (ek && ek.ok) OW.E.avanserEra(s, d);
  for (let n = 1; n <= OW.E.sesongNiva(s); n++) OW.E.hentSesong(s, n, false);

  if (s.era > sisteEra) {
    sisteEra = s.era;
    merker.push(`  ${OW.EPOKER[s.era].ikon} ${OW.EPOKER[s.era].navn.padEnd(12)} på dag ${(t / 86400).toFixed(1)}`);
  }
  if (s.oppdrag.indeks > sisteOppdrag) {
    sisteOppdrag = s.oppdrag.indeks;
  }
}

const d = OW.E.beregn(s);
const dag = n => (n / 86400).toFixed(1);

console.log(`📅 Simulerte ${DAGER} dager med en enkel bot (${STEG}s per steg)\n`);
console.log('Epoker nådd:');
console.log(merker.length ? merker.join('\n') : '  (ingen)');
console.log(`
📊 Sluttilstand
  Epoke ................ ${OW.EPOKER[s.era].navn}
  Innbyggere ........... ${Math.floor(s.pop)} / ${d.popTak}
  Tilfredshet .......... ${Math.round(d.lykke)}
  Arbeidskraft ......... ${(d.eff * 100).toFixed(0)} %
  Bygningsnivåer ....... ${d.byggNivaTotalt} fordelt på ${d.byggTyper} typer
  Høyeste nivå ......... ${d.hoyesteNiva}
  Forskning ............ ${d.techAntall} / ${OW.TECH.length}
  Områder .............. ${d.omraderEid} / ${OW.OMRADER.length}
  Militær .............. ${Math.round(d.militaer)}
  Handelsruter ......... ${s.stat.handler} fullført
  Oppdrag .............. ${s.oppdrag.indeks} / ${OW.OPPDRAG.length}
  Bragder .............. ${s.bragder.length} / ${OW.BRAGDER.length}
  Sesongnivå ........... ${OW.E.sesongNiva(s)} / ${OW.SESONG.nivaer}
  Krystaller ........... ${s.krystall}
  Rikspoeng ............ ${OW.F.hel(d.rikspoeng)}  (plass #${d.rangering} av ${d.tavle.length})
  Byggeprosjekter ...... ${s.stat.bygget}

🏆 Tavle`);
d.tavle.forEach((r, i) => {
  console.log(`  ${String(i + 1).padStart(2)}. ${r.spiller ? '▶ ' : '  '}${r.navn.padEnd(28)} ${OW.F.hel(r.poeng).padStart(12)}`);
});

console.log('\n💰 Ressurser');
for (const r of OW.RESSURSER) {
  const tak = d.lagerTak[r.id] === Infinity ? '∞' : OW.F.hel(d.lagerTak[r.id]);
  console.log(`  ${r.ikon} ${r.navn.padEnd(10)} ${OW.F.hel(s.res[r.id]).padStart(12)} / ${tak.padStart(10)}   ${d.prod[r.id] >= 0 ? '+' : ''}${d.prod[r.id].toFixed(2)}/s`);
}

/* --------------------------------------------------------------- SJEKKER */
console.log('\n🔍 Kontroller');
const feil = [];
const sjekk = (ok, tekst) => { console.log(`  ${ok ? '✅' : '❌'} ${tekst}`); if (!ok) feil.push(tekst); };

sjekk(s.era >= 1, 'Boten kom seg forbi landsbystadiet');
sjekk(s.oppdrag.indeks >= 4, 'Minst 4 oppdrag fullført');
sjekk(d.omraderEid >= 2, 'Minst 2 områder erobret');
sjekk(d.techAntall >= 4, 'Minst 4 forskninger fullført');
sjekk(Object.values(s.res).every(v => v >= 0 && isFinite(v)), 'Ingen negative eller uendelige ressurser');
sjekk(isFinite(d.rikspoeng) && d.rikspoeng > 0, 'Rikspoeng er et gyldig tall');
sjekk(s.pop > 0 && isFinite(s.pop), 'Befolkningen er gyldig');
sjekk(d.lykke >= 0 && d.lykke <= 100, 'Tilfredshet innenfor 0–100');
sjekk(s.ko.length <= OW.E.koPlasser(s), 'Byggekøen holder seg innenfor antall plasser');
sjekk(s.karavaner.length <= d.ruterMaks, 'Antall karavaner innenfor grensen');

/* Lagring tur-retur */
try {
  const kode = OW.eksporter(s);
  const inn = OW.importer(kode);
  sjekk(inn.navn === s.navn && Math.abs(inn.res.gull - s.res.gull) < 1, 'Eksport/import beholder riket');
} catch (e) {
  sjekk(false, 'Eksport/import feilet: ' + e.message);
}

/* Offline-beregning */
naa += 3 * 3600 * 1000;
const rap = OW.E.offline(s);
sjekk(rap && rap.sekunder > 3000, 'Offline-beregning ga uttelling (' + OW.F.tid(rap.sekunder) + ')');

/* Butikk: daglig grense på ressurspakken */
const d2 = OW.E.beregn(s);
const k1 = OW.Betaling.fullfor(s, d2, 'ressurspakke');
const k2 = OW.Betaling.kanKjope(s, 'ressurspakke');
sjekk(k1.ok && !k2.ok, 'Ressurspakken har fungerende døgngrense');

/* Alle referanser i data peker på noe som finnes */
let refFeil = 0;
OW.TECH.forEach(t => t.krev.forEach(k => { if (!OW.TECH_INDEX[k]) { refFeil++; console.log('    mangler tech: ' + k); } }));
OW.OPPDRAG.forEach(o => o.mal.forEach(m => { if (m.type === 'bygg' && !OW.BYGG_INDEX[m.id]) { refFeil++; console.log('    mangler bygg: ' + m.id); } }));
OW.LAUG.forEach(l => { if (!OW.BYGG_INDEX[l.bygg]) { refFeil++; console.log('    mangler laugbygg: ' + l.bygg); } });
OW.BUTIKK.forEach(v => { if (v.laug && !OW.LAUG_INDEX[v.laug]) { refFeil++; console.log('    mangler laug: ' + v.laug); } });
sjekk(refFeil === 0, 'Alle datareferanser er gyldige');

console.log(feil.length ? `\n❌ ${feil.length} kontroll(er) feilet.` : '\n🎉 Alle kontroller bestått.');
process.exit(feil.length ? 1 : 0);
