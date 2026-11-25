import { createMemo, For, Show } from 'solid-js'
import { ArrowUpRight } from '@lucide/solid'
import type { AppearanceSettings, Slide, TextPosition } from '@/config/types'
import { contrastText } from '@/lib/color'
import { FONTS } from './captions'

const POSITION: Record<TextPosition, { wrap: string; inner: string }> = {
  bottomLeft: { wrap: 'items-end justify-start text-left pb-24 md:pb-28', inner: 'items-start max-w-[min(64rem,80cqw)]' },
  middleLeft: { wrap: 'items-center justify-start text-left', inner: 'items-start max-w-[min(56rem,64cqw)]' },
  center: { wrap: 'items-center justify-center text-center', inner: 'items-center max-w-[min(64rem,82cqw)]' },
}

export function SlideCaption(props: { slide: Slide; appearance: AppearanceSettings; delay: number; leaving: boolean }) {
  const position = createMemo(() => POSITION[props.appearance.textPosition])
  const font = createMemo(() => FONTS[props.appearance.font])
  const letters = createMemo(() => props.appearance.textAnimation === 'letters')
  const words = createMemo(() => {
    let index = 0
    return props.slide.title.split(' ').map((word) => Array.from(word, (text) => ({ text, index: index++ })))
  })
  const external = createMemo(() => /^https?:\/\//i.test(props.slide.buttonUrl))
  const href = createMemo(() => {
    const url = props.slide.buttonUrl
    // Match the original protection for script URLs in editable links.
    return /^javascript:/i.test(url.replace(/[\t\r\n]/g, '').replace(/^[\u0000-\u0020]+/, '')) ? '#' : url || '#'
  })

  return (
    <div class={`absolute inset-0 flex px-6 pt-20 md:px-[5.5cqw] ${position().wrap}`}>
      <div
        class={`caption cap-${props.appearance.textAnimation} ${props.leaving ? 'cap-leave' : ''} flex flex-col ${position().inner}`}
        style={{ '--d': `${props.delay}ms`, color: props.appearance.textColor }}
      >
        <Show when={props.slide.title}>
          <h2
            class={letters() ? "text-balance" : "cap-item text-balance"}
            style={{
              '--i': 0,
              'font-family': font().family,
              'font-weight': font().weight,
              'letter-spacing': font().tracking,
              'line-height': font().leading,
              'font-size': `calc(clamp(2.25rem, ${font().size}cqw, 9.5rem) * ${props.appearance.textScale})`,
            }}
          >
            <Show when={letters()} fallback={props.slide.title}>
              <For each={words()} keyed={false}>
                {(word, i) => (
                  <>
                    {i ? ' ' : ''}
                    <span class="inline-block whitespace-nowrap">
                      <For each={word()} keyed={false}>
                        {(letter) => <span class="cap-char" style={{ '--c': letter().index }}>{letter().text}</span>}
                      </For>
                    </span>
                  </>
                )}
              </For>
            </Show>
          </h2>
        </Show>
        <Show when={props.slide.subtitle}>
          <p class="cap-item mt-5 max-w-[34rem] text-[clamp(0.95rem,1.3cqw,1.2rem)] leading-relaxed text-pretty opacity-80" style={{ '--i': 2 }}>
            {props.slide.subtitle}
          </p>
        </Show>
        <Show when={props.slide.buttonText}>
          <a
            data-no-drag
            href={href()}
            target={external() ? '_blank' : undefined}
            rel={external() ? 'noreferrer' : undefined}
            class="cap-item pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-6 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-[0.98]"
            style={{ '--i': 3, background: props.appearance.accent, color: contrastText(props.appearance.accent) }}
          >
            {props.slide.buttonText}
            <span class="grid size-8 place-items-center rounded-full bg-black/15"><ArrowUpRight class="size-4" /></span>
          </a>
        </Show>
      </div>
    </div>
  )
}
