/* OpenWorld – Bydeler
 *
 * Kjernen av byen vokser av seg selv når du låser opp nye bygningstyper.
 * Bydelene er det du selv velger å bygge: hver av dem skyver bymuren ett
 * kvartal utover, gir riket en varig fordel, og fylles med borgerhus etter
 * hvert som folketallet vokser. Ser du mange hus i ytterkanten, har du mange
 * innbyggere – bydelen er befolkningen din gjort synlig.
 */
window.OW = window.OW || {};

OW.BYDELER = [
  {
    id: 'handverk', navn: 'Håndverkerkvarteret', ikon: '🔨', era: 1,
    tekst: 'Snekkere, steinhoggere og en konstant lukt av sagflis. Byens første utvidelse.',
    kost: { tre: 2200, stein: 1800, gull: 600 },
    bonus: { prodPst: { tre: 0.10, stein: 0.10 }, popTakPst: 0.10, lager: 1400, lykke: 2 }
  },
  {
    id: 'havnekvarter', navn: 'Havnekvarteret', ikon: '⚓', era: 2,
    tekst: 'Tauverk, tjære og folk fra steder du ikke kan uttale. Her kommer verden inn.',
    kost: { tre: 6000, stein: 4500, gull: 3000 },
    bonus: { prodPst: { gull: 0.12 }, ruter: 1, popTakPst: 0.12, lager: 3200, lykke: 2 }
  },
  {
    id: 'lardomskvarter', navn: 'Lærdomskvarteret', ikon: '📚', era: 2,
    tekst: 'Smale gater, lange samtaler og lys i vinduene til langt på natt.',
    kost: { stein: 12000, gull: 9000, kunnskap: 900 },
    bonus: { prodPst: { kunnskap: 0.18 }, forskrabatt: 0.05, popTakPst: 0.12, lager: 5000, lykke: 3 }
  },
  {
    id: 'storgaten', navn: 'Storgaten', ikon: '🏪', era: 3,
    tekst: 'Byens brede hovedgate. Her går man for å bli sett, og for å kjøpe altfor dyre ting.',
    kost: { stein: 30000, gull: 26000, jern: 8000 },
    bonus: { prodPst: { gull: 0.20 }, handelsbonus: 0.10, popTakPst: 0.14, lager: 12000, lykke: 5 }
  },
  {
    id: 'murbyen', navn: 'Murbyen', ikon: '🧱', era: 3,
    tekst: 'Tette kvartaler i stein og tegl. Brannen i fjor lærte byen en lekse.',
    kost: { stein: 70000, jern: 25000, gull: 55000 },
    bonus: { popTakPst: 0.18, militaerPst: 0.10, lager: 30000, lykke: 3 }
  },
  {
    id: 'forstedene', navn: 'Forstedene', ikon: '🏘️', era: 4,
    tekst: 'Byen har for lengst vokst ut av muren sin. Nå vokser den ut av den nye også.',
    kost: { tre: 150000, stein: 160000, gull: 140000 },
    bonus: { popTakPst: 0.22, globalProd: 0.06, lager: 80000, lykke: 4 }
  },
  {
    id: 'ytterbyen', navn: 'Ytterbyen', ikon: '🌆', era: 4,
    tekst: 'Fra rådhustårnet ser du ikke lenger hvor byen slutter.',
    kost: { tre: 400000, stein: 420000, gull: 380000, jern: 120000 },
    bonus: { popTakPst: 0.25, globalProd: 0.08, lager: 220000, lykke: 4 }
  },
  {
    id: 'storbyen', navn: 'Storbyen', ikon: '🌇', era: 5,
    tekst: 'Ikke lenger en by med et rike rundt seg. Et rike som er blitt en by.',
    kost: { tre: 1200000, stein: 1300000, gull: 1100000, jern: 400000 },
    bonus: { popTakPst: 0.30, globalProd: 0.12, lager: 700000, lykke: 6 }
  }
];

OW.BYDEL_INDEX = {};
OW.BYDELER.forEach(function (b) { OW.BYDEL_INDEX[b.id] = b; });
