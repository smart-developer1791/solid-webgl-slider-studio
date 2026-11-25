import { createMemo, createSignal, For, onSettled, Show } from 'solid-js'
import { ChevronLeft, ChevronRight, ImagePlus } from '@lucide/solid'
import { useStudio } from '@/config/studio'
import type { AppearanceSettings } from '@/config/types'
import { Renderer } from '@/webgl/Renderer'
import { SliderEngine } from './engine'
import type { CaptionState } from './captions'
import { SlideCaption } from './SlideCaption'
import { SliderChrome } from './SliderChrome'

function overlayBackground(appearance: AppearanceSettings) {
  const k = (value: number) => `rgba(0,0,0,${(appearance.overlay * value).toFixed(3)})`
  switch (appearance.textPosition) {
    case 'bottomLeft':
      return `linear-gradient(to top, ${k(0.9)} 0%, ${k(0.35)} 45%, ${k(0.12)} 100%)`
    case 'middleLeft':
      return `linear-gradient(to right, ${k(0.85)} 0%, ${k(0.25)} 60%, ${k(0.05)} 100%)`
    case 'center':
      return `radial-gradient(ellipse at center, ${k(0.7)} 0%, ${k(0.3)} 75%)`
  }
}

export function WebGLSlider() {
  const studio = useStudio()
  let root!: HTMLDivElement
  let canvas!: HTMLCanvasElement
  let captionTimer = 0
  const [captions, setCaptions] = createSignal<(CaptionState & { leaving: boolean })[]>([
    { index: 0, key: 0, delay: 250, leaving: false },
  ])
  const appearance = createMemo(() => studio.config().appearance)
  const slides = createMemo(() => studio.config().slides)
  const drag = createMemo(() => studio.config().interaction.drag && slides().length > 1)

  function showCaption(index: number, delay: number) {
    setCaptions((items) => {
      const current = items[items.length - 1]
      return [{ ...current, leaving: true }, { index, key: current.key + 1, delay, leaving: false }]
    })
    window.clearTimeout(captionTimer)
    captionTimer = window.setTimeout(() => {
      setCaptions((items) => items.filter((item) => !item.leaving))
    }, 650)
  }

  onSettled(() => {
    const renderer = Renderer.create(canvas)
    studio.setWebgl(!!renderer)
    if (renderer) {
      renderer.onTextureStatus = (url, status) => studio.setStatuses((current) => ({ ...current, [url]: status }))
    }
    const engine = new SliderEngine(renderer, studio.config(), {
      onIndex(index) {
        studio.setActive(index)
        if (captions().at(-1)?.index !== index) showCaption(index, 0)
      },
      onTransitionStart(index, duration) {
        showCaption(index, Math.round(duration * 0.42))
      },
    })
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => { engine.reducedMotion = motion.matches }
    onMotion()
    motion.addEventListener('change', onMotion)
    engine.attach(root)
    studio.setEngine(engine)
    return () => {
      window.clearTimeout(captionTimer)
      motion.removeEventListener('change', onMotion)
      engine.destroy()
      studio.setEngine(null)
    }
  })

  return (
    <div
      ref={root}
      data-drag={drag() ? 'true' : 'false'}
      data-cursor-on={studio.config().fx.cursor ? 'true' : 'false'}
      class="slider-root relative h-full w-full overflow-hidden bg-[#0b0b0d] select-none"
      style={{ 'touch-action': 'pan-y', 'container-type': 'inline-size' }}
      aria-roledescription="carousel"
    >
      <canvas ref={canvas} class="absolute inset-0 block h-full w-full" />
      <Show when={!studio.webgl()}>
        <For each={studio.urls()} keyed={false}>
          {(url, index) => (
            <Show when={url()}>
              <img src={url()} alt="" draggable={false} class="absolute inset-0 size-full object-cover transition-opacity duration-700" style={{ opacity: index === studio.active() ? 1 : 0 }} />
            </Show>
          )}
        </For>
      </Show>
      <div class="pointer-events-none absolute inset-0" style={{ background: overlayBackground(appearance()) }} />
      <Show
        when={slides().length > 0}
        fallback={
          <div class="absolute inset-0 grid place-items-center p-8 text-center">
            <div class="flex max-w-xs flex-col items-center gap-4 text-white/60">
              <span class="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/5"><ImagePlus class="size-6" /></span>
              <p class="text-sm leading-relaxed">No slides yet. Add images in the Slides section of the panel.</p>
            </div>
          </div>
        }
      >
        <div data-parallax class="pointer-events-none absolute inset-0 will-change-transform">
          <For each={captions()} keyed={(caption) => caption.key}>
            {(item) => (
              <Show when={slides()[item().index]}>
                {(slide) => <SlideCaption slide={slide()} appearance={appearance()} delay={item().delay} leaving={item().leaving} />}
              </Show>
            )}
          </For>
        </div>
      </Show>
      <SliderChrome />
      <Show when={studio.config().fx.cursor}>
        <div data-cursor data-state="idle" aria-hidden="true" class="custom-cursor pointer-events-none absolute top-0 left-0 z-30" style={{ opacity: 0 }}>
          <div class="cursor-ring">
            <Show when={drag()}>
              <ChevronLeft class="size-3" strokeWidth={2.5} />
              <span>Drag</span>
              <ChevronRight class="size-3" strokeWidth={2.5} />
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}
