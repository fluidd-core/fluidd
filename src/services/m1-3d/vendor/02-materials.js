/* ===========================================================================
   02-materials.js - every texture in this model is generated at runtime on a
   canvas. Nothing is fetched, which keeps the whole thing one self-contained
   file and means the maps scale with the device pixel ratio.
   =========================================================================== */
(function (global) {
'use strict';
var T = global.THREE;
var M1 = global.M1;

function canvas(w, h) {
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* value noise, seeded, tileable enough for what it is used for here */
/* `mid` is the level the noise is centred on, and it matters more than it
   looks: three.js MULTIPLIES roughnessMap into `roughness`, so a map centred
   on 0.5 - which is what an un-biased noise canvas is - silently HALVES every
   roughness in the material list.  The base shells were asking for 0.30 and
   rendering at 0.15, which is a near mirror, and the deck duly threw the rim
   light's reflection straight down the lens at a clipped 255 where the
   photograph reads a flat 190.5.  A roughness map is meant to be a ripple
   about unity, so these are centred on 0.97. */
function noiseField(size, scale, contrast, mid) {
  var grid = Math.max(2, Math.round(size / scale));
  var g = new Float32Array(grid * grid), out = new Float32Array(size * size);
  var i, j;
  for (i = 0; i < g.length; i++) g[i] = Math.random();
  for (j = 0; j < size; j++) {
    var fy = j / size * grid, y0 = Math.floor(fy), ty = fy - y0;
    ty = ty * ty * (3 - 2 * ty);
    var r0 = (y0 % grid) * grid, r1 = ((y0 + 1) % grid) * grid;
    for (i = 0; i < size; i++) {
      var fx = i / size * grid, x0 = Math.floor(fx), tx = fx - x0;
      tx = tx * tx * (3 - 2 * tx);
      var c0 = x0 % grid, c1 = (x0 + 1) % grid;
      var v = (g[r0 + c0] * (1 - tx) + g[r0 + c1] * tx) * (1 - ty) +
              (g[r1 + c0] * (1 - tx) + g[r1 + c1] * tx) * ty;
      v = (mid === undefined ? 0.5 : mid) + (v - 0.5) * (contrast || 1);
      out[j * size + i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  return out;
}
function fieldCanvas(size, f) {
  var c = canvas(size, size), x = c.getContext('2d');
  var img = x.createImageData(size, size), d = img.data;
  for (var i = 0; i < size * size; i++) {
    var b = Math.round(f[i] * 255);
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}
function noiseCanvas(size, scale, contrast, mid) {
  return fieldCanvas(size, noiseField(size, scale, contrast, mid));
}

/* height field -> tangent-space normal map */
function heightToNormal(src, strength) {
  var size = src.width;
  var sx = src.getContext('2d').getImageData(0, 0, size, size).data;
  var out = canvas(size, size), ox = out.getContext('2d');
  var img = ox.createImageData(size, size), d = img.data;
  var h = new Float32Array(size * size), i, j;
  for (i = 0; i < size * size; i++) h[i] = sx[i * 4] / 255;
  for (j = 0; j < size; j++) {
    var jm = ((j - 1 + size) % size) * size, jp = ((j + 1) % size) * size, jr = j * size;
    for (i = 0; i < size; i++) {
      var im = (i - 1 + size) % size, ip = (i + 1) % size;
      var nx = -(h[jr + ip] - h[jr + im]) * strength;
      var ny = -(h[jp + i] - h[jm + i]) * strength;
      var L = Math.sqrt(nx * nx + ny * ny + 1);
      var p = (jr + i) * 4;
      d[p] = Math.round((nx / L * 0.5 + 0.5) * 255);
      d[p + 1] = Math.round((ny / L * 0.5 + 0.5) * 255);
      d[p + 2] = Math.round((1 / L * 0.5 + 0.5) * 255);
      d[p + 3] = 255;
    }
  }
  ox.putImageData(img, 0, 0);
  return out;
}

function tex(c, rx, ry, srgb) {
  var t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(rx || 1, ry || 1);
  t.anisotropy = 16;
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  return t;
}

/* MATERIAL anisotropy is off everywhere.  It needs a tangent attribute, and
   none of these lofts carry one, so three falls back to screen-space
   derivatives - which on the carriage plate at a grazing angle turned a
   plain machined face into black-and-white salt and pepper.  Isolated by
   clearing it on that one mesh: 4253 speckled pixels down to 478. */
/* ---- brushed aluminium: fine unidirectional streaks ---------------------- */
function brushedHeight(size, density, len) {
  var c = canvas(size, size), x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  for (var i = 0; i < density; i++) {
    var y = Math.random() * size;
    var w = Math.random() * len + len * 0.3;
    var x0 = Math.random() * size;
    var v = 128 + (Math.random() - 0.5) * 150;
    x.strokeStyle = 'rgba(' + (v | 0) + ',' + (v | 0) + ',' + (v | 0) + ',' + (0.25 + Math.random() * 0.5) + ')';
    x.lineWidth = Math.random() < 0.85 ? 1 : 2;
    x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + w, y); x.stroke();
    if (x0 + w > size) { x.beginPath(); x.moveTo(x0 - size, y); x.lineTo(x0 + w - size, y); x.stroke(); }
  }
  return c;
}

/* ---- bead-blasted / shot-peened satin ------------------------------------ */
function beadHeight(size) {
  /* Each bead is a soft dimple or bump, alpha-blended onto mid grey: a
     radial ramp from its own level at 0.75 opacity to grey at nothing, which
     is exactly what the canvas radial gradients used to paint.  Done in a
     float buffer instead, because 42 thousand gradient fills were most of
     the model's build time (about two seconds of it). */
  var c = canvas(size, size), x = c.getContext('2d');
  var buf = new Float32Array(size * size).fill(128);
  var n = Math.round(size * size * 0.16), i, ix, iy;
  for (i = 0; i < n; i++) {
    var px = Math.random() * size, py = Math.random() * size;
    var r = 0.6 + Math.random() * 1.5;
    var v = Math.random() < 0.5 ? 96 : 168;
    var x0 = Math.floor(px - r), x1 = Math.ceil(px + r), y0 = Math.floor(py - r), y1 = Math.ceil(py + r);
    for (iy = y0; iy <= y1; iy++) {
      var dy = iy + 0.5 - py, row = ((iy % size) + size) % size * size;
      for (ix = x0; ix <= x1; ix++) {
        var dx = ix + 0.5 - px, t = Math.sqrt(dx * dx + dy * dy) / r;
        if (t >= 1) continue;
        var a = 0.75 * (1 - t), col = v + (128 - v) * t, k = row + ((ix % size) + size) % size;
        buf[k] = buf[k] * (1 - a) + col * a;
      }
    }
  }
  var img = x.createImageData(size, size), d = img.data;
  for (i = 0; i < size * size; i++) {
    var b = Math.round(buf[i]);
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

/* ---- GT2 belt teeth ------------------------------------------------------ */
function beltHeight(size) {
  var c = canvas(size, size), x = c.getContext('2d');
  x.fillStyle = '#6a6a6a'; x.fillRect(0, 0, size, size);
  var pitch = size / 16;
  for (var i = 0; i < 16; i++) {
    var x0 = i * pitch;
    var g = x.createLinearGradient(x0, 0, x0 + pitch, 0);
    g.addColorStop(0.00, '#4a4a4a');
    g.addColorStop(0.22, '#d8d8d8');
    g.addColorStop(0.50, '#f0f0f0');
    g.addColorStop(0.78, '#d8d8d8');
    g.addColorStop(1.00, '#4a4a4a');
    x.fillStyle = g; x.fillRect(x0, 0, pitch, size);
  }
  /* fibreglass cord ghosting along the back */
  x.globalAlpha = 0.10;
  for (var j = 0; j < size; j += 4) {
    x.fillStyle = j % 8 === 0 ? '#fff' : '#000';
    x.fillRect(0, j, size, 2);
  }
  x.globalAlpha = 1;
  return c;
}

/* ---- FDM layer lines ----------------------------------------------------- */
function layerHeight(size) {
  var c = canvas(size, size), x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  var pitch = size / 40;
  for (var i = 0; i < 40; i++) {
    var y0 = i * pitch;
    var g = x.createLinearGradient(0, y0, 0, y0 + pitch);
    g.addColorStop(0.0, '#5c5c5c');
    g.addColorStop(0.45, '#c8c8c8');
    g.addColorStop(0.55, '#bebebe');
    g.addColorStop(1.0, '#5c5c5c');
    x.fillStyle = g; x.fillRect(0, y0, size, pitch);
  }
  return c;
}

/* ---- soft-touch rubber --------------------------------------------------- */
function rubberHeight(size) {
  /* two octaves of value noise, the coarse one at half weight - mixed in a
     buffer, not by compositing canvases, which cost a canvas read-back */
  var a = noiseField(size, 3, 1.5), b = noiseField(size, 9, 1.2);
  for (var i = 0; i < a.length; i++) a[i] = a[i] * 0.5 + b[i] * 0.5;
  return fieldCanvas(size, a);
}

/* ==========================================================================
   the material set
   ========================================================================== */
M1.buildMaterials = function () {
  var m = {};

  var brushed = heightToNormal(brushedHeight(1024, 5200, 300), 2.2);
  var bead = heightToNormal(beadHeight(512), 1.5);
  var beltN = heightToNormal(beltHeight(512), 5.0);
  var layerN = heightToNormal(layerHeight(512), 4.0);
  var rubberN = heightToNormal(rubberHeight(512), 2.6);
  var beadRough = noiseCanvas(512, 26, 0.14, 0.97);

  /* --- CNC bead-blasted aluminium: the base shells ------------------------
     The ROUGHNESS is measured, not styled.  s3_1 holds the deck - a
     horizontal face - at 190.5 and the base wall - a vertical one cut from
     the same shell - at 159.1, a ratio of only 1.20, and both are flat to
     sd 2.4 and 4.5.  A metal at roughness 0.3 cannot do that: its lobe is
     narrow enough that the deck mirrors the white sky while the wall
     mirrors half sky and half floor, and the render duly came out at a
     clipped 255 over 139.7, a ratio of at least 1.82 with the whole deck
     blown to paper.  Bead blasting is exactly the process that widens the
     lobe until the two faces converge, so the roughness goes up until the
     ratio does. */
  m.aluShell = new T.MeshPhysicalMaterial({
    color: 0xd7d6d4, metalness: 1.0, roughness: 0.85,
    normalMap: tex(bead, 9, 9), normalScale: new T.Vector2(0.30, 0.30),
    roughnessMap: tex(beadRough, 5, 5),
    envMapIntensity: 0.50,
    clearcoat: 0.10, clearcoatRoughness: 0.42
  });

  /* the machined deck reads a shade brighter and finer than the sidewall */
  m.aluDeck = new T.MeshPhysicalMaterial({
    color: 0xcbcac7, metalness: 1.0, roughness: 0.85,
    normalMap: tex(bead, 12, 12), normalScale: new T.Vector2(0.24, 0.24),
    roughnessMap: tex(beadRough, 7, 7),
    envMapIntensity: 0.50, clearcoat: 0.05, clearcoatRoughness: 0.42
  });

  /* --- machined / brushed aluminium: brackets, pod, mast ------------------ */
  /* At a grazing angle a near-mirror amplifies every wrinkle of its normal
     map into a swing of the reflection vector, and the carriage plate came
     out salt-and-peppered black on white because of it.  Softer brushing and
     a little more roughness kill it without changing the tone. */
  m.aluMach = new T.MeshPhysicalMaterial({
    color: 0xdddcda, metalness: 1.0, roughness: 0.31,
    normalMap: tex(brushed, 2, 2), normalScale: new T.Vector2(0.17, 0.17),
    envMapIntensity: 1.3
  });

  /* the pod is NOT polished. c_head shows a soft warm mid grey with almost
     no specular in it - bead blasted and anodised clear, a different finish
     from the shell it sits on, and a good 40 levels darker than the render
     had it. */
  m.aluPod = new T.MeshPhysicalMaterial({
    color: 0x9d9c99, metalness: 0.18, roughness: 0.63,
    normalMap: tex(bead, 8, 8), normalScale: new T.Vector2(0.22, 0.22),
    envMapIntensity: 0.62, clearcoat: 0.04, clearcoatRoughness: 0.5,
    specularIntensity: 0.28
  });

  /* --- polished: the mast blade and the rails ---------------------------- */
  /* the fan counterbore's wall: machined, not lapped, and shaded by the
     deck it is sunk into - c_mast reads it about 110, half the deck */
  m.aluPolishBoth = new T.MeshPhysicalMaterial({ color: 0xe6e5e3, metalness: 0.45, roughness: 0.28, side: T.DoubleSide });
  m.fanBevel = new T.MeshPhysicalMaterial({ color: 0x8d8c8a, metalness: 1.0, roughness: 0.42, envMapIntensity: 0.55 });
  /* the counterbore wall below the lead-in: it has to go BLACK on the near
     side, so it is darker and far less reflective than the rim it hangs off */
  m.fanWall = new T.MeshPhysicalMaterial({ color: 0x7d7c78, metalness: 1.0, roughness: 0.50, envMapIntensity: 0.52 });
  m.aluPolish = new T.MeshPhysicalMaterial({
    color: 0xedecea, metalness: 1.0, roughness: 0.075,
    normalMap: tex(brushed, 1, 6), normalScale: new T.Vector2(0.12, 0.12),
    envMapIntensity: 1.6
  });

  /* the mast blade: a dark tinted mirror. s1_1 reads it at a flat 98 top to
     bottom, far darker than any of the bright rails around it. */
  /* The blade is not lapped, it is SATIN.  Left as a mirror it swung from 98
     in s1_1 to 67 in c_mast while both photographs hold it near 150: a mirror
     samples one patch of the studio, a satin finish averages it. */
  m.mastBlade = new T.MeshPhysicalMaterial({
    color: 0xc3c1be, metalness: 1.0, roughness: 0.20,
    normalMap: tex(brushed, 1, 5), normalScale: new T.Vector2(0.07, 0.07),
    envMapIntensity: 0.75
  });

  /* c_folded shows the cross bar as blued steel - mid slate, clearly darker
     than the deck it crosses. It was rendering as flat white. */
  m.crossBar = new T.MeshPhysicalMaterial({
    color: 0xb4b3b1, metalness: 1.0, roughness: 0.165, envMapIntensity: 1.15
  });

  m.steelRail = new T.MeshPhysicalMaterial({
    /* ground steel, not a mirror. At roughness 0.135 the cross rail and the
       idler flanges clipped to flat white under the key and stopped reading
       as round things at all. */
    color: 0xc7c6c4, metalness: 1.0, roughness: 0.155,
    normalMap: tex(brushed, 1, 8), normalScale: new T.Vector2(0.14, 0.14),
    envMapIntensity: 1.15
  });

  /* --- leadscrew: darker, greyer steel ----------------------------------- */
  /* the exposed leadscrew: bright steel, but s1_1 measures it at a median
     of 95 with the thread roots down at 44 - much darker than the bolts. */
  m.leadScrew = new T.MeshPhysicalMaterial({
    color: 0x4e5356, metalness: 1.0, roughness: 0.34,
    envMapIntensity: 0.95
  });

  m.steelDark = new T.MeshPhysicalMaterial({
    color: 0x8b9296, metalness: 1.0, roughness: 0.335,
    normalMap: tex(bead, 6, 6), normalScale: new T.Vector2(0.3, 0.3),
    envMapIntensity: 1.1
  });

  /* --- black hard anodise ------------------------------------------------- */
  m.anodBlack = new T.MeshPhysicalMaterial({
    color: 0x22272a, metalness: 0.86, roughness: 0.42,
    normalMap: tex(bead, 10, 10), normalScale: new T.Vector2(0.28, 0.28),
    envMapIntensity: 0.95
  });

  m.anodBlackMatte = new T.MeshPhysicalMaterial({
    color: 0x25292c, metalness: 0.55, roughness: 0.62,
    normalMap: tex(bead, 12, 12), normalScale: new T.Vector2(0.3, 0.3),
    envMapIntensity: 0.8
  });

  /* --- champagne anodise: the Z-motor hood ------------------------------- */
  /* the little label next to the nozzle window: matte ivory, and in c_head it
     reads BRIGHTER than the bead-blasted aluminium round it, not gold. */
  m.ivoryLabel = new T.MeshPhysicalMaterial({
    color: 0xd8d1bd, metalness: 0.0, roughness: 0.52, envMapIntensity: 0.5
  });

  m.anodChampagne = new T.MeshPhysicalMaterial({
    /* s3_1 measures the hood at R-B +27 against the machined plate beside
       it at R-B 0 - a differential inside ONE frame, so it is the part and
       not the white balance.  The old +0.6 to +9.9 samples were read off a
       surface that was 95 per cent specular in the render, which washes any
       albedo out; metalness and env come down so the colour can show. */
    color: 0xab886b, metalness: 0.0, roughness: 0.55,
    normalMap: tex(bead, 3, 3), normalScale: new T.Vector2(0.09, 0.09),
    envMapIntensity: 0.15, clearcoat: 0.0, clearcoatRoughness: 0.40
  });

  /* --- brass ------------------------------------------------------------- */
  m.brass = new T.MeshPhysicalMaterial({
    color: 0xc79a52, metalness: 1.0, roughness: 0.185, envMapIntensity: 1.4
  });

  m.brassDull = new T.MeshPhysicalMaterial({
    color: 0xb08a4c, metalness: 1.0, roughness: 0.34, envMapIntensity: 1.1
  });

  /* --- black soft-touch bumpers and boots --------------------------------- */
  m.rubber = new T.MeshPhysicalMaterial({
    color: 0x2b3032, metalness: 0.0, roughness: 0.78,
    normalMap: tex(rubberN, 5, 5), normalScale: new T.Vector2(0.5, 0.5),
    envMapIntensity: 0.7, sheen: 0.25, sheenRoughness: 0.9, sheenColor: 0x2c3437
  });

  /* --- GT2 belt ----------------------------------------------------------- */
  m.belt = new T.MeshPhysicalMaterial({
    /* the teeth are at the right 2.00 pitch, but against a white sweep the
       normal map was throwing so much specular contrast that the belt read
       as a hairbrush. Same relief, much less sparkle. */
    color: 0x212528, metalness: 0.10, roughness: 0.74,
    normalMap: tex(beltN, 1, 1), normalScale: new T.Vector2(0.13, 0.07),
    envMapIntensity: 0.22
  });
  m.belt.normalMap.wrapS = T.RepeatWrapping;
  /* the open central strands are single ribbons, seen from both sides */
  m.beltBoth = m.belt.clone();
  m.beltBoth.side = T.DoubleSide;

  /* --- borosilicate build plate ------------------------------------------- */
  m.glass = new T.MeshPhysicalMaterial({
    /* the tint IS the missing surface reflection: attenuationDistance turns
       out to be inert on this build - 900 and 95 render the identical pixel -
       but three.js multiplies transmitted light by the base colour, and that
       is the one lever that takes the 8 per cent out. */
    color: 0xffffff, metalness: 0, roughness: 0.055,
    /* thickness is what displaces whatever is under the plate. At 5 the deck
       and the trough were thrown far enough sideways to read as separate
       white shapes floating on the glass. */
    /* The plate takes 8 per cent out of whatever is behind it - s3_1 holds
       the backdrop at 237 beside it and the plate at 217.7 - which is just
       the two air-glass interfaces reflecting 4 per cent each.  three.js
       transmission only books one of them, so the render lost 4.4 per cent
       against the photograph's 8.  The thickness is the plate's real 3.85 and
       the attenuation makes up the missing surface. */
    transmission: 1.0, thickness: 3.85, ior: 1.52,
    attenuationColor: new T.Color(0xdcdcda), attenuationDistance: 95,
    /* At this oblique angle real glass reflects the studio hard enough to
       HIDE what is behind it: s3_1 shows only a soft pale hint of the mast
       through the plate, while the render was transmitting it as a crisp grey
       bar dark enough (under 120) to be picked up as a seventh glyph blob by
       a wordmark detector.  specularIntensity was 0.5 - half the physical
       value for glass - so the Fresnel rise at grazing angles never came. */
    clearcoat: 0.0, clearcoatRoughness: 0.05,
    envMapIntensity: 0.75, specularIntensity: 0.60, side: T.DoubleSide
  });

  /* the ground-glass edge of a cut plate is frostier than its faces */
  /* The rim IS cyan, and the earlier reading that made it neutral was taken
     on the wrong pixels.  Measured in ONE window drawn on both images - the
     near rim, rows 315..321, columns 250..650 - the photograph reads
     R 177 G 191 B 191, G-R +14 and B-R +13, and the render read G-R 0.
     Independent of any window: hunting the rim by G-R >= 3 finds green in
     400 of 400 columns of the photograph and only 206 of the render's. */
  /* polygonOffset, not distance, is what keeps this off the plate's own side
     wall: the plate is seen nearly edge-on in every view, so however far the
     rim is moved in the PLANE the two stay within a pixel in depth and
     stipple each other. */
  m.glassEdge = new T.MeshPhysicalMaterial({
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    color: 0x5f7b7f, metalness: 0, roughness: 0.35,
    transmission: 0.34, thickness: 3, ior: 1.52, envMapIntensity: 0.75
  });

  /* --- PLA print ---------------------------------------------------------- */
  m.pla = new T.MeshPhysicalMaterial({
    /* PLA is a dull dielectric. Most of what was greying the magenta was
       its own 0.04 specular under a 2.5 key, so that comes down too. */
    color: 0xc00a66, metalness: 0.0, roughness: 0.80,
    normalMap: tex(layerN, 3, 46), normalScale: new T.Vector2(0.34, 0.34),
    clearcoat: 0.0, specularIntensity: 0.28,
    envMapIntensity: 0.18
  });

  /* --- printed / etched graphics ------------------------------------------ */
  m.decal = function (canvasEl, opts) {
    opts = opts || {};
    var t = new T.CanvasTexture(canvasEl);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16;
    if (opts.unlit) {
      return new T.MeshBasicMaterial({
        map: t, transparent: true, toneMapped: false,
        depthWrite: false, polygonOffset: true,
        polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: T.DoubleSide
      });
    }
    return new T.MeshPhysicalMaterial({
      map: t, transparent: true, opacity: opts.opacity === undefined ? 1 : opts.opacity,
      metalness: opts.metalness === undefined ? 0.0 : opts.metalness,
      roughness: opts.roughness === undefined ? 0.62 : opts.roughness,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      side: T.DoubleSide, envMapIntensity: 0.25
    });
  };

  /* --- the round LCD ------------------------------------------------------ */
  m.screen = function (canvasEl) {
    var t = new T.CanvasTexture(canvasEl);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16;
    return new T.MeshBasicMaterial({ map: t, toneMapped: false });
  };

  /* --- white light bar ---------------------------------------------------- */
  m.lightBar = new T.MeshPhysicalMaterial({
    color: 0xf4f7f7, emissive: 0xdfeaea, emissiveIntensity: 0.5,
    metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1
  });
  /* the two 40-pixel neopixel chains the M1 declares as Left and Right */
  /* the inside of a milled channel: bead blasted, in its own shadow, and
     nowhere near a mirror. It is what the plate looks straight down into. */
  /* c_slot: the trough is a MIRROR - a polished channel throwing a hard
     highlight the length of the machine, not the satin wall this was. */
  m.troughWall = new T.MeshPhysicalMaterial({
    color: 0xd7d6d4, metalness: 0.92, roughness: 0.11, envMapIntensity: 0.95
  });

  /* the frosted plates the LED strips shine through (sec_base.js).  Unlit
     they are a pale satin grey, which is what c_deck shows down in the
     trough; lit, setLeds() drives their emissive from the pixels.  The
     colour is no longer baked in: s7_1's rose was one LED state of many. */
  m.ledDiffuser = new T.MeshPhysicalMaterial({
    color: 0xd6d8d8, metalness: 0, roughness: 0.55,
    emissive: 0x000000, emissiveIntensity: 0, envMapIntensity: 0.35
  });
  m.ledChannel = new T.MeshPhysicalMaterial({
    color: 0x14181a, metalness: 0.45, roughness: 0.55
  });

  /* --- studio floor -------------------------------------------------------- */
  m.floor = new T.MeshPhysicalMaterial({
    color: 0xf2f3f3, metalness: 0.0, roughness: 0.62,
    envMapIntensity: 0.85
  });

  /* --- carry case shell ---------------------------------------------------- */
  m.caseShell = new T.MeshPhysicalMaterial({
    color: 0x1c2123, metalness: 0.0, roughness: 0.88,
    normalMap: tex(rubberN, 14, 14), normalScale: new T.Vector2(0.7, 0.7),
    sheen: 0.5, sheenRoughness: 0.85, sheenColor: 0x39464a, envMapIntensity: 0.6
  });

  /* the conduit is a silver-grey spiral wrap, not black */
  /* A convoluted PVC hose is a DIELECTRIC, and the 0.32 metalness and 0.3
     clearcoat it carried were filling its valleys with reflected studio: the
     render ran 123 to 224 along the hose's own axis, sd 20, against s1_1's
     16 to 238, sd 54.  Almost all of that contrast is the hose shadowing
     itself in its own grooves, and a surface that is one third mirror cannot
     go dark in a groove however deep the groove is cut. */
  m.conduit = new T.MeshPhysicalMaterial({
    color: 0xe8ecee, metalness: 0.06, roughness: 0.55, vertexColors: true,
    normalMap: tex(bead, 26, 3), normalScale: new T.Vector2(0.28, 0.28),
    clearcoat: 0.0, envMapIntensity: 0.70
  });

  /* the spool the machine is photographed with in the field is plain kraft */
  m.cardboard = new T.MeshPhysicalMaterial({
    color: 0xb2946c, metalness: 0.0, roughness: 0.92,
    normalMap: tex(bead, 5, 5), normalScale: new T.Vector2(0.5, 0.5),
    envMapIntensity: 0.6
  });
  m.filament = new T.MeshPhysicalMaterial({
    color: 0xf2622a, metalness: 0.0, roughness: 0.34,
    normalMap: tex(layerN, 1, 90), normalScale: new T.Vector2(0.8, 0.8),
    clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.7
  });

  m.dark = new T.MeshPhysicalMaterial({ color: 0x0f1315, metalness: 0.3, roughness: 0.65 });
  /* the pod's black disc: c_head reads 100 against a 247 sweep, matte */
  m.podDisc = new T.MeshPhysicalMaterial({
    color: 0x0e1013, metalness: 0.0, roughness: 0.74,
    specularIntensity: 0.20, envMapIntensity: 0.18
  });
  m.hotEnd = new T.MeshPhysicalMaterial({ color: 0x2b2f31, metalness: 0.75, roughness: 0.45 });

  m._maps = { brushed: brushed, bead: bead, beltN: beltN, layerN: layerN };
  return m;
};

/* ==========================================================================
   printed graphics - the wordmark, the warning triangle, the LCD
   ========================================================================== */
/* The wordmark is not set in a substitute face. This is the outline Muon3D
   ships as the bed graphic in Muon-3D/OrcaSlicer (Muon_M1_bed_texture.svg,
   "Logo on Bed"), lifted verbatim, so the letterforms are the real ones -
   the squared U, the flat-topped O, the diagonal-less N and the angular 3. */
var LOGO_D = 'm 7.6168711,163.60353 h 1.657195 l 2.9693569,2.97981 2.969357,-2.97981 h 1.657193 v 8.17096 H 15.21278 v -5.87598 l -2.969357,2.85957 -2.9693569,-2.85957 v 5.87598 h -1.657195 z m 11.2710109,0 h 1.657194 v 4.50109 q 0,0.55414 0.151604,0.98804 0.151605,0.42867 0.449586,0.72665 0.303209,0.29798 0.747567,0.45482 0.444358,0.1516 1.035093,0.1516 0.585507,0 1.029865,-0.1516 0.449585,-0.15684 0.747567,-0.45482 0.303209,-0.29798 0.454813,-0.72665 0.151605,-0.4339 0.151605,-0.98804 v -4.50109 h 1.657194 v 4.69974 q 0,0.80507 -0.271843,1.46377 -0.271842,0.65869 -0.789388,1.12919 -0.517547,0.4705 -1.270342,0.72665 -0.747567,0.25617 -1.709471,0.25617 -0.961904,0 -1.714699,-0.25617 -0.747567,-0.25615 -1.265114,-0.72665 -0.517546,-0.4705 -0.789389,-1.12919 -0.271842,-0.6587 -0.271842,-1.46377 z m 9.619044,4.06196 q 0,-0.92531 0.339803,-1.69379 0.339803,-0.76848 0.951449,-1.31739 0.616874,-0.55414 1.474223,-0.85735 0.862577,-0.30321 1.908125,-0.30321 1.040321,0 1.902898,0.30321 0.862578,0.30321 1.474223,0.85735 0.616874,0.54891 0.956678,1.31739 0.339801,0.76848 0.339801,1.69379 0,0.93054 -0.339801,1.70947 -0.339804,0.7737 -0.956678,1.33307 -0.611645,0.55937 -1.474223,0.87303 -0.862577,0.30844 -1.902898,0.30844 -1.045548,0 -1.908125,-0.30844 -0.857349,-0.31366 -1.474223,-0.87303 -0.611646,-0.55937 -0.951449,-1.33307 -0.339803,-0.77893 -0.339803,-1.70947 z m 1.657194,0 q 0,0.63255 0.224793,1.13965 0.23002,0.50709 0.632557,0.8678 0.407763,0.35548 0.956676,0.54891 0.55414,0.19343 1.20238,0.19343 0.64824,0 1.197153,-0.19343 0.554141,-0.19343 0.956677,-0.54891 0.402536,-0.36071 0.632557,-0.8678 0.23002,-0.5071 0.23002,-1.13965 0,-0.63256 -0.23002,-1.13442 -0.230021,-0.50187 -0.632557,-0.8469 -0.402536,-0.35025 -0.956677,-0.53323 -0.548913,-0.18297 -1.197153,-0.18297 -0.64824,0 -1.20238,0.18297 -0.548913,0.18298 -0.956676,0.53323 -0.402537,0.34503 -0.632557,0.8469 -0.224793,0.50186 -0.224793,1.13442 z m 9.519719,-4.06196 h 1.657193 l 5.091816,2.66615 v -2.66615 h 1.657199 v 8.17096 h -1.657199 v -3.74829 l -5.091816,-2.65046 v 6.39875 h -1.657193 z m 11.004394,6.22624 q 0.61687,0.30321 1.317391,0.44436 0.705747,0.13592 1.374897,0.13592 0.59596,0 1.029864,-0.0941 0.433904,-0.0993 0.716199,-0.26661 0.282301,-0.16729 0.418219,-0.39731 0.135925,-0.23002 0.135925,-0.49664 0,-0.36071 -0.245706,-0.64301 -0.245705,-0.28752 -0.747569,-0.42868 -0.496637,-0.14637 -1.259884,-0.115 -0.75802,0.0314 -1.78789,0.29798 l 0.0054,-1.2233 3.053001,-1.98654 h -4.323344 v -1.45331 h 6.539906 v 1.42195 l -2.687062,1.70424 q 0.737109,0 1.31739,0.1882 0.580281,0.1882 0.97759,0.51754 0.397308,0.32935 0.606418,0.77894 0.209109,0.44959 0.209109,0.96713 0,0.61165 -0.271842,1.11351 -0.266617,0.49664 -0.778932,0.85212 -0.512322,0.35026 -1.254658,0.54369 -0.737116,0.19342 -1.672877,0.19342 -0.993274,0 -1.834939,-0.20911 -0.841665,-0.21433 -1.599692,-0.59073 z m 8.651914,-6.22624 h 2.995494 q 1.312164,0 2.279295,0.2823 0.96713,0.2823 1.599685,0.8103 0.637788,0.52277 0.946227,1.27557 0.313664,0.74757 0.313664,1.68333 0,0.88872 -0.308438,1.64674 -0.308439,0.75279 -0.940994,1.30694 -0.632555,0.54891 -1.599692,0.86257 -0.96713,0.30844 -2.279295,0.30844 l -3.005946,-0.005 z m 3.403254,6.73856 q 0.742343,0 1.301713,-0.1882 0.559363,-0.19342 0.930534,-0.54369 0.376398,-0.35026 0.564596,-0.84689 0.188199,-0.49663 0.188199,-1.10828 0,-0.60119 -0.188199,-1.08214 -0.188198,-0.48618 -0.564596,-0.82075 -0.371171,-0.33981 -0.930534,-0.52278 -0.55937,-0.18297 -1.301713,-0.18297 h -1.746062 v 5.2957 z';
var LOGO_BB = { x: 7.617, y: 163.494, w: 59.858, h: 8.396 };
var logoPath = null, logoTried = false;

function wordmarkPath() {
  if (!logoTried) {
    logoTried = true;
    try { logoPath = new Path2D(LOGO_D); } catch (e) { logoPath = null; }
  }
  return logoPath;
}

/* draws MUON3D centred on (cx, cy) at exactly targetW wide */
function drawWordmark(x, cx, cy, targetW, color) {
  var p = wordmarkPath();
  x.save();
  x.fillStyle = color;
  if (p) {
    var k = targetW / LOGO_BB.w;
    x.translate(cx, cy);
    x.scale(k, k);
    x.translate(-(LOGO_BB.x + LOGO_BB.w / 2), -(LOGO_BB.y + LOGO_BB.h / 2));
    x.fill(p);
  } else {
    /* no Path2D: fall back to a fitted sans so the plate is never blank */
    var size = targetW / 4.6;
    x.font = '700 ' + size + 'px Helvetica, Arial, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('MUON3D', cx, cy);
  }
  x.restore();
  return targetW;
}
function fitWordmark(x, cx, cy, targetW, color) {
  return drawWordmark(x, cx, cy, targetW, color);
}
M1.drawWordmark = drawWordmark;

M1.glassDecal = function (px) {
  /* the plate is 200 x 180 in the vendor bed model, so the canvas matches */
  var W = px, H = Math.round(px * 180 / 200);
  var c = canvas(W, H), x = c.getContext('2d');
  x.clearRect(0, 0, W, H);

  /* Canvas top is the far (mast) edge. In s3_1 the wordmark sits a little
     behind plate centre and spans about 36 percent of the plate width. */
  fitWordmark(x, W * 0.49, H * 0.48, W * 0.44, '#181c1f');

  /* The small print, read straight off s1_1 at 7x rather than invented.
     Three things were wrong with it.  It says SURFACE HOT, not the plate's
     own dimensions.  The two labels sit on OPPOSITE edges - safety glass by
     the near-left edge, surface hot by the far-right - and not side by side
     along the far edge.  And both come out MIRRORED when the plate is seen
     from above, in two separate crops on two different edges, so they are
     printed to be read from underneath the glass.  They are also far fainter
     than the near-black they were drawn in: thin mid grey against a plate at
     about 230, which is why the render's legend shouted where the
     photograph's is barely there. */
  x.fillStyle = 'rgba(28,34,38,0.55)';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  function flipped(text, cx, cy, size) {
    x.save();
    x.translate(cx, cy); x.scale(-1, 1);
    x.font = '400 ' + size + 'px Helvetica, Arial, sans-serif';
    x.fillText(text, 0, 0);
    x.restore();
  }
  x.font = '400 ' + (W * 0.0175) + 'px Helvetica, Arial, sans-serif';
  x.fillText('SAFETY GLASS', W * 0.215, H * 0.965);
  flipped('SURFACE HOT', W * 0.735, H * 0.072, W * 0.0175);

  /* the hot-surface triangle, down by the plate's NEAR edge and left of centre */
  var tx = W * 0.463, ty = H * 0.891, s2 = W * 0.034;
  x.strokeStyle = '#20262a'; x.lineWidth = W * 0.0040; x.lineJoin = 'round';
  x.beginPath();
  x.moveTo(tx, ty - s2 * 0.62);
  x.lineTo(tx + s2 * 0.72, ty + s2 * 0.6);
  x.lineTo(tx - s2 * 0.72, ty + s2 * 0.6);
  x.closePath(); x.stroke();
  x.lineWidth = W * 0.0030; x.lineCap = 'round';
  for (var k = -1; k <= 1; k++) {
    x.beginPath();
    var bx = tx + k * s2 * 0.26, by = ty + s2 * 0.34;
    x.moveTo(bx, by);
    x.bezierCurveTo(bx - s2 * 0.11, by - s2 * 0.14, bx + s2 * 0.11, by - s2 * 0.26, bx, by - s2 * 0.4);
    x.stroke();
  }
  return c;
};

M1.deckDecal = function (px) {
  var c = canvas(px, px), x = c.getContext('2d');
  x.clearRect(0, 0, px, px);
  fitWordmark(x, -px * 0.03, px * 0.5, px * 0.80, 'rgba(16,20,23,1)');
  return c;
};

M1.clampDecal = function (px) {
  var c = canvas(px, Math.round(px / 3)), x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  fitWordmark(x, c.width * 0.5, c.height * 0.5, c.width * 0.70, 'rgba(46,53,57,0.92)');
  return c;
};

/* ==========================================================================
   THE ROUND PANEL: MuonUI's NEW Home screen
   The redesign (MuonUI PR #76, docs/redesign, signed off 2026-10-06; ported
   in PR #78, src/panel) replaces the old pale-cyan idle face the product
   photographs show.  Home is a ring of six line-icon circles - Print, Heat,
   Move, Filament, Tools, System - on a white panel, the focused one inside
   the black cursor with its icon in white, the focused item's name in Krona
   One in the middle with its live sub-line under it, the printer's state
   line under that, and the status rim: nozzle heat left of 12 o'clock, bed
   heat right of it, the connection dot at 12, print progress at 6.  Every
   number below is the concept's own (core.js, screens-a.js: ring R 160,
   item r 38, rim R 235, fonts and colours).  It is drawn on a 480 x 480
   panel scaled into the canvas, and only when what it shows changes.
   ========================================================================== */
var PANEL_TH = {
  bg: '#ffffff', base: '#e9eded', ink: '#0f1719', mute: '#6a7679',
  faint: 'rgba(15,23,25,.07)', line: 'rgba(15,23,25,.16)', cur: '#0f1719', curInk: '#ffffff',
  teal: '#24958f', amber: '#d38d1b', red: '#cf4a3f', green: '#2c9a69'
};
var PANEL_F = {
  disp: function (s) { return s + 'px "Krona One", "Arial Black", sans-serif'; },
  mono: function (s) { return s + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace'; }
};
/* the six Home icons from the concept's IC set: SVG path data and circles
   on a 24 grid, stroked */
var PANEL_IC = {
  print: { p: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6M8 13h8M8 17h5'] },
  heat: { p: ['M14 14.8V4.5a2 2 0 0 0-4 0v10.3a4 4 0 1 0 4 0z'] },
  move: { p: ['M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3'] },
  spool: { c: [[12, 12, 9], [12, 12, 3]], p: ['M12 3v6'] },
  tools: { p: ['M21 5h-7M10 5H3M21 12h-9M8 12H3M21 19h-5M12 19H3M14 3v4M8 10v4M16 17v4'] },
  gear: { c: [[12, 12, 3]], p: ['M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'] }
};
var panelPaths = {};
function panelIcon(x, name, cx, cy, size, color) {
  var ic = PANEL_IC[name];
  if (!ic || typeof Path2D === 'undefined') return;
  var list = panelPaths[name];
  if (!list) {
    list = panelPaths[name] = [];
    (ic.p || []).forEach(function (d) { list.push(new Path2D(d)); });
    (ic.c || []).forEach(function (c) { var q = new Path2D(); q.arc(c[0], c[1], c[2], 0, Math.PI * 2); list.push(q); });
  }
  x.save();
  x.translate(cx - size / 2, cy - size / 2); x.scale(size / 24, size / 24);
  x.strokeStyle = color; x.lineWidth = 1.8 * 24 / size * Math.pow(size / 24, 0.35);
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (var i = 0; i < list.length; i++) x.stroke(list[i]);
  x.restore();
}

/* the panel's own view of the model's state: what Home shows */
var PANEL_STATUS = ['idle', 'printing', 'paused', 'heating', 'homing', 'probing', 'updating'];
function panelView(st) {
  var status = PANEL_STATUS.indexOf(st.status) >= 0 ? st.status : 'idle';
  var n = function (v) { return typeof v === 'number' && isFinite(v) ? v : 0; };
  return {
    status: status,
    progress: M1.clamp(Math.round(n(st.progress)), 0, 100),
    heC: Math.round(n(st.nozzleTemp)), heT: Math.round(n(st.nozzleTarget)),
    bedC: Math.round(n(st.bedTemp)), bedT: Math.round(n(st.bedTarget)),
    job: String(st.jobName || '').replace(/\.gcode$/i, ''),
    connected: st.connected !== false
  };
}
M1.panelView = panelView;
/* everything the face depends on, as one string: the panel redraws only
   when this changes */
M1.panelKey = function (v) {
  return v.status + '|' + v.progress + '|' + v.heC + '|' + v.heT + '|' + v.bedC + '|' + v.bedT + '|' + v.job + '|' + v.connected;
};

M1.drawPanel = function (c, v) {
  var x = c.getContext('2d'), TH = PANEL_TH, C = 240, TAU = Math.PI * 2, D2R = Math.PI / 180;
  var DEG = String.fromCharCode(176), DOT = ' ' + String.fromCharCode(183) + ' ', ARROW = ' ' + String.fromCharCode(8594) + ' ';
  var ELL = String.fromCharCode(8230);
  function deg(t) { return Math.round(t) + DEG; }
  function pol(a, r) { return { x: C + r * Math.sin(a * D2R), y: C - r * Math.cos(a * D2R) }; }
  function text(s, px, py, font, color, ls) {
    x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
    if ('letterSpacing' in x) x.letterSpacing = (ls || 0) + 'px';
    x.fillText(s, px, py);
    if ('letterSpacing' in x) x.letterSpacing = '0px';
  }
  function fitText(s, font, max) {
    x.font = font; if ('letterSpacing' in x) x.letterSpacing = '1px';
    if (x.measureText(s).width <= max) return s;
    while (s.length > 1 && x.measureText(s + ELL).width > max) s = s.slice(0, -1);
    return s + ELL;
  }
  function strokeArc(r, a0, a1, w, color) {
    if (Math.abs(a1 - a0) < 0.01) return;
    x.beginPath(); x.arc(C, C, r, (a0 - 90) * D2R, (a1 - 90) * D2R, a1 < a0);
    x.lineWidth = w; x.strokeStyle = color; x.lineCap = 'round'; x.stroke();
  }
  function circle(px, py, r, fill) { x.beginPath(); x.arc(px, py, r, 0, TAU); x.fillStyle = fill; x.fill(); }

  var printing = v.status === 'printing' || v.status === 'paused';
  var heating = v.heT > 0 || v.bedT > 0;
  /* the concept's printerLine, plus the states it does not word yet */
  var line = v.status === 'printing' ? 'Printing' + DOT + v.progress + '%'
    : v.status === 'paused' ? 'Paused' + DOT + v.progress + '%'
    : v.status === 'homing' ? 'Homing' + DOT + deg(v.heC) + ' / ' + deg(v.bedC)
    : v.status === 'probing' ? 'Probing' + DOT + deg(v.heC) + ' / ' + deg(v.bedC)
    : v.status === 'updating' ? 'Updating' + DOT + deg(v.heC) + ' / ' + deg(v.bedC)
    : heating || v.status === 'heating' ? 'Heating' + DOT + deg(v.heC) + ' / ' + deg(v.bedC)
    : 'Ready' + DOT + deg(v.heC) + ' / ' + deg(v.bedC);
  var heatHalo = v.heT ? { f: M1.clamp(v.heC / v.heT, 0, 1), c: Math.abs(v.heC - v.heT) < 2 ? TH.green : TH.amber } : null;
  var items = [
    { label: 'Print', icon: 'print',
      sub: printing ? (v.job || 'Printing') + DOT + v.progress + '%' : 'Print a file',
      halo: printing ? { f: v.progress / 100, c: TH.teal } : null },
    { label: 'Heat', icon: 'heat',
      sub: 'Nozzle ' + deg(v.heC) + (v.heT ? ARROW + v.heT : '') + DOT + 'Bed ' + deg(v.bedC) + (v.bedT ? ARROW + v.bedT : ''),
      halo: heatHalo },
    { label: 'Move', icon: 'move', sub: v.status === 'homing' ? 'Homing' : v.status === 'probing' ? 'Probing the bed' : 'Jog and home' },
    { label: 'Filament', icon: 'spool', sub: 'Load' + DOT + 'unload' },
    { label: 'Tools', icon: 'tools', sub: 'Calibrate' + DOT + 'mesh' + DOT + 'fans' + DOT + 'lights' },
    { label: 'System', icon: 'gear', sub: v.status === 'updating' ? 'Installing an update' : 'Wi-Fi' + DOT + 'software' + DOT + 'display' }
  ];
  /* where the knob would be resting: the item the state is about (Home's
     own default focus is Heat) */
  var focus = printing ? 0 : (v.status === 'homing' || v.status === 'probing') ? 2 : v.status === 'updating' ? 5 : 1;

  var k = c.width / 480;
  x.setTransform(k, 0, 0, k, 0, 0);
  x.clearRect(0, 0, 480, 480);
  x.save();
  x.beginPath(); x.arc(C, C, 240, 0, TAU); x.clip();
  x.fillStyle = TH.bg; x.fillRect(0, 0, 480, 480);

  /* the ring: n = 6 sits at R 160 with r 38, from 9 o'clock clockwise */
  var R = 160, r = 38, i;
  var at = [];
  for (i = 0; i < 6; i++) at.push(pol(-90 + i * 60, R));
  for (i = 0; i < 6; i++) if (i !== focus) circle(at[i].x, at[i].y, r, TH.base);
  /* the cursor at rest: the round head on the focused item (the Comet tail
     has caught up with it) */
  circle(at[focus].x, at[focus].y, r, TH.cur);
  for (i = 0; i < 6; i++) panelIcon(x, items[i].icon, at[i].x, at[i].y, 26, i === focus ? TH.curInk : TH.ink);
  for (i = 0; i < 6; i++) {
    var hl = items[i].halo;
    if (!hl || hl.f <= 0) continue;
    x.beginPath(); x.arc(at[i].x, at[i].y, r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * hl.f);
    x.strokeStyle = hl.c; x.lineWidth = 3; x.lineCap = 'round'; x.stroke();
  }

  /* the centre: the focused item, its sub-line, the printer's line */
  var t = items[focus];
  text(t.label, C, C, PANEL_F.disp(20), TH.ink, 0.6);
  text(fitText(t.sub.toUpperCase(), PANEL_F.mono(11), 220), C, C + 28, PANEL_F.mono(11), TH.mute, 1);
  text(fitText(line.toUpperCase(), PANEL_F.mono(10), 220), C, C + 50, PANEL_F.mono(10), TH.mute, 1);

  /* the status rim */
  var RR = 235;
  var hf = M1.clamp(v.heC / 300, 0, 1), bf = M1.clamp(v.bedC / 110, 0, 1);
  var hc = v.heT ? (Math.abs(v.heC - v.heT) < 2 ? TH.green : TH.amber) : TH.line;
  var bc = v.bedT ? (Math.abs(v.bedC - v.bedT) < 2 ? TH.green : TH.amber) : TH.line;
  strokeArc(RR, -44, -6, 3, TH.faint); strokeArc(RR, 6, 44, 3, TH.faint);
  strokeArc(RR, -6 - 38 * hf, -6, 3, hc); strokeArc(RR, 6, 6 + 38 * bf, 3, bc);
  var np = pol(0, RR); circle(np.x, np.y, 2.6, v.connected ? TH.green : TH.red);
  if (printing) { strokeArc(RR, 150, 210, 3, TH.faint); strokeArc(RR, 210 - 60 * v.progress / 100, 210, 3, TH.teal); }
  x.restore();
  return c;
};

/* the canvas the panel is drawn on, with its first face */
M1.screenCanvas = function (px, state) {
  var c = canvas(px, px);
  return M1.drawPanel(c, panelView(state || {}));
};

M1.caseDecal = function (px) {
  var c = canvas(px, Math.round(px / 4)), x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  fitWordmark(x, c.width / 2, c.height / 2, c.width * 0.62, '#80d6d1');
  return c;
};

M1._canvas = canvas;
M1._tex = tex;
M1._noiseCanvas = noiseCanvas;
M1._heightToNormal = heightToNormal;

})(window);
