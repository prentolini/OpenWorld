/* OpenWorld 3D – liten WebGL-motor
 *
 * Ingen tredjepartsbibliotek. Alt vi trenger er:
 *   · 4×4-matriser (perspektiv, kamera)
 *   · en meshbygger som samler trekanter i flate lister
 *   · ett shaderprogram med sol, tåke, bølger og vinduslys
 *
 * Hele byen tegnes som ÉN buffer med ett kall. Den bygges bare om når
 * byen faktisk endrer seg – ellers roterer vi bare kameraet.
 */
window.OW = window.OW || {};

/* ------------------------------------------------------------- MATEMATIKK */
OW.M = {
  identitet: function () {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  },

  perspektiv: function (synsvinkel, sideforhold, naer, fjern) {
    var f = 1 / Math.tan(synsvinkel / 2), nf = 1 / (naer - fjern);
    return new Float32Array([
      f / sideforhold, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (fjern + naer) * nf, -1,
      0, 0, 2 * fjern * naer * nf, 0
    ]);
  },

  /* Kamera som ser fra «oye» mot «mal» */
  seMot: function (oye, mal, opp) {
    var z = OW.M.normaliser([oye[0] - mal[0], oye[1] - mal[1], oye[2] - mal[2]]);
    var x = OW.M.normaliser(OW.M.kryss(opp, z));
    var y = OW.M.kryss(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -(x[0] * oye[0] + x[1] * oye[1] + x[2] * oye[2]),
      -(y[0] * oye[0] + y[1] * oye[1] + y[2] * oye[2]),
      -(z[0] * oye[0] + z[1] * oye[1] + z[2] * oye[2]), 1
    ]);
  },

  gang: function (a, b) {
    var ut = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var sum = 0;
        for (var k = 0; k < 4; k++) sum += a[k * 4 + j] * b[i * 4 + k];
        ut[i * 4 + j] = sum;
      }
    }
    return ut;
  },

  /* Punkt (x,y,z) → skjermkoordinat i piksler, eller null hvis bak kamera */
  tilSkjerm: function (mvp, p, bredde, hoyde) {
    var x = mvp[0] * p[0] + mvp[4] * p[1] + mvp[8] * p[2] + mvp[12];
    var y = mvp[1] * p[0] + mvp[5] * p[1] + mvp[9] * p[2] + mvp[13];
    var w = mvp[3] * p[0] + mvp[7] * p[1] + mvp[11] * p[2] + mvp[15];
    if (w <= 0.001) return null;
    return { x: (x / w * 0.5 + 0.5) * bredde, y: (1 - (y / w * 0.5 + 0.5)) * hoyde, d: w };
  },

  kryss: function (a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  },
  normaliser: function (v) {
    var l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
};

/* ------------------------------------------------------------- MESHBYGGER */
/* Samler trekanter. aFlagg: 0 = vanlig, 1 = vann (bølger), 2 = vindu (lyser om natten) */
OW.Mesh = function () {
  this.pos = [];
  this.nor = [];
  this.farge = [];
  this.flagg = [];
};

