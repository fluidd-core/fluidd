import * as THREE from 'three'
import './vendor/three-global'
import './vendor/01-core.js'
import './vendor/02-materials.js'
import './vendor/03-model.js'

/** The model's state, as `root.userData.state` holds it. */
export interface M1State {
  /** The bed's height, 0 (lowest) to 1 (highest). */
  z: number;
  /** The mast folded down for transport, 0 to 1. */
  fold: number;
  /** The head along the cross rail and down the trough, -1 to 1. */
  headX: number;
  headZ: number;
  showPrint: boolean;
  showSpool: boolean;
  /** The LED strips on or off. */
  led: boolean;
  /** One colour for every pixel, [r, g, b] 0 to 1, unless the strips' own are given. */
  ledColor?: number[];
  /** Klipper's color_data for `neopixel Left` and `neopixel Right`. */
  ledLeft?: number[][] | null;
  ledRight?: number[][] | null;
  /** What the base's round screen shows (live-state.ts ScreenState); progress 0 to 100. */
  status?: string;
  progress: number;
  nozzleTemp?: number;
  nozzleTarget?: number;
  bedTemp?: number;
  bedTarget?: number;
  jobName?: string;
  connected?: boolean;
}

export interface M1Root extends THREE.Group {
  userData: {
    state: M1State;
    apply: () => void;
    [key: string]: unknown;
  };
}

/** What the model's files add to the window. */
export interface M1Namespace {
  buildMaterials: () => Record<string, THREE.Material>;
  build: (mats: Record<string, THREE.Material>) => M1Root;
  /** The model's dimensions: travelX and travelZ are the head's half travel, bedTravel the bed's whole. */
  DIM: Record<string, number>;
}

export { THREE }

export function m1 (): M1Namespace {
  return (window as unknown as { M1: M1Namespace }).M1
}
