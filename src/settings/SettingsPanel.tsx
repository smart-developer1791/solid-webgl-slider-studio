import { Layers, X } from '@lucide/solid'
import { useStudio } from '@/config/studio'
import { SlidesSection } from './SlidesSection'
import { AppearanceSection, AutoplaySection, DataSection, FxSection, InteractionSection, PresetsSection, TransitionSection } from './sections'

export function SettingsPanel(props: { open: boolean; onClose: () => void }) {
  const { webgl } = useStudio()
  return (
    <aside
      aria-label="Slider settings"
      aria-hidden={props.open ? 'false' : 'true'}
      inert={!props.open}
      class={`fixed inset-x-0 bottom-0 z-30 h-[66dvh] overflow-hidden rounded-t-2xl border-t border-white/10 bg-[#0e0e11]/95 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:h-full md:shrink-0 md:rounded-none md:border-t-0 md:shadow-none md:transition-[width] ${
        props.open ? 'translate-y-0 md:w-[380px] md:border-l' : 'translate-y-full md:w-0 md:translate-y-0'
      }`}
    >
      <div class="flex h-full w-full flex-col md:w-[380px]">
        <header class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <span class="grid size-8 place-items-center rounded-lg" style={{ background: 'var(--ui-accent)', color: 'var(--ui-on-accent)' }}>
            <Layers class="size-4" strokeWidth={2} />
          </span>
          <div class="flex-1">
            <p class="text-[13.5px] font-semibold tracking-tight text-white">Shader Slider</p>
            <p class="flex items-center gap-1.5 font-mono text-[10.5px] text-white/40">
              <span class={`size-1.5 rounded-full ${webgl() ? 'bg-[#3dff9e]' : 'bg-[#ffb14a]'}`} />
              {webgl() ? 'WebGL2 · studio' : 'WebGL unavailable — CSS mode'}
            </p>
          </div>
          <button type="button" onClick={() => props.onClose()} aria-label="Hide panel" class="grid size-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/[0.08] hover:text-white">
            <X class="size-4" />
          </button>
        </header>

        <div class="panel-scroll flex-1 overflow-y-auto overscroll-contain">
          <SlidesSection />
          <TransitionSection />
          <FxSection />
          <InteractionSection />
          <AutoplaySection />
          <AppearanceSection />
          <PresetsSection />
          <DataSection />
        </div>

        <footer class="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 font-mono text-[10.5px] text-white/35">
          <span>Autosave</span>
          <span>
            <kbd class="rounded border border-white/15 px-1 py-px text-white/60">H</kbd> hide panel
          </span>
        </footer>
      </div>
    </aside>
  )
}
