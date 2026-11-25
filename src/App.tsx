import { createMemo, createSignal, onSettled, Show } from 'solid-js'
import { Maximize2, Minimize2, SlidersHorizontal } from '@lucide/solid'
import { SettingsPanel } from '@/settings/SettingsPanel'
import { StudioProvider, useStudio } from '@/config/studio'
import { contrastText } from '@/lib/color'
import { WebGLSlider } from '@/slider/WebGLSlider'

function Studio() {
  const { config, notify } = useStudio()
  let main: HTMLElement | undefined
  const [fullscreen, setFullscreen] = createSignal(false)
  const [panelOpen, setPanelOpen] = createSignal(window.matchMedia('(min-width: 768px)').matches)
  const accent = createMemo(() => config().appearance.accent)

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
      return
    }
    if (!main?.requestFullscreen || !document.fullscreenEnabled) {
      notify('Fullscreen is unavailable in this window — open the preview in a separate tab', 'error')
      return
    }
    void main.requestFullscreen().catch(() => notify('The browser blocked fullscreen mode', 'error'))
  }

  function updateFullscreen() {
    setFullscreen(document.fullscreenElement === main)
  }

  function onKey(event: KeyboardEvent) {
    if ((event.code !== 'KeyH' && event.code !== 'KeyF') || event.metaKey || event.ctrlKey || event.altKey) return
    if ((event.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')) return
    if (event.code === 'KeyF') toggleFullscreen()
    else setPanelOpen((open) => !open)
  }

  onSettled(() => {
    document.addEventListener('fullscreenchange', updateFullscreen)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreen)
      window.removeEventListener('keydown', onKey)
    }
  })

  return (
    <div
      class="flex h-dvh w-full overflow-hidden bg-[#08080a] font-sans text-white"
      style={{ '--ui-accent': accent(), '--ui-on-accent': contrastText(accent()) }}
    >
      <main ref={main} class="relative h-full min-w-0 flex-1 bg-[#08080a]">
        <WebGLSlider />
        <div class="absolute top-5 right-5 z-20 flex gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen() ? 'Exit fullscreen' : 'Fullscreen'}
            title={fullscreen() ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            class="grid size-10 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-xl transition hover:bg-black/50"
          >
            <Show when={fullscreen()} fallback={<Maximize2 class="size-4" />}>
              <Minimize2 class="size-4" />
            </Show>
          </button>
          <Show when={!panelOpen() && !fullscreen()}>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              class="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/30 pr-4 pl-3.5 text-[13px] font-medium text-white backdrop-blur-xl transition hover:bg-black/50"
            >
              <SlidersHorizontal class="size-4" />
              Settings
              <kbd class="ml-1 hidden rounded border border-white/20 px-1 font-mono text-[10px] text-white/60 md:inline">H</kbd>
            </button>
          </Show>
        </div>
      </main>
      <SettingsPanel open={panelOpen()} onClose={() => setPanelOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <StudioProvider>
      <Studio />
    </StudioProvider>
  )
}
