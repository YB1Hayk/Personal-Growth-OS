import { useEffect, useState } from 'react'
import { API_URL, checkedFetch } from './lib/api'
import { Button, Input, Textarea } from './components/ui'
import { ArrowRight, Check, Compass, Target } from 'lucide-react'

type Project = { id: string; name: string; niche: string; description?: string | null; currentFocus?: string | null; targetAudience?: string | null; dna?: string | null; brandVoice?: string | null }

export default function ProjectWorkspace({ project, onOpenIdeas, onOpenTasks }: { project: Project | undefined; onOpenIdeas: () => void; onOpenTasks: () => void }) {
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState('')
  const [focus, setFocus] = useState('')
  const [dna, setDna] = useState('')
  const [voice, setVoice] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setGoal(project?.description || '')
    setAudience(project?.targetAudience || '')
    setFocus(project?.currentFocus || '')
    setDna(project?.dna || '')
    setVoice(project?.brandVoice || '')
  }, [project?.id, project?.description, project?.currentFocus, project?.targetAudience, project?.dna, project?.brandVoice])

  if (!project) return <main className="flex-1 grid place-items-center text-sm text-zinc-500">Сначала создайте или выберите проект.</main>

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      await checkedFetch(`${API_URL}/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: goal, currentFocus: focus, targetAudience: audience, dna, brandVoice: voice }) })
      setSaved(true)
    } catch (error) { console.error('Не удалось сохранить рабочее пространство проекта', error) }
    finally { setSaving(false) }
  }

  return <main className="flex-1 overflow-auto bg-[#09090b] p-8 lg:p-12"><div className="mx-auto max-w-5xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">Рабочее пространство проекта</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">{project.name}</h1><p className="mt-2 text-sm text-zinc-500">{project.niche} · Цели, контекст и текущий фокус собраны здесь.</p></div><Button onClick={() => void save()} disabled={saving}>{saved ? <Check size={15} className="mr-2"/> : null}{saving ? 'Сохраняю…' : saved ? 'Сохранено' : 'Сохранить контекст'}</Button></header>
    <section className="grid gap-5 md:grid-cols-2">
      <label className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><span className="flex items-center gap-2 text-sm font-medium"><Target size={16} className="text-indigo-400"/>Цель направления</span><Textarea value={goal} onChange={event => setGoal(event.target.value)} placeholder="Какого результата хотите добиться этим проектом?" className="mt-4 min-h-32"/><span className="mt-2 block text-[11px] text-zinc-600">Краткое описание проекта, сохранится в его карточке.</span></label>
      <label className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><span className="flex items-center gap-2 text-sm font-medium"><Compass size={16} className="text-indigo-400"/>Аудитория и контекст</span><Textarea value={audience} onChange={event => setAudience(event.target.value)} placeholder="Для кого этот проект и где вы пока не уверены?" className="mt-4 min-h-32"/><span className="mt-2 block text-[11px] text-zinc-600">Укажите известное; неизвестное можно оставить открытым вопросом.</span></label>
    </section>
    <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.035] p-5"><label className="text-sm font-medium">Текущий фокус</label><Input value={focus} onChange={event => setFocus(event.target.value)} placeholder="Например: определить оффер студии на этот месяц" className="mt-3 bg-zinc-950/70"/><p className="mt-2 text-[11px] text-zinc-600">Одна главная тема, которая помогает выбирать следующие действия.</p></section>
    <section className="grid gap-5 md:grid-cols-2"><label className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 text-sm font-medium">ДНК проекта<Textarea value={dna} onChange={event => setDna(event.target.value)} placeholder="Принципы, позиционирование, что отличает проект" className="mt-4 min-h-40 text-sm font-normal"/></label><label className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 text-sm font-medium">Голос и стиль<Textarea value={voice} onChange={event => setVoice(event.target.value)} placeholder="Тон, словарь, что говорить и чего избегать" className="mt-4 min-h-40 text-sm font-normal"/></label></section>
    <section className="grid gap-4 md:grid-cols-2"><button onClick={onOpenIdeas} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 text-left hover:border-indigo-500/40"><span><span className="block text-sm font-medium">Разобрать идеи</span><span className="mt-1 block text-xs text-zinc-500">Гипотезы, ожидаемый эффект и усилия</span></span><ArrowRight size={17} className="text-zinc-500"/></button><button onClick={onOpenTasks} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 text-left hover:border-indigo-500/40"><span><span className="block text-sm font-medium">Открыть задачи дня</span><span className="mt-1 block text-xs text-zinc-500">Следующие действия по всем направлениям</span></span><ArrowRight size={17} className="text-zinc-500"/></button></section>
  </div></main>
}
