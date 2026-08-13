/* OpenWorld – Områder, handelsruter og hendelser */
window.OW = window.OW || {};

/* ---------------------------------------------------------------- OMRÅDER */
/* tid = sekunder for ekspedisjonen. bonus = permanente effekter. */
OW.OMRADER = [
  { id: 'gronndalen', navn: 'Grønndalen', ikon: '🌄', era: 0, tid: 60,
    kost: { mat: 120, tre: 80 },
    tekst: 'Frodig dal like bak åsen. Naboene sier den er full av bier. Og honning.',
    bonus: { prodPst: { mat: 0.2 }, lykke: 2 } },

  { id: 'furuasen', navn: 'Furuåsen', ikon: '🌲', era: 0, tid: 120,
    kost: { mat: 200, gull: 40 },
    tekst: 'Tømmer så rett at snekkerne gråter av glede.',
    bonus: { prodPst: { tre: 0.3 } } },

  { id: 'jernasen', navn: 'Jernåsen', ikon: '⛰️', era: 1, tid: 300,
    kost: { mat: 500, gull: 250, tre: 300 },
    tekst: 'Rødt fjell. Rødt betyr jern. Jern betyr alt.',
    bonus: { prodPst: { jern: 0.35, stein: 0.15 } } },

  { id: 'saltkysten', navn: 'Saltkysten', ikon: '🌊', era: 1, tid: 480,
    kost: { mat: 700, gull: 500 },
    tekst: 'Salt bevarer mat, mat bevarer imperier.',
    bonus: { prodPst: { gull: 0.25 }, ruter: 1 } },

  { id: 'solvskogen', navn: 'Sølvskogen', ikon: '🌫️', era: 2, tid: 900,
    kost: { mat: 1500, gull: 1200, jern: 300 },
    tekst: 'Trærne glitrer. Ingen vet helt hvorfor. Ingen klager.',
    bonus: { prodPst: { gull: 0.3, kunnskap: 0.2 } } },

  { id: 'frostpasset', navn: 'Frostpasset', ikon: '❄️', era: 2, tid: 1400,
    kost: { mat: 2200, jern: 800, tre: 1200 },
    tekst: 'Kaldt, smalt og strategisk uvurderlig.',
    bonus: { militaerPst: 0.2, prodPst: { stein: 0.25 } } },

  { id: 'ravmyra', navn: 'Ravmyra', ikon: '🟠', era: 3, tid: 2000,
    kost: { mat: 4000, gull: 3500 },
    tekst: 'Rav er størknet tid. Handelsmenn betaler i gull for tid.',
    bonus: { handelsbonus: 0.25, prodPst: { gull: 0.35 } } },

  { id: 'orkenporten', navn: 'Ørkenporten', ikon: '🏜️', era: 3, tid: 2600,
    kost: { mat: 6000, gull: 5000, jern: 1500 },
    tekst: 'Karavaneveien til alt sør for kartet.',
    bonus: { ruter: 2, handelsbonus: 0.2 } },

  { id: 'oyriket', navn: 'Øyriket', ikon: '🏝️', era: 3, tid: 3200,
    kost: { mat: 8000, gull: 7000, tre: 5000 },
    tekst: 'Trettito øyer, trettito meninger, ett flagg.',
    bonus: { prodPst: { mat: 0.4, gull: 0.25 }, popTakPst: 0.1 } },

  { id: 'hoyfjellet', navn: 'Høyfjellet', ikon: '🏔️', era: 4, tid: 4200,
    kost: { mat: 14000, gull: 12000, jern: 6000 },
    tekst: 'Der luften er tynn og malmen er tykk.',
    bonus: { prodPst: { jern: 0.6, stein: 0.5 } } },

  { id: 'sorkontinentet', navn: 'Sørkontinentet', ikon: '🗺️', era: 4, tid: 5400,
    kost: { mat: 22000, gull: 20000, jern: 8000 },
    tekst: 'Et helt kontinent. Kartografen din har allerede sluttet.',
    bonus: { globalProd: 0.15, omradeBonus: 0.1 } },

  { id: 'stormhavet', navn: 'Stormhavet', ikon: '🌀', era: 4, tid: 6200,
    kost: { mat: 26000, gull: 24000, tre: 15000 },
    tekst: 'Tre flåter forsvant. Den fjerde kom hjem rik.',
    bonus: { ruter: 2, handelsbonus: 0.35, militaerPst: 0.15 } },

  { id: 'nordpolen', navn: 'Den hvite grensen', ikon: '🧊', era: 5, tid: 7200,
    kost: { mat: 40000, gull: 35000, jern: 20000 },
    tekst: 'Ingen bor her. Alle vil eie det.',
    bonus: { globalProd: 0.12, militaerPst: 0.25 } },

  { id: 'skyhavet', navn: 'Skyhavet', ikon: '☁️', era: 5, tid: 9000,
    kost: { mat: 60000, gull: 55000, kunnskap: 9000 },
    tekst: 'Kartet slutter. Du fortsetter.',
    bonus: { globalProd: 0.25, prodPst: { kunnskap: 0.5 } } }
];

