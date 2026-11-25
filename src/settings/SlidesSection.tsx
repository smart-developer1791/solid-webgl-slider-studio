import { createMemo, createSignal, For, Show } from 'solid-js'
import { ChevronDown, ChevronUp, GripVertical, ImageOff, ImagePlus, Images, Link2, Pencil, Trash2 } from '@lucide/solid'
import { useStudio } from '@/config/studio'
import { newSlide } from '@/config/defaults'
import { deleteImage, putImage } from '@/config/storage'
import { EFFECT_IDS, type SlideEffect } from '@/config/types'
import { EFFECTS } from '@/webgl/effects'
import { Button, IconButton, Section, SelectField, TextField } from './controls'

const EFFECT_OPTIONS: { value: SlideEffect; label: string }[] = [
  { value: 'inherit', label: 'Use transition settings' },
  ...EFFECT_IDS.map((id) => ({ value: id, label: EFFECTS[id].name })),
]

function effectName(effect: SlideEffect) {
  return effect === 'inherit' ? 'Global effect' : EFFECTS[effect].name
}

export function SlidesSection() {
  const { config, dispatch, notify, urls, statuses, active, engine } = useStudio()
  const [expanded, setExpanded] = createSignal<string | null>(null)
  const [dragFrom, setDragFrom] = createSignal<number | null>(null)
  const [dropOver, setDropOver] = createSignal(false)
  const [url, setUrl] = createSignal('')
  let fileInput: HTMLInputElement | undefined
  const slides = createMemo(() => config().slides)

  async function addFiles(files: FileList | null) {
    const images = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'))
    if (!images.length) return
    try {
      const added = await Promise.all(
        images.map(async (f) => ({ ...newSlide(await putImage(f)), title: f.name.replace(/\.[^.]+$/, '') })),
      )
      dispatch({ type: 'addSlides', slides: added })
      notify(added.length > 1 ? `Slides added: ${added.length}` : 'Slide added')
    } catch {
      notify('Could not save the image in this browser', 'error')
    }
  }

  function addUrl() {
    const value = url().trim()
    if (!/^https?:\/\/\S+$/i.test(value)) {
      notify('Enter a URL starting with http:// or https://', 'error')
      return
    }
    dispatch({ type: 'addSlides', slides: [newSlide(value)] })
    setUrl('')
  }

  function remove(index: number) {
    const current = slides()
    const slide = current[index]
    dispatch({ type: 'removeSlide', id: slide.id })
    if (!current.some((s, i) => i !== index && s.image === slide.image)) void deleteImage(slide.image)
  }

  return (
    <Section icon={Images} title="Slides" defaultOpen aside={<span class="font-mono text-[11px] text-white/35">{slides().length}</span>}>
      <Show when={slides().length > 0}>
        <ul class="space-y-1.5">
          <For each={slides()} keyed={(slide) => slide.id}>
            {(slide, index) => {
              const source = () => urls()[index()]
              const status = () => source() ? statuses()[source()] : 'error'
              const isActive = () => index() === active()
              const open = () => expanded() === slide().id
              return (
                  <li
                    draggable="true"
                    onDragStart={(e) => {
                      setDragFrom(index())
                      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => dragFrom() !== null && e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const from = dragFrom()
                      if (from !== null) dispatch({ type: 'moveSlide', from, to: index() })
                      setDragFrom(null)
                    }}
                    onDragEnd={() => setDragFrom(null)}
                    class={`rounded-xl border transition-colors ${dragFrom() === index() ? 'opacity-40' : ''} ${
                      isActive() ? 'bg-white/[0.045]' : 'border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                    style={isActive() ? { 'border-color': 'color-mix(in srgb, var(--ui-accent) 55%, transparent)' } : undefined}
                  >
                    <div class="flex items-center gap-2.5 p-2">
                      <GripVertical class="size-3.5 shrink-0 cursor-grab text-white/20" />
                      <button
                        type="button"
                        onClick={() => engine()?.goTo(index())}
                        title="Show slide"
                        class="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-white/5"
                      >
                        <Show when={source() && status() !== 'error'}>
                          <img src={source()} alt="" draggable={false} class="size-full object-cover" />
                        </Show>
                        <Show when={status() === 'error'}>
                          <span class="absolute inset-0 grid place-items-center bg-[#ff5a5a]/15 text-[#ff8c8c]">
                            <ImageOff class="size-4" />
                          </span>
                        </Show>
                        <span class="absolute top-1 left-1 rounded bg-black/55 px-1 font-mono text-[9px] text-white">{index() + 1}</span>
                      </button>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-[13px] font-medium text-white/90">{slide().title || 'Untitled'}</p>
                        <p class={`truncate text-[11px] ${status() === 'error' ? 'text-[#ff8c8c]' : 'text-white/40'}`}>
                          {status() === 'error' ? 'Image failed to load' : effectName(slide().effect)}
                        </p>
                      </div>
                      <div class="flex shrink-0">
                        <IconButton icon={ChevronUp} label="Move up" disabled={index() === 0} onClick={() => dispatch({ type: 'moveSlide', from: index(), to: index() - 1 })} />
                        <IconButton icon={ChevronDown} label="Move down" disabled={index() === slides().length - 1} onClick={() => dispatch({ type: 'moveSlide', from: index(), to: index() + 1 })} />
                        <IconButton icon={Pencil} label="Edit" aria-expanded={open() ? 'true' : 'false'} onClick={() => setExpanded(open() ? null : slide().id)} />
                        <IconButton icon={Trash2} label="Delete" onClick={() => remove(index())} />
                      </div>
                    </div>
                    <Show when={open()}>
                      <div class="space-y-3.5 border-t border-white/[0.06] p-3">
                        <TextField label="Title" value={slide().title} onChange={(v) => dispatch({ type: 'updateSlide', id: slide().id, value: { title: v } })} />
                        <TextField label="Subtitle" multiline value={slide().subtitle} onChange={(v) => dispatch({ type: 'updateSlide', id: slide().id, value: { subtitle: v } })} />
                        <div class="grid grid-cols-2 gap-2">
                          <TextField label="Button text" value={slide().buttonText} placeholder="Leave empty to hide" onChange={(v) => dispatch({ type: 'updateSlide', id: slide().id, value: { buttonText: v } })} />
                          <TextField label="Link" value={slide().buttonUrl} placeholder="https://" onChange={(v) => dispatch({ type: 'updateSlide', id: slide().id, value: { buttonUrl: v } })} />
                        </div>
                        <SelectField label="Transition into this slide" value={slide().effect} options={EFFECT_OPTIONS} onChange={(v) => dispatch({ type: 'updateSlide', id: slide().id, value: { effect: v } })} />
                      </div>
                    </Show>
                  </li>
              )
            }}
          </For>
        </ul>
      </Show>

      <button
        type="button"
        onClick={() => fileInput?.click()}
        onDragOver={(e) => {
          if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault()
            setDropOver(true)
          }
        }}
        onDragLeave={() => setDropOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDropOver(false)
          void addFiles(e.dataTransfer?.files ?? null)
        }}
        class={`flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${
          dropOver() ? 'bg-white/[0.06]' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.025]'
        }`}
        style={dropOver() ? { 'border-color': 'var(--ui-accent)' } : undefined}
      >
        <ImagePlus class="size-5 text-white/50" strokeWidth={1.75} />
        <span class="text-[12.5px] font-medium text-white/80">Drop images or choose files</span>
        <span class="text-[11px] text-white/35">JPG, PNG, WebP — stored in this browser</span>
      </button>
      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { void addFiles(e.currentTarget.files); e.currentTarget.value = '' }} />

      <form
        class="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addUrl()
        }}
      >
        <div class="relative flex-1">
          <Link2 class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-white/35" />
          <input value={url()} onInput={(e) => setUrl(e.currentTarget.value)} placeholder="Image URL" class="field pl-8" />
        </div>
        <Button type="submit" disabled={!url().trim()}>
          Add
        </Button>
      </form>
    </Section>
  )
}
