/**
 * Signing out from the account's pages and the header's menu (KAN-532):
 * one way in, so the menu, the Account list and the Devices page agree.
 */
import { cloudState, signOut } from '@/services/muon-cloud/state'
import { activationState } from '@/services/muon-cloud/activate'

/**
 * Signs this browser out. A cloud printer that was open goes with the
 * session, so the page reloads when the console's logout isn't taking it
 * elsewhere.
 */
export async function beginSignOut (): Promise<void> {
  const wasCloud = cloudState.activePrinterId !== null || activationState.switching !== null
  const navigating = await signOut()
  if (wasCloud && !navigating) window.location.reload()
}
