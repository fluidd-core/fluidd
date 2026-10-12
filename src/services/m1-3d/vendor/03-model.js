/* ===========================================================================
   03-model.js - the M1 itself.

   Published figures where they exist (200x180x170 build volume, ~3.2 L folded,
   ~2.9 kg). Everything else is measured off the product photography by scaling
   against the 232 mm footprint: s1_1 for the hero three-quarter, s3_1 for the
   mast and plate, s1_deck / s3_base for the gantry, s9_7 for the tool head.
   =========================================================================== */
(function (global) {
'use strict';
var T = global.THREE;
var M1 = global.M1;
var PI = Math.PI, TAU = PI * 2;

/* ==========================================================================
   THE MACHINE, IN MILLIMETRES

   The base is a rounded square that STANDS ON A CORNER. The print axes run
   down its diagonals, so the glass plate above sits at 45 degrees to the
   shell. Everything here is in the print frame - X and Z are the printer's
   own axes, Y is up - and only the shell is rotated.

     back corner   (0, -R)   carries the spine
     left corner   (-R, 0)   carries the round display
     front corner  (0, +R)   the LED trough runs out to here
     right corner  (+R, 0)

   These are measured, not guessed. Two things on the deck are circles - the
   fan intake and the round display - and an affine image of a circle of
   diameter d has a bounding box d*|M1| by d*|M2|, so reading both fixes the
   plan-to-image matrix. The GT2 belt gives a second, independent ruler at
   exactly 2.000 mm a tooth, and the vendor plate gives a third at exactly
   200.000 x 194.585 x 4.00. Where the three disagree the belt wins, because
   its pitch is exact and it lies in the plane being measured.
   ========================================================================== */
var D = M1.DIM = {
  /* a 200 mm square with 28 mm corners: 283 across the sharp corners, 260
     across the rounded ones, which is what the silhouettes measure */
  R: 141.5,
  cornerR: 31,
  /* The shell is a good deal DEEPER than it was modelled. Two scale-free
     ratios settle it, and they agree. In s1_1, deck arris to base bottom at
     the right corner is 199 px against 733 px corner to corner, i.e. 0.271
     of 257 = 70 mm before any foreshortening correction and 77 after. In
     c_folded, seen almost side on, the shell's arris to its bottom is 262 px
     against 1020 px corner to corner = 66 mm. The old 48 came from a
     threshold that clipped the lower shell, which is nearly as bright as the
     sweep it stands on. */
  deckY: 58,           /* deck top face above the table */
  partY: 25,           /* the crease reads 43 percent up the wall in s1_1 */

  /* the LED trough. s3_1 photographs it OPEN and deep: a wide machined
     channel with vertical bright walls running the whole diagonal, the
     rail and the block visible well down inside it. 18 wide and 7 deep
     read as a scratch in the deck; 30 and 15 read as the bay it is, and
     they are what finally get the double belt out of sight where the
     photographs keep it. */
  ledZ: 112,           /* half length */
  ledW: 30,
  ledBotW: 22,         /* the channel is drafted: 30 at the deck arris, 22 at
                          the shoulder 15 down.  s3_1's 6x crop shows a long
                          mirror-bright sloped face, not a square wall */
  ledDrop: 15,         /* the lit shoulder, below the deck */
  grooveW: 7,
  grooveDrop: 24,

  /* the cross rail. A slim guide bar 255 long reaching corner to corner,
     hung ONLY at its middle, with one GT2 run over its top land and one
     under its bottom land, 13.4 apart, each turning 180 degrees round a
     small idler on a horizontal axle at each end. */
  endIdlerR: 5.4, crossX: 123,         /* 247 end to end, measured on the belt's own pitch */
  crossY: 72,          /* bar centre: underside 9 above the deck */
  crossH: 6.8,         /* measured 5.6 on the exposed bar in c_s1deck */
  crossW: 10.5,
  beltGap: 17.4,       /* h-03 reads the toothed band as a separate stripe
                          above the bar, not as something hugging its land */
  beltW: 6.0,
  idlerR: 7.8,         /* OD 15.6: a flanged 20 tooth GT2, as measured */
  yokeIdlerR: 5.1,     /* the turning idlers are smaller: c_mast reads
                          them 80 px across at 8.33 px/mm, so 9.6 over */
  /* The cross belt's loop stands in a vertical plane BEHIND the bar: both
     end idlers sit behind the bar's ends (c_deck 2x: the bar's polished end
     overlaps the idler's lower half), and the return strand is never seen
     under the bar.  Half the bar, a 1.2 gap and half the belt. */
  beltZ: -8.6,
  /* and it rides HIGH: s3_1 and c_s1deck see the toothed top strand clear
     above the bar's top face, so the idlers' centres are 1.6 above the
     bar's and the strand's teeth stand about 5 proud of its top */
  xBeltY: 72 + 1.6,
  endIdlerX: 121,      /* 2 inboard of the bar's end, as c_deck shows */
  cxIdlerX: 11.5,      /* the carriage idlers, 23 apart (s3_1, 52 px) */
  cxIdlerBack: 5.1,    /* their centres one idler radius behind the strand */

  /* the same two belts run back down the trough to the spine, turned 90
     degrees by the four idlers on the block's yoke - which is why the deck
     shows a DOUBLE belt above the LED strip */
  beltX: 9.0,
  troughPulleyR: 5.2,  /* The two loops still run side by side with the fin
                          passing BETWEEN their inner runs, but they are much
                          tighter than the 5.2 h-03 was read for.  The channel
                          is drafted, so at belt height it is 24.1 across, and
                          strands at 3.8 and 14.2 put the outer pair well
                          proud of that - three black bands down a trough the
                          photograph shows as one narrow seam.  3.8 with
                          beltX 7.0 puts them at 3.2 and 10.8: the outer runs
                          fall behind the drafted wall and the inner pair,
                          which is what the seam is, still clears a 5.2 fin. */
  beltY: 47.0,        /* Just clear of the LED strip, whose top is at 44.4 -
                          the belt has to run ABOVE it, not through it, and 44
                          put the two in the same space.  What hides the belt
                          instead is making the LOOPS narrower; see
                          troughPulleyR. */
  _beltYnote: 0,      /* Down ON the shoulder, not floating in the middle of
                          the channel.  s3_1 looks straight ALONG this trough
                          - it runs corner to corner, almost down the sight
                          line - and shows a bright polished channel with one
                          narrow dark seam in it.  The render was showing
                          three black bands, because at 51 and then 47 the
                          belt's outer runs at +-14.2 still stood above the
                          drafted wall's 22 wide bottom and were in full view.
                          At 44 the wall covers them and only the inner pair
                          reads, which is the seam. */

  /* travel: X 200.1 on the cross rail, Y 184.1 down the trough. The animated
     range is a little short of X so the pod stays on the bar. */
  travelX: 100,
  travelZ: 92,          /* a 105 long pod on a 224 long trough */

  /* the pod. 77 across the cross rail by 105 down the trough: it is a good
     deal LONGER along the LED strip than across it, which is what two
     independent reads of s1_1 and the folded frame both give, and what the
     machine is described as having. The nozzle is at the spine end of it,
     the black disc in the middle, the umbilical boot on the front end. */
  /* c_head sees the top face nearly in plan and the plan corners are
     GENEROUS - about a sixth of the pod's width, 17 mm. The 8.7 I read off
     c_folded came from a corner that view sees almost edge on. What is
     "almost sharp" on this pod is the BEZEL: top face to side wall over a
     1.2 mm chamfer, which is what the loft already does. */
  podW: 70, podL: 95, podH: 28, podR: 15.5,
  podBase: 61,         /* underside only 3 above the deck */
  nozzleY: 93,         /* tip essentially level with the pod's top face */
  printSink: 6,        /* s1_1's part bottoms 5.8 mm below the tip - that
                          photograph's print is longer than its own bed
                          height allows (61 mm in a 41 mm gap, with the
                          plate and the pod both registering to 2 and 5 px),
                          so the marketing frame is not self-consistent and
                          only the part that shows is worth chasing. */

  /* the spine */
  /* the hinge boss stands proud of the deck, which is what lets the column
     fold flat ONTO the deck instead of into it */
  hingeY: 72,
  mastZ: -106,
  mastOffZ: -13,       /* the column hangs back off the pivot by half its depth */
  /* s7_1 photographs two of these side on. The column images 55 px on both
     the middle machine (472 px of plan span) and the right one (460), which
     is 30 and 31 - it is a broad flat BLADE, not the near-square post the
     model had. Its depth stays 15: c_mast sees it edge on and it is thin. */
  mastW: 19, mastD: 13,
  /* That 813-px reading was measured against the deck arris at z = 0, but
     the spine stands at z = -106. At this camera's 22 degrees of elevation
     a point 106 further away rides 124 px HIGHER in frame, so the raw
     comparison overstated the column by exactly that much. Corrected, s1_1
     gives (845 - 27 - 124) / (3.093 * cos 22) = 242 above the deck, i.e.
     300. s3_1 agrees independently and without touching the deck at all:
     scaled by its own plate, its mast tip stands 82 above the glass with
     the glass 148.6 above the arris, which is 293. The 164 of Z travel
     still fits - the plate tops out at 262, leaving 34 for the clamp. */
  mastTop: 279,
  bedTravel: 164,      /* core.cfg [stepper_z] position_min -4 .. max 160.
                          A FULL range, unlike travelX / travelZ which are
                          half ranges - 03-model uses state.z * bedTravel
                          directly and 05-ui prints it as millimetres. */
  lsX: -23.4,          /* s3_1, as a SEPARATION so the view's registration
                          error cancels: blade centre to screw core is 49 px
                          in the photograph and was 73 in the render, and
                          image_x = c + 2.255X + 0.263Z closes that at -23.4.
                          Leaves 11 of white beside a 19 wide blade, which is
                          the 10 the old -34 was aiming at and missed. */
  lsR: 2.25,           /* 4.5 across the threads, re-measured at the FITTED
                          threeQ camera: the screw's HALF-DEPTH width - the
                          only width that does not move when its tone does -
                          is 10.0 px in s3_1 against the render's 12.0, so
                          2.70 was 1.20 too fat.  The 2.70 came off h-03,
                          which is a 26 degree hand solve.  Measuring at a
                          fixed luminance instead reads the render FATTER the
                          darker it is, and had it at 11 against 9 for a
                          different reason entirely. */

  /* straight off Muon_M1_bed_model.stl: X -100..100, Y -104.585..90 */
  glassW: 200, glassD: 180, glassT: 3.85,
  glassZ: 0,           /* Muon_M1_bed_model.stl, plate component alone:
                          X +-100, Y +-90, Z -3.85..0.  The old 194.585 /
                          -7.3 was that box UNION the clamp bracket. */
  clampW: 30, clampD: 38.279,
  clampZ: -85.4455,    /* the STL's own clamp centre. It STRADDLES the plate's
                          back edge - 14.6 behind it, 23.7 on the glass - so
                          it cannot be derived from glassD. */

  /* the deck furniture */
  screenR: 26.2,       /* 52.4 across */
  screenX: -98,        /* 29.7 inboard of the corner: 2.9 of shell outboard
                          of the glass, which is what c_s1deck measures */
  fanR: 11.8,          /* c_mast, on the belt's own 2.000 mm pitch: the
                          counterbore images 195 px at 8.25 px/mm = 23.6
                          across, and the dark bore inside it 124 = 15.0 */
  fanBore: 7.6,
  fanX: -55.5,         /* 74.4 inboard of the left corner */
  wheelR: 11.5, padW: 13.5, padH: 19,          /* s7_1 measures a flush
                          13 x 19 portrait pad; c_screen shows it standing
                          slightly PROUD of the corner, a soft black pad */
  wheelW: 17,
  bootPlan: 0.62       /* how far along the front-left wall the socket sits.
                          c_deck and c_mast both put it a third of the way
                          from the LEFT corner, not out by the front one */
};
D.hs = D.R / Math.SQRT2;             /* half side of the square */
D.corner = (D.hs - D.cornerR) * Math.SQRT2 + D.cornerR;   /* true plan extent */
D.mastX = 0; D.n = 5;
D.xBeltTop = D.xBeltY + D.endIdlerR + 0.63;   /* the top strand's centre line */

function mesh(g, m, cast, receive) {
  var o = new T.Mesh(g, m);
  o.castShadow = cast !== false;
  o.receiveShadow = receive !== false;
  return o;
}

/* a hex-socket cap screw */
function capScrew(mats, r, washer) {
  var g = new T.Group();
  var h = mesh(new T.SphereGeometry(r, 24, 16, 0, TAU, 0, PI * 0.55), mats.steelRail);
  h.scale.set(1, 0.55, 1);
  g.add(h);
  var body = mesh(new T.CylinderGeometry(r * 0.99, r * 0.99, r * 0.55, 24), mats.steelRail);
  body.position.y = -r * 0.26; g.add(body);
  var sock = mesh(new T.CylinderGeometry(r * 0.4, r * 0.4, r * 0.35, 6), mats.dark);
  sock.position.y = r * 0.38; sock.rotation.y = PI / 6; g.add(sock);
  if (washer) {
    var w = mesh(new T.CylinderGeometry(r * 1.55, r * 1.55, 0.8, 28), mats.aluMach);
    w.position.y = -r * 0.5; g.add(w);
  }
  return g;
}
M1.capScrew = capScrew;

/* ==========================================================================
   THE BASE

   A rounded square standing on its corner. Crisp arrises: a tight break onto
   the deck, one straight wall with no parting line, and a big roll onto the
   table below it. Sunk down the spine-to-front diagonal is the LED
   trough, with a groove down its floor for the carriage block.
   ========================================================================== */
function buildBase(mats, decals) {
  var G = new T.Group(); G.name = 'base';
  var hs = D.hs, cr = D.cornerR, RY = PI / 4;

  var ledSlot = M1.roundRectHole(0, 0, D.ledW, D.ledZ * 2, D.ledW / 2, 10);
  /* the trough does not run out at a constant width: its far end opens into a
     rounded bay about twice as wide, which is where the front idlers stand */
  var ledBay = M1.roundRectHole(0, -(D.ledZ - 19), 38, 38, 19, 22);
  /* the deck is milled through for the display and the intake as well. Without
     these two the cap covered both of them and the left corner read blank. */
  var dispR = D.screenR + 0.6;
  var dispHole = M1.roundRectHole(D.screenX, 0, dispR * 2, dispR * 2, dispR, 30);
  var fanHole = M1.roundRectHole(D.fanX, 0, D.fanR * 2, D.fanR * 2, D.fanR, 26);

  /* --- the shell: ONE piece, a big roll off the table, a straight wall and
     an almost sharp top arris.  It used to be two shells with a black
     parting line at 25 between them, and the real base has no such seam:
     s1_1, s3_1, s5_1, c_deck and h-03 all show one unbroken wall from the
     roll to the deck.  (s7_1's middle machine and s9_4 do show a split, but
     there the M1 is standing on a second box.) ------------------------- */
  G.add(mesh(M1.loftRoundSquare([
    { y: 0.0,  h: hs - 12.0, r: cr - 12.0 },
    { y: 1.4,  h: hs - 7.4,  r: cr - 7.4 },
    { y: 3.4,  h: hs - 4.1,  r: cr - 4.1 },
    { y: 6.2,  h: hs - 1.8,  r: cr - 1.8 },
    { y: 9.6,  h: hs - 0.45, r: cr - 0.45 },
    { y: 13.5, h: hs,        r: cr },
    { y: D.deckY - 1.8,  h: hs,        r: cr },
    { y: D.deckY - 0.8,  h: hs - 0.20, r: cr - 0.20 },
    { y: D.deckY - 0.26, h: hs - 0.62, r: cr - 0.62 },
    { y: D.deckY,        h: hs - 0.95, r: cr - 0.95 }
  ], 30, true, false, RY), mats.aluShell));

  /* --- the deck face, milled through for the LED trough ------------------ */
  var deckTop = mesh(M1.roundSquareCap(hs - 0.95, cr - 0.95, 30, [ledSlot, ledBay, dispHole, fanHole], RY),
                     mats.aluDeck, false, true);
  deckTop.position.y = D.deckY;
  G.add(deckTop);

  /* ======================================================================
     THE LED TROUGH
     A machined channel running corner to corner. Two lit ledges either side
     of a groove; the groove carries the block the cross rail bolts to.
     ====================================================================== */
  var chan = new T.Group(); chan.name = 'ledChannel';
  G.add(chan);

  /* The channel is DRAFTED, not square-walled, and s3_1 shows it plainly at
     6x: the slot's near side is a long mirror-bright sloped face carrying a
     highlight down the whole machine, with the deck's arris above it and a
     narrow dark seam at its foot.  A square wall renders as a thin dark line
     and leaves the mechanism in the channel on full view, which is why the
     render's trough came out at lum 139 sd 86 against the photograph's 179
     sd 49 - three black belt runs where the photograph has one seam. */
  var wallPts = M1.roundRectPoints(0, 0, D.ledW, D.ledZ * 2, D.ledW / 2, 10, true);
  var draft = (D.ledW - D.ledBotW) / 2;
  var wallBot = M1.roundRectPoints(0, 0, D.ledBotW, D.ledZ * 2 - draft * 2,
                                   D.ledW / 2 - draft, 10, true);
  /* the wall keeps its own material, so the LEDs can tint it (below) */
  var wallM = sideOf(mats.troughWall);
  chan.add(mesh(taper(wallPts, D.deckY + 0.05, wallBot, D.deckY - D.ledDrop),
                wallM, false, true));

  /* the groove down the middle of the valley floor */
  var groovePts = M1.roundRectPoints(0, 0, D.grooveW, D.ledZ * 2 - 10, D.grooveW / 2, 8, true);
  chan.add(mesh(strip(groovePts, D.deckY - D.ledDrop + 0.05, D.deckY - D.grooveDrop),
                sideOf(mats.anodBlackMatte), false, true));
  var grooveFloor = mesh(M1.rbox(D.grooveW, 2.0, D.ledZ * 2 - 10, D.grooveW / 2 - 0.3, 6), mats.steelDark, false, true);
  grooveFloor.position.y = D.deckY - D.grooveDrop - 1;
  chan.add(grooveFloor);

  /* ======================================================================
     THE LEDS - the light in the centre of the machine.
     m_led.cfg drives two 40-pixel chains, [neopixel Left] and [neopixel
     Right], and every effect addresses each one as two runs of twenty that
     move together: progress_left is Left (1-20) and progress_left_mirror is
     Left (40-21).  So each chain is folded into two parallel rows of twenty
     down the trough, pixel 1 beside pixel 40.  s7_1 shows them lit: the whole
     channel glows, its polished walls and the carriage fin carry the colour,
     and no single LED shows; c_deck shows the same channel unlit, with a pale
     frosted floor down inside it.  So the strips light the two frosted plates
     either side of the fin's slot - which is also what hides the belts (s3_1
     shows one narrow dark seam down the trough and nothing else) - and the
     channel is lit by two lamps in it.  Left is the -x side as you face the
     machine; which end pixel 1 sits at is not settled by any photograph, and
     it is put at the spine end.
     ====================================================================== */
  var N = 20;
  var ledSides = [];
  [-1, 1].forEach(function (sx) {
    /* each chain's colours, two rows of twenty: row u=0 is pixels 1..20 and
       row u=1 is 40..21, both running from the spine end */
    var data = new Uint8Array(2 * N * 4);
    var tex = new T.DataTexture(data, 2, N, T.RGBAFormat);
    tex.magFilter = T.LinearFilter; tex.minFilter = T.LinearFilter;
    tex.colorSpace = T.NoColorSpace;
    tex.needsUpdate = true;
    var w = 8.4, len = D.ledZ * 2 - 6;              /* 2.6 .. 11.0 from centre */
    var diffuserM = mats.ledDiffuser.clone();
    var cov = mesh(M1.rbox(w, 1.4, len, 0.5, 3), diffuserM, false, true);
    cov.position.set(sx * (2.6 + w / 2), D.deckY - 7.5, 0);
    chan.add(cov);
    /* the lit face: the same frosted plate with the pixels behind it */
    var faceM = mats.ledDiffuser.clone();
    faceM.emissiveMap = tex;
    faceM.emissive.setRGB(1, 1, 1);
    var faceG = new T.PlaneGeometry(w - 0.6, len - 1.2);
    faceG.rotateX(-PI / 2);
    /* the left strip's rows read outboard to inboard, the right's mirror it */
    if (sx > 0) { var uv = faceG.attributes.uv; for (var q = 0; q < uv.count; q++) uv.setX(q, 1 - uv.getX(q)); }
    var face = mesh(faceG, faceM, false, false);
    face.position.set(sx * (2.6 + w / 2), D.deckY - 7.5 + 0.72, 0);
    chan.add(face);
    ledSides.push({ data: data, tex: tex, body: diffuserM, face: faceM });
  });

  /* the light the strips throw into the channel: s7_1's colour climbs the
     silver walls and the fin, so it has to be light, not a tint.  One lamp
     over each half of the trough, coloured by the pixels in that half.  They
     are never switched off by visibility - that would change the light count
     and recompile every material - only by intensity. */
  var lamps = [-56, 56].map(function (lz) {
    var lamp = new T.PointLight(0xffffff, 0, 46, 2);
    lamp.position.set(0, D.deckY - D.ledDrop + 2.5, lz);
    chan.add(lamp);
    return lamp;
  });

  /* setLeds(on, rgb, left, right): rgb is one [r, g, b] for every pixel and
     left / right are Klipper's color_data for each chain (40 entries of
     [r, g, b] or [r, g, b, w], 0..1), which win where given.  Writes only
     what changed; returns nothing and allocates nothing. */
  var diffuserBase = mats.ledDiffuser.color.clone();
  var ledLast = new Float64Array(2 * 40 * 3).fill(-1), ledOnLast = null;
  var sum = [0, 0, 0, 0, 0, 0];
  G.userData.setLeds = function (on, rgb, left, right) {
    var changed = on !== ledOnLast, s, i, k;
    ledOnLast = on;
    sum[0] = sum[1] = sum[2] = sum[3] = sum[4] = sum[5] = 0;
    for (s = 0; s < 2; s++) {
      var chain = s === 0 ? left : right, side = ledSides[s], sideChanged = false;
      for (i = 0; i < 40; i++) {
        var c = chain && chain[i] ? chain[i] : rgb;
        var r = c ? +c[0] || 0 : 0, g = c ? +c[1] || 0 : 0, b = c ? +c[2] || 0 : 0;
        /* a white channel, where the strip has one, adds to all three */
        var wch = c && c.length > 3 ? +c[3] || 0 : 0;
        r = Math.min(1, r + wch); g = Math.min(1, g + wch); b = Math.min(1, b + wch);
        if (!on) r = g = b = 0;
        var o = (s * 40 + i) * 3;
        if (ledLast[o] !== r || ledLast[o + 1] !== g || ledLast[o + 2] !== b) {
          ledLast[o] = r; ledLast[o + 1] = g; ledLast[o + 2] = b; sideChanged = true;
        }
        /* pixel i (0-based) of the folded chain: rows of twenty from the
           spine end, pixel 21 coming back beside pixel 20 */
        var row = i < 20 ? 0 : 1, along = i < 20 ? i : 39 - i;
        var t = ((N - 1 - along) * 2 + row) * 4;       /* v = 0 is the front end */
        side.data[t] = Math.round(r * 255); side.data[t + 1] = Math.round(g * 255);
        side.data[t + 2] = Math.round(b * 255); side.data[t + 3] = 255;
        var half = along < 10 ? 0 : 3;                 /* spine half, front half */
        sum[half] += r; sum[half + 1] += g; sum[half + 2] += b;
      }
      if (sideChanged) {
        side.tex.needsUpdate = true;
        changed = true;
      }
    }
    if (!changed) return;
    for (s = 0; s < 2; s++) {
      /* the plate's own glow, under the face: the chain's mean colour */
      var mr = 0, mg = 0, mb = 0;
      for (i = 0; i < 40; i++) { k = (s * 40 + i) * 3; mr += ledLast[k]; mg += ledLast[k + 1]; mb += ledLast[k + 2]; }
      ledSides[s].body.emissive.setRGB(mr / 40, mg / 40, mb / 40);
      ledSides[s].body.emissiveIntensity = on ? 0.9 : 0;
      ledSides[s].face.emissiveIntensity = on ? 1.6 : 0;
      /* A lit diffuser is its LEDs' colour, not studio white with a tint on
         it: the brighter the strip, the less of the room's light its frosted
         face is allowed to show, or a red strip renders pink. */
      var lit = on ? Math.min(1, Math.max(mr, mg, mb) / 40 * 2.5) : 0;
      ledSides[s].face.color.copy(diffuserBase).multiplyScalar(1 - 0.85 * lit);
      ledSides[s].body.color.copy(diffuserBase).multiplyScalar(1 - 0.6 * lit);
    }
    /* The walls are polished mirrors, and this renderer has no reflections
       of the scene itself, so they cannot pick the lit plates up the way the
       real channel does in s7_1 - where the colour runs right up both walls.
       A faint emissive in the strips' mean colour stands in for that. */
    var ar = 0, ag = 0, ab = 0;
    for (i = 0; i < 80; i++) { ar += ledLast[i * 3]; ag += ledLast[i * 3 + 1]; ab += ledLast[i * 3 + 2]; }
    wallM.emissive.setRGB(ar / 80, ag / 80, ab / 80);
    wallM.emissiveIntensity = on ? 0.45 : 0;
    for (k = 0; k < 2; k++) {
      var lr = sum[k * 3] / 40, lg = sum[k * 3 + 1] / 40, lb = sum[k * 3 + 2] / 40;
      var peak = Math.max(lr, lg, lb);
      lamps[k].color.setRGB(peak ? lr / peak : 1, peak ? lg / peak : 1, peak ? lb / peak : 1);
      lamps[k].intensity = on ? 1400 * peak : 0;
    }
    G.userData.ledWrites = (G.userData.ledWrites || 0) + 1;
  };

  /* --- the round display, on the corner anticlockwise from the spine ----- */
  var disp = new T.Group(); disp.name = 'display';
  disp.position.set(D.screenX, D.deckY, 0);
  var chamfer = mesh(new T.CylinderGeometry(D.screenR + 0.6, D.screenR, 1.4, 90, 1, true), mats.aluPolish, false, false);
  chamfer.material = sideOf(mats.aluPolish);
  chamfer.position.y = -0.7; disp.add(chamfer);
  var pocketWall = mesh(new T.CylinderGeometry(D.screenR, D.screenR, 1.3, 90, 1, true), mats.anodBlackMatte, false, false);
  pocketWall.material = sideOf(mats.anodBlackMatte);
  pocketWall.position.y = -1.75; disp.add(pocketWall);
  /* the black bezel: the lit glass is inset 3.6 inside the pocket */
  var bezel = mesh(new T.RingGeometry(D.screenR - 3.6, D.screenR, 90), mats.anodBlackMatte, false, false);
  bezel.rotation.x = -PI / 2; bezel.position.y = -2.05; disp.add(bezel);
  var scr = mesh(new T.CircleGeometry(D.screenR - 3.6, 90), mats.screen(decals.screen), false, false);
  scr.rotation.x = -PI / 2; scr.position.y = -2.1; disp.add(scr);
  var cover = mesh(new T.CircleGeometry(D.screenR + 0.35, 90), new T.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.07,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.55, depthWrite: false
  }), false, false);
  cover.rotation.x = -PI / 2; cover.position.y = -0.9; cover.renderOrder = 5; disp.add(cover);
  G.add(disp);

  /* --- the fan intake, between the display and the trough ---------------- */
  var port = new T.Group(); port.name = 'fanIntake';
  port.position.set(D.fanX, D.deckY, 0);
  /* a short bright machined lead-in, then a near vertical wall that drops
     far enough for its near side to fall into its own shadow */
  var lead = mesh(new T.CylinderGeometry(D.fanR, D.fanR - 1.1, 1.3, 72, 1, true), mats.fanBevel, false, false);
  lead.material = sideOf(mats.fanBevel);
  lead.position.y = -0.65; port.add(lead);
  var wall = mesh(new T.CylinderGeometry(D.fanR - 1.1, D.fanBore, 2.2, 72, 1, true), mats.fanWall, false, false);
  wall.material = sideOf(mats.fanWall);
  wall.position.y = -2.4; port.add(wall);
  var bore = mesh(new T.CylinderGeometry(D.fanBore, D.fanBore, 10, 60, 1, true), mats.anodBlackMatte, false, false);
  bore.material = sideOf(mats.anodBlackMatte);
  bore.position.y = -8.5; port.add(bore);
  var mouth = mesh(new T.CircleGeometry(D.fanBore, 60), mats.dark, false, false);
  mouth.rotation.x = -PI / 2; mouth.position.y = -13.5; port.add(mouth);
  /* the impeller you can just see down the bore */
  for (var ct = 0; ct < 9; ct++) {
    var blade = mesh(new T.BoxGeometry(D.fanBore - 1.2, 0.7, 2.4), mats.anodBlack, false, false);
    blade.position.set(Math.cos(ct / 9 * TAU) * (D.fanBore - 3.4), -11.9, Math.sin(ct / 9 * TAU) * (D.fanBore - 3.4));
    blade.rotation.y = -ct / 9 * TAU; blade.rotation.z = 0.5;
    port.add(blade);
  }
  G.add(port);

  /* --- the scroll wheel: the left corner itself ---------------------------
     It is not a small thumb roller in a pocket, which is what it was (a
     13.5 x 19 pad with a horizontal axle, standing out of the corner).
     s1_1, s5_1 and s3_1 all show one broad band of matte black rubber
     wrapping the left corner: a wheel on a VERTICAL axis whose rim IS the
     corner's own curve, seen through a window in the shell, sitting almost
     flush.  Measured in s1_1 against a ruler of rings rendered at the
     matched hero camera (2.5 px per mm of height at that corner) and the
     photograph's own deck arris: its top is 26 px (10 mm) under the arris
     and its bottom 96 px (38 mm), so it runs y 20 to 48; and it reaches 47 px
     round from the corner's silhouette, which on the corner's 31 mm radius
     is 40 degrees either side of the tip, nearly the whole 90 degree arc.
     No photograph sees it proud of the shell by more than its own rounded
     edge, so the rim stands 0.8 out. */
  var wheel = new T.Group(); wheel.name = 'scrollWheel';
  var cCx = -(D.corner - cr);                     /* the corner's centre */
  wheel.position.set(cCx, 0, 0);
  var wY0 = 20, wY1 = 48, wSpan = 40 * PI / 180, wR = cr + 0.8;
  /* a rounded band: lathe profile with 1.6 mm rolled edges top and bottom */
  var prof = [], e = 1.6, k;
  prof.push(new T.Vector2(cr - 2, wY0));
  for (k = 0; k <= 5; k++) { var a = -PI / 2 + k / 5 * PI / 2; prof.push(new T.Vector2(wR - e + Math.cos(a) * e, wY0 + e + Math.sin(a) * e)); }
  for (k = 0; k <= 5; k++) { var b = k / 5 * PI / 2; prof.push(new T.Vector2(wR - e + Math.cos(b) * e, wY1 - e + Math.sin(b) * e)); }
  prof.push(new T.Vector2(cr - 2, wY1));
  var band = mesh(new T.LatheGeometry(prof, 48, 1.5 * PI - wSpan, 2 * wSpan), mats.rubber, true, true);
  wheel.add(band);
  /* the window it turns in: a dark gap just round the band, laid on the
     shell's own surface (polygon offset keeps it off the shell) */
  var gapM = mats.anodBlackMatte.clone();
  gapM.polygonOffset = true; gapM.polygonOffsetFactor = -2; gapM.polygonOffsetUnits = -2;
  var gw = 1.1 * PI / 180 * 1.0;
  var gap = mesh(new T.CylinderGeometry(cr + 0.02, cr + 0.02, wY1 - wY0 + 1.6, 48, 1, true,
                 1.5 * PI - wSpan - 0.035, 2 * wSpan + 0.07), gapM, false, false);
  gap.position.y = (wY0 + wY1) / 2;
  wheel.add(gap);
  G.add(wheel);
  G.userData.scrollWheel = wheel;

  /* --- the umbilical boot, in the front-left wall --------------------------
     c_deck sees it close to square on: an upright black rubber sleeve
     standing in a rounded pocket milled into the wall, its top domed, and
     the hose leaving its BOTTOM straight down before it turns for the table.
     It is not a block with a nose pointing out of the wall, which is what it
     was.  On c_deck's own scale (4.33 px/mm on the belt, the wall turned 33
     degrees from the lens) the sleeve is about 22-26 across and 25 tall, its
     top 12 under the deck and its mouth 37 under it; c_s1deck, nearly face
     on, sees a round sleeve about 1.3 hose diameters across with its top as
     an ellipse, so it stands well proud of the wall.  The pocket it stands
     in is not cut (the shell is one loft); the sleeve's flat back is sunk
     into the wall instead. */
  var sock = new T.Group(); sock.name = 'umbilicalSocket';
  var sp = wallPoint(-1, 1, D.bootPlan);
  sock.position.set(sp.x, 0, sp.z);
  sock.rotation.y = -PI / 4;                    /* local +z is the wall's outward normal */
  /* an upright rubber sleeve: round in front, flat where it sinks into the
     wall, with a low dome on top; the hose leaves its open bottom */
  var sR = 10.8, sOut = 11, sBot = 21, sTop = 44;
  var sleeve = mesh(new T.CylinderGeometry(sR, sR, sTop - sBot, 40), mats.rubber, true, true);
  sleeve.position.set(0, (sTop + sBot) / 2, sOut);
  sock.add(sleeve);
  var dome = mesh(new T.SphereGeometry(sR, 40, 12, 0, TAU, 0, PI / 2), mats.rubber, true, true);
  dome.scale.y = 0.5;
  dome.position.set(0, sTop, sOut);
  sock.add(dome);
  /* the back half, filling the sleeve back into its pocket in the wall */
  var back = mesh(M1.rbox(2 * sR, sTop - sBot + 3, sOut + 4, 3.0, 4), mats.rubber, true, true);
  back.position.set(0, (sTop + sBot) / 2 + 1.5, (sOut - 4) / 2);
  sock.add(back);
  /* the mouth: straight down, leaning a few degrees out of the wall */
  var sDir = new T.Vector3(0, -0.99, 0.14).normalize();
  var mouthL = new T.Vector3(0, sBot + 1, sOut);
  G.add(sock);
  sock.updateMatrix();
  /* the hose starts inside the sleeve, so its open end is never seen */
  G.userData.socketAnchor = mouthL.clone().addScaledVector(sDir, -4).applyMatrix4(sock.matrix);
  G.userData.socketDir = sDir.clone().applyQuaternion(sock.quaternion).normalize();

  /* No corner bumpers.  There used to be a black rubber block on the front
     and right corner tips, and no photograph has one: s1_1, s3_1, s5_1,
     c_deck, h-03 and s7_1 all show those two corners as bare aluminium.  The
     only black things on the shell are the scroll wheel in the left corner
     and the umbilical boot on the front-left wall. */

  /* --- the ports -----------------------------------------------------------
     Jack, 2026-10-11, facing the printer from its front: the power connector
     is on the BACK RIGHT wall, and a USB port and a micro-HDMI port sit side
     by side on the BACK LEFT wall.  The old model had one pocket on the
     FRONT right wall with a round inlet over a small port, which is what
     s7_1's folded machine shows - an earlier revision, going by Jack.  No
     photograph shows either back wall, so the ports' height (the middle of
     the straight wall) and their place along each wall (its middle) are
     assumptions, and so is the connector type: the power inlet is drawn as
     the round panel jack s7_1 shows, and the USB as a USB-C receptacle (the
     CM4's own pairing with micro-HDMI).  Sizes are the connectors' real
     ones: USB-C 8.94 x 3.26, micro-HDMI (type D) 6.4 x 2.8. */
  G.add(portPanel(mats, 1, -1, 'power'));
  G.add(portPanel(mats, -1, -1, 'data'));

  /* --- the etched wordmark, on the deck between the spine and the right -- */
  /* c_s1deck: the etched N3D glyphs are 28 px tall against a belt that
     measures 5.65 px/mm along the rail, and the plane's own anisotropy is
     2.271 - so the cap height is 11.3 and the whole word is 80 wide. */
  var wm = mesh(new T.PlaneGeometry(89, 89), mats.decal(decals.deck, { roughness: 0.5, metalness: 0.0 }), false, false);
  wm.rotation.x = -PI / 2;
  /* against the hero camera, clipped to c_s1deck's own window, the etched
     glyphs image at (663,68) and the render put them at (642,28) - 21 px
     right and 40 down, which on the deck plane is 1 mm in X and 29 in Z. */
  wm.position.set(110.9, D.deckY + 0.05, -1);
  G.add(wm);

  /* --- feet, one under each corner --------------------------------------- */
  var footG = new T.CylinderGeometry(11, 12.5, 2.6, 40);
  [0, 1, 2, 3].forEach(function (i) {
    var ang = i * PI / 2;
    var f = mesh(footG, mats.rubber);
    f.position.set(Math.cos(ang) * (D.corner - 40), -0.9, Math.sin(ang) * (D.corner - 40));
    G.add(f);
  });

  G.userData.display = disp;
  G.userData.screenMesh = scr;
  return G;
}

