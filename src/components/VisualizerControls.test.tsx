// Autoplay + Speed UI task: focused presentational tests for
// VisualizerControls itself, driven purely through props/mock handlers —
// no timers, no VisualizerController, no algorithm. The autoplay *timer*
// logic (Play starting/stopping the interval, speed changes taking effect
// live, auto-stop at the final step, Reset race-safety, session
// isolation, no duplicate timers, all three algorithms) is already
// exhaustively covered end-to-end in
// VisualizationPlaceholder.test.tsx's "Autoplay (Play/Stop) + Speed
// Control" describe block (tests 1-14) — deliberately not duplicated
// here. This file instead proves the component renders and reports the
// right thing for a given set of props, exactly as the task's own
// intended architecture describes it: "The controls component should NOT
// own the timer... It should remain presentational."
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import VisualizerControls from './VisualizerControls'

const SPEED_OPTIONS = ['Slow', 'Normal', 'Fast']

function renderControls(overrides: Partial<Parameters<typeof VisualizerControls>[0]> = {}) {
  return render(
    <VisualizerControls
      onPrevious={() => {}}
      onNext={() => {}}
      onReset={() => {}}
      canGoPrevious={true}
      canGoNext={true}
      currentStep={0}
      totalSteps={10}
      isPlaying={false}
      onPlay={() => {}}
      onStop={() => {}}
      speed="Normal"
      speedOptions={SPEED_OPTIONS}
      onSpeedChange={() => {}}
      {...overrides}
    />,
  )
}

describe('VisualizerControls — Play/Stop reflects isPlaying', () => {
  it('renders a Play button, not Stop, when isPlaying is false', () => {
    renderControls({ isPlaying: false })

    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
  })

  it('renders a Stop button, not Play, when isPlaying is true', () => {
    renderControls({ isPlaying: true })

    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull()
  })

  it('Play and Stop are real <button> elements, not divs/icons standing in for one', () => {
    const { rerender } = renderControls({ isPlaying: false })
    expect(screen.getByRole('button', { name: 'Play' }).tagName).toBe('BUTTON')

    rerender(
      <VisualizerControls
        onPrevious={() => {}}
        onNext={() => {}}
        onReset={() => {}}
        canGoPrevious
        canGoNext
        currentStep={0}
        totalSteps={10}
        isPlaying={true}
        onPlay={() => {}}
        onStop={() => {}}
        speed="Normal"
        speedOptions={SPEED_OPTIONS}
        onSpeedChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Stop' }).tagName).toBe('BUTTON')
  })

  it('shows visible text, not an icon-only button, for both states', () => {
    const { rerender } = renderControls({ isPlaying: false })
    expect(screen.getByRole('button', { name: 'Play' }).textContent).toContain('Play')

    rerender(
      <VisualizerControls
        onPrevious={() => {}}
        onNext={() => {}}
        onReset={() => {}}
        canGoPrevious
        canGoNext
        currentStep={0}
        totalSteps={10}
        isPlaying={true}
        onPlay={() => {}}
        onStop={() => {}}
        speed="Normal"
        speedOptions={SPEED_OPTIONS}
        onSpeedChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Stop' }).textContent).toContain('Stop')
  })
})

describe('VisualizerControls — Play/Stop click handlers call the existing autoplay handlers, nothing else', () => {
  it('clicking Play calls onPlay, not onStop', () => {
    const onPlay = vi.fn()
    const onStop = vi.fn()
    renderControls({ isPlaying: false, onPlay, onStop })

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onStop).not.toHaveBeenCalled()
  })

  it('clicking Stop calls onStop, not onPlay', () => {
    const onPlay = vi.fn()
    const onStop = vi.fn()
    renderControls({ isPlaying: true, onPlay, onStop })

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))

    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onPlay).not.toHaveBeenCalled()
  })
})

describe('VisualizerControls — Play disabled state', () => {
  it('Play is disabled when canGoNext is false (the final step)', () => {
    renderControls({ isPlaying: false, canGoNext: false })

    expect(screen.getByRole('button', { name: 'Play' }).hasAttribute('disabled')).toBe(true)
  })

  it('Play is enabled when canGoNext is true', () => {
    renderControls({ isPlaying: false, canGoNext: true })

    expect(screen.getByRole('button', { name: 'Play' }).hasAttribute('disabled')).toBe(false)
  })

  it('Stop is never disabled while it is showing — it is only ever rendered while autoplay is genuinely running', () => {
    renderControls({ isPlaying: true, canGoNext: false })

    expect(screen.getByRole('button', { name: 'Stop' }).hasAttribute('disabled')).toBe(false)
  })
})

