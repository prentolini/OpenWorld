/* OpenWorld – Panelene (én funksjon per fane) */
window.OW = window.OW || {};

OW.UI = {

  /* ------------------------------------------------------------ HJELPERE */

  esc: function (t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  },

  ressNavn: function (r) {
    for (var i = 0; i < OW.RESSURSER.length; i++) if (OW.RESSURSER[i].id === r) return OW.RESSURSER[i];
    return { navn: r, ikon: '•' };
  },

  kost: function (s, kost) {
    var ut = '<div class="kostliste">';
    for (var r in kost) {
      var res = OW.UI.ressNavn(r);
      var mangler = (s.res[r] || 0) < kost[r] ? ' mangler' : '';
      ut += '<span class="kostbit' + mangler + '">' + res.ikon + ' ' + OW.F.tall(kost[r]) + '</span>';
    }
    return ut + '</div>';
  },

  fremdrift: function (pst, klasse) {
    return '<div class="fremdrift ' + (klasse || '') + '"><i style="width:' + OW.klem(pst * 100, 0, 100).toFixed(1) + '%"></i></div>';
  },

  /* Hva neste nivå tilfører */
  girTekst: function (def) {
    var g = def.gir, biter = [];
    if (g.prod) for (var r in g.prod) biter.push(OW.UI.ressNavn(r).ikon + ' +' + OW.F._kort(g.prod[r]) + '/s');
    if (g.popTak) biter.push('👥 +' + g.popTak);
    if (g.lager) biter.push('📦 +' + OW.F.tall(g.lager));
    if (g.lykke) biter.push('💛 +' + g.lykke);
    if (g.militaer) biter.push('⚔️ +' + g.militaer);
    if (g.byggfart) biter.push('🔨 +' + OW.F.pst(g.byggfart));
    if (g.ekspfart) biter.push('🧭 +' + OW.F.pst(g.ekspfart));
    if (g.ruter) biter.push('🐫 +' + g.ruter + ' rute');
    if (g.handelsbonus) biter.push('⚖️ +' + OW.F.pst(g.handelsbonus));
    if (g.forskrabatt) biter.push('📚 −' + OW.F.pst(g.forskrabatt) + ' kost');
    if (g.omradeBonus) biter.push('🗺️ +' + OW.F.pst(g.omradeBonus));
    if (g.globalProd) biter.push('🌍 +' + OW.F.pst(g.globalProd));
    if (g.diplomati) biter.push('🕊️ +' + g.diplomati);
    if (g.matBruk) biter.push('🌾 −' + OW.F._kort(g.matBruk) + '/s');
    return biter.length ? '<div class="gir"><span>' + biter.join('</span><span>') + '</span></div>' : '';
  },

  /* ------------------------------------------------------------------ BY */

  faneBy: function (s, d) {
    var h = '';

    /* Byutsikt i 2D – brukes bare når WebGL ikke er tilgjengelig.
       Ellers står den ekte 3D-byen over dette panelet. */
    /* Med 3D ligger byen over dette panelet, og resten kommer som en skuff */
    if (OW.App && OW.App.tre_d) return '<div class="ark">' + OW.UI.faneByResten(s, d) + '</div>';

    h += '<div class="byutsikt era' + s.era + '"><span class="sol">' + (s.era >= 4 ? '🌇' : '☀️') + '</span><div class="grunn"></div><div class="skyline">';
    var hus = [];
    for (var id in s.bygg) {
      if (!s.bygg[id] || !OW.BYGG_INDEX[id]) continue;
      hus.push({ def: OW.BYGG_INDEX[id], niva: s.bygg[id] });
    }
    hus.sort(function (a, b) { return b.niva - a.niva; });
    if (!hus.length) {
      h += '<div class="liten">Tom slette, frisk luft og uendelige muligheter. Bygg noe.</div>';
    }
    for (var i = 0; i < hus.length; i++) {
      var st = OW.klem(16 + hus[i].niva * 1.6, 16, 40);
      h += '<div class="hus" style="font-size:' + st.toFixed(0) + 'px" title="' + OW.UI.esc(hus[i].def.navn) + ' nivå ' + hus[i].niva + '">' +
        hus[i].def.ikon + '<span class="niv">' + hus[i].niva + '</span></div>';
    }
    h += '</div></div>';
    return h + OW.UI.faneByResten(s, d);
  },

  /* Alt under byutsikten – felles for 2D og 3D */
  faneByResten: function (s, d) {
    var h = '';

    /* Byggekø */
    var plasser = OW.E.koPlasser(s);
    h += '<div class="seksjon-tittel">🔨 Byggekø <small>' + s.ko.length + ' av ' + plasser + ' plasser</small><span class="strek"></span>';
    if (!s.premium.medlem) h += '<button class="knapp mini" data-akt="fane" data-fane="butikk">Flere plasser</button>';
    h += '</div>';

    var na = Date.now();
    for (i = 0; i < s.ko.length; i++) {
      var el = s.ko[i], b = OW.BYGG_INDEX[el.id];
      var total = (el.slutt - el.start) / 1000;
      var igjen = Math.max(0, (el.slutt - na) / 1000);
      var pst = total > 0 ? 1 - igjen / total : 1;
      h += '<div class="ko-rad">' +
        '<div class="kort-ikon">' + b.ikon + '</div>' +
        '<div class="ko-info"><div><b>' + b.navn + '</b> → nivå ' + el.niva + '</div>' +
        OW.UI.fremdrift(pst) +
        '<div class="ko-tid">' + OW.F.tid(igjen) + ' igjen</div></div>' +
        '<button class="knapp mini" data-akt="hastverk" data-i="' + i + '">💎 ' + OW.E.hastverkPris(s, el.slutt) + '</button>' +
        '<button class="ikonknapp" data-akt="avbryt" data-i="' + i + '" title="Avbryt (75 % tilbake)">✕</button>' +
        '</div>';
    }
    for (i = s.ko.length; i < plasser; i++) {
      h += '<div class="tom-plass">Ledig byggeplass</div>';
    }
    if (plasser < 4) {
      var leid = s.leidKoTil > na;
      h += '<div class="tom-plass">' + (leid
        ? '⏳ Leid ekstra plass: ' + OW.F.tid((s.leidKoTil - na) / 1000) + ' igjen'
        : '<button class="knapp mini" data-akt="lei-ko">💎 ' + OW.KRYSTALL_PRISER.ekstraKoTime + ' — lei en ekstra plass i 1 time</button>') + '</div>';
    }

    /* Epokefremgang */
    var ek = OW.E.eraKrav(s, d);
    if (ek) {
      h += '<div class="seksjon-tittel">' + ek.epoke.ikon + ' Neste epoke: ' + ek.epoke.navn + '<span class="strek"></span></div>';
      h += '<div class="kort' + (ek.ok ? ' aksent' : '') + '"><div class="kort-tekst">' + ek.epoke.slagord + '</div>';
      for (i = 0; i < ek.liste.length; i++) {
        var kr = ek.liste[i], ferdig = kr.naa >= kr.mal;
        h += '<div class="mal-rad"><span class="mal-boks' + (ferdig ? ' ok' : '') + '">' + (ferdig ? '✓' : '') + '</span>' +
          '<span style="flex:1">' + kr.tekst + '</span><span class="liten">' + OW.F.tall(Math.min(kr.naa, kr.mal)) + ' / ' + OW.F.tall(kr.mal) + '</span></div>';
      }
      h += '<button class="knapp ' + (ek.ok ? 'primar' : '') + '" style="width:100%;margin-top:8px" data-akt="era-opp"' + (ek.ok ? '' : ' disabled') + '>' +
        (ek.ok ? 'Løft riket til ' + ek.epoke.navn + ' ✨' : 'Kravene er ikke oppfylt ennå') + '</button></div>';
    } else {
      h += '<div class="seksjon-tittel">🌍 Verdensmakt<span class="strek"></span></div>' +
        '<div class="kort aksent"><div class="kort-tekst">Du har nådd toppen av det kjente kartet. Sesonger, nye kart og nye teknologier venter i fremtidige oppdateringer.</div></div>';
    }

    /* Rikets vei (spesialisering) */
    if (s.era >= 2 || s.laug.length) {
      h += '<div class="seksjon-tittel">🧭 Rikets vei<span class="strek"></span><small>Velg én gratis — de andre kan låses opp</small></div>';
      h += '<div class="rute">';
      for (i = 0; i < OW.LAUG.length; i++) {
        var l = OW.LAUG[i], eid = s.laug.indexOf(l.id) >= 0;
        h += '<div class="kort' + (eid ? ' aksent' : '') + '">' +
          '<div class="kort-topp"><div class="kort-ikon">' + l.ikon + '</div><div>' +
          '<div class="kort-navn">' + l.navn + '</div>' +
          '<span class="merkelapp' + (eid ? ' gull' : '') + '">' + (eid ? 'Aktiv' : 'Ikke valgt') + '</span></div></div>' +
          '<div class="kort-tekst">' + l.tekst + '</div>';
        var bon = [];
        if (l.bonus.prodPst) for (var pr in l.bonus.prodPst) bon.push(OW.UI.ressNavn(pr).ikon + ' +' + OW.F.pst(l.bonus.prodPst[pr]));
        if (l.bonus.handelsbonus) bon.push('⚖️ +' + OW.F.pst(l.bonus.handelsbonus) + ' handel');
        if (l.bonus.militaerPst) bon.push('⚔️ +' + OW.F.pst(l.bonus.militaerPst));
        if (l.bonus.forskrabatt) bon.push('📚 −' + OW.F.pst(l.bonus.forskrabatt) + ' forskning');
        if (l.bonus.byggfart) bon.push('🔨 +' + OW.F.pst(l.bonus.byggfart));
        if (l.bonus.ruter) bon.push('🐫 +' + l.bonus.ruter + ' rute');
        h += '<div class="gir"><span>' + bon.join('</span><span>') + '</span></div>';
        if (eid) {
          h += '<div class="liten">Bygningen ' + OW.BYGG_INDEX[l.bygg].navn + ' er tilgjengelig.</div>';
        } else if (!s.gratisLaugBrukt) {
          h += '<button class="knapp primar" style="width:100%" data-akt="velg-laug" data-id="' + l.id + '">Velg denne veien (gratis)</button>';
        } else {
          h += '<button class="knapp" style="width:100%" data-akt="fane" data-fane="butikk">Lås opp i butikken</button>';
        }
        h += '</div>';
      }
      h += '</div>';
    }

    /* Bygninger etter kategori */
    for (var ki = 0; ki < OW.KATEGORIER.length; ki++) {
      var kat = OW.KATEGORIER[ki];
      var liste = OW.BYGG.filter(function (bb) {
        if (bb.kat !== kat.id) return false;
        if (bb.era > s.era + 1) return false;
        if (bb.krevLaug && s.laug.indexOf(bb.krevLaug) < 0) return false;
        if (bb.krevKosmetikk && s.premium.kosmetikk.indexOf(bb.krevKosmetikk) < 0) return false;
        return true;
      });
      if (!liste.length) continue;
      h += '<div class="seksjon-tittel">' + kat.ikon + ' ' + kat.navn + '<span class="strek"></span></div><div class="rute">';
      for (i = 0; i < liste.length; i++) h += OW.UI.byggKort(s, d, liste[i]);
      h += '</div>';
    }

    /* Krønike */
    if (s.logg.length) {
      h += '<div class="seksjon-tittel">📖 Krønike<span class="strek"></span></div><div class="kort">';
      for (i = 0; i < Math.min(12, s.logg.length); i++) {
        h += '<div class="logg-rad"><span>' + s.logg[i].ikon + '</span><span style="flex:1">' + OW.UI.esc(s.logg[i].tekst) + '</span><span class="t">' + OW.F.klokke(s.logg[i].t) + '</span></div>';
      }
      h += '</div>';
    }

    return h;
  },

  byggKort: function (s, d, b) {
    var niva = OW.E.niva(s, b.id);
    var iko = OW.E.iKo(s, b.id);
    var neste = niva + iko + 1;
    var last = OW.E.byggLast(s, b.id);
    var maks = OW.E.maksNiva(b.id);
    var laast = !last.ok;
    var full = neste > maks;

    var h = '<div class="kort' + (laast ? ' dempet' : '') + '">' +
      '<div class="kort-topp"><div class="kort-ikon">' + b.ikon + '</div><div style="flex:1">' +
      '<div class="kort-navn">' + b.navn + '</div>' +
      '<span class="merkelapp' + (niva > 0 ? ' gull' : '') + '">' + (niva > 0 ? 'Nivå ' + niva : 'Ikke bygget') + '</span>' +
      (iko ? ' <span class="merkelapp bla">' + iko + ' i kø</span>' : '') +
      '</div></div>' +
      '<div class="kort-tekst">' + b.tekst + '</div>';

    if (b.unikt) h += '<div class="liten" style="margin-bottom:8px">✦ ' + b.unikt + '</div>';

    if (laast) {
      h += '<span class="merkelapp rod">🔒 ' + last.grunn + '</span></div>';
      return h;
    }
    if (full) {
      h += '<span class="merkelapp gronn">Maksnivå nådd</span></div>';
      return h;
    }

    var kost = OW.E.byggKost(s, b.id, neste);
    var tid = OW.E.byggTid(s, d, b.id, neste);
    h += OW.UI.girTekst(b);
    h += OW.UI.kost(s, kost);
    h += '<div class="liten" style="margin-bottom:8px">⏱️ ' + OW.F.tid(tid) + ' · nivå ' + neste + '</div>';
    var kan = OW.E.harRaad(s, kost) && s.ko.length < OW.E.koPlasser(s);
    h += '<button class="knapp ' + (kan ? 'primar' : '') + '" style="width:100%" data-akt="bygg" data-id="' + b.id + '"' + (kan ? '' : ' disabled') + '>' +
      (s.ko.length >= OW.E.koPlasser(s) ? 'Byggekøen er full' : (niva > 0 ? 'Oppgrader til nivå ' + neste : 'Bygg')) + '</button>';
    return h + '</div>';
  },

  /* -------------------------------------------------------------- VERDEN */

  faneVerden: function (s, d) {
    var h = '', i, na = Date.now();

    h += '<div class="seksjon-tittel">🧭 Ekspedisjoner <small>' + s.ekspedisjoner.length + ' av ' + OW.E.ekspPlasser(s) + ' ute</small><span class="strek"></span></div>';
    if (!s.ekspedisjoner.length) {
      h += '<div class="tom-plass">Ingen ekspedisjoner ute. Kartet fyller ikke seg selv.</div>';
    }
    for (i = 0; i < s.ekspedisjoner.length; i++) {
      var e = s.ekspedisjoner[i], o = OW.OMRADE_INDEX[e.id];
      var tot = (e.slutt - e.start) / 1000, igj = Math.max(0, (e.slutt - na) / 1000);
      h += '<div class="ko-rad"><div class="kort-ikon">' + o.ikon + '</div><div class="ko-info">' +
        '<div><b>' + o.navn + '</b></div>' + OW.UI.fremdrift(tot > 0 ? 1 - igj / tot : 1, 'gronn') +
        '<div class="ko-tid">' + OW.F.tid(igj) + ' igjen</div></div></div>';
    }
    if (OW.E.ekspPlasser(s) === 1) {
      h += '<div class="tom-plass">👑 Medlemmer kan ha to ekspedisjoner ute samtidig.</div>';
    }

    var eid = OW.OMRADER.filter(function (o) { return s.omrader[o.id] === 'eid'; });
    var ledige = OW.OMRADER.filter(function (o) { return !s.omrader[o.id] && o.era <= s.era; });
    var laaste = OW.OMRADER.filter(function (o) { return !s.omrader[o.id] && o.era > s.era; });
    var pagaar = {};
    for (i = 0; i < s.ekspedisjoner.length; i++) pagaar[s.ekspedisjoner[i].id] = true;

    h += '<div class="seksjon-tittel">🗺️ Ukjent land <small>' + ledige.length + ' tilgjengelig</small><span class="strek"></span></div><div class="rute bred">';
    for (i = 0; i < ledige.length; i++) {
      var o2 = ledige[i];
      h += '<div class="kort">' +
        '<div class="kort-topp"><div class="kort-ikon">' + o2.ikon + '</div><div style="flex:1">' +
        '<div class="kort-navn">' + o2.navn + '</div><span class="merkelapp">' + OW.EPOKER[o2.era].navn + '</span></div></div>' +
        '<div class="kort-tekst">' + o2.tekst + '</div>' +
        OW.UI.bonusTekst(o2.bonus, d) +
        OW.UI.kost(s, o2.kost) +
        '<div class="liten" style="margin-bottom:8px">⏱️ ' + OW.F.tid(o2.tid / (1 + d.ekspfart)) + '</div>';
      if (pagaar[o2.id]) {
        h += '<button class="knapp" style="width:100%" disabled>Ekspedisjon underveis</button>';
      } else {
        var kan = OW.E.harRaad(s, o2.kost) && s.ekspedisjoner.length < OW.E.ekspPlasser(s);
        h += '<button class="knapp ' + (kan ? 'primar' : '') + '" style="width:100%" data-akt="eksped" data-id="' + o2.id + '"' + (kan ? '' : ' disabled') + '>Send ekspedisjon</button>';
      }
      h += '</div>';
    }
    if (!ledige.length) h += '<div class="tom-plass">Alt innen rekkevidde er ditt. Nå epoken din videre for å se lenger.</div>';
    h += '</div>';

    if (eid.length) {
      h += '<div class="seksjon-tittel">🚩 Ditt rike <small>' + eid.length + ' områder · +' + OW.F.pst(d.omradeBonus) + ' ekstra utbytte</small><span class="strek"></span></div><div class="rute">';
      for (i = 0; i < eid.length; i++) {
        h += '<div class="kort aksent"><div class="kort-topp"><div class="kort-ikon">' + eid[i].ikon + '</div><div>' +
          '<div class="kort-navn">' + eid[i].navn + '</div><span class="merkelapp gull">Erobret</span></div></div>' +
          OW.UI.bonusTekst(eid[i].bonus, d) + '</div>';
      }
      h += '</div>';
    }

    if (laaste.length) {
      h += '<div class="seksjon-tittel">🔒 Bortenfor horisonten<span class="strek"></span></div><div class="rute">';
      for (i = 0; i < Math.min(3, laaste.length); i++) {
        h += '<div class="kort dempet"><div class="kort-topp"><div class="kort-ikon">' + laaste[i].ikon + '</div><div>' +
          '<div class="kort-navn">' + laaste[i].navn + '</div>' +
          '<span class="merkelapp rod">Krever ' + OW.EPOKER[laaste[i].era].navn + '</span></div></div></div>';
      }
      h += '</div>';
    }
    return h;
  },

  bonusTekst: function (bon, d) {
    var biter = [], mult = 1 + (d ? d.omradeBonus : 0);
    for (var k in bon) {
      if (k === 'prodPst') { for (var r in bon.prodPst) biter.push(OW.UI.ressNavn(r).ikon + ' +' + OW.F.pst(bon.prodPst[r] * mult)); }
      else if (k === 'lykke') biter.push('💛 +' + Math.round(bon.lykke * mult));
      else if (k === 'ruter') biter.push('🐫 +' + bon.ruter + ' rute');
      else if (k === 'militaerPst') biter.push('⚔️ +' + OW.F.pst(bon.militaerPst * mult));
      else if (k === 'handelsbonus') biter.push('⚖️ +' + OW.F.pst(bon.handelsbonus * mult));
      else if (k === 'globalProd') biter.push('🌍 +' + OW.F.pst(bon.globalProd * mult));
      else if (k === 'omradeBonus') biter.push('🗂️ +' + OW.F.pst(bon.omradeBonus));
      else if (k === 'popTakPst') biter.push('👥 +' + OW.F.pst(bon.popTakPst * mult));
    }
    return '<div class="gir"><span>' + biter.join('</span><span>') + '</span></div>';
  },

  /* -------------------------------------------------------------- HANDEL */

  faneHandel: function (s, d) {
    var h = '', i, na = Date.now();

    /* Karavaner */
    h += '<div class="seksjon-tittel">🐫 Handelsruter <small>' + s.karavaner.length + ' av ' + d.ruterMaks + ' i bruk · +' + OW.F.pst(d.handelsbonus) + ' gevinst</small><span class="strek"></span></div>';
    for (i = 0; i < s.karavaner.length; i++) {
      var k = s.karavaner[i], r = OW.RUTE_INDEX[k.id];
      var tot = (k.slutt - k.start) / 1000, igj = Math.max(0, (k.slutt - na) / 1000);
      h += '<div class="ko-rad"><div class="kort-ikon">' + r.ikon + '</div><div class="ko-info">' +
        '<div><b>' + r.navn + '</b></div>' + OW.UI.fremdrift(tot > 0 ? 1 - igj / tot : 1, 'bla') +
        '<div class="ko-tid">' + OW.F.tid(igj) + ' igjen</div></div></div>';
    }
    if (!s.karavaner.length) h += '<div class="tom-plass">Ingen karavaner ute. Varer som ligger stille tjener ingenting.</div>';

    h += '<div class="rute bred">';
    var ruter = OW.RUTER.filter(function (rr) { return rr.era <= s.era; });
    for (i = 0; i < ruter.length; i++) {
      var ru = ruter[i];
      var utBiter = [];
      for (var res in ru.ut) utBiter.push(OW.UI.ressNavn(res).ikon + ' ' + OW.F.tall(Math.round(ru.ut[res] * (1 + d.handelsbonus))));
      h += '<div class="kort"><div class="kort-topp"><div class="kort-ikon">' + ru.ikon + '</div><div style="flex:1">' +
        '<div class="kort-navn">' + ru.navn + '</div><span class="merkelapp">⏱️ ' + OW.F.tid(ru.tid) + '</span></div></div>' +
        '<div class="kort-tekst">' + ru.tekst + '</div>' +
        '<div class="liten">Sender:</div>' + OW.UI.kost(s, ru.inn) +
        '<div class="gir"><span>Hjem med: ' + utBiter.join('</span><span>') + '</span></div>';
      var kan = OW.E.harRaad(s, ru.inn) && s.karavaner.length < d.ruterMaks;
      h += '<button class="knapp ' + (kan ? 'primar' : '') + '" style="width:100%" data-akt="rute" data-id="' + ru.id + '"' + (kan ? '' : ' disabled') + '>' +
        (s.karavaner.length >= d.ruterMaks ? 'Ingen ledige ruter' : 'Send karavane') + '</button></div>';
    }
    h += '</div>';

    /* Markedet */
    var sek = Math.max(0, (s.marked.nesteSkift - na) / 1000);
    h += '<div class="seksjon-tittel">🏪 Markedet <small>nye priser om ' + OW.F.tid(sek) + '</small><span class="strek"></span></div>';
    if (s.era < 1) {
      h += '<div class="tom-plass">Markedet åpner når landsbyen blir en by.</div>';
      return h;
    }
    h += '<div class="rute">';
    var handelbare = ['tre', 'stein', 'mat', 'jern', 'kunnskap'];
    for (i = 0; i < handelbare.length; i++) {
      var rid = handelbare[i], info = OW.UI.ressNavn(rid);
      var kjop = OW.E.kjopPris(s, rid), selg = OW.E.selgPris(s, d, rid);
      var basis = { tre: 1.0, stein: 1.1, mat: 0.8, jern: 3.2, kunnskap: 9 }[rid];
      var trend = (s.marked.priser[rid] || basis) / basis;
      var merke = trend > 1.15 ? '<span class="merkelapp gronn">📈 Høy pris</span>'
        : trend < 0.85 ? '<span class="merkelapp rod">📉 Lav pris</span>'
          : '<span class="merkelapp">Stabil</span>';
      h += '<div class="kort"><div class="kort-topp"><div class="kort-ikon">' + info.ikon + '</div><div style="flex:1">' +
        '<div class="kort-navn">' + info.navn + '</div>' + merke + '</div>' +
        '<div style="text-align:right"><div class="liten">Kjøp</div><b>' + kjop.toFixed(2).replace('.', ',') + '</b>' +
        '<div class="liten" style="margin-top:4px">Selg</div><b>' + selg.toFixed(2).replace('.', ',') + '</b></div></div>' +
        '<div class="liten">Du har ' + OW.F.tall(s.res[rid]) + '</div>' +
        '<div class="knapperad" style="margin-top:8px">' +
        '<button class="knapp mini" data-akt="marked" data-res="' + rid + '" data-kjop="1" data-antall="100">Kjøp 100</button>' +
        '<button class="knapp mini" data-akt="marked" data-res="' + rid + '" data-kjop="1" data-antall="1000">Kjøp 1k</button>' +
        '<button class="knapp mini gronn" data-akt="marked" data-res="' + rid + '" data-kjop="0" data-antall="100">Selg 100</button>' +
        '<button class="knapp mini gronn" data-akt="marked" data-res="' + rid + '" data-kjop="0" data-antall="maks">Selg alt</button>' +
        '</div></div>';
    }
    return h + '</div>';
  },

  /* ----------------------------------------------------------- FORSKNING */

  faneForskning: function (s, d) {
    var h = '<div class="kort" style="margin-bottom:12px">' +
      '<div class="info-rad"><span>📜 Kunnskap</span><span>' + OW.F.tall(s.res.kunnskap) + ' (' + OW.F.rate(d.prod.kunnskap) + ')</span></div>' +
      '<div class="info-rad"><span>Fullført</span><span>' + d.techAntall + ' av ' + OW.TECH.length + '</span></div>' +
      '<div class="info-rad"><span>Rabatt</span><span>−' + OW.F.pst(Math.min(0.6, d.forskrabatt)) + '</span></div></div>';

    for (var e = 0; e <= Math.min(OW.EPOKER.length - 1, s.era); e++) {
      var liste = OW.TECH.filter(function (t) { return t.era === e; });
      if (!liste.length) continue;
      var ferdig = liste.filter(function (t) { return s.tech[t.id]; }).length;
      h += '<div class="seksjon-tittel">' + OW.EPOKER[e].ikon + ' ' + OW.EPOKER[e].navn + ' <small>' + ferdig + '/' + liste.length + '</small><span class="strek"></span></div><div class="rute">';
      for (var i = 0; i < liste.length; i++) {
        var t = liste[i], harDen = !!s.tech[t.id];
        var last = OW.E.techLast(s, t.id);
        var kost = OW.E.techKost(s, d, t.id);
        h += '<div class="kort' + (harDen ? ' aksent' : (last.ok ? '' : ' dempet')) + '">' +
          '<div class="kort-topp"><div class="kort-ikon">' + t.ikon + '</div><div style="flex:1">' +
          '<div class="kort-navn">' + t.navn + '</div>' +
          (harDen ? '<span class="merkelapp gull">✓ Fullført</span>' : '<span class="merkelapp">📜 ' + OW.F.tall(kost) + '</span>') +
          '</div></div><div class="kort-tekst">' + t.tekst + '</div>' +
          OW.UI.bonusTekst(t.bonus, null) + OW.UI.techEkstra(t);
        if (!harDen) {
          if (!last.ok) h += '<span class="merkelapp rod">🔒 ' + last.grunn + '</span>';
          else {
            var kan = s.res.kunnskap >= kost;
            h += '<button class="knapp ' + (kan ? 'primar' : '') + '" style="width:100%" data-akt="forsk" data-id="' + t.id + '"' + (kan ? '' : ' disabled') + '>' +
              (kan ? 'Forsk fram' : 'Mangler ' + OW.F.tall(kost - s.res.kunnskap) + ' kunnskap') + '</button>';
          }
        }
        h += '</div>';
      }
      h += '</div>';
    }
    return h;
  },

  techEkstra: function (t) {
    var b = t.bonus, biter = [];
    if (b.byggfart) biter.push('🔨 +' + OW.F.pst(b.byggfart) + ' byggefart');
    if (b.ekspfart) biter.push('🧭 +' + OW.F.pst(b.ekspfart) + ' ekspedisjonsfart');
    if (b.lagerPst) biter.push('📦 +' + OW.F.pst(b.lagerPst) + ' lager');
    if (b.forskrabatt) biter.push('📚 −' + OW.F.pst(b.forskrabatt) + ' forskningskost');
    if (b.diplomati) biter.push('🕊️ +' + b.diplomati + ' diplomati');
    return biter.length ? '<div class="gir"><span>' + biter.join('</span><span>') + '</span></div>' : '';
  },

  /* ------------------------------------------------------------- OPPDRAG */

  faneOppdrag: function (s, d) {
    var h = '', i;
    var o = OW.E.aktivtOppdrag(s);

    if (o) {
      var klart = OW.E.oppdragKlart(s, d);
      h += '<div class="seksjon-tittel">📜 ' + o.kap + '<span class="strek"></span></div>';
      h += '<div class="kort' + (klart ? ' aksent' : '') + '">' +
        '<div class="kort-topp"><div class="kort-ikon">' + o.ikon + '</div><div style="flex:1">' +
        '<div class="kort-navn">' + o.tittel + '</div>' +
        '<span class="merkelapp">Oppdrag ' + (s.oppdrag.indeks + 1) + ' av ' + OW.OPPDRAG.length + '</span></div></div>' +
        '<div class="kort-tekst">' + o.tekst + '</div>';
      for (i = 0; i < o.mal.length; i++) {
        var st = OW.E.malStatus(s, d, o.mal[i]);
        h += '<div class="mal-rad"><span class="mal-boks' + (st.ok ? ' ok' : '') + '">' + (st.ok ? '✓' : '') + '</span>' +
          '<span style="flex:1">' + OW.E.malTekst(o.mal[i]) + '</span>' +
          '<span class="liten">' + OW.F.tall(Math.min(st.naa, st.mal)) + ' / ' + OW.F.tall(st.mal) + '</span></div>';
      }
      var bel = [];
      for (var r in o.belonning) {
        if (r === 'krystall') bel.push('💎 ' + o.belonning[r]);
        else if (r === 'sesongXp') bel.push('🌅 ' + o.belonning[r] + ' XP');
        else bel.push(OW.UI.ressNavn(r).ikon + ' ' + OW.F.tall(o.belonning[r]));
      }
      h += '<div class="gir" style="margin-top:10px"><span>Belønning: ' + bel.join('</span><span>') + '</span></div>' +
        '<button class="knapp ' + (klart ? 'primar' : '') + '" style="width:100%" data-akt="hent-oppdrag"' + (klart ? '' : ' disabled') + '>' +
        (klart ? 'Hent belønning 🎉' : 'Ikke fullført ennå') + '</button></div>';
    } else {
      h += '<div class="kort aksent"><div class="kort-navn">📜 Historien er fortalt — foreløpig</div>' +
        '<div class="kort-tekst">Du har fullført alle kapitlene som finnes i denne versjonen. Nye sesonger tar med seg nye kapitler.</div></div>';
    }

    /* Fullførte kapitler med historietekst */
    if (s.oppdrag.indeks > 0) {
      h += '<div class="seksjon-tittel">📖 Fullførte kapitler <small>' + s.oppdrag.indeks + '</small><span class="strek"></span></div><div class="kort">';
      for (i = s.oppdrag.indeks - 1; i >= 0 && i >= s.oppdrag.indeks - 6; i--) {
        var f = OW.OPPDRAG[i];
        h += '<div class="logg-rad"><span>' + f.ikon + '</span><span style="flex:1"><b>' + f.tittel + '</b><br><span class="liten">' + f.kap + '</span></span><span class="t">✓</span></div>';
        if (f.historie) h += '<div class="historie">' + f.historie + '</div>';
      }
      h += '</div>';
    }

    /* Bragder */
    var tatt = s.bragder.length;
    h += '<div class="seksjon-tittel">🏅 Bragder <small>' + tatt + ' av ' + OW.BRAGDER.length + '</small><span class="strek"></span></div><div class="rute">';
    for (i = 0; i < OW.BRAGDER.length; i++) {
      var b = OW.BRAGDER[i], har = s.bragder.indexOf(b.id) >= 0;
      h += '<div class="kort' + (har ? ' aksent' : ' dempet') + '" style="padding:10px">' +
        '<div class="kort-topp" style="margin:0"><div class="kort-ikon" style="width:34px;height:34px;font-size:18px">' + (har ? b.ikon : '🔒') + '</div>' +
        '<div style="flex:1"><div class="kort-navn" style="font-size:13.5px">' + b.navn + '</div>' +
        '<div class="liten">' + b.tekst + '</div></div>' +
        '<div class="liten" style="white-space:nowrap">💎 ' + b.krystall + '</div></div></div>';
    }
    return h + '</div>';
  },

  /* ----------------------------------------------------------- RANGERING */

  faneRangering: function (s, d) {
    var h = '<div class="kort" style="margin-bottom:14px">' +
      '<div class="kort-topp"><div class="kort-ikon">🏆</div><div style="flex:1">' +
      '<div class="kort-navn">Riksmesterskapet</div>' +
      '<div class="liten">Rivalene vokser hver dag. Rikspoengene dine avgjør plasseringen.</div></div>' +
      '<div style="text-align:right"><div class="liten">Din plass</div><div style="font-size:24px;font-weight:800;color:var(--gull)">#' + d.rangering + '</div></div></div></div>';

    for (var i = 0; i < d.tavle.length; i++) {
      var t = d.tavle[i];
      h += '<div class="tavle-rad' + (t.spiller ? ' meg' : '') + '">' +
        '<div class="tavle-plass">' + (i === 0 ? '👑' : i + 1) + '</div>' +
        '<div class="kort-ikon" style="width:34px;height:34px;font-size:18px">' + t.ikon + '</div>' +
        '<div class="tavle-navn"><b>' + OW.UI.esc(t.navn) + '</b><div class="liten">' + t.tone + '</div></div>' +
        '<div class="tavle-poeng">' + OW.F.tall(t.poeng) + '</div></div>';
    }

    var krigsbonus = OW.E.niva(s, 'krigsakademi') > 0 ? 3 : 1.5;
    h += '<div class="seksjon-tittel">📊 Slik regnes rikspoengene<span class="strek"></span></div><div class="kort">' +
      OW.UI.poengRad('🏗️ Bygningsnivåer', d.byggNivaTotalt + ' × 12', d.byggNivaTotalt * 12) +
      OW.UI.poengRad('🗺️ Områder', d.omraderEid + ' × 400', d.omraderEid * 400) +
      OW.UI.poengRad('📚 Forskning', d.techAntall + ' × 250', d.techAntall * 250) +
      OW.UI.poengRad('👑 Epoke', OW.EPOKER[s.era].navn, s.era * 1500) +
      OW.UI.poengRad('⚔️ Militær' + (krigsbonus > 1.5 ? ' (dobbel — krigsakademi)' : ''), OW.F.tall(d.militaer) + ' × ' + krigsbonus, Math.floor(d.militaer * krigsbonus)) +
      OW.UI.poengRad('👥 Innbyggere', Math.floor(s.pop) + ' × 0,4', Math.floor(s.pop * 0.4)) +
      OW.UI.poengRad('🐫 Handelsruter', '√' + s.stat.handler + ' × 60', Math.floor(Math.sqrt(s.stat.handler) * 60)) +
      OW.UI.poengRad('🕊️ Diplomati', Math.floor(d.diplomati) + ' × 25', Math.floor(d.diplomati * 25)) +
      '<div class="info-rad" style="border:0;margin-top:6px"><b>Totalt</b><b>' + OW.F.hel(d.rikspoeng) + '</b></div></div>';

    h += '<div class="seksjon-tittel">📈 Rikets tall<span class="strek"></span></div><div class="kort">' +
      '<div class="info-rad"><span>Tilfredshet</span><span>' + Math.round(d.lykke) + ' / 100 (gullinntekt ×' + d.lykkeFaktor.toFixed(2).replace('.', ',') + ')</span></div>' +
      '<div class="info-rad"><span>Arbeidere</span><span>' + Math.floor(s.pop) + ' av ' + d.arbeiderBehov + ' behov (' + OW.F.pst(d.eff) + ' effektivitet)</span></div>' +
      '<div class="info-rad"><span>Global produksjonsbonus</span><span>+' + OW.F.pst(d.globalProd) + '</span></div>' +
      '<div class="info-rad"><span>Byggefart</span><span>+' + OW.F.pst(d.byggfart) + '</span></div>' +
      '<div class="info-rad"><span>Bygninger fullført</span><span>' + s.stat.bygget + '</span></div>' +
      '<div class="info-rad"><span>Handelsruter fullført</span><span>' + s.stat.handler + '</span></div>' +
      '<div class="info-rad"><span>Hendelser avgjort</span><span>' + s.stat.hendelser + '</span></div>' +
      '<div class="info-rad"><span>Spilletid</span><span>' + OW.F.tid(s.stat.spilletid) + '</span></div></div>';
    return h;
  },

  poengRad: function (navn, forklaring, verdi) {
    return '<div class="info-rad"><span>' + navn + ' <span class="liten">' + forklaring + '</span></span><span>' + OW.F.hel(verdi) + '</span></div>';
  },

  /* -------------------------------------------------------------- SESONG */

  faneSesong: function (s) {
    var niva = OW.E.sesongNiva(s);
    var fm = OW.E.sesongFremdrift(s);
    var h = '<div class="kort aksent" style="margin-bottom:14px">' +
      '<div class="kort-topp"><div class="kort-ikon">' + OW.SESONG.ikon + '</div><div style="flex:1">' +
      '<div class="kort-navn">' + OW.SESONG.navn + '</div><div class="liten">' + OW.SESONG.tekst + '</div></div>' +
      '<div style="text-align:right"><div class="liten">Nivå</div><div style="font-size:24px;font-weight:800;color:var(--gull)">' + niva + '</div></div></div>' +
      OW.UI.fremdrift(fm.iNiva / fm.trengs, 'lilla') +
      '<div class="liten" style="margin-top:6px">' + (fm.ferdig ? 'Maks nivå nådd!' : fm.iNiva + ' / ' + fm.trengs + ' XP til neste nivå') +
      ' · XP tjenes ved å bygge, forske, handle, utforske og fullføre oppdrag.</div></div>';

    if (!s.premium.sesongpass) {
      h += '<div class="demo-banner">🌅 <b>Sesongpasset</b> låser opp premium-sporet — alle 25 nivåene kan spilles gratis uansett. ' +
        '<button class="knapp mini" data-akt="fane" data-fane="butikk">Se i butikken</button></div>';
    }

    h += '<div class="sesong-rad"><div class="sesong-niv liten">Nivå</div>' +
      '<div class="belonning"><b>Gratis</b></div><div class="belonning premium"><b>Sesongpass</b></div></div>';

    for (var i = 1; i <= OW.SESONG.nivaer; i++) {
      var b = OW.SESONG_BELONNING[i - 1];
      var naadd = niva >= i;
      var tattG = s.sesong.hentet.indexOf(i) >= 0;
      var tattP = s.sesong.hentetP.indexOf(i) >= 0;
      h += '<div class="sesong-rad">' +
        '<div class="sesong-niv' + (naadd ? ' naadd' : '') + '">' + i + '</div>' +
        '<div class="belonning' + (tattG ? ' hentet' : '') + '"><span>' + b.gratis.tekst + '</span>' +
        (tattG ? '<span class="liten">✓</span>' : (naadd ? '<button class="knapp mini primar" data-akt="sesong" data-niva="' + i + '" data-p="0">Hent</button>' : '<span class="liten">🔒</span>')) + '</div>' +
        '<div class="belonning premium' + (tattP ? ' hentet' : '') + '"><span>' + b.premium.tekst + '</span>' +
        (tattP ? '<span class="liten">✓</span>'
          : (!s.premium.sesongpass ? '<span class="liten">🔒 Pass</span>'
            : (naadd ? '<button class="knapp mini primar" data-akt="sesong" data-niva="' + i + '" data-p="1">Hent</button>' : '<span class="liten">🔒</span>'))) +
        '</div></div>';
    }
    return h;
  },

  /* -------------------------------------------------------------- BUTIKK */

  faneButikk: function (s) {
    var h = '<div class="demo-banner">🧪 <b>Demo-butikk.</b> Ingen ekte betaling skjer — alle kjøp er simulerte og lagres bare i denne nettleseren. ' +
      'Prisene viser hvordan en ferdig versjon kunne sett ut.</div>';

    /* Aktive goder */
    var aktive = [];
    if (s.premium.medlem) aktive.push('👑 Medlemskap');
    if (s.premium.sesongpass) aktive.push('🌅 Sesongpass');
    if (s.kjopteKoer) aktive.push('🔨 +' + s.kjopteKoer + ' byggekø');
    for (var i = 0; i < s.laug.length; i++) aktive.push(OW.LAUG_INDEX[s.laug[i]].ikon + ' ' + OW.LAUG_INDEX[s.laug[i]].navn);
    for (i = 0; i < s.premium.kosmetikk.length; i++) aktive.push('✨ ' + s.premium.kosmetikk[i]);
    if (aktive.length) {
      h += '<div class="kort" style="margin-bottom:14px"><div class="kort-navn">Aktive goder</div>' +
        '<div class="gir" style="margin-top:8px"><span>' + aktive.join('</span><span>') + '</span></div></div>';
    }

    h += '<div class="kort" style="margin-bottom:14px"><div class="kort-navn">⚖️ Slik holder vi økonomien hel</div>' +
      '<ul class="punktliste">' +
      '<li>Vi selger valg, komfort og spesialisering — ikke seier.</li>' +
      '<li>Alt av innhold kan nås gratis; premium gir andre veier, ikke bare raskere.</li>' +
      '<li>Ressurskjøp har døgngrense og skalerer med rikets størrelse.</li>' +
      '<li>Krystaller kan tjenes gratis gjennom oppdrag, bragder og sesong.</li>' +
      '</ul></div>';

    h += '<div class="rute bred">';
    for (i = 0; i < OW.BUTIKK.length; i++) {
      var v = OW.BUTIKK[i];
      var sjekk = OW.Betaling.kanKjope(s, v.id);
      h += '<div class="kort' + (v.type === 'abonnement' || v.type === 'sesong' ? ' aksent' : '') + '">' +
        '<div class="kort-topp"><div class="kort-ikon">' + v.ikon + '</div><div style="flex:1">' +
        '<div class="kort-navn">' + v.navn + '</div><span class="merkelapp lilla">' + v.prisTekst + '</span></div></div>' +
        '<div class="kort-tekst">' + v.tekst + '</div><ul class="punktliste">';
      for (var j = 0; j < v.punkter.length; j++) h += '<li>' + v.punkter[j] + '</li>';
      h += '</ul>';
      if (sjekk.ok) {
        h += '<button class="knapp primar" style="width:100%" data-akt="kjop" data-id="' + v.id + '">Kjøp (demo) · ' + v.prisTekst + '</button>';
      } else {
        h += '<button class="knapp" style="width:100%" disabled>' + sjekk.grunn + '</button>';
      }
      h += '</div>';
    }
    return h + '</div>';
  }
};