OW.Mesh.prototype = {
  /* Én trekant med flat skyggelegging */
  trekant: function (a, b, c, farge, flagg) {
    var u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    var v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    var n = OW.M.normaliser(OW.M.kryss(u, v));
    var p = [a, b, c];
    for (var i = 0; i < 3; i++) {
      this.pos.push(p[i][0], p[i][1], p[i][2]);
      this.nor.push(n[0], n[1], n[2]);
      this.farge.push(farge[0], farge[1], farge[2]);
      this.flagg.push(flagg || 0);
    }
  },

  firkant: function (a, b, c, d, farge, flagg) {
    this.trekant(a, b, c, farge, flagg);
    this.trekant(a, c, d, farge, flagg);
  },

  /* Kasse med valgfri skalering av toppen (tak/tårn blir smalere oppover).
     mork = hvor mye mørkere sidene er nederst (billig omgivelseslys). */
  kasse: function (x, y, z, bredde, hoyde, dybde, farge, opts) {
    opts = opts || {};
    var t = opts.topp === undefined ? 1 : opts.topp;
    var b2 = bredde / 2, d2 = dybde / 2;
    var bt = b2 * t, dt = d2 * t;
    var y2 = y + hoyde;
    var bunn = opts.mork ? OW.By3D.mork(farge, opts.mork * 0.6) : farge;

    /* fire sider */
    var sider = [
      [[x - b2, y, z + d2], [x + b2, y, z + d2], [x + bt, y2, z + dt], [x - bt, y2, z + dt]],
      [[x + b2, y, z - d2], [x - b2, y, z - d2], [x - bt, y2, z - dt], [x + bt, y2, z - dt]],
      [[x + b2, y, z + d2], [x + b2, y, z - d2], [x + bt, y2, z - dt], [x + bt, y2, z + dt]],
      [[x - b2, y, z - d2], [x - b2, y, z + d2], [x - bt, y2, z + dt], [x - bt, y2, z - dt]]
    ];
    for (var i = 0; i < 4; i++) {
      var s = sider[i];
      /* nederste kant litt mørkere: gir dybde uten skyggekart */
      this.trekant(s[0], s[1], s[2], bunn);
      this.trekant(s[0], s[2], s[3], farge);
    }
    if (!opts.utenTopp) {
      this.firkant([x - bt, y2, z - dt], [x + bt, y2, z - dt], [x + bt, y2, z + dt], [x - bt, y2, z + dt],
        opts.toppFarge || OW.By3D.lys(farge, 0.12));
    }
    if (opts.medBunn) {
      this.firkant([x - b2, y, z + d2], [x + b2, y, z + d2], [x + b2, y, z - d2], [x - b2, y, z - d2], bunn);
    }
  },

  /* Saltak: to skrå flater + to gavler */
  saltak: function (x, y, z, bredde, hoyde, dybde, farge) {
    var b2 = bredde / 2, d2 = dybde / 2, y2 = y + hoyde;
    var m = OW.By3D.mork(farge, 0.18);
    this.firkant([x - b2, y, z + d2], [x + b2, y, z + d2], [x + b2, y2, z], [x - b2, y2, z], farge);
    this.firkant([x + b2, y, z - d2], [x - b2, y, z - d2], [x - b2, y2, z], [x + b2, y2, z], m);
    this.trekant([x - b2, y, z + d2], [x - b2, y2, z], [x - b2, y, z - d2], m);
    this.trekant([x + b2, y, z - d2], [x + b2, y2, z], [x + b2, y, z + d2], m);
  },

  /* Pyramide/spir */
  spir: function (x, y, z, bredde, hoyde, farge) {
    var b2 = bredde / 2, t = [x, y + hoyde, z];
    var h = [[x - b2, y, z - b2], [x + b2, y, z - b2], [x + b2, y, z + b2], [x - b2, y, z + b2]];
    for (var i = 0; i < 4; i++) {
      this.trekant(h[i], h[(i + 1) % 4], t, i % 2 ? OW.By3D.mork(farge, 0.12) : farge);
    }
  },

  /* Sylinder / kjegle (topp = 0 gir kjegle) */
  sylinder: function (x, y, z, radius, hoyde, farge, sider, toppRadius) {
    sider = sider || 8;
    var tr = toppRadius === undefined ? radius : toppRadius;
    var m = OW.By3D.mork(farge, 0.16);
    for (var i = 0; i < sider; i++) {
      var a = (i / sider) * Math.PI * 2, b = ((i + 1) / sider) * Math.PI * 2;
      var p1 = [x + Math.cos(a) * radius, y, z + Math.sin(a) * radius];
      var p2 = [x + Math.cos(b) * radius, y, z + Math.sin(b) * radius];
      var p3 = [x + Math.cos(b) * tr, y + hoyde, z + Math.sin(b) * tr];
      var p4 = [x + Math.cos(a) * tr, y + hoyde, z + Math.sin(a) * tr];
      var f = i % 2 ? m : farge;
      if (tr < 0.001) this.trekant(p1, p2, [x, y + hoyde, z], f);
      else this.firkant(p1, p2, p3, p4, f);
    }
    if (tr > 0.001) {
      for (var j = 0; j < sider; j++) {
        var a2 = (j / sider) * Math.PI * 2, b2 = ((j + 1) / sider) * Math.PI * 2;
        this.trekant([x, y + hoyde, z],
          [x + Math.cos(a2) * tr, y + hoyde, z + Math.sin(a2) * tr],
          [x + Math.cos(b2) * tr, y + hoyde, z + Math.sin(b2) * tr], OW.By3D.lys(farge, 0.1));
      }
    }
  },

  /* Halvkuppel */
  kuppel: function (x, y, z, radius, hoyde, farge, sider) {
    sider = sider || 10;
    var ringer = 4;
    for (var r = 0; r < ringer; r++) {
      var v1 = (r / ringer) * (Math.PI / 2), v2 = ((r + 1) / ringer) * (Math.PI / 2);
      var r1 = Math.cos(v1) * radius, r2 = Math.cos(v2) * radius;
      var h1 = Math.sin(v1) * hoyde, h2 = Math.sin(v2) * hoyde;
      for (var i = 0; i < sider; i++) {
        var a = (i / sider) * Math.PI * 2, b = ((i + 1) / sider) * Math.PI * 2;
        var f = (i + r) % 2 ? OW.By3D.mork(farge, 0.1) : farge;
        this.firkant(
          [x + Math.cos(a) * r1, y + h1, z + Math.sin(a) * r1],
          [x + Math.cos(b) * r1, y + h1, z + Math.sin(b) * r1],
          [x + Math.cos(b) * r2, y + h2, z + Math.sin(b) * r2],
          [x + Math.cos(a) * r2, y + h2, z + Math.sin(a) * r2], f);
      }
    }
  },

  /* Flatt rektangel i xz-planet (bakke, vann, vei) */
  flate: function (x, y, z, bredde, dybde, farge, flagg) {
    var b2 = bredde / 2, d2 = dybde / 2;
    this.firkant([x - b2, y, z + d2], [x + b2, y, z + d2], [x + b2, y, z - d2], [x - b2, y, z - d2], farge, flagg);
  },

  /* Himmelkuppel sett fra innsiden: vinding er snudd, og fargen går fra
     horisont til senit. Tegnes uten lys og uten tåke (aFlagg = 3). */
  himmel: function (radius, horisont, senit) {
    var sider = 24, ringer = 8;
    for (var r = 0; r < ringer; r++) {
      var v1 = (r / ringer) * (Math.PI / 2), v2 = ((r + 1) / ringer) * (Math.PI / 2);
      var r1 = Math.cos(v1) * radius, r2 = Math.cos(v2) * radius;
      var y1 = Math.sin(v1) * radius * 0.65 - 12, y2 = Math.sin(v2) * radius * 0.65 - 12;
      var f1 = [
        horisont[0] + (senit[0] - horisont[0]) * Math.pow(r / ringer, 0.42),
        horisont[1] + (senit[1] - horisont[1]) * Math.pow(r / ringer, 0.42),
        horisont[2] + (senit[2] - horisont[2]) * Math.pow(r / ringer, 0.42)
      ];
      var f2 = [
        horisont[0] + (senit[0] - horisont[0]) * Math.pow((r + 1) / ringer, 0.42),
        horisont[1] + (senit[1] - horisont[1]) * Math.pow((r + 1) / ringer, 0.42),
        horisont[2] + (senit[2] - horisont[2]) * Math.pow((r + 1) / ringer, 0.42)
      ];
      for (var i = 0; i < sider; i++) {
        var a = (i / sider) * Math.PI * 2, b = ((i + 1) / sider) * Math.PI * 2;
        var p1 = [Math.cos(a) * r1, y1, Math.sin(a) * r1];
        var p2 = [Math.cos(b) * r1, y1, Math.sin(b) * r1];
        var p3 = [Math.cos(b) * r2, y2, Math.sin(b) * r2];
        var p4 = [Math.cos(a) * r2, y2, Math.sin(a) * r2];
        /* motsatt vei av vanlige flater – vi ser kuppelen innenfra */
        this.trekant(p2, p1, p4, f1, 3);
        this.trekant(p2, p4, p3, f2, 3);
      }
    }
  },

  antall: function () { return this.pos.length / 3; }
};

