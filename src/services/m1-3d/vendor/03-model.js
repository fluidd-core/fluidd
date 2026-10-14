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
  beltZ: 0.0,          /* the belt band runs alongside the bar, not over it */

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
   the deck, a short straight wall, the parting line at 25, and a big roll
   onto the table below it. Sunk down the spine-to-front diagonal is the LED
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

  /* --- lower shell: a big roll off the table up to the parting line ------ */
  G.add(mesh(M1.loftRoundSquare([
    { y: 0.0,  h: hs - 12.0, r: cr - 12.0 },
    { y: 1.4,  h: hs - 7.4,  r: cr - 7.4 },
    { y: 3.4,  h: hs - 4.1,  r: cr - 4.1 },
    { y: 6.2,  h: hs - 1.8,  r: cr - 1.8 },
    { y: 9.6,  h: hs - 0.45, r: cr - 0.45 },
    { y: 13.5, h: hs,        r: cr },
    { y: D.partY - 0.5, h: hs,       r: cr },
    { y: D.partY,       h: hs - 0.3, r: cr - 0.3 }
  ], 30, true, false, RY), mats.aluShell));

  /* the shadow line where the two halves meet */
  G.add(mesh(M1.loftRoundSquare([
    { y: D.partY - 0.1, h: hs - 0.34, r: cr - 0.34 },
    { y: D.partY + 1.5, h: hs - 0.34, r: cr - 0.34 }
  ], 30, false, false, RY), mats.anodBlackMatte, false, false));

  /* --- upper shell: straight wall to an almost sharp top arris ----------- */
  G.add(mesh(M1.loftRoundSquare([
    { y: D.partY,        h: hs - 0.3,  r: cr - 0.3 },
    { y: D.partY + 1.7,  h: hs,        r: cr },
    { y: D.deckY - 1.8,  h: hs,        r: cr },
    { y: D.deckY - 0.8,  h: hs - 0.20, r: cr - 0.20 },
    { y: D.deckY - 0.26, h: hs - 0.62, r: cr - 0.62 },
    { y: D.deckY,        h: hs - 0.95, r: cr - 0.95 }
  ], 30, false, false, RY), mats.aluDeck));

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
  var lamps = [], diffusers = [];
  G.userData.ledOn = function (on) {
    lamps.forEach(function (l) { l.intensity = on ? 260 : 0; });
    diffusers.forEach(function (d) { d.material.emissiveIntensity = on ? 0.5 : 0.0; });
  };

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
  chan.add(mesh(taper(wallPts, D.deckY + 0.05, wallBot, D.deckY - D.ledDrop),
                sideOf(mats.troughWall), false, true));

  /* the groove down the middle of the valley floor */
  var groovePts = M1.roundRectPoints(0, 0, D.grooveW, D.ledZ * 2 - 10, D.grooveW / 2, 8, true);
  chan.add(mesh(strip(groovePts, D.deckY - D.ledDrop + 0.05, D.deckY - D.grooveDrop),
                sideOf(mats.anodBlackMatte), false, true));
  var grooveFloor = mesh(M1.rbox(D.grooveW, 2.0, D.ledZ * 2 - 10, D.grooveW / 2 - 0.3, 6), mats.steelDark, false, true);
  grooveFloor.position.y = D.deckY - D.grooveDrop - 1;
  chan.add(grooveFloor);

  /* the two lit shoulders either side of the groove. m_led.cfg declares
     [neopixel Left] on gpio4 and [neopixel Right] on gpio8, 40 pixels each -
     one strip per shoulder, which is exactly the three-band section the
     photographs resolve across the trough: light, dark, light. */
  var shoulderW = (D.ledW - D.grooveW) / 2;
  [-1, 1].forEach(function (sx) {
    var sX = sx * (D.grooveW / 2 + shoulderW / 2);
    var floor = mesh(new T.BoxGeometry(shoulderW, 1.6, D.ledZ * 2), mats.aluMach, false, true);
    floor.position.set(sX, D.deckY - D.ledDrop - 0.8, 0);
    chan.add(floor);
    /* the strip itself sits on that shoulder, tipped in towards the groove */
    var dif = mesh(M1.rbox(shoulderW - 1.2, 1.6, D.ledZ * 2 - 8, 0.4, 2), mats.ledDiffuser, false, true);
    dif.position.set(sX, D.deckY - D.ledDrop + 0.6, 0);
    chan.add(dif);
    diffusers.push(dif);
  });
  /* THE COVER.  s3_1 looks straight along this trough and shows a bright
     polished channel with one narrow dark seam down it - no belt, no pulley,
     nothing dark of any size - while the render was showing three black
     bands and measuring 150 against the photograph's 179, at sd 70 against
     49.  The mechanism is under a machined cover, with a slot just wide
     enough for the carriage fin; that is the seam.  The LED shoulders stay
     outboard of it, so the rose can still climb the walls in s7_1. */
  [-1, 1].forEach(function (sx) {
    /* the cover is the same machined finish as the deck it is let into, and
       that matters: troughWall is a near mirror at roughness 0.11 and it
       blew the whole channel to a clipped white, 191 against 179 with the
       highlights off the top.  aluDeck already lands at 189 on the deck. */
    var w = 8.4;                                   /* 2.6 .. 11.0 from centre */
    var cov = mesh(M1.rbox(w, 1.4, D.ledZ * 2 - 6, 0.5, 3), mats.aluDeck, false, true);
    cov.position.set(sx * (2.6 + w / 2), D.deckY - 7.5, 0);
    chan.add(cov);
  });

  /* the bounce. In s7_1 the rose climbs the trough's silver side walls and
     catches the underside of the carriage plate, so it has to be light, not
     a hand-tinted material. */
  [-56, 56].forEach(function (lz) {
    var lamp = new T.PointLight(0xff6f90, 330, 46, 2);
    lamp.position.set(0, D.deckY - D.ledDrop + 2.5, lz);
    chan.add(lamp);
    lamps.push(lamp);
  });

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

  /* --- the scroll wheel, in the left corner under the display ------------ */
  var wheel = new T.Group(); wheel.name = 'scrollWheel';
  wheel.position.set(-(D.corner - 2.0), D.partY + 7.0, 0);
  wheel.rotation.y = PI / 2;
  var pocket = mesh(M1.rbox(D.padW + 2.5, D.padH + 2, 10, 5.0, 5), mats.anodBlackMatte, false, true);
  pocket.position.set(0, 0, -5.0);
  wheel.add(pocket);
  /* the rim of the wheel, and only the rim: s7_1 measures a flush 13 x 19
     portrait pad here that never breaks the shell's outline, so the roller
     lives inside the shell and shows a millimetre of itself. */
  var roller = mesh(new T.CylinderGeometry(D.wheelR, D.wheelR, D.padW, 72), mats.anodBlackMatte, true, true);
  roller.rotation.z = PI / 2;
  roller.position.z = (D.wheelR - 1.0);
  wheel.add(roller);
  for (var kn = 0; kn < 72; kn++) {
    var ka = kn / 72 * TAU;
    var rib = mesh(new T.BoxGeometry(D.padW + 0.3, 0.7, 0.55), mats.anodBlackMatte, false, false);
    rib.position.set(0, Math.cos(ka) * D.wheelR, Math.sin(ka) * D.wheelR + (D.wheelR - 1.0));
    rib.rotation.x = -ka;
    wheel.add(rib);
  }
  G.add(wheel);
  G.userData.scrollWheel = wheel;

  /* --- the umbilical socket, in the front-left wall ----------------------- */
  var sock = new T.Group(); sock.name = 'umbilicalSocket';
  var sp = wallPoint(-1, 1, D.bootPlan);
  sock.position.set(sp.x, 31, sp.z);
  sock.rotation.y = -PI / 4;
  var boot = mesh(M1.rbox(24, 21, 11, 6.5, 6), mats.rubber, true, true);
  boot.position.z = 2.5;
  sock.add(boot);
  var nose = mesh(new T.CylinderGeometry(8.2, 7.4, 9, 36), mats.rubber, false, true);
  nose.rotation.x = PI / 2 + 0.42;
  nose.position.set(0, -2.0, 11.5);
  sock.add(nose);
  var bore = mesh(new T.CircleGeometry(7.4, 36), mats.dark, false, false);
  bore.position.set(0, -3.6, 15.4);
  sock.add(bore);
  G.add(sock);
  /* the hose ends on the throat's mouth, out along the wall's own normal */
  G.userData.socketAnchor = new T.Vector3(
    sp.x + sp.nx * 17, 23, sp.z + sp.nz * 17);

  /* --- the black corner bumpers on the lower shell -----------------------
     h-03 shows them capping the corner TIPS with no hose on them, s1_1 shows
     two of them with the umbilical plugged in: the same moulding does both
     jobs, which is why the corners read black in every studio frame. The
     spine tip carries the mast and the left tip carries the scroll wheel, so
     only the front and right tips are free. */
  [[1, 0], [0, 1]].forEach(function (c) {
    var bump = mesh(M1.rbox(30, 26, 20, 9.0, 6), mats.rubber, true, true);
    bump.position.set(c[0] * (D.corner - 6), 17, c[1] * (D.corner - 6));
    bump.rotation.y = Math.atan2(c[0], c[1]);
    G.add(bump);
  });

  /* --- the I/O pocket, in the lower shell on the front-right wall -------- */
  var port = new T.Group(); port.name = 'ioPort';
  var pp = wallPoint(1, 1, 0.52);
  port.position.set(pp.x, D.partY - 5, pp.z);
  port.rotation.y = PI / 4;
  var recess = mesh(M1.rbox(30, 24, 4.4, 6, 5), mats.aluPolish, false, true);
  recess.position.z = -1.6; port.add(recess);
  var pocketFace = mesh(M1.rbox(25, 19, 2.4, 5, 5), mats.aluMach, false, false);
  pocketFace.position.z = -0.4; port.add(pocketFace);
  var inlet = mesh(new T.CylinderGeometry(6.5, 6.5, 3.4, 40), mats.anodBlackMatte, false, true);
  inlet.rotation.x = PI / 2;
  inlet.position.set(0, 4.4, 0.6); port.add(inlet);
  var keyway = mesh(M1.rbox(2.4, 3.0, 3.6, 0.6, 2), mats.steelDark, false, false);
  keyway.position.set(0, 9.0, 0.6); port.add(keyway);
  var pin = mesh(new T.CylinderGeometry(2.4, 2.4, 3.6, 24), mats.steelRail, false, false);
  pin.rotation.x = PI / 2;
  pin.position.set(0, 4.4, 0.7); port.add(pin);
  var usb = mesh(M1.rbox(9.2, 3.2, 2.2, 1.5, 3), mats.dark, false, false);
  usb.position.set(0, -5.2, 0.5); port.add(usb);
  G.add(port);

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

   Two GT2 belts, and they do both axes. Each one runs from the spine end of
   the machine down the LED trough as a pair of strands - the DOUBLE BELT the
   deck shows above the LED strip - reaches the block that runs in the
   groove, is turned ninety degrees by the four idlers on that block's yoke,
   and then travels the cross rail: one strand over the bar's top land, one
   under its bottom land, 13.4 apart, wrapping 180 degrees round a small
   idler on a horizontal axle at each end and terminating at the pod.

   So the block hauls the whole cross rail down the trough, and the belts
   haul the pod along the bar. Everything screwed to the base is here;
   everything that travels is in buildCarriage.
   ========================================================================== */
