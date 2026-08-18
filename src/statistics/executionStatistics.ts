import type { Operation } from '../operations/operation'

/**
 * Live counters for a session's execution so far (Statistics & Complexity
 * Panel task). Deliberately just these three numbers — no per-index
 * detail, no history, nothing an algorithm or the Execution Engine would
 * need to know about. This is presentation-level data derived entirely
 * from information the architecture already exposes.
 */
export interface ExecutionStatistics {
  readonly comparisons: number
  readonly swaps: number
  readonly totalOperations: number
}

/** All counters at zero — the correct statistics both before any Operation
 *  has run and immediately after a Reset (task sections 4 and 7). */
export const ZERO_STATISTICS: ExecutionStatistics = {
  comparisons: 0,
  swaps: 0,
  totalOperations: 0,
}

/**
 * Derives live statistics from the Operations a session has actually
 * executed so far — `operations[0 .. currentStep - 1]` — rather than the
 * total Operations the algorithm will eventually produce (task section 2).
 *
 * This is a pure function of the same two pieces of information
 * VisualizerController's own VisualState already centers everything else
 * on: an Operations sequence and a currentStep. It does not duplicate any
 * algorithm logic — it only tallies the `type` of Operations a Bubble
 * Sort / Selection Sort / Insertion Sort (or any future algorithm using
 * the same COMPARE/SWAP model) already produced. Reversing execution
 * (Previous) naturally decreases these counts simply by being called
 * again with a smaller `currentStep` — there is no separate incremental
 * counter to keep in sync in either direction (task section 3: "one
 * source of truth").
 */
export function computeExecutionStatistics(
  operations: readonly Operation[],
  currentStep: number,
): ExecutionStatistics {
  let comparisons = 0
  let swaps = 0

  // Clamp defensively rather than trust the caller's currentStep exactly —
  // this function has no way to enforce ExecutionEngine's own bounds
  // invariants itself, so it stays correct even if ever called with an
  // out-of-range step.
  const executedCount = Math.max(0, Math.min(currentStep, operations.length))

  for (let i = 0; i < executedCount; i++) {
    if (operations[i].type === 'compare') {
      comparisons += 1
    } else {
      swaps += 1
    }
  }

  return { comparisons, swaps, totalOperations: comparisons + swaps }
}
