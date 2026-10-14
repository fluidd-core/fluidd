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
  bootPlan: 0.505      /* how far along the front-left wall the hose's cuff
                          sits, 0 at the front corner's arc and 1 at the
                          left's: about the middle.  At 0.62 the cuff's left
                          edge stood 38 px left of the photograph's in s1_1
                          and 34 px in s3_1, at the fitted cameras; 16 mm
                          nearer the front corner closes both to 5 px */
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

  /* --- the umbilical cuff, in the front-left wall --------------------------
     s1_1, s3_1 and s5_1 at 4-5x, and s9_7: a round black rubber cuff about
     1.35 hose diameters across (22), standing upright in a pocket in the
     wall - the pocket's edge shows as a thin dark band round its top and
     its left side - flat on top, and tapering a little to its mouth.  Its
     sides image as a true vertical does there (s1_1: 8 degrees against the
     lens's own 6, s3_1: 3 against 3.5), but its mouth is cut on a slant:
     in all four the rubber reaches lower on its left-corner side than on
     its right, where a level rim would image 16-18 px HIGHER on the left
     at these cameras.  So the mouth opens down and a little towards the
     front corner, and the hose leaves it bending that way (s3_1, s5_1).
     Its top stands about 3.5 under the deck and its mouth about 29 above
     the table (the fitted cameras put its top at 55 in s1_1 and 58 in
     s3_1), so the hose drops straight out of it for a little way and then
     turns for the table.  It was a sleeve with a half-dome on top and a
     block behind it as wide again, cut square and aimed straight down,
     and it stood 16 mm too far towards the left corner (see D.bootPlan). */
  var sock = new T.Group(); sock.name = 'umbilicalSocket';
  var sp = wallPoint(-1, 1, D.bootPlan);
  sock.position.set(sp.x, 0, sp.z);
  sock.rotation.y = -PI / 4;     /* local +z is the wall's outward normal, +x runs towards the front corner */
  var cuffZ = 11.2, cuffMouth = 29, cuffTop = 54.4, cuffSlant = 28 * PI / 180;
  sock.add(mesh(cuffGeometry(cuffZ, cuffMouth, cuffSlant, cuffTop), mats.rubber, true, true));
  /* the hose leaves the slanted mouth leaning a little towards the front
     corner, off the long lip: 6 degrees fits s1_1 and s3_1 best together
     (s3_1 alone wants 15, s1_1 alone 5) */
  var sDir = new T.Vector3(Math.sin(6 * PI / 180), -Math.cos(6 * PI / 180), 0);
  var mouthL = new T.Vector3(0, cuffMouth, cuffZ);
  /* the pocket it stands in: the shell is one loft, so the pocket is a dark
     face on the wall.  The cameras stand on the front corner's side of the
     wall's normal, so the cuff, 11 out from the wall, covers wall to its
     left (5 mm in s1_1, 7 in s3_1); the pocket is set 8 towards the left
     corner and up 2.6 past the cuff's top, so that only the band the
     photographs show - round the cuff's top and down its left side -
     escapes it */
  var pocket = mesh(new T.ShapeGeometry(new T.Shape(M1.roundRectPoints(0, 0, 24, 23, 11, 10)), 10), gapM, false, false);
  pocket.position.set(-8, cuffTop - 8.9, 0.12);
  sock.add(pocket);
  G.add(sock);
  sock.updateMatrix();
  /* the hose starts inside the cuff, so its open end is never seen */
  G.userData.socketAnchor = mouthL.clone().addScaledVector(sDir, -4).applyMatrix4(sock.matrix);
  G.userData.socketDir = sDir.clone().applyQuaternion(sock.quaternion).normalize();
  /* the cuff as an upright cylinder, for the hose to keep off */
  var cuffC = new T.Vector3(0, 0, cuffZ).applyMatrix4(sock.matrix);
  G.userData.socketCuff = { x: cuffC.x, z: cuffC.z, r: 11.6, y0: cuffMouth, y1: cuffTop };

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

/* The hose's cuff, in its socket's frame (x along the wall towards the
   front corner, y up, z out of it): a round rubber sleeve on a vertical
   axis `z` out from the wall, flat on top at `top` with a rounded edge,
   tapering from 11.6 to 10.6 on the way down, its bottom cut on a plane
   through (0, mouthY) that falls `slant` towards -x, and its lip rolled in
   onto the hose. */
