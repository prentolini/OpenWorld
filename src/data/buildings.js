/* OpenWorld – Bygninger
 *
 * kost      = pris for nivå 1. Pris for nivå L = kost * kostMult^(L-1)
 * tid       = byggetid i sekunder for nivå 1, skalerer med tidMult
 * gir       = effekter PER NIVÅ (produksjon er per sekund)
 * arbeidere = innbyggere som kreves per nivå for full effektivitet
 */
window.OW = window.OW || {};

OW.BYGG = [
  /* ---------------------------------------------------------------- EPOKE 0 */
  {
    id: 'radhus', navn: 'Rådhus', ikon: '🏛️', era: 0, kat: 'kjerne',
    tekst: 'Hjertet i riket. Nivået her bestemmer hvor stort du får lov til å drømme.',
    kost: { tre: 60, stein: 30 }, kostMult: 1.45, tid: 12, tidMult: 1.26,
    gir: { popTak: 6, lykke: 1, lager: 120 },
    unikt: 'Åpner nye epoker. Nivå 15 gir en ekstra byggekø.'
  },
  {
    id: 'hus', navn: 'Bondehus', ikon: '🏠', era: 0, kat: 'befolkning',
    tekst: 'Fire vegger, ett tak og plass til overraskende mange.',
    kost: { tre: 45, stein: 10 }, kostMult: 1.4, tid: 8, tidMult: 1.24,
    gir: { popTak: 9 }
  },
  {
    id: 'tomrer', navn: 'Tømmerhogst', ikon: '🪓', era: 0, kat: 'produksjon',
    tekst: 'Skogen er uendelig. Sier tømmerhoggerne. Hver gang.',
    kost: { tre: 25, stein: 15 }, kostMult: 1.4, tid: 7, tidMult: 1.24,
    gir: { prod: { tre: 0.55 } }, arbeidere: 1
  },
  {
    id: 'steinbrudd', navn: 'Steinbrudd', ikon: '⛏️', era: 0, kat: 'produksjon',
    tekst: 'Støyende, støvete og helt uunnværlig.',
    /* Koster bevisst ingen stein: du skal alltid kunne starte steinproduksjon
       på nytt med bare tømmer, uansett hvor blakk du har gjort deg. */
    kost: { tre: 55 }, kostMult: 1.4, tid: 9, tidMult: 1.24,
    gir: { prod: { stein: 0.42 } }, arbeidere: 1
  },
  {
    id: 'gard', navn: 'Kornåker', ikon: '🌾', era: 0, kat: 'produksjon',
    tekst: 'Mat inn, innbyggere ut. Verdens eldste forretningsmodell.',
    kost: { tre: 35, stein: 15 }, kostMult: 1.38, tid: 8, tidMult: 1.23,
    gir: { prod: { mat: 0.7 } }, arbeidere: 1
  },
  {
    id: 'lager', navn: 'Lagerhus', ikon: '📦', era: 0, kat: 'kjerne',
    tekst: 'Uten lager renner overskuddet rett ut i grøfta.',
    kost: { tre: 70, stein: 40 }, kostMult: 1.45, tid: 14, tidMult: 1.25,
    gir: { lager: 420 }
  },

  /* ---------------------------------------------------------------- EPOKE 1 */
  {
    id: 'marked', navn: 'Marked', ikon: '🏪', era: 1, kat: 'handel',
    tekst: 'Rykter, rabatter og altfor dyr ost.',
    kost: { tre: 200, stein: 140, mat: 80 }, kostMult: 1.44, tid: 30, tidMult: 1.25,
    gir: { prod: { gull: 0.4 }, lykke: 1 }, arbeidere: 1
  },
  {
    id: 'jerngruve', navn: 'Jerngruve', ikon: '⚒️', era: 1, kat: 'produksjon',
    tekst: 'Dypt, mørkt og fullt av framtidens rustning.',
    kost: { tre: 260, stein: 220 }, kostMult: 1.44, tid: 34, tidMult: 1.25,
    gir: { prod: { jern: 0.28 } }, arbeidere: 2
  },
  {
    id: 'smie', navn: 'Smie', ikon: '🔨', era: 1, kat: 'kjerne',
    tekst: 'Bedre verktøy = raskere bygging. Enkel matematikk, varm jobb.',
    kost: { tre: 240, stein: 200, jern: 40 }, kostMult: 1.46, tid: 45, tidMult: 1.26,
    gir: { byggfart: 0.03, militaer: 4 }, arbeidere: 1,
    unikt: 'Hvert nivå gjør all bygging 3 % raskere.'
  },
  {
    id: 'bibliotek', navn: 'Bibliotek', ikon: '📚', era: 1, kat: 'kunnskap',
    tekst: 'Der ideer får lov til å ligge og gjære.',
    kost: { tre: 300, stein: 180, gull: 60 }, kostMult: 1.45, tid: 50, tidMult: 1.25,
    gir: { prod: { kunnskap: 0.16 }, lykke: 1 }, arbeidere: 1
  },
  {
    id: 'festplass', navn: 'Festplass', ikon: '🎪', era: 1, kat: 'kultur',
    tekst: 'Fornøyde innbyggere jobber bedre og klager mindre. Mindre.',
    kost: { tre: 180, stein: 120, gull: 40 }, kostMult: 1.42, tid: 28, tidMult: 1.25,
    gir: { lykke: 4 }
  },

  /* ---------------------------------------------------------------- EPOKE 2 */
  {
    id: 'kaserne', navn: 'Kaserne', ikon: '🛡️', era: 2, kat: 'militaer',
    tekst: 'Noen må passe på alt du har bygget.',
    kost: { tre: 800, stein: 700, jern: 300 }, kostMult: 1.46, tid: 110, tidMult: 1.26,
    gir: { militaer: 14, matBruk: 0.6 }, arbeidere: 2
  },
  {
    id: 'bymur', navn: 'Bymur', ikon: '🧱', era: 2, kat: 'militaer',
    tekst: 'Den beste samtalen med en fiende er den som aldri skjer.',
    kost: { stein: 1200, jern: 200 }, kostMult: 1.45, tid: 130, tidMult: 1.26,
    gir: { militaer: 9, lykke: 1 }
  },
  {
    id: 'havn', navn: 'Havn', ikon: '⚓', era: 2, kat: 'handel',
    tekst: 'Verden er større enn horisonten. Havna beviser det.',
    kost: { tre: 1400, stein: 800, gull: 300 }, kostMult: 1.47, tid: 150, tidMult: 1.26,
    gir: { prod: { gull: 0.5 }, ruter: 1 }, arbeidere: 2,
    unikt: 'Hvert nivå gir én ekstra samtidig handelsrute.'
  },
  {
    id: 'katedral', navn: 'Katedral', ikon: '⛪', era: 2, kat: 'kultur',
    tekst: 'Tar en generasjon å bygge, gir håp i ti.',
    kost: { tre: 1000, stein: 1800, gull: 500 }, kostMult: 1.48, tid: 190, tidMult: 1.27,
    gir: { lykke: 6, prod: { kunnskap: 0.1 } }
  },

  /* ---------------------------------------------------------------- EPOKE 3 */
  {
    id: 'universitet', navn: 'Universitet', ikon: '🎓', era: 3, kat: 'kunnskap',
    tekst: 'Hvor kunnskap slutter å være hobby og blir makt.',
    kost: { tre: 4000, stein: 3200, gull: 2000, jern: 800 }, kostMult: 1.47, tid: 320, tidMult: 1.27,
    gir: { prod: { kunnskap: 0.7 }, lykke: 2 }, arbeidere: 3
  },
  {
    id: 'bank', navn: 'Bank', ikon: '🏦', era: 3, kat: 'handel',
    tekst: 'Gull som ligger stille, jobber.',
    kost: { stein: 4200, gull: 3000, jern: 900 }, kostMult: 1.48, tid: 300, tidMult: 1.27,
    gir: { prod: { gull: 1.6 }, lager: 900 }, arbeidere: 2
  },
  {
    id: 'verft', navn: 'Verft', ikon: '🛠️', era: 3, kat: 'handel',
    tekst: 'Skip bygget her finner land som ikke står på kartet ennå.',
    kost: { tre: 5200, jern: 1600, gull: 1200 }, kostMult: 1.47, tid: 340, tidMult: 1.27,
    gir: { ekspfart: 0.05, ruter: 1 }, arbeidere: 2,
    unikt: 'Hvert nivå gjør ekspedisjoner 5 % raskere.'
  },

  /* ---------------------------------------------------------------- EPOKE 4 */
  {
    id: 'ambassade', navn: 'Ambassade', ikon: '🕊️', era: 4, kat: 'kultur',
    tekst: 'Diplomati: krig, men med bedre mat.',
    kost: { stein: 12000, gull: 9000, kunnskap: 1200 }, kostMult: 1.48, tid: 620, tidMult: 1.27,
    gir: { lykke: 4, diplomati: 8, prod: { gull: 2.2 } }, arbeidere: 3
  },
  {
    id: 'koloniverk', navn: 'Koloniforvaltning', ikon: '🗂️', era: 4, kat: 'kjerne',
    tekst: 'Et imperium går på papirarbeid. Beklager.',
    kost: { tre: 14000, stein: 11000, gull: 8000 }, kostMult: 1.48, tid: 700, tidMult: 1.27,
    gir: { omradeBonus: 0.06 }, arbeidere: 3,
    unikt: 'Hvert nivå gir +6 % utbytte fra alle erobrede områder.'
  },

  /* ---------------------------------------------------------------- EPOKE 5 */
  {
    id: 'verdensfyr', navn: 'Verdensfyr', ikon: '🗼', era: 5, kat: 'kjerne',
    tekst: 'Synlig fra tre kontinenter. Det er hele poenget.',
    kost: { stein: 60000, jern: 30000, gull: 40000, kunnskap: 8000 }, kostMult: 1.5, tid: 1400, tidMult: 1.28,
    gir: { globalProd: 0.04, lykke: 3 },
    unikt: 'Hvert nivå gir +4 % på ALL produksjon.'
  },
  {
    id: 'observatorium', navn: 'Observatorium', ikon: '🔭', era: 5, kat: 'kunnskap',
    tekst: 'Stjernene har svar. De er bare trege med å gi dem.',
    kost: { stein: 45000, jern: 22000, kunnskap: 6000 }, kostMult: 1.49, tid: 1200, tidMult: 1.28,
    gir: { prod: { kunnskap: 4 }, militaer: 40 }, arbeidere: 4
  },

  /* --------------------------------------------------------------- PREMIUM */
  {
    id: 'handelslaug', navn: 'Handelslaug', ikon: '⚖️', era: 2, kat: 'premium',
    krevLaug: 'handel',
    tekst: 'Laugets segl åpner dører — og handelsruter ingen andre ser.',
    kost: { tre: 900, stein: 700, gull: 900 }, kostMult: 1.45, tid: 120, tidMult: 1.26,
    gir: { prod: { gull: 1.4 }, ruter: 1, handelsbonus: 0.08 }, arbeidere: 1,
    unikt: '+8 % gevinst på alle handelsruter per nivå.'
  },
  {
    id: 'krigsakademi', navn: 'Krigsakademi', ikon: '🏹', era: 2, kat: 'premium',
    krevLaug: 'krig',
    tekst: 'Her lærer offiserene å vinne før første pil er skutt.',
    kost: { tre: 800, stein: 900, jern: 600 }, kostMult: 1.45, tid: 120, tidMult: 1.26,
    gir: { militaer: 34, byggfart: 0.01 }, arbeidere: 1,
    unikt: 'Militær styrke teller dobbelt i konkurranser.'
  },
  {
    id: 'lardomsorden', navn: 'Lærdomsorden', ikon: '🕯️', era: 2, kat: 'premium',
    krevLaug: 'kunnskap',
    tekst: 'Stille rom, lange tanker, farlige konklusjoner.',
    kost: { stein: 800, gull: 700, kunnskap: 250 }, kostMult: 1.45, tid: 120, tidMult: 1.26,
    gir: { prod: { kunnskap: 0.55 }, forskrabatt: 0.05 }, arbeidere: 1,
    unikt: '−5 % forskningskostnad per nivå.'
  },

  /* ------------------------------------------------------------ KOSMETIKK */
  {
    id: 'gullstatue', navn: 'Gullstatue av deg selv', ikon: '🗿', era: 1, kat: 'kosmetikk',
    krevKosmetikk: 'statue', maks: 5,
    tekst: 'Beskjedenhet er også en form for pynt. Bare ikke denne.',
    kost: { gull: 500, stein: 300 }, kostMult: 1.6, tid: 60, tidMult: 1.35,
    gir: { lykke: 5 }
  },
  {
    id: 'hagelabyrint', navn: 'Hagelabyrint', ikon: '🌿', era: 2, kat: 'kosmetikk',
    krevKosmetikk: 'hage', maks: 5,
    tekst: 'To gjester er fortsatt savnet. Men så fine hekker!',
    kost: { gull: 900, tre: 600 }, kostMult: 1.6, tid: 90, tidMult: 1.35,
    gir: { lykke: 6, prod: { kunnskap: 0.05 } }
  },
  {
    id: 'drageflagg', navn: 'Drageflagg', ikon: '🐉', era: 3, kat: 'kosmetikk',
    krevKosmetikk: 'drage', maks: 5,
    tekst: 'Ingen vet om dragen er ekte. Det er nettopp poenget.',
    kost: { gull: 2500, jern: 800 }, kostMult: 1.6, tid: 120, tidMult: 1.35,
    gir: { lykke: 4, militaer: 25 }
  }
];

OW.BYGG_INDEX = {};
OW.BYGG.forEach(function (b) { OW.BYGG_INDEX[b.id] = b; });

OW.KATEGORIER = [
  { id: 'kjerne', navn: 'Kjerne', ikon: '🏛️' },
  { id: 'produksjon', navn: 'Produksjon', ikon: '⛏️' },
  { id: 'befolkning', navn: 'Befolkning', ikon: '🏠' },
  { id: 'handel', navn: 'Handel', ikon: '⚓' },
  { id: 'kunnskap', navn: 'Kunnskap', ikon: '📚' },
  { id: 'kultur', navn: 'Kultur', ikon: '🎪' },
  { id: 'militaer', navn: 'Militær', ikon: '🛡️' },
  { id: 'premium', navn: 'Laug', ikon: '⭐' },
  { id: 'kosmetikk', navn: 'Pynt', ikon: '✨' }
];
