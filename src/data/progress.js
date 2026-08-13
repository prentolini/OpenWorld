/* OpenWorld – Oppdrag, historie, spesialisering, sesong og bragder */
window.OW = window.OW || {};

/* --------------------------------------------------------- SPESIALISERING */
/* Gratis: velg ÉN vei ved epoke 2. Premium: lås opp de andre laugene. */
OW.LAUG = [
  {
    id: 'handel', navn: 'Handelslauget', ikon: '⚖️', farge: '#f2c14e',
    tekst: 'Gull er bare et annet ord for muligheter.',
    bonus: { handelsbonus: 0.25, prodPst: { gull: 0.2 }, ruter: 1 },
    bygg: 'handelslaug'
  },
  {
    id: 'krig', navn: 'Krigsordenen', ikon: '🏹', farge: '#e0554b',
    tekst: 'Fred er noe man forhandler fram fra styrke.',
    bonus: { militaerPst: 0.35, byggfart: 0.08 },
    bygg: 'krigsakademi'
  },
  {
    id: 'kunnskap', navn: 'Lærdomsordenen', ikon: '🕯️', farge: '#7fd1c8',
    tekst: 'Den som vet mest, trenger sjelden å slåss.',
    bonus: { prodPst: { kunnskap: 0.4 }, forskrabatt: 0.15 },
    bygg: 'lardomsorden'
  }
];
OW.LAUG_INDEX = {};
OW.LAUG.forEach(function (l) { OW.LAUG_INDEX[l.id] = l; });

/* ------------------------------------------------------------- OPPDRAG */
/* Sekvensiell hovedhistorie. Måltyper:
 *  bygg(id,niva) | ressurs(res,antall) | epoke(n) | omrader(n) | tech(n)
 *  militaer(n)   | handler(n)          | pop(n)   | laug(1)    | hendelser(n)
 */
