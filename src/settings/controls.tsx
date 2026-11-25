import { createMemo, createSignal, For, omit, Show, untrack } from 'solid-js'
import { dynamic, type JSX } from '@solidjs/web'
import { ChevronDown, type LucideIcon } from '@lucide/solid'

export function Section(props: { icon: LucideIcon; title: string; children: JSX.Element; defaultOpen?: boolean; aside?: JSX.Element }) {
  const [open, setOpen] = createSignal(untrack(() => props.defaultOpen ?? false))
  const Icon = dynamic(() => props.icon)
  return (
    <section class="border-b border-white/[0.06]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open() ? 'true' : 'false'}
        class="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.025]"
      >
        <Icon class="size-4 text-white/45" strokeWidth={1.75} />
        <span class="flex-1 text-[13px] font-semibold tracking-tight text-white/90">{props.title}</span>
        {props.aside}
        <ChevronDown class={`size-4 text-white/35 transition-transform duration-300 ${open() ? 'rotate-180' : ''}`} />
      </button>
      <Show when={open()}>
        <div class="space-y-5 px-5 pt-1 pb-6">{props.children}</div>
      </Show>
    </section>
  )
}

function Label(props: { children: JSX.Element; value?: JSX.Element }) {
  return (
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <span class="text-xs text-white/55">{props.children}</span>
      <Show when={props.value !== undefined}>
        <span class="font-mono text-[11px] text-white/85 tabular-nums">{props.value}</span>
      </Show>
    </div>
  )
}

export function Range(props: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; format?: (value: number) => string }) {
  const fill = createMemo(() => `${((props.value - props.min) / (props.max - props.min)) * 100}%`)
  return (
    <label class="block">
      <Label value={props.format?.(props.value) ?? props.value}>{props.label}</Label>
      <input
        type="range"
        class="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={(event) => props.onChange(event.currentTarget.valueAsNumber)}
        style={{ '--fill': fill() }}
      />
    </label>
  )
}

export function Toggle(props: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={props.checked ? 'true' : 'false'} onClick={() => props.onChange(!props.checked)} class="flex w-full items-center gap-3 text-left">
      <span class="flex-1">
        <span class="block text-[13px] text-white/85">{props.label}</span>
        <Show when={props.hint}>
          <span class="mt-0.5 block text-[11px] leading-snug text-white/40">{props.hint}</span>
        </Show>
      </span>
      <span
        class="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200"
        style={{ background: props.checked ? 'var(--ui-accent)' : 'rgb(255 255 255 / 0.12)' }}
      >
        <span
          class="absolute top-[3px] left-[3px] size-4 rounded-full shadow transition-transform duration-200"
          style={{ transform: props.checked ? 'translateX(16px)' : 'none', background: props.checked ? 'var(--ui-on-accent)' : '#fff' }}
        />
      </span>
    </button>
  )
}

interface Option<T extends string | number> {
  value: T
  label: string
}

export function Segmented<T extends string | number>(props: { label?: string; value: T; options: readonly Option<T>[]; onChange: (value: T) => void }) {
  return (
    <div>
      <Show when={props.label}><Label>{props.label}</Label></Show>
      <div class="flex rounded-lg bg-white/[0.05] p-0.5">
        <For each={props.options}>
          {(option) => (
            <button
              type="button"
              onClick={() => props.onChange(option.value)}
              class={`flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
                option.value === props.value ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/45 hover:text-white/80'
              }`}
            >
              {option.label}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

export function SelectField<T extends string>(props: { label: string; value: T; options: readonly Option<T>[]; onChange: (value: T) => void }) {
  return (
    <label class="block">
      <Label>{props.label}</Label>
      <div class="relative">
        <select onChange={(event) => props.onChange(event.currentTarget.value as T)} class="field appearance-none pr-8">
          <For each={props.options}>
            {(option) => <option value={option.value} selected={option.value === props.value} class="bg-[#141417]">{option.label}</option>}
          </For>
        </select>
        <ChevronDown class="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-white/40" />
      </div>
    </label>
  )
}

export function ColorField(props: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = createSignal<string | null>(null)
  return (
    <div>
      <Label>{props.label}</Label>
      <div class="flex items-center gap-2">
        <label class="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/10" style={{ background: props.value }}>
          <input type="color" value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} class="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <input
          value={draft() ?? props.value}
          onInput={(event) => {
            const value = event.currentTarget.value
            setDraft(value)
            if (/^#[0-9a-f]{6}$/i.test(value)) props.onChange(value.toLowerCase())
          }}
          onBlur={() => setDraft(null)}
          spellcheck={false}
          class="field font-mono uppercase"
        />
      </div>
    </div>
  )
}

export function TextField(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <label class="block">
      <Label>{props.label}</Label>
      <Show
        when={props.multiline}
        fallback={<input value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} placeholder={props.placeholder} class="field" />}
      >
        <textarea value={props.value} onInput={(event) => props.onChange(event.currentTarget.value)} placeholder={props.placeholder} rows={2} class="field resize-none leading-relaxed" />
      </Show>
    </label>
  )
}

const BUTTON_STYLES = {
  primary: 'bg-[var(--ui-accent)] text-[var(--ui-on-accent)] hover:brightness-110',
  ghost: 'bg-white/[0.06] text-white/85 hover:bg-white/[0.1]',
  danger: 'bg-[#ff5a5a]/10 text-[#ff8c8c] hover:bg-[#ff5a5a]/20',
}

export function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON_STYLES; icon?: LucideIcon }) {
  const Icon = dynamic(() => props.icon)
  return (
    <button
      type={props.type ?? 'button'}
      {...omit(props, 'type', 'variant', 'icon', 'children', 'class')}
      class={[
        'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-[12.5px] font-semibold transition disabled:pointer-events-none disabled:opacity-40',
        BUTTON_STYLES[props.variant ?? 'ghost'],
        props.class,
      ]}
    >
      <Icon class="size-3.5" strokeWidth={2} />
      {props.children}
    </button>
  )
}

export function IconButton(props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  const Icon = dynamic(() => props.icon)
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      {...omit(props, 'icon', 'label')}
      class="grid size-7 place-items-center rounded-md text-white/45 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-25"
    >
      <Icon class="size-3.5" strokeWidth={2} />
    </button>
  )
}
