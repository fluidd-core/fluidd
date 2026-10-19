/** Remove the retired Control layout preference without ever consulting it. */
export function retireProStorage (): void {
  try {
    localStorage.removeItem('muon3d.pro')
  } catch {
    // Storage can be unavailable (for example, in a locked-down browser).
  }
}
