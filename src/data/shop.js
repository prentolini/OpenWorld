/* OpenWorld – Butikk
 *
 * VIKTIG: Dette er en DEMO. Ingen ekte betaling skjer noe sted i denne koden.
 * Alle "kjøp" er simulerte og lagres kun lokalt i nettleseren.
 * Se src/core/payments.js for hvor en ekte betalingsløsning ville koblet seg på.
 *
 * Designprinsipp: vi selger VALG, KOMFORT og SPESIALISERING – ikke seier.
 * Ressurskjøp er bevisst begrenset (daglig grense + skalert etter fremgang)
 * slik at økonomien ikke rives i stykker.
 */
window.OW = window.OW || {};

OW.BUTIKK = [
  {
    id: 'medlemskap', type: 'abonnement', navn: 'Rikskansler-medlemskap', ikon: '👑',
    pris: 89, prisTekst: '89 kr/mnd',
    tekst: 'Komfort og pusterom — ikke snarveier forbi spillet.',
    punkter: [
      '+1 byggekø (bygg to ting samtidig)',
      '+10 % på all produksjon',
      'Offline-inntekt i 24 t (mot 8 t gratis)',
      'Halv pris på hastverk med krystaller',
      '3 gratis krystaller hver dag',
      'Egen kanslerramme rundt byen din'
    ]
  },
  {
    id: 'sesongpass', type: 'sesong', navn: 'Sesongpass: Gryende Riker', ikon: '🌅',
    pris: 99, prisTekst: '99 kr / sesong',
    tekst: 'Låser opp premium-sporet i sesongen. Alle 25 nivåene kan spilles gratis — passet gir de ekstra belønningene.',
    punkter: ['Premium-belønning på alle 25 nivåer', 'Drageflagg-kosmetikk på nivå 25', 'Beholdes for alltid etter sesongslutt']
  },
  {
    id: 'laug_handel', type: 'laug', laug: 'handel', navn: 'Handelslauget', ikon: '⚖️',
    pris: 149, prisTekst: '149 kr',
    tekst: 'Du har allerede valgt én vei gratis. Dette åpner handelsveien i tillegg — nye ruter, nye mekanikker, ny bygning.',
    punkter: ['Bygningen Handelslaug', '+25 % gevinst på alle handelsruter', '+1 samtidig rute', '+20 % gullproduksjon']
  },
  {
    id: 'laug_krig', type: 'laug', laug: 'krig', navn: 'Krigsordenen', ikon: '🏹',
    pris: 149, prisTekst: '149 kr',
    tekst: 'Åpner krigsveien i tillegg til den du valgte gratis.',
    punkter: ['Bygningen Krigsakademi', '+35 % militær styrke', '+8 % byggefart', 'Militær teller dobbelt i konkurranser']
  },
  {
    id: 'laug_kunnskap', type: 'laug', laug: 'kunnskap', navn: 'Lærdomsordenen', ikon: '🕯️',
    pris: 149, prisTekst: '149 kr',
    tekst: 'Åpner kunnskapsveien i tillegg til den du valgte gratis.',
    punkter: ['Bygningen Lærdomsorden', '+40 % kunnskap', '−15 % forskningskostnad']
  },
  {
    id: 'byggeko', type: 'permanent', navn: 'Ekstra byggekø', ikon: '🔨',
    pris: 129, prisTekst: '129 kr',
    tekst: 'En permanent ekstra byggeplass. Kan kjøpes én gang.',
    punkter: ['+1 byggekø for alltid', 'Stables med medlemskapets kø']
  },
  {
    id: 'kos_statue', type: 'kosmetikk', kosmetikk: 'statue', navn: 'Gullstatue-pakke', ikon: '🗿',
    pris: 49, prisTekst: '49 kr',
    tekst: 'Rent pynt. Og litt tilfredshet, fordi folk liker skinnende ting.',
    punkter: ['Låser opp bygningen Gullstatue (5 nivåer)', '+5 tilfredshet per nivå']
  },
  {
    id: 'kos_hage', type: 'kosmetikk', kosmetikk: 'hage', navn: 'Hagelabyrint-pakke', ikon: '🌿',
    pris: 59, prisTekst: '59 kr',
    tekst: 'Grønt, rolig og litt farlig.',
    punkter: ['Låser opp Hagelabyrint (5 nivåer)', '+6 tilfredshet per nivå']
  },
  {
    id: 'kos_drage', type: 'kosmetikk', kosmetikk: 'drage', navn: 'Drageflagg-pakke', ikon: '🐉',
    pris: 79, prisTekst: '79 kr',
    tekst: 'Ingen har sett dragen. Alle tror på den.',
    punkter: ['Låser opp Drageflagg (5 nivåer)', '+4 tilfredshet og +25 militær per nivå']
  },
  {
    id: 'krystall_liten', type: 'krystall', antall: 120, navn: '120 krystaller', ikon: '💎',
    pris: 49, prisTekst: '49 kr',
    tekst: 'Krystaller brukes til hastverk, ekstra ekspedisjoner og små valg.',
    punkter: ['Kan også tjenes gratis via oppdrag, bragder og sesong']
  },
  {
    id: 'krystall_stor', type: 'krystall', antall: 700, navn: '700 krystaller', ikon: '💎',
    pris: 249, prisTekst: '249 kr',
    tekst: 'Storpakke med bonus.',
    punkter: ['Beste verdi per krystall']
  },
  {
    id: 'ressurspakke', type: 'ressurs', navn: 'Forsyningskonvoi', ikon: '🚚',
    pris: 39, prisTekst: '39 kr',
    tekst: 'Bevisst begrenset: maks én i døgnet, og mengden følger rikets størrelse — aldri nok til å hoppe over spillet.',
    punkter: ['Tilsvarer ca. 30 minutters produksjon', 'Maks 1 kjøp per døgn', 'Skalerer med epoken din'],
    daglig: 1
  }
];

OW.BUTIKK_INDEX = {};
OW.BUTIKK.forEach(function (v) { OW.BUTIKK_INDEX[v.id] = v; });

/* Ting man kjøper med krystaller (kan tjenes gratis i spillet) */
OW.KRYSTALL_PRISER = {
  hastverkPerMinutt: 2,     // krystaller per gjenstående minutt (halv pris med medlemskap)
  hastverkMin: 2,
  ekstraKoTime: 60,         // ekstra byggekø i 1 time
  omstartHendelse: 15       // trekk ny hendelse
};
