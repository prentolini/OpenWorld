/* OpenWorld 3D – detaljerte hus
 *
 * Et hus er ikke en kasse med lokk. Det har grunnmur, veggflater med
 * bindingsverk, dør, vinduer med karm, tak med utstikk og tykkelse, mønebjelke
 * og pipe. Alt bygges av de samme enkle primitivene, men i riktig rekkefølge –
 * og med små tilfeldige avvik, slik at to hus aldri blir helt like.
 */
window.OW = window.OW || {};
OW.By3D = OW.By3D || {};

/* Byggematerialer med sine egne detaljer */
OW.By3D.MATERIALER = {
  bindingsverk: { vegg: [0.86, 0.82, 0.72], bjelke: [0.34, 0.24, 0.17], sokkel: [0.52, 0.50, 0.46], stolper: true },
  tre:          { vegg: [0.56, 0.41, 0.27], bjelke: [0.40, 0.29, 0.19], sokkel: [0.48, 0.46, 0.42], planker: true },
  stein:        { vegg: [0.68, 0.65, 0.59], bjelke: [0.52, 0.49, 0.45], sokkel: [0.46, 0.44, 0.41], kvader: true },
  marmor:       { vegg: [0.86, 0.84, 0.79], bjelke: [0.72, 0.70, 0.66], sokkel: [0.62, 0.60, 0.57], kvader: true },
  tegl:         { vegg: [0.62, 0.38, 0.31], bjelke: [0.45, 0.28, 0.23], sokkel: [0.46, 0.44, 0.41] }
};

/* Liten deterministisk fargevariasjon – ekte vegger har ikke én farge */
OW.By3D.varier = function (f, fro, styrke) {
  var v = (OW.fro(fro) - 0.5) * (styrke === undefined ? 0.05 : styrke);
  return [
    OW.klem(f[0] + v, 0, 1),
    OW.klem(f[1] + v * 0.95, 0, 1),
    OW.klem(f[2] + v * 0.85, 0, 1)
  ];
};

/* ------------------------------------------------------------------ TAK */
/* Saltak med utstikk, synlig tykkelse og mønebjelke. */
OW.By3D.tegnTak = function (m, x, y, z, bredde, dybde, hoyde, farge, fro) {
  var b2 = bredde / 2, d2 = dybde / 2;
  var topp = y + hoyde;
  var tykk = 0.09;
  var f = OW.By3D.varier(farge, fro, 0.06);
  var undersiden = OW.By3D.mork(f, 0.45);
  var m1 = OW.By3D.mork(f, 0.16);

  /* to takflater, over og under */
  m.firkant([x - b2, y, z + d2], [x + b2, y, z + d2], [x + b2, topp, z], [x - b2, topp, z], f);
  m.firkant([x + b2, y, z - d2], [x - b2, y, z - d2], [x - b2, topp, z], [x + b2, topp, z], m1);
  m.firkant([x - b2, topp - tykk, z], [x + b2, topp - tykk, z],
            [x + b2, y - tykk, z + d2], [x - b2, y - tykk, z + d2], undersiden);
  m.firkant([x + b2, topp - tykk, z], [x - b2, topp - tykk, z],
            [x - b2, y - tykk, z - d2], [x + b2, y - tykk, z - d2], undersiden);

  /* takskjegg (kanten man ser fra bakken) */
  m.firkant([x - b2, y - tykk, z + d2], [x + b2, y - tykk, z + d2], [x + b2, y, z + d2], [x - b2, y, z + d2], undersiden);
  m.firkant([x + b2, y - tykk, z - d2], [x - b2, y - tykk, z - d2], [x - b2, y, z - d2], [x + b2, y, z - d2], undersiden);

  /* gavlene */
  m.trekant([x - b2, y, z + d2], [x - b2, topp, z], [x - b2, y, z - d2], OW.By3D.mork(f, 0.28));
  m.trekant([x + b2, y, z - d2], [x + b2, topp, z], [x + b2, y, z + d2], OW.By3D.mork(f, 0.22));

  /* mønebjelke */
  m.kasse(x, topp - 0.05, z, bredde * 1.02, 0.1, 0.16, OW.By3D.mork(f, 0.35));
  return topp;
};