function buildGantry(mats) {
  var G = new T.Group(); G.name = 'gantry';

  /* --- the double belt, running the length of the trough ----------------- */
  var beltGeo = M1.beltLoop(-D.ledZ + 8, D.ledZ - 8, D.troughPulleyR, D.beltW, 1.38);
  var pulGeo = M1.pulleyGeometry(D.troughPulleyR, 7.0, 14, 0.7);
  var flangeGeo = new T.CylinderGeometry(D.troughPulleyR + 1.6, D.troughPulleyR + 1.6, 0.7, 40);

  [-1, 1].forEach(function (sx) {
    var bx = sx * D.beltX;
    var belt = mesh(beltGeo, mats.belt, false, true);
    belt.position.set(bx, D.beltY, 0);
    G.add(belt);
  });

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
  var spineZ = -(D.ledZ - 8);
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
      var hd = mesh(new T.CylinderGeometry(1.25, 1.25, 1.0, 22), mats.steelRail, false, true);
      hd.position.y = D.beltW / 2 - 1.7; pg.add(hd);
      /* the stub each one is bolted to, running back down to the block */
      var stub = mesh(new T.CylinderGeometry(2.4, 2.8, 10, 20), mats.aluMach, false, true);
      stub.position.y = -(D.beltW / 2 + 4.0); pg.add(stub);
      G.add(pg);
    });
  });
  /* the plate they all stand on, bridging the trough at the spine */
  var yplate = mesh(M1.rbox(46, 3.6, 18, 1.8, 3), mats.aluMach, true, true);
  yplate.position.set(0, D.deckY + 1.5, spineZ + 14);
  G.add(yplate);
  /* and the pair that closes the front end, still flat and upright */
  [-1, 1].forEach(function (sx) {
    var pg = new T.Group();
    pg.position.set(sx * D.beltX, D.beltY, D.ledZ - 8);
    pg.add(mesh(pulGeo, mats.anodBlack, false, true));
    var f1 = mesh(flangeGeo, mats.anodBlack, false, true); f1.position.y = 3.85; pg.add(f1);
    var f2 = mesh(flangeGeo, mats.anodBlack, false, true); f2.position.y = -3.85; pg.add(f2);
    var bolt = mesh(new T.CylinderGeometry(2.5, 2.5, 13, 20), mats.steelRail, false, true);
    pg.add(bolt);
    var bh = mesh(new T.CylinderGeometry(3.6, 3.6, 2.4, 26), mats.steelRail, false, true);
    bh.position.y = 5.6; pg.add(bh);
    G.add(pg);
  });
  var brk = mesh(M1.rbox(D.ledW + 6, 5, 13, 1.4, 3), mats.aluMach, true, true);
  brk.position.set(0, D.beltY - 14.5, D.ledZ - 8);
  G.add(brk);

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

  /* --- the two steppers, under the deck at the spine corner --------------- */
  [-1, 1].forEach(function (sx) {
    var mot = mesh(M1.rbox(28, 28, 28, 2.5, 3), mats.anodBlackMatte, true, true);
    mot.position.set(sx * 22, D.deckY - 24, -D.ledZ + 14);
    G.add(mot);
  });

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

  /* --- the yoke: four idlers in two stacked pairs, turning the belts ------ */
  var yoke = mesh(M1.rbox(15, 4.5, 14, 1.4, 3), mats.aluMach, true, true);
  yoke.position.y = barTop + 8;
  G.add(yoke);
  /* c_mast sees all four of these from the front and they are TILTED, canted
     out of vertical by about 45 degrees and splayed two to a side, which is
     what lets one belt arrive flat down the trough and leave standing up
     along the bar.  Each is a dark flanged pulley with a bright turned top
     land and a bright bolt dome in the middle of it. */
  [-1, 1].forEach(function (sx) {
    [-1, 1].forEach(function (sy) {
      var pg = new T.Group();
      pg.position.set(sx * 11.5, D.crossY + sy * 5.5, sy * 5.0);
      pg.rotation.z = sx * 0.62;
      pg.rotation.x = sy * 0.42;
      /* the dark body and its two flanges */
      pg.add(mesh(new T.CylinderGeometry(D.yokeIdlerR - 1.4, D.yokeIdlerR - 1.4, D.beltW - 1.2, 30), mats.anodBlack, true, true));
      [-1, 1].forEach(function (sf) {
        var fl = mesh(new T.CylinderGeometry(D.yokeIdlerR, D.yokeIdlerR, 0.8, 34), mats.anodBlack, false, true);
        fl.position.y = sf * (D.beltW / 2 - 0.6); pg.add(fl);
      });
      /* the bright turned face and the bolt standing proud of it */
      var csk = mesh(new T.CylinderGeometry(D.yokeIdlerR - 1.0, 1.5, 2.0, 34, 1, true), mats.aluPolishBoth, false, true);
      csk.position.y = D.beltW / 2 - 1.2; pg.add(csk);
      var seat = mesh(new T.CylinderGeometry(1.5, 1.5, 0.4, 24), mats.steelDark, false, false);
      seat.position.y = D.beltW / 2 - 2.2; pg.add(seat);
      var hd = mesh(new T.CylinderGeometry(1.25, 1.25, 1.0, 22), mats.steelRail, false, true);
      hd.position.y = D.beltW / 2 - 1.7; pg.add(hd);
      G.add(pg);
    });
  });
  /* the shelf they all stand on */
  var shelf = mesh(M1.rbox(19, 3.0, 13, 1.2, 3), mats.aluMach, true, true);
  shelf.position.set(0, D.crossY - 8.6, 0);
  G.add(shelf);

  /* --- the end idlers ---------------------------------------------------
     Both ends of the cross rail image as a nearly ROUND black flange in
     c_s1deck - 14.5 across against the 52.4 display beside it - with the
     hex socket of its shoulder bolt looking sideways out of the middle, not
     up. A horizontal disc at that camera would be a 0.47 ellipse, so the
     axle is horizontal and square to the rail, and the belt loop that wraps
     it therefore stands in a VERTICAL plane along the bar. ---------------- */
  [-1, 1].forEach(function (sx) {
    var ec = mesh(M1.rbox(5.5, D.crossH + 1.2, 7.5, 1.2, 3), mats.aluMach, true, true);
    ec.position.set(sx * (D.crossX - 3), D.crossY - 1.4, D.beltZ);
    G.add(ec);

    var pg = new T.Group();
    pg.position.set(sx * (D.crossX + 3.5), D.crossY - 1.4, D.beltZ);
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
  var xBeltGeo = M1.beltLoop(-(D.crossX + 3.5), D.crossX + 3.5, D.endIdlerR + 0.63, D.beltW, 1.38, true);
  xBeltGeo.rotateY(-PI / 2);
  xBeltGeo.rotateX(PI / 2);
  var xBelt = mesh(xBeltGeo, mats.belt, false, true);
  xBelt.position.set(0, D.crossY - 1.4, D.beltZ);
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
  [D.crossY - 1.4 + D.endIdlerR + 0.63, D.crossY - 1.4 - D.endIdlerR - 0.63].forEach(function (by) {
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

  /* --- the umbilical boot: it WRAPS the near-left corner --------------- */
  /* c_head is unambiguous about this. The moulding is not a block bolted to
     the flat end face - it is a saddle pulled over the corner roll itself,
     running from the top arris down past the bottom one and turning through
     the corner onto the side face. So it sits ON the corner, at 45 degrees
     to both faces, and its own radius is big enough to follow the pod's. */
  var bootX = -11.1, bootZ = L / 2 - 3.0, bootY = y0 + 15.3;
  var bootG = new T.Group();
  bootG.position.set(bootX, bootY, bootZ);
  bootG.rotation.y = -0.18;
  bootG.add(mesh(M1.rbox(35, 26.5, 14, 4.5, 5), mats.rubber, true, true));
  /* and it rolls over the bottom arris the way the moulding does in c_head */
  var bootLip = mesh(M1.rbox(31, 7, 13, 3.4, 4), mats.rubber, true, true);
  bootLip.position.y = (y0 + 1.0) - bootY;
  bootG.add(bootLip);
  pod.add(bootG);
  /* s1_1 and the s3_1 crop both show the cuff as plain black rubber - the
     only warm metal on the head is the tab beside the nozzle - so the piping
     ring that used to sit here has gone. */
  /* it tapers away from the pod into the throat the hose plugs onto */
  /* it necks straight down into the throat the hose plugs onto: in s1_1 the
     conduit leaves the pod's end face and turns for the table at once, it
     does not stand out on a snout */
  /* no separate throat: the hose emerges straight out of the saddle */
  /* start the sweep INSIDE the throat: corrugatedTube has no end caps, so
     an anchor past the throat's mouth showed the tube's own interior as a
     bright ring hanging off the boot. */
  /* well INSIDE the rubber, not at its face: at 4.6 the tube's own open end
     showed as a dark bore ringing the hose where it leaves the boot, which is
     the very artefact the anchor was moved in to avoid. */
  var ba = new T.Vector3(0, -3.0, 1.5);
  bootG.updateMatrix(); ba.applyMatrix4(bootG.matrix);
  pod.userData.bootAnchor = ba;

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
  /* The plate's corners are all but SQUARE in s1_1 - a crisp point with a
     chamfer you can barely see - and a squircle exponent of 20 rounds a 200
     wide plate by 3.4 mm, which at 5x reads as a fat radius nothing in the
     photograph has.  60 brings it to 1.15. */
  var glass = mesh(M1.squirclePlate(D.glassW / 2, D.glassD / 2, gt, 60, 0.6), mats.glass, false, false);
  glass.position.set(-D.mastX, 0, glassZ);
  glass.name = 'glassPlate';
  glass.renderOrder = 2;
  G.add(glass);

  /* The rim goes INSIDE the glass, not outside it.  At 0.04 out it was a
     third of a pixel from the plate's own side wall and the two interleaved
     along the near edge into a fine stipple; pushing it to 0.35 out did not
     clear it either, because the plate is seen nearly edge-on there and the
     two surfaces stay within a pixel in depth however far apart they are in
     the plane.  Sunk 0.5 INSIDE, the glass's own wall owns the silhouette
     and the tinted shell is simply seen through it, which is what a green
     glass edge is anyway. */
  var rim = mesh(M1.loftSquircle([
    { y: 0.3, hx: D.glassW / 2 + 0.25, hz: D.glassD / 2 + 0.25, n: 60 },
    { y: gt - 0.3, hx: D.glassW / 2 + 0.25, hz: D.glassD / 2 + 0.25, n: 60 }
  ], 176, false, false), mats.glassEdge, false, false);
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
   ========================================================================== */
function conduitCurve(head, sock) {
  /* The shell is a square standing on a corner, so a plan point clears the
     casting only when |x + z| or |x - z| exceeds hs * root2. Every control
     point below deck level is held outside that line - which is what stops
     the tube driving through the base the way it used to. It leaves the head
     high, crosses the deck, drops outside the front corner, hangs in a slack
     loop almost on the table, and comes back up into the wall socket. */
  var R = D.hs * Math.SQRT2;              /* |x| + |z| = R is the wall */
  var clear = R + 16;                     /* a tube radius and a margin */
  /* The two points after the head used to be FIXED at z 102 and 126. Once
     the carriage parked forward the boot came out at z 116, past them, and
     the spline doubled back on itself - a bend tighter than the tube's own
     radius, which is what tore the sweep into loose rings. Everything
     downstream of the head is now derived from the head. */
  var ax = head.x * 0.45 + 18;
  var zc = clear - Math.abs(ax);
  return new T.CatmullRomCurve3([
    head,
    new T.Vector3(head.x + 11, head.y - 8, head.z + 34),
    new T.Vector3(ax, D.deckY - 2, Math.max(zc + 8, head.z + 44)),
    new T.Vector3(ax + 6, 30, zc + 26),
    new T.Vector3(ax - 10, 8, zc + 40),
    new T.Vector3(-34, 6, clear + 4),
    new T.Vector3(-70, 12, clear - 34),
    sock
  ], false, 'catmullrom', 0.5);
}


/* ==========================================================================
   ASSEMBLY
   ========================================================================== */
M1.build = function (mats) {
  var decals = {
    glass: M1.glassDecal(2048),
    deck: M1.deckDecal(1024),
    clamp: M1.clampDecal(1024),
    screen: M1.screenCanvas(768, 41)
  };

  var root = new T.Group(); root.name = 'M1';

  var base = buildBase(mats, decals);
  root.add(base);
  root.add(buildGantry(mats));

  /* the block in the groove carries the cross rail, and the head rides that */
  var yCarriage = buildCarriage(mats);
  var beamGroup = buildHead(mats);
  yCarriage.add(beamGroup);
  root.add(yCarriage);

  var conduit = mesh(new T.BufferGeometry(), mats.conduit);
  conduit.name = 'conduit';
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

  var print = buildPrint(mats);
  var printHolder = new T.Group();
  printHolder.add(print);
  bedLift.add(printHolder);

  root.userData = {
    base: base, beamGroup: beamGroup, yCarriage: yCarriage,
    pod: beamGroup.userData.pod, mastPivot: mastPivot, mastYaw: mastYaw,
    bedLift: bedLift, bed: bed, print: print, printHolder: printHolder,
    conduit: conduit, decals: decals, mats: mats, spool: mastParts.userData.spool,
    display: base.userData.display, screenMesh: base.userData.screenMesh
  };

  /* `led` is per PHOTOGRAPH, not a style: s7_1 shows the rose climbing the
     trough's silver side walls, and s3_1 shows the same trough with not one
     pixel above R-G 10 anywhere in it - max 10 across the whole channel,
     against 11.8 per cent of the render's pixels over that and a peak of 68.
     So the chamber strip is simply off in the product shot, and a render that
     forces it on cannot match. */
  var state = { z: 0.42, fold: 0, headX: 0.34, headZ: 0.55, showPrint: true, showSpool: false, led: true, progress: 41 };
  root.userData.state = state;

  var tmp = new T.Vector3();
  var lastKey = '';

  root.userData.apply = function () {
    mastPivot.rotation.x = state.fold * (PI / 2 - 0.05);
    /* No yaw. The spine stands on the back corner and the LED channel runs
       corner to corner, so a 246 mm column lies straight down the 268 mm
       diagonal - it never has to cross the square. */
    mastYaw.rotation.y = 0;

    var lift = 26 + state.z * D.bedTravel;      /* plate underside above the hinge */
    bedLift.position.set(0, lift, 0);
    bedLift.visible = state.fold < 0.02;
    if (base.userData.ledOn) base.userData.ledOn(state.led !== false && state.fold < 0.5);
    mastParts.userData.spool.visible = state.showSpool;

    var hx = state.headX * D.travelX;
    var hz = state.headZ * D.travelZ;
    yCarriage.position.set(0, 0, hz);          /* the block, down the LED rail */
    beamGroup.userData.pod.position.set(hx, 0, 0);   /* the head, along the cross rail */

    /* the print hangs off the plate directly above the nozzle */
    /* the nozzle well is in a CORNER of the top face - 20 in from the rail
       side, 16 in from the spine end - so the part hangs off-centre */
    var nozWorldX = hx - D.podW / 2 + 20, nozWorldZ = hz - D.podL / 2 + 16;
    printHolder.position.set(nozWorldX, 0, nozWorldZ - D.mastZ);
    print.visible = state.showPrint && state.fold < 0.02;
    var gap = M1.clamp((D.hingeY + lift) - D.nozzleY + D.printSink, 6, 180);
    if (Math.abs((root.userData._gap || 0) - gap) > 1.5) {
      root.userData._gap = gap;
      var og = print.geometry;
      print.geometry = printGeometry(gap);
      if (og) og.dispose();
    }

    /* the conduit follows the head */
    beamGroup.updateMatrixWorld(true);
    tmp.copy(beamGroup.userData.pod.userData.bootAnchor);
    beamGroup.userData.pod.localToWorld(tmp);
    root.worldToLocal(tmp);
    var key = tmp.x.toFixed(1) + ',' + tmp.z.toFixed(1);
    if (key !== lastKey) {
      lastKey = key;
      var old = conduit.geometry;
      conduit.geometry = M1.corrugatedTube(
        conduitCurve(tmp, base.userData.socketAnchor), 2400, 6.8, 1.70, 3.6, 30);
      if (old) old.dispose();
    }

    if (root.userData._pct !== Math.round(state.progress)) {
      root.userData._pct = Math.round(state.progress);
      var c = M1.screenCanvas(768, state.progress);
      root.userData.screenMesh.material.map.image = c;
      root.userData.screenMesh.material.map.needsUpdate = true;
    }
  };

  root.userData.apply();
  return root;
};

})(window);
