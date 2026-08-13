/* OpenWorld 3D – bymodeller
 *
 * Hver bygningstype har en oppskrift her. Nivået styrer hvor mange hus som
 * står på tomta, hvor høye de er, og hvilke detaljer som dukker opp – slik at
 * du faktisk SER at riket vokser.
 */
window.OW = window.OW || {};

OW.By3D = OW.By3D || {};

/* ------------------------------------------------------------------ FARGER */
OW.By3D.mork = function (f, m) { return [f[0] * (1 - m), f[1] * (1 - m), f[2] * (1 - m)]; };
OW.By3D.lys = function (f, m) { return [Math.min(1, f[0] + m), Math.min(1, f[1] + m), Math.min(1, f[2] + m)]; };

/* Landskapet skifter karakter med epoken */
OW.By3D.PALETT = [
  { gress: [0.42, 0.55, 0.30], jord: [0.44, 0.36, 0.26], vei: [0.40, 0.35, 0.28], himmel: [0.55, 0.68, 0.80], fjell: [0.44, 0.45, 0.45] },
  { gress: [0.44, 0.57, 0.32], jord: [0.46, 0.39, 0.29], vei: [0.45, 0.41, 0.34], himmel: [0.56, 0.70, 0.82], fjell: [0.45, 0.46, 0.47] },
  { gress: [0.40, 0.54, 0.31], jord: [0.48, 0.43, 0.34], vei: [0.50, 0.47, 0.41], himmel: [0.58, 0.70, 0.84], fjell: [0.46, 0.47, 0.50] },
  { gress: [0.38, 0.52, 0.32], jord: [0.50, 0.46, 0.38], vei: [0.55, 0.52, 0.47], himmel: [0.60, 0.70, 0.86], fjell: [0.48, 0.48, 0.53] },
  { gress: [0.36, 0.50, 0.33], jord: [0.52, 0.48, 0.42], vei: [0.58, 0.56, 0.52], himmel: [0.62, 0.71, 0.88], fjell: [0.50, 0.50, 0.56] },
  { gress: [0.34, 0.49, 0.34], jord: [0.54, 0.50, 0.45], vei: [0.62, 0.60, 0.57], himmel: [0.64, 0.72, 0.90], fjell: [0.52, 0.52, 0.60] }
];

OW.By3D.CELLE = 5.2;      // avstand mellom tomter
OW.By3D.TOMT = 4.4;       // størrelsen på selve tomta (resten blir gate)

/* Tomter i ringer utover fra rådhuset, slik at byen vokser konsentrisk */
OW.By3D.tomter = function () {
  if (OW.By3D._tomter) return OW.By3D._tomter;
  var liste = [{ x: 0, z: 0 }];
  for (var r = 1; r <= 4; r++) {
    var ring = [];
    for (var x = -r; x <= r; x++) {
      for (var z = -r; z <= r; z++) {
        if (Math.max(Math.abs(x), Math.abs(z)) !== r) continue;
        ring.push({ x: x, z: z, v: Math.atan2(z, x) });
      }
    }
    ring.sort(function (a, b) { return a.v - b.v; });
    liste = liste.concat(ring);
  }
  OW.By3D._tomter = liste;
  return liste;
};

/* Fast tomt per bygningstype – byen skal ikke hoppe rundt når den vokser */
OW.By3D.tomtFor = function (byggId) {
  if (!OW.By3D._tomtIndeks) {
    OW.By3D._tomtIndeks = {};
    var i = 0;
    OW.BYGG.forEach(function (b) {
      if (b.id === 'bymur') return;            // muren ligger rundt hele byen
      OW.By3D._tomtIndeks[b.id] = i++;
    });
  }
  var t = OW.By3D.tomter();
  var n = OW.By3D._tomtIndeks[byggId];
  var c = t[n % t.length];
  return { x: c.x * OW.By3D.CELLE, z: c.z * OW.By3D.CELLE, cx: c.x, cz: c.z,
           ring: Math.max(Math.abs(c.x), Math.abs(c.z)) };
};