OW.OMRADE_INDEX = {};
OW.OMRADER.forEach(function (o) { OW.OMRADE_INDEX[o.id] = o; });

/* ----------------------------------------------------------- HANDELSRUTER */
/* Send varer ut, få gull (og noen ganger annet) tilbake. */
OW.RUTER = [
  { id: 'bygda', navn: 'Nabobygda', ikon: '🐴', era: 0, tid: 45,
    inn: { mat: 60 }, ut: { gull: 55 },
    tekst: 'Kort tur. Trygg fortjeneste. Kjedelig på den gode måten.' },

  { id: 'elvebyen', navn: 'Elvebyen', ikon: '🚣', era: 1, tid: 120,
    inn: { tre: 150, mat: 100 }, ut: { gull: 210 },
    tekst: 'De trenger alltid tømmer. Alltid.' },

  { id: 'fjellmarked', navn: 'Fjellmarkedet', ikon: '🏔️', era: 1, tid: 260,
    inn: { mat: 300, gull: 100 }, ut: { jern: 190, stein: 200 },
    tekst: 'Dvergene forhandler hardt, men leverer alltid.' },

  { id: 'sorhavn', navn: 'Sørhavna', ikon: '⛵', era: 2, tid: 420,
    inn: { jern: 200, tre: 400 }, ut: { gull: 900 },
    tekst: 'Lange bølger, lengre fortjeneste.' },

  { id: 'silkeveien', navn: 'Silkeveien', ikon: '🐫', era: 3, tid: 900,
    inn: { gull: 1500, mat: 1200 }, ut: { kunnskap: 420, gull: 3200 },
    tekst: 'Varer, historier og hemmeligheter i samme sekk.' },

  { id: 'krydderoyene', navn: 'Krydderøyene', ikon: '🌶️', era: 3, tid: 1300,
    inn: { gull: 3000 }, ut: { gull: 7200, mat: 2000 },
    tekst: 'Pepper var en gang verdt sin vekt i gull. Her er det fortsatt sant.' },

  { id: 'verdensbors', navn: 'Verdensbørsen', ikon: '🏛️', era: 4, tid: 2200,
    inn: { gull: 15000, jern: 4000 }, ut: { gull: 30000, kunnskap: 2200 },
    tekst: 'Her flyttes imperier med et nikk.' },

  { id: 'stjerneruta', navn: 'Stjerneruta', ikon: '✨', era: 5, tid: 3600,
    inn: { gull: 60000, kunnskap: 5000 }, ut: { gull: 120000, jern: 18000 },
    tekst: 'Ingen vet hvor de seiler. De kommer alltid tilbake med mer.' }
];

OW.RUTE_INDEX = {};
OW.RUTER.forEach(function (r) { OW.RUTE_INDEX[r.id] = r; });