/* a point on one of the four walls. sx, sz pick the wall by its outward
   normal; t runs 0..1 from one end of that wall to the other. */
function wallPoint(sx, sz, t) {
  var hs = D.hs;
  var nx = sx / Math.SQRT2, nz = sz / Math.SQRT2;
  var tx = -nz, tz = nx;                       /* along the wall */
  var half = hs - D.cornerR;
  var u = (t * 2 - 1) * half;
  return { x: nx * hs + tx * u, z: nz * hs + tz * u, nx: nx, nz: nz };
}

/* A milled port pocket in one wall (sx, sz pick the wall, as wallPoint),
   with the connectors standing in it.  Local +z is the wall's outward
   normal, +x runs along the wall to the viewer's right, y is height. */
function portPanel(mats, sx, sz, kind) {
  var g = new T.Group(); g.name = kind === 'power' ? 'powerPort' : 'dataPorts';
  var wp = wallPoint(sx, sz, 0.5);
  g.position.set(wp.x, 30, wp.z);
  g.rotation.y = Math.atan2(wp.nx, wp.nz);
  var pw = kind === 'power' ? 20 : 27, ph = 14;
  /* the pocket: its floor sits 1.2 in, shown as a darker machined face
     framed by a narrow polished chamfer */
  function slab(w, h, r, d) {
    var sh = new T.Shape(M1.roundRectPoints(0, 0, w, h, r, 8));
    return new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 8 });
  }
  var rimM = mesh(slab(pw + 2.2, ph + 2.2, 4.6, 0.25), mats.aluMach, false, true);
  g.add(rimM);
  var floor = mesh(slab(pw, ph, 3.6, 0.3), mats.fanBevel, false, true);
  g.add(floor);
  var z0 = 0.3;                                   /* the pocket floor's face */
  if (kind === 'power') {
    /* a round panel jack: a turned steel bezel, a black insulator and the
       centre pin down a dark bore */
    var bezel = mesh(new T.CylinderGeometry(5.6, 5.9, 1.6, 40), mats.steelRail, false, true);
    bezel.rotation.x = PI / 2; bezel.position.z = z0 + 0.8; g.add(bezel);
    var ins = mesh(new T.CylinderGeometry(4.3, 4.3, 0.4, 36), mats.anodBlackMatte, false, false);
    ins.rotation.x = PI / 2; ins.position.z = z0 + 1.65; g.add(ins);
    var bore = mesh(new T.CircleGeometry(3.2, 32), mats.dark, false, false);
    bore.position.z = z0 + 1.9; g.add(bore);
    var pin = mesh(new T.CylinderGeometry(1.0, 1.0, 0.6, 16), mats.steelRail, false, false);
    pin.rotation.x = PI / 2; pin.position.z = z0 + 1.95; g.add(pin);
  } else {
    /* USB-C on the left, micro-HDMI on the right, 7 apart on centre-line */
    var usb = new T.Group(); usb.position.set(-6.2, 0, z0);
    var ushell = mesh(M1.rbox(8.94, 3.26, 1.0, 1.62, 5), mats.steelRail, false, false);
    ushell.position.z = 0.5; usb.add(ushell);
    var uin = mesh(M1.rbox(8.2, 2.5, 0.2, 1.24, 5), mats.dark, false, false);
    uin.position.z = 1.02; usb.add(uin);
    var utongue = mesh(new T.BoxGeometry(6.6, 0.7, 0.2), mats.anodBlackMatte, false, false);
    utongue.position.z = 1.08; usb.add(utongue);
    g.add(usb);
    var hd = new T.Group(); hd.position.set(6.6, 0, z0);
    /* type D: 6.4 wide, 2.8 tall, the lower corners chamfered */
    function trap(w, h, c) {
      var sh = new T.Shape();
      sh.moveTo(-w / 2, h / 2); sh.lineTo(w / 2, h / 2); sh.lineTo(w / 2, -h / 2 + c);
      sh.lineTo(w / 2 - c, -h / 2); sh.lineTo(-w / 2 + c, -h / 2); sh.lineTo(-w / 2, -h / 2 + c);
      sh.closePath();
      return sh;
    }
    var hshell = mesh(new T.ExtrudeGeometry(trap(6.4, 2.8, 0.9), { depth: 1.0, bevelEnabled: false }), mats.steelRail, false, false);
    hd.add(hshell);
    var hin = mesh(new T.ShapeGeometry(trap(5.8, 2.2, 0.7)), mats.dark, false, false);
    hin.position.z = 1.02; hd.add(hin);
    var htongue = mesh(new T.BoxGeometry(4.6, 0.6, 0.2), mats.anodBlackMatte, false, false);
    htongue.position.set(0, 0.2, 1.08); hd.add(htongue);
    g.add(hd);
  }
  return g;
}

