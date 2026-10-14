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
function noiseCanvas(size, scale, contrast, mid) {
  var c = canvas(size, size), x = c.getContext('2d');
  var img = x.createImageData(size, size), d = img.data;
  var grid = Math.max(2, Math.round(size / scale));
  var g = new Float32Array(grid * grid);
  var i, j;
  for (i = 0; i < g.length; i++) g[i] = Math.random();
  function at(ix, iy) { return g[((iy % grid) + grid) % grid * grid + (((ix % grid) + grid) % grid)]; }
  for (j = 0; j < size; j++) for (i = 0; i < size; i++) {
    var fx = i / size * grid, fy = j / size * grid;
    var x0 = Math.floor(fx), y0 = Math.floor(fy);
    var tx = fx - x0, ty = fy - y0;
    tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    var v = (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) +
            (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
    v = (mid === undefined ? 0.5 : mid) + (v - 0.5) * (contrast || 1);
    var p = (j * size + i) * 4, b = Math.round(M1.clamp(v, 0, 1) * 255);
    d[p] = d[p + 1] = d[p + 2] = b; d[p + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

/* height field -> tangent-space normal map */
function heightToNormal(src, strength) {
  var size = src.width;
  var sx = src.getContext('2d').getImageData(0, 0, size, size).data;
  var out = canvas(size, size), ox = out.getContext('2d');
  var img = ox.createImageData(size, size), d = img.data;
  function H(i, j) {
    i = ((i % size) + size) % size; j = ((j % size) + size) % size;
    return sx[(j * size + i) * 4] / 255;
  }
  for (var j = 0; j < size; j++) for (var i = 0; i < size; i++) {
    var dx = (H(i + 1, j) - H(i - 1, j)) * strength;
    var dy = (H(i, j + 1) - H(i, j - 1)) * strength;
    var nx = -dx, ny = -dy, nz = 1;
    var L = Math.hypot(nx, ny, nz);
    var p = (j * size + i) * 4;
    d[p] = Math.round((nx / L * 0.5 + 0.5) * 255);
    d[p + 1] = Math.round((ny / L * 0.5 + 0.5) * 255);
    d[p + 2] = Math.round((nz / L * 0.5 + 0.5) * 255);
    d[p + 3] = 255;
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
  var c = canvas(size, size), x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  for (var i = 0; i < size * size * 0.16; i++) {
    var px = Math.random() * size, py = Math.random() * size;
    var r = 0.6 + Math.random() * 1.5;
    var v = Math.random() < 0.5 ? 96 : 168;
    var gr = x.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',0.75)');
    gr.addColorStop(1, 'rgba(128,128,128,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
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
  var c = canvas(size, size), x = c.getContext('2d');
  x.drawImage(noiseCanvas(size, 3, 1.5), 0, 0);
  x.globalAlpha = 0.5;
  x.drawImage(noiseCanvas(size, 9, 1.2), 0, 0);
  x.globalAlpha = 1;
  return c;
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

  m.ledDiffuser = new T.MeshPhysicalMaterial({
    /* s7_1 settles this: two of its three machines burn rose down the whole
       channel - R-G runs +30 to +69 along it against +4 on the bare deck
       beside it - and the third, folded and powered down, shows none. It is
       a lamp. 0.8 rather than the 1.4 the audit asked for: any more and it
       clips to white under ACES. */
    color: 0xffe2e8, metalness: 0, roughness: 0.62,
    emissive: 0xff5f86, emissiveIntensity: 0.95, envMapIntensity: 0.2
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

M1.screenCanvas = function (px, pct) {
  var c = canvas(px, px), x = c.getContext('2d');
  /* Every photograph that shows this panel shows the SAME idle face, and it
     is nearly empty: a pale cyan ground at (218,237,239) - c_screen and
     c_mast agree to a level - with a small round mark out at the left, the
     wordmark just above centre, a dot low and left of it and a signal fan
     low and right.  No progress ring, no temperatures.  Positions are read
     off c_screen's ellipse in units of its own radius: (-0.59,-0.07),
     (0.06,-0.16), (-0.26,0.53) and (0.27,0.59). */
  var g = x.createLinearGradient(0, 0, 0, px);
  g.addColorStop(0.00, '#e7f7f9');
  g.addColorStop(0.45, '#dff4f6');
  g.addColorStop(1.00, '#cfeaee');
  x.fillStyle = g; x.beginPath(); x.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2); x.fill();

  function at(u, v) { return [px / 2 + u * px / 2, px / 2 + v * px / 2]; }
  var ink = '#2a3639', faint = 'rgba(42,54,57,0.42)';

  /* the round certification mark out at the left */
  var a = at(-0.59, -0.07), ar = px * 0.072;
  x.strokeStyle = faint; x.lineWidth = px * 0.007;
  x.beginPath(); x.arc(a[0], a[1], ar, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(a[0], a[1], ar * 0.66, 0, Math.PI * 2); x.stroke();
  x.fillStyle = ink;
  x.font = '700 ' + (px * 0.052) + 'px Helvetica, Arial, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('M1', a[0], a[1]);

  /* the wordmark, just above centre */
  var w = at(0.06, -0.16);
  x.fillStyle = ink;
  x.font = '700 ' + (px * 0.088) + 'px Helvetica, Arial, sans-serif';
  x.fillText('wm', w[0], w[1]);

  /* the dot, with its short rule running off to the left */
  var d = at(-0.26, 0.53);
  x.strokeStyle = faint; x.lineWidth = px * 0.012;
  x.beginPath(); x.moveTo(d[0] - px * 0.085, d[1]); x.lineTo(d[0] - px * 0.022, d[1]); x.stroke();
  x.fillStyle = '#182225';
  x.beginPath(); x.arc(d[0], d[1], px * 0.019, 0, Math.PI * 2); x.fill();

  /* the signal fan, low and right */
  var f = at(0.27, 0.59), fr = px * 0.068;
  x.strokeStyle = faint; x.lineWidth = px * 0.007;
  x.beginPath(); x.arc(f[0], f[1], fr, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = ink; x.lineWidth = px * 0.011; x.lineCap = 'round';
  for (var k = 1; k <= 3; k++) {
    x.beginPath();
    x.arc(f[0], f[1] + fr * 0.42, fr * 0.24 * k, -Math.PI * 0.82, -Math.PI * 0.18);
    x.stroke();
  }
  x.fillStyle = ink;
  x.beginPath(); x.arc(f[0], f[1] + fr * 0.42, px * 0.010, 0, Math.PI * 2); x.fill();
  x.lineCap = 'butt';
  return c;
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
