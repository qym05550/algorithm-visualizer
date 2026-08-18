import { useLayoutEffect, useRef } from 'react'

/**
 * A small, reusable FLIP-style "two elements exchange positions" slide
 * animation. Extracted from ArrayRenderer's original SWAP animation
 * (Animation System / Visual Motion Polish task) so any renderer — the
 * cell-based Array View, the Bar View, or a future one — can reuse the
 * exact same presentation-layer technique instead of duplicating it or
 * inventing a second animation system (Bar View task, sections 5 and 11:
 * "Do not create a second animation architecture specifically for bars.
 * The existing presentation-layer animation approach should be reused or
 * extended cleanly.").
 *
 * Usage: a renderer calls this hook with the same
 * (animateSwapIndices, animationTick) contract ArrayRenderer already
 * established, then attaches the returned `registerRef` as the ref
 * callback on whichever DOM element represents each array index (a value
 * span for the Array View, a bar-and-label wrapper for the Bar View).
 * Everything else — measuring positions, disabling/re-enabling the
 * transition, settling a leftover animation, cleaning up on unmount — is
 * identical regardless of what that element looks like.
 */
export function useSwapSlideAnimation(
  animateSwapIndices: readonly [number, number] | null | undefined,
  animationTick: number,
) {
  // Refs to each visible item's animatable element, keyed by array index.
  // A Map (not a fixed-size array) so it stays correct as the array's
  // length changes between sessions.
  const elementRefs = useRef(new Map<number, HTMLElement>())
  // The last index pair this hook actually applied a transform to.
  // Remembered so a *later* run — a different operation, a Reset, or
  // simply reaching the end of the session — can snap those specific
  // elements back to rest immediately, rather than leaving them
  // mid-transform forever once animateSwapIndices stops pointing at them.
  const lastAnimatedIndicesRef = useRef<readonly [number, number] | null>(null)
  // Whether this is this hook instance's very first run (i.e. the
  // component just mounted). A renderer can mount for the first time
  // already holding a non-null animateSwapIndices — e.g. switching from
  // Bar View to Array View shortly after a SWAP, where the *other*
  // renderer already played that slide to completion. Replaying it again
  // purely because a different renderer just became visible would be a
  // stale, spurious animation; skipping the very first run (while still
  // rendering the already-correct final positions, since layout was never
  // touched) avoids that without needing any cross-renderer bookkeeping.
  const isFirstRunRef = useRef(true)

  useLayoutEffect(() => {
    const isFirstRun = isFirstRunRef.current
    isFirstRunRef.current = false

    // Whatever pair was mid-animation from a previous tick must be
    // settled first, every single time — this is what keeps Reset, rapid
    // Next/Previous, and a COMPARE step immediately following a SWAP step
    // from ever leaving an element stuck at a stale offset.
    const previouslyAnimated = lastAnimatedIndicesRef.current
    if (previouslyAnimated) {
      settle(elementRefs.current.get(previouslyAnimated[0]))
      settle(elementRefs.current.get(previouslyAnimated[1]))
    }

    if (!animateSwapIndices || isFirstRun) {
      lastAnimatedIndicesRef.current = null
      return
    }

    const [a, b] = animateSwapIndices
    const elementA = elementRefs.current.get(a)
    const elementB = elementRefs.current.get(b)
    if (!elementA || !elementB || elementA === elementB) {
      lastAnimatedIndicesRef.current = null
      return
    }

    // settle() above already reset any leftover transform, so these are
    // each element's true resting layout position.
    const rectA = elementA.getBoundingClientRect()
    const rectB = elementB.getBoundingClientRect()

    // Element A already shows the value that used to live at B (and vice
    // versa) — the array itself updated before this effect ever runs.
    // Instantly place each element's content back where it just came
    // from, with transitions disabled so this relocation itself is
    // invisible.
    elementA.style.transition = 'none'
    elementA.style.transform = `translate(${rectB.left - rectA.left}px, ${rectB.top - rectA.top}px)`
    elementB.style.transition = 'none'
    elementB.style.transform = `translate(${rectA.left - rectB.left}px, ${rectA.top - rectB.top}px)`

    lastAnimatedIndicesRef.current = animateSwapIndices

    // Let the browser paint that starting position on its own frame
    // before restoring the declared CSS transition and clearing the
    // transform — otherwise both style writes would be batched into the
    // same frame and nothing would appear to move.
    const frame = requestAnimationFrame(() => {
      elementA.style.transition = ''
      elementA.style.transform = ''
      elementB.style.transition = ''
      elementB.style.transform = ''
    })

    return () => cancelAnimationFrame(frame)
    // animationTick is the deliberate trigger, not animateSwapIndices —
    // two consecutive actions can legitimately report the *same* pair of
    // indices (a SWAP immediately followed by Previous undoing it is
    // still a swap between the same two positions), and the animation
    // must still replay each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationTick])

  function registerRef(index: number, element: HTMLElement | null): void {
    if (element) {
      elementRefs.current.set(index, element)
    } else {
      elementRefs.current.delete(index)
    }
  }

  return { registerRef }
}

/**
 * Forces an element back to its untransformed resting position
 * immediately (no transition), so a later measurement of it reads its
 * true layout position rather than wherever an interrupted animation
 * currently has it.
 */
function settle(element: HTMLElement | undefined): void {
  if (!element) return
  element.style.transition = 'none'
  element.style.transform = 'none'
  // Force the browser to acknowledge the "no transition" state before any
  // later style write in this same tick, rather than batching them.
  void element.getBoundingClientRect()
  element.style.transition = ''
  element.style.transform = ''
}