describe('VisualizerControls — existing Previous/Next disabled behavior is preserved', () => {
  it('Previous is disabled when canGoPrevious is false', () => {
    renderControls({ canGoPrevious: false })
    expect(screen.getByRole('button', { name: 'Previous' }).hasAttribute('disabled')).toBe(true)
  })

  it('Next is disabled when canGoNext is false', () => {
    renderControls({ canGoNext: false, isPlaying: true })
    expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(true)
  })
})

describe('VisualizerControls — Speed selector', () => {
  it('renders a real, keyboard-accessible <select> labeled "Speed"', () => {
    renderControls()

    const select = screen.getByLabelText('Speed') as HTMLSelectElement
    expect(select.tagName).toBe('SELECT')
  })

  it('renders exactly the given speed options, in order', () => {
    renderControls({ speedOptions: SPEED_OPTIONS })

    const select = screen.getByLabelText('Speed') as HTMLSelectElement
    const optionLabels = Array.from(select.options).map((option) => option.value)
    expect(optionLabels).toEqual(SPEED_OPTIONS)
  })

  it('Normal is selected by default', () => {
    renderControls({ speed: 'Normal' })

    const select = screen.getByLabelText('Speed') as HTMLSelectElement
    expect(select.value).toBe('Normal')
  })

  it('reflects whichever speed prop it is given, not always Normal', () => {
    renderControls({ speed: 'Fast' })

    const select = screen.getByLabelText('Speed') as HTMLSelectElement
    expect(select.value).toBe('Fast')
  })

  it('calls the existing onSpeedChange handler with the newly selected value — no separate speed mechanism', () => {
    const onSpeedChange = vi.fn()
    renderControls({ onSpeedChange })

    fireEvent.change(screen.getByLabelText('Speed'), { target: { value: 'Fast' } })

    expect(onSpeedChange).toHaveBeenCalledTimes(1)
    expect(onSpeedChange).toHaveBeenCalledWith('Fast')
  })

  it('remains enabled while autoplay is running, so it can be changed live', () => {
    renderControls({ isPlaying: true })

    expect((screen.getByLabelText('Speed') as HTMLSelectElement).disabled).toBe(false)
  })

  it('changing speed while playing does not touch Play/Stop/Previous/Next at all — only onSpeedChange fires', () => {
    const onSpeedChange = vi.fn()
    const onPlay = vi.fn()
    const onStop = vi.fn()
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    renderControls({ isPlaying: true, onSpeedChange, onPlay, onStop, onNext, onPrevious })

    fireEvent.change(screen.getByLabelText('Speed'), { target: { value: 'Slow' } })

    expect(onSpeedChange).toHaveBeenCalledWith('Slow')
    expect(onPlay).not.toHaveBeenCalled()
    expect(onStop).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
    expect(onPrevious).not.toHaveBeenCalled()
  })
})

describe('VisualizerControls — step indicator', () => {
  it('displays the given current/total step', () => {
    renderControls({ currentStep: 4, totalSteps: 11 })
    expect(screen.getByText('Step 4 / 11')).toBeTruthy()
  })
})

describe('VisualizerControls — accessibility', () => {
  it('every disabled control uses the native disabled attribute, not just a visual style', () => {
    renderControls({ canGoPrevious: false, canGoNext: false, isPlaying: false })

    const previous = screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
    const play = screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement
    expect(previous.disabled).toBe(true)
    expect(play.disabled).toBe(true)
  })

  it('Reset has no disabled state — it is always available (PROJECT.md 18.13)', () => {
    renderControls()
    expect(screen.getByRole('button', { name: 'Reset' }).hasAttribute('disabled')).toBe(false)
  })

  it('the step indicator is announced via aria-live, for autoplay progress without focus stealing', () => {
    renderControls()
    const step = screen.getByText(/Step \d+ \/ \d+/)
    expect(step.getAttribute('aria-live')).toBe('polite')
  })
})

describe('VisualizerControls — architecture: presentational only, no autoplay/algorithm knowledge', () => {
  it('never imports ExecutionEngine, VisualizerController, or an algorithm, and owns no timer', async () => {
    const { readFileSync } = await import('node:fs')
    const path = await import('node:path')
    const source = readFileSync(path.join(__dirname, 'VisualizerControls.tsx'), 'utf-8')

    // Only real import statements count here — the component's own doc
    // comment legitimately *names* ExecutionEngine/VisualizerController to
    // explain what it deliberately does NOT depend on (PROJECT.md 12,
    // 18.14, 18.15), so a bare substring match would false-positive on its
    // own documentation. Strip comments first, then check imports/calls.
    const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(withoutComments).not.toMatch(/^import .*(ExecutionEngine|VisualizerController).*$/m)
    expect(withoutComments).not.toMatch(/bubbleSort\(|selectionSort\(|insertionSort\(/)
    expect(withoutComments).not.toMatch(/setInterval|setTimeout|useEffect/)
  })
})