OW.OPPDRAG = [
  { id: 'k1', kap: 'Kapittel 1 – De første spadetakene',
    tittel: 'Tak over hodet', ikon: '🏠',
    tekst: 'Tolv mennesker, ett bål og en frisk vind. Bygg noe å komme hjem til.',
    mal: [{ type: 'bygg', id: 'hus', n: 2 }, { type: 'bygg', id: 'tomrer', n: 2 }],
    belonning: { tre: 80, mat: 60, sesongXp: 20 } },

  { id: 'k2', kap: 'Kapittel 1 – De første spadetakene',
    tittel: 'Mat i magen', ikon: '🌾',
    tekst: 'Optimisme metter ingen. Åkeren gjør det.',
    mal: [{ type: 'bygg', id: 'gard', n: 3 }, { type: 'pop', n: 25 }],
    belonning: { mat: 200, gull: 50, krystall: 5, sesongXp: 25 } },

  { id: 'k3', kap: 'Kapittel 1 – De første spadetakene',
    tittel: 'Et sted å lagre', ikon: '📦',
    tekst: 'Regnet tok halve kornlageret i fjor. Ikke i år.',
    mal: [{ type: 'bygg', id: 'lager', n: 2 }, { type: 'bygg', id: 'steinbrudd', n: 3 }],
    belonning: { stein: 250, tre: 250, sesongXp: 25 } },

  { id: 'k4', kap: 'Kapittel 1 – De første spadetakene',
    tittel: 'Rådhuset reiser seg', ikon: '🏛️',
    tekst: 'Folk vil ha noen å klage til. Gi dem en adresse.',
    mal: [{ type: 'bygg', id: 'radhus', n: 5 }],
    belonning: { gull: 300, krystall: 10, sesongXp: 40 },
    historie: 'Da rådhusklokka ringte første gang, kom det folk fra tre daler for å høre. Landsbyen var ikke lenger bare en landsby.' },

  { id: 'k5', kap: 'Kapittel 2 – Byen våkner',
    tittel: 'Første marked', ikon: '🏪',
    tekst: 'Der to mennesker møtes, oppstår en pris.',
    mal: [{ type: 'bygg', id: 'marked', n: 2 }, { type: 'ressurs', res: 'gull', n: 400 }],
    belonning: { gull: 400, sesongXp: 30 } },

  { id: 'k6', kap: 'Kapittel 2 – Byen våkner',
    tittel: 'Karavanen ruller', ikon: '🐴',
    tekst: 'Send varene ut i verden og se hva verden sender tilbake.',
    mal: [{ type: 'handler', n: 3 }],
    belonning: { gull: 600, krystall: 10, sesongXp: 35 } },

  { id: 'k7', kap: 'Kapittel 2 – Byen våkner',
    tittel: 'De første tankene', ikon: '📚',
    tekst: 'Kunnskap er den eneste ressursen som vokser når du deler den.',
    mal: [{ type: 'bygg', id: 'bibliotek', n: 2 }, { type: 'tech', n: 3 }],
    belonning: { kunnskap: 200, sesongXp: 40 } },

  { id: 'k8', kap: 'Kapittel 3 – Ut i det ukjente',
    tittel: 'Bak åsen', ikon: '🌄',
    tekst: 'Kartograf Bo påstår det finnes en dal der. Bo har tatt feil før. Men bare én gang.',
    mal: [{ type: 'omrader', n: 1 }],
    belonning: { mat: 500, gull: 400, krystall: 15, sesongXp: 50 },
    historie: 'Ekspedisjonen kom tilbake med honning, tømmer og en historie om en dal der solen står lenger. Kartet ditt fikk sin første nye strek.' },

  { id: 'k9', kap: 'Kapittel 3 – Ut i det ukjente',
    tittel: 'To flagg til', ikon: '🚩',
    tekst: 'Én dal er flaks. Tre er en plan.',
    mal: [{ type: 'omrader', n: 3 }, { type: 'epoke', n: 2 }],
    belonning: { gull: 1500, krystall: 20, sesongXp: 60 } },

  { id: 'k10', kap: 'Kapittel 4 – Krone og sverd',
    tittel: 'Noen må vokte det', ikon: '🛡️',
    tekst: 'Rikdom uten vakthold er bare en invitasjon.',
    mal: [{ type: 'bygg', id: 'kaserne', n: 3 }, { type: 'militaer', n: 80 }],
    belonning: { jern: 600, gull: 1200, sesongXp: 60 } },

  { id: 'k11', kap: 'Kapittel 4 – Krone og sverd',
    tittel: 'Velg din vei', ikon: '🧭',
    tekst: 'Et rike kan ikke være best i alt. Hva skal ditt være kjent for?',
    mal: [{ type: 'laug', n: 1 }],
    belonning: { krystall: 25, kunnskap: 400, sesongXp: 80 },
    historie: 'Rådet satt i tre netter. Da de kom ut, hadde riket en retning — og en identitet ingen kunne ta fra det.' },

  { id: 'k12', kap: 'Kapittel 4 – Krone og sverd',
    tittel: 'Havna åpner', ikon: '⚓',
    tekst: 'Havet er en motorvei for den som tør.',
    mal: [{ type: 'bygg', id: 'havn', n: 3 }, { type: 'handler', n: 12 }],
    belonning: { gull: 4000, sesongXp: 70 } },

  { id: 'k13', kap: 'Kapittel 5 – Imperiets fødsel',
    tittel: 'Fem flagg', ikon: '🗺️',
    tekst: 'Grensene dine trenger et større kart.',
    mal: [{ type: 'omrader', n: 5 }, { type: 'tech', n: 9 }],
    belonning: { gull: 6000, krystall: 30, sesongXp: 90 } },

  { id: 'k14', kap: 'Kapittel 5 – Imperiets fødsel',
    tittel: 'Kronen løftes', ikon: '🏛️',
    tekst: 'Fra kongerike til imperium er ett skritt — og tusen beslutninger.',
    mal: [{ type: 'epoke', n: 3 }],
    belonning: { gull: 10000, krystall: 40, sesongXp: 120 },
    historie: 'Sendebud fra fire riker kom for å se kroningen. To av dem kom for å måle styrken din. Alle fire dro hjem imponerte.' },

  { id: 'k15', kap: 'Kapittel 6 – Diplomati og makt',
    tittel: 'Stemmen ved bordet', ikon: '🕊️',
    tekst: 'Nå må du snakke med verden — før verden snakker om deg.',
    mal: [{ type: 'bygg', id: 'ambassade', n: 2 }, { type: 'hendelser', n: 8 }],
    belonning: { gull: 25000, krystall: 40, sesongXp: 140 } },

  { id: 'k16', kap: 'Kapittel 6 – Diplomati og makt',
    tittel: 'Toppen av rangeringen', ikon: '🏆',
    tekst: 'Rivalene har sovet dårlig i månedsvis. Gi dem grunn til det.',
    mal: [{ type: 'rangering', n: 1 }],
    belonning: { gull: 40000, krystall: 60, sesongXp: 200 },
    historie: 'De andre rikene sluttet å kalle deg nabo. De begynte å kalle deg en makt.' },

  { id: 'k17', kap: 'Kapittel 7 – Kontinentet',
    tittel: 'Ni flagg og et kontinent', ikon: '🌍',
    tekst: 'Fjell, ørken og tre tidssoner. Ta det.',
    mal: [{ type: 'omrader', n: 9 }, { type: 'epoke', n: 4 }],
    belonning: { gull: 90000, krystall: 80, sesongXp: 250 } },

  { id: 'k18', kap: 'Kapittel 8 – Verdensmakt',
    tittel: 'Fyret som ses fra alle hav', ikon: '🗼',
    tekst: 'Bygg det siste beviset på at du var her.',
    mal: [{ type: 'epoke', n: 5 }, { type: 'bygg', id: 'verdensfyr', n: 3 }],
    belonning: { gull: 400000, krystall: 200, sesongXp: 500 },
    historie: 'Da fyret ble tent, kunne sjøfolk i tre hav se lyset ditt. Historien hadde fått en ny hovedperson — og et nytt kart lå allerede på bordet.' }
];

