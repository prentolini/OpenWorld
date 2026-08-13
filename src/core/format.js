/* OpenWorld – Formatering og småhjelpere */
window.OW = window.OW || {};

OW.F = {
  /* 12 345 678 -> "12,3 mill" */
  tall: function (n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    var neg = n < 0;
    n = Math.abs(n);
    var ut;
    if (n < 1000) {
      ut = (n < 10 && n % 1 !== 0) ? n.toFixed(1) : String(Math.floor(n));
    } else if (n < 1e6) {
      ut = OW.F._kort(n / 1e3) + 'k';
    } else if (n < 1e9) {
      ut = OW.F._kort(n / 1e6) + ' mill';
    } else if (n < 1e12) {
      ut = OW.F._kort(n / 1e9) + ' mrd';
    } else {
      ut = OW.F._kort(n / 1e12) + ' bill';
    }
    return (neg ? '−' : '') + ut;
  },
  _kort: function (x) {
    var s = x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : String(Math.round(x));
    /* Fjern bare nuller BAK komma. Uten denne sjekken ble «500» til «5»,
       slik at 500 000 ble vist som 5k. */
    if (s.indexOf('.') >= 0) s = s.replace(/\.?0+$/, '');
    return s.replace('.', ',');
  },

  /* Presis visning med tusenskille */
  hel: function (n) {
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },

  /* +1,25/s */
  rate: function (n) {
    var s = (n >= 0 ? '+' : '−') + OW.F._kort(Math.abs(n) < 100 ? Math.abs(n) : Math.round(Math.abs(n)));
    return s + '/s';
  },

  /* 3725 -> "1t 2m 5s" */
  tid: function (sek) {
    sek = Math.max(0, Math.ceil(sek));
    if (sek < 60) return sek + 's';
    var m = Math.floor(sek / 60), s = sek % 60;
    if (m < 60) return m + 'm ' + s + 's';
    var t = Math.floor(m / 60); m = m % 60;
    if (t < 24) return t + 't ' + m + 'm';
    var d = Math.floor(t / 24); t = t % 24;
    return d + 'd ' + t + 't';
  },

  pst: function (x, des) {
    var d = des === undefined ? 0 : des;
    return (x * 100).toFixed(d).replace('.', ',') + ' %';
  },

  kr: function (n) {
    return n.toFixed(0) + ' kr';
  },

  klokke: function (ts) {
    var d = new Date(ts);
    var p = function (x) { return x < 10 ? '0' + x : String(x); };
    return p(d.getHours()) + ':' + p(d.getMinutes());
  }
};

/* Deterministisk pseudotilfeldighet (samme frø = samme resultat) */
OW.fro = function (n) {
  var x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

OW.velgVektet = function (liste) {
  var sum = 0, i;
  for (i = 0; i < liste.length; i++) sum += (liste[i].vekt || 1);
  var r = Math.random() * sum;
  for (i = 0; i < liste.length; i++) {
    r -= (liste[i].vekt || 1);
    if (r <= 0) return liste[i];
  }
  return liste[liste.length - 1];
};

OW.klem = function (v, min, maks) { return v < min ? min : v > maks ? maks : v; };