function cuffGeometry(z, mouthY, slant, top) {
  var K = 48, rings = [];
  var tn = Math.tan(slant), knee = mouthY + 11.6 * tn + 1.5;
  function cut(x) { return mouthY + x * tn; }
  /* each ring: radius, and a height that is either level or (f > 0) a
     share f of the way from the knee down onto the cut */
  [[0.01, 0], [9.4, 0], [10.5, 0.2], [11.2, 0.7], [11.6, 1.5], [11.6, 2.9]].forEach(function (q) {
    rings.push({ r: q[0], y: top - q[1], f: 0, dy: 0 });
  });
  var i, n = 4;
  for (i = 1; i <= n; i++) rings.push({ r: 11.6 - 0.35 * i / n, y: top - 2.9 + (knee - top + 2.9) * i / n, f: 0, dy: 0 });
  for (i = 1; i <= n; i++) rings.push({ r: 11.25 - 0.65 * i / n, y: knee, f: i / n, dy: 0 });
  /* the lip, and back inside onto the hose */
  [[10.15, -0.4], [9.45, -0.55], [8.95, -0.3], [HOSE.r0 + 0.3, 0.9]].forEach(function (q) {
    rings.push({ r: q[0], y: knee, f: 1, dy: q[1] });
  });
  var pos = new Float32Array(rings.length * K * 3), idx = [], o = 0;
  rings.forEach(function (g) {
    for (var k = 0; k < K; k++) {
      var ph = k / K * TAU, x = Math.cos(ph) * g.r, w = Math.sin(ph) * g.r;
      pos[o++] = x;
      pos[o++] = g.y + g.f * (cut(x) - g.y) + g.dy;
      pos[o++] = z + w;
    }
  });
  for (var r = 0; r < rings.length - 1; r++) for (var k = 0; k < K; k++) {
    var a = r * K + k, b = r * K + (k + 1) % K;
    idx.push(a, b, a + K, b, b + K, a + K);
  }
  var geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
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
/* A rubber strain relief, lofted along a smooth path from p0 (heading t0)
   to `mouth` (heading `dir`): a rounded box a0 x b0 (half sizes) for the
   first quarter of the way, necking down to a round sleeve of radius rm
   that runs straight for the last few millimetres, and ending in a lip
   rolled in onto the hose. */
function strainRelief(p0, t0, mouth, dir, a0, b0, rm) {
  var K = 40, S = 20, st = [];
  var d = p0.distanceTo(mouth), m0 = t0.clone().multiplyScalar(d), m1 = dir.clone().multiplyScalar(d);
  var c = new T.Vector3(), tg = new T.Vector3();
  for (var i = 0; i <= S; i++) {
    var t = i / S, t2 = t * t, t3 = t2 * t, w = M1.smooth(Math.min(1, Math.max(0, (t - 0.25) / 0.6)));
    var h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    c.set(0, 0, 0).addScaledVector(p0, h00).addScaledVector(m0, h10).addScaledVector(mouth, h01).addScaledVector(m1, h11);
    tg.set(0, 0, 0).addScaledVector(p0, 6 * t2 - 6 * t).addScaledVector(m0, 3 * t2 - 4 * t + 1)
      .addScaledVector(mouth, -6 * t2 + 6 * t).addScaledVector(m1, 3 * t2 - 2 * t).normalize();
    st.push([c.clone(), tg.clone(), a0 + (rm - a0) * w, b0 + (rm - b0) * w, 6 - 4 * w]);
  }
  [[0.35, rm - 0.35], [0.5, rm - 1.0], [0.35, rm - 1.5], [-0.6, HOSE.r0 + 0.25]].forEach(function (q) {
    st.push([mouth.clone().addScaledVector(dir, q[0]), dir, q[1], q[1], 2]);
  });
  var pos = new Float32Array(st.length * K * 3), idx = [], o = 0;
  var v = new T.Vector3(), side = new T.Vector3();
  st.forEach(function (s) {
    v.set(0, 1, 0).addScaledVector(s[1], -s[1].y).normalize();
    side.crossVectors(v, s[1]).normalize();
    for (var k = 0; k < K; k++) {
      var th = k / K * TAU, cs = Math.cos(th), sn = Math.sin(th);
      var x = s[2] * (cs < 0 ? -1 : 1) * Math.pow(Math.abs(cs), 2 / s[4]);
      var y = s[3] * (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), 2 / s[4]);
      pos[o++] = s[0].x + side.x * x + v.x * y;
      pos[o++] = s[0].y + side.y * x + v.y * y;
      pos[o++] = s[0].z + side.z * x + v.z * y;
    }
  });
  for (var r = 0; r < st.length - 1; r++) for (var k = 0; k < K; k++) {
    var a = r * K + k, b = r * K + (k + 1) % K;
    idx.push(a, b, a + K, b, b + K, a + K);
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

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
     One black moulding on the end face, half its width (35, centred 10
     left of the pod's middle), its top tucked just under the top arris.
     It does not end in a hole: s1_1, s3_1, s5_1 and s9_7 all show its
     lower front running on into a tapered strain relief that necks down
     onto the hose and points it forward and down, about 30 degrees below
     level: the solved hose (THE CONDUIT) matches the centreline traced in
     s1_1 and s3_1 equally well anywhere from 30 to 40, and steeper starts
     put it into the deck.  The lip sits 2.7 clear of the deck, so over the
     deck the hose leaves it, settles and lies down on the deck (s3_1, s5_1,
     s9_7), and out over the front corner it carries on down (s1_1).  The
     old boot dropped the hose 50 degrees out of a hole in its underside,
     9.5 above the deck, so over the deck the hose went straight into the
     deck and was lifted back out of it, a corner at the connector. */
  var bootX = -10;
  var bootTop = top - 0.6, bootBot = y0 - 2.4;
  var bootG = new T.Group();
  bootG.position.set(bootX, 0, L / 2);
  /* one loft, from the moulding's full footprint on the end face (35 by
     the face's height, its top just under the arris) forward and down to
     the mouth, 30 degrees below level, 19 out from the face */
  var hDir = new T.Vector3(0, -Math.sin(PI / 6), Math.cos(PI / 6));
  var mouth = new T.Vector3(0, y0 + 8.5, 19);
  bootG.add(mesh(strainRelief(new T.Vector3(0, (bootTop + bootBot) / 2, -1.5), new T.Vector3(0, 0, 1), mouth, hDir,
                              17.4, (bootTop - bootBot) / 2, 10.2), mats.rubber, true, true));
  pod.add(bootG);
  bootG.updateMatrix();
  /* the hose starts inside the relief, so its open end is never seen */
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
   the boot on the pod and the cuff in the base's front-left wall. It leaves
   each one straight along that connector's own axis, then makes one smooth
   bend down to the table, where it lies in a single U in front of the
   machine (s1_1, s3_1, s5_1, s9_7, c_deck).

   History: an eight-point Catmull-Rom with Frenet frames wandered and spun
   the ribs round the hose (Jack: "all twisted around"); then a cubic
   Bezier between the two mouths kinked at both connectors (Jack,
   2026-10-12: "still bends wrong at the connectors").  Its two arms were
   one length, some 120 mm, aimed straight down out of the base cuff and
   50 degrees down out of the pod boot, so both ends drove into the table
   or the deck and were lifted back out point by point: a corner just past
   each connector, and a U swung out much wider than the photographs'.

   Now the hose is solved as what it is: a thin elastic rod of fixed length,
   clamped along each connector's axis, sagging under its own weight,
   resting on the table and kept off the base, the deck and the cuff.  Its
   shape is the one that minimises bending plus weight, found by Newton's
   method on a banded system (hoseRod, below); a moving head starts it from
   the last pose, so a frame costs two small Newton steps and allocates
   nothing.

   The hose is ONE static mesh, laid out straight and bent onto the solved
   path in the vertex shader from a 128-frame float texture of
   rotation-minimising frames, so nothing twists, the ribs stay joined
   however tight the bend, and a pose change uploads 6 KB.
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
  /* anchor to anchor (each anchor is 4 inside its mouth).  Fitted, with
     bendLen, to the hose's centreline traced in s1_1 and s3_1, solving the
     rod at each photograph's head position and projecting it through that
     photograph's fitted camera: RMS 16 px (s1_1) and 24 px (s3_1) from the
     traced line, where the old 380 hose was 50 and 43 px out, its U swung
     too wide.  Still long enough that no head position (+-1.05) pulls it
     taut: under 1 per cent stretch anywhere. */
  L: 308,
  N: 48,               /* rod segments: 6.4 mm each */
  /* bending length (B / rho g)^(1/3): how far the hose stands out before
     its own weight bends it; fitted with L (150 to 300 all fit within a
     few px; 220 is the best of them) */
  bendLen: 220,
  /* how far past each lip the hose is held straight.  The boot's lip lets
     the hose pivot (its relief is rubber): it drops steeply when the head
     is out over the front corner (s1_1) and lies down on the deck when it
     is over it (s3_1, s9_7).  The cuff grips it 2 mm further, and the hose
     then turns for the table soon after, its mouth being only 29 up
     (s3_1, s5_1).  Past the grip the hose stiffens off over reliefLen, so
     neither end shows a corner. */
  gripA: 0, gripB: 2,
  relief: 1.5, reliefLen: 9
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

/* --- the rod -----------------------------------------------------------
   N + 1 nodes, N segments of h = L / N.  Nodes 0..cA are clamped along the
   pod boot's axis and N - cB..N along the base cuff's; the rest are free.
   Energy, in units of the hose's own weight per millimetre:
     bending   kb w_j |x_(j-1) - 2 x_j + x_(j+1)|^2,  kb = bendLen^3 / 2h^3,
               w_j stiffer just past each mouth (the grip easing off)
     stretch   ks (|x_(j+1) - x_j| - h)^2, stiff: the hose does not stretch
     weight    h y_j
     contact   a penalty that starts smoothly once a node comes within the
               hose's radius of the table, the base (a rounded square on
               its corner, the deck flat on top, the foot rolled in) or the
               base cuff
   Each Newton step assembles the exact Hessian - it is banded, every node
   touching only its two neighbours either side - factors it by banded
   Cholesky and backtracks if the energy does not fall. */
function hoseRod(cfg) {
  var N = cfg.N, h = cfg.L / N;
  var kb = cfg.bendLen * cfg.bendLen * cfg.bendLen / (2 * h * h * h);
  /* the hose must neither stretch nor squash (a stiff hose would rather
     shorten than bend), and must not sink into what it rests on: both
     penalties are set well above the bending stiffness */
  var wg = h, ks = Math.max(1e4, 40 * kb), kc = Math.max(3e4, 8 * kb), cw = 0.5;
  var rh = cfg.radius + 0.4;
  var cA = cfg.clampA, cB = cfg.clampB;
  var i0 = cA + 1, i1 = N - cB - 1, F = i1 - i0 + 1, n = 3 * F, p = 8, bw = p + 1;
  var X = new Float64Array(3 * (N + 1)), Xt = new Float64Array(3 * (N + 1));
  var G = new Float64Array(n), Dx = new Float64Array(n), Rhs = new Float64Array(n);
  var Hb = new Float64Array(n * bw), H = new Float64Array(n * bw), H2 = new Float64Array(n * bw);
  var wj = new Float64Array(N + 1);
  var j, k, a, b, CC = [1, -2, 1];
  for (j = 1; j < N; j++) {
    var sA = Math.max(0, j * h - cfg.gripEndA), sB = Math.max(0, (N - j) * h - cfg.gripEndB);
    wj[j] = 1 + cfg.relief * (Math.exp(-sA / cfg.reliefLen) + Math.exp(-sB / cfg.reliefLen));
  }
  /* the bending part of the Hessian never changes */
  for (j = 1; j < N; j++) {
    for (a = 0; a < 3; a++) for (b = 0; b <= a; b++) {
      var ia = j - 1 + a - i0, ib = j - 1 + b - i0;
      if (ia < 0 || ia >= F || ib < 0 || ib >= F) continue;
      for (k = 0; k < 3; k++) Hb[(3 * ia + k) * bw + 3 * (ia - ib)] += 2 * kb * wj[j] * CC[a] * CC[b];
    }
  }
  /* contact penalty: cubic onset over cw, then quadratic */
  function pE(f) { return f <= 0 ? 0 : f < cw ? kc * f * f * f / (3 * cw) : kc * (f * f - cw * f + cw * cw / 3); }
  function pG(f) { return f <= 0 ? 0 : f < cw ? kc * f * f / cw : kc * (2 * f - cw); }
  function pH(f) { return f <= 0 ? 0 : f < cw ? 2 * kc * f / cw : 2 * kc; }
  /* signed distance to the base, and its gradient in sdX/Y/Z */
  var R2 = Math.SQRT1_2, hs = cfg.hs, cr = cfg.cornerR, top = cfg.deckY, rb = cfg.rollR;
  var sdD = 0, sdX = 0, sdY = 0, sdZ = 0;
  function baseSDF(x, y, z) {
    var u = (x - z) * R2, v = (x + z) * R2;
    var qa = Math.abs(u) - (hs - cr), qb = Math.abs(v) - (hs - cr);
    var d2, ga, gb;
    if (qa > 0 && qb > 0) { var ql = Math.sqrt(qa * qa + qb * qb); d2 = ql - cr; ga = qa / ql; gb = qb / ql; }
    else if (qa > qb) { d2 = qa - cr; ga = 1; gb = 0; }
    else { d2 = qb - cr; ga = 0; gb = 1; }
    if (u < 0) ga = -ga;
    if (v < 0) gb = -gb;
    var d, gd, gy;
    if (y < rb && d2 > -rb) {                  /* the rolled foot */
      var e = d2 + rb, f = y - rb, rr = Math.sqrt(e * e + f * f) || 1e-9;
      d = rr - rb; gd = e / rr; gy = f / rr;
    } else if (y > top && d2 > 0) {            /* round the deck's arris */
      var t2 = Math.sqrt(d2 * d2 + (y - top) * (y - top)); d = t2; gd = d2 / t2; gy = (y - top) / t2;
    } else {
      d = d2; gd = 1; gy = 0;
      if (y - top > d) { d = y - top; gd = 0; gy = 1; }
    }
    sdD = d; sdX = gd * (ga + gb) * R2; sdZ = gd * (gb - ga) * R2; sdY = gy;
    return d;
  }
  /* the base cuff stands 22 proud of the wall, so the hose coming down
     from the head can meet it: an upright cylinder, united with the base
     for every node but the last few, which are the hose's own end in it */
  var cu = cfg.cuff, cuLast = cu ? N - Math.ceil(30 / h) : -1;
  function obstSDF(x, y, z, j) {
    var d = baseSDF(x, y, z);
    if (j > cuLast) return d;
    var dx = x - cu.x, dz = z - cu.z, rr = Math.sqrt(dx * dx + dz * dz) || 1e-9, dr = rr - cu.r;
    var dyl = cu.y0 - y, dyu = y - cu.y1, dy = dyl > dyu ? dyl : dyu, sy = dyl > dyu ? -1 : 1;
    var e, gx, gy, gz;
    if (dr > 0 && dy > 0) { e = Math.sqrt(dr * dr + dy * dy); gx = dr / e * dx / rr; gz = dr / e * dz / rr; gy = sy * dy / e; }
    else if (dr > dy) { e = dr; gx = dx / rr; gz = dz / rr; gy = 0; }
    else { e = dy; gx = 0; gz = 0; gy = sy; }
    if (e < d) { sdD = d = e; sdX = gx; sdY = gy; sdZ = gz; }
    return d;
  }
  function energy(Y) {
    var E = 0, j, o;
    for (j = 1; j < N; j++) {
      o = 3 * j;
      var rx = Y[o - 3] - 2 * Y[o] + Y[o + 3], ry = Y[o - 2] - 2 * Y[o + 1] + Y[o + 4], rz = Y[o - 1] - 2 * Y[o + 2] + Y[o + 5];
      E += kb * wj[j] * (rx * rx + ry * ry + rz * rz);
    }
    for (j = 0; j < N; j++) {
      o = 3 * j;
      var dx = Y[o + 3] - Y[o], dy = Y[o + 4] - Y[o + 1], dz = Y[o + 5] - Y[o + 2];
      var l = Math.sqrt(dx * dx + dy * dy + dz * dz) - h;
      E += ks * l * l;
    }
    for (j = i0; j <= i1; j++) {
      o = 3 * j;
      E += wg * Y[o + 1] + pE(rh - Y[o + 1]) + pE(rh - obstSDF(Y[o], Y[o + 1], Y[o + 2], j));
    }
    return E;
  }
  function assemble() {
    var i, j, o, A, B;
    H.set(Hb); G.fill(0);
    for (j = 1; j < N; j++) {
      o = 3 * j;
      var rx = X[o - 3] - 2 * X[o] + X[o + 3], ry = X[o - 2] - 2 * X[o + 1] + X[o + 4], rz = X[o - 1] - 2 * X[o + 2] + X[o + 5];
      var f = 2 * kb * wj[j];
      for (var a = -1; a <= 1; a++) {
        var ia = j + a - i0;
        if (ia < 0 || ia >= F) continue;
        var c = a === 0 ? -2 * f : f;
        G[3 * ia] += c * rx; G[3 * ia + 1] += c * ry; G[3 * ia + 2] += c * rz;
      }
    }
    for (j = 0; j < N; j++) {
      o = 3 * j;
      var dx = X[o + 3] - X[o], dy = X[o + 4] - X[o + 1], dz = X[o + 5] - X[o + 2];
      var l = Math.sqrt(dx * dx + dy * dy + dz * dz), ux = dx / l, uy = dy / l, uz = dz / l, r = l - h;
      A = j - i0; B = j + 1 - i0;
      /* the edge's block K = kk u u^T + gm I, exact */
      var gm = 2 * ks * r / l, kk = 2 * ks - gm, fr = 2 * ks * r;
      var k00 = kk * ux * ux + gm, k11 = kk * uy * uy + gm, k22 = kk * uz * uz + gm;
      var k10 = kk * uy * ux, k20 = kk * uz * ux, k21 = kk * uz * uy;
      if (A >= 0 && A < F) {
        var ra = 3 * A * bw;
        G[3 * A] -= fr * ux; G[3 * A + 1] -= fr * uy; G[3 * A + 2] -= fr * uz;
        H[ra] += k00; H[ra + bw] += k11; H[ra + bw + 1] += k10;
        H[ra + 2 * bw] += k22; H[ra + 2 * bw + 1] += k21; H[ra + 2 * bw + 2] += k20;
      }
      if (B >= 0 && B < F) {
        var rB = 3 * B * bw;
        G[3 * B] += fr * ux; G[3 * B + 1] += fr * uy; G[3 * B + 2] += fr * uz;
        H[rB] += k00; H[rB + bw] += k11; H[rB + bw + 1] += k10;
        H[rB + 2 * bw] += k22; H[rB + 2 * bw + 1] += k21; H[rB + 2 * bw + 2] += k20;
        if (A >= 0) {
          /* row 3B+q, column 3A+w sits at band offset 3 + q - w: -K */
          H[rB + 3] -= k00; H[rB + 2] -= k10; H[rB + 1] -= k20;
          H[rB + bw + 4] -= k10; H[rB + bw + 3] -= k11; H[rB + bw + 2] -= k21;
          H[rB + 2 * bw + 5] -= k20; H[rB + 2 * bw + 4] -= k21; H[rB + 2 * bw + 3] -= k22;
        }
      }
    }
    for (i = i0; i <= i1; i++) {
      var I = 3 * (i - i0), x = X[3 * i], y = X[3 * i + 1], z = X[3 * i + 2], rI = I * bw;
      G[I + 1] += wg;
      if (y < rh) { G[I + 1] -= pG(rh - y); H[rI + bw] += pH(rh - y); }
      if (obstSDF(x, y, z, i) < rh) {
        var ph = pG(rh - sdD), c2 = pH(rh - sdD);
        G[I] -= ph * sdX; G[I + 1] -= ph * sdY; G[I + 2] -= ph * sdZ;
        H[rI] += c2 * sdX * sdX; H[rI + bw] += c2 * sdY * sdY; H[rI + bw + 1] += c2 * sdY * sdX;
        H[rI + 2 * bw] += c2 * sdZ * sdZ; H[rI + 2 * bw + 1] += c2 * sdZ * sdY; H[rI + 2 * bw + 2] += c2 * sdZ * sdX;
      }
    }
  }
  /* banded Cholesky in place; false if the matrix is not positive definite */
  function chol(M) {
    var ok = true;
    for (var i = 0; i < n; i++) {
      var jmin = i > p ? i - p : 0, ib = i * bw;
      for (var j = jmin; j <= i; j++) {
        var jb = j * bw, s = M[ib + i - j];
        var kmin = j - p > jmin ? j - p : jmin;
        for (var k = kmin; k < j; k++) s -= M[ib + i - k] * M[jb + j - k];
        if (i === j) { if (s <= 1e-9) { ok = false; s = 1e-9; } M[ib] = Math.sqrt(s); }
        else M[ib + i - j] = s / M[jb];
      }
    }
    return ok;
  }
  function back(M, rhs, out) {
    var i, k, s;
    for (i = 0; i < n; i++) {
      s = rhs[i];
      for (k = i > p ? i - p : 0; k < i; k++) s -= M[i * bw + i - k] * out[k];
      out[i] = s / M[i * bw];
    }
    for (i = n - 1; i >= 0; i--) {
      s = out[i];
      var kmax = i + p < n - 1 ? i + p : n - 1;
      for (k = i + 1; k <= kmax; k++) s -= M[k * bw + k - i] * out[k];
      out[i] = s / M[i * bw];
    }
  }
  var mu = 1e-6, Ecur = 0;
  /* one damped Newton step with backtracking; the largest move, or -1 */
  function step() {
    assemble();
    var E0 = Ecur, i, tries, dg = 0;
    for (i = 0; i < n; i++) if (H[i * bw] > dg) dg = H[i * bw];
    for (tries = 0; tries < 8; tries++) {
      H2.set(H);
      for (i = 0; i < n; i++) H2[i * bw] += mu * dg + 1e-9;
      if (!chol(H2)) { mu = mu < 1e-4 ? 1e-4 : Math.min(1e3, mu * 16); continue; }
      for (i = 0; i < n; i++) Rhs[i] = -G[i];
      back(H2, Rhs, Dx);
      var alpha = 1;
      for (var ls = 0; ls < 4; ls++) {
        Xt.set(X);
        var dmax = 0;
        for (i = 0; i < n; i++) {
          var dv = alpha * Dx[i];
          Xt[3 * i0 + i] += dv;
          if (dv > dmax) dmax = dv; else if (-dv > dmax) dmax = -dv;
        }
        var E1 = energy(Xt);
        if (E1 <= E0 + 1e-9 * Math.abs(E0)) {
          X.set(Xt); Ecur = E1;
          if (ls === 0) mu = Math.max(1e-7, mu * 0.25);
          return dmax;
        }
        alpha *= 0.5;
      }
      mu = Math.min(1e3, Math.max(1e-4, mu * 16));
    }
    return -1;
  }
  /* iterate until the largest move is under tol; the last move, or -1 if
     the last step could not lower the energy */
  function solve(maxIt, tol) {
    Ecur = energy(X);
    var d = -1;
    for (var it = 0; it < maxIt; it++) {
      d = step();
      if (d >= 0 && d < tol) break;
    }
    return d;
  }
  function setEnds(A, dA, B, dB) {
    for (var i = 0; i <= cA; i++) {
      X[3 * i] = A.x + dA.x * h * i; X[3 * i + 1] = A.y + dA.y * h * i; X[3 * i + 2] = A.z + dA.z * h * i;
    }
    for (i = 0; i <= cB; i++) {
      var m = N - i;
      X[3 * m] = B.x + dB.x * h * i; X[3 * m + 1] = B.y + dB.y * h * i; X[3 * m + 2] = B.z + dB.z * h * i;
    }
  }
  return { X: X, N: N, h: h, i0: i0, i1: i1, setEnds: setEnds, solve: solve, energy: function () { return energy(X); },
           sdf: baseSDF };
}

/* The hose and its solver.  `cuff` is the base cuff as an upright
   cylinder { x, z, r, y0, y1 } (root space), for the hose to keep off.
   update(A, dA, B, dB) takes the two anchors
   (root space, each 4 inside its mouth) and the unit direction the hose
   leaves each one by, solves the rod, and writes its frames into a small
   float texture.  Nothing here allocates after construction. */
function buildConduit(mats, cuff) {
  var M = 128;                                  /* frames handed to the shader */
  var N = HOSE.N, L = HOSE.L, r = HOSE.r0;
  var nRibs = Math.ceil(L * 1.10 / HOSE.P) + 2;   /* room for a hose pulled taut */
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

  var h = L / N;
  var rod = hoseRod({
    N: N, L: L, bendLen: HOSE.bendLen, radius: r,
    /* the clamp runs from the anchor, 4 inside the mouth, to the end of the
       grip past it */
    clampA: Math.max(1, Math.round((4 + HOSE.gripA) / h)),
    clampB: Math.max(1, Math.round((4 + HOSE.gripB) / h)),
    gripEndA: 4 + HOSE.gripA, gripEndB: 4 + HOSE.gripB,
    relief: HOSE.relief, reliefLen: HOSE.reliefLen,
    hs: D.hs, cornerR: D.cornerR, deckY: D.deckY, rollR: 13.5, cuff: cuff
  });
  var X = rod.X, nX = X.length;
  var Xprev = new Float64Array(nX), Xkeep = new Float64Array(nX);
  var A0 = new T.Vector3(), Aw = new T.Vector3(), dAp = new T.Vector3(), dAn = new T.Vector3();
  var started = false, settled = true, hasPrev = false;

  /* First pose only: a cubic between the anchors, its arms grown until it
     is the hose's length, kept above the table, resampled to even steps.
     Newton takes it from there. */
  function firstGuess(A, dA, B, dB) {
    var K = 256, pts = new Float64Array(3 * (K + 1)), cum = new Float64Array(K + 1);
    function bez(arm) {
      var len = 0;
      for (var k = 0; k <= K; k++) {
        var t = k / K, s = 1 - t, b0 = s * s * s, b1 = 3 * s * s * t, b2 = 3 * s * t * t, b3 = t * t * t;
        pts[3 * k] = b0 * A.x + b1 * (A.x + dA.x * arm) + b2 * (B.x + dB.x * arm) + b3 * B.x;
        pts[3 * k + 1] = Math.max(r + 1, b0 * A.y + b1 * (A.y + dA.y * arm) + b2 * (B.y + dB.y * arm) + b3 * B.y);
        pts[3 * k + 2] = b0 * A.z + b1 * (A.z + dA.z * arm) + b2 * (B.z + dB.z * arm) + b3 * B.z;
        if (k) len += Math.hypot(pts[3 * k] - pts[3 * k - 3], pts[3 * k + 1] - pts[3 * k - 2], pts[3 * k + 2] - pts[3 * k - 1]);
        cum[k] = len;
      }
      return len;
    }
    var lo = 1, hi = 900;
    for (var it = 0; it < 30; it++) { var mid = 0.5 * (lo + hi); if (bez(mid) < L) lo = mid; else hi = mid; }
    var tot = bez(lo), seg = 0;
    for (var i = 0; i <= N; i++) {
      var s = i / N * tot;
      while (seg < K - 1 && cum[seg + 1] < s) seg++;
      var f = (s - cum[seg]) / ((cum[seg + 1] - cum[seg]) || 1);
      for (var c = 0; c < 3; c++) X[3 * i + c] = pts[3 * seg + c] + (pts[3 * seg + 3 + c] - pts[3 * seg + c]) * f;
    }
  }

  /* carry the free nodes with the pod end, fading out along the hose */
  function drag(dx, dy, dz) {
    for (var i = 1; i < N; i++) {
      var w = 1 - i / N;
      X[3 * i] += dx * w; X[3 * i + 1] += dy * w; X[3 * i + 2] += dz * w;
    }
  }

  var box = geo.boundingBox;
  var trisPerRib = geo.userData.trisPerRib;
  var last = [NaN, NaN, NaN];

  function update(A, dA, B, dB) {
    var moved = !(Math.abs(A.x - last[0]) < 0.02 && Math.abs(A.y - last[1]) < 0.02 && Math.abs(A.z - last[2]) < 0.02);
    if (!moved && settled) return;
    if (moved) {
      last[0] = A.x; last[1] = A.y; last[2] = A.z;
      if (!started) {
        firstGuess(A, dA, B, dB);
        rod.setEnds(A, dA, B, dB);
        rod.solve(200, 0.005);
        started = true;
      } else {
        dAn.subVectors(A, A0);
        var jump = dAn.length();
        Xkeep.set(X);
        if (jump > 12) {
          /* a jump: walk there in steps the solver can follow, so the hose
             goes round the base the way it would if the head had moved */
          var steps = Math.ceil(jump / 12);
          for (var s = 1; s <= steps; s++) {
            Aw.copy(A0).lerp(A, s / steps);
            drag(dAn.x / steps, dAn.y / steps, dAn.z / steps);
            rod.setEnds(Aw, dA, B, dB);
            rod.solve(s < steps ? 10 : 60, s < steps ? 0.05 : 0.01);
          }
          settled = true;
          hasPrev = false;
        } else {
          /* a small move: extrapolate the hose's own last motion when the
             head keeps going the same way, else drag it along */
          var k = hasPrev ? dAn.dot(dAp) / Math.max(1e-9, dAp.lengthSq()) : 0;
          if (k > 0.2 && k < 2) {
            for (var i = 0; i < nX; i++) X[i] += (X[i] - Xprev[i]) * k;
          } else drag(dAn.x, dAn.y, dAn.z);
          rod.setEnds(A, dA, B, dB);
          /* two Newton steps keep up with a moving head (the hose lags the
             fully settled shape by under 0.1 mm); more only if they could
             not, so it never drifts off */
          var d = rod.solve(2, 0.05);
          if (d < 0 || d > 0.5) d = rod.solve(8, 0.05);
          settled = d >= 0 && d < 0.05;
          hasPrev = true;
        }
        Xprev.set(Xkeep);
        dAp.copy(dAn);
      }
      A0.copy(A);
    } else {
      /* the head stopped before the hose settled: finish it now */
      var d2 = rod.solve(4, 0.02);
      settled = d2 >= 0 && d2 < 0.05;
    }
    /* a solve that ever went non-finite would lose the hose for good:
       start again from the first guess */
    for (var q = 0; q < nX; q++) if (!isFinite(X[q])) {
      firstGuess(A, dA, B, dB);
      rod.setEnds(A, dA, B, dB);
      rod.solve(200, 0.005);
      settled = true;
      hasPrev = false;
      break;
    }
    writeFrames();
  }

  /* Catmull-Rom through the nodes (they are evenly spaced, so the spline's
     parameter is arc length), M frames, rotation-minimising normals by
     double reflection (Wang et al. 2008): no flips, no twist */
  var px = new Float64Array(M), py = new Float64Array(M), pz = new Float64Array(M);
  var tx = new Float64Array(M), ty = new Float64Array(M), tz = new Float64Array(M);
  function node(i, c) {
    if (i < 0) return 2 * X[c] - X[3 + c];
    if (i > N) return 2 * X[3 * N + c] - X[3 * N - 3 + c];
    return X[3 * i + c];
  }
  function writeFrames() {
    var q, c, len = 0;
    for (q = 0; q < M; q++) {
      var u = q / (M - 1) * N, i = Math.min(N - 1, Math.floor(u)), t = u - i, t2 = t * t, t3 = t2 * t;
      for (c = 0; c < 3; c++) {
        var p0 = node(i - 1, c), p1 = node(i, c), p2 = node(i + 1, c), p3 = node(i + 2, c);
        var v = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t3);
        var dv = 0.5 * ((p2 - p0) + 2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * t + 3 * (3 * p1 - p0 - 3 * p2 + p3) * t2);
        if (c === 0) { px[q] = v; tx[q] = dv; } else if (c === 1) { py[q] = v; ty[q] = dv; } else { pz[q] = v; tz[q] = dv; }
      }
      var tl = Math.sqrt(tx[q] * tx[q] + ty[q] * ty[q] + tz[q] * tz[q]) || 1;
      tx[q] /= tl; ty[q] /= tl; tz[q] /= tl;
      if (q) len += Math.sqrt((px[q] - px[q - 1]) * (px[q] - px[q - 1]) + (py[q] - py[q - 1]) * (py[q] - py[q - 1]) + (pz[q] - pz[q - 1]) * (pz[q] - pz[q - 1]));
    }
    /* start square to X, so the rib pattern starts the same way whatever
       the pose */
    var sx = 1 - tx[0] * tx[0], sy = -tx[0] * ty[0], sz = -tx[0] * tz[0];
    var sl = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
    var nx = sx / sl, ny = sy / sl, nz = sz / sl;
    box.makeEmpty();
    for (q = 0; q < M; q++) {
      if (q) {
        var v1x = px[q] - px[q - 1], v1y = py[q] - py[q - 1], v1z = pz[q] - pz[q - 1];
        var c1 = v1x * v1x + v1y * v1y + v1z * v1z;
        if (c1 > 1e-12) {
          var k1 = 2 / c1 * (v1x * nx + v1y * ny + v1z * nz);
          var rLx = nx - k1 * v1x, rLy = ny - k1 * v1y, rLz = nz - k1 * v1z;
          var k2 = 2 / c1 * (v1x * tx[q - 1] + v1y * ty[q - 1] + v1z * tz[q - 1]);
          var tLx = tx[q - 1] - k2 * v1x, tLy = ty[q - 1] - k2 * v1y, tLz = tz[q - 1] - k2 * v1z;
          var v2x = tx[q] - tLx, v2y = ty[q] - tLy, v2z = tz[q] - tLz;
          var c2 = v2x * v2x + v2y * v2y + v2z * v2z;
          var k3 = c2 < 1e-12 ? 0 : 2 / c2 * (v2x * rLx + v2y * rLy + v2z * rLz);
          nx = rLx - k3 * v2x; ny = rLy - k3 * v2y; nz = rLz - k3 * v2z;
        }
      }
      var o2 = q * 12;
      data[o2] = px[q]; data[o2 + 1] = py[q]; data[o2 + 2] = pz[q]; data[o2 + 3] = 1;
      data[o2 + 4] = tx[q]; data[o2 + 5] = ty[q]; data[o2 + 6] = tz[q]; data[o2 + 7] = 0;
      data[o2 + 8] = nx; data[o2 + 9] = ny; data[o2 + 10] = nz; data[o2 + 11] = 0;
      if (px[q] - r < box.min.x) box.min.x = px[q] - r; if (px[q] + r > box.max.x) box.max.x = px[q] + r;
      if (py[q] - r < box.min.y) box.min.y = py[q] - r; if (py[q] + r > box.max.y) box.max.y = py[q] + r;
      if (pz[q] - r < box.min.z) box.min.z = pz[q] - r; if (pz[q] + r > box.max.z) box.max.z = pz[q] + r;
    }
    tex.needsUpdate = true;
    frames.uniforms.hoseStep.value = len / (M - 1);
    frames.uniforms.hoseLen.value = len;
    /* draw only the ribs the hose has (+1 for the offset start); the rest
       would collapse onto the far end, inside the boot */
    geo.setDrawRange(0, Math.min(nRibs, Math.ceil(len / HOSE.P) + 1) * trisPerRib * 3);
    box.getBoundingSphere(geo.boundingSphere);
    hose.userData.length = len;
  }

  hose.userData.update = update;
  hose.userData.rod = rod;
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

  var conduit = buildConduit(mats, base.userData.socketCuff);
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
