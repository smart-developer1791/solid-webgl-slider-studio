import { createContext, createEffect, createMemo, createSignal, Show, useContext } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { CircleAlert, CircleCheck } from '@lucide/solid'
import type { SliderEngine } from '@/slider/engine'
import type { TextureStatus } from '@/webgl/Renderer'
import { reducer, type Action, type SectionKey } from './reducer'
import { loadConfig, resolveImage, resolveSync, saveConfig } from './storage'
import type { SliderConfig } from './types'

type ToastKind = 'success' | 'error'

function sameUrls(a: string[], b: string[]) {
  return a.length === b.length && a.every((url, index) => url === b[index])
}

function createStudio() {
  const [config, setConfig] = createSignal(loadConfig())
  const [engine, setEngine] = createSignal<SliderEngine | null>(null)
  const [active, setActive] = createSignal(0)
  const [webgl, setWebgl] = createSignal(true)
  const [statuses, setStatuses] = createSignal<Record<string, TextureStatus>>({})
  const [toast, setToast] = createSignal<{ message: string; kind: ToastKind } | null>(null)
  const [urls, setUrls] = createSignal<string[]>([], { equals: sameUrls })
  const sources = createMemo(() => config().slides.map((slide) => slide.image), { equals: sameUrls })

  function dispatch(action: Action) {
    setConfig((current) => reducer(current, action))
  }

  function patch<K extends SectionKey>(section: K, value: Partial<SliderConfig[K]>) {
    dispatch({ type: 'patch', section, value })
  }

  function notify(message: string, kind: ToastKind = 'success') {
    setToast({ message, kind })
  }

  createEffect(config, (current) => {
    const timer = window.setTimeout(() => {
      if (!saveConfig(current)) notify('Browser storage is full — settings were not saved', 'error')
    }, 300)
    return () => window.clearTimeout(timer)
  })
  createEffect(() => [engine(), config()] as const, ([slider, current]) => slider?.setConfig(current))
  createEffect(() => [engine(), urls()] as const, ([slider, current]) => slider?.setUrls(current))

  createEffect(sources, (current) => {
    const sync = current.map(resolveSync)
    setUrls(sync.map((url) => url ?? ''))
    if (!sync.some((url) => url === null)) return
    let cancelled = false
    void Promise.all(current.map(resolveImage)).then((resolved) => {
      if (!cancelled) setUrls(resolved)
    })
    return () => { cancelled = true }
  })

  createEffect(toast, (current) => {
    if (!current) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  })

  return {
    config, engine, setEngine, active, setActive, webgl, setWebgl,
    statuses, setStatuses, toast, urls, dispatch, patch, notify,
  }
}

const StudioContext = createContext<ReturnType<typeof createStudio>>()

export function StudioProvider(props: { children: JSX.Element }) {
  const studio = createStudio()
  return (
    <StudioContext value={studio}>
      {props.children}
      <Show when={studio.toast()} keyed>
        {(toast) => (
          <div role="status" class="toast fixed bottom-5 left-5 z-50 flex max-w-sm items-center gap-2.5 rounded-xl border border-white/10 bg-[#141417]/95 px-4 py-3 text-[13px] text-white shadow-2xl backdrop-blur-xl">
            <Show when={toast.kind === 'error'} fallback={<CircleCheck class="size-4 shrink-0" style={{ color: 'var(--ui-accent)' }} />}>
              <CircleAlert class="size-4 shrink-0 text-[#ff6b6b]" />
            </Show>
            {toast.message}
          </div>
        )}
      </Show>
    </StudioContext>
  )
}

export function useStudio() {
  const studio = useContext(StudioContext)
  if (!studio) throw new Error('useStudio must be used inside StudioProvider')
  return studio
}
