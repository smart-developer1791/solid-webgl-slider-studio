import { createMemo, For, Show } from 'solid-js'
import { ArrowLeft, ArrowRight } from '@lucide/solid'
import { useStudio } from '@/config/studio'

const pad = (value: number) => String(value).padStart(2, '0')

export function SliderChrome() {
  const { config, active, engine } = useStudio()
  const look = createMemo(() => config().appearance)
  const count = createMemo(() => config().slides.length)
  const indexes = createMemo(() => Array.from({ length: count() }, (_, index) => index))
  const autoplay = createMemo(() => config().autoplay.enabled)
  const loop = createMemo(() => config().interaction.loop)
  const arrows = [
    { label: 'Previous slide', icon: ArrowLeft, enabled: () => loop() || active() > 0, run: () => engine()?.prev() },
    { label: 'Next slide', icon: ArrowRight, enabled: () => loop() || active() < count() - 1, run: () => engine()?.next() },
  ]

  return (
    <>
      <Show when={look().counter && count() > 0}>
        <div class="pointer-events-none absolute top-6 left-6 flex items-baseline gap-2 font-mono text-white md:top-9 md:left-[5.5cqw]">
          <span class="text-sm">{pad(active() + 1)}</span>
          <span class="h-px w-6 self-center bg-white/40" />
          <span class="text-[11px] text-white/50">{pad(count())}</span>
        </div>
      </Show>
      <Show when={look().indicator !== 'none' && count() > 1}>
        <div data-no-drag class="absolute bottom-6 left-6 flex items-center md:bottom-9 md:left-[5.5cqw]">
          <Show
            when={look().indicator === 'progress'}
            fallback={
              <div class="flex items-center gap-2">
                <For each={indexes()}>
                  {(index) => (
                    <button
                      type="button"
                      aria-label={`Slide ${index + 1}`}
                      onClick={() => engine()?.goTo(index)}
                      class="relative h-2 overflow-hidden rounded-full bg-white/30 transition-[width,background-color] duration-500 hover:bg-white/60"
                      style={{ width: index === active() ? '36px' : '8px' }}
                    >
                      <Show when={index === active()}>
                        <span
                          data-active-fill={autoplay() ? '' : undefined}
                          class="absolute inset-0 origin-left"
                          style={{ background: look().accent, transform: autoplay() ? 'scaleX(0)' : 'scaleX(1)' }}
                        />
                      </Show>
                    </button>
                  )}
                </For>
              </div>
            }
          >
            <div class="flex w-[min(42cqw,22rem)] gap-1.5">
              <For each={indexes()}>
                {(index) => (
                  <button type="button" aria-label={`Slide ${index + 1}`} onClick={() => engine()?.goTo(index)} class="group flex-1 py-3">
                    <span class="block h-[2px] overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/50">
                      <span
                        data-active-fill={index === active() && autoplay() ? '' : undefined}
                        class="block h-full origin-left"
                        style={{ background: look().accent, transform: index === active() && !autoplay() ? 'scaleX(1)' : 'scaleX(0)' }}
                      />
                    </span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
      <Show when={look().arrows && count() > 1}>
        <div data-no-drag class="absolute right-6 bottom-6 flex gap-2 md:right-[5.5cqw] md:bottom-9">
          <For each={arrows}>
            {(arrow) => {
              const Icon = arrow.icon
              return (
                <button
                  type="button"
                  aria-label={arrow.label}
                  disabled={!arrow.enabled()}
                  onClick={arrow.run}
                  class="grid size-12 place-items-center rounded-full border border-white/20 bg-black/15 text-white backdrop-blur-md transition hover:border-transparent hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-30"
                >
                  <Icon class="size-[18px]" strokeWidth={1.75} />
                </button>
              )
            }}
          </For>
        </div>
      </Show>
    </>
  )
}
