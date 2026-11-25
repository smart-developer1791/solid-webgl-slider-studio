import { createMemo, createSignal, For, onSettled, Show } from 'solid-js'
import { Bookmark, Clapperboard, Database, Download, MousePointer2, Palette, Play, Plus, RotateCcw, Timer, Trash2, Upload, Wand2 } from '@lucide/solid'
import { useStudio } from '@/config/studio'
import { createId, defaultConfig } from '@/config/defaults'
import { BUILT_IN_PRESETS } from '@/config/presets'
import { exportConfig, importConfig, loadPresets, pickSettings, savePresets } from '@/config/storage'
import { EASING_IDS, EFFECT_IDS, type Preset } from '@/config/types'
import { EFFECTS } from '@/webgl/effects'
import { EASING_LABELS } from '@/webgl/easing'
import { FONTS } from '@/slider/captions'
import { Button, ColorField, IconButton, Range, Section, Segmented, SelectField, Toggle } from './controls'
import { percent, seconds } from './formats'

const easingOptions = EASING_IDS.map((id) => ({ value: id, label: EASING_LABELS[id] }))
const fonts = Object.entries(FONTS).map(([id, font]) => ({ value: id as keyof typeof FONTS, label: font.label }))
const fmtParam = (v: number, step: number) => (step >= 1 ? String(v) : v.toFixed(step >= 0.01 ? 2 : 3))

export function TransitionSection() {
  const { config, patch, dispatch, engine } = useStudio()
  const t = createMemo(() => config().transition)
  const def = createMemo(() => EFFECTS[t().effect])
  const params = createMemo(() => config().effectParams[t().effect])

  return (
    <Section icon={Wand2} title="Transition" defaultOpen>
      <div class="grid grid-cols-2 gap-1.5">
        <For each={EFFECT_IDS}>
          {(id) => {
            const selected = () => id === t().effect
            return (
              <button
                type="button"
                onClick={() => {
                  patch('transition', { effect: id })
                  onSettled(() => { engine()?.replay() })
              }}
              class={`rounded-lg border px-3 py-2.5 text-left transition-colors ${selected() ? 'bg-white/[0.06]' : 'border-white/[0.06] hover:border-white/15 hover:bg-white/[0.025]'}`}
              style={selected() ? { 'border-color': 'var(--ui-accent)' } : undefined}
            >
              <span class="block text-[12.5px] font-semibold text-white/90">{EFFECTS[id].name}</span>
              <span class="mt-0.5 block text-[10.5px] leading-snug text-white/40">{EFFECTS[id].description}</span>
            </button>
          )
          }}
        </For>
      </div>

      <Toggle
        label="Random effect"
        hint="A new effect for each transition, with no consecutive repeats"
        checked={t().random}
        onChange={(v) => patch('transition', { random: v })}
      />

      <Button variant="primary" icon={Play} class="w-full" disabled={config().slides.length < 2} onClick={() => engine()?.replay()}>
        Play transition
      </Button>

      <Range label="Duration" value={t().duration} min={300} max={3000} step={50} format={seconds} onChange={(v) => patch('transition', { duration: v })} />
      <SelectField label="Easing curve" value={t().easing} options={easingOptions} onChange={(v) => patch('transition', { easing: v })} />
      <Range label="Intensity" value={t().intensity} min={0} max={2} step={0.01} format={percent} onChange={(v) => patch('transition', { intensity: v })} />

      <div class="space-y-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p class="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">Parameters · {def().name}</p>
        <For each={def().params}>
          {(p, i) =>
            p.options ? (
              <Segmented
                label={p.label}
                value={params()[i()]}
                options={p.options.map((label, k) => ({ value: k, label }))}
                onChange={(v) => dispatch({ type: 'effectParam', effect: t().effect, index: i(), value: v })}
              />
            ) : (
              <Range
                label={p.label}
                value={params()[i()]}
                min={p.min}
                max={p.max}
                step={p.step}
                format={(v) => fmtParam(v, p.step)}
                onChange={(v) => dispatch({ type: 'effectParam', effect: t().effect, index: i(), value: v })}
              />
            )}
        </For>
        <Show when={t().effect === 'dissolve'}>
          <ColorField label="Edge color" value={t().edgeColor} onChange={(v) => patch('transition', { edgeColor: v })} />
        </Show>
        <button
          type="button"
          class="text-[11px] text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
          onClick={() => def().params.forEach((p, i) => dispatch({ type: 'effectParam', effect: t().effect, index: i, value: p.default }))}
        >
          Reset effect parameters
        </button>
      </div>
    </Section>
  )
}

