import type { Operation } from '../../operations/operation'

/**
 * An algorithm's asymptotic time complexity across the standard three
 * cases, plus its space complexity — conventional Big-O notation as
 * plain, already-formatted strings (e.g. "O(n²)"), not a structured value
 * a UI would need to interpret or format itself (Statistics & Complexity
 * Panel task section 5). This is static, unchanging metadata — the same
 * for every session of a given algorithm, independent of the array or
 * currentStep — unlike ExecutionStatistics (src/statistics/), which is
 * live per-session data.
 */
export interface AlgorithmComplexity {
  readonly time: {
    readonly best: string
    readonly average: string
    readonly worst: string
  }
  readonly space: string
}

/**
 * Describes an algorithm for the Code View and Statistics/Complexity
 * Panel features: its display name, educational pseudocode, a pure
 * mapping from an Operation to the pseudocode line that explains it
 * (Educational Code View task), and its conventional time/space
 * complexity (Statistics & Complexity Panel task).
 *
 * This is deliberately a separate concern from the Algorithm layer
 * (src/algorithms/bubbleSort.ts and friends). PROJECT.md 18.2 says an
 * Algorithm's only job is to produce Operations — it must not know about
 * rendering or presentation. Which line of pseudocode teaches a given
 * Operation, and what its Big-O complexity is, are presentation-adjacent,
 * educational concerns the Operation-generating functions have no
 * business knowing about, so metadata lives in its own module and is
 * never imported by bubbleSort.ts, selectionSort.ts, or insertionSort.ts.
 *
 * `code` holds one entry per displayed line, in display order (index 0 is
 * line 1, matching the 1-based line numbers CodeView renders).
 *
 * `getHighlightedLine` returns the 1-based line number that explains the
 * given Operation, or `null` when nothing should be highlighted — both for
 * `null` (no operation has executed yet, or a Reset just happened) and,
 * defensively, for any Operation type this metadata doesn't recognize.
 * The Code View component calls this and only this to decide what to
 * highlight; it never inspects an Operation's `type` itself (Educational
 * Code View task section 2: no algorithm-specific conditionals in the UI).
 */
export interface AlgorithmMetadata {
  readonly name: string
  readonly code: readonly string[]
  readonly complexity: AlgorithmComplexity
  getHighlightedLine(operation: Operation | null): number | null
}
