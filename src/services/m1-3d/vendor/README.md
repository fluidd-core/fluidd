# The M1's photoreal model

`01-core.js`, `02-materials.js` and `03-model.js` are the Muon3D M1 photoreal
three.js model, copied unchanged from its own build
(`m1-model/src/`, where `splice.py` folds the `sec_*.js` sections into
`03-model.js`). They are built against three.js r185, which is the version
`package.json` pins.

They are plain scripts, not modules: each reads three.js from `window.THREE`
and adds to `window.M1`. `three-global.ts` puts three.js there, and `../load.ts`
imports it and then these files, in order, inside the lazy chunk the live view
loads. Nothing else in Fluidd imports them.

Fluidd uses `M1.buildMaterials()` and `M1.build(mats)` and drives the result
through `root.userData.state` and `root.userData.apply()`. The studio, lights
and camera are Fluidd's own (`../viewer.ts`), not the model's `04-viewer.js`,
which runs a render loop forever and listens on the whole window.

To update: copy the three files again from a fresh build, unchanged, and check
the stage on Overview.
