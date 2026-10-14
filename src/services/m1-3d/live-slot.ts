/**
 * One live M1 at a time. A browser allows only a handful of WebGL contexts
 * and each photoreal M1 holds one with its textures, so a second view that
 * starts asks the first to let go, and that one goes back to its picture.
 */
let holder: { id: symbol, release: () => void } | null = null

/**
 * Takes the live view for whoever calls, after asking its holder to let go.
 * Returns how to give it back, which does nothing once another has taken it.
 */
export function claimLiveView (release: () => void): () => void {
  const previous = holder
  const id = Symbol('live M1')
  holder = { id, release }
  previous?.release()
  return () => {
    if (holder?.id === id) holder = null
  }
}
