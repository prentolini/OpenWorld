/* OpenWorld – Spilltilstand, lagring og lasting */
window.OW = window.OW || {};

OW.LAGRINGSNOKKEL = 'openworld_lagring_v1';
OW.VERSJON = 1;

OW.nyTilstand = function (navn) {
  var na = Date.now();
  return {
    v: OW.VERSJON,
    navn: navn || 'Nyhavn',
    karakter: 'byggmester',
    opprettet: na,
    sistTikk: na,
    era: 0,

    res: { tre: 120, stein: 60, mat: 150, jern: 0, gull: 40, kunnskap: 0 },
    pop: 12,
    krystall: 20,

    bygg: {},                 // { byggId: niva }
    bydeler: 0,               // antall kjøpte bydeler – byen vokser utover
    ko: [],                   // [{ id, niva, start, slutt }]
    kjopteKoer: 0,            // permanent ekstra kø kjøpt i butikk
    leidKoTil: 0,             // midlertidig ekstra kø (krystaller)

    tech: {},                 // { techId: true }
    omrader: {},              // { omradeId: 'eid' }
    ekspedisjoner: [],        // [{ id, start, slutt }]

    karavaner: [],            // [{ id, start, slutt }]
    marked: { priser: {}, nesteSkift: 0 },

    laug: [],                 // valgte/eide laug
    gratisLaugBrukt: false,

    oppdrag: { indeks: 0, hentet: [] },
    bragder: [],
    sesong: { xp: 0, hentet: [], hentetP: [] },

    hendelse: null,           // aktiv hendelse som venter på valg
    nesteHendelse: na + 120000,

    varig: {                  // permanente effekter fra hendelser
      lykke: 0, militaer: 0, diplomati: 0, globalProd: 0, rikspoeng: 0
    },

    premium: {
      medlem: false, medlemTil: 0, sesongpass: false,
      kosmetikk: [], kjopteLaug: [], sisteDagligKrystall: 0,
      kjopDagbok: {}          // { varId: 'YYYY-MM-DD' } for daglige grenser
    },

    stat: {
      bygget: 0, handler: 0, ekspedisjoner: 0, hendelser: 0,
      gullTjent: 0, spilletid: 0, beste: 0
    },

    logg: [],
    innst: { visTips: true, lyd: false }
  };
};

OW.lagre = function (s) {
  try {
    s.sistLagret = Date.now();
    localStorage.setItem(OW.LAGRINGSNOKKEL, JSON.stringify(s));
    return true;
  } catch (e) {
    console.warn('Kunne ikke lagre:', e);
    return false;
  }
};

OW.laste = function () {
  try {
    var raa = localStorage.getItem(OW.LAGRINGSNOKKEL);
    if (!raa) return null;
    var s = JSON.parse(raa);
    return OW.migrer(s);
  } catch (e) {
    console.warn('Ødelagt lagringsfil:', e);
    return null;
  }
};

/* Fyller ut felter som mangler hvis lagringen er fra en eldre versjon */
OW.migrer = function (s) {
  var mal = OW.nyTilstand(s.navn);
  var flett = function (mott, kilde) {
    for (var k in kilde) {
      if (!Object.prototype.hasOwnProperty.call(kilde, k)) continue;
      if (mott[k] === undefined || mott[k] === null) {
        mott[k] = kilde[k];
      } else if (typeof kilde[k] === 'object' && !Array.isArray(kilde[k]) && typeof mott[k] === 'object') {
        flett(mott[k], kilde[k]);
      }
    }
  };
  flett(s, mal);
  s.v = OW.VERSJON;
  return s;
};

OW.slettLagring = function () {
  try { localStorage.removeItem(OW.LAGRINGSNOKKEL); } catch (e) { /* ignorert */ }
};

OW.eksporter = function (s) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
};

OW.importer = function (tekst) {
  var s = JSON.parse(decodeURIComponent(escape(atob(tekst.trim()))));
  if (!s || !s.res || !s.bygg) throw new Error('Ugyldig lagringsfil');
  return OW.migrer(s);
};
