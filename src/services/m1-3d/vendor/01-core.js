/* ===========================================================================
   MUON3D M1 - photoreal parametric model
   Units: millimetres. Y up. +Z toward the viewer (front). Origin: centre of
   the base underside.

   Built from the product photography in muon3d-angel-round /
   muon3d-scrollsite (s1_1, s3_1, s5_1, s7_1, s9_7, s8_1): squircle CNC
   aluminium clamshell base, H-bot gantry on two edge rails, upward-facing
   nozzle, glass bed carried on a folding mast, print grows downward.
   =========================================================================== */
(function (global) {
'use strict';
var T = global.THREE;
var M1 = global.M1 = {};

/* --------------------------------------------------------------------------
   maths helpers
   -------------------------------------------------------------------------- */
var PI = Math.PI, TAU = PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
M1.clamp = clamp; M1.lerp = lerp; M1.smooth = smooth; M1.easeInOut = easeInOut;

/* superellipse (squircle) sampler. The whole product language is squircles:
   n = 2 is an ellipse, n -> infinity is a rectangle. The M1 reads around n = 5. */
function seX(t, hx, n) { var c = Math.cos(t); return hx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n); }
function seZ(t, hz, n) { var s = Math.sin(t); return hz * Math.sign(s) * Math.pow(Math.abs(s), 2 / n); }
M1.seX = seX; M1.seZ = seZ;

/* --------------------------------------------------------------------------
   The deck is not a plain lofted cap: the production machine has a large
   rounded-rectangular pocket milled through it at the front, which is how the
   M1_cover photograph in Muon-3D/OrcaSlicer shows the inside of the chassis.
   A lofted cap cannot carry a hole, so the top face is built separately from a
   Shape with holes and triangulated.
   -------------------------------------------------------------------------- */
function squircleOutline(hx, hz, n, seg) {
  var pts = [], j, t;
  for (j = 0; j < seg; j++) {
    t = (j / seg) * TAU;
    /* the shape lives in XY and is rotated onto XZ, so z is negated here */
    pts.push(new T.Vector2(seX(t, hx, n), -seZ(t, hz, n)));
  }
  return pts;
}
function roundRectPoints(cx, cz, w, d, r, seg, closed) {
  var pts = [], hw = w / 2 - r, hd = d / 2 - r, i, k, a, prev = null;
  var corners = [[hw, hd], [-hw, hd], [-hw, -hd], [hw, -hd]];
  seg = seg || 10;
  for (i = 0; i < 4; i++) {
    for (k = 0; k <= seg; k++) {
      /* the quarter arcs share their end points, so duplicates are dropped:
         earcut will not triangulate a contour that repeats a vertex */
      if (i > 0 && k === 0) continue;
      a = (i * PI / 2) + (k / seg) * (PI / 2);
      var v = new T.Vector2(
        cx + corners[i][0] + Math.cos(a) * r,
        -cz + corners[i][1] + Math.sin(a) * r);
      if (prev && v.distanceTo(prev) < 1e-6) continue;
      pts.push(v); prev = v;
    }
  }
  if (pts.length > 1 && pts[pts.length - 1].distanceTo(pts[0]) < 1e-6) pts.pop();
  if (closed) pts.push(pts[0].clone());
  return pts;
}
function roundRectHole(cx, cz, w, d, r, seg) {
  return new T.Path(roundRectPoints(cx, cz, w, d, r, seg, false));
}
function deckCapGeometry(hx, hz, n, seg, holes) {
  var shape = new T.Shape(squircleOutline(hx, hz, n, seg || 208));
  if (holes) shape.holes = holes;
  var g = new T.ShapeGeometry(shape, 1);
  g.rotateX(-PI / 2);
  return g;
}
M1.squircleOutline = squircleOutline;
M1.roundRectPoints = roundRectPoints;
M1.roundRectHole = roundRectHole;
M1.deckCapGeometry = deckCapGeometry;

/* --------------------------------------------------------------------------
   The base is a rounded SQUARE, not a superellipse: flat sides meeting true
   circular corners, and horizontal arrises that are almost sharp. A
   superellipse rounds the sides as well as the corners, which is exactly the
   soft, pillowy look the machine does not have.

   Every ring is sampled with the same point count and the same
   parametrisation, so the corner of one ring always stitches to the corner of
   the next and the highlight runs cleanly down the wall.
   -------------------------------------------------------------------------- */
function roundSquareRing(h, r, segPerCorner, d) {
  var pts = [], i, k, a;
  if (d === undefined) d = h;
  r = Math.min(r, Math.min(h, d) - 0.01);
  var c = h - r, cz = d - r;
  var corners = [[c, cz], [-c, cz], [-c, -cz], [c, -cz]];
  for (i = 0; i < 4; i++) {
    for (k = 0; k <= segPerCorner; k++) {
      a = i * (PI / 2) + (k / segPerCorner) * (PI / 2);
      pts.push(corners[i][0] + Math.cos(a) * r, corners[i][1] + Math.sin(a) * r);
    }
  }
  return pts;                     /* 4 * (segPerCorner + 1) xz pairs */
}

/* rings: [{ y, h, r }] - half-side and corner radius, both in mm */
function loftRoundSquare(rings, segPerCorner, capBottom, capTop, rotY) {
  segPerCorner = segPerCorner || 24;
  var cosR = Math.cos(rotY || 0), sinR = Math.sin(rotY || 0);
  var pos = [], uv = [], idx = [], i, j;
  var R = rings.length;
  var per = 4 * (segPerCorner + 1);

  var ringPts = [];
  for (i = 0; i < R; i++) {
    var raw = roundSquareRing(rings[i].h, rings[i].r === undefined ? rings[i].h * 0.3 : rings[i].r, segPerCorner, rings[i].d);
    var rot = [];
    for (j = 0; j < per; j++) {
      var x = raw[j * 2], z = raw[j * 2 + 1];
      rot.push(x * cosR + z * sinR, -x * sinR + z * cosR);
    }
    ringPts.push(rot);
  }

  for (i = 0; i < R; i++) {
    for (j = 0; j <= per; j++) {
      var k2 = (j % per) * 2;
      pos.push(ringPts[i][k2], rings[i].y, ringPts[i][k2 + 1]);
      uv.push(j / per, i / (R - 1));
    }
  }
  var row = per + 1;
  for (i = 0; i < R - 1; i++) {
    for (j = 0; j < per; j++) {
      var a2 = i * row + j, b2 = a2 + 1, c2 = a2 + row, d2 = c2 + 1;
      idx.push(a2, c2, b2, b2, c2, d2);
    }
  }
  function cap(ringIndex, up) {
    var base = pos.length / 3, k3;
    var y = rings[ringIndex].y;
    pos.push(0, y, 0); uv.push(0.5, 0.5);
    var centre = base;
    for (k3 = 0; k3 < per; k3++) {
      pos.push(ringPts[ringIndex][k3 * 2], y, ringPts[ringIndex][k3 * 2 + 1]);
      uv.push(0.5, 0.5);
    }
    /* roundSquareRing walks the outline anticlockwise in (x, z), and for a
       fan laid in that order the face normal comes out pointing DOWN - which
       is why the pod's top face was invisible and you could see straight into
       its carriage. Take the winding from the ring's own signed area rather
       than assuming it. */
    var area = 0;
    for (k3 = 0; k3 < per; k3++) {
      var q = (k3 + 1) % per;
      area += ringPts[ringIndex][k3 * 2] * ringPts[ringIndex][q * 2 + 1] -
              ringPts[ringIndex][q * 2] * ringPts[ringIndex][k3 * 2 + 1];
    }
    var flip = (area > 0) === !!up;
    for (k3 = 0; k3 < per; k3++) {
      var p1 = centre + 1 + k3, p2 = centre + 1 + ((k3 + 1) % per);
      if (flip) idx.push(centre, p2, p1); else idx.push(centre, p1, p2);
    }
  }
  if (capBottom) cap(0, false);
  if (capTop) cap(R - 1, true);

  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* the deck face, as a rounded square that can carry holes */
function roundSquareCap(h, r, segPerCorner, holes, rotY) {
  var raw = roundSquareRing(h, r, segPerCorner || 24);
  var cosR = Math.cos(rotY || 0), sinR = Math.sin(rotY || 0);
  var pts = [], j;
  for (j = 0; j < raw.length / 2; j++) {
    var x = raw[j * 2], z = raw[j * 2 + 1];
    pts.push(new T.Vector2(x * cosR + z * sinR, -(-x * sinR + z * cosR)));
  }
  var shape = new T.Shape(pts);
  if (holes) shape.holes = holes;
  var g = new T.ShapeGeometry(shape, 1);
  g.rotateX(-PI / 2);
  return g;
}

/* a straight slot with rounded ends, as a Path in the deck-cap frame */
function slotHole(cx, cz, len, wide, alongZ, seg) {
  return roundRectHole(cx, cz, alongZ ? wide : len, alongZ ? len : wide, wide / 2, seg || 10);
}

M1.roundSquareRing = roundSquareRing;
M1.loftRoundSquare = loftRoundSquare;
M1.roundSquareCap = roundSquareCap;
M1.slotHole = slotHole;

/* --------------------------------------------------------------------------
   loftSquircle - the workhorse. Takes a stack of rings and stitches them into
   a solid. Every ring shares one parametrisation so the quads never twist,
   which is what keeps the highlight running cleanly around the shell.
   rings: [{ y, hx, hz, n }]
   -------------------------------------------------------------------------- */
function loftSquircle(rings, seg, capBottom, capTop) {
  seg = seg || 208;
  var pos = [], uv = [], idx = [];
  var R = rings.length, i, j;

  for (i = 0; i < R; i++) {
    var r = rings[i], n = r.n || 5;
    for (j = 0; j <= seg; j++) {
      var t = (j / seg) * TAU;
      pos.push(seX(t, r.hx, n), r.y, seZ(t, r.hz, n));
      uv.push(j / seg, i / (R - 1));
    }
  }
  var row = seg + 1;
  for (i = 0; i < R - 1; i++) {
    for (j = 0; j < seg; j++) {
      var a = i * row + j, b = a + 1, c = a + row, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  function cap(ringIndex, up) {
    var base = pos.length / 3;
    var r = rings[ringIndex], n = r.n || 5, k;
    pos.push(0, r.y, 0); uv.push(0.5, 0.5);
    for (k = 0; k <= seg; k++) {
      var t = (k / seg) * TAU;
      pos.push(seX(t, r.hx, n), r.y, seZ(t, r.hz, n));
      uv.push(0.5 + Math.cos(t) * 0.5, 0.5 + Math.sin(t) * 0.5);
    }
    for (k = 0; k < seg; k++) {
      if (up) idx.push(base, base + 1 + k, base + 2 + k);
      else idx.push(base, base + 2 + k, base + 1 + k);
    }
  }
  if (capBottom) cap(0, false);
  if (capTop) cap(R - 1, true);

  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
M1.loftSquircle = loftSquircle;

/* --------------------------------------------------------------------------
   corrugatedTube - the umbilical. TubeGeometry cannot vary its radius, and the
   conduit is the most recognisable thing in the photos, so this walks the
   curve Frenet frames itself and ripples the radius as it goes.
   -------------------------------------------------------------------------- */
function corrugatedTube(curve, steps, r0, amp, period, radial, twist) {
  radial = radial || 22;
  twist = twist === undefined ? 1 : twist;
  var frames = curve.computeFrenetFrames(steps, false);
  var pos = [], uv = [], col = [], idx = [];
  var P = new T.Vector3(), N = new T.Vector3(), B = new T.Vector3();
  var lengths = curve.getLengths(steps);
  var i, j;
  for (i = 0; i <= steps; i++) {
    curve.getPointAt(i / steps, P);
    N.copy(frames.normals[i]); B.copy(frames.binormals[i]);
    var s = lengths[i];
    for (j = 0; j <= radial; j++) {
      var v = (j / radial) * TAU;
      /* A convoluted hose is NOT a sine.  Its crest is a broad rounded ridge
         and its valley a narrow deep groove, and the groove is the whole
         reason the thing reads as a hose: s1_1's umbilical runs from 16 to
         238 along its own axis, sd 54, while a sine ripple of the same
         amplitude gave 125 to 224, sd 21 - beads, with no dark line between
         them anywhere.  u is 1 on the crest and 0 in the valley, and the
         fractional power holds the crest broad while the valley dives.
         The phase also advances one full period per turn, because the ribs
         in the photograph are a single-start HELIX, not stacked rings. */
      var u = 0.5 * (1 + Math.cos((s / period + (j / radial) * twist) * TAU));
      var r = r0 - amp * (1 - Math.pow(u, 0.30));
      var sx = Math.cos(v), sy = Math.sin(v);
      pos.push(
        P.x + r * (sx * N.x + sy * B.x),
        P.y + r * (sx * N.y + sy * B.y),
        P.z + r * (sx * N.z + sy * B.z)
      );
      uv.push(s / 30, j / radial);
      /* A BAKED occlusion term, and without it the hose cannot be made to
         look like one.  s1_1's umbilical swings from 16 to 238 along its own
         axis; this renderer has no ambient occlusion of any kind, so the
         environment pours straight into every groove and the deepest the
         render could reach was 94 with the crests already at 224 - a range
         of 130 against the photograph's 222.  Deepening the convolution or
         darkening the material only slid the whole band up or down.  The
         groove floor of a convoluted hose sees perhaps a third of the sky,
         and that is a property of the SHAPE, so it belongs in the geometry. */
      var ao = 0.08 + 0.92 * Math.pow(u, 0.85);
      col.push(ao, ao, ao);
    }
  }
  var row = radial + 1;
  for (i = 0; i < steps; i++) for (j = 0; j < radial; j++) {
    var a = i * row + j, b = a + 1, c = a + row, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
M1.corrugatedTube = corrugatedTube;

/* --------------------------------------------------------------------------
   helical thread - a real swept helix around the leadscrew.
   -------------------------------------------------------------------------- */
function threadGeometry(radius, height, pitch, wire, segPerTurn) {
  segPerTurn = segPerTurn || 20;
  var turns = height / pitch;
  var steps = Math.max(24, Math.round(turns * segPerTurn));
  var pts = [];
  for (var i = 0; i <= steps; i++) {
    var t = i / steps, a = t * turns * TAU, y = t * height;
    pts.push(new T.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
  }
  var c = new T.CatmullRomCurve3(pts);
  return new T.TubeGeometry(c, steps, wire, 6, false);
}
M1.threadGeometry = threadGeometry;

/* --------------------------------------------------------------------------
   toothed pulley - genuine GT2 teeth rather than a normal map, because at the
   scale these sit in frame the silhouette is what sells them.
   -------------------------------------------------------------------------- */
function pulleyGeometry(r, h, teeth, depth) {
  var seg = teeth * 8;
  var pos = [], idx = [];
  var top = h / 2, bot = -h / 2, i;
  for (i = 0; i < seg; i++) {
    var an = (i / seg) * TAU;
    var w = 0.5 + 0.5 * Math.cos(an * teeth);
    var rr = r - depth * (1 - w);
    pos.push(Math.cos(an) * rr, bot, Math.sin(an) * rr);
    pos.push(Math.cos(an) * rr, top, Math.sin(an) * rr);
  }
  for (i = 0; i < seg; i++) {
    var a0 = i * 2, b0 = a0 + 1, c0 = ((i + 1) % seg) * 2, d0 = c0 + 1;
    idx.push(a0, c0, b0, b0, c0, d0);
  }
  var cB = pos.length / 3; pos.push(0, bot, 0);
  var cT = pos.length / 3; pos.push(0, top, 0);
  for (i = 0; i < seg; i++) {
    var n0 = i * 2, n1 = ((i + 1) % seg) * 2;
    idx.push(cB, n0, n1);
    idx.push(cT, n1 + 1, n0 + 1);
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
M1.pulleyGeometry = pulleyGeometry;

/* --------------------------------------------------------------------------
   beltLoop - a closed GT2 loop wrapped around two pulleys, extruded as a flat
   strap. Returned in the XZ plane, centred on x = 0.
   -------------------------------------------------------------------------- */
function beltLoop(z0, z1, r, width, thick, toothOut) {
  var path = [], i, a, N = 34;
  /* (-r,z1) over the top to (r,z1), straight down x = r, round z0 and back
     up x = -r: a true racetrack, strands a full diameter apart */
  for (i = 0; i <= N; i++) { a = PI - (i / N) * PI; path.push(new T.Vector2(Math.cos(a) * r, z1 + Math.sin(a) * r)); }
  for (i = 0; i <= N; i++) { a = -(i / N) * PI; path.push(new T.Vector2(Math.cos(a) * r, z0 + Math.sin(a) * r)); }
  /* strip duplicated joins */
  var p2 = [];
  for (i = 0; i < path.length; i++) {
    var prev = p2[p2.length - 1];
    if (prev && prev.distanceTo(path[i]) < 1e-5) continue;
    p2.push(path[i]);
  }
  if (p2.length > 1 && p2[0].distanceTo(p2[p2.length - 1]) < 1e-5) p2.pop();
  path = p2;

  /* s1_1 shows the teeth in silhouette on the far strand - the top edge of
     the band is visibly scalloped at 2 mm pitch, so they have to be
     geometry, not a normal map. Resample the closed path by arc length at
     a whole number of teeth so the phase closes on itself. */
  var SEG = [], total = 0, M0 = path.length;
  for (i = 0; i < M0; i++) {
    var q0 = path[i], q1 = path[(i + 1) % M0];
    SEG.push({ a: q0, b: q1, s: total, len: q0.distanceTo(q1) });
    total += q0.distanceTo(q1);
  }
  var PITCH = 2.0, PER = 10;
  var teeth = Math.max(8, Math.round(total / PITCH));
  var M = teeth * PER, step = total / M, si = 0, pts = [];
  for (i = 0; i < M; i++) {
    var s = i * step;
    while (si < SEG.length - 1 && s > SEG[si].s + SEG[si].len) si++;
    var t = SEG[si].len > 1e-9 ? (s - SEG[si].s) / SEG[si].len : 0;
    pts.push(new T.Vector2(SEG[si].a.x + (SEG[si].b.x - SEG[si].a.x) * t,
                           SEG[si].a.y + (SEG[si].b.y - SEG[si].a.y) * t));
  }
  path = pts;

  /* which way is into the loop */
  var cx = 0, cz = 0;
  for (i = 0; i < M; i++) { cx += path[i].x; cz += path[i].y; }
  cx /= M; cz /= M;

  /* GT2 is a round-crested tooth, 0.75 deep on a 1.38 belt */
  var back = thick * 0.46, deep = thick * 0.54;
  function crest(u) {
    var q = Math.abs(u - 0.5) / 0.31;
    return q >= 1 ? 0 : 0.5 + 0.5 * Math.cos(q * PI);
  }

  var pos = [], idx = [], uv = [];

  for (i = 0; i < M; i++) {
    var p = path[i], pn = path[(i + 1) % M], pp = path[(i - 1 + M) % M];
    var tx = pn.x - pp.x, tz = pn.y - pp.y;
    var L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
    var nx = -tz, nz = tx;
    if ((p.x - cx) * nx + (p.y - cz) * nz < 0) { nx = -nx; nz = -nz; }
    var arc = i * step;
    /* one tile of the tooth map spans 16 GT2 teeth, i.e. 32 mm of belt */
    var u = arc / 32;
    var d = deep * crest((i % PER) / PER);
    /* c_s1deck: on the cross rail the teeth ride OUTWARD - the belt's smooth
       back is what wraps the two flanged idlers, and the tooth crests are
       what the camera sees along the top of the band. Move the tooth to the
       other ring rather than flipping the normal, or every face winds
       backwards and the belt is culled away entirely. */
    var ir = toothOut ? -back : -d, orr = toothOut ? d : back;
    pos.push(p.x + nx * ir, -width / 2, p.y + nz * ir); uv.push(u, 0);
    pos.push(p.x + nx * ir, width / 2, p.y + nz * ir); uv.push(u, 1);
    pos.push(p.x + nx * orr, width / 2, p.y + nz * orr); uv.push(u, 1);
    pos.push(p.x + nx * orr, -width / 2, p.y + nz * orr); uv.push(u, 0);
  }
  for (i = 0; i < M; i++) {
    var a0 = i * 4, b0 = ((i + 1) % M) * 4;
    for (var k = 0; k < 4; k++) {
      var k2 = (k + 1) % 4;
      idx.push(a0 + k, b0 + k, a0 + k2, a0 + k2, b0 + k, b0 + k2);
    }
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
M1.beltLoop = beltLoop;

/* --------------------------------------------------------------------------
   linear rail - an MGN-ish profile swept along +Z.
   -------------------------------------------------------------------------- */
function railGeometry(length, w, h) {
  var s = new T.Shape();
  var hw = w / 2, g = w * 0.17, rr = w * 0.15;
  s.moveTo(-hw, 0);
  s.lineTo(-hw, h * 0.32);
  s.lineTo(-hw + g, h * 0.5);
  s.lineTo(-hw, h * 0.68);
  s.lineTo(-hw, h - rr);
  s.quadraticCurveTo(-hw, h, -hw + rr, h);
  s.lineTo(hw - rr, h);
  s.quadraticCurveTo(hw, h, hw, h - rr);
  s.lineTo(hw, h * 0.68);
  s.lineTo(hw - g, h * 0.5);
  s.lineTo(hw, h * 0.32);
  s.lineTo(hw, 0);
  s.closePath();
  var geo = new T.ExtrudeGeometry(s, { depth: length, bevelEnabled: false, curveSegments: 3 });
  geo.translate(0, 0, -length / 2);
  return geo;
}
M1.railGeometry = railGeometry;

/* rounded box shorthand */
function rbox(w, h, d, r, seg) {
  r = Math.min(r, Math.min(w, h, d) / 2 - 1e-4);
  return new T.RoundedBoxGeometry(w, h, d, seg || 5, r);
}
M1.rbox = rbox;

/* a squircular plate: flat slab with squircle outline and softened edges */
function squirclePlate(hx, hz, h, n, edge) {
  edge = edge === undefined ? Math.min(h * 0.42, 2.4) : edge;
  var rings = [
    { y: 0, hx: hx - edge, hz: hz - edge, n: n },
    { y: edge * 0.45, hx: hx - edge * 0.28, hz: hz - edge * 0.28, n: n },
    { y: edge, hx: hx, hz: hz, n: n },
    { y: h - edge, hx: hx, hz: hz, n: n },
    { y: h - edge * 0.45, hx: hx - edge * 0.28, hz: hz - edge * 0.28, n: n },
    { y: h, hx: hx - edge, hz: hz - edge, n: n }
  ];
  return loftSquircle(rings, 176, true, true);
}
M1.squirclePlate = squirclePlate;

})(window);
