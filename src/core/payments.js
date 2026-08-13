/* OpenWorld – Kjøpslag (DEMO)
 *
 * ⚠️  Ingenting her koster ekte penger. Alle kjøp er simulerte og lagres
 *     kun i nettleseren din.
 *
 * Slik ville en ekte løsning sett ut:
 *   1. Klienten ber serveren om en betalingsøkt (Stripe Checkout / Vipps / app-butikk).
 *   2. Brukeren betaler hos betalingsleverandøren.
 *   3. Leverandøren sender en webhook til DIN server.
 *   4. Serveren verifiserer signaturen og skriver rettigheten i databasen.
 *   5. Klienten henter rettighetene fra serveren ved oppstart.
 *
 * Rettigheter må ALDRI avgjøres i klienten i et ekte spill – da kan de forfalskes.
 * OW.Betaling.start() nedenfor er punktet der steg 1 hører hjemme.
 */
window.OW = window.OW || {};

OW.Betaling = {
  DEMO: true,

  /* Her ville du kalt din egen backend for å opprette en betalingsøkt. */
  start: function (varId, ferdig) {
    if (OW.Betaling.DEMO) { ferdig({ ok: true, demo: true }); return; }
    /* Eksempel på ekte flyt:
       fetch('/api/kjop', { method:'POST', body: JSON.stringify({ vare: varId }) })
         .then(r => r.json())
         .then(d => { window.location = d.checkoutUrl; });
    */
    ferdig({ ok: false, grunn: 'Betalingsleverandør er ikke koblet til.' });
  },

  idag: function () { return new Date().toISOString().slice(0, 10); },

  /* Kan varen kjøpes nå? */
  kanKjope: function (s, varId) {
    var v = OW.BUTIKK_INDEX[varId];
    if (!v) return { ok: false, grunn: 'Ukjent vare' };
    if (v.type === 'abonnement' && s.premium.medlem) return { ok: false, grunn: 'Du er allerede medlem' };
    if (v.type === 'sesong' && s.premium.sesongpass) return { ok: false, grunn: 'Sesongpasset er ditt' };
    if (v.type === 'permanent' && s.kjopteKoer >= 1) return { ok: false, grunn: 'Allerede kjøpt' };
    if (v.type === 'laug') {
      if (s.laug.indexOf(v.laug) >= 0) return { ok: false, grunn: 'Du har allerede dette lauget' };
      if (s.era < 2) return { ok: false, grunn: 'Åpnes i epoken Kongerike' };
    }
    if (v.type === 'kosmetikk' && s.premium.kosmetikk.indexOf(v.kosmetikk) >= 0) return { ok: false, grunn: 'Allerede låst opp' };
    if (v.daglig) {
      if (s.premium.kjopDagbok[varId] === OW.Betaling.idag()) {
        return { ok: false, grunn: 'Grensen er nådd i dag — kom tilbake i morgen' };
      }
    }
    return { ok: true };
  },

  /* Utfører kjøpet lokalt (demo). I et ekte spill gjør serveren dette. */
  fullfor: function (s, d, varId) {
    var sjekk = OW.Betaling.kanKjope(s, varId);
    if (!sjekk.ok) return { ok: false, grunn: sjekk.grunn };
    var v = OW.BUTIKK_INDEX[varId];
    var melding = '';

    switch (v.type) {
      case 'abonnement':
        s.premium.medlem = true;
        s.premium.medlemTil = Date.now() + 30 * 86400000;
        s.premium.sisteDagligKrystall = '';
        melding = '👑 Rikskansler-medlemskap aktivert i 30 dager. Ekstra byggekø, +10 % produksjon og lengre offline-inntekt.';
        break;

      case 'sesong':
        s.premium.sesongpass = true;
        melding = '🌅 Sesongpasset er ditt. Premium-belønningene kan hentes for nivåene du allerede har nådd.';
        break;

      case 'laug':
        if (s.laug.indexOf(v.laug) < 0) s.laug.push(v.laug);
        if (s.premium.kjopteLaug.indexOf(v.laug) < 0) s.premium.kjopteLaug.push(v.laug);
        melding = OW.LAUG_INDEX[v.laug].ikon + ' ' + OW.LAUG_INDEX[v.laug].navn + ' er åpnet. En helt ny vei ligger foran riket.';
        break;

      case 'permanent':
        s.kjopteKoer += 1;
        melding = '🔨 Permanent ekstra byggekø lagt til.';
        break;

      case 'kosmetikk':
        s.premium.kosmetikk.push(v.kosmetikk);
        melding = v.ikon + ' ' + v.navn + ' låst opp. Du finner den under Pynt i bykartet.';
        break;

      case 'krystall':
        s.krystall += v.antall;
        melding = '💎 ' + v.antall + ' krystaller lagt til.';
        break;

      case 'ressurs':
        var pakke = OW.Betaling.forsyningspakke(s, d);
        OW.E.gi(s, pakke);
        var biter = [];
        for (var r in pakke) biter.push(OW.F.tall(pakke[r]) + ' ' + r);
        melding = '🚚 Konvoien er framme: ' + biter.join(', ') + '.';
        break;
    }

    if (v.daglig) s.premium.kjopDagbok[varId] = OW.Betaling.idag();
    OW.E.logg(s, 'Butikk: ' + v.navn + ' (demo-kjøp).', v.ikon);
    return { ok: true, melding: melding };
  },

  /* Ressurspakken skalerer med rikets størrelse – aldri nok til å hoppe over
     spillet, men et hyggelig dytt. Ca. 30 minutters produksjon. */
  forsyningspakke: function (s, d) {
    var pakke = {};
    var minstemål = { tre: 400, stein: 350, mat: 400, jern: 120, gull: 250 };
    for (var r in minstemål) {
      var fraProd = Math.round(Math.max(0, d.prod[r] || 0) * 1800);
      pakke[r] = Math.max(minstemål[r], fraProd);
    }
    return pakke;
  },

  /* Sjekker om et tidsbegrenset medlemskap har gått ut */
  oppdater: function (s) {
    if (s.premium.medlem && s.premium.medlemTil && Date.now() > s.premium.medlemTil) {
      s.premium.medlem = false;
      OW.E.varsel('Medlemskapet har gått ut. Byen din er fortsatt din.', 'info');
    }
  }
};