/* ---------------------------------------------------------------- VINDU */
OW.By3D.tegnVindu = function (m, x, y, z, bredde, hoyde, retning, karmFarge) {
  var d = 0.012 * retning;
  var glass = [0.24, 0.30, 0.38];
  var b2 = bredde / 2;

  /* Flater må vende UT fra veggen, ellers klipper WebGL dem bort. På
     baksiden av huset betyr det motsatt rekkefølge på hjørnene. */
  var vegg = function (x1, x2, y1, y2, dz, farge, flagg) {
    if (retning > 0) {
      m.firkant([x1, y1, z + dz], [x2, y1, z + dz], [x2, y2, z + dz], [x1, y2, z + dz], farge, flagg);
    } else {
      m.firkant([x2, y1, z + dz], [x1, y1, z + dz], [x1, y2, z + dz], [x2, y2, z + dz], farge, flagg);
    }
  };

  vegg(x - b2 - 0.05, x + b2 + 0.05, y - 0.05, y + hoyde + 0.05, d, karmFarge);
  var d2 = d * 1.9;
  vegg(x - b2, x + b2, y, y + hoyde, d2, glass, 2);
  vegg(x - 0.018, x + 0.018, y, y + hoyde, d2 * 1.2, karmFarge);
};

/* ------------------------------------------------------------------ DØR */
OW.By3D.tegnDor = function (m, x, y, z, bredde, hoyde, retning, mat) {
  var d = 0.014 * retning, b2 = bredde / 2;
  var vegg = function (x1, x2, y1, y2, dz, farge) {
    if (retning > 0) {
      m.firkant([x1, y1, z + dz], [x2, y1, z + dz], [x2, y2, z + dz], [x1, y2, z + dz], farge);
    } else {
      m.firkant([x2, y1, z + dz], [x1, y1, z + dz], [x1, y2, z + dz], [x2, y2, z + dz], farge);
    }
  };
  vegg(x - b2 - 0.06, x + b2 + 0.06, y, y + hoyde + 0.06, d, mat.bjelke);
  var d2 = d * 1.8;
  vegg(x - b2, x + b2, y, y + hoyde, d2, OW.By3D.mork(mat.bjelke, 0.25));
  vegg(x + b2 * 0.45, x + b2 * 0.72, y + hoyde * 0.45, y + hoyde * 0.55, d2 * 1.3, [0.72, 0.62, 0.32]);
};

/* ----------------------------------------------------------------- PIPE */
OW.By3D.tegnPipe = function (m, x, y, z, hoyde, fro) {
  var tegl = OW.By3D.varier([0.48, 0.33, 0.28], fro, 0.06);
  m.kasse(x, y, z, 0.3, hoyde, 0.3, tegl, { mork: 0.2, utenTopp: true });
  m.kasse(x, y + hoyde, z, 0.38, 0.09, 0.38, OW.By3D.mork(tegl, 0.15), { mork: 0.15 });
  m.kasse(x, y + hoyde + 0.09, z, 0.14, 0.07, 0.14, [0.16, 0.15, 0.14]);
};

/* =================================================================== HUS */
/* opts: bredde, dybde, etasjer, etasjeHoyde, materiale, takFarge, takType,
         vindu, dor, pipe, vinkel, fro, jetty (utkraget overetasje) */