export function FxSection() {
  const { config, patch } = useStudio()
  const fx = createMemo(() => config().fx)
  const set = (v: Partial<ReturnType<typeof fx>>) => patch('fx', v)
  return (
    <Section icon={Clapperboard} title="Cinematic effects" defaultOpen>
      <Range label="Ken Burns — slow zoom" value={fx().kenBurns} min={0} max={1} step={0.01} format={percent} onChange={(v) => set({ kenBurns: v })} />
      <Range label="Depth parallax" value={fx().parallax} min={0} max={1} step={0.01} format={percent} onChange={(v) => set({ parallax: v })} />
      <Range label="Ambient motion" value={fx().ambient} min={0} max={1} step={0.01} format={percent} onChange={(v) => set({ ambient: v })} />
      <Range label="Lens aberration" value={fx().chroma} min={0} max={1} step={0.01} format={percent} onChange={(v) => set({ chroma: v })} />
      <Toggle label="Custom cursor" hint="A Drag ring that shrinks over buttons" checked={fx().cursor} onChange={(v) => set({ cursor: v })} />
    </Section>
  )
}

export function InteractionSection() {
  const { config, patch } = useStudio()
  const it = createMemo(() => config().interaction)
  const set = (v: Partial<ReturnType<typeof it>>) => patch('interaction', v)
  return (
    <Section icon={MousePointer2} title="Interaction">
      <Toggle label="Cursor distortion" hint="Lens and RGB shift driven by pointer speed" checked={it().hover} onChange={(v) => set({ hover: v })} />
      <Show when={it().hover}>
        <Range label="Strength" value={it().hoverStrength} min={0} max={2} step={0.01} format={percent} onChange={(v) => set({ hoverStrength: v })} />
        <Range label="Radius" value={it().hoverRadius} min={0.05} max={1} step={0.01} format={(v) => v.toFixed(2)} onChange={(v) => set({ hoverRadius: v })} />
      </Show>
      <Toggle label="Drag and swipe" hint="The transition follows your finger with inertia" checked={it().drag} onChange={(v) => set({ drag: v })} />
      <Show when={it().drag}><Range label="Sensitivity" value={it().dragSensitivity} min={0.3} max={3} step={0.05} format={(v) => `×${v.toFixed(2)}`} onChange={(v) => set({ dragSensitivity: v })} /></Show>
      <Toggle label="Mouse wheel and trackpad" checked={it().wheel} onChange={(v) => set({ wheel: v })} />
      <Toggle label="Arrow keys ← →" checked={it().keyboard} onChange={(v) => set({ keyboard: v })} />
      <Toggle label="Infinite loop" checked={it().loop} onChange={(v) => set({ loop: v })} />
    </Section>
  )
}

export function AutoplaySection() {
  const { config, patch } = useStudio()
  const ap = createMemo(() => config().autoplay)
  return (
    <Section icon={Timer} title="Autoplay" aside={<span class="font-mono text-[11px] text-white/35">{ap().enabled ? 'on' : 'off'}</span>}>
      <Toggle label="Enable autoplay" checked={ap().enabled} onChange={(v) => patch('autoplay', { enabled: v })} />
      <Range label="Interval" value={ap().interval} min={1500} max={12000} step={250} format={seconds} onChange={(v) => patch('autoplay', { interval: v })} />
      <Toggle label="Pause on hover" checked={ap().pauseOnHover} onChange={(v) => patch('autoplay', { pauseOnHover: v })} />
    </Section>
  )
}

export function AppearanceSection() {
  const { config, patch } = useStudio()
  const a = createMemo(() => config().appearance)
  const set = (v: Partial<ReturnType<typeof a>>) => patch('appearance', v)
  return (
    <Section icon={Palette} title="Appearance">
      <Segmented label="Heading font" value={a().font} options={fonts} onChange={(v) => set({ font: v })} />
      <Segmented
        label="Text entrance"
        value={a().textAnimation}
        options={[
          { value: 'letters', label: 'Letters' },
          { value: 'fadeUp', label: 'Fade up' },
          { value: 'blurIn', label: 'Blur in' },
        ]}
        onChange={(v) => set({ textAnimation: v })}
      />
      <Segmented
        label="Text position"
        value={a().textPosition}
        options={[
          { value: 'bottomLeft', label: 'Bottom' },
          { value: 'middleLeft', label: 'Left' },
          { value: 'center', label: 'Center' },
        ]}
        onChange={(v) => set({ textPosition: v })}
      />
      <Range label="Text size" value={a().textScale} min={0.5} max={1.6} step={0.01} format={percent} onChange={(v) => set({ textScale: v })} />
      <div class="grid grid-cols-2 gap-3">
        <ColorField label="Text color" value={a().textColor} onChange={(v) => set({ textColor: v })} />
        <ColorField label="Accent" value={a().accent} onChange={(v) => set({ accent: v })} />
      </div>
      <Range label="Text backdrop" value={a().overlay} min={0} max={1} step={0.01} format={percent} onChange={(v) => set({ overlay: v })} />
      <Range label="Film grain" value={a().grain} min={0} max={1} step={0.01} format={percent} onChange={(v) => set({ grain: v })} />
      <Range label="Vignette" value={a().vignette} min={0} max={1} step={0.01} format={percent} onChange={(v) => set({ vignette: v })} />
      <Segmented
        label="Indicator"
        value={a().indicator}
        options={[
          { value: 'progress', label: 'Progress' },
          { value: 'dots', label: 'Dots' },
          { value: 'none', label: 'None' },
        ]}
        onChange={(v) => set({ indicator: v })}
      />
      <Toggle label="Arrows" checked={a().arrows} onChange={(v) => set({ arrows: v })} />
      <Toggle label="Slide counter" checked={a().counter} onChange={(v) => set({ counter: v })} />
    </Section>
  )
}

