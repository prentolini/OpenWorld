/* OpenWorld – Karakterer
 *
 * Du velger én hersker ved oppstart. Valget er permanent, gir riket en
 * varig egenskap, og figuren går faktisk rundt i byen din i 3D.
 *
 * farge/kappe er RGB (0–1) og brukes av 3D-modellen.
 */
window.OW = window.OW || {};

OW.KARAKTERER = [
  {
    id: 'byggmester', navn: 'Torvald Steinhand', ikon: '🧔', tittel: 'Byggmesteren',
    tekst: 'Har reist hus siden han var ni. Sover dårlig hvis en vegg står skjevt.',
    replikk: '«Bygg det ordentlig, så slipper du å bygge det to ganger.»',
    farge: [0.42, 0.50, 0.62], kappe: [0.68, 0.55, 0.28], hatt: 'hjelm',
    trekk: '+15 % byggefart · +10 % stein',
    bonus: { byggfart: 0.15, prodPst: { stein: 0.10 } },
    gave: { tre: 150, stein: 120 }
  },
  {
    id: 'bonde', navn: 'Sigrid Åkervoll', ikon: '👩‍🌾', tittel: 'Jordmoren',
    tekst: 'Kjenner været på lukta. Har aldri mistet en høst, og lar deg vite det.',
    replikk: '«Et rike marsjerer på magen. Alt annet er pynt.»',
    farge: [0.55, 0.62, 0.38], kappe: [0.78, 0.68, 0.32], hatt: 'straahatt',
    trekk: '+25 % mat · +6 tilfredshet',
    bonus: { prodPst: { mat: 0.25 }, lykke: 6 },
    gave: { mat: 300 }
  },
  {
    id: 'lard', navn: 'Runa Stjerneøye', ikon: '🧙‍♀️', tittel: 'Den lærde',
    tekst: 'Leste seg gjennom hele biblioteket i Elvebyen. To ganger. Uten å blunke.',
    replikk: '«Den som vet mest, trenger sjelden å slåss.»',
    farge: [0.38, 0.42, 0.62], kappe: [0.45, 0.36, 0.66], hatt: 'spisshatt',
    trekk: '+30 % kunnskap · −12 % forskningskostnad',
    bonus: { prodPst: { kunnskap: 0.30 }, forskrabatt: 0.12 },
    gave: { kunnskap: 120 }
  },
  {
    id: 'oppdager', navn: 'Elva Nordvind', ikon: '🧭', tittel: 'Oppdageren',
    tekst: 'Har seilt lenger nord enn kartet rekker. Kom tilbake med en historie ingen tror på.',
    replikk: '«Horisonten er ikke en grense. Den er en invitasjon.»',
    farge: [0.30, 0.52, 0.56], kappe: [0.24, 0.38, 0.48], hatt: 'kapteinslue',
    trekk: '+30 % ekspedisjonsfart · +1 handelsrute',
    bonus: { ekspfart: 0.30, ruter: 1 },
    gave: { mat: 200, gull: 100 }
  },
  {
    id: 'handelsmann', navn: 'Aksel Gullhand', ikon: '🤴', tittel: 'Handelsfyrsten',
    tekst: 'Kjøpte sin første karavane som femtenåring. Solgte den samme kveld med fortjeneste.',
    replikk: '«Alt har en pris. Kunsten er å vite hvem sin.»',
    farge: [0.62, 0.48, 0.30], kappe: [0.82, 0.66, 0.26], hatt: 'krone',
    trekk: '+20 % gull · +15 % handelsgevinst',
    bonus: { prodPst: { gull: 0.20 }, handelsbonus: 0.15 },
    gave: { gull: 250 }
  },
  {
    id: 'feltherre', navn: 'Marskalk Brand', ikon: '🛡️', tittel: 'Feltherren',
    tekst: 'Snakker lite. Når han først sier noe, står folk stille og hører etter.',
    replikk: '«Mur først. Forhandle etterpå.»',
    farge: [0.52, 0.34, 0.32], kappe: [0.62, 0.24, 0.24], hatt: 'hjelm',
    trekk: '+35 % militær styrke · +8 % byggefart',
    bonus: { militaerPst: 0.35, byggfart: 0.08 },
    gave: { jern: 100, stein: 150 }
  },
  {
    id: 'folketaler', navn: 'Mira Solglans', ikon: '👸', tittel: 'Folketaleren',
    tekst: 'Kan snu et sint torg til en fest med tre setninger. Ingen vet helt hvordan.',
    replikk: '«Et folk som synger, bygger fortere.»',
    farge: [0.66, 0.44, 0.56], kappe: [0.86, 0.56, 0.62], hatt: 'krone',
    trekk: '+14 tilfredshet · +10 % befolkningstak',
    bonus: { lykke: 14, popTakPst: 0.10 },
    gave: { mat: 150, gull: 120 }
  },
  {
    id: 'smed', navn: 'Yrsa Jernbånd', ikon: '⚒️', tittel: 'Mestersmeden',
    tekst: 'Kom til byen med en hammer og ingenting annet. Nå eier hun halve smiegata.',
    replikk: '«Gi meg jern og ild, så skal du få et rike.»',
    farge: [0.46, 0.42, 0.44], kappe: [0.56, 0.36, 0.24], hatt: 'ingen',
    trekk: '+30 % jern · +12 % militær styrke',
    bonus: { prodPst: { jern: 0.30 }, militaerPst: 0.12 },
    gave: { jern: 80, tre: 150 }
  }
];

OW.KARAKTER_INDEX = {};
OW.KARAKTERER.forEach(function (k) { OW.KARAKTER_INDEX[k.id] = k; });

OW.karakterFor = function (s) {
  return OW.KARAKTER_INDEX[s && s.karakter] || OW.KARAKTERER[0];
};
