/* OpenWorld 3D – scenen
 *
 * Kamera, lys, døgnsyklus, museklikk og etiketter over byen.
 * Geometrien bygges bare om når byen faktisk endrer seg.
 */
window.OW = window.OW || {};

OW.Scene = {
  aktiv: false,
  synlig: false,
  gl: null,
  signatur: '',
  merker: [],
  byRadius: 20,

  kamera: { yaw: 3.86, pitch: 0.58, dist: 46, maalY: 1.5 },
  _drar: false, _sisteP: null, _pinch: 0,
  _harRort: false,
  _hover: null,
  _tid: 55,          // start midt på dagen, ikke i grålysningen
  _sisteRamme: 0,

  /* ------------------------------------------------------------- OPPSTART */
  start: function (lerret, etikettLag) {
    OW.Scene.lerret = lerret;
    OW.Scene.etikettLag = etikettLag;
    var gl = null;
    try {
      gl = lerret.getContext('webgl', { antialias: true, alpha: false }) ||
           lerret.getContext('experimental-webgl', { antialias: true, alpha: false });
    } catch (e) { gl = null; }
    if (!gl) return false;

    OW.Scene.gl = gl;
    try {
      OW.Scene.program = OW.GL.lagProgram(gl);
    } catch (e) {
      console.warn('3D utilgjengelig:', e.message);
      return false;
    }

    var p = OW.Scene.program;
    gl.useProgram(p);
    OW.Scene.attr = {
      pos: gl.getAttribLocation(p, 'aPos'),
      nor: gl.getAttribLocation(p, 'aNor'),
      farge: gl.getAttribLocation(p, 'aFarge'),
      flagg: gl.getAttribLocation(p, 'aFlagg')
    };
    OW.Scene.uni = {};
    ['uProj', 'uView', 'uSol', 'uSolFarge', 'uFyll', 'uFyllFarge', 'uAmbient', 'uTid', 'uNatt',
     'uHimmelTint', 'uTakeFarge', 'uTakeNaer', 'uTakeFjern'].forEach(function (n) {
      OW.Scene.uni[n] = gl.getUniformLocation(p, n);
    });

    OW.Scene.buffere = {
      pos: gl.createBuffer(), nor: gl.createBuffer(),
      farge: gl.createBuffer(), flagg: gl.createBuffer()
    };
    OW.Scene.antall = 0;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    OW.Scene.koblePeker();
    OW.Scene.aktiv = true;
    requestAnimationFrame(OW.Scene.ramme);
    return true;
  },

  /* ---------------------------------------------------------------- INPUT */
  koblePeker: function () {
    var c = OW.Scene.lerret;

    var start = function (x, y) {
      OW.Scene._drar = true;
      OW.Scene._sisteP = { x: x, y: y };
      OW.Scene._flyttet = 0;
      OW.Scene._harRort = true;
    };
    var flytt = function (x, y) {
      if (!OW.Scene._drar) { OW.Scene.sjekkHover(x, y); return; }
      var dx = x - OW.Scene._sisteP.x, dy = y - OW.Scene._sisteP.y;
      OW.Scene._sisteP = { x: x, y: y };
      OW.Scene._flyttet += Math.abs(dx) + Math.abs(dy);
      OW.Scene.kamera.yaw -= dx * 0.006;
      OW.Scene.kamera.pitch = OW.klem(OW.Scene.kamera.pitch + dy * 0.005, 0.12, 1.35);
    };
    var slutt = function (x, y) {
      if (OW.Scene._drar && OW.Scene._flyttet < 6) OW.Scene.klikk(x, y);
      OW.Scene._drar = false;
    };

    c.addEventListener('mousedown', function (e) { start(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { flytt(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function (e) { slutt(e.clientX, e.clientY); });
    c.addEventListener('mouseleave', function () { OW.Scene._hover = null; });

    c.addEventListener('wheel', function (e) {
      e.preventDefault();
      OW.Scene._harRort = true;
      OW.Scene.zoom(e.deltaY > 0 ? 1.12 : 0.89);
    }, { passive: false });

    c.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) start(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) OW.Scene._pinch = OW.Scene.pinchAvstand(e);
    }, { passive: true });

    c.addEventListener('touchmove', function (e) {
      if (e.touches.length === 1) {
        flytt(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2 && OW.Scene._pinch) {
        var na = OW.Scene.pinchAvstand(e);
        OW.Scene.zoom(OW.Scene._pinch / na);
        OW.Scene._pinch = na;
        e.preventDefault();
      }
    }, { passive: false });

    c.addEventListener('touchend', function (e) {
      if (OW.Scene._drar && e.changedTouches.length) {
        slutt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      OW.Scene._drar = false;
      OW.Scene._pinch = 0;
    });
  },

  pinchAvstand: function (e) {
    var a = e.touches[0], b = e.touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  },

  zoom: function (faktor) {
    OW.Scene.kamera.dist = OW.klem(OW.Scene.kamera.dist * faktor, 12, 140);
  },

  nullstillKamera: function () {
    OW.Scene.kamera.yaw = 3.86;      // ser mot innsjøen i nord
    OW.Scene.kamera.pitch = 0.58;
    OW.Scene.kamera.dist = OW.klem(OW.Scene.byRadius * 2.1 + 5, 18, 120);
  },

  /* --------------------------------------------------- STRÅLE MOT BAKKEN */
  /* Regner ut hvilken tomt musepekeren peker på, uten å invertere matriser:
     vi bygger strålen direkte fra kameraets egne akser. */
  tomtUnder: function (skjermX, skjermY) {
    var c = OW.Scene.lerret, rekt = c.getBoundingClientRect();
    var nx = ((skjermX - rekt.left) / rekt.width) * 2 - 1;
    var ny = 1 - ((skjermY - rekt.top) / rekt.height) * 2;
    if (nx < -1 || nx > 1 || ny < -1 || ny > 1) return null;

    var k = OW.Scene.kamera;
    var oye = OW.Scene.oyePosisjon();
    var mal = [0, k.maalY, 0];
    var fram = OW.M.normaliser([mal[0] - oye[0], mal[1] - oye[1], mal[2] - oye[2]]);
    var hoyre = OW.M.normaliser(OW.M.kryss(fram, [0, 1, 0]));
    var opp = OW.M.kryss(hoyre, fram);

    var t = Math.tan(0.86 / 2);
    var sideforhold = rekt.width / rekt.height;
    var dir = OW.M.normaliser([
      fram[0] + hoyre[0] * nx * t * sideforhold + opp[0] * ny * t,
      fram[1] + hoyre[1] * nx * t * sideforhold + opp[1] * ny * t,
      fram[2] + hoyre[2] * nx * t * sideforhold + opp[2] * ny * t
    ]);
    if (Math.abs(dir[1]) < 1e-5) return null;

    var avst = (0.16 - oye[1]) / dir[1];
    if (avst < 0) return null;
    var px = oye[0] + dir[0] * avst, pz = oye[2] + dir[2] * avst;

    var cx = Math.round(px / OW.By3D.CELLE), cz = Math.round(pz / OW.By3D.CELLE);
    if (Math.abs(px - cx * OW.By3D.CELLE) > OW.By3D.TOMT / 2) return null;
    if (Math.abs(pz - cz * OW.By3D.CELLE) > OW.By3D.TOMT / 2) return null;
    return { cx: cx, cz: cz, x: cx * OW.By3D.CELLE, z: cz * OW.By3D.CELLE };
  },

  byggPaaTomt: function (tomt) {
    if (!tomt) return null;
    var funnet = null;
    OW.BYGG.forEach(function (b) {
      if (b.id === 'bymur' || funnet) return;
      var t = OW.By3D.tomtFor(b.id);
      if (Math.abs(t.x - tomt.x) < 0.01 && Math.abs(t.z - tomt.z) < 0.01) funnet = b.id;
    });
    return funnet;
  },

  sjekkHover: function (x, y) {
    var t = OW.Scene.tomtUnder(x, y);
    var id = OW.Scene.byggPaaTomt(t);
    OW.Scene._hover = id ? t : null;
    OW.Scene._hoverId = id;
    OW.Scene.lerret.style.cursor = id ? 'pointer' : 'grab';
  },

  klikk: function (x, y) {
    var id = OW.Scene.byggPaaTomt(OW.Scene.tomtUnder(x, y));
    if (id && OW.Scene.velgBygg) OW.Scene.velgBygg(id);
  },

  /* -------------------------------------------------------------- GEOMETRI */
  signaturFor: function (s) {
    var d = [s.era];
    OW.BYGG.forEach(function (b) { d.push(s.bygg[b.id] || 0); });
    for (var i = 0; i < s.ko.length; i++) d.push('k' + s.ko[i].id);
    return d.join(',');
  },

  oppdaterBy: function (s, tving) {
    var sig = OW.Scene.signaturFor(s);
    if (!tving && sig === OW.Scene.signatur) return;
    OW.Scene.signatur = sig;

    var res = OW.By3D.byggBy(s);
    OW.Scene.merker = res.merker;
    OW.Scene.byRadius = res.byRadius;
    OW.Scene.palett = OW.By3D.PALETT[Math.min(s.era, OW.By3D.PALETT.length - 1)];

    var gl = OW.Scene.gl, m = res.mesh, b = OW.Scene.buffere;
    var last = function (buf, data, ant) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    };
    last(b.pos, m.pos);
    last(b.nor, m.nor);
    last(b.farge, m.farge);
    last(b.flagg, m.flagg);
    OW.Scene.antall = m.antall();

    if (!OW.Scene._harRort) OW.Scene.nullstillKamera();
  },

  oyePosisjon: function () {
    var k = OW.Scene.kamera;
    return [
      Math.cos(k.pitch) * Math.sin(k.yaw) * k.dist,
      k.maalY + Math.sin(k.pitch) * k.dist,
      Math.cos(k.pitch) * Math.cos(k.yaw) * k.dist
    ];
  },

  /* ------------------------------------------------------------------ TEGN */
  ramme: function (naa) {
    requestAnimationFrame(OW.Scene.ramme);
    if (!OW.Scene.aktiv || !OW.Scene.synlig || !OW.Scene.antall) return;

    var dt = OW.Scene._sisteRamme ? Math.min(0.1, (naa - OW.Scene._sisteRamme) / 1000) : 0.016;
    OW.Scene._sisteRamme = naa;
    OW.Scene._tid += dt;

    /* Vis fram byen med en rolig runde helt til spilleren tar over */
    if (!OW.Scene._harRort) OW.Scene.kamera.yaw += dt * 0.075;

    var gl = OW.Scene.gl, c = OW.Scene.lerret;
    var pd = Math.min(window.devicePixelRatio || 1, 2);
    var bredde = Math.round(c.clientWidth * pd), hoyde = Math.round(c.clientHeight * pd);
    if (!bredde || !hoyde) return;
    if (c.width !== bredde || c.height !== hoyde) { c.width = bredde; c.height = hoyde; }
    gl.viewport(0, 0, bredde, hoyde);

    /* Døgnsyklus: full runde på fire minutter */
    var dogn = (OW.Scene._tid % 240) / 240;
    var solVinkel = dogn * Math.PI * 2;
    var solHoyde = Math.sin(solVinkel);
    var natt = OW.klem((0.16 - solHoyde) * 2.2, 0, 1);
    /* Sola følger kameraet med litt forskyvning. Ellers ser vi alltid
       skyggesiden av byen, og alt blir svarte silhuetter. Døgnsyklusen
       styrer høyden og fargen i stedet for retningen. */
    var solAz = OW.Scene.kamera.yaw + 0.62;
    var solY = 0.34 + 0.42 * Math.max(0, solHoyde);
    var sol = OW.M.normaliser([Math.sin(solAz) * 0.85, solY, Math.cos(solAz) * 0.85]);
    var fyll = OW.M.normaliser([-sol[0], 0.4, -sol[2]]);

    var p = OW.Scene.palett || OW.By3D.PALETT[0];
    var kveld = OW.klem(1 - Math.abs(solHoyde) * 2.4, 0, 1);        // varmt lys ved soloppgang/solnedgang
    var solFarge = [
      (1.0 - natt * 0.72) * (1 + kveld * 0.25),
      (0.96 - natt * 0.72) * (1 - kveld * 0.08),
      (0.86 - natt * 0.6) * (1 - kveld * 0.3)
    ];
    var ambient = [0.40 + (1 - natt) * 0.20, 0.43 + (1 - natt) * 0.20, 0.52 + (1 - natt) * 0.16];
    var fyllFarge = [0.34 * (1 - natt * 0.7), 0.38 * (1 - natt * 0.7), 0.46 * (1 - natt * 0.6)];
    var himmel = [
      p.himmel[0] * (1 - natt * 0.86) + 0.05 * natt + kveld * 0.16,
      p.himmel[1] * (1 - natt * 0.86) + 0.06 * natt + kveld * 0.04,
      p.himmel[2] * (1 - natt * 0.78) + 0.14 * natt
    ];

    gl.clearColor(himmel[0], himmel[1], himmel[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var oye = OW.Scene.oyePosisjon();
    var proj = OW.M.perspektiv(0.86, bredde / hoyde, 0.5, 800);
    var view = OW.M.seMot(oye, [0, OW.Scene.kamera.maalY, 0], [0, 1, 0]);

    gl.useProgram(OW.Scene.program);
    gl.uniformMatrix4fv(OW.Scene.uni.uProj, false, proj);
    gl.uniformMatrix4fv(OW.Scene.uni.uView, false, view);
    gl.uniform3fv(OW.Scene.uni.uSol, new Float32Array(sol));
    gl.uniform3fv(OW.Scene.uni.uSolFarge, new Float32Array(solFarge));
    gl.uniform3fv(OW.Scene.uni.uFyll, new Float32Array(fyll));
    gl.uniform3fv(OW.Scene.uni.uFyllFarge, new Float32Array(fyllFarge));
    gl.uniform3fv(OW.Scene.uni.uAmbient, new Float32Array(ambient));
    gl.uniform1f(OW.Scene.uni.uTid, OW.Scene._tid);
    gl.uniform1f(OW.Scene.uni.uNatt, natt);
    var horisont = [
      OW.klem(p.himmel[0] * 1.16 * (1 - natt * 0.86) + kveld * 0.22, 0, 1),
      OW.klem(p.himmel[1] * 1.16 * (1 - natt * 0.88) + kveld * 0.02, 0, 1),
      OW.klem(p.himmel[2] * 1.16 * (1 - natt * 0.72) - kveld * 0.06, 0, 1)
    ];
    gl.uniform3fv(OW.Scene.uni.uTakeFarge, new Float32Array(horisont));
    gl.uniform1f(OW.Scene.uni.uTakeNaer, 50);
    gl.uniform1f(OW.Scene.uni.uTakeFjern, 245);
    gl.uniform3fv(OW.Scene.uni.uHimmelTint, new Float32Array([
      (1 - natt * 0.86) + kveld * 0.22,
      (1 - natt * 0.88) + kveld * 0.02,
      (1 - natt * 0.72) - kveld * 0.06
    ]));

    var a = OW.Scene.attr, b = OW.Scene.buffere;
    var bind = function (buf, plass, str) {
      if (plass < 0) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(plass);
      gl.vertexAttribPointer(plass, str, gl.FLOAT, false, 0, 0);
    };
    bind(b.pos, a.pos, 3);
    bind(b.nor, a.nor, 3);
    bind(b.farge, a.farge, 3);
    bind(b.flagg, a.flagg, 1);
    gl.drawArrays(gl.TRIANGLES, 0, OW.Scene.antall);

    OW.Scene.tegnEtiketter(OW.M.gang(proj, view), bredde / pd, hoyde / pd, natt);
  },

  /* Etikettene er vanlige HTML-elementer som projiseres ned på 2D */
  tegnEtiketter: function (mvp, bredde, hoyde, natt) {
    var lag = OW.Scene.etikettLag;
    if (!lag) return;
    var merker = OW.Scene.merker;

    while (lag.children.length < merker.length) {
      var d = document.createElement('div');
      d.className = 'by3d-etikett';
      lag.appendChild(d);
    }
    while (lag.children.length > merker.length) lag.removeChild(lag.lastChild);

    /* Nærmeste etiketter vinner plassen; resten skjules så det ikke blir grøt */
    var plassert = [];
    var rekke = merker.map(function (mk, i) {
      return { mk: mk, el: lag.children[i], s: OW.M.tilSkjerm(mvp, [mk.x, mk.y, mk.z], bredde, hoyde) };
    }).sort(function (a, b) { return (a.s ? a.s.d : 1e9) - (b.s ? b.s.d : 1e9); });

    for (var i = 0; i < rekke.length; i++) {
      var mk = rekke[i].mk, el = rekke[i].el, s = rekke[i].s;
      if (!s || s.d > 130) { el.style.display = 'none'; continue; }
      var viktig = OW.Scene._hoverId === mk.id || mk.bygger;
      var kollisjon = false;
      for (var q = 0; q < plassert.length && !viktig; q++) {
        if (Math.abs(plassert[q].x - s.x) < 46 && Math.abs(plassert[q].y - s.y) < 17) { kollisjon = true; break; }
      }
      if (kollisjon) { el.style.display = 'none'; continue; }
      plassert.push(s);
      var tekst = mk.bygger ? mk.ikon + ' ' + mk.navn : mk.ikon + ' ' + mk.niva;
      if (el.textContent !== tekst) el.textContent = tekst;
      el.style.display = 'block';
      el.style.transform = 'translate(-50%,-100%) translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
      el.style.opacity = OW.klem(1.25 - s.d / 110, 0.15, 1).toFixed(2);
      var uthevet = OW.Scene._hoverId === mk.id;
      if (el.dataset.uth !== String(uthevet)) {
        el.dataset.uth = String(uthevet);
        el.classList.toggle('uthevet', uthevet);
      }
    }
  },

  settSynlig: function (paa) {
    OW.Scene.synlig = paa;
  }
};
