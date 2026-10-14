import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// The model's files are plain scripts that read three.js from window.THREE
// as they load, so it has to be there first; load.ts imports this before
// them. Their own build bundled the RoundedBoxGeometry add-on into THREE,
// the only add-on they use.
(window as unknown as { THREE: unknown }).THREE = { ...THREE, RoundedBoxGeometry }