/* ---------------------------------------------------------------- MODELLER */
/* tak: 'salt' | 'spir' | 'flat' | 'kuppel'  ·  klynge = maks antall hus på tomta */
OW.By3D.MODELL = {
  radhus:      { farge: [0.78, 0.72, 0.60], tak: 'spir', takFarge: [0.55, 0.25, 0.22], bredde: 3.0, etasje: 1.5, maksEt: 4, klynge: 1, vindu: true, flagg: true, tarn: true },
  hus:         { farge: [0.80, 0.70, 0.55], tak: 'salt', takFarge: [0.52, 0.30, 0.24], bredde: 1.3, etasje: 0.95, maksEt: 3, klynge: 5, vindu: true },
  tomrer:      { farge: [0.55, 0.40, 0.26], tak: 'salt', takFarge: [0.40, 0.30, 0.20], bredde: 1.5, etasje: 0.9, maksEt: 2, klynge: 3, tommer: true },
  steinbrudd:  { farge: [0.60, 0.58, 0.55], tak: 'flat', bredde: 1.6, etasje: 0.7, maksEt: 2, klynge: 2, stein: true },
  gard:        { farge: [0.70, 0.45, 0.30], tak: 'salt', takFarge: [0.45, 0.28, 0.20], bredde: 1.6, etasje: 1.0, maksEt: 2, klynge: 2, aker: true },
  lager:       { farge: [0.62, 0.52, 0.38], tak: 'salt', takFarge: [0.38, 0.34, 0.30], bredde: 2.0, etasje: 1.0, maksEt: 3, klynge: 2, kasser: true },

  marked:      { farge: [0.82, 0.76, 0.62], tak: 'flat', bredde: 1.4, etasje: 0.7, maksEt: 1, klynge: 4, boder: true },
  jerngruve:   { farge: [0.45, 0.42, 0.42], tak: 'salt', takFarge: [0.32, 0.30, 0.30], bredde: 1.5, etasje: 0.8, maksEt: 2, klynge: 2, gruve: true },
  smie:        { farge: [0.55, 0.48, 0.44], tak: 'salt', takFarge: [0.35, 0.28, 0.26], bredde: 1.7, etasje: 1.0, maksEt: 2, klynge: 2, pipe: true, vindu: true },
  bibliotek:   { farge: [0.76, 0.70, 0.58], tak: 'salt', takFarge: [0.35, 0.42, 0.50], bredde: 2.0, etasje: 1.2, maksEt: 3, klynge: 1, soyler: true, vindu: true },
  festplass:   { farge: [0.85, 0.55, 0.35], tak: 'kjegle', bredde: 1.5, etasje: 0.5, maksEt: 1, klynge: 4, telt: true },

  kaserne:     { farge: [0.58, 0.55, 0.48], tak: 'salt', takFarge: [0.35, 0.33, 0.32], bredde: 2.2, etasje: 1.0, maksEt: 3, klynge: 2, vindu: true, palisade: true },
  havn:        { farge: [0.58, 0.45, 0.32], tak: 'salt', takFarge: [0.40, 0.34, 0.28], bredde: 1.6, etasje: 0.9, maksEt: 2, klynge: 2, brygge: true },
  katedral:    { farge: [0.80, 0.76, 0.68], tak: 'spir', takFarge: [0.30, 0.40, 0.48], bredde: 2.2, etasje: 1.8, maksEt: 4, klynge: 1, vindu: true, spirhoy: true },

  universitet: { farge: [0.78, 0.73, 0.63], tak: 'salt', takFarge: [0.38, 0.34, 0.42], bredde: 2.6, etasje: 1.3, maksEt: 4, klynge: 1, soyler: true, vindu: true, tarn: true },
  bank:        { farge: [0.84, 0.80, 0.70], tak: 'kuppel', takFarge: [0.72, 0.60, 0.30], bredde: 2.4, etasje: 1.3, maksEt: 3, klynge: 1, soyler: true, vindu: true },
  verft:       { farge: [0.55, 0.43, 0.30], tak: 'flat', bredde: 2.2, etasje: 0.9, maksEt: 2, klynge: 1, skip: true, brygge: true },

  ambassade:   { farge: [0.86, 0.82, 0.74], tak: 'flat', bredde: 2.4, etasje: 1.2, maksEt: 3, klynge: 1, soyler: true, vindu: true, flagg: true },
  koloniverk:  { farge: [0.72, 0.70, 0.66], tak: 'flat', bredde: 2.4, etasje: 1.1, maksEt: 5, klynge: 1, vindu: true },

  verdensfyr:  { farge: [0.88, 0.86, 0.80], tak: 'flat', bredde: 1.8, etasje: 1.4, maksEt: 1, klynge: 1, fyr: true },
  observatorium:{ farge: [0.74, 0.72, 0.70], tak: 'kuppel', takFarge: [0.55, 0.58, 0.65], bredde: 2.2, etasje: 1.2, maksEt: 3, klynge: 1, vindu: true },

  handelslaug: { farge: [0.82, 0.70, 0.40], tak: 'salt', takFarge: [0.55, 0.42, 0.20], bredde: 2.0, etasje: 1.2, maksEt: 3, klynge: 1, vindu: true, flagg: true },
  krigsakademi:{ farge: [0.60, 0.45, 0.42], tak: 'salt', takFarge: [0.42, 0.25, 0.22], bredde: 2.2, etasje: 1.1, maksEt: 3, klynge: 1, vindu: true, palisade: true },
  lardomsorden:{ farge: [0.70, 0.74, 0.76], tak: 'spir', takFarge: [0.35, 0.48, 0.52], bredde: 2.0, etasje: 1.2, maksEt: 3, klynge: 1, vindu: true, soyler: true },

  gullstatue:  { farge: [0.90, 0.75, 0.30], tak: 'flat', bredde: 1.0, etasje: 0.6, maksEt: 1, klynge: 1, statue: true },
  hagelabyrint:{ farge: [0.30, 0.50, 0.28], tak: 'flat', bredde: 0.6, etasje: 0.5, maksEt: 1, klynge: 1, labyrint: true },
  drageflagg:  { farge: [0.55, 0.25, 0.30], tak: 'flat', bredde: 0.5, etasje: 0.5, maksEt: 1, klynge: 1, storFlagg: true }
};

