/** Shared by the existing Z-adjust control, Live tune and first-layer nudges. */
export function zAdjustCommand (by: number, homed: boolean): string {
  return Number.isFinite(by) ? `SET_GCODE_OFFSET Z_ADJUST=${by >= 0 ? '+' : ''}${by} MOVE=${homed ? 1 : 0}` : ''
}