/* ---------------------------------------------------------------- SESONG */
OW.SESONG = {
  navn: 'Sesong 1: Gryende Riker',
  ikon: '🌅',
  tekst: 'Første sesong. Nye sesonger tar med seg nye kart, teknologier og belønninger.',
  /* Hvert nivå koster mer enn det forrige, slik at sesongen varer i uker – ikke dager. */
  xpBase: 120,
  xpStigning: 55,
  nivaer: 25
};

/* Belønning per sesongnivå. gratis = alle, premium = krever sesongpass. */
OW.SESONG_BELONNING = (function () {
  var liste = [];
  for (var i = 1; i <= OW.SESONG.nivaer; i++) {
    var skala = Math.pow(1.55, i - 1);
    var gratis, premium;
    if (i % 5 === 0) {
      gratis = { krystall: 10 + i, tekst: '💎 ' + (10 + i) + ' krystaller' };
      premium = { krystall: 30 + i * 2, gull: Math.round(500 * skala), tekst: '💎 ' + (30 + i * 2) + ' + gull' };
    } else if (i % 3 === 0) {
      gratis = { kunnskap: Math.round(60 * skala), tekst: '📜 kunnskap' };
      premium = { kunnskap: Math.round(200 * skala), krystall: 12, tekst: '📜 kunnskap + 💎12' };
    } else {
      gratis = { gull: Math.round(150 * skala), tekst: '🪙 gull' };
      premium = { gull: Math.round(600 * skala), jern: Math.round(80 * skala), tekst: '🪙 gull + ⛓️ jern' };
    }
    if (i === OW.SESONG.nivaer) {
      gratis = { krystall: 100, tekst: '💎 100 krystaller' };
      premium = { krystall: 350, kosmetikk: 'drage', tekst: '💎 350 + 🐉 Drageflagg' };
    }
    liste.push({ niva: i, gratis: gratis, premium: premium });
  }
  return liste;
})();