OW.By3D.tegnHus = function (m, x, z, opts) {
  var mat = OW.By3D.MATERIALER[opts.materiale] || OW.By3D.MATERIALER.bindingsverk;
  var fro = opts.fro || 1;
  var b = opts.bredde, d = opts.dybde;
  var et = Math.max(1, opts.etasjer), eh = opts.etasjeHoyde;
  var vegg = OW.By3D.varier(opts.veggFarge || mat.vegg, fro, 0.055);

  m.settRot(opts.vinkel || 0, x, z);

  /* grunnmur i stein – huset står ikke rett på jorda */
  var sokkelH = 0.17;
  m.kasse(x, 0.15, z, b + 0.2, sokkelH, d + 0.2,
    OW.By3D.varier(mat.sokkel, fro + 3, 0.05), { mork: 0.3 });

  var y = 0.15 + sokkelH;
  var toppY = y;

  for (var e = 0; e < et; e++) {
    /* overetasjer kraget litt ut – typisk middelalderby, og gir skyggelinje */
    var eb = b * (opts.jetty && e > 0 ? 1 + 0.05 * e : 1);
    var ed = d * (opts.jetty && e > 0 ? 1 + 0.05 * e : 1);
    var ey = y + e * eh;

    m.kasse(x, ey, z, eb, eh, ed, vegg, { mork: 0.24, utenTopp: true });

    /* bindingsverk: hjørnestolper og et bånd mellom etasjene */
    if (mat.stolper) {
      var bjelke = OW.By3D.varier(mat.bjelke, fro + e, 0.04);
      for (var sx = -1; sx <= 1; sx += 2) {
        for (var sz = -1; sz <= 1; sz += 2) {
          m.kasse(x + sx * (eb / 2 - 0.05), ey, z + sz * (ed / 2 - 0.05),
            0.13, eh, 0.13, bjelke, { mork: 0.2 });
        }
      }
      m.kasse(x, ey + eh - 0.11, z, eb + 0.03, 0.13, ed + 0.03, bjelke, { mork: 0.18, utenTopp: true });
      /* skråstiver på langveggen gir det klassiske korsmønsteret */
      if (eb > 1.1) {
        m.kasse(x, ey + eh * 0.5, z + ed / 2 + 0.01, eb * 0.55, 0.1, 0.04, bjelke);
      }
    } else if (mat.kvader) {
      /* markerte steinskift */
      for (var r = 1; r < 3; r++) {
        m.kasse(x, ey + (eh / 3) * r, z, eb + 0.02, 0.05, ed + 0.02,
          OW.By3D.mork(vegg, 0.12), { utenTopp: true });
      }
    } else if (mat.planker) {
      for (var pl = 1; pl < 4; pl++) {
        m.kasse(x, ey + (eh / 4) * pl, z, eb + 0.015, 0.035, ed + 0.015,
          OW.By3D.mork(vegg, 0.16), { utenTopp: true });
      }
    }

    /* vinduer på for- og bakvegg */
    if (opts.vindu !== false) {
      var vh = Math.min(0.42, eh * 0.36);
      var vb = Math.min(0.34, eb * 0.2);
      var antall = eb > 1.8 ? 3 : 2;
      for (var i = 0; i < antall; i++) {
        var vx = x + (i - (antall - 1) / 2) * (eb / (antall + 0.4));
        var vy = ey + eh * 0.34;
        /* nederste etasje har dør i midten i stedet for vindu */
        var midten = antall % 2 === 1 && i === (antall - 1) / 2;
        if (!(e === 0 && opts.dor !== false && midten)) {
          OW.By3D.tegnVindu(m, vx, vy, z + ed / 2, vb, vh, 1, mat.bjelke);
        }
        OW.By3D.tegnVindu(m, vx, vy, z - ed / 2, vb, vh, -1, mat.bjelke);
      }
    }

    /* dør i første etasje */
    if (e === 0 && opts.dor !== false) {
      OW.By3D.tegnDor(m, x, y, z + ed / 2, Math.min(0.42, eb * 0.24), Math.min(0.72, eh * 0.62), 1, mat);
    }
    toppY = ey + eh;
  }

  /* tak */
  var takB = b * (opts.jetty ? 1 + 0.05 * (et - 1) : 1) + 0.34;   // utstikk
  var takD = d * (opts.jetty ? 1 + 0.05 * (et - 1) : 1) + 0.34;
  var takH = opts.takType === 'flatt' ? 0 : takB * (opts.takBratt || 0.42);

  if (opts.takType === 'flatt') {
    m.kasse(x, toppY, z, takB, 0.12, takD, opts.takFarge || OW.By3D.mork(vegg, 0.2), { mork: 0.2 });
    /* rekkverk på flatt tak */
    for (var q = -1; q <= 1; q += 2) {
      m.kasse(x, toppY + 0.12, z + q * (takD / 2 - 0.06), takB, 0.18, 0.09, OW.By3D.mork(vegg, 0.15));
      m.kasse(x + q * (takB / 2 - 0.06), toppY + 0.12, z, 0.09, 0.18, takD, OW.By3D.mork(vegg, 0.15));
    }
    toppY += 0.3;
  } else if (opts.takType === 'valm') {
    /* valmtak: pyramide */
    m.kasse(x, toppY, z, takB, 0.1, takD, OW.By3D.mork(opts.takFarge || [0.4, 0.3, 0.26], 0.3), { mork: 0.2 });
    m.spir(x, toppY + 0.1, z, takB, takH, opts.takFarge || [0.4, 0.3, 0.26]);
    toppY += 0.1 + takH;
  } else {
    toppY = OW.By3D.tegnTak(m, x, toppY, z, takB, takD, takH, opts.takFarge || [0.42, 0.28, 0.24], fro + 7);
  }

  if (opts.pipe) {
    OW.By3D.tegnPipe(m, x + b * 0.3, toppY - takH * 0.55, z - d * 0.22, takH * 0.8 + 0.45, fro + 11);
  }

  m.settRot(0);
  return toppY;
};
