/* OpenWorld – Spillmotor
 * All regnelogikk bor her. UI-laget leser bare resultatene.
 */
window.OW = window.OW || {};

OW.E = {

  /* Lagerkapasitet per bygningsnivå vokser med denne faktoren.
     INVARIANT: må være høyere enn den høyeste kostMult blant bygningene (1,60),
     ellers kan et bygg til slutt koste mer enn lageret klarer å romme. */
  LAGERVEKST: 1.66,

  /* Innbyggerne sanker litt på egen hånd, uansett hva du har bygget.
     Dette er sikkerhetsnettet som gjør det umulig å låse seg helt fast:
     har du brukt opp alt, kommer du alltid i gang igjen. */
  GRUNNSANKING: { tre: 0.08, stein: 0.05, mat: 0.1 },

  /* Kalles av UI for å vise meldinger. Overstyres i ui/app.js. */
  varsel: function (tekst, type) { console.log('[' + (type || 'info') + '] ' + tekst); },
  logg: function (s, tekst, ikon) {
    s.logg.unshift({ t: Date.now(), tekst: tekst, ikon: ikon || '•' });
    if (s.logg.length > 60) s.logg.length = 60;
  },

  /* ------------------------------------------------------------ BYGNINGER */

  niva: function (s, id) { return s.bygg[id] || 0; },

  /* Nivåer som allerede ligger i køen for denne bygningen */
  iKo: function (s, id) {
    var n = 0;
    for (var i = 0; i < s.ko.length; i++) if (s.ko[i].id === id) n++;
    return n;
  },

  nesteNiva: function (s, id) {
    return OW.E.niva(s, id) + OW.E.iKo(s, id) + 1;
  },

  byggKost: function (s, id, niva) {
    var b = OW.BYGG_INDEX[id];
    var mult = Math.pow(b.kostMult, niva - 1);
    var ut = {};
    for (var r in b.kost) ut[r] = Math.ceil(b.kost[r] * mult);
    return ut;
  },

  byggTid: function (s, d, id, niva) {
    var b = OW.BYGG_INDEX[id];
    var sek = b.tid * Math.pow(b.tidMult, niva - 1);
    return Math.max(2, sek / (1 + d.byggfart));
  },

  maksNiva: function (id) {
    var b = OW.BYGG_INDEX[id];
    return b.maks || 999;
  },

  /* Er bygningen synlig/tilgjengelig for spilleren? */
  byggLast: function (s, id) {
    var b = OW.BYGG_INDEX[id];
    if (b.era > s.era) return { ok: false, grunn: 'Krever epoken ' + OW.EPOKER[b.era].navn };
    if (b.krevLaug && s.laug.indexOf(b.krevLaug) < 0) return { ok: false, grunn: 'Krever ' + OW.LAUG_INDEX[b.krevLaug].navn };
    if (b.krevKosmetikk && s.premium.kosmetikk.indexOf(b.krevKosmetikk) < 0) return { ok: false, grunn: 'Låses opp i butikken' };
    return { ok: true };
  },

  harRaad: function (s, kost) {
    for (var r in kost) if ((s.res[r] || 0) < kost[r]) return false;
    return true;
  },

  betal: function (s, kost) {
    for (var r in kost) s.res[r] = (s.res[r] || 0) - kost[r];
  },

  gi: function (s, pakke) {
    for (var r in pakke) {
      if (r === 'krystall') { s.krystall += pakke[r]; continue; }
      if (r === 'sesongXp') { OW.E.sesongXp(s, pakke[r]); continue; }
      if (s.res[r] === undefined) continue;
      s.res[r] += pakke[r];
      if (r === 'gull' && pakke[r] > 0) s.stat.gullTjent += pakke[r];
    }
  },

  koPlasser: function (s) {
    var n = 1;
    if (OW.E.niva(s, 'radhus') >= 15) n++;
    if (s.premium.medlem) n++;
    n += s.kjopteKoer;
    if (s.leidKoTil > Date.now()) n++;
    return n;
  },

  startBygg: function (s, d, id) {
    var b = OW.BYGG_INDEX[id];
    var last = OW.E.byggLast(s, id);
    if (!last.ok) return { ok: false, grunn: last.grunn };
    if (s.ko.length >= OW.E.koPlasser(s)) return { ok: false, grunn: 'Byggekøen er full' };
    var niva = OW.E.nesteNiva(s, id);
    if (niva > OW.E.maksNiva(id)) return { ok: false, grunn: 'Maksnivå nådd' };
    var kost = OW.E.byggKost(s, id, niva);
    if (!OW.E.harRaad(s, kost)) return { ok: false, grunn: 'Ikke nok ressurser' };
    OW.E.betal(s, kost);
    var na = Date.now();
    var sek = OW.E.byggTid(s, d, id, niva);
    s.ko.push({ id: id, niva: niva, start: na, slutt: na + sek * 1000 });
    return { ok: true, navn: b.navn, niva: niva, sek: sek };
  },

  avbrytBygg: function (s, indeks) {
    var el = s.ko[indeks];
    if (!el) return false;
    var kost = OW.E.byggKost(s, el.id, el.niva);
    for (var r in kost) s.res[r] = (s.res[r] || 0) + Math.floor(kost[r] * 0.75);
    s.ko.splice(indeks, 1);
    OW.E.varsel('Byggeprosjektet er avbrutt. 75 % av materialene er tilbake.', 'info');
    return true;
  },

  hastverkPris: function (s, sluttTid) {
    var min = Math.max(0, (sluttTid - Date.now()) / 60000);
    var pris = Math.ceil(min * OW.KRYSTALL_PRISER.hastverkPerMinutt);
    if (s.premium.medlem) pris = Math.ceil(pris / 2);
    return Math.max(OW.KRYSTALL_PRISER.hastverkMin, pris);
  },

  hastverk: function (s, indeks) {
    var el = s.ko[indeks];
    if (!el) return false;
    var pris = OW.E.hastverkPris(s, el.slutt);
    if (s.krystall < pris) { OW.E.varsel('Du mangler ' + (pris - s.krystall) + ' krystaller.', 'feil'); return false; }
    s.krystall -= pris;
    el.slutt = Date.now();
    return true;
  },

  fullforBygg: function (s, el, stille) {
    s.bygg[el.id] = (s.bygg[el.id] || 0) + 1;
    s.stat.bygget++;
    OW.E.sesongXp(s, 4 + el.niva);
    var b = OW.BYGG_INDEX[el.id];
    OW.E.logg(s, b.navn + ' er nå nivå ' + el.niva + '.', b.ikon);
    if (!stille) OW.E.varsel(b.ikon + ' ' + b.navn + ' ferdig — nivå ' + el.niva + '!', 'ok');
  },

  /* ----------------------------------------------------------- FORSKNING */

  techKost: function (s, d, id) {
    var t = OW.TECH_INDEX[id];
    return Math.ceil(t.kost * (1 - Math.min(0.6, d.forskrabatt)));
  },

  techLast: function (s, id) {
    var t = OW.TECH_INDEX[id];
    if (s.tech[id]) return { ok: false, grunn: 'Allerede forsket' };
    if (t.era > s.era) return { ok: false, grunn: 'Krever epoken ' + OW.EPOKER[t.era].navn };
    for (var i = 0; i < t.krev.length; i++) {
      if (!s.tech[t.krev[i]]) return { ok: false, grunn: 'Krever ' + OW.TECH_INDEX[t.krev[i]].navn };
    }
    return { ok: true };
  },

  forsk: function (s, d, id) {
    var last = OW.E.techLast(s, id);
    if (!last.ok) return { ok: false, grunn: last.grunn };
    var kost = OW.E.techKost(s, d, id);
    if (s.res.kunnskap < kost) return { ok: false, grunn: 'Trenger ' + OW.F.tall(kost - s.res.kunnskap) + ' mer kunnskap' };
    s.res.kunnskap -= kost;
    s.tech[id] = true;
    var t = OW.TECH_INDEX[id];
    OW.E.sesongXp(s, 25);
    OW.E.logg(s, 'Forskning fullført: ' + t.navn + '.', t.ikon);
    OW.E.varsel(t.ikon + ' ' + t.navn + ' er forsket fram!', 'ok');
    return { ok: true };
  },

  /* --------------------------------------------------------- EKSPEDISJON */

  ekspPlasser: function (s) { return s.premium.medlem ? 2 : 1; },

  omradeLast: function (s, id) {
    var o = OW.OMRADE_INDEX[id];
    if (s.omrader[id]) return { ok: false, grunn: 'Allerede ditt' };
    if (o.era > s.era) return { ok: false, grunn: 'Krever epoken ' + OW.EPOKER[o.era].navn };
    return { ok: true };
  },

  startEkspedisjon: function (s, d, id) {
    var last = OW.E.omradeLast(s, id);
    if (!last.ok) return { ok: false, grunn: last.grunn };
    if (s.ekspedisjoner.length >= OW.E.ekspPlasser(s)) return { ok: false, grunn: 'Du har allerede en ekspedisjon ute' };
    var o = OW.OMRADE_INDEX[id];
    if (!OW.E.harRaad(s, o.kost)) return { ok: false, grunn: 'Ikke nok forsyninger' };
    OW.E.betal(s, o.kost);
    var na = Date.now();
    var sek = o.tid / (1 + d.ekspfart);
    s.ekspedisjoner.push({ id: id, start: na, slutt: na + sek * 1000 });
    OW.E.logg(s, 'Ekspedisjon sendt mot ' + o.navn + '.', o.ikon);
    return { ok: true, sek: sek };
  },

  fullforEkspedisjon: function (s, e, stille) {
    var o = OW.OMRADE_INDEX[e.id];
    s.omrader[e.id] = 'eid';
    s.stat.ekspedisjoner++;
    OW.E.sesongXp(s, 45);
    OW.E.logg(s, o.navn + ' er nå en del av riket ditt.', o.ikon);
    if (!stille) OW.E.varsel(o.ikon + ' ' + o.navn + ' er erobret!', 'ok');
  },

  /* --------------------------------------------------------------- HANDEL */

  aktiveRuter: function (s) { return s.karavaner.length; },

  startKaravane: function (s, d, id) {
    var r = OW.RUTE_INDEX[id];
    if (r.era > s.era) return { ok: false, grunn: 'Krever epoken ' + OW.EPOKER[r.era].navn };
    if (s.karavaner.length >= d.ruterMaks) return { ok: false, grunn: 'Alle handelsruter er i bruk' };
    if (!OW.E.harRaad(s, r.inn)) return { ok: false, grunn: 'Ikke nok varer å sende' };
    OW.E.betal(s, r.inn);
    var na = Date.now();
    s.karavaner.push({ id: id, start: na, slutt: na + r.tid * 1000 });
    return { ok: true };
  },

  fullforKaravane: function (s, k, d, stille) {
    var r = OW.RUTE_INDEX[k.id];
    var bonus = 1 + d.handelsbonus;
    var pakke = {};
    for (var res in r.ut) pakke[res] = Math.round(r.ut[res] * bonus);
    OW.E.gi(s, pakke);
    s.stat.handler++;
    OW.E.sesongXp(s, 3);
    var deler = [];
    for (var q in pakke) deler.push(OW.F.tall(pakke[q]) + ' ' + q);
    OW.E.logg(s, r.navn + ' er hjemme med ' + deler.join(', ') + '.', r.ikon);
    if (!stille) OW.E.varsel(r.ikon + ' ' + r.navn + ': ' + deler.join(', '), 'ok');
  },

  /* Markedspriser svinger jevnlig */
  oppdaterMarked: function (s, tvungen) {
    var na = Date.now();
    if (!tvungen && na < s.marked.nesteSkift) return;
    var frø = Math.floor(na / 90000);
    var basis = { tre: 1.0, stein: 1.1, mat: 0.8, jern: 3.2, kunnskap: 9 };
    var i = 0;
    for (var r in basis) {
      var f = OW.fro(frø + i * 37.13);
      s.marked.priser[r] = Math.round(basis[r] * (0.7 + f * 0.75) * 100) / 100;
      i++;
    }
    s.marked.nesteSkift = na + 90000;
  },

  kjopPris: function (s, res) { return (s.marked.priser[res] || 1) * 1.3; },
  selgPris: function (s, d, res) { return (s.marked.priser[res] || 1) * (0.85 + Math.min(0.35, d.handelsbonus * 0.5)); },

  handleMarked: function (s, d, res, antall, kjop) {
    if (antall <= 0) return { ok: false, grunn: 'Ingenting å handle' };
    if (kjop) {
      var pris = Math.ceil(OW.E.kjopPris(s, res) * antall);
      if (s.res.gull < pris) return { ok: false, grunn: 'Ikke nok gull' };
      if (d.lagerTak[res] && s.res[res] + antall > d.lagerTak[res]) return { ok: false, grunn: 'Ikke plass på lageret' };
      s.res.gull -= pris;
      s.res[res] += antall;
      return { ok: true, tekst: 'Kjøpte ' + OW.F.tall(antall) + ' ' + res + ' for ' + OW.F.tall(pris) + ' gull.' };
    }
    if (s.res[res] < antall) return { ok: false, grunn: 'Du har ikke så mye' };
    var inn = Math.floor(OW.E.selgPris(s, d, res) * antall);
    s.res[res] -= antall;
    OW.E.gi(s, { gull: inn });
    return { ok: true, tekst: 'Solgte ' + OW.F.tall(antall) + ' ' + res + ' for ' + OW.F.tall(inn) + ' gull.' };
  },

  /* ------------------------------------------------------------ HENDELSER */

  trekkHendelse: function (s) {
    var mulige = OW.HENDELSER.filter(function (h) {
      return h.era <= s.era && h.era >= s.era - 2 &&
        (!s.sisteHendelser || s.sisteHendelser.indexOf(h.id) < 0);
    });
    if (!mulige.length) mulige = OW.HENDELSER.filter(function (h) { return h.era <= s.era; });
    if (!mulige.length) return null;
    var h = mulige[Math.floor(Math.random() * mulige.length)];
    s.sisteHendelser = (s.sisteHendelser || []);
    s.sisteHendelser.unshift(h.id);
    if (s.sisteHendelser.length > 3) s.sisteHendelser.length = 3;
    s.hendelse = { id: h.id, tid: Date.now() };
    return h;
  },

  velgHendelse: function (s, d, valgIndeks) {
    if (!s.hendelse) return null;
    var h = null;
    for (var i = 0; i < OW.HENDELSER.length; i++) if (OW.HENDELSER[i].id === s.hendelse.id) h = OW.HENDELSER[i];
    if (!h) { s.hendelse = null; return null; }
    var valg = h.valg[valgIndeks];
    if (!valg) return null;

    if (valg.kost && !OW.E.harRaad(s, valg.kost)) return { feil: 'Du har ikke råd til dette valget.' };
    if (valg.krevMilitaer && d.militaer < valg.krevMilitaer && valg.feil) {
      if (valg.kost) OW.E.betal(s, valg.kost);
      var f = OW.E.brukHendelseEffekt(s, valg.feil);
      s.hendelse = null; s.stat.hendelser++;
      s.nesteHendelse = Date.now() + (150 + Math.random() * 120) * 1000;
      return { tekst: f };
    }
    if (valg.kost) OW.E.betal(s, valg.kost);

    var resultat;
    if (valg.effekt.tilfeldig) {
      var v = OW.velgVektet(valg.effekt.tilfeldig);
      resultat = OW.E.brukHendelseEffekt(s, { melding: v.tekst, gi: v.gi });
    } else {
      resultat = OW.E.brukHendelseEffekt(s, valg.effekt);
    }
    s.hendelse = null;
    s.stat.hendelser++;
    OW.E.sesongXp(s, 12);
    s.nesteHendelse = Date.now() + (150 + Math.random() * 120) * 1000;
    OW.E.logg(s, h.tittel + ': ' + resultat, h.ikon);
    return { tekst: resultat };
  },

  brukHendelseEffekt: function (s, eff) {
    var gi = eff.gi || {};
    var biter = [];
    for (var k in gi) {
      var v = gi[k];
      if (k === 'lykkeVarig') { s.varig.lykke += v; biter.push((v > 0 ? '+' : '') + v + ' tilfredshet'); }
      else if (k === 'militaerVarig') { s.varig.militaer += v; biter.push('+' + v + ' militær'); }
      else if (k === 'diplomatiVarig') { s.varig.diplomati += v; biter.push('+' + v + ' diplomati'); }
      else if (k === 'globalProdVarig') { s.varig.globalProd += v; biter.push('+' + OW.F.pst(v) + ' produksjon'); }
      else if (k === 'rikspoeng') { s.varig.rikspoeng += v; biter.push('+' + OW.F.tall(v) + ' rikspoeng'); }
      else if (k === 'popTap') { var tap = Math.floor(s.pop * v); s.pop -= tap; biter.push('−' + tap + ' innbyggere'); }
      else if (k === 'lykke') { s.varig.lykke += v; biter.push('+' + v + ' tilfredshet'); }
      else if (k === 'krystall') { s.krystall += v; biter.push('+' + v + ' 💎'); }
      else if (k === 'sesongXp') { OW.E.sesongXp(s, v); biter.push('+' + v + ' sesong-XP'); }
      else if (s.res[k] !== undefined) {
        s.res[k] = Math.max(0, s.res[k] + v);
        biter.push((v > 0 ? '+' : '−') + OW.F.tall(Math.abs(v)) + ' ' + k);
      }
    }
    var m = eff.melding || '';
    return m + (biter.length ? ' (' + biter.join(', ') + ')' : '');
  },

  /* -------------------------------------------------------------- OPPDRAG */

  malStatus: function (s, d, m) {
    var naa = 0, mal = m.n;
    switch (m.type) {
      case 'bygg': naa = OW.E.niva(s, m.id); break;
      case 'ressurs': naa = s.res[m.res] || 0; break;
      case 'epoke': naa = s.era; break;
      case 'omrader': naa = d.omraderEid; break;
      case 'tech': naa = d.techAntall; break;
      case 'militaer': naa = d.militaer; break;
      case 'handler': naa = s.stat.handler; break;
      case 'pop': naa = Math.floor(s.pop); break;
      case 'laug': naa = s.laug.length; break;
      case 'hendelser': naa = s.stat.hendelser; break;
      case 'rangering': naa = d.rangering === 1 ? 1 : 0; break;
    }
    return { naa: naa, mal: mal, ok: naa >= mal };
  },

  malTekst: function (m) {
    switch (m.type) {
      case 'bygg': return OW.BYGG_INDEX[m.id].navn + ' nivå ' + m.n;
      case 'ressurs': return OW.F.tall(m.n) + ' ' + m.res;
      case 'epoke': return 'Nå epoken ' + OW.EPOKER[m.n].navn;
      case 'omrader': return m.n + ' erobrede områder';
      case 'tech': return m.n + ' fullførte forskninger';
      case 'militaer': return OW.F.tall(m.n) + ' militær styrke';
      case 'handler': return m.n + ' fullførte handelsruter';
      case 'pop': return m.n + ' innbyggere';
      case 'laug': return 'Velg en spesialisering';
      case 'hendelser': return m.n + ' hendelsesvalg';
      case 'rangering': return 'Førsteplass i Riksmesterskapet';
      default: return '?';
    }
  },

  aktivtOppdrag: function (s) {
    return OW.OPPDRAG[s.oppdrag.indeks] || null;
  },

  oppdragKlart: function (s, d) {
    var o = OW.E.aktivtOppdrag(s);
    if (!o) return false;
    for (var i = 0; i < o.mal.length; i++) {
      if (!OW.E.malStatus(s, d, o.mal[i]).ok) return false;
    }
    return true;
  },

  hentOppdrag: function (s, d) {
    if (!OW.E.oppdragKlart(s, d)) return null;
    var o = OW.E.aktivtOppdrag(s);
    OW.E.gi(s, o.belonning);
    s.oppdrag.hentet.push(o.id);
    s.oppdrag.indeks++;
    OW.E.logg(s, 'Oppdrag fullført: ' + o.tittel + '.', '📜');
    return o;
  },

  /* --------------------------------------------------------------- SESONG */

  sesongXp: function (s, n) { s.sesong.xp += n; },

  /* XP som kreves for å gå fra nivå n−1 til n */
  sesongXpForNiva: function (n) {
    return OW.SESONG.xpBase + OW.SESONG.xpStigning * (n - 1);
  },

  /* Samlet XP som kreves for å ha nådd nivå n */
  sesongXpTotalt: function (n) {
    return n * OW.SESONG.xpBase + OW.SESONG.xpStigning * (n * (n - 1)) / 2;
  },

  sesongNiva: function (s) {
    var n = 0;
    while (n < OW.SESONG.nivaer && s.sesong.xp >= OW.E.sesongXpTotalt(n + 1)) n++;
    return n;
  },

  /* { iNiva, trengs } for fremdriftsstolpen */
  sesongFremdrift: function (s) {
    var n = OW.E.sesongNiva(s);
    if (n >= OW.SESONG.nivaer) return { iNiva: 1, trengs: 1, ferdig: true };
    return {
      iNiva: Math.floor(s.sesong.xp - OW.E.sesongXpTotalt(n)),
      trengs: OW.E.sesongXpForNiva(n + 1),
      ferdig: false
    };
  },

  hentSesong: function (s, niva, premium) {
    var n = OW.SESONG_BELONNING[niva - 1];
    if (!n) return false;
    if (OW.E.sesongNiva(s) < niva) return false;
    var liste = premium ? s.sesong.hentetP : s.sesong.hentet;
    if (liste.indexOf(niva) >= 0) return false;
    if (premium && !s.premium.sesongpass) return false;
    var bel = premium ? n.premium : n.gratis;
    var pakke = {};
    for (var k in bel) {
      if (k === 'tekst') continue;
      if (k === 'kosmetikk') { if (s.premium.kosmetikk.indexOf(bel[k]) < 0) s.premium.kosmetikk.push(bel[k]); continue; }
      pakke[k] = bel[k];
    }
    OW.E.gi(s, pakke);
    liste.push(niva);
    return true;
  },

  /* -------------------------------------------------------------- BRAGDER */

  sjekkBragder: function (s, d, stille) {
    for (var i = 0; i < OW.BRAGDER.length; i++) {
      var b = OW.BRAGDER[i];
      if (s.bragder.indexOf(b.id) >= 0) continue;
      var ok = false;
      try { ok = b.sjekk(s, d); } catch (e) { ok = false; }
      if (ok) {
        s.bragder.push(b.id);
        s.krystall += b.krystall;
        OW.E.sesongXp(s, 20);
        OW.E.logg(s, 'Bragd: ' + b.navn + ' (+' + b.krystall + ' 💎)', b.ikon);
        if (!stille) OW.E.varsel('🏅 Bragd: ' + b.navn + ' — +' + b.krystall + ' krystaller!', 'bragd');
      }
    }
  },

  /* --------------------------------------------------------------- EPOKER */

  eraKrav: function (s, d) {
    var neste = OW.EPOKER[s.era + 1];
    if (!neste) return null;
    var k = neste.krav, liste = [];
    if (k.radhus) liste.push({ tekst: 'Rådhus nivå ' + k.radhus, naa: OW.E.niva(s, 'radhus'), mal: k.radhus });
    if (k.bygg) liste.push({ tekst: k.bygg + ' ulike bygninger', naa: d.byggTyper, mal: k.bygg });
    if (k.omrader) liste.push({ tekst: k.omrader + ' erobrede områder', naa: d.omraderEid, mal: k.omrader });
    if (k.tech) liste.push({ tekst: k.tech + ' forskninger', naa: d.techAntall, mal: k.tech });
    if (k.militaer) liste.push({ tekst: OW.F.tall(k.militaer) + ' militær styrke', naa: Math.floor(d.militaer), mal: k.militaer });
    return { epoke: neste, liste: liste, ok: liste.every(function (x) { return x.naa >= x.mal; }) };
  },

  avanserEra: function (s, d) {
    var k = OW.E.eraKrav(s, d);
    if (!k || !k.ok) return null;
    s.era++;
    s.krystall += 25;
    OW.E.sesongXp(s, 150);
    OW.E.logg(s, 'Ny epoke: ' + k.epoke.navn + '!', k.epoke.ikon);
    return k.epoke;
  },

  /* ---------------------------------------------------------- LAUG / VEIVALG */

  velgGratisLaug: function (s, id) {
    if (s.gratisLaugBrukt) return { ok: false, grunn: 'Du har allerede valgt din gratis vei' };
    if (s.era < 2) return { ok: false, grunn: 'Åpnes i epoken Kongerike' };
    if (s.laug.indexOf(id) >= 0) return { ok: false, grunn: 'Allerede valgt' };
    s.laug.push(id);
    s.gratisLaugBrukt = true;
    var l = OW.LAUG_INDEX[id];
    OW.E.logg(s, 'Riket har valgt sin vei: ' + l.navn + '.', l.ikon);
    return { ok: true, laug: l };
  },

  /* ------------------------------------------------------------- BEREGNING */

  beregn: function (s) {
    var m = {
      prodFlat: {}, prodPst: {}, globalProd: 0,
      popTakFlat: 0, popTakPst: 0, lagerFlat: 0, lagerPst: 0,
      lykke: 0, militaerFlat: 0, militaerPst: 0,
      byggfart: 0, ekspfart: 0, handelsbonus: 0, forskrabatt: 0,
      ruter: 0, omradeBonus: 0, diplomati: 0, matBruk: 0, arbeidere: 0
    };
    var r, i, k;
    for (i = 0; i < OW.RESSURSER.length; i++) { m.prodFlat[OW.RESSURSER[i].id] = 0; m.prodPst[OW.RESSURSER[i].id] = 0; }

    var leggTil = function (b) {
      for (k in b) {
        var v = b[k];
        if (k === 'prod' || k === 'prodPst') {
          for (r in v) {
            if (k === 'prod') m.prodFlat[r] = (m.prodFlat[r] || 0) + v[r];
            else m.prodPst[r] = (m.prodPst[r] || 0) + v[r];
          }
        } else if (k === 'popTak') m.popTakFlat += v;
        else if (k === 'lager') m.lagerFlat += v;
        else if (k === 'militaer') m.militaerFlat += v;
        else if (m[k] !== undefined) m[k] += v;
      }
    };

    /* Bygninger */
    var byggTyper = 0, byggNivaTotalt = 0, hoyesteNiva = 0;
    for (var id in s.bygg) {
      var lvl = s.bygg[id];
      if (!lvl) continue;
      var def = OW.BYGG_INDEX[id];
      if (!def) continue;
      byggTyper++; byggNivaTotalt += lvl;
      if (lvl > hoyesteNiva) hoyesteNiva = lvl;
      var skalert = {};
      for (k in def.gir) {
        if (k === 'prod') { skalert.prod = {}; for (r in def.gir.prod) skalert.prod[r] = def.gir.prod[r] * lvl; }
        else if (k === 'lager') {
          /* Lager må vokse geometrisk – byggekostnadene gjør det også.
             Ellers blir riket hardlåst når neste nivå koster mer enn lageret rommer. */
          skalert.lager = def.gir.lager * (Math.pow(OW.E.LAGERVEKST, lvl) - 1) / (OW.E.LAGERVEKST - 1);
        }
        else skalert[k] = def.gir[k] * lvl;
      }
      leggTil(skalert);
      m.arbeidere += (def.arbeidere || 0) * lvl;
    }

    /* Forskning */
    var techAntall = 0;
    for (var tid in s.tech) {
      if (!s.tech[tid] || !OW.TECH_INDEX[tid]) continue;
      techAntall++;
      leggTil(OW.TECH_INDEX[tid].bonus);
    }

    /* Herskerens egenskap */
    var kar = OW.karakterFor(s);
    if (kar) leggTil(kar.bonus);

    /* Laug */
    for (i = 0; i < s.laug.length; i++) {
      if (OW.LAUG_INDEX[s.laug[i]]) leggTil(OW.LAUG_INDEX[s.laug[i]].bonus);
    }

    /* Områder – forsterkes av koloniforvaltning og telegraf */
    var omradeMult = 1 + m.omradeBonus;
    var omraderEid = 0;
    for (var oid in s.omrader) {
      if (s.omrader[oid] !== 'eid' || !OW.OMRADE_INDEX[oid]) continue;
      omraderEid++;
      var ob = OW.OMRADE_INDEX[oid].bonus, skal = {};
      for (k in ob) {
        if (k === 'prodPst') { skal.prodPst = {}; for (r in ob.prodPst) skal.prodPst[r] = ob.prodPst[r] * omradeMult; }
        else skal[k] = ob[k] * omradeMult;
      }
      leggTil(skal);
    }

    /* Premium og varige hendelseseffekter */
    if (s.premium.medlem) m.globalProd += 0.10;
    m.lykke += s.varig.lykke;
    m.militaerFlat += s.varig.militaer;
    m.diplomati += s.varig.diplomati;
    m.globalProd += s.varig.globalProd;

    /* Avledede verdier */
    var d = { mods: m };
    d.byggTyper = byggTyper;
    d.byggNivaTotalt = byggNivaTotalt;
    d.hoyesteNiva = hoyesteNiva;
    d.techAntall = techAntall;
    d.omraderEid = omraderEid;

    d.popTak = Math.floor((10 + m.popTakFlat) * (1 + m.popTakPst));
    d.arbeiderBehov = m.arbeidere;
    d.eff = m.arbeidere > 0 ? Math.min(1, s.pop / m.arbeidere) : 1;

    d.matForbruk = s.pop * 0.045 + m.matBruk;

    d.brutto = {};
    for (i = 0; i < OW.RESSURSER.length; i++) {
      r = OW.RESSURSER[i].id;
      /* Bygningene trenger arbeidere; grunnsankingen gjør folk uansett. */
      var raa = (m.prodFlat[r] || 0) * d.eff + (OW.E.GRUNNSANKING[r] || 0);
      d.brutto[r] = raa * (1 + (m.prodPst[r] || 0)) * (1 + m.globalProd);
    }
    var matNetto = d.brutto.mat - d.matForbruk;

    d.lykke = OW.klem(
      50 + m.lykke + (matNetto >= 0 ? 10 : -25) + (d.eff >= 0.999 ? 5 : -8),
      0, 100
    );
    d.lykkeFaktor = 0.6 + (d.lykke / 100) * 0.7;   /* 0,6 → 1,3 på gullinntekt */
    d.brutto.gull *= d.lykkeFaktor;

    d.prod = {};
    for (i = 0; i < OW.RESSURSER.length; i++) {
      r = OW.RESSURSER[i].id;
      d.prod[r] = r === 'mat' ? (d.brutto.mat - d.matForbruk) : d.brutto[r];
    }

    d.lagerTak = {};
    var basisLager = (600 + m.lagerFlat) * (1 + m.lagerPst);
    for (i = 0; i < OW.RESSURSER.length; i++) {
      r = OW.RESSURSER[i].id;
      /* Kunnskap tar lite plass – tre ganger så romslig som alt annet. */
      d.lagerTak[r] = Math.floor(basisLager * (r === 'kunnskap' ? 3 : 1));
    }

    d.militaer = m.militaerFlat * (1 + m.militaerPst);
    d.byggfart = m.byggfart;
    d.ekspfart = m.ekspfart;
    d.handelsbonus = m.handelsbonus;
    d.forskrabatt = m.forskrabatt;
    d.omradeBonus = m.omradeBonus;
    d.globalProd = m.globalProd;
    d.diplomati = m.diplomati;
    d.ruterMaks = 1 + Math.floor(m.ruter);

    /* Rikspoeng og rangering */
    var krigsbonus = OW.E.niva(s, 'krigsakademi') > 0 ? 3 : 1.5;
    d.rikspoeng = Math.floor(
      byggNivaTotalt * 12 +
      omraderEid * 400 +
      techAntall * 250 +
      s.era * 1500 +
      d.militaer * krigsbonus +
      s.pop * 0.4 +
      Math.sqrt(s.stat.handler) * 60 +
      d.diplomati * 25 +
      s.varig.rikspoeng
    );
    if (d.rikspoeng > s.stat.beste) s.stat.beste = d.rikspoeng;

    /* Rivalene har to ledd: ett som tikker med kalenderen, og ett som følger
       ditt eget beste resultat. Det andre leddet er alltid under 1,0, så et
       rike i eksponentiell vekst tar dem igjen – men det tar uker. */
    var dager = (Date.now() - s.opprettet) / 86400000;
    var tidsledd = Math.pow(dager + 0.5, 1.2);
    d.rivaler = OW.RIVALER.map(function (rv) {
      var poeng = Math.floor(rv.base * 0.15 * tidsledd + (rv.vekst - 1) * s.stat.beste + rv.base * 0.5);
      return { navn: rv.navn, ikon: rv.ikon, tone: rv.tone, poeng: poeng, spiller: false };
    });
    d.tavle = d.rivaler.concat([{ navn: s.navn, ikon: OW.EPOKER[s.era].ikon, tone: 'Ditt rike', poeng: d.rikspoeng, spiller: true }]);
    d.tavle.sort(function (a, b) { return b.poeng - a.poeng; });
    d.rangering = 1;
    for (i = 0; i < d.tavle.length; i++) if (d.tavle[i].spiller) d.rangering = i + 1;

    return d;
  },

  /* ----------------------------------------------------------------- TIKK */

  tikk: function (s, dt, stille) {
    if (dt <= 0) return null;
    var d = OW.E.beregn(s);
    var na = Date.now();
    var i, r;

    /* Produksjon */
    for (i = 0; i < OW.RESSURSER.length; i++) {
      r = OW.RESSURSER[i].id;
      var ny = s.res[r] + d.prod[r] * dt;
      if (r === 'gull' && d.prod[r] > 0) s.stat.gullTjent += d.prod[r] * dt;
      var tak = d.lagerTak[r];
      if (ny > tak) ny = tak;
      if (ny < 0) ny = 0;
      s.res[r] = ny;
    }

    /* Befolkning */
    var matNetto = d.prod.mat;
    if (matNetto >= 0 && s.pop < d.popTak) {
      s.pop = Math.min(d.popTak, s.pop + 0.012 * (d.popTak - s.pop) * (d.lykke / 100) * dt);
    } else if (matNetto < 0 && s.res.mat <= 0.5) {
      s.pop = Math.max(1, s.pop - s.pop * 0.015 * dt);
      if (!stille && !s._sultVarslet) {
        OW.E.varsel('🚨 Matmangel! Folk flytter fra riket. Bygg flere åkre.', 'feil');
        s._sultVarslet = na + 30000;
      }
    }
    if (s._sultVarslet && na > s._sultVarslet) s._sultVarslet = 0;

    /* Byggekø */
    for (i = s.ko.length - 1; i >= 0; i--) {
      if (na >= s.ko[i].slutt) {
        var el = s.ko[i];
        s.ko.splice(i, 1);
        OW.E.fullforBygg(s, el, stille);
      }
    }

    /* Ekspedisjoner */
    for (i = s.ekspedisjoner.length - 1; i >= 0; i--) {
      if (na >= s.ekspedisjoner[i].slutt) {
        var e = s.ekspedisjoner[i];
        s.ekspedisjoner.splice(i, 1);
        OW.E.fullforEkspedisjon(s, e, stille);
      }
    }

    /* Karavaner */
    for (i = s.karavaner.length - 1; i >= 0; i--) {
      if (na >= s.karavaner[i].slutt) {
        var kv = s.karavaner[i];
        s.karavaner.splice(i, 1);
        OW.E.fullforKaravane(s, kv, d, stille);
      }
    }

    OW.E.oppdaterMarked(s);

    /* Hendelser */
    if (!stille && !s.hendelse && na >= s.nesteHendelse) {
      OW.E.trekkHendelse(s);
    }

    /* Daglig krystallbonus for medlemmer */
    if (s.premium.medlem) {
      var idag = new Date().toISOString().slice(0, 10);
      if (s.premium.sisteDagligKrystall !== idag) {
        s.premium.sisteDagligKrystall = idag;
        s.krystall += 3;
        if (!stille) OW.E.varsel('👑 Daglig medlemsbonus: +3 krystaller', 'ok');
      }
    }

    s.stat.spilletid += dt;
    OW.E.sjekkBragder(s, d, stille);
    s.sistTikk = na;
    return d;
  },

  /* Kjører produksjonen for tiden spilleren var borte */
  offline: function (s) {
    var na = Date.now();
    var gaatt = (na - s.sistTikk) / 1000;
    if (gaatt < 30) { s.sistTikk = na; return null; }

    var maks = s.premium.medlem ? 24 * 3600 : 8 * 3600;
    var brukt = Math.min(gaatt, maks);

    var for_ = {};
    for (var i = 0; i < OW.RESSURSER.length; i++) for_[OW.RESSURSER[i].id] = s.res[OW.RESSURSER[i].id];
    var popFor = s.pop, byggFor = s.stat.bygget, handelFor = s.stat.handler, ekspFor = s.stat.ekspedisjoner;

    var igjen = brukt, steg;
    var vakt = 0;
    while (igjen > 0 && vakt < 3000) {
      steg = Math.min(30, igjen);
      OW.E.tikk(s, steg, true);
      igjen -= steg;
      vakt++;
    }
    s.sistTikk = na;
    s.nesteHendelse = na + 45000;

    var diff = {};
    for (var j = 0; j < OW.RESSURSER.length; j++) {
      var r = OW.RESSURSER[j].id;
      var dd = s.res[r] - for_[r];
      if (Math.abs(dd) > 1) diff[r] = dd;
    }
    return {
      sekunder: brukt, kappet: gaatt > maks, gaatt: gaatt,
      res: diff,
      pop: Math.floor(s.pop - popFor),
      bygget: s.stat.bygget - byggFor,
      handler: s.stat.handler - handelFor,
      ekspedisjoner: s.stat.ekspedisjoner - ekspFor
    };
  }
};