/* --------------------------------------------------------------- BRAGDER */
OW.BRAGDER = [
  { id: 'forste_spadetak', navn: 'Første spadetak', ikon: '🪵', tekst: 'Bygg din første bygning.', sjekk: function (s, d) { return d.byggNivaTotalt >= 1; }, krystall: 3 },
  { id: 'landsbyliv', navn: 'Landsbyliv', ikon: '🛖', tekst: 'Nå 50 innbyggere.', sjekk: function (s) { return s.pop >= 50; }, krystall: 5 },
  { id: 'byfolk', navn: 'Byfolk', ikon: '🏘️', tekst: 'Nå 250 innbyggere.', sjekk: function (s) { return s.pop >= 250; }, krystall: 10 },
  { id: 'storby', navn: 'Storby', ikon: '🌆', tekst: 'Nå 1 000 innbyggere.', sjekk: function (s) { return s.pop >= 1000; }, krystall: 25 },
  { id: 'gullgrossist', navn: 'Gullgrossist', ikon: '🪙', tekst: 'Ha 10 000 gull samtidig.', sjekk: function (s) { return s.res.gull >= 10000; }, krystall: 15 },
  { id: 'handelsfyrste', navn: 'Handelsfyrste', ikon: '🐫', tekst: 'Fullfør 25 handelsruter.', sjekk: function (s) { return s.stat.handler >= 25; }, krystall: 20 },
  { id: 'oppdager', navn: 'Oppdageren', ikon: '🧭', tekst: 'Erobre 5 områder.', sjekk: function (s, d) { return d.omraderEid >= 5; }, krystall: 20 },
  { id: 'kartmester', navn: 'Kartmester', ikon: '🗺️', tekst: 'Erobre alle områder.', sjekk: function (s, d) { return d.omraderEid >= OW.OMRADER.length; }, krystall: 100 },
  { id: 'lardom', navn: 'Lærd', ikon: '📚', tekst: 'Fullfør 10 forskninger.', sjekk: function (s, d) { return d.techAntall >= 10; }, krystall: 20 },
  { id: 'alvitende', navn: 'Allvitende', ikon: '🔭', tekst: 'Fullfør all forskning.', sjekk: function (s, d) { return d.techAntall >= OW.TECH.length; }, krystall: 120 },
  { id: 'festning', navn: 'Festningsverk', ikon: '🛡️', tekst: 'Nå 1 000 i militær styrke.', sjekk: function (s, d) { return d.militaer >= 1000; }, krystall: 25 },
  { id: 'byggmester', navn: 'Byggmester', ikon: '🔨', tekst: 'Fullfør 100 byggeprosjekter.', sjekk: function (s) { return s.stat.bygget >= 100; }, krystall: 30 },
  { id: 'arkitekt', navn: 'Storarkitekt', ikon: '📐', tekst: 'Ha en bygning på nivå 25.', sjekk: function (s, d) { return d.hoyesteNiva >= 25; }, krystall: 40 },
  { id: 'folkekjaer', navn: 'Folkekjær', ikon: '💛', tekst: 'Hold tilfredsheten på 95 eller mer.', sjekk: function (s, d) { return d.lykke >= 95; }, krystall: 20 },
  { id: 'eventyrer', navn: 'Eventyreren', ikon: '🎲', tekst: 'Ta 15 hendelsesvalg.', sjekk: function (s) { return s.stat.hendelser >= 15; }, krystall: 15 },
  { id: 'konge', navn: 'Kronet', ikon: '👑', tekst: 'Nå epoken Kongerike.', sjekk: function (s) { return s.era >= 2; }, krystall: 25 },
  { id: 'keiser', navn: 'Keiser', ikon: '🏛️', tekst: 'Nå epoken Imperium.', sjekk: function (s) { return s.era >= 3; }, krystall: 50 },
  { id: 'verdensmakt', navn: 'Verdensmakt', ikon: '🌍', tekst: 'Nå den siste epoken.', sjekk: function (s) { return s.era >= 5; }, krystall: 200 },
  { id: 'rangert', navn: 'Nummer én', ikon: '🏆', tekst: 'Ligg øverst i Riksmesterskapet.', sjekk: function (s, d) { return d.rangering === 1; }, krystall: 60 },
  { id: 'tusenkunstner', navn: 'Tusenkunstner', ikon: '✨', tekst: 'Ha minst ett nivå i 15 ulike bygninger.', sjekk: function (s, d) { return d.byggTyper >= 15; }, krystall: 35 }
];