/* Plassering av husene i en klynge på tomta */
OW.By3D.KLYNGE = [
  [[0, 0]],
  [[-1, -0.8], [1, 0.8]],
  [[-1, -0.9], [1.1, -0.6], [0, 1.1]],
  [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  [[-1.2, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.2, 1.1], [0, 0]]
];

/* ------------------------------------------------------- ÉN BYGNING PÅ TOMT */
OW.By3D.tegnBygg = function (m, byggId, niva, ox, oz, p) {
  var mo = OW.By3D.MODELL[byggId];
  if (!mo || niva < 1) return 0;

  var klynge = Math.min(mo.klynge, 1 + Math.floor((niva - 1) / 3));
  var etasjer = Math.min(mo.maksEt, 1 + Math.floor((niva - 1) / 2));
  var plasser = OW.By3D.KLYNGE[klynge - 1];
  var maksY = 0;

  /* Spesialmodeller som ikke er «hus» */
  if (mo.fyr) return OW.By3D.tegnFyr(m, ox, oz, niva, mo);
  if (mo.statue) return OW.By3D.tegnStatue(m, ox, oz, niva, mo);
  if (mo.labyrint) return OW.By3D.tegnLabyrint(m, ox, oz, niva, mo);
  if (mo.storFlagg) return OW.By3D.tegnDrageflagg(m, ox, oz, niva, mo);

  if (mo.aker) OW.By3D.tegnAker(m, ox, oz, niva);
  if (mo.brygge) OW.By3D.tegnBrygge(m, ox, oz, niva, mo);
  if (mo.palisade && niva >= 4) OW.By3D.tegnPalisade(m, ox, oz, mo);

  for (var i = 0; i < plasser.length; i++) {
    var px = ox + plasser[i][0] * (OW.By3D.TOMT / 4.4);
    var pz = oz + plasser[i][1] * (OW.By3D.TOMT / 4.4);
    var et = Math.max(1, etasjer - (i > 0 ? 1 : 0));
    var h = et * mo.etasje;
    var b = mo.bredde * (i === 0 ? 1 : 0.82);
    var d = b * 0.85;

    m.kasse(px, 0.16, pz, b, h, d, mo.farge, { mork: 0.28, utenTopp: mo.tak !== 'flat' });

    if (mo.vindu) OW.By3D.tegnVinduer(m, px, pz, b, d, h, et);
    if (mo.soyler && i === 0) OW.By3D.tegnSoyler(m, px, pz, b, d, h, mo);

    var takY = 0.16 + h;
    if (mo.tak === 'salt') {
      m.saltak(px, takY, pz, b * 1.14, mo.etasje * 0.62, d * 1.14, mo.takFarge || [0.45, 0.30, 0.25]);
      maksY = Math.max(maksY, takY + mo.etasje * 0.62);
    } else if (mo.tak === 'spir') {
      var sh = mo.spirhoy ? h * 0.9 : h * 0.55;
      m.spir(px, takY, pz, b * 1.05, sh, mo.takFarge || [0.45, 0.30, 0.25]);
      maksY = Math.max(maksY, takY + sh);
    } else if (mo.tak === 'kuppel') {
      m.kuppel(px, takY, pz, b * 0.55, b * 0.55, mo.takFarge || [0.6, 0.55, 0.4], 10);
      maksY = Math.max(maksY, takY + b * 0.55);
    } else if (mo.tak === 'kjegle') {
      m.sylinder(px, takY, pz, b * 0.7, mo.etasje * 0.9, mo.takFarge || [0.8, 0.4, 0.3], 8, 0);
      maksY = Math.max(maksY, takY + mo.etasje * 0.9);
    } else {
      maksY = Math.max(maksY, takY);
    }
  }

  /* Detaljer som markerer at bygningen er langt oppe i nivå */
  if (mo.tarn && niva >= 6) {
    var th = 1.4 + niva * 0.16;
    m.kasse(ox + mo.bredde * 0.75, 0.16, oz - mo.bredde * 0.55, 0.8, th, 0.8, OW.By3D.lys(mo.farge, 0.04), { mork: 0.25, utenTopp: true });
    m.spir(ox + mo.bredde * 0.75, 0.16 + th, oz - mo.bredde * 0.55, 0.95, 1.1, mo.takFarge || [0.5, 0.28, 0.24]);
    maksY = Math.max(maksY, 0.16 + th + 1.1);
  }
  if (mo.pipe) {
    m.kasse(ox + mo.bredde * 0.4, 0.16, oz + mo.bredde * 0.3, 0.34, etasjer * mo.etasje + 0.9, 0.34, [0.42, 0.36, 0.33], { mork: 0.2 });
  }
  if (mo.tommer) OW.By3D.tegnTommer(m, ox, oz, niva);
  if (mo.stein) OW.By3D.tegnSteinbrudd(m, ox, oz, niva);
  if (mo.kasser) OW.By3D.tegnKasser(m, ox, oz, niva);
  if (mo.boder) OW.By3D.tegnBoder(m, ox, oz, niva);
  if (mo.telt) OW.By3D.tegnTelt(m, ox, oz, niva);
  if (mo.gruve) OW.By3D.tegnGruve(m, ox, oz, niva);
  if (mo.skip) OW.By3D.tegnSkip(m, ox, oz, niva);
  if (mo.flagg) {
    var fh = 1.6 + Math.min(niva, 12) * 0.1;
    OW.By3D.tegnFlagg(m, ox - mo.bredde * 0.7, oz + mo.bredde * 0.6, maksY * 0.5, fh, mo.takFarge || [0.7, 0.3, 0.3]);
    maksY = Math.max(maksY, maksY * 0.5 + fh);
  }
  return maksY;
};

/* ------------------------------------------------------------- SMÅDETALJER */

OW.By3D.tegnVinduer = function (m, x, z, b, d, h, etasjer) {
  var glass = [0.28, 0.34, 0.42];
  for (var e = 0; e < etasjer; e++) {
    var y = 0.16 + e * (h / etasjer) + (h / etasjer) * 0.34;
    var vh = Math.min(0.34, (h / etasjer) * 0.34);
    for (var i = -1; i <= 1; i += 2) {
      m.firkant([x - b * 0.26, y, z + d / 2 * i + 0.011 * i], [x - b * 0.06, y, z + d / 2 * i + 0.011 * i],
        [x - b * 0.06, y + vh, z + d / 2 * i + 0.011 * i], [x - b * 0.26, y + vh, z + d / 2 * i + 0.011 * i], glass, 2);
      m.firkant([x + b * 0.06, y, z + d / 2 * i + 0.011 * i], [x + b * 0.26, y, z + d / 2 * i + 0.011 * i],
        [x + b * 0.26, y + vh, z + d / 2 * i + 0.011 * i], [x + b * 0.06, y + vh, z + d / 2 * i + 0.011 * i], glass, 2);
    }
  }
};

OW.By3D.tegnSoyler = function (m, x, z, b, d, h, mo) {
  var f = OW.By3D.lys(mo.farge, 0.08);
  for (var i = -1; i <= 1; i++) {
    m.sylinder(x + i * b * 0.34, 0.16, z + d * 0.56, 0.13, h * 0.92, f, 6);
  }
};

OW.By3D.tegnFlagg = function (m, x, z, y, hoyde, farge) {
  m.kasse(x, y, z, 0.1, hoyde, 0.1, [0.35, 0.3, 0.26]);
  var t = y + hoyde;
  m.firkant([x, t - 0.62, z], [x + 0.85, t - 0.5, z], [x + 0.85, t - 0.12, z], [x, t, z], farge);
  m.firkant([x, t, z], [x + 0.85, t - 0.12, z], [x + 0.85, t - 0.5, z], [x, t - 0.62, z], OW.By3D.mork(farge, 0.2));
};

OW.By3D.tegnTommer = function (m, x, z, niva) {
  var tre = [0.52, 0.38, 0.24];
  var n = Math.min(4, 1 + Math.floor(niva / 3));
  for (var i = 0; i < n; i++) {
    var px = x - 1.5 + (i % 2) * 0.55, pz = z + 1.3 - Math.floor(i / 2) * 0.6;
    for (var j = 0; j < 3; j++) m.sylinder(px, 0.16 + j * 0.22, pz, 0.2, 0.2, tre, 6);
  }
};

OW.By3D.tegnSteinbrudd = function (m, x, z, niva) {
  var st = [0.55, 0.53, 0.50];
  m.flate(x, 0.18, z + 1.2, 2.6, 1.6, [0.40, 0.37, 0.34]);
  var n = Math.min(6, 2 + Math.floor(niva / 2));
  for (var i = 0; i < n; i++) {
    var f = OW.fro(i * 3.7 + 11), g = OW.fro(i * 5.1 + 3);
    m.kasse(x - 1.1 + f * 2.2, 0.18, z + 0.6 + g * 1.2, 0.3 + f * 0.25, 0.25 + g * 0.3, 0.3 + g * 0.2, st, { mork: 0.2 });
  }
};

OW.By3D.tegnKasser = function (m, x, z, niva) {
  var f = [0.58, 0.44, 0.30];
  var n = Math.min(6, 2 + Math.floor(niva / 2));
  for (var i = 0; i < n; i++) {
    m.kasse(x - 1.3 + (i % 3) * 0.5, 0.16 + Math.floor(i / 3) * 0.42, z + 1.35, 0.42, 0.42, 0.42, f, { mork: 0.22 });
  }
};

OW.By3D.tegnBoder = function (m, x, z, niva) {
  var duker = [[0.80, 0.30, 0.28], [0.30, 0.45, 0.70], [0.85, 0.65, 0.25], [0.35, 0.60, 0.38]];
  var n = Math.min(4, 1 + Math.floor(niva / 2));
  for (var i = 0; i < n; i++) {
    var px = x - 1.2 + (i % 2) * 2.2, pz = z - 1.1 + Math.floor(i / 2) * 2.1;
    m.kasse(px, 0.16, pz, 0.12, 0.75, 0.12, [0.4, 0.32, 0.25]);
    m.kasse(px + 0.9, 0.16, pz, 0.12, 0.75, 0.12, [0.4, 0.32, 0.25]);
    m.saltak(px + 0.45, 0.85, pz, 1.35, 0.3, 1.0, duker[i % 4]);
  }
};

OW.By3D.tegnTelt = function (m, x, z, niva) {
  var f = [[0.85, 0.35, 0.30], [0.35, 0.50, 0.75], [0.90, 0.70, 0.28]];
  var n = Math.min(3, 1 + Math.floor(niva / 3));
  for (var i = 0; i < n; i++) {
    m.sylinder(x - 1 + i * 1.1, 0.16, z + 0.9, 0.6, 1.1, f[i % 3], 8, 0);
  }
};

OW.By3D.tegnGruve = function (m, x, z, niva) {
  m.kasse(x - 1.2, 0.16, z + 1.1, 1.0, 0.9, 0.5, [0.30, 0.27, 0.25], { mork: 0.1 });
  m.saltak(x - 1.2, 1.06, z + 1.1, 1.2, 0.35, 0.7, [0.35, 0.32, 0.30]);
  if (niva >= 4) {
    m.kasse(x + 1.1, 0.16, z + 1.2, 0.5, 0.35, 0.7, [0.42, 0.36, 0.30], { mork: 0.15 });
  }
};

OW.By3D.tegnAker = function (m, x, z, niva) {
  var n = Math.min(5, 2 + Math.floor(niva / 2));
  for (var i = 0; i < n; i++) {
    var moden = i % 2 === 0;
    m.flate(x - 1.6 + i * 0.72, 0.175, z + 1.2, 0.6, 2.4, moden ? [0.72, 0.62, 0.24] : [0.45, 0.56, 0.28]);
  }
};

OW.By3D.tegnBrygge = function (m, x, z, niva, mo) {
  var tre = [0.46, 0.36, 0.26];
  m.flate(x, 0.2, z + 1.5, 3.0, 1.0, tre);
  for (var i = -1; i <= 1; i++) m.kasse(x + i * 1.2, 0, z + 1.9, 0.16, 0.22, 0.16, OW.By3D.mork(tre, 0.3));
};

OW.By3D.tegnSkip = function (m, x, z, niva) {
  var skrog = [0.45, 0.33, 0.22];
  m.kasse(x, 0.35, z + 1.6, 2.4, 0.6, 0.9, skrog, { mork: 0.25, topp: 1.15 });
  var mast = 1.4 + Math.min(niva, 10) * 0.1;
  m.kasse(x, 0.95, z + 1.6, 0.12, mast, 0.12, [0.38, 0.30, 0.22]);
  m.firkant([x + 0.02, 0.95 + mast * 0.25, z + 1.15], [x + 0.02, 0.95 + mast * 0.25, z + 2.05],
    [x + 0.02, 0.95 + mast * 0.95, z + 1.95], [x + 0.02, 0.95 + mast * 0.95, z + 1.25], [0.88, 0.86, 0.80]);
};

OW.By3D.tegnPalisade = function (m, x, z, mo) {
  var f = [0.42, 0.34, 0.25];
  for (var i = -2; i <= 2; i++) {
    m.kasse(x + i * 0.5, 0.16, z - 1.8, 0.22, 0.75, 0.22, f, { mork: 0.2 });
  }
};

OW.By3D.tegnFyr = function (m, x, z, niva, mo) {
  var h = 4 + Math.min(niva, 14) * 0.75;
  m.sylinder(x, 0.16, z, 1.25, h * 0.75, mo.farge, 12, 0.8);
  m.sylinder(x, 0.16 + h * 0.75, z, 0.9, h * 0.2, [0.75, 0.35, 0.30], 12, 0.75);
  /* lyskammeret – dette er det som lyser om natten */
  m.sylinder(x, 0.16 + h * 0.95, z, 0.7, 0.9, [0.95, 0.85, 0.55], 10, 0.7);
  var topp = 0.16 + h * 0.95 + 0.9;
  for (var i = 0; i < 10; i++) {
    var a = i / 10 * Math.PI * 2;
    m.kasse(x + Math.cos(a) * 0.7, 0.16 + h * 0.95, z + Math.sin(a) * 0.7, 0.1, 0.9, 0.1, [0.6, 0.6, 0.62]);
  }
  m.sylinder(x, topp, z, 0.85, 0.7, [0.55, 0.30, 0.28], 10, 0);
  return topp + 0.7;
};

OW.By3D.tegnStatue = function (m, x, z, niva, mo) {
  var gull = mo.farge;
  m.kasse(x, 0.16, z, 1.5, 0.5, 1.5, [0.68, 0.66, 0.62], { mork: 0.2 });
  m.kasse(x, 0.66, z, 1.1, 0.35, 1.1, [0.74, 0.72, 0.68], { mork: 0.15 });
  var h = 1.2 + Math.min(niva, 5) * 0.28;
  m.kasse(x, 1.01, z, 0.55, h, 0.4, gull, { mork: 0.2, topp: 0.85 });
  m.sylinder(x, 1.01 + h, z, 0.26, 0.34, gull, 8);
  m.kasse(x + 0.42, 1.01 + h * 0.55, z, 0.16, 0.7, 0.16, gull);
  return 1.01 + h + 0.34;
};

OW.By3D.tegnLabyrint = function (m, x, z, niva, mo) {
  var h = 0.55 + Math.min(niva, 5) * 0.12;
  var ringer = 1 + Math.min(niva, 5);
  for (var r = 1; r <= Math.min(3, ringer); r++) {
    var s = r * 0.62;
    for (var i = -1; i <= 1; i += 2) {
      m.kasse(x + i * s, 0.16, z, 0.22, h, s * 2, mo.farge, { mork: 0.25 });
      m.kasse(x, 0.16, z + i * s, s * 2 - 0.2, h, 0.22, OW.By3D.mork(mo.farge, 0.06), { mork: 0.25 });
    }
  }
  return 0.16 + h;
};

OW.By3D.tegnDrageflagg = function (m, x, z, niva, mo) {
  var h = 3.2 + Math.min(niva, 5) * 0.6;
  m.kasse(x, 0.16, z, 0.2, h, 0.2, [0.35, 0.30, 0.26]);
  var t = 0.16 + h;
  for (var i = 0; i < 3; i++) {
    var y = t - 0.4 - i * 0.75;
    m.firkant([x, y - 0.62, z], [x + 1.5, y - 0.45, z], [x + 1.5, y - 0.05, z], [x, y, z],
      i % 2 ? [0.75, 0.30, 0.32] : [0.40, 0.18, 0.24]);
  }
  m.sylinder(x, t, z, 0.16, 0.4, [0.85, 0.72, 0.35], 6, 0);
  return t + 0.4;
};

/* ------------------------------------------------------------------ BYMUR */
OW.By3D.tegnBymur = function (m, niva, radius, p) {
  var f = [0.62, 0.60, 0.56];
  var h = 1.2 + Math.min(niva, 12) * 0.13;
  var steg = 1.6, n = Math.round((radius * 2) / steg);
  for (var i = 0; i <= n; i++) {
    var t = -radius + i * steg;
    var portGap = Math.abs(t) < 2.2;
    /* fire sider, med port i sør */
    m.kasse(t, 0.05, radius, steg * 0.98, h, 0.55, f, { mork: 0.25 });
    if (!portGap) m.kasse(t, 0.05, -radius, steg * 0.98, h, 0.55, f, { mork: 0.25 });
    m.kasse(radius, 0.05, t, 0.55, h, steg * 0.98, f, { mork: 0.25 });
    m.kasse(-radius, 0.05, t, 0.55, h, steg * 0.98, f, { mork: 0.25 });
  }
  /* hjørnetårn */
  for (var sx = -1; sx <= 1; sx += 2) {
    for (var sz = -1; sz <= 1; sz += 2) {
      m.sylinder(sx * radius, 0.05, sz * radius, 0.95, h * 1.5, f, 8);
      m.sylinder(sx * radius, 0.05 + h * 1.5, sz * radius, 1.05, 0.8, [0.45, 0.28, 0.26], 8, 0);
    }
  }
  /* porttårn */
  if (niva >= 3) {
    for (var s2 = -1; s2 <= 1; s2 += 2) {
      m.kasse(s2 * 2.6, 0.05, -radius, 1.1, h * 1.4, 1.1, f, { mork: 0.22 });
    }
  }
};

/* --------------------------------------------------------------- TERRENGET */
OW.By3D.tegnTerreng = function (m, s, p, byRadius) {
  /* himmelen: gradient fra horisont til senit, uten lys og tåke */
  m.himmel(340, OW.By3D.lys(p.himmel, 0.16), OW.By3D.mork(p.himmel, 0.34));

  /* bakke */
  m.flate(0, 0, 0, 700, 700, p.gress);

  /* innsjø i nord – gir mening til havn og verft */
  m.flate(0, 0.02, 62, 400, 84, [0.22, 0.42, 0.55], 1);
  m.flate(0, 0.03, 24, 60, 8, [0.24, 0.44, 0.56], 1);        // vika inn mot byen

  /* bygate under hele byen */
  m.flate(0, 0.06, 0, byRadius * 2 + 6, byRadius * 2 + 6, p.vei);

  /* tomter som små plattformer – mellomrommene blir gater */
  var tomter = OW.By3D.tomter();
  for (var i = 0; i < tomter.length; i++) {
    var t = tomter[i];
    var x = t.x * OW.By3D.CELLE, z = t.z * OW.By3D.CELLE;
    if (Math.max(Math.abs(x), Math.abs(z)) > byRadius) continue;
    m.flate(x, 0.14, z, OW.By3D.TOMT, OW.By3D.TOMT, p.jord);
  }

  /* trær rundt byen */
  var stamme = [0.36, 0.27, 0.19];
  for (var j = 0; j < 130; j++) {
    var a = OW.fro(j * 1.37) * Math.PI * 2;
    var r = byRadius + 4 + OW.fro(j * 2.11 + 5) * 46;
    var tx = Math.cos(a) * r, tz = Math.sin(a) * r;
    if (tz > 20) continue;                                    // ikke i vannet
    var st = 0.55 + OW.fro(j * 3.3) * 0.5;
    m.sylinder(tx, 0, tz, 0.16, st, stamme, 5);
    var lov = [0.20 + OW.fro(j * 7.7) * 0.1, 0.34 + OW.fro(j * 4.4) * 0.14, 0.16];
    m.sylinder(tx, st, tz, 0.85, 1.5 + OW.fro(j * 9.1) * 0.8, lov, 6, 0);
  }

  /* fjell i horisonten – dempet mot himmelfargen så de smelter inn i disen */
  var disig = [
    p.fjell[0] * 0.45 + p.himmel[0] * 0.55,
    p.fjell[1] * 0.45 + p.himmel[1] * 0.55,
    p.fjell[2] * 0.45 + p.himmel[2] * 0.55
  ];
  for (var k = 0; k < 16; k++) {
    var va = (k / 16) * Math.PI * 2 + 0.3;
    var vr = 132 + OW.fro(k * 6.6) * 48;
    var vh = 20 + OW.fro(k * 8.8) * 26;
    m.sylinder(Math.cos(va) * vr, 0, Math.sin(va) * vr, 16 + OW.fro(k * 2.2) * 12, vh, disig, 8, 0);
  }
};

/* -------------------------------------------------------- HELE BYEN SAMLET */
OW.By3D.byggBy = function (s) {
  var m = new OW.Mesh();
  var p = OW.By3D.PALETT[Math.min(s.era, OW.By3D.PALETT.length - 1)];

  /* Byen er akkurat så stor som tomtene som faktisk er i bruk – da slipper
     vi en tom betongslette rundt en liten landsby. */
  var ytterst = 0;
  OW.BYGG.forEach(function (b) {
    if (b.id === 'bymur' || !(s.bygg[b.id] > 0)) return;
    ytterst = Math.max(ytterst, OW.By3D.tomtFor(b.id).ring);
  });
  for (var q = 0; q < s.ko.length; q++) {
    ytterst = Math.max(ytterst, OW.By3D.tomtFor(s.ko[q].id).ring);
  }
  var byRadius = (ytterst + 0.62) * OW.By3D.CELLE;

  OW.By3D.tegnTerreng(m, s, p, byRadius);

  var merker = [];
  OW.BYGG.forEach(function (b) {
    var niva = s.bygg[b.id] || 0;
    if (niva < 1 || b.id === 'bymur') return;
    var t = OW.By3D.tomtFor(b.id);
    var toppY = OW.By3D.tegnBygg(m, b.id, niva, t.x, t.z, p);
    merker.push({ id: b.id, navn: b.navn, ikon: b.ikon, niva: niva, x: t.x, y: (toppY || 2) + 0.5, z: t.z });
  });

  /* Byggeplasser: stillas der noe er under arbeid */
  for (var i = 0; i < s.ko.length; i++) {
    var kt = OW.By3D.tomtFor(s.ko[i].id);
    OW.By3D.tegnStillas(m, kt.x, kt.z, (s.bygg[s.ko[i].id] || 0) < 1);
    merker.push({ id: s.ko[i].id, navn: OW.BYGG_INDEX[s.ko[i].id].navn, ikon: '🔨', niva: 0,
      bygger: true, x: kt.x, y: 3.2, z: kt.z });
  }

  if (s.bygg.bymur > 0) OW.By3D.tegnBymur(m, s.bygg.bymur, byRadius + OW.By3D.CELLE * 0.55, p);

  return { mesh: m, merker: merker, byRadius: byRadius };
};

OW.By3D.tegnStillas = function (m, x, z, tomTomt) {
  var tre = [0.62, 0.48, 0.28];
  var h = 1.7;
  for (var sx = -1; sx <= 1; sx += 2) {
    for (var sz = -1; sz <= 1; sz += 2) {
      m.kasse(x + sx * 1.2, 0.16, z + sz * 1.2, 0.16, h, 0.16, tre);
    }
  }
  for (var i = 1; i <= 2; i++) {
    var y = 0.16 + (h / 3) * i;
    m.kasse(x, y, z + 1.2, 2.56, 0.12, 0.12, tre);
    m.kasse(x, y, z - 1.2, 2.56, 0.12, 0.12, tre);
    m.kasse(x + 1.2, y, z, 0.12, 0.12, 2.56, tre);
    m.kasse(x - 1.2, y, z, 0.12, 0.12, 2.56, tre);
  }
  if (tomTomt) m.flate(x, 0.155, z, 3.2, 3.2, [0.40, 0.34, 0.26]);
};

/* ============================================================== FOLK I BYEN
 * Herskeren din og innbyggerne går rundt i gatene. Dette bygges på nytt hver
 * ramme i sin egen lille buffer, så byen føles levende uten at vi må bygge om
 * hele bygeometrien.
 */

/* Går langs en firkantet «gate» med halvbredde R, som følger gateløpene */
OW.By3D.gatePunkt = function (R, avstand) {
  var omkrets = 8 * R;
  var d = ((avstand % omkrets) + omkrets) % omkrets;
  var seg = Math.floor(d / (2 * R)), t = (d % (2 * R)) / (2 * R);
  if (seg === 0) return { x: -R + 2 * R * t, z: -R };
  if (seg === 1) return { x: R, z: -R + 2 * R * t };
  if (seg === 2) return { x: R - 2 * R * t, z: R };
  return { x: -R, z: R - 2 * R * t };
};

OW.By3D.tegnFigur = function (m, x, z, skala, kropp, kappe, hatt, fase) {
  var y = 0.16;
  var hud = [0.80, 0.64, 0.50];
  var sk = skala;
  var vipp = Math.sin(fase * 2) * 0.035 * sk;      // gyngende gange
  var steg = Math.sin(fase * 2) * 0.09 * sk;

  /* bein */
  m.kasse(x - 0.09 * sk, y, z + steg, 0.1 * sk, 0.24 * sk, 0.1 * sk, OW.By3D.mork(kropp, 0.35));
  m.kasse(x + 0.09 * sk, y, z - steg, 0.1 * sk, 0.24 * sk, 0.1 * sk, OW.By3D.mork(kropp, 0.35));

  /* kropp */
  var ky = y + 0.24 * sk + vipp;
  m.kasse(x, ky, z, 0.3 * sk, 0.34 * sk, 0.22 * sk, kropp, { mork: 0.22 });

  /* kappe bak ryggen */
  if (kappe) {
    m.firkant(
      [x - 0.16 * sk, ky + 0.34 * sk, z - 0.13 * sk],
      [x + 0.16 * sk, ky + 0.34 * sk, z - 0.13 * sk],
      [x + 0.13 * sk, ky - 0.08 * sk, z - 0.2 * sk],
      [x - 0.13 * sk, ky - 0.08 * sk, z - 0.2 * sk], kappe);
  }

  /* hode */
  var hy = ky + 0.34 * sk;
  m.kasse(x, hy, z, 0.21 * sk, 0.21 * sk, 0.2 * sk, hud, { mork: 0.18 });

  var ty = hy + 0.21 * sk;
  if (hatt === 'krone') {
    m.kasse(x, ty, z, 0.24 * sk, 0.09 * sk, 0.23 * sk, [0.92, 0.78, 0.30], { mork: 0.2 });
    for (var i = -1; i <= 1; i++) {
      m.spir(x + i * 0.08 * sk, ty + 0.09 * sk, z, 0.07 * sk, 0.1 * sk, [0.95, 0.82, 0.35]);
    }
  } else if (hatt === 'hjelm') {
    m.kuppel(x, ty - 0.02 * sk, z, 0.14 * sk, 0.13 * sk, [0.62, 0.64, 0.68], 8);
  } else if (hatt === 'spisshatt') {
    m.sylinder(x, ty, z, 0.19 * sk, 0.34 * sk, kappe || [0.4, 0.3, 0.6], 7, 0);
  } else if (hatt === 'straahatt') {
    m.sylinder(x, ty - 0.01 * sk, z, 0.24 * sk, 0.05 * sk, [0.82, 0.72, 0.38], 8);
    m.sylinder(x, ty + 0.04 * sk, z, 0.13 * sk, 0.1 * sk, [0.80, 0.70, 0.36], 8);
  } else if (hatt === 'kapteinslue') {
    m.kasse(x, ty, z, 0.23 * sk, 0.07 * sk, 0.24 * sk, [0.2, 0.26, 0.34], { mork: 0.2 });
  }
};

/* Bygger hele folkemengden. tid = sekunder siden start. */
OW.By3D.byggFolk = function (folk, tid, byRadius) {
  var m = new OW.Mesh();
  if (!folk) return m;

  var ringer = Math.max(1, Math.floor(byRadius / OW.By3D.CELLE));
  /* Midt i gateløpet mellom to tomterekker */
  var gate = function (n) { return (Math.min(n, ringer) + 0.5) * OW.By3D.CELLE; };

  /* innbyggerne */
  for (var i = 0; i < folk.antall; i++) {
    var R = gate(1 + (i % ringer));
    var fart = 0.9 + OW.fro(i * 3.11) * 0.7;
    var retning = OW.fro(i * 7.3) > 0.5 ? 1 : -1;
    var start = OW.fro(i * 5.7) * 8 * R;
    var p = OW.By3D.gatePunkt(R, start + tid * fart * retning);
    var t = OW.fro(i * 9.13);
    var klaer = [0.34 + t * 0.3, 0.30 + OW.fro(i * 2.7) * 0.26, 0.26 + OW.fro(i * 4.9) * 0.3];
    OW.By3D.tegnFigur(m, p.x, p.z, 1.35, klaer, null, 'ingen', tid * fart * 2.2 + i);
  }

  /* herskeren – større, i sine egne farger, med hatt */
  if (folk.kar) {
    var Rh = gate(1);
    var ph = OW.By3D.gatePunkt(Rh, tid * 0.55);
    OW.By3D.tegnFigur(m, ph.x, ph.z, 2.1, folk.kar.farge, folk.kar.kappe, folk.kar.hatt, tid * 1.2);
  }
  return m;
};
