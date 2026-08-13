/* OpenWorld – App: spilløkke, topplinje, faner, modaler og klikk */
window.OW = window.OW || {};

OW.FANER = [
  { id: 'by', navn: 'By', ikon: '🏛️' },
  { id: 'verden', navn: 'Verden', ikon: '🗺️' },
  { id: 'handel', navn: 'Handel', ikon: '⚓' },
  { id: 'forskning', navn: 'Forskning', ikon: '📚' },
  { id: 'oppdrag', navn: 'Oppdrag', ikon: '📜' },
  { id: 'rangering', navn: 'Rangering', ikon: '🏆' },
  { id: 'sesong', navn: 'Sesong', ikon: '🌅' },
  { id: 'butikk', navn: 'Butikk', ikon: '💎' }
];

OW.App = {
  s: null,
  d: null,
  fane: 'by',
  _sisteHtml: {},
  _modalKnapper: [],
  _hendelseVist: null,

  /* --------------------------------------------------------------- START */

  valgtKarakter: OW.KARAKTERER[0].id,

  init: function () {
    var lagret = OW.laste();
    var navnFelt = document.getElementById('navnFelt');
    var fortsett = document.getElementById('fortsettKnapp');
    OW.App.tegnKarakterValg();

    if (lagret) {
      navnFelt.value = lagret.navn;
      fortsett.classList.remove('skjult');
      fortsett.textContent = 'Fortsett som ' + lagret.navn;
      fortsett.onclick = function () { OW.App.startSpill(lagret); };
      document.getElementById('startKnapp').textContent = 'Start på nytt ⚒️';
    }

    document.getElementById('startKnapp').onclick = function () {
      if (lagret && !confirm('Dette sletter det gamle riket «' + lagret.navn + '». Er du sikker?')) return;
      var navn = (navnFelt.value || 'Nyhavn').trim().slice(0, 18) || 'Nyhavn';
      var s = OW.nyTilstand(navn);
      s.karakter = OW.App.valgtKarakter;
      var kar = OW.karakterFor(s);
      OW.E.gi(s, kar.gave);
      OW.E.logg(s, kar.navn + ' grunnla riket ' + navn + '.', kar.ikon);
      OW.App.startSpill(s, true);
    };

    navnFelt.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('startKnapp').click();
    });

    OW.E.varsel = OW.App.toast;
    document.addEventListener('click', OW.App.klikk);
    window.addEventListener('beforeunload', function () { if (OW.App.s) OW.lagre(OW.App.s); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && OW.App.s) OW.App.taIgjen();
    });
  },

  tegnKarakterValg: function () {
    var rute = document.getElementById('karakterValg');
    if (!rute) return;
    var h = '';
    for (var i = 0; i < OW.KARAKTERER.length; i++) {
      var k = OW.KARAKTERER[i];
      h += '<button class="karakter-kort' + (k.id === OW.App.valgtKarakter ? ' valgt' : '') + '" ' +
        'data-akt="velg-karakter" data-id="' + k.id + '" title="' + OW.UI.esc(k.tittel) + '">' +
        '<span class="karakter-ikon">' + k.ikon + '</span>' +
        '<span class="karakter-navn">' + k.navn.split(' ')[0] + '</span></button>';
    }
    rute.innerHTML = h;

    var k2 = OW.KARAKTER_INDEX[OW.App.valgtKarakter];
    document.getElementById('karakterInfo').innerHTML =
      '<div class="karakter-info-topp"><b>' + OW.UI.esc(k2.navn) + '</b>' +
      '<span class="merkelapp gull">' + OW.UI.esc(k2.tittel) + '</span></div>' +
      '<div class="liten">' + OW.UI.esc(k2.tekst) + '</div>' +
      '<div class="karakter-replikk">' + OW.UI.esc(k2.replikk) + '</div>' +
      '<div class="gir"><span>' + k2.trekk + '</span></div>';
  },

  startSpill: function (s, nytt) {
    OW.App.s = s;
    OW.E.oppdaterMarked(s, true);
    OW.Betaling.oppdater(s);

    document.getElementById('oppstart').classList.add('skjult');
    document.getElementById('app').classList.remove('skjult');

    OW.App.tegnFaner();

    /* 3D-byen. Faller pent tilbake til emoji-silhuetten hvis WebGL mangler. */
    OW.App.tre_d = OW.Scene.start(
      document.getElementById('by3dLerret'),
      document.getElementById('by3dEtiketter')
    );
    if (OW.App.tre_d) OW.Scene.velgBygg = OW.App.visBygg;

    if (!nytt) {
      var rap = OW.E.offline(s);
      if (rap && rap.sekunder > 60) OW.App.visOfflineRapport(rap);
    } else {
      OW.App.visVelkomst();
    }

    OW.App.d = OW.E.beregn(s);
    OW.App.tegn(true);

    setInterval(OW.App.steg, 200);
    setInterval(function () { OW.App.tegn(false); }, 400);
    setInterval(function () {
      if (OW.lagre(OW.App.s)) {
        var el = document.getElementById('lagretStatus');
        el.textContent = 'Lagret ' + OW.F.klokke(Date.now());
      }
    }, 10000);
  },

  /* ---------------------------------------------------------------- LØKKE */

  steg: function () {
    var s = OW.App.s;
    if (!s) return;
    var dt = (Date.now() - s.sistTikk) / 1000;
    if (dt > 90) { OW.App.taIgjen(); return; }
    OW.App.d = OW.E.tikk(s, dt, false) || OW.App.d;
    OW.Betaling.oppdater(s);
    if (s.hendelse && OW.App._hendelseVist !== s.hendelse.tid) OW.App.visHendelse();
  },

  taIgjen: function () {
    var s = OW.App.s;
    if (!s) return;
    var rap = OW.E.offline(s);
    if (rap && rap.sekunder > 120) OW.App.visOfflineRapport(rap);
    OW.App.d = OW.E.beregn(s);
    OW.App.tegn(true);
  },

  /* ---------------------------------------------------------------- TEGN */

  tegn: function (tving) {
    var s = OW.App.s, d = OW.App.d;
    if (!s || !d) return;
    if (tving) d = OW.App.d = OW.E.beregn(s);

    var kar = OW.karakterFor(s);
    OW.App.sett('rikeNavn', OW.UI.esc(s.navn), true);
    OW.App.sett('karakterIkon', kar.ikon, true);
    OW.App.sett('by3dHerskerIkon', kar.ikon, true);
    OW.App.sett('by3dHerskerNavn', OW.UI.esc(kar.navn), true);
    OW.App.sett('by3dHerskerTittel', OW.UI.esc(kar.tittel), true);
    OW.App.sett('rikeIkon', OW.EPOKER[s.era].ikon, true);
    OW.App.sett('rikeEra', OW.EPOKER[s.era].navn, true);
    OW.App.sett('krystallTall', OW.F.tall(s.krystall), true);

    /* Ressurser */
    var h = '', i;
    for (i = 0; i < OW.RESSURSER.length; i++) {
      var r = OW.RESSURSER[i];
      if (r.id === 'jern' && s.era < 1 && !s.res.jern) continue;
      if (r.id === 'kunnskap' && s.era < 1 && !s.res.kunnskap) continue;
      var m = s.res[r.id], tak = d.lagerTak[r.id], rate = d.prod[r.id];
      var full = tak !== Infinity && m >= tak - 0.5;
      h += '<div class="pille' + (full ? ' full' : '') + '" title="' + r.navn + (tak !== Infinity ? ' – lager ' + OW.F.hel(tak) : '') + '">' +
        '<span>' + r.ikon + '</span><b>' + OW.F.tall(m) + '</b>' +
        '<span class="rate ' + (rate >= 0 ? 'pos' : 'neg') + '">' + (full ? 'FULLT' : OW.F.rate(rate)) + '</span></div>';
    }
    OW.App.sett('ressurslinje', h);

    /* Statuslinje */
    var st = '';
    st += '<div class="status">👥 <b>' + Math.floor(s.pop) + '</b><span class="stall">/ ' + d.popTak + '</span></div>';
    st += '<div class="status">💛 <b>' + Math.round(d.lykke) + '</b><span class="stall">tilfredshet</span></div>';
    st += '<div class="status">🔧 <b>' + OW.F.pst(d.eff) + '</b><span class="stall">arbeidskraft</span></div>';
    if (d.militaer > 0) st += '<div class="status">⚔️ <b>' + OW.F.tall(d.militaer) + '</b><span class="stall">militær</span></div>';
    st += '<div class="status">🏆 <b>#' + d.rangering + '</b><span class="stall">' + OW.F.tall(d.rikspoeng) + ' poeng</span></div>';
    if (s.premium.medlem) st += '<div class="status">👑 <b>Medlem</b></div>';
    OW.App.sett('statuslinje', st);

    /* Merker på faner */
    var ek = OW.E.eraKrav(s, d);
    var merker = {
      by: ek && ek.ok ? '★' : '',
      oppdrag: OW.E.oppdragKlart(s, d) ? '!' : '',
      sesong: OW.App.sesongKlare(s) || '',
      verden: (s.era >= 1 && !s.ekspedisjoner.length && OW.OMRADER.some(function (o) {
        return !s.omrader[o.id] && o.era <= s.era && OW.E.harRaad(s, o.kost);
      })) ? '•' : ''
    };
    for (i = 0; i < OW.FANER.length; i++) {
      var f = OW.FANER[i], el = document.getElementById('fane-' + f.id);
      if (!el) continue;
      var mk = merker[f.id];
      var vil = mk ? '<span class="merke">' + mk + '</span>' : '';
      if (el.dataset.merke !== String(mk || '')) {
        el.dataset.merke = String(mk || '');
        el.innerHTML = '<span>' + f.ikon + '</span>' + f.navn + vil;
      }
      el.classList.toggle('aktiv', OW.App.fane === f.id);
    }

    /* 3D-byen vises bare i By-fanen, og tegner ikke når den er skjult */
    if (OW.App.tre_d) {
      var vis3d = OW.App.fane === 'by';
      document.getElementById('by3d').classList.toggle('skjult', !vis3d);
      OW.Scene.settSynlig(vis3d);
      if (vis3d) {
        OW.Scene.oppdaterBy(s);
        OW.Scene.settFolk(s.pop, kar);
      }
      OW.App.sett('by3dKo', OW.App.koBrikker(s));
    }

    /* Panel */
    var innhold = '';
    switch (OW.App.fane) {
      case 'by': innhold = OW.UI.faneBy(s, d); break;
      case 'verden': innhold = OW.UI.faneVerden(s, d); break;
      case 'handel': innhold = OW.UI.faneHandel(s, d); break;
      case 'forskning': innhold = OW.UI.faneForskning(s, d); break;
      case 'oppdrag': innhold = OW.UI.faneOppdrag(s, d); break;
      case 'rangering': innhold = OW.UI.faneRangering(s, d); break;
      case 'sesong': innhold = OW.UI.faneSesong(s); break;
      case 'butikk': innhold = OW.UI.faneButikk(s); break;
    }
    OW.App.sett('innhold', innhold);
  },

  /* Kompakte byggekø-brikker som ligger oppå 3D-byen */
  koBrikker: function (s) {
    var na = Date.now(), h = '';
    for (var i = 0; i < s.ko.length; i++) {
      var el = s.ko[i], b = OW.BYGG_INDEX[el.id];
      var tot = (el.slutt - el.start) / 1000, igj = Math.max(0, (el.slutt - na) / 1000);
      h += '<button class="ko-brikke" data-akt="vis-bygg" data-id="' + el.id + '">' +
        '<span class="ko-brikke-ikon">' + b.ikon + '</span>' +
        '<span class="ko-brikke-tekst"><b>' + b.navn + ' ' + el.niva + '</b>' +
        '<i style="width:' + OW.klem((1 - igj / tot) * 100, 0, 100).toFixed(0) + '%"></i></span>' +
        '<span class="ko-brikke-tid">' + OW.F.tid(igj) + '</span></button>';
    }
    return h;
  },

  /* Skriver bare når innholdet faktisk er endret (unngår flimring) */
  sett: function (id, html, tekst) {
    var el = document.getElementById(id);
    if (!el) return;
    if (OW.App._sisteHtml[id] === html) return;
    OW.App._sisteHtml[id] = html;
    if (tekst) el.textContent = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    else el.innerHTML = html;
  },

  sesongKlare: function (s) {
    var niva = OW.E.sesongNiva(s), n = 0;
    for (var i = 1; i <= niva; i++) {
      if (s.sesong.hentet.indexOf(i) < 0) n++;
      if (s.premium.sesongpass && s.sesong.hentetP.indexOf(i) < 0) n++;
    }
    return n ? String(n) : '';
  },

  tegnFaner: function () {
    var h = '';
    for (var i = 0; i < OW.FANER.length; i++) {
      var f = OW.FANER[i];
      h += '<button class="fane" id="fane-' + f.id + '" data-akt="fane" data-fane="' + f.id + '"><span>' + f.ikon + '</span>' + f.navn + '</button>';
    }
    document.getElementById('faner').innerHTML = h;
  },

  /* ---------------------------------------------------------------- KLIKK */

  klikk: function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-akt]') : null;
    if (!el) return;
    var akt = el.dataset.akt;
    var s = OW.App.s, d = OW.App.d;
    var r;

    if (akt === 'modal-knapp') {
      var fn = OW.App._modalKnapper[parseInt(el.dataset.mi, 10)];
      if (fn) fn();
      return;
    }
    if (akt === 'lukk-modal') { OW.App.lukkModal(); return; }
    if (akt === 'velg-karakter') {
      OW.App.valgtKarakter = el.dataset.id;
      OW.App.tegnKarakterValg();
      return;
    }
    if (!s) return;

    switch (akt) {
      case 'fane':
        OW.App.fane = el.dataset.fane;
        OW.App._sisteHtml.innhold = null;
        OW.App.tegn(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'bygg':
        r = OW.E.startBygg(s, d, el.dataset.id);
        if (!r.ok) OW.App.toast(r.grunn, 'feil');
        else OW.App.toast('🔨 ' + r.navn + ' nivå ' + r.niva + ' er satt i gang (' + OW.F.tid(r.sek) + ').');
        OW.App.tegn(true);
        break;

      case 'avbryt':
        OW.E.avbrytBygg(s, parseInt(el.dataset.i, 10));
        OW.App.tegn(true);
        break;

      case 'hastverk':
        if (OW.E.hastverk(s, parseInt(el.dataset.i, 10))) OW.App.toast('💎 Arbeiderne jobber dobbelt så fort!', 'ok');
        OW.App.tegn(true);
        break;

      case 'lei-ko':
        if (s.krystall < OW.KRYSTALL_PRISER.ekstraKoTime) { OW.App.toast('Ikke nok krystaller.', 'feil'); break; }
        s.krystall -= OW.KRYSTALL_PRISER.ekstraKoTime;
        s.leidKoTil = Math.max(Date.now(), s.leidKoTil) + 3600000;
        OW.App.toast('🔨 Ekstra byggeplass leid i én time.', 'ok');
        OW.App.tegn(true);
        break;

      case 'forsk':
        r = OW.E.forsk(s, d, el.dataset.id);
        if (!r.ok) OW.App.toast(r.grunn, 'feil');
        OW.App.tegn(true);
        break;

      case 'eksped':
        r = OW.E.startEkspedisjon(s, d, el.dataset.id);
        if (!r.ok) OW.App.toast(r.grunn, 'feil');
        else OW.App.toast('🧭 Ekspedisjonen er sendt. Hjemme om ' + OW.F.tid(r.sek) + '.');
        OW.App.tegn(true);
        break;

      case 'rute':
        r = OW.E.startKaravane(s, d, el.dataset.id);
        if (!r.ok) OW.App.toast(r.grunn, 'feil');
        else OW.App.toast('🐫 Karavanen er på vei.');
        OW.App.tegn(true);
        break;

      case 'marked':
        var res = el.dataset.res, kjop = el.dataset.kjop === '1';
        var antall = el.dataset.antall === 'maks'
          ? Math.floor(s.res[res])
          : parseInt(el.dataset.antall, 10);
        r = OW.E.handleMarked(s, d, res, antall, kjop);
        OW.App.toast(r.ok ? r.tekst : r.grunn, r.ok ? 'ok' : 'feil');
        OW.App.tegn(true);
        break;

      case 'hent-oppdrag':
        var o = OW.E.hentOppdrag(s, d);
        if (o) OW.App.visOppdragFerdig(o);
        OW.App.tegn(true);
        break;

      case 'sesong':
        var niva = parseInt(el.dataset.niva, 10), prem = el.dataset.p === '1';
        if (OW.E.hentSesong(s, niva, prem)) OW.App.toast('🌅 Sesongbelønning hentet!', 'ok');
        OW.App.tegn(true);
        break;

      case 'velg-laug':
        OW.App.bekreftLaug(el.dataset.id);
        break;

      case 'era-opp':
        var ny = OW.E.avanserEra(s, OW.App.d);
        if (ny) OW.App.visNyEra(ny);
        OW.App.tegn(true);
        break;

      case 'kjop':
        OW.App.bekreftKjop(el.dataset.id);
        break;

      case 'hendelse-valg':
        OW.App.svarHendelse(parseInt(el.dataset.i, 10));
        break;

      case 'vis-bygg': OW.App.visBygg(el.dataset.id); break;

      case 'kamera-inn': OW.Scene._harRort = true; OW.Scene.zoom(0.82); break;
      case 'kamera-ut': OW.Scene._harRort = true; OW.Scene.zoom(1.22); break;
      case 'kamera-null': OW.Scene.nullstillKamera(); break;

      case 'karakterkort':
        OW.App.visKarakter();
        break;

      case 'innstillinger':
        OW.App.visInnstillinger();
        break;
    }
  },

  /* ---------------------------------------------------------- MODAL/TOAST */

  toast: function (tekst, type) {
    var lag = document.getElementById('toaster');
    /* På mobil spiser en stabel med varsler hele skjermen – hold på de nyeste */
    while (lag.children.length >= 3) lag.removeChild(lag.firstChild);
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = tekst;
    lag.appendChild(t);
    setTimeout(function () {
      t.classList.add('ut');
      setTimeout(function () { t.remove(); }, 320);
    }, type === 'bragd' ? 5200 : 3600);
  },

  modal: function (tittel, kropp, knapper) {
    OW.App._modalErHendelse = false;   /* visHendelse setter denne etterpå */
    document.getElementById('modalTittel').innerHTML = tittel;
    document.getElementById('modalKropp').innerHTML = kropp;
    OW.App._modalKnapper = [];
    var h = '';
    (knapper || [{ tekst: 'Lukk' }]).forEach(function (k, i) {
      OW.App._modalKnapper.push(k.fn || OW.App.lukkModal);
      h += '<button class="knapp ' + (k.klasse || '') + '" data-akt="modal-knapp" data-mi="' + i + '">' + k.tekst + '</button>';
    });
    document.getElementById('modalBunn').innerHTML = h;
    document.getElementById('modalLag').classList.remove('skjult');
  },

  lukkModal: function () {
    document.getElementById('modalLag').classList.add('skjult');
    /* Lukker du en hendelse med ✕ uten å velge, teller det som å la den ligge.
       Uten dette ville hendelsen blitt hengende og blokkert alle senere. */
    var s = OW.App.s;
    if (OW.App._modalErHendelse && s && s.hendelse) {
      s.hendelse = null;
      s.nesteHendelse = Date.now() + 90000;
      OW.App.toast('Du lot saken ligge. Rådgiverne sukker.', 'info');
      OW.App.tegn(true);
    }
    OW.App._modalErHendelse = false;
  },

  /* ------------------------------------------------------------- SKJERMER */

  visVelkomst: function () {
    OW.App.modal('🏰 Velkommen til ' + OW.UI.esc(OW.App.s.navn),
      '<p>Du har tolv innbyggere, litt tømmer og et helt kart som venter.</p>' +
      '<div class="kort" style="margin:10px 0"><b>Slik kommer du i gang</b>' +
      '<ul class="punktliste" style="margin-top:8px">' +
      '<li>Bygg <b>Tømmerhogst</b> og <b>Kornåker</b> først — alt annet trenger dem.</li>' +
      '<li><b>Bondehus</b> gir plass til flere innbyggere. Innbyggere er arbeidskraft.</li>' +
      '<li>Går arbeidskraften under 100 %, faller produksjonen. Bygg flere hus.</li>' +
      '<li><b>Rådhuset</b> åpner neste epoke. Følg med på Oppdrag-fanen for veien videre.</li>' +
      '<li>Spillet går videre mens du er borte — opptil 8 timer.</li>' +
      '</ul></div>' +
      '<p class="finstilt">Butikken i spillet er en demo. Ingen ekte betaling skjer noe sted.</p>',
      [{ tekst: 'Sett i gang ⚒️', klasse: 'primar' }]);
  },

  visOfflineRapport: function (rap) {
    var h = '<p>Riket ditt jobbet videre i <b>' + OW.F.tid(rap.sekunder) + '</b>' +
      (rap.kappet ? ' (av ' + OW.F.tid(rap.gaatt) + ' — grensen er ' + (OW.App.s.premium.medlem ? '24' : '8') + ' timer)' : '') + '.</p>';
    var noe = false;
    h += '<div class="kort" style="margin:10px 0">';
    for (var r in rap.res) {
      noe = true;
      h += '<div class="info-rad"><span>' + OW.UI.ressNavn(r).ikon + ' ' + OW.UI.ressNavn(r).navn + '</span><span>' +
        (rap.res[r] > 0 ? '+' : '−') + OW.F.tall(Math.abs(rap.res[r])) + '</span></div>';
    }
    if (rap.pop) { noe = true; h += '<div class="info-rad"><span>👥 Innbyggere</span><span>' + (rap.pop > 0 ? '+' : '−') + Math.abs(rap.pop) + '</span></div>'; }
    if (rap.bygget) h += '<div class="info-rad"><span>🔨 Bygg fullført</span><span>' + rap.bygget + '</span></div>';
    if (rap.handler) h += '<div class="info-rad"><span>🐫 Karavaner hjemme</span><span>' + rap.handler + '</span></div>';
    if (rap.ekspedisjoner) h += '<div class="info-rad"><span>🧭 Områder erobret</span><span>' + rap.ekspedisjoner + '</span></div>';
    if (!noe) h += '<div class="liten">Alt sto stille. Bygg noe som produserer!</div>';
    h += '</div>';
    if (rap.kappet && !OW.App.s.premium.medlem) {
      h += '<p class="finstilt">👑 Medlemskap øker offline-grensen fra 8 til 24 timer.</p>';
    }
    OW.App.modal('🌙 Mens du var borte', h, [{ tekst: 'Fortsett', klasse: 'primar' }]);
  },

  visHendelse: function () {
    var s = OW.App.s;
    var h = null;
    for (var i = 0; i < OW.HENDELSER.length; i++) if (OW.HENDELSER[i].id === s.hendelse.id) h = OW.HENDELSER[i];
    if (!h) { s.hendelse = null; return; }
    OW.App._hendelseVist = s.hendelse.tid;

    var kropp = '<p>' + h.tekst + '</p>';
    var knapper = h.valg.map(function (v, i) {
      var under = [];
      if (v.kost) { for (var r in v.kost) under.push('−' + OW.F.tall(v.kost[r]) + ' ' + r); }
      if (v.krevMilitaer) under.push('krever ' + v.krevMilitaer + ' militær styrke');
      return {
        tekst: v.tekst + (under.length ? '<small>' + under.join(' · ') + '</small>' : ''),
        klasse: 'valgknapp' + (i === 0 ? ' primar' : ''),
        fn: function () { OW.App.svarHendelse(i); }
      };
    });
    OW.App.modal(h.ikon + ' ' + h.tittel, kropp, knapper);
    OW.App._modalErHendelse = true;
  },

  svarHendelse: function (i) {
    var r = OW.E.velgHendelse(OW.App.s, OW.App.d, i);
    OW.App._modalErHendelse = false;
    OW.App.lukkModal();
    if (!r) return;
    if (r.feil) { OW.App.toast(r.feil, 'feil'); OW.App._hendelseVist = null; OW.App.visHendelse(); return; }
    OW.App.toast(r.tekst, 'ok');
    OW.App.tegn(true);
  },

  visOppdragFerdig: function (o) {
    var bel = [];
    for (var r in o.belonning) {
      if (r === 'krystall') bel.push('💎 ' + o.belonning[r] + ' krystaller');
      else if (r === 'sesongXp') bel.push('🌅 ' + o.belonning[r] + ' sesong-XP');
      else bel.push(OW.UI.ressNavn(r).ikon + ' ' + OW.F.tall(o.belonning[r]) + ' ' + r);
    }
    OW.App.modal('🎉 ' + o.tittel,
      '<p class="liten">' + o.kap + '</p>' +
      (o.historie ? '<div class="historie">' + o.historie + '</div>' : '<p>' + o.tekst + '</p>') +
      '<div class="kort" style="margin-top:12px"><b>Belønning</b><div class="gir" style="margin-top:6px"><span>' + bel.join('</span><span>') + '</span></div></div>',
      [{ tekst: 'Videre ➜', klasse: 'primar' }]);
  },

  visNyEra: function (epoke) {
    OW.App.modal(epoke.ikon + ' ' + epoke.navn,
      '<p style="font-size:16px"><b>' + epoke.slagord + '</b></p>' +
      '<div class="historie">' + epoke.intro + '</div>' +
      '<div class="kort" style="margin-top:12px"><b>Nytt i denne epoken</b>' +
      '<ul class="punktliste" style="margin-top:8px">' +
      OW.App.nyheterForEra(epoke) + '</ul></div>' +
      '<div class="gir">+25 💎 krystaller · +150 🌅 sesong-XP</div>',
      [{ tekst: 'Fortsett byggingen', klasse: 'primar' }]);
  },

  nyheterForEra: function (epoke) {
    var idx = OW.EPOKER.indexOf(epoke), ut = '';
    OW.BYGG.forEach(function (b) { if (b.era === idx && b.kat !== 'premium' && b.kat !== 'kosmetikk') ut += '<li>Bygning: <b>' + b.navn + '</b></li>'; });
    OW.TECH.forEach(function (t) { if (t.era === idx) ut += '<li>Forskning: ' + t.navn + '</li>'; });
    OW.OMRADER.forEach(function (o) { if (o.era === idx) ut += '<li>Område: ' + o.navn + '</li>'; });
    OW.RUTER.forEach(function (r) { if (r.era === idx) ut += '<li>Handelsrute: ' + r.navn + '</li>'; });
    if (idx === 2) ut += '<li><b>Rikets vei</b>: velg spesialisering i By-fanen</li>';
    return ut || '<li>Nye muligheter åpner seg.</li>';
  },

  /* Åpnes når du klikker en bygning i 3D-byen */
  visBygg: function (id) {
    var s = OW.App.s, d = OW.App.d, b = OW.BYGG_INDEX[id];
    if (!b) return;
    var niva = OW.E.niva(s, id), iKo = OW.E.iKo(s, id), neste = niva + iKo + 1;
    var last = OW.E.byggLast(s, id);
    var maks = OW.E.maksNiva(id);

    var h = '<div class="kort-tekst">' + b.tekst + '</div>';
    h += '<div class="info-rad"><span>Nivå nå</span><span>' + niva + (iKo ? ' (+' + iKo + ' i kø)' : '') + '</span></div>';
    if (b.unikt) h += '<div class="liten" style="margin:8px 0">✦ ' + b.unikt + '</div>';

    var knapper;
    if (!last.ok) {
      h += '<div class="merkelapp rod" style="margin-top:8px">🔒 ' + last.grunn + '</div>';
      knapper = [{ tekst: 'Lukk' }];
    } else if (neste > maks) {
      h += '<div class="merkelapp gronn" style="margin-top:8px">Maksnivå nådd</div>';
      knapper = [{ tekst: 'Lukk' }];
    } else {
      var kost = OW.E.byggKost(s, id, neste);
      h += '<div class="seksjon-tittel" style="margin:14px 0 8px">Nivå ' + neste + '<span class="strek"></span></div>';
      h += OW.UI.girTekst(b) + OW.UI.kost(s, kost);
      h += '<div class="liten">⏱️ ' + OW.F.tid(OW.E.byggTid(s, d, id, neste)) + '</div>';
      var kan = OW.E.harRaad(s, kost) && s.ko.length < OW.E.koPlasser(s);
      knapper = [
        { tekst: kan ? (niva > 0 ? 'Oppgrader til nivå ' + neste : 'Bygg') : 'Ikke nok til dette ennå',
          klasse: kan ? 'primar' : '',
          fn: function () {
            if (!kan) return;
            var r = OW.E.startBygg(OW.App.s, OW.App.d, id);
            OW.App.lukkModal();
            OW.App.toast(r.ok ? '🔨 ' + r.navn + ' nivå ' + r.niva + ' er satt i gang (' + OW.F.tid(r.sek) + ').' : r.grunn,
              r.ok ? 'ok' : 'feil');
            OW.App.tegn(true);
          } },
        { tekst: 'Lukk' }
      ];
    }
    OW.App.modal(b.ikon + ' ' + b.navn, h, knapper);
  },

  bekreftLaug: function (id) {
    var l = OW.LAUG_INDEX[id];
    OW.App.modal(l.ikon + ' ' + l.navn,
      '<p>' + l.tekst + '</p>' +
      '<p>Dette valget er <b>permanent</b> og gratis. Du kan bare velge én vei gratis — de to andre kan låses opp senere i butikken.</p>',
      [
        { tekst: 'Velg ' + l.navn, klasse: 'primar', fn: function () {
          var r = OW.E.velgGratisLaug(OW.App.s, id);
          OW.App.lukkModal();
          if (!r.ok) OW.App.toast(r.grunn, 'feil');
          else OW.App.toast(l.ikon + ' Riket følger nå ' + l.navn + '!', 'bragd');
          OW.App.tegn(true);
        } },
        { tekst: 'Vent litt' }
      ]);
  },

  bekreftKjop: function (id) {
    var v = OW.BUTIKK_INDEX[id];
    OW.App.modal(v.ikon + ' ' + v.navn,
      '<div class="demo-banner">🧪 Dette er et <b>simulert kjøp</b>. Ingen betaling gjennomføres, og ingen kortopplysninger etterspørres.</div>' +
      '<p>' + v.tekst + '</p><div class="pris">' + v.prisTekst + '</div>',
      [
        { tekst: 'Gjennomfør demo-kjøp', klasse: 'primar', fn: function () {
          OW.Betaling.start(id, function (svar) {
            OW.App.lukkModal();
            if (!svar.ok) { OW.App.toast(svar.grunn, 'feil'); return; }
            var r = OW.Betaling.fullfor(OW.App.s, OW.App.d, id);
            if (!r.ok) { OW.App.toast(r.grunn, 'feil'); return; }
            OW.App.toast(r.melding, 'bragd');
            OW.App.tegn(true);
          });
        } },
        { tekst: 'Avbryt' }
      ]);
  },

  visKarakter: function () {
    var s = OW.App.s, d = OW.App.d, k = OW.karakterFor(s);
    OW.App.modal(k.ikon + ' ' + OW.UI.esc(k.navn),
      '<div class="karakter-info-topp"><span class="merkelapp gull">' + OW.UI.esc(k.tittel) + '</span>' +
      '<span class="merkelapp">Hersker over ' + OW.UI.esc(s.navn) + '</span></div>' +
      '<p>' + OW.UI.esc(k.tekst) + '</p>' +
      '<div class="karakter-replikk">' + OW.UI.esc(k.replikk) + '</div>' +
      '<div class="kort" style="margin-top:12px"><b>Herskerens egenskap</b>' +
      '<div class="gir" style="margin-top:6px"><span>' + k.trekk + '</span></div></div>' +
      '<div class="kort" style="margin-top:10px">' +
      '<div class="info-rad"><span>Epoke</span><span>' + OW.EPOKER[s.era].navn + '</span></div>' +
      '<div class="info-rad"><span>Innbyggere</span><span>' + Math.floor(s.pop) + '</span></div>' +
      '<div class="info-rad"><span>Tilfredshet</span><span>' + Math.round(d.lykke) + ' / 100</span></div>' +
      '<div class="info-rad"><span>Rikspoeng</span><span>' + OW.F.hel(d.rikspoeng) + ' (#' + d.rangering + ')</span></div>' +
      '<div class="info-rad"><span>Regjert i</span><span>' + OW.F.tid((Date.now() - s.opprettet) / 1000) + '</span></div></div>' +
      '<p class="finstilt" style="margin-top:10px">Herskeren går rundt i byen din. Se etter kronen.</p>',
      [{ tekst: 'Tilbake til riket', klasse: 'primar' }]);
  },

  visInnstillinger: function () {
    var s = OW.App.s;
    OW.App.modal('⚙️ Innstillinger',
      '<div class="kort"><div class="info-rad"><span>Rike</span><span>' + OW.UI.esc(s.navn) + '</span></div>' +
      '<div class="info-rad"><span>Epoke</span><span>' + OW.EPOKER[s.era].navn + '</span></div>' +
      '<div class="info-rad"><span>Spilletid</span><span>' + OW.F.tid(s.stat.spilletid) + '</span></div>' +
      '<div class="info-rad"><span>Grunnlagt</span><span>' + new Date(s.opprettet).toLocaleDateString('nb-NO') + '</span></div></div>' +
      '<p class="finstilt" style="margin-top:12px">Spillet lagres automatisk i denne nettleseren. Kopier koden under for å ta med riket til en annen maskin.</p>' +
      '<textarea id="lagringsFelt" rows="3" readonly onclick="this.select()">' + OW.eksporter(s) + '</textarea>' +
      '<p class="finstilt">Lim inn en kode og trykk «Importer» for å laste inn et annet rike.</p>',
      [
        { tekst: '📋 Kopier kode', fn: function () {
          var f = document.getElementById('lagringsFelt');
          f.select();
          try { document.execCommand('copy'); OW.App.toast('Kode kopiert.', 'ok'); }
          catch (e) { OW.App.toast('Kopier manuelt fra feltet.', 'feil'); }
        } },
        { tekst: '📥 Importer', fn: function () {
          try {
            var ny = OW.importer(document.getElementById('lagringsFelt').value);
            OW.App.s = ny; OW.lagre(ny);
            OW.App.lukkModal(); OW.App.taIgjen();
            OW.App.toast('Riket ' + ny.navn + ' er lastet inn.', 'ok');
          } catch (e) { OW.App.toast('Ugyldig kode.', 'feil'); }
        } },
        { tekst: '🗑️ Slett riket', klasse: 'fare', fn: function () {
          if (!confirm('Sletter riket «' + s.navn + '» for alltid. Sikker?')) return;
          OW.slettLagring();
          location.reload();
        } },
        { tekst: 'Lukk' }
      ]);
  }
};

document.addEventListener('DOMContentLoaded', OW.App.init);
