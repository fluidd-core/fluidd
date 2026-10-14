import Vue from 'vue'
import type { CheckEvidence, CheckId } from './model'

export interface RunningCheck {
  id: CheckId;
  /** The printer it runs on, by its address name. */
  printer: string | null;
  startedAt: number;
  /** What Klipper held when it started, to tell when it has a new result. */
  before: CheckEvidence;
}

/**
 * The check last started from Maintenance, until it has a result. It
 * outlives the page, so leaving Maintenance while the bed is measured and
 * coming back still records the run.
 */
export const running = Vue.observable({ check: null as RunningCheck | null })
