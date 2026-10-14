import Vue from 'vue'
import consola from 'consola'
import { useAuxApi } from '@/aux_api/useAuxApi'
import { httpClientActions } from '@/api/httpClientActions'
import type { DevModeStatus } from '@/aux_api/models/dev-mode-status'

/**
 * Developer mode, as the printer says it is, shared by everything that
 * shows it: Settings › Developer mode, the Files page, the macros' Edit.
 *
 * Two questions, and they are not the same question. "Is it on?" comes from
 * /server/aux/dev_mode, or, for a client the printer won't let manage it,
 * the read-only /server/muon/dev_mode. "May this client change it?" is
 * whether /server/aux/dev_mode answers at all (KAN-371).
 */
export interface DevModeState {
  /** null until the printer has answered. */
  enabled: boolean | null;
  canManage: boolean;
  /** Turning it on needs the waiver and a press at the printer. */
  guardArmed: boolean;
  /**
   * Whether turning it on is written to the printer's one-time-programmable
   * fuse, which no update or reset clears. False on the development fleet
   * (MuonOS ships MUON_OTP_RECORD_DEV_MODE=0), so it can be turned on and
   * off freely. Null when the printer doesn't say (older images).
   */
  otpArmed: boolean | null;
  /** What the fuse holds, when it was ever written. */
  otpFuse: string | null;
  everEnabled: boolean;
  checking: boolean;
}

export const devModeState: DevModeState = Vue.observable({
  enabled: null,
  canManage: false,
  guardArmed: true,
  otpArmed: null,
  otpFuse: null,
  everEnabled: false,
  checking: false
})

type Status = DevModeStatus & { otp_record_armed?: boolean }

/** Asks the printer again. Keeps the last known state when it can't be reached. */
export async function refreshDevMode (): Promise<void> {
  devModeState.checking = true
  try {
    const { data } = await useAuxApi().devMode.getDevModeStatusDevModeGet()
    const status = data as Status | undefined
    // A 200 text/html from the SPA location carries no state: not an answer.
    if (typeof status?.enabled !== 'boolean') throw new Error('unexpected /server/aux/dev_mode payload')
    devModeState.enabled = status.enabled
    devModeState.guardArmed = status.guard_armed !== false
    devModeState.otpArmed = typeof status.otp_record_armed === 'boolean' ? status.otp_record_armed : null
    devModeState.otpFuse = status.otp_fuse ?? null
    devModeState.everEnabled = !!status.ever_enabled
    devModeState.canManage = true
  } catch (err) {
    consola.debug('Developer mode is not manageable from this client:', err)
    devModeState.canManage = false
    try {
      const response = await httpClientActions.serverMuonDevModeGet()
      const enabled = response.data?.result?.enabled
      if (typeof enabled === 'boolean') devModeState.enabled = enabled
    } catch (e) {
      consola.error('Failed to get developer mode status:', e)
    }
  } finally {
    devModeState.checking = false
  }
}