/* the same band, but lofted between TWO outlines, so a pocket can be milled
   with a draft.  The inset outline has to carry the same point count: for a
   rounded rectangle inset by t the CORNER CENTRES do not move at all - hw
   becomes (w-2t)/2 - (r-t) = w/2 - r, which is hw again - so the inset shape
   is the same parametrisation with a smaller corner radius, and
   roundRectPoints returns the two lists point for point. */
function taper(ptsTop, yTop, ptsBot, yBot) {
  var p = [], idx = [], n = Math.min(ptsTop.length, ptsBot.length), i;
  for (i = 0; i < n; i++) {
    p.push(ptsTop[i].x, yTop, -ptsTop[i].y);
    p.push(ptsBot[i].x, yBot, -ptsBot[i].y);
  }
  for (i = 0; i < n - 1; i++) {
    var dx = ptsTop[i + 1].x - ptsTop[i].x, dy = ptsTop[i + 1].y - ptsTop[i].y;
    if (dx * dx + dy * dy < 1e-8) continue;
    var a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* a vertical band swept from a closed 2D outline: the wall of a milled pocket */
function strip(pts, yTop, yBot) {
  var p = [], idx = [], n = pts.length, i;
  for (i = 0; i < n; i++) {
    p.push(pts[i].x, yTop, -pts[i].y);
    p.push(pts[i].x, yBot, -pts[i].y);
  }
  for (i = 0; i < n - 1; i++) {
    /* a closed outline repeats its first point, and the degenerate quad that
       makes ends up with a zero-length normal - which lights to flat white */
    var dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
    if (dx * dx + dy * dy < 1e-8) continue;
    var a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function sideOf(m) { var c = m.clone(); c.side = T.DoubleSide; return c; }
function offsetOf(m, f) {
  var c = m.clone(); c.polygonOffset = true; c.polygonOffsetFactor = f; return c;
}

/* ==========================================================================
   THE MOTION SYSTEM

   Two GT2 belts (core.cfg: corexy, 20 tooth pulleys, 2 mm pitch). What the
   photographs show of them - s3_1, h-03, c_deck and c_s1deck all agree:

   - the CENTRAL TWO: one strand of each belt runs in the open, above the
     deck, from the cluster of four idlers at the mast's foot forward to the
     carriage at the middle of the cross rail.  They leave the cluster lying
     flat and arrive at the carriage on edge, twisting a quarter turn on the
     way, and they are closer together at the carriage than at the mast.
   - the CROSS BELT: one toothed strand, teeth up, running just above the
     cross bar's top face the length of the bar, between a flanged idler at
     each end.  Both idlers stand BEHIND the bar's ends (c_deck at 2x: the
     bar's polished end overlaps the lower half of the idler), so the loop
     lies in a vertical plane behind the bar and its return strand is hidden
     by the bar - no photograph shows a second strand under it.
   - at the carriage, two black flanged idlers on upright axles, 23 apart
     (s3_1: 52 px at 2.26 px/mm), turn the central strands onto the bar.

   The model used to run both belts as closed loops INSIDE the trough, under
   the LED covers, where nothing of them showed, and had no central strands
   at all; and its cross belt ran in the bar's own plane with the return
   strand on show under the bar.  Which way each belt runs inside the base,
   and how the strands on the bar meet the carriage idlers, no photograph
   settles: the loop on the bar is drawn as one loop end to end.

   Everything screwed to the base is here; everything that travels is in
   buildCarriage.
   ========================================================================== */
function buildGantry(mats) {
  var G = new T.Group(); G.name = 'gantry';
  var spineZ = -(D.ledZ - 8);

  /* Four flanged idlers cluster at the SPINE end - h-03 and s5_1 both show a
     block of four bright bearings there, two per belt, turning each run
     through ninety degrees - and a plain pair closes the front end. */
  /* c_mast photographs this cluster square on, and it is NOT the flat 2 x 2
     of upright pulleys the model had.  There are four, splayed two to a side
     about the mast, standing PROUD of the deck, and every one of them is
     canted out of vertical - which is what turns each flat run coming up the
     trough into the wrap the cross rail wants.  Within a pair the inner one
     rides about 7 higher and 10 further in than the outer, which is the
     (70, -50) px offset the frame reads at 6.5 px/mm. */
  [-1, 1].forEach(function (sx) {
    [0, 1].forEach(function (inner) {
      var pg = new T.Group();
      pg.position.set(sx * (inner ? 11 : 18), D.deckY + (inner ? 12 : 5),
                      spineZ + (inner ? 17 : 11));
      pg.rotation.z = sx * (inner ? 0.72 : 0.46);
      pg.rotation.x = inner ? 0.34 : -0.22;
      pg.add(mesh(new T.CylinderGeometry(D.yokeIdlerR - 1.4, D.yokeIdlerR - 1.4, D.beltW - 1.2, 30), mats.anodBlack, true, true));
      [-1, 1].forEach(function (sf) {
        var fl = mesh(new T.CylinderGeometry(D.yokeIdlerR, D.yokeIdlerR, 0.8, 34), mats.anodBlack, false, true);
        fl.position.y = sf * (D.beltW / 2 - 0.6); pg.add(fl);
      });
      var csk = mesh(new T.CylinderGeometry(D.yokeIdlerR - 1.0, 1.5, 2.0, 34, 1, true), mats.aluPolishBoth, false, true);
      csk.position.y = D.beltW / 2 - 1.2; pg.add(csk);
      var seat = mesh(new T.CylinderGeometry(1.5, 1.5, 0.4, 24), mats.steelDark, false, false);
      seat.position.y = D.beltW / 2 - 2.2; pg.add(seat);
      /* the bolt through it: a big bright socket cap, the brightest thing
         at the mast's foot in s3_1 and h-03 */
      var hd = capScrew(mats, 3.4, true);
      hd.position.y = D.beltW / 2 + 1.0; pg.add(hd);
      /* the stub each one is bolted to, running back down to the block */
      var stub = mesh(new T.CylinderGeometry(2.4, 2.8, 10, 20), mats.aluMach, false, true);
      stub.position.y = -(D.beltW / 2 + 4.0); pg.add(stub);
      G.add(pg);
    });
  });
  /* No plate under them: s3_1, h-03 and c_deck show the four standing in
     dark pockets in the deck either side of the trough's end, not on a
     bridge across it. */
  [-1, 1].forEach(function (sx) {
    var pk = mesh(new T.CylinderGeometry(9.5, 9.5, 0.4, 40), mats.anodBlackMatte, false, true);
    pk.scale.set(0.85, 1, 1.1);
    pk.position.set(sx * 15, D.deckY + 0.05, spineZ + 14);
    G.add(pk);
  });

  /* --- the CENTRAL TWO: one strand of each belt, cluster to carriage -------
     A ribbon from the inner idler of each cluster pair (lying flat) to the
     back of the carriage idler on that side (on edge), twisting a quarter
     turn on the way.  The carriage end moves with the cross rail, so the
     ribbon's vertices are rewritten in place by updateStrands(hz); nothing
     is allocated there. */
  var SEGS = 16;
  var strands = [-1, 1].map(function (sx) {
    var g = new T.BufferGeometry();
    var pos = new Float32Array((SEGS + 1) * 2 * 3), nor = new Float32Array((SEGS + 1) * 2 * 3);
    var uv = new Float32Array((SEGS + 1) * 2 * 2), idx = [];
    for (var i = 0; i < SEGS; i++) {
      var a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    g.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('normal', new T.BufferAttribute(nor, 3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2).setUsage(T.DynamicDrawUsage));
    g.setIndex(idx);
    g.boundingSphere = new T.Sphere(new T.Vector3(sx * 9, D.crossY, 0), 140);
    var m = mesh(g, mats.beltBoth, true, true);
    m.name = 'centralBelt';
    m.frustumCulled = false;
    G.add(m);
    /* the cluster end: just in front of the inner idler, lying flat */
    return { m: m, g: g, pos: pos, nor: nor, uv: uv, sx: sx,
             a: [sx * 12.0, D.deckY + 12.6, spineZ + 17 + D.yokeIdlerR] };
  });
  var lastHz = NaN;
  G.userData.updateStrands = function (hz) {
    if (Math.abs(hz - lastHz) < 0.01) return;
    lastHz = hz;
    for (var s = 0; s < 2; s++) {
      var S = strands[s], sx = S.sx, A = S.a;
      /* the carriage end: off the inboard side of its idler, on edge */
      var bx = sx * (D.cxIdlerX - D.yokeIdlerR), by = D.xBeltTop;
      var bz = Math.max(hz + D.beltZ - D.cxIdlerBack, A[2] + 4);
      var dx = bx - A[0], dy = by - A[1], dz = bz - A[2];
      var L = Math.hypot(dx, dy, dz);
      var tx = dx / L, ty = dy / L, tz = dz / L;
      /* a frame round the strand: u across it at the flat end, v its normal */
      var ux = 1, uy = 0, uz = 0, d0 = ux * tx;
      ux -= d0 * tx; uy -= d0 * ty; uz -= d0 * tz;
      var ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
      var vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
      if (vy < 0) { vx = -vx; vy = -vy; vz = -vz; }
      var hw = D.beltW / 2;
      for (var i = 0; i <= SEGS; i++) {
        var f = i / SEGS;
        /* a quarter turn, eased at both ends as a real twist settles */
        var ang = (f * f * (3 - 2 * f)) * (PI / 2) * sx;
        var c = Math.cos(ang), sn = Math.sin(ang);
        var wx = ux * c + vx * sn, wy = uy * c + vy * sn, wz = uz * c + vz * sn;   /* across */
        var nx = vx * c - ux * sn, ny = vy * c - uy * sn, nz = vz * c - uz * sn;   /* normal */
        var px = A[0] + dx * f, py = A[1] + dy * f, pz = A[2] + dz * f;
        var o = i * 6;
        S.pos[o] = px - wx * hw; S.pos[o + 1] = py - wy * hw; S.pos[o + 2] = pz - wz * hw;
        S.pos[o + 3] = px + wx * hw; S.pos[o + 4] = py + wy * hw; S.pos[o + 5] = pz + wz * hw;
        S.nor[o] = S.nor[o + 3] = nx; S.nor[o + 1] = S.nor[o + 4] = ny; S.nor[o + 2] = S.nor[o + 5] = nz;
        /* one tile of the tooth map is 32 mm of belt */
        var u = f * L / 32, q = i * 4;
        S.uv[q] = u; S.uv[q + 1] = 0; S.uv[q + 2] = u; S.uv[q + 3] = 1;
      }
      S.g.attributes.position.needsUpdate = true;
      S.g.attributes.normal.needsUpdate = true;
      S.g.attributes.uv.needsUpdate = true;
    }
  };

  /* --- the end blocks, closing each end of the trough --------------------- */
  /* only the SPINE end is closed. s3_1 shows the far end opening into a bay
     sunk into the deck with the front idler pair standing in it - and with
     travelZ at the 92 core.cfg asks for, a raised block there would be in
     the pod's way anyway. */
  var eb = mesh(M1.rbox(D.ledW + 13, 13, 28, 3.0, 4), mats.aluMach, true, true);
  eb.position.set(0, D.deckY + 2.5, -(D.ledZ - 3));
  G.add(eb);
  [-1, 1].forEach(function (sx) {
    var s2 = capScrew(mats, 2.2, true);
    s2.position.set(sx * 11, D.deckY + 8.6, -(D.ledZ - 3));
    G.add(s2);
  });

  /* The two steppers under the deck at the spine corner are not modelled:
     inside an opaque shell they can never be seen, and the 28 mm boxes that
     stood for them poked out through both back walls as two black blocks. */

  return G;
}

/* --------------------------------------------------------------------------
   The moving half: the block down in the groove, a tapered plate rising out
   of the trough, the yoke of four idlers that turns the belts through ninety
   degrees, and the cross rail itself.
   -------------------------------------------------------------------------- */
function buildCarriage(mats) {
  var G = new T.Group(); G.name = 'carriage';
  var barBot = D.crossY - D.crossH / 2, barTop = D.crossY + D.crossH / 2;
  var beltHi = D.crossY + D.beltGap / 2, beltLo = D.crossY - D.beltGap / 2;

  /* the shoe that runs in the groove */
  var shoe = mesh(M1.rbox(D.grooveW - 0.6, 8, 34, 1.2, 3), mats.steelDark, false, true);
  shoe.position.y = D.deckY - D.grooveDrop + 5.5;
  G.add(shoe);

  /* the tapered plate: 25 wide at the top, 19 at the bottom, from the bar's
     underside down into the trough */
  /* the bottom ring has to fit the GROOVE, which is only 7 wide - at 19 it
     was ploughing through the groove walls and checkerboarding against them
     wherever the two surfaces met. */
  /* It stays a narrow FIN the whole way up the channel and only widens once
     it is clear of the deck. Flaring it inside the trough drove it straight
     through the two belt runs, and the pair checkerboarded wherever the
     surfaces met - which is s3_1's shape anyway: a thin plate, deep in Z,
     standing up out of the bay. */
  var plate = mesh(M1.loftRoundSquare([
    { y: D.deckY - D.grooveDrop + 7, h: 2.6,  d: 13, r: 1.2 },
    { y: D.deckY - 2,                h: 2.6,  d: 13, r: 1.2 },
    { y: D.deckY + 3,                h: 12.0, d: 15, r: 3 },
    { y: barBot - 1,                 h: 12.5, d: 15, r: 3 }
  ], 8, true, true, 0), mats.aluMach, true, true);
  G.add(plate);

  /* --- the cross rail: a slim guide bar, hung only here ------------------- */
  var railGeo = M1.railGeometry(D.crossX * 2, D.crossW, D.crossH);
  var rail = mesh(railGeo, mats.crossBar, true, true);
  rail.rotation.y = PI / 2;
  rail.position.set(0, barBot, 0);
  G.add(rail);

  /* the countersunk mounting holes down the top land - in M1_cover they are
     the thing that reads the bar as a linear rail rather than a bar */
  for (var bh = -6; bh <= 6; bh++) {
    var mh = mesh(new T.CylinderGeometry(1.55, 1.55, 1.1, 18), mats.steelDark, false, false);
    mh.position.set(bh * 19, barTop - 0.25, 0);
    G.add(mh);
  }

  /* the raceway grooves down its outward face, which is most of what reads */
  [-1, 1].forEach(function (sz) {
    var gv = mesh(new T.BoxGeometry(D.crossX * 2 - 6, 1.1, 0.7), mats.steelDark, false, false);
    gv.position.set(0, D.crossY + 0.6, sz * (D.crossW / 2 + 0.15));
    G.add(gv);
  });

  /* --- the carriage idlers: the central strands turn onto the bar here ----
     s3_1 and h-03: two black flanged idlers on upright axles at the middle
     of the rail, 23 apart (52 px at s3_1's 2.26 px/mm), behind the toothed
     strand, each with a bright bolt head on top.  The old four canted
     idlers in front of the bar are not in any photograph. */
  var cz = D.beltZ - D.cxIdlerBack, cyI = D.xBeltTop;
  var bridge = mesh(M1.rbox(2 * D.cxIdlerX + 12, 3.0, 2 * D.yokeIdlerR + 4, 1.2, 3), mats.aluMach, true, true);
  bridge.position.set(0, cyI - D.beltW / 2 - 2.6, cz);
  G.add(bridge);
  /* the bridge hangs off the fin, behind the bar */
  var web = mesh(M1.rbox(10, 6, Math.abs(cz) + 2, 1.2, 3), mats.aluMach, true, true);
  web.position.set(0, cyI - D.beltW / 2 - 5.5, cz / 2);
  G.add(web);
  [-1, 1].forEach(function (sx) {
    var pg = new T.Group();
    pg.position.set(sx * D.cxIdlerX, cyI, cz);
    pg.add(mesh(new T.CylinderGeometry(D.yokeIdlerR - 1.0, D.yokeIdlerR - 1.0, D.beltW, 30), mats.anodBlack, true, true));
    [-1, 1].forEach(function (sf) {
      var fl = mesh(new T.CylinderGeometry(D.yokeIdlerR + 1.0, D.yokeIdlerR + 1.0, 0.8, 34), mats.anodBlack, false, true);
      fl.position.y = sf * (D.beltW / 2 + 0.4); pg.add(fl);
    });
    var hd = capScrew(mats, 2.4, false);
    hd.position.y = D.beltW / 2 + 1.2; pg.add(hd);
    G.add(pg);
  });

  /* --- the end idlers ---------------------------------------------------
     Both ends of the cross rail image as a nearly ROUND black flange in
     c_s1deck - 14.5 across against the 52.4 display beside it - with the
     hex socket of its shoulder bolt looking sideways out of the middle, not
     up. A horizontal disc at that camera would be a 0.47 ellipse, so the
     axle is horizontal and square to the rail, and the belt loop that wraps
     it therefore stands in a VERTICAL plane along the bar. ---------------- */
  [-1, 1].forEach(function (sx) {
    /* the bar's end block, and the axle running back from it */
    var ec = mesh(M1.rbox(5.5, D.crossH + 1.2, D.crossW + 1.0, 1.2, 3), mats.aluMach, true, true);
    ec.position.set(sx * (D.crossX - 3), D.crossY - 0.6, 0);
    G.add(ec);
    var axl = mesh(new T.CylinderGeometry(1.5, 1.5, Math.abs(D.beltZ) + 3, 16), mats.steelRail, false, true);
    axl.rotation.x = PI / 2;
    axl.position.set(sx * D.endIdlerX, D.xBeltY, D.beltZ / 2 - 1.5);
    G.add(axl);

    var pg = new T.Group();
    pg.position.set(sx * D.endIdlerX, D.xBeltY, D.beltZ);
    pg.rotation.x = PI / 2;          /* axle along Z, square to the rail */
    pg.add(mesh(new T.CylinderGeometry(D.endIdlerR, D.endIdlerR, D.beltW + 0.8, 40), mats.anodBlack, true, true));
    [-1, 1].forEach(function (sy) {
      var fl = mesh(new T.CylinderGeometry(D.endIdlerR + 1.8, D.endIdlerR + 1.8, 0.8, 44), mats.anodBlack, false, true);
      fl.position.y = sy * (D.beltW / 2 + 0.8); pg.add(fl);
      /* the shoulder bolt: a bright hex socket looking out of each face */
      var ax = mesh(new T.CylinderGeometry(2.9, 2.9, 1.5, 26), mats.steelRail, false, true);
      ax.position.y = sy * (D.beltW / 2 + 1.6); pg.add(ax);
      var axr = mesh(new T.CylinderGeometry(1.6, 1.6, 0.7, 20), mats.steelDark, false, false);
      axr.position.y = sy * (D.beltW / 2 + 2.4); pg.add(axr);
    });
    G.add(pg);
  });

  /* the belt itself: ONE loop, standing UPRIGHT along the bar. c_s1deck
     shows the top strand riding clear above the rail's top land with its
     tooth crests turned up at the camera, and the return strand tucked away
     behind the rail - which is why only one band ever reads. */
  var xBeltGeo = M1.beltLoop(-D.endIdlerX, D.endIdlerX, D.endIdlerR + 0.63, D.beltW, 1.38, true);
  xBeltGeo.rotateY(-PI / 2);
  xBeltGeo.rotateX(PI / 2);
  var xBelt = mesh(xBeltGeo, mats.belt, false, true);
  xBelt.position.set(0, D.xBeltY, D.beltZ);
  G.add(xBelt);

  return G;
}

/* ==========================================================================
   THE HEAD

   A machined, bead-blasted aluminium slab: 77 across the cross rail, 105
   down the trough, 31 deep, with plan corners of R 13.5 and a very small,
   crisp break onto the top face - about 1.2 mm - which is exactly the almost
   sharp bezel it is described as having. It lies LENGTHWAYS along the LED
   strip: the nozzle at the spine end, the black disc a third of the way in
   from the front, and the umbilical boot on the front face.

   It straddles the cross rail through a channel in its underside and hangs
   only 3 mm above the deck. The brass nozzle points UP out of a recessed
   black well in one CORNER of the top face, its tip level with the
   surrounding aluminium: the M1 prints upside down, and the glass plate
   comes down to meet it.

   core/M1/core.cfg gives the module its own MCU, accelerometer and load
   cell, a filament switch, and an umbilical unlock button.
   ========================================================================== */
function buildHead(mats) {
  var G = new T.Group(); G.name = 'headAssembly';

  var pod = new T.Group(); pod.name = 'pod';
  var W = D.podW, L = D.podL, H = D.podH, pr = D.podR;
  var y0 = D.podBase, top = y0 + H, cy = y0 + H / 2;

  /* --- the body ---------------------------------------------------------- */
  var body = mesh(M1.loftRoundSquare([
    { y: y0,          h: W / 2 - 1.7, d: L / 2 - 1.7, r: pr - 1.7 },
    { y: y0 + 0.75,   h: W / 2 - 0.6, d: L / 2 - 0.6, r: pr - 0.6 },
    { y: y0 + 1.9,    h: W / 2,       d: L / 2,       r: pr },
    { y: top - 1.9,   h: W / 2,       d: L / 2,       r: pr },
    { y: top - 0.55,  h: W / 2 - 0.42, d: L / 2 - 0.42, r: pr - 0.42 },
    { y: top,         h: W / 2 - 1.2, d: L / 2 - 1.2, r: pr - 1.2 }
  ], 24, true, true, 0), mats.aluPod, true, true);
  pod.add(body);

  /* the channel in the underside, and the black carriage inside it */
  var slot = mesh(M1.rbox(W - 26, D.crossH + 5, D.crossW + 4.5, 1.2, 3), mats.anodBlackMatte, false, true);
  slot.position.set(0, D.crossY + 1, 0);
  pod.add(slot);
  var car = mesh(M1.rbox(34, D.crossH + 8, D.crossW + 9, 1.6, 3), mats.anodBlack, false, true);
  car.position.set(0, D.crossY, 0);
  pod.add(car);
  /* the belt clamps, where both runs terminate - on the upright loop the
     two strands sit one idler-diameter apart about the bar */
  [D.xBeltY + D.endIdlerR + 0.63, D.xBeltY - D.endIdlerR - 0.63].forEach(function (by) {
    var cl = mesh(M1.rbox(12, 4.4, D.beltW + 3, 1.0, 2), mats.aluPolish, false, true);
    cl.position.set(-W / 2 + 22, by, D.beltZ);
    pod.add(cl);
  });

  /* --- the nozzle well, in a corner of the top face ---------------------- */
  var wellX = -W / 2 + 18.2, wellZ = -L / 2 + 14.6;
  var wellLip = mesh(M1.rbox(22, 2.2, 20, 4.4, 4), mats.anodBlackMatte, false, true);
  wellLip.position.set(wellX, top - 0.9, wellZ);
  pod.add(wellLip);
  var wellFloor = mesh(M1.rbox(17, 0.8, 15, 3.0, 3), mats.dark, false, false);
  wellFloor.position.set(wellX, top - 4.4, wellZ);
  pod.add(wellFloor);

  var hb = mesh(M1.rbox(12, 8, 12, 1.4, 3), mats.hotEnd, false, true);
  hb.position.set(wellX, top - 2.6, wellZ);
  pod.add(hb);
  var glowMat = new T.MeshPhysicalMaterial({
    color: 0xb28a4a, emissive: 0xff9a30, emissiveIntensity: 0.10,
    metalness: 0.85, roughness: 0.30
  });
  var glow = mesh(new T.CylinderGeometry(4.6, 4.6, 1.0, 32), glowMat, false, false);
  glow.position.set(wellX, top - 0.3, wellZ);
  pod.add(glow);
  /* brass, 6 across the flats, tip essentially level with the top face */
  var noz = mesh(new T.CylinderGeometry(1.15, 3.1, 3.4, 28), mats.brass, false, true);
  noz.position.set(wellX, top + 0.9, wellZ);
  pod.add(noz);
  var tip = mesh(new T.CylinderGeometry(0.6, 1.15, 1.2, 20), mats.brass, false, false);
  tip.position.set(wellX, top + 3.1, wellZ);
  pod.add(tip);

  /* the champagne inset, immediately inboard of the well: 14 x 6 */
  var tab = mesh(M1.rbox(20, 1.0, 7.0, 1.8, 3), mats.ivoryLabel, false, false);
  tab.position.set(wellX + 1.5, top - 0.45, wellZ + 16);
  pod.add(tab);

  /* --- the black disc: a 22 insert in a 24 counterbore, domed at the centre */
  var discX = 0, discZ = L / 2 - 24.8;
  var disc = new T.Group();
  disc.position.set(discX, top, discZ);
  var cbore = mesh(new T.CylinderGeometry(10.05, 9.95, 0.7, 80), mats.dark, false, true);
  cbore.position.y = -0.25; disc.add(cbore);
  var insert = mesh(new T.CylinderGeometry(9.2, 9.2, 0.7, 80), mats.podDisc, false, true);
  insert.position.y = 0.06; disc.add(insert);
  /* This lens is lit almost entirely by SPECULAR, not by its own colour.
     Two measured points settle it: at albedo mean 21 it renders 0.346 of the
     backdrop and at mean 12.3 it renders 0.326 - a slope of 0.002 per unit,
     so the albedo is worth only about 0.03 of the total - while forcing the
     whole material to black takes it to 0.000.  The other 0.30 is the
     specular stack handing back a near-white studio.  c_head wants 0.203, so
     the stack scales to about 62 per cent and the colour hardly matters. */
  var domeMat = new T.MeshPhysicalMaterial({
    color: 0x0f1216, metalness: 0.0, roughness: 0.58,
    specularIntensity: 0.10,
    clearcoat: 0.05, clearcoatRoughness: 0.55, envMapIntensity: 0.071
  });
  /* barely crowned: in c_head the lens carries one soft sheen and no edge */
  var dome = mesh(new T.SphereGeometry(102.9, 72, 20, 0, TAU, 0, PI * 0.0312), domeMat, false, false);
  dome.position.y = 0.85 - 102.9; disc.add(dome);
  pod.add(disc);
  /* the little status button, low and outboard of the lens in c_head */
  var btn = mesh(new T.CylinderGeometry(1.7, 1.7, 0.6, 26), mats.dark, false, false);
  btn.position.set(discX + 8, top - 0.1, discZ + 12);
  pod.add(btn);

  /* the perforated vent. M1_cover puts it on the SIDE face below the nozzle
     window, not on the end face, which is why it never reads from above. */
  var gx = -W / 2 - 0.05;
  for (var gr = 0; gr < 4; gr++) {
    for (var gc = 0; gc < 5; gc++) {
      var gh = mesh(new T.CylinderGeometry(0.8, 0.8, 1.0, 12), mats.dark, false, false);
      gh.rotation.z = PI / 2;
      gh.position.set(gx, cy - 5 + gr * 3.1, -L / 2 + 16 + gc * 3.1);
      pod.add(gh);
    }
  }

  /* the round recessed port low on the side face, as in c_folded */
  var sport = mesh(new T.CylinderGeometry(3.9, 3.9, 1.2, 30), mats.dark, false, false);
  sport.rotation.z = PI / 2;
  sport.position.set(-W / 2 + 0.2, cy - 7.5, L / 2 - 26);
  pod.add(sport);
  var sring = mesh(new T.CylinderGeometry(5.2, 5.2, 0.8, 30), mats.aluPod, false, true);
  sring.rotation.z = PI / 2;
  sring.position.set(-W / 2 - 0.1, cy - 7.5, L / 2 - 26);
  pod.add(sring);

  /* the small dark hole, between the disc and the near edge */
  var hole = mesh(new T.CylinderGeometry(3.3, 3.3, 1.2, 32), mats.dark, false, false);
  hole.position.set(discX + 8, top - 0.75, discZ + 20);
  pod.add(hole);

  /* --- the umbilical boot ------------------------------------------------
     c_deck at 2x is the clearest view of it: one black moulding the width
     of half the end face (35 mm, centred 8-11 left of the pod's middle),
     its top tucked just under the top arris, standing about 15 proud of the
     end face and carried down past the bottom arris, where it necks round
     the hose.  The hose leaves through that neck forward and DOWN, not
     straight out of the face as it did: in c_deck and c_s1deck it drops
     away from the boot at once.  The pod rides 3 above the deck, so the
     moulding stops just short of it. */
  var bootX = -10, bootOut = 15;
  var bootTop = top - 0.6, bootBot = y0 - 2.6;
  var bootG = new T.Group();
  bootG.position.set(bootX, 0, L / 2);
  var bootBody = mesh(M1.rbox(35, bootTop - bootBot, bootOut + 2, 5.0, 5), mats.rubber, true, true);
  bootBody.position.set(0, (bootTop + bootBot) / 2, bootOut / 2 - 1);
  bootG.add(bootBody);
  /* the neck round the hose, leaning 50 degrees below level */
  var hDir = new T.Vector3(0, -0.77, 0.64).normalize();
  var mouth = new T.Vector3(0, y0 + 6.5, bootOut - 4.5);
  var neck = mesh(new T.CylinderGeometry(9.9, 9.6, 10, 40), mats.rubber, true, true);
  neck.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), hDir);
  neck.position.copy(mouth).addScaledVector(hDir, -2.5);
  bootG.add(neck);
  pod.add(bootG);
  bootG.updateMatrix();
  /* the hose starts inside the neck, so its open end is never seen */
  pod.userData.bootAnchor = mouth.clone().addScaledVector(hDir, -4).applyMatrix4(bootG.matrix);
  /* the direction the hose leaves the boot by, unit, pod space */
  pod.userData.bootDir = hDir;

  G.add(pod);
  G.userData.pod = pod;
  return G;
}

/* ==========================================================================
   THE MAST

   Every photograph shows the same three things standing on the back corner:
   a slim polished extrusion with a black linear rail down the face that looks
   at the bed, an exposed leadscrew beside it - fine pitch, bright steel, its
   threads clearly visible in h-03 and s1_1 - and a champagne anodised cap on
   the screw's top bearing. The column is bolted between two machined cheeks
   that carry the fold pivot, so the whole spine lies down onto the deck.
   ========================================================================== */
function buildMast(mats) {
  var G = new T.Group(); G.name = 'mast';
  var H = D.mastTop - D.hingeY;
  var lsX = D.lsX, W = D.mastW, Dp = D.mastD;
  var zf = Dp / 2;                    /* the column's bed-facing face */

  /* --- the clevis: two machined cheeks and the pivot --------------------- */
  var yoke = mesh(M1.rbox(W + 10, 15, 26, 2.8, 4), mats.aluMach, true, true);
  yoke.position.set(0, 6, 0);
  G.add(yoke);
  [-1, 1].forEach(function (sx) {
    var cheek = mesh(M1.rbox(5.5, 15, 26, 2.6, 4), mats.aluMach, true, true);
    cheek.position.set(sx * (W / 2 + 2.5), 6, 0);
    G.add(cheek);
    var boss = mesh(new T.CylinderGeometry(5.0, 5.0, 2.6, 36), mats.aluPolish, false, true);
    boss.rotation.z = PI / 2;
    boss.position.set(sx * (W / 2 + 3.2), 6, 0);
    G.add(boss);
    /* h-03: the pivot carries a BLACK knurled thumb knob on each cheek - the
       only dark parts on an otherwise all-silver clevis, and the fold
       release the audit went looking for. */
    var knob = new T.Group();
    knob.position.set(sx * (W / 2 + 4.6), 6, 0);
    knob.rotation.z = PI / 2;
    knob.add(mesh(new T.CylinderGeometry(4.0, 3.7, 3.4, 40), mats.anodBlackMatte, true, true));
    for (var kk = 0; kk < 28; kk++) {
      var kang = kk / 28 * TAU;
      var kr = mesh(new T.BoxGeometry(0.7, 3.6, 0.8), mats.anodBlackMatte, false, false);
      kr.position.set(Math.cos(kang) * 3.85, 0, Math.sin(kang) * 3.85);
      kr.rotation.y = -kang;
      knob.add(kr);
    }
    G.add(knob);
    var pin = mesh(new T.CylinderGeometry(1.7, 1.7, 1.6, 24), mats.steelRail, false, true);
    pin.rotation.z = PI / 2;
    pin.position.set(sx * (W / 2 + 6.6), 6, 0);
    G.add(pin);
  });

  /* --- the column -------------------------------------------------------- */
  var colH = H - 12;
  /* The column's face is CROWNED, and it has to be: s3_1 shows the blade
     carrying a strong gradient down and across it - 176.7 at the top against
     141.5 at the bottom, sd 39 - and a raycast says the render's face is a
     dead flat plane with normal (0,0,1).  A flat metal face samples ONE
     direction of the environment, so it renders one flat colour whatever its
     roughness: sweeping 0.20 down to 0.04 moved it by 0.2 of a level and the
     sd stayed at 3.  Only curvature can sweep the reflection. */
  var col = mesh(M1.rbox(W, colH, Dp, 5.5, 6), mats.mastBlade, true, true);
  col.position.set(0, 8 + colH / 2, 0);
  G.add(col);
  var nose = mesh(new T.CylinderGeometry(W / 2, W / 2, Dp, 40), mats.mastBlade, true, true);
  nose.rotation.x = PI / 2;
  nose.position.set(0, 8, 0);
  G.add(nose);
  /* the anodised cover down its back. Standing, it is the shadow behind the
     screw; folded, it is the dark blade lying across the deck in s3_1. */
  var back = mesh(M1.rbox(W - 6, colH - 12, 3.2, 1.2, 3), mats.mastBlade, true, true);
  back.position.set(0, 8 + colH / 2, -Dp / 2 - 0.9);
  G.add(back);

  /* the black anodised linear rail down the bed-facing face - the dark stripe
     that reads through the middle of the column in every three-quarter shot */
  var railW = 1.6, railX = -(W / 2 + 0.5);
  var rgeo = M1.railGeometry(colH - 14, railW, 3.0);
  rgeo.rotateX(-PI / 2);        /* the sweep now runs up the column */
  rgeo.rotateY(PI);             /* and the land turns to face the bed */
  var rail = mesh(rgeo, mats.anodBlackMatte, true, true);
  rail.position.set(railX, 8 + colH / 2, zf);
  G.add(rail);

  /* --- the leadscrew, standing free in front of the column --------------- */
  var lsZ = zf + 7.5;
  var lsTop = H - 16, lsBot = 14;
  var core = mesh(new T.CylinderGeometry(D.lsR - 0.95, D.lsR - 0.95, lsTop - lsBot, 26), mats.leadScrew, false, true);
  core.position.set(lsX, lsBot + (lsTop - lsBot) / 2, lsZ);
  G.add(core);
  /* four start, 4 mm of lead per turn per core.cfg, so the crests you can
     actually see are about 1.15 apart - which is what h-03 measures */
  /* 1.15 of pitch, which is what the source comment beside lsR always said
     h-03 read between crests - the geometry was built at 1.45.  The two
     screws autocorrelate at lag 16 (render) against 10 (photograph), and
     once the 1.20 diameter error is divided out that is 1.33 too coarse,
     which 1.45 -> 1.15 closes. */
  var thread = mesh(M1.threadGeometry(D.lsR, lsTop - lsBot, 1.15, 0.65, 13), mats.leadScrew, false, true);
  thread.position.set(lsX, lsBot, lsZ);
  G.add(thread);

  /* the lower bearing block, and the coupler and stepper below the deck */
  var lsFoot = mesh(M1.rbox(16, 12, 16, 2.6, 3), mats.aluMach, true, true);
  lsFoot.position.set(lsX, 12, lsZ);
  G.add(lsFoot);
  /* c_mast: a bright STEPPED collar, a wide turned flange with a narrower
     boss standing on it, both polished - not the dark ring it was */
  var brgOuter = mesh(new T.CylinderGeometry(8.0, 8.4, 6.2, 36), mats.aluPolish, false, true);
  brgOuter.position.set(lsX, 21.5, lsZ);
  G.add(brgOuter);
  var brgRace = mesh(new T.CylinderGeometry(8.5, 8.5, 1.0, 36), mats.steelDark, false, false);
  brgRace.position.set(lsX, 19.6, lsZ);
  G.add(brgRace);
  var collar = mesh(new T.CylinderGeometry(5.4, 5.8, 5.0, 32), mats.aluPolish, false, true);
  collar.position.set(lsX, 27.0, lsZ);
  G.add(collar);
  var cchamf = mesh(new T.CylinderGeometry(4.6, 5.4, 1.2, 32), mats.aluPolish, false, true);
  cchamf.position.set(lsX, 30.1, lsZ);
  G.add(cchamf);
  /* the brace tying the screw's foot back to the column */
  var brace = mesh(M1.rbox(Math.abs(lsX) + W / 2, 7, 8, 2.0, 3), mats.aluMach, true, true);
  brace.position.set(lsX / 2, 12, lsZ - 3);
  G.add(brace);

  /* --- the head: a polished cap over both, with the champagne bearing cover */
  /* s1_1 puts a soft chrome teardrop over the screw's top bearing, its top
     level with the blade and its nose overhanging the screw, with a black
     transition piece where it lands on the blade. It was a flat plate with
     a black box sitting on it. */
  /* h03 at full resolution: a COMPACT machined block, 23 across and 26 tall
     with a 5 mm break on its corners - an 11 mm radius on a 24 mm box turned
     it into a polished ball - and a champagne anodised plate lying over the
     whole of its crown, 20 by 24, which is the warm-neutral (R-B +6) cap the
     photographs all show. */
  var hood = mesh(M1.rbox(23, 26, Dp + 14, 5.5, 5), mats.aluMach, true, true);
  hood.position.set(lsX + 2, H - 13, lsZ - 4);
  G.add(hood);
  var wedge = mesh(M1.rbox(11, 22, Dp + 8, 2.6, 4), mats.anodBlackMatte, true, true);
  wedge.position.set(lsX + 17, H - 15, lsZ - 5.0);
  G.add(wedge);
  /* the champagne bearing cover, lying over the hood's crown */
  var hoodCap = mesh(M1.rbox(23, 5.0, Dp + 14, 5.5, 5), mats.anodChampagne, true, true);
  hoodCap.position.set(lsX + 2, H - 2.5, lsZ - 4);
  G.add(hoodCap);
  /* and the countersunk screw through the middle of it */
  var capScr = mesh(new T.CylinderGeometry(1.35, 1.35, 0.5, 26), mats.dark, false, false);
  capScr.position.set(lsX + 2, H + 0.5, lsZ - 4);
  G.add(capScr);

  /* --- the field spool ---------------------------------------------------
     Absent from the studio photography, but every in-use photograph in the
     evidence folder has a 1 kg spool hung off the back of the mast, so it is
     modelled here and left switchable. */
  var spool = new T.Group(); spool.name = 'spool';
  spool.position.set(0, H * 0.66, -38);
  var arm = mesh(M1.rbox(14, 34, 44, 3, 3), mats.anodBlack);
  arm.position.set(0, 0, 30);
  spool.add(arm);
  var axle = mesh(new T.CylinderGeometry(6.5, 6.5, 74, 28), mats.steelRail);
  axle.rotation.x = PI / 2;
  spool.add(axle);
  [-28, 28].forEach(function (dz) {
    var disc = mesh(new T.CylinderGeometry(92, 92, 4.2, 72), mats.cardboard);
    disc.rotation.x = PI / 2; disc.position.z = dz;
    spool.add(disc);
  });
  var hub = mesh(new T.CylinderGeometry(28, 28, 56, 48, 1, true), mats.cardboard);
  hub.rotation.x = PI / 2; spool.add(hub);
  var wound = mesh(new T.CylinderGeometry(79, 79, 50, 64), mats.filament);
  wound.rotation.x = PI / 2; spool.add(wound);
  var woundIn = mesh(new T.CylinderGeometry(30, 30, 50, 48, 1, true), mats.filament);
  woundIn.rotation.x = PI / 2; spool.add(woundIn);
  var nut = mesh(new T.CylinderGeometry(9, 9, 5, 28), mats.anodBlack);
  nut.rotation.x = PI / 2; nut.position.z = -37; spool.add(nut);
  G.add(spool);
  G.userData.spool = spool;

  return G;
}

/* ==========================================================================
   THE BED CARRIAGE

   A polished block clamped to the rail on the column's face, reaching
   forward over the leadscrew nut, with the branded clamp gripping the glass
   at the middle of its back edge - which, because the plate sits at 45
   degrees to the shell, is exactly over the spine corner.
   ========================================================================== */
function buildBed(mats, decals) {
  var G = new T.Group(); G.name = 'bed';
  var gt = D.glassT;
  var zf = D.mastD / 2, lsZ = zf + 7.5;

  /* the shoe on the linear rail */
  var shoe = mesh(M1.rbox(D.mastW - 4, 18, 9, 1.6, 3), mats.anodBlack, true, true);
  shoe.position.set(0, 11, zf + 3.4);
  G.add(shoe);

  /* the anodised nut housing bridging the rail and the screw.  s1_1 puts it
     at 55 x 40 px - 19 x 14 mm at the mast's 2.9 px/mm - with its top well
     BELOW the clamp's top plate (413 against 380), and it is black, not
     polished: the render's 26-tall aluMach block was reading as one white
     slab a third of the mast's height. */
  var housL = D.lsX - 10, housR = -D.mastW / 2;
  var body = mesh(M1.rbox(housR - housL, 14, 20, 2.2, 4), mats.anodBlack, true, true);
  body.position.set((housL + housR) / 2, 12, zf + 10);
  G.add(body);

  /* the nut riding the leadscrew, and the two chrome cap screws standing on
     the housing either side of it - the brightest thing in that corner of
     s1_1 and absent from the render entirely. */
  var nut = mesh(new T.CylinderGeometry(7.5, 7.5, 14, 34), mats.anodBlack, true, true);
  nut.position.set(D.lsX, 12, lsZ);
  G.add(nut);
  [-6.5, 6.5].forEach(function (dx) {
    var sc = capScrew(mats, 1.8, false);
    sc.position.set(D.lsX + dx, 19, zf + 9);
    G.add(sc);
  });


  /* the arm out to the plate */
  var arm = mesh(M1.rbox(30, 9, 26, 2.4, 3), mats.aluMach, true, true);
  arm.position.set(0, 7, zf + 22);
  G.add(arm);

  /* --- the branded clamp sitting on the plate ---------------------------- */
  var clampY = gt + 8;
  /* bed_exclude_area in the vendor machine profile is 38 x 27.7 centred on the
     plate's back edge - that rectangle is this block's footprint, so it sets
     both its size and where it sits. */
  var clampZ = D.clampZ - D.mastZ;
  var clamp = mesh(M1.rbox(D.clampW, 12.5, D.clampD, 2.2, 5), mats.aluPod, true, true);
  clamp.position.set(0, clampY, clampZ);
  G.add(clamp);
  /* the clamp's own top plate, over its back half, with the two cap screws.
     s1_1 has them 70 px apart - 24 mm at the mast's 2.9 px/mm. */
  var top = mesh(M1.rbox(D.clampW, 3.4, 15, 1.0, 3), mats.aluMach, true, true);
  top.position.set(0, clampY + 7.9, clampZ - 11);
  G.add(top);
  [-1, 1].forEach(function (sx) {
    var sc = capScrew(mats, 2.6, true);
    sc.position.set(sx * 12, clampY + 10.4, clampZ - 5.2);
    sc.rotation.x = PI / 2;
    G.add(sc);
  });

  var gasket = mesh(M1.rbox(D.clampW - 4, 2.2, D.clampD - 4, 2, 3), mats.rubber, false, true);
  gasket.position.set(0, gt + 1.1, clampZ);
  G.add(gasket);
  var cd = mesh(new T.PlaneGeometry(D.clampW - 3, (D.clampW - 3) / 3), mats.decal(decals.clamp, { roughness: 0.45, metalness: 0.3 }), false, false);
  cd.rotation.x = -PI / 2;
  cd.position.set(0, clampY + 8.06, clampZ);
  G.add(cd);

  /* the brass clip tab hooking the plate */
  var tab = mesh(M1.rbox(6, 13, 2.4, 1.0, 3), mats.brassDull, false, true);
  tab.position.set(0, gt - 4, clampZ + D.clampD / 2 + 15.5);
  G.add(tab);
  var slot = mesh(new T.BoxGeometry(2.1, 5.5, 0.8), mats.dark, false, false);
  slot.position.set(0, gt - 4.5, clampZ + D.clampD / 2 + 16.6);
  G.add(slot);

  /* --- the glass ---------------------------------------------------------- */
  var glassZ = D.glassZ - D.mastZ;   /* the bed group hangs off the mast */
  /* The plate is the vendor's own: the first component of M1_bed_model.stl,
     44 triangles, taken verbatim (see plateGeometry).  It used to be a
     squircle loft at n = 60, and that exponent is what cut the triangle out
     of it: the loop closes at t = 2 pi, where sin() returns -2.4e-16, and
     |sin|^(2/60) turns that rounding error into 0.30 - so the last rim point
     landed at z = -27 instead of 0 and the cap's fan never covered the wedge
     between the two.  On Overview that showed as a triangular bite out of
     the plate, centre to right-hand edge.  The STL's plate is a plain
     200 x 180 x 3.85 slab with 0.5 mm chamfers on every edge, so that is
     what this is now. */
  var glass = mesh(plateGeometry(false, 0), mats.glass, false, false);
  glass.position.set(-D.mastX, 0, glassZ);
  glass.name = 'glassPlate';
  glass.renderOrder = 2;
  G.add(glass);

  /* The tinted edge: the STL's own side faces and corner chamfers, pulled
     0.25 mm inside the glass.  The plate is seen nearly edge-on in every
     view, so the glass's own wall owns the silhouette and this shell is seen
     through it, which is what a green glass edge is anyway. */
  var rim = mesh(plateGeometry(true, 0.25), mats.glassEdge, false, false);
  rim.position.set(-D.mastX, 0, glassZ);
  rim.renderOrder = 3;
  G.add(rim);

  var gd = mesh(new T.PlaneGeometry(D.glassW - 1.2, D.glassD - 1.2), mats.decal(decals.glass, { unlit: true }), false, false);
  gd.rotation.x = -PI / 2;
  gd.position.set(-D.mastX, gt + 0.05, glassZ);
  gd.renderOrder = 4;
  G.add(gd);

  G.userData.glass = glass;
  G.userData.glassDecal = gd;
  G.userData.rim = rim;
  return G;
}

/* The glass plate, straight out of the vendor's M1_bed_model.stl: the file
   welds into two components and the first, 44 triangles, is the glass.
   STL (X, Y, Z) maps to the model as (X, Z + 3.85, Y): STL -Y is where the
   clamp bracket sits, which is the model's back (-z), and Z -3.85..0 is the
   thickness, so the plate's underside - the face the print hangs from - is
   y = 0 here.  The mapping is a mirror, so every face was re-wound to point
   away from the centre.  `sides` keeps only the 16 near-vertical faces (the
   four walls and the four corner chamfers) for the tinted edge, pulled
   `inset` mm toward the centre. */
var PLATE_V = [-100, 0.5, -89.5, -100, 0.5, 89.5, -100, 3.35, -89.5, -100, 3.35, 89.5, -99.5, 0, -89.5, -99.5, 0, 89.5, -99.5, 0.5, -90, -99.5, 0.5, 90, -99.5, 3.35, -90, -99.5, 3.35, 90, -99.5, 3.85, -89.5, -99.5, 3.85, 89.5, 99.5, 0, -89.5, 99.5, 0, 89.5, 99.5, 0.5, -90, 99.5, 0.5, 90, 99.5, 3.35, -90, 99.5, 3.35, 90, 99.5, 3.85, -89.5, 99.5, 3.85, 89.5, 100, 0.5, -89.5, 100, 0.5, 89.5, 100, 3.35, -89.5, 100, 3.35, 89.5];
var PLATE_F = [16, 18, 22, 22, 14, 16, 14, 22, 20, 6, 16, 14, 16, 6, 8, 20, 12, 14, 20, 23, 21, 23, 20, 22, 18, 23, 22, 23, 18, 19, 8, 18, 16, 18, 8, 10, 23, 19, 17, 10, 19, 18, 19, 10, 11, 8, 2, 10, 0, 8, 6, 8, 0, 2, 4, 14, 12, 14, 4, 6, 21, 12, 20, 12, 21, 13, 23, 15, 21, 15, 23, 17, 19, 9, 17, 9, 19, 11, 2, 11, 10, 11, 2, 3, 6, 4, 0, 4, 13, 5, 13, 4, 12, 21, 15, 13, 1, 2, 0, 2, 1, 3, 7, 17, 9, 17, 7, 15, 11, 3, 9, 1, 4, 5, 4, 1, 0, 15, 5, 13, 5, 15, 7, 1, 9, 3, 9, 1, 7, 5, 7, 1];
function plateGeometry(sides, inset) {
  var pos = [], f, k, ax, ay, az, bx, by, bz, cx, cy, cz, ny;
  function v(i) { return [PLATE_V[i * 3], PLATE_V[i * 3 + 1], PLATE_V[i * 3 + 2]]; }
  for (f = 0; f < PLATE_F.length; f += 3) {
    var a = v(PLATE_F[f]), b = v(PLATE_F[f + 1]), c = v(PLATE_F[f + 2]);
    ax = b[0] - a[0]; ay = b[1] - a[1]; az = b[2] - a[2];
    bx = c[0] - a[0]; by = c[1] - a[1]; bz = c[2] - a[2];
    ny = az * bx - ax * bz;
    var len = Math.hypot(ay * bz - az * by, ny, ax * by - ay * bx);
    if (sides && Math.abs(ny / len) > 0.2) continue;
    [a, b, c].forEach(function (p) {
      var s = inset ? 1 - inset / Math.max(Math.abs(p[0]), Math.abs(p[2])) : 1;
      pos.push(p[0] * s, p[1], p[2] * s);
    });
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/* ==========================================================================
   THE PRINT
   ========================================================================== */
/* s1_1 prints base-first onto the plate, so the vase hangs mouth-down and
   the LAST layer is the one at the nozzle - which is why the bottom of it
   is a blunt rounded ball about half the widest diameter, not a point. The
   old profile ran to 1.4 and gave a smooth cone. */
var PRINT_PROFILE = [
  [0.000, 17.4], [0.012, 21.3], [0.030, 23.4], [0.060, 24.2],
  [0.180, 24.1], [0.300, 23.4], [0.420, 23.1], [0.540, 23.3],
  [0.650, 22.8], [0.750, 18.0], [0.850, 12.8], [0.930, 9.4],
  [1.000, 7.2]
];

/* The silhouette is stepped at the real layer pitch - it is the single
   strongest cue that this is an FDM part and not a smooth solid - and the
   surface carries the spiral-vase facets s1_1 shows: broad soft ridges
   leaning about twenty degrees off vertical, which is a whole turn of lean
   over roughly seven ring spacings.  Two angular terms, a fine one at 24
   lobes and a coarse one at 6, both twisting with height. */
function printGeometry(H) {
  var pts = [], i, j;
  for (i = 0; i < PRINT_PROFILE.length; i++) {
    pts.push(new T.Vector2(PRINT_PROFILE[i][1], -PRINT_PROFILE[i][0] * H));
  }
  var curve = new T.SplineCurve(pts);
  var layer = 0.85;
  var n = Math.max(12, Math.min(320, Math.round(H / layer)));
  var seg = 128;
  var pos = [], nor = [], uv = [], idx = [];

  function radius(u, th) {
    var p = curve.getPoint(u).x;
    /* the layer terrace - the silhouette has to step, not slide */
    p *= 1 + 0.0034 * Math.sin(u * n * TAU);
    var lean = 0.146 * TAU;                    /* 24-lobe ridges lean this far */
    p *= 1 + 0.0045 * Math.cos(30 * (th + lean * u));
    p *= 1 + 0.0065 * Math.cos(6 * (th + 2.4 * lean * u) + 0.7);
    return Math.max(0.3, p);
  }
  /* both ends closed at the axis so it is a solid, not a shell */
  for (i = 0; i <= n; i++) {
    var u = i / n, y = -u * H;
    for (j = 0; j <= seg; j++) {
      var th = (j / seg) * TAU, r = radius(u, th);
      pos.push(r * Math.sin(th), y, r * Math.cos(th));
      uv.push(j / seg, 1 - u);
    }
  }
  var capT = pos.length / 3, capB;
  pos.push(0, 0, 0); uv.push(0.5, 1);
  capB = pos.length / 3;
  pos.push(0, -H, 0); uv.push(0.5, 0);
  for (i = 0; i < n; i++) {
    for (j = 0; j < seg; j++) {
      var a = i * (seg + 1) + j, b = a + seg + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  for (j = 0; j < seg; j++) {
    idx.push(capT, j, j + 1);                                  /* plate end */
    var o = n * (seg + 1);
    idx.push(capB, o + j + 1, o + j);                          /* nozzle end */
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildPrint(mats) {
  var o = mesh(printGeometry(76), mats.pla);
  o.name = 'print';
  return o;
}

/* ==========================================================================
   THE CONDUIT

   The umbilical is a corrugated hose of FIXED length clamped at both ends:
   the boot on the pod and the boot in the base's front-left wall. Between
   them it makes one smooth bend - down out of each boot and round in a
   single U lying out on the table in front of the machine (s1_1, s3_1,
   s5_1, c_deck, s7_1).

   It used to be a tube swept along an eight-point Catmull-Rom with Frenet
   frames. The spline wandered (the "all twisted around" Jack saw), and
   Frenet frames flip wherever the curvature passes through zero, which
   spun the rib pattern round the hose; and the whole 144k-triangle sweep
   was rebuilt every time the head moved.

   Now:
   - the path is a cubic Bezier between the two boot mouths, leaving each
     along its boot's own axis, with the arm length solved so the hose keeps
     its one length; it is held on the table and out of the base;
   - its frames are rotation-minimising (double reflection), so nothing
     twists;
   - the hose is ONE static mesh, laid out straight and bent onto the path
     in the vertex shader from a 128-frame float texture, so a pose change
     uploads 6 KB instead of rebuilding a mesh, and the ribs stay joined
     however tight the bend (instanced rigid ribs opened gaps on the
     outside of the U).
   ========================================================================== */
var HOSE = {
  /* OD 16.6. Measured in s1_1 across both legs (59 and 60 px at about
     3.6 px/mm where they stand, in front of the plate's registration) and in
     c_deck at the base boot; the old 13.6 was a size thinner than either. */
  r0: 8.3,
  amp: 1.9,            /* convolution depth, crest to groove */
  P: 3.6,              /* pitch of the single-start helix: c_deck counts the
                          ribs at 3.6-3.8 mm right at the base boot */
  radial: 24,
  /* boot mouth to boot mouth. Set so the U lies where s1_1 and s3_1 put it
     with the head where those photographs put it. */
  L: 380
};

/* The straight hose: ribs laid end to end along +z, which is arc length.
   Its rows follow the helix (see above), so the narrow groove is sampled in
   every column with nine rows a period; normals are analytic.  The vertex
   shader (bendHose) carries each vertex out along the path. */
function hoseGeometry(nRibs) {
  var P = HOSE.P, R0 = HOSE.r0, A = HOSE.amp, RAD = HOSE.radial, c = P / TAU;
  var W = [0.22, 0.38, 0.46, 0.5, 0.54, 0.62, 0.78, 1.0];     /* valley at 0.5 */
  var rows = 1 + nRibs * W.length;
  var pos = new Float32Array(rows * (RAD + 1) * 3), nor = new Float32Array(rows * (RAD + 1) * 3);
  var col = new Float32Array(rows * (RAD + 1) * 3), idx = [];
  var k = 0, q, j, o = 0;
  function row(ww) {
    var ph = (ww / P) * TAU;
    var u = Math.max(1e-3, 0.5 * (1 + Math.cos(ph)));
    var R = R0 - A * (1 - Math.pow(u, 0.30));
    var dR = A * 0.30 * Math.pow(u, -0.70) * (-0.5 * Math.sin(ph) * TAU / P);
    /* the baked occlusion: this renderer has no AO, and the groove floor of
       a convoluted hose sees perhaps a third of the sky (s1_1 runs 16 to 238
       along the hose's own axis) */
    var ao = 0.08 + 0.92 * Math.pow(u, 0.85);
    for (j = 0; j <= RAD; j++) {
      var v = j / RAD * TAU, cv = Math.cos(v), sv = Math.sin(v);
      /* +P so the first rib's helical cut starts at s >= 0 */
      pos[o] = R * cv; pos[o + 1] = R * sv; pos[o + 2] = ww - c * v + P;
      var nx = R * cv + c * dR * sv, ny = R * sv - c * dR * cv, nz = -R * dR;
      var nl = Math.hypot(nx, ny, nz);
      nor[o] = nx / nl; nor[o + 1] = ny / nl; nor[o + 2] = nz / nl;
      col[o] = col[o + 1] = col[o + 2] = ao;
      o += 3;
    }
  }
  row(0);
  for (q = 0; q < nRibs; q++) for (k = 0; k < W.length; k++) row((q + W[k]) * P);
  var rowN = RAD + 1;
  for (k = 0; k < rows - 1; k++) for (j = 0; j < RAD; j++) {
    var a = k * rowN + j, b = a + 1, cc = a + rowN, d = cc + 1;
    idx.push(a, b, cc, b, d, cc);
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.BufferAttribute(nor, 3));
  g.setAttribute('color', new T.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.userData.trisPerRib = W.length * RAD * 2;
  return g;
}

/* GLSL: the path is a texture of M frames at even arc-length steps, three
   texels each (position, tangent, normal); a vertex at local (x, y, s) goes
   to P(s) + x N(s) + y B(s), interpolated between the two frames round s. */
var HOSE_GLSL = [
  'uniform sampler2D hoseFrames;',
  'uniform float hoseStep;',
  'uniform float hoseLen;',
  'uniform float hoseLast;',
  'void hoseFrame(float s, out vec3 P, out mat3 R) {',
  '  float f = clamp(s, 0.0, hoseLen) / hoseStep;',
  '  float j0 = min(floor(f), hoseLast - 1.0);',
  '  float t = clamp(f - j0, 0.0, 1.0);',
  '  int a = int(j0), b = a + 1;',
  '  P = mix(texelFetch(hoseFrames, ivec2(0, a), 0).xyz, texelFetch(hoseFrames, ivec2(0, b), 0).xyz, t);',
  '  vec3 Tg = normalize(mix(texelFetch(hoseFrames, ivec2(1, a), 0).xyz, texelFetch(hoseFrames, ivec2(1, b), 0).xyz, t));',
  '  vec3 Nm = mix(texelFetch(hoseFrames, ivec2(2, a), 0).xyz, texelFetch(hoseFrames, ivec2(2, b), 0).xyz, t);',
  '  Nm = normalize(Nm - dot(Nm, Tg) * Tg);',
  '  R = mat3(Nm, cross(Tg, Nm), Tg);',
  '}'
].join('\n');

function bendHose(shader, frames) {
  shader.uniforms.hoseFrames = frames.uniforms.hoseFrames;
  shader.uniforms.hoseStep = frames.uniforms.hoseStep;
  shader.uniforms.hoseLen = frames.uniforms.hoseLen;
  shader.uniforms.hoseLast = frames.uniforms.hoseLast;
  var vs = shader.vertexShader.replace('#include <common>', '#include <common>\n' + HOSE_GLSL);
  /* each chunk computes its own frame: the depth shader has the normal
     chunk only inside an #ifdef, so nothing can be shared between them */
  vs = vs.replace('#include <beginnormal_vertex>',
    'vec3 hosePn; mat3 hoseRn; hoseFrame(position.z, hosePn, hoseRn);\n' +
    'vec3 objectNormal = hoseRn * normal;\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3( tangent.xyz );\n#endif');
  vs = vs.replace('#include <begin_vertex>',
    'vec3 hoseP; mat3 hoseR; hoseFrame(position.z, hoseP, hoseR);\n' +
    'vec3 transformed = hoseP + hoseR * vec3(position.xy, 0.0);');
  shader.vertexShader = vs;
}

/* The hose and its solver.  update(A, dA, B, dB) takes the two mouths (root
   space) and the unit direction the hose leaves each one by, solves the
   path, and writes its frames into a small float texture.  Nothing here
   allocates after construction. */
function buildConduit(mats) {
  var K = 64;                                   /* path samples for the solve */
  var M = 128;                                  /* frames handed to the shader */
  var nRibs = Math.ceil(HOSE.L / HOSE.P) + 2;
  var geo = hoseGeometry(nRibs);
  var data = new Float32Array(3 * M * 4);
  var tex = new T.DataTexture(data, 3, M, T.RGBAFormat, T.FloatType);
  tex.minFilter = tex.magFilter = T.NearestFilter;
  tex.needsUpdate = true;
  var frames = { uniforms: {
    hoseFrames: { value: tex }, hoseStep: { value: 1 }, hoseLen: { value: 1 }, hoseLast: { value: M - 1 }
  } };
  var mat = mats.conduit;
  mat.onBeforeCompile = function (sh) { bendHose(sh, frames); };
  mat.customProgramCacheKey = function () { return 'm1-hose'; };
  /* kept on the material so a viewer that disposes every texture it finds
     on its materials disposes this one too */
  mat.hoseFrames = tex;
  var depth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking });
  depth.onBeforeCompile = function (sh) { bendHose(sh, frames); };
  depth.customProgramCacheKey = function () { return 'm1-hose-depth'; };
  depth.hoseFrames = tex;

  var hose = new T.Mesh(geo, mat);
  hose.name = 'conduit';
  hose.castShadow = true; hose.receiveShadow = true;
  hose.customDepthMaterial = depth;
  /* The straight geometry is not where the hose is: it is never culled and
     not pickable, and its box is set to the BENT hose below, so a viewer
     fitting its camera to geometry boxes still frames it. */
  hose.frustumCulled = false;
  hose.raycast = function () {};
  geo.boundingBox = new T.Box3();
  geo.boundingSphere = new T.Sphere();

  var px = new Float64Array(K + 1), py = new Float64Array(K + 1), pz = new Float64Array(K + 1);
  var qx = new Float64Array(K + 1), qy = new Float64Array(K + 1), qz = new Float64Array(K + 1);
  var cum = new Float64Array(K + 1);
  var tx = new Float64Array(K + 1), ty = new Float64Array(K + 1), tz = new Float64Array(K + 1);
  var nx = new Float64Array(K + 1), ny = new Float64Array(K + 1), nz = new Float64Array(K + 1);
  var R = D.hs * Math.SQRT2;                    /* |x| + |z| = R is the wall */
  var r = HOSE.r0;
  var a0x, a0y, a0z, a1x, a1y, a1z, b1x, b1y, b1z, b0x, b0y, b0z;

  /* keep a point on the table and out of the shell */
  function hold(i) {
    var y = py[i];
    /* the table: a soft floor, so the hose settles onto it rather than
       folding at it */
    var e = (y - r) / 8;
    y = r + (e > 20 ? e : Math.log(1 + Math.exp(e))) * 8;
    var ax = Math.abs(px[i]), az = Math.abs(pz[i]);
    var inside = (R + r + 1) - (ax + az);
    if (inside > 0 && y < D.deckY + r) {
      /* out of the casting by the shorter way - up onto the deck or out
         through the wall - blended across the switch so the path never
         jumps from one to the other, which is what put waves in it */
      var lift = D.deckY + r - y, push = inside / Math.SQRT2;
      var w = M1.smooth((lift - push) / 6 + 0.5);
      y += lift * (1 - w);
      px[i] += (px[i] < 0 ? -1 : 1) * w * push / Math.SQRT2;
      pz[i] += (pz[i] < 0 ? -1 : 1) * w * push / Math.SQRT2;
    }
    py[i] = y;
  }

  /* the path for one arm length; returns its length */
  function trace(arm) {
    var i, t, s, b0, b1, b2, b3;
    var c1x = a0x + a1x * arm, c1y = a0y + a1y * arm, c1z = a0z + a1z * arm;
    var c2x = b0x + b1x * arm, c2y = b0y + b1y * arm, c2z = b0z + b1z * arm;
    for (i = 0; i <= K; i++) {
      t = i / K; s = 1 - t;
      b0 = s * s * s; b1 = 3 * s * s * t; b2 = 3 * s * t * t; b3 = t * t * t;
      px[i] = b0 * a0x + b1 * c1x + b2 * c2x + b3 * b0x;
      py[i] = b0 * a0y + b1 * c1y + b2 * c2y + b3 * b0y;
      pz[i] = b0 * a0z + b1 * c1z + b2 * c2z + b3 * b0z;
    }
    /* constrain, then relax so a held point does not leave a kink; the two
       samples at each end stay put, which keeps both boot axes */
    for (var pass = 0; pass < 4; pass++) {
      for (i = 2; i <= K - 2; i++) hold(i);
      if (pass === 3) break;
      for (i = 0; i <= K; i++) { qx[i] = px[i]; qy[i] = py[i]; qz[i] = pz[i]; }
      for (i = 2; i <= K - 2; i++) {
        px[i] = 0.25 * qx[i - 1] + 0.5 * qx[i] + 0.25 * qx[i + 1];
        py[i] = 0.25 * qy[i - 1] + 0.5 * qy[i] + 0.25 * qy[i + 1];
        pz[i] = 0.25 * qz[i - 1] + 0.5 * qz[i] + 0.25 * qz[i + 1];
      }
    }
    cum[0] = 0;
    for (i = 1; i <= K; i++) cum[i] = cum[i - 1] + Math.hypot(px[i] - px[i - 1], py[i] - py[i - 1], pz[i] - pz[i - 1]);
    return cum[K];
  }

  var last = [NaN, NaN, NaN, NaN, NaN, NaN];
  var box = geo.boundingBox;
  var trisPerRib = geo.userData.trisPerRib;

  /* The arm length is found by secant steps from the last pose's, which
     a moving head barely changes (two or three traces), falling back to
     bisection when that does not settle. */
  var lastArm = 120;
  function solveArm() {
    var x0 = lastArm, f0 = trace(x0) - HOSE.L;
    if (Math.abs(f0) < 0.3) return x0;
    var x1 = x0 * (f0 < 0 ? 1.08 : 0.92), f1 = trace(x1) - HOSE.L, k;
    for (k = 0; k < 6 && Math.abs(f1) >= 0.3; k++) {
      if (Math.abs(f1 - f0) < 1e-6) break;
      var x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
      if (!(x2 > 2 && x2 < 900)) break;
      x0 = x1; f0 = f1; x1 = x2; f1 = trace(x1) - HOSE.L;
    }
    if (Math.abs(f1) < 0.3) return (lastArm = x1);
    var lo = 2, hi = 900;
    if (trace(hi) < HOSE.L) return (lastArm = hi);
    for (k = 0; k < 18; k++) {
      var mid = 0.5 * (lo + hi);
      if (trace(mid) < HOSE.L) lo = mid; else hi = mid;
    }
    return (lastArm = lo);
  }

  function update(A, dA, B, dB) {
    if (Math.abs(A.x - last[0]) < 0.02 && Math.abs(A.y - last[1]) < 0.02 && Math.abs(A.z - last[2]) < 0.02 &&
        Math.abs(B.x - last[3]) < 0.02 && Math.abs(B.y - last[4]) < 0.02 && Math.abs(B.z - last[5]) < 0.02) return;
    last[0] = A.x; last[1] = A.y; last[2] = A.z; last[3] = B.x; last[4] = B.y; last[5] = B.z;
    a0x = A.x; a0y = A.y; a0z = A.z; a1x = dA.x; a1y = dA.y; a1z = dA.z;
    b0x = B.x; b0y = B.y; b0z = B.z; b1x = dB.x; b1y = dB.y; b1z = dB.z;

    /* the arm length that gives the hose its own length: the U grows out
       across the table as the two ends come together */
    var i, len, arm = solveArm();
    len = trace(arm);

    /* unit tangents, then rotation-minimising frames by double reflection
       (Wang et al. 2008): no flips, no twist */
    for (i = 0; i <= K; i++) {
      var i0 = i > 0 ? i - 1 : 0, i1 = i < K ? i + 1 : K;
      var dx = px[i1] - px[i0], dy = py[i1] - py[i0], dz = pz[i1] - pz[i0];
      var dl = Math.hypot(dx, dy, dz) || 1;
      tx[i] = dx / dl; ty[i] = dy / dl; tz[i] = dz / dl;
    }
    /* start square to X, so the rib pattern starts the same way whatever
       the pose */
    var sx = 1 - tx[0] * tx[0], sy = -tx[0] * ty[0], sz = -tx[0] * tz[0];
    var sl = Math.hypot(sx, sy, sz) || 1;
    nx[0] = sx / sl; ny[0] = sy / sl; nz[0] = sz / sl;
    for (i = 0; i < K; i++) {
      var v1x = px[i + 1] - px[i], v1y = py[i + 1] - py[i], v1z = pz[i + 1] - pz[i];
      var c1 = v1x * v1x + v1y * v1y + v1z * v1z;
      if (c1 < 1e-12) { nx[i + 1] = nx[i]; ny[i + 1] = ny[i]; nz[i + 1] = nz[i]; continue; }
      var k1 = 2 / c1 * (v1x * nx[i] + v1y * ny[i] + v1z * nz[i]);
      var rLx = nx[i] - k1 * v1x, rLy = ny[i] - k1 * v1y, rLz = nz[i] - k1 * v1z;
      var k2 = 2 / c1 * (v1x * tx[i] + v1y * ty[i] + v1z * tz[i]);
      var tLx = tx[i] - k2 * v1x, tLy = ty[i] - k2 * v1y, tLz = tz[i] - k2 * v1z;
      var v2x = tx[i + 1] - tLx, v2y = ty[i + 1] - tLy, v2z = tz[i + 1] - tLz;
      var c2 = v2x * v2x + v2y * v2y + v2z * v2z;
      var k3 = c2 < 1e-12 ? 0 : 2 / c2 * (v2x * rLx + v2y * rLy + v2z * rLz);
      nx[i + 1] = rLx - k3 * v2x; ny[i + 1] = rLy - k3 * v2y; nz[i + 1] = rLz - k3 * v2z;
    }

    /* resample at even arc-length steps for the shader */
    var step = len / (M - 1), seg = 0;
    box.makeEmpty();
    for (var q = 0; q < M; q++) {
      var s = q * step;
      while (seg < K - 1 && cum[seg + 1] < s) seg++;
      var span = cum[seg + 1] - cum[seg], f = span > 1e-9 ? (s - cum[seg]) / span : 0;
      if (f > 1) f = 1;
      var X = px[seg] + (px[seg + 1] - px[seg]) * f;
      var Y = py[seg] + (py[seg + 1] - py[seg]) * f;
      var Z = pz[seg] + (pz[seg + 1] - pz[seg]) * f;
      var o = q * 12;
      data[o] = X; data[o + 1] = Y; data[o + 2] = Z; data[o + 3] = 1;
      data[o + 4] = tx[seg] + (tx[seg + 1] - tx[seg]) * f;
      data[o + 5] = ty[seg] + (ty[seg + 1] - ty[seg]) * f;
      data[o + 6] = tz[seg] + (tz[seg + 1] - tz[seg]) * f; data[o + 7] = 0;
      data[o + 8] = nx[seg] + (nx[seg + 1] - nx[seg]) * f;
      data[o + 9] = ny[seg] + (ny[seg + 1] - ny[seg]) * f;
      data[o + 10] = nz[seg] + (nz[seg + 1] - nz[seg]) * f; data[o + 11] = 0;
      if (X - r < box.min.x) box.min.x = X - r; if (X + r > box.max.x) box.max.x = X + r;
      if (Y - r < box.min.y) box.min.y = Y - r; if (Y + r > box.max.y) box.max.y = Y + r;
      if (Z - r < box.min.z) box.min.z = Z - r; if (Z + r > box.max.z) box.max.z = Z + r;
    }
    tex.needsUpdate = true;
    frames.uniforms.hoseStep.value = step;
    frames.uniforms.hoseLen.value = len;
    /* draw only the ribs the hose has (+1 for the offset start); the rest
       would collapse onto the far end, inside the boot */
    geo.setDrawRange(0, Math.min(nRibs, Math.ceil(len / HOSE.P) + 1) * trisPerRib * 3);
    box.getBoundingSphere(geo.boundingSphere);
    hose.userData.length = len;
  }

  hose.userData.update = update;
  return hose;
}

/* ==========================================================================
   ASSEMBLY
   ========================================================================== */
M1.build = function (mats) {
  var decals = {
    glass: M1.glassDecal(2048),
    deck: M1.deckDecal(1024),
    clamp: M1.clampDecal(1024),
    screen: M1.screenCanvas(512, null)
  };

  var root = new T.Group(); root.name = 'M1';

  var base = buildBase(mats, decals);
  root.add(base);
  var gantry = buildGantry(mats);
  root.add(gantry);

  /* the block in the groove carries the cross rail, and the head rides that */
  var yCarriage = buildCarriage(mats);
  var beamGroup = buildHead(mats);
  yCarriage.add(beamGroup);
  root.add(yCarriage);

  var conduit = buildConduit(mats);
  root.add(conduit);

  /* the mast folds about its hinge */
  /* the mast yaws as it folds so it lies down the base diagonal - a 250 mm
     column will not fit across a 232 mm square, but the 328 mm diagonal
     takes it, which is what the machined channel in the deck is for */
  var mastYaw = new T.Group(); mastYaw.name = 'mastYaw';
  mastYaw.position.set(D.mastX, D.hingeY, D.mastZ);
  var mastPivot = new T.Group(); mastPivot.name = 'mastPivot';
  var mastParts = buildMast(mats);
  mastParts.position.z = D.mastOffZ;
  mastPivot.add(mastParts);
  mastYaw.add(mastPivot);
  root.add(mastYaw);

  var bedLift = new T.Group(); bedLift.name = 'bedLift';
  var bed = buildBed(mats, decals);
  bedLift.add(bed);
  mastPivot.add(bedLift);

  /* The plate's own frame, for drawing what is printed on it, in the
     printer's millimetres: origin at the plate's front-left corner on its
     UNDERSIDE (the face the M1 prints onto - it prints upside down), +x to
     the right along its 200, +y back along its 180, +z down, away from the
     plate, the way a print grows.  So Klipper's (X, Y, Z) drops straight in
     with Y measured from the front edge; it moves with the bed. */
  var plateFrame = new T.Group(); plateFrame.name = 'plateFrame';
  plateFrame.matrixAutoUpdate = false;
  plateFrame.matrix.set(
    1, 0, 0, -D.mastX - D.glassW / 2,
    0, 0, -1, 0,
    0, -1, 0, (D.glassZ - D.mastZ) + D.glassD / 2,
    0, 0, 0, 1);
  bed.add(plateFrame);

  var print = buildPrint(mats);
  var printHolder = new T.Group();
  printHolder.add(print);
  bedLift.add(printHolder);

  root.userData = {
    base: base, beamGroup: beamGroup, yCarriage: yCarriage,
    pod: beamGroup.userData.pod, mastPivot: mastPivot, mastYaw: mastYaw,
    bedLift: bedLift, bed: bed, print: print, printHolder: printHolder,
    plateFrame: plateFrame, plateSize: { x: D.glassW, y: D.glassD, t: D.glassT }, gantry: gantry,
    conduit: conduit, decals: decals, mats: mats, spool: mastParts.userData.spool,
    display: base.userData.display, screenMesh: base.userData.screenMesh
  };

  /* `led` is per PHOTOGRAPH, not a style: s7_1 shows the rose climbing the
     trough's silver side walls, and s3_1 shows the same trough with not one
     pixel above R-G 10 anywhere in it - max 10 across the whole channel,
     against 11.8 per cent of the render's pixels over that and a peak of 68.
     So the chamber strip is simply off in the product shot, and a render that
     forces it on cannot match. */
  /* Every field is documented in STATE.md. */
  var state = {
    z: 0.42, fold: 0, headX: 0.34, headZ: 0.55, showPrint: true, showSpool: false,
    led: true, progress: 41,
    /* the LEDs: one colour for every pixel (m_led.cfg's 'ready' base layer),
       or Klipper's color_data per chain */
    ledColor: [0.4, 0.3, 0.2], ledLeft: null, ledRight: null,
    /* the panel's Home screen */
    status: 'idle', nozzleTemp: 24, nozzleTarget: 0, bedTemp: 23, bedTarget: 0,
    jobName: '', connected: true
  };
  root.userData.state = state;

  var hoseA = new T.Vector3();

  /* the round panel: MuonUI's new Home screen, live (02-materials.js) */
  var pc = {};
  var panelTex = root.userData.screenMesh.material.map;
  function redrawPanel() {
    M1.drawPanel(decals.screen, M1.panelView(state));
    panelTex.needsUpdate = true;
    root.userData.panelDraws = (root.userData.panelDraws || 0) + 1;
  }
  /* Krona One may still be loading when the first face is drawn; draw once
     more when it arrives, so the label is in the right face */
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { redrawPanel(); });
  }

  root.userData.apply = function () {
    mastPivot.rotation.x = state.fold * (PI / 2 - 0.05);
    /* No yaw. The spine stands on the back corner and the LED channel runs
       corner to corner, so a 246 mm column lies straight down the 268 mm
       diagonal - it never has to cross the square. */
    mastYaw.rotation.y = 0;

    var lift = 26 + state.z * D.bedTravel;      /* plate underside above the hinge */
    bedLift.position.set(0, lift, 0);
    bedLift.visible = state.fold < 0.02;
    base.userData.setLeds(state.led !== false && state.fold < 0.5, state.ledColor, state.ledLeft, state.ledRight);
    mastParts.userData.spool.visible = state.showSpool;

    var hx = state.headX * D.travelX;
    var hz = state.headZ * D.travelZ;
    yCarriage.position.set(0, 0, hz);          /* the block, down the LED rail */
    gantry.userData.updateStrands(hz);         /* the central belts follow it */
    beamGroup.userData.pod.position.set(hx, 0, 0);   /* the head, along the cross rail */

    /* the print hangs off the plate directly above the nozzle */
    /* the nozzle well is in a CORNER of the top face - 20 in from the rail
       side, 16 in from the spine end - so the part hangs off-centre */
    var nozWorldX = hx - D.podW / 2 + 20, nozWorldZ = hz - D.podL / 2 + 16;
    printHolder.position.set(nozWorldX, 0, nozWorldZ - D.mastZ);
    print.visible = state.showPrint && state.fold < 0.02;
    /* the demo print is rebuilt to fill the gap, so only while it shows:
       with it hidden (as Fluidd keeps it) a moving bed costs nothing */
    var gap = M1.clamp((D.hingeY + lift) - D.nozzleY + D.printSink, 6, 180);
    if (print.visible && Math.abs((root.userData._gap || 0) - gap) > 1.5) {
      root.userData._gap = gap;
      var og = print.geometry;
      print.geometry = printGeometry(gap);
      if (og) og.dispose();
    }

    /* the conduit follows the head.  The pod only ever translates (by hx
       along the bar, hz down the trough), so its boot's mouth is its local
       anchor plus that offset - no matrix walk needed every frame. */
    var podU = beamGroup.userData.pod.userData;
    hoseA.set(podU.bootAnchor.x + hx, podU.bootAnchor.y, podU.bootAnchor.z + hz);
    conduit.userData.update(hoseA, podU.bootDir, base.userData.socketAnchor, base.userData.socketDir);

    /* the panel redraws only when something it shows has changed */
    if (state.status !== pc.status || Math.round(state.progress) !== pc.progress ||
        Math.round(state.nozzleTemp) !== pc.heC || Math.round(state.nozzleTarget) !== pc.heT ||
        Math.round(state.bedTemp) !== pc.bedC || Math.round(state.bedTarget) !== pc.bedT ||
        state.jobName !== pc.job || state.connected !== pc.connected) {
      pc.status = state.status; pc.progress = Math.round(state.progress);
      pc.heC = Math.round(state.nozzleTemp); pc.heT = Math.round(state.nozzleTarget);
      pc.bedC = Math.round(state.bedTemp); pc.bedT = Math.round(state.bedTarget);
      pc.job = state.jobName; pc.connected = state.connected;
      redrawPanel();
    }
  };

  root.userData.apply();
  return root;
};

})(window);