/* -------------------------------------------------------------- HENDELSER */
/* Dukker opp med jevne mellomrom. To valg, ekte konsekvenser. */
OW.HENDELSER = [
  {
    id: 'vandrende_handelsmann', era: 0, tittel: 'Den vandrende handelsmannen', ikon: '🧙',
    tekst: 'En mann med altfor mange lommer tilbyr deg «en helt ordinær kiste». Han blunker. Det blunker tilbake.',
    valg: [
      { tekst: 'Kjøp kista (200 gull)', kost: { gull: 200 }, effekt: { tilfeldig: [
        { vekt: 3, tekst: 'Kista var full av gamle mynter!', gi: { gull: 700 } },
        { vekt: 3, tekst: 'Kista inneholdt kart og notater.', gi: { kunnskap: 120 } },
        { vekt: 2, tekst: 'Kista var full av stein. Bokstavelig talt.', gi: { stein: 300 } },
        { vekt: 1, tekst: 'Kista var tom. Mannen er borte. Selvfølgelig.', gi: {} }
      ] } },
      { tekst: 'Nei takk, jeg har nok kister', effekt: { melding: 'Du sover godt om natten. Fattig, men trygg.', gi: { lykke: 2 } } }
    ]
  },
  {
    id: 'god_host', era: 0, tittel: 'Rekordhøst', ikon: '🌻',
    tekst: 'Åkrene bugner. Bøndene vil enten feire eller selge alt.',
    valg: [
      { tekst: 'Hold fest for folket', effekt: { melding: 'Tre dager med dans. Folk snakker om det i årevis.', gi: { lykkeVarig: 4 } } },
      { tekst: 'Selg overskuddet', effekt: { melding: 'Kassa fylles.', gi: { gull: 350, mat: -100 } } }
    ]
  },
  {
    id: 'brann', era: 1, tittel: 'Brann i lagerhuset', ikon: '🔥',
    tekst: 'Noen glemte en lykt. Det er alltid en lykt.',
    valg: [
      { tekst: 'Slukk med alle mann', effekt: { melding: 'Dere reddet det meste. Litt sot på alt.', gi: { tre: -150, stein: -80 } } },
      { tekst: 'La det brenne, redd naboene', effekt: { melding: 'Lageret er borte, men ingen kom til skade. Folket husker.', gi: { tre: -400, lykkeVarig: 5 } } }
    ]
  },
  {
    id: 'omreisende_larer', era: 1, tittel: 'Omreisende lærd', ikon: '🎓',
    tekst: 'En lærd tilbyr å undervise ungdommen i bytte mot kost og losji.',
    valg: [
      { tekst: 'Ta imot henne', kost: { mat: 200 }, effekt: { melding: 'Barna lærer å regne. Regnskapsføreren gråter av lykke.', gi: { kunnskap: 250 } } },
      { tekst: 'Vi har nok kloke hoder', effekt: { melding: 'Hun drar til nabobyen. De blir litt smartere enn dere.', gi: {} } }
    ]
  },
  {
    id: 'banditter', era: 1, tittel: 'Banditter på veien', ikon: '🗡️',
    tekst: 'En liten gjeng krever «veiavgift» av kjøpmennene dine.',
    valg: [
      { tekst: 'Betal dem (300 gull)', kost: { gull: 300 }, effekt: { melding: 'Problemet forsvinner. Foreløpig.', gi: {} } },
      { tekst: 'Send vaktene', krevMilitaer: 20, effekt: { melding: 'Banditter går, ryktet ditt vokser.', gi: { lykkeVarig: 3, gull: 150 } },
        feil: { melding: 'Du hadde ikke nok soldater. De tok varene i stedet.', gi: { gull: -450 } } }
    ]
  },
  {
    id: 'utvandring', era: 2, tittel: 'Frister fra nabolandet', ikon: '📯',
    tekst: 'Et naborike lokker med billig jord og lave skatter.',
    valg: [
      { tekst: 'Senk skattene et halvt år', effekt: { melding: 'Folk blir. Kassa merker det.', gi: { gull: -800, lykkeVarig: 6 } } },
      { tekst: 'La dem som vil dra, dra', effekt: { melding: 'Noen familier reiser. Resten er lojale.', gi: { popTap: 0.08 } } }
    ]
  },
  {
    id: 'oppdagelse', era: 2, tittel: 'Gammel ruin funnet', ikon: '🏺',
    tekst: 'Byggmesterne fant murer under murene. Noen bygde her lenge før deg.',
    valg: [
      { tekst: 'Grav ut alt', kost: { gull: 500 }, effekt: { tilfeldig: [
        { vekt: 4, tekst: 'Et bibliotek i stein! Kunnskapen er uvurderlig.', gi: { kunnskap: 900 } },
        { vekt: 3, tekst: 'Et skattkammer.', gi: { gull: 2400 } },
        { vekt: 2, tekst: 'En eldgammel våpensmie.', gi: { jern: 1200 } }
      ] } },
      { tekst: 'Støp over og bygg videre', effekt: { melding: 'Fortiden får hvile. Byggeplanen holder tiden.', gi: { stein: 400 } } }
    ]
  },
  {
    id: 'pest', era: 3, tittel: 'Sykdom i havnestrøket', ikon: '🤒',
    tekst: 'Et skip kom inn med mer enn last.',
    valg: [
      { tekst: 'Steng havna i to uker', effekt: { melding: 'Sykdommen stanser. Handelen også.', gi: { gull: -3000 } } },
      { tekst: 'Hold alt åpent', effekt: { melding: 'Handelen går, men folk blir syke.', gi: { popTap: 0.15, lykkeVarig: -6 } } }
    ]
  },
  {
    id: 'allianse', era: 3, tittel: 'Tilbud om allianse', ikon: '🤝',
    tekst: 'Nabokongen foreslår en pakt. Han smiler for mye, men tilbudet er godt.',
    valg: [
      { tekst: 'Signer pakten', kost: { gull: 2000 }, effekt: { melding: 'Grensene er trygge. Handelen blomstrer.', gi: { diplomatiVarig: 15, gull: 0 } } },
      { tekst: 'Vi står alene', effekt: { melding: 'Uavhengighet har sin egen verdi. Og sin egen pris.', gi: { lykkeVarig: 3, militaerVarig: 40 } } }
    ]
  },
  {
    id: 'geni', era: 4, tittel: 'Et uvanlig geni', ikon: '💡',
    tekst: 'En ung oppfinner påstår hun kan doble produksjonen. Tegningene ser... ambisiøse ut.',
    valg: [
      { tekst: 'Finansier henne (8000 gull)', kost: { gull: 8000 }, effekt: { tilfeldig: [
        { vekt: 5, tekst: 'Maskinen virker! Hele riket effektiviseres.', gi: { globalProdVarig: 0.05, kunnskap: 3000 } },
        { vekt: 3, tekst: 'Den eksploderte. Men notatene var gode.', gi: { kunnskap: 4000 } }
      ] } },
      { tekst: 'Høflig avslag', effekt: { melding: 'Hun drar til rivalen din. Det kan bli dyrt.', gi: {} } }
    ]
  },
  {
    id: 'verdensutstilling', era: 5, tittel: 'Verdensutstillingen', ikon: '🎆',
    tekst: 'Alle rikene samles. Alle ser på hverandre. Alle later som de ikke gjør det.',
    valg: [
      { tekst: 'Bygg den største paviljongen', kost: { gull: 50000, stein: 20000 },
        effekt: { melding: 'Verden måpte. Ryktet ditt er nå et faktum.', gi: { lykkeVarig: 12, rikspoeng: 5000, sesongXp: 300 } } },
      { tekst: 'Delta beskjedent', effekt: { melding: 'Solid innsats. Ingen husker den om et år.', gi: { gull: 8000, sesongXp: 60 } } }
    ]
  }
];

/* --------------------------------------------------------------- RIVALER */
/* Deterministiske AI-riker du konkurrerer mot i Riksmesterskapet. */
OW.RIVALER = [
  { navn: 'Kong Harald Steinbryter', ikon: '🪨', base: 900, vekst: 1.55, tone: 'Bygger murer for moro skyld.' },
  { navn: 'Fyrstinne Vela av Saltøy', ikon: '⚓', base: 1200, vekst: 1.48, tone: 'Eier halve havet, vil ha resten.' },
  { navn: 'Handelsherre Orin', ikon: '💰', base: 700, vekst: 1.72, tone: 'Har aldri tapt en forhandling.' },
  { navn: 'Marskalk Dreyn', ikon: '⚔️', base: 1500, vekst: 1.41, tone: 'Snakker sjelden. Marsjerer ofte.' },
  { navn: 'De Lærdes Råd', ikon: '📚', base: 500, vekst: 1.86, tone: 'Vinner sakte, men vinner.' },
  { navn: 'Dronning Ilva Nordlys', ikon: '❄️', base: 2000, vekst: 1.35, tone: 'Har regjert lenger enn du har levd.' }
];