/* ------------------------------------------------------------------ SHADER */
OW.GL = {
  vertexKilde: [
    'attribute vec3 aPos;',
    'attribute vec3 aNor;',
    'attribute vec3 aFarge;',
    'attribute float aFlagg;',
    'uniform mat4 uProj;',
    'uniform mat4 uView;',
    'uniform vec3 uSol;',
    'uniform vec3 uSolFarge;',
    'uniform vec3 uFyll;',
    'uniform vec3 uFyllFarge;',
    'uniform vec3 uAmbient;',
    'uniform float uTid;',
    'uniform float uNatt;',
    'uniform vec3 uHimmelTint;',
    'varying vec3 vFarge;',
    'varying float vAvstand;',
    'void main() {',
    '  vec3 p = aPos;',
    '  if (aFlagg > 0.5 && aFlagg < 1.5) {',
    '    p.y += sin(uTid * 1.3 + p.x * 0.55 + p.z * 0.4) * 0.07;',   // bølger
    '  }',
    '  vec4 vp = uView * vec4(p, 1.0);',
    '  gl_Position = uProj * vp;',
    '  if (aFlagg > 2.5) {',                                          // himmelkuppel
    '    vFarge = aFarge * uHimmelTint;',
    '    vAvstand = 0.0;',                                            // aldri tåke
    '    return;',
    '  }',
    '  vec3 n = normalize(aNor);',
    '  float sollys = max(dot(n, uSol), 0.0);',
    '  float fyll = max(dot(n, uFyll), 0.0) * 0.42;',           // svakt motlys
    '  float himmel = 0.62 + 0.38 * max(n.y, 0.0);',            // lyset ovenfra
    '  vec3 f = aFarge * (uAmbient * himmel + uSolFarge * sollys + uFyllFarge * fyll);',
    '  if (aFlagg > 1.5) {',                                          // vinduer
    '    f = mix(f, vec3(1.0, 0.86, 0.52), uNatt * 0.92);',
    '  }',
    '  vFarge = f;',
    '  vAvstand = length(vp.xyz);',
    '}'
  ].join('\n'),

  fragmentKilde: [
    'precision mediump float;',
    'varying vec3 vFarge;',
    'varying float vAvstand;',
    'uniform vec3 uTakeFarge;',
    'uniform float uTakeNaer;',
    'uniform float uTakeFjern;',
    'void main() {',
    '  float t = clamp((vAvstand - uTakeNaer) / (uTakeFjern - uTakeNaer), 0.0, 1.0);',
    '  gl_FragColor = vec4(mix(vFarge, uTakeFarge, t), 1.0);',
    '}'
  ].join('\n'),

  lagShader: function (gl, type, kilde) {
    var s = gl.createShader(type);
    gl.shaderSource(s, kilde);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('Shaderfeil: ' + gl.getShaderInfoLog(s));
    }
    return s;
  },

  lagProgram: function (gl) {
    var p = gl.createProgram();
    gl.attachShader(p, OW.GL.lagShader(gl, gl.VERTEX_SHADER, OW.GL.vertexKilde));
    gl.attachShader(p, OW.GL.lagShader(gl, gl.FRAGMENT_SHADER, OW.GL.fragmentKilde));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Lenkefeil: ' + gl.getProgramInfoLog(p));
    }
    return p;
  }
};