export function PresetsSection() {
  const { config, dispatch, notify } = useStudio()
  const [custom, setCustom] = createSignal(loadPresets())
  const [name, setName] = createSignal('')

  const apply = (p: Preset) => {
    dispatch({ type: 'applyPreset', settings: p.settings })
    notify(`Preset “${p.name}” applied`)
  }
  const persist = (list: Preset[]) => {
    setCustom(list)
    if (!savePresets(list)) notify('Could not save the preset', 'error')
  }

  return (
    <Section icon={Bookmark} title="Presets">
      <div class="grid grid-cols-2 gap-1.5">
        <For each={BUILT_IN_PRESETS}>
          {(p) => (
            <button
              type="button"
              onClick={() => apply(p)}
              class="group flex items-center gap-2.5 rounded-lg border border-white/[0.06] p-2 text-left transition-colors hover:border-white/15 hover:bg-white/[0.03]"
            >
              <span
                class="size-8 shrink-0 rounded-md"
                style={{ background: `radial-gradient(circle at 30% 30%, ${p.settings.appearance.accent}, #111 75%)` }}
              />
              <span class="min-w-0">
                <span class="block text-[12.5px] font-semibold text-white/90">{p.name}</span>
                <span class="block truncate text-[10.5px] text-white/40">{EFFECTS[p.settings.transition.effect].name}</span>
              </span>
            </button>
          )}
        </For>
      </div>

      <Show when={custom().length > 0}>
        <ul class="space-y-1">
          <For each={custom()}>
            {(p) => (
              <li class="flex items-center gap-2 rounded-lg bg-white/[0.03] py-1 pr-1 pl-3">
                <button type="button" onClick={() => apply(p)} class="flex-1 truncate text-left text-[12.5px] text-white/85 hover:text-white">
                  {p.name}
                </button>
                <IconButton icon={Trash2} label="Delete preset" onClick={() => persist(custom().filter((c) => c.id !== p.id))} />
              </li>
            )}
          </For>
        </ul>
      </Show>

      <form
        class="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const preset = { id: createId(), name: name().trim() || `My preset ${custom().length + 1}`, settings: pickSettings(config()) }
          persist([...custom(), preset])
          setName('')
          notify(`Preset “${preset.name}” saved`)
        }}
      >
        <input value={name()} onInput={(e) => setName(e.currentTarget.value)} placeholder="Preset name" class="field flex-1" />
        <Button type="submit" icon={Plus}>
          Save
        </Button>
      </form>
    </Section>
  )
}

export function DataSection() {
  const { config, dispatch, notify } = useStudio()
  let fileInput: HTMLInputElement | undefined
  const [busy, setBusy] = createSignal(false)

  async function doExport() {
    setBusy(true)
    try {
      const blob = await exportConfig(config())
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'webgl-slider.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    } catch {
      notify('Could not export the configuration', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function doImport(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      dispatch({ type: 'replace', config: await importConfig(await file.text()) })
      notify('Configuration imported')
    } catch (e) {
      notify(e instanceof SyntaxError ? 'The file is not valid JSON' : e instanceof Error ? e.message : 'Import failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section icon={Database} title="Data">
      <p class="text-[11.5px] leading-relaxed text-white/45">
        Settings are saved automatically in this browser. Export creates a JSON file including uploaded images.
      </p>
      <div class="grid grid-cols-2 gap-2">
        <Button icon={Download} disabled={busy()} onClick={doExport}>
          Export
        </Button>
        <Button icon={Upload} disabled={busy()} onClick={() => fileInput?.click()}>
          Import
        </Button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => { doImport(e.currentTarget.files?.[0]); e.currentTarget.value = '' }} />
      <Button
        variant="danger"
        icon={RotateCcw}
        class="w-full"
        onClick={() => {
          if (window.confirm('Reset all settings and slides to their defaults?')) {
            dispatch({ type: 'replace', config: defaultConfig() })
            notify('Settings reset')
          }
        }}
      >
        Reset all
      </Button>
    </Section>
  )
}
