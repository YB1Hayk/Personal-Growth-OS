import { useCallback, useEffect, useRef, useState } from 'react'
import { API_URL, checkedFetch } from './lib/api'
import { Button, Input, Textarea } from './components/ui'
import { ArrowRight, Check, Clock3, Lightbulb, Pause, Plus, Sparkles } from 'lucide-react'

type Project = { id: string; name: string; niche: string }
type Idea = { id: string; projectId: string; title: string; context: string | null; expectedImpact: string | null; effort: 'LOW' | 'MEDIUM' | 'HIGH' | null; confidence: number; project?: Project }
const effortLabel = { LOW: 'Низкие', MEDIUM: 'Средние', HIGH: 'Высокие' }

export default function IdeaReview({ projects, onTaskCreated }: { projects: Project[]; onTaskCreated: () => void }) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [showParked, setShowParked] = useState(false)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const load = useCallback(async () => {
    try { const response = await checkedFetch(`${API_URL}/api/ideas${showParked ? '?status=PARKED' : ''}`); const json = await response.json(); setIdeas(json.data || []) }
    catch (error) { console.error('Не удалось загрузить идеи', error) }
  }, [showParked])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])
  useEffect(() => () => Object.values(saveTimers.current).forEach(clearTimeout), [])

  const createIdea = async () => {
    if (!projectId || !title.trim()) return
    try {
      await checkedFetch(`${API_URL}/api/ideas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, title: title.trim(), context: context.trim() || null }) })
      setTitle(''); setContext(''); await load()
    } catch (error) { console.error('Не удалось сохранить идею', error) }
  }
  const updateIdea = async (idea: Idea, changes: Record<string, unknown>) => {
    try { await checkedFetch(`${API_URL}/api/ideas/${idea.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }); await load() }
    catch (error) { console.error('Не удалось обновить идею', error) }
  }
  const convertToTask = async (idea: Idea) => {
    try { await checkedFetch(`${API_URL}/api/ideas/${idea.id}/convert`, { method: 'POST' }); await load(); onTaskCreated() }
    catch (error) { console.error('Не удалось создать задачу', error) }
  }

  return <main className="flex-1 overflow-auto bg-[#09090b] p-8 lg:p-12"><div className="mx-auto max-w-5xl space-y-8">
    <header><p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">Стратегия и фокус</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Разбор идей</h1><p className="mt-2 text-sm text-zinc-500">Сначала зафиксируйте мысль, затем оцените смысл и усилия. Не каждая идея обязана стать задачей.</p></header>
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400"><Lightbulb size={18}/></div><div><h2 className="font-semibold">Новая идея</h2><p className="mt-1 text-xs text-zinc-500">Можно начать с неоформленного вопроса или гипотезы.</p></div></div>
      <div className="grid gap-3 md:grid-cols-2"><select value={projectId} onChange={event => setProjectId(event.target.value)} className="h-10 rounded-lg border border-zinc-800 bg-[#18181b] px-3 text-sm text-zinc-200 outline-none"><option value="">Выберите проект</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Например: провести серию интервью с клиентами"/></div>
      <Textarea value={context} onChange={event => setContext(event.target.value)} placeholder="Что хочется выяснить или изменить?" className="mt-3 min-h-20"/><Button disabled={!projectId || !title.trim()} onClick={() => void createIdea()} className="mt-3"><Plus size={16} className="mr-2"/>Зафиксировать идею</Button>
    </section>
    <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{showParked ? 'Отложенные идеи' : 'На рассмотрении'}</h2><p className="mt-1 text-xs text-zinc-500">Оцените идеи по ожидаемому результату, усилиям и уверенности.</p></div><div className="flex items-center gap-3"><button onClick={() => setShowParked(value => !value)} className="text-xs text-zinc-400 hover:text-indigo-300">{showParked ? 'К активным' : 'Показать отложенные'}</button><span className="text-xs text-zinc-600">{ideas.length} идей</span></div></div>
      {ideas.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-12 text-center text-sm text-zinc-500">Входящих идей пока нет.</div> : ideas.map(idea => <article key={idea.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 lg:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-medium text-zinc-100">{idea.title}</h3><p className="mt-1 text-xs text-zinc-600">{idea.project?.name || projects.find(project => project.id === idea.projectId)?.name}</p>{idea.context && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{idea.context}</p>}</div><Sparkles size={16} className="text-indigo-400"/></div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_150px_160px]"><label className="text-xs text-zinc-500">Ожидаемый эффект<Textarea value={idea.expectedImpact || ''} onChange={event => { const expectedImpact = event.target.value; setIdeas(current => current.map(item => item.id === idea.id ? { ...item, expectedImpact } : item)); }} onBlur={event => void updateIdea(idea, { expectedImpact: event.target.value || null })} placeholder="Какой результат изменится?" className="mt-2 min-h-16 text-sm"/></label><label className="text-xs text-zinc-500">Усилия<select value={idea.effort || ''} onChange={event => void updateIdea(idea, { effort: event.target.value || null })} className="mt-2 h-10 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3 text-sm text-zinc-200"><option value="">Не оценено</option><option value="LOW">{effortLabel.LOW}</option><option value="MEDIUM">{effortLabel.MEDIUM}</option><option value="HIGH">{effortLabel.HIGH}</option></select></label><label className="text-xs text-zinc-500">Уверенность: {idea.confidence}/5<input type="range" min="1" max="5" value={idea.confidence} onChange={event => { const confidence = Number(event.target.value); setIdeas(current => current.map(item => item.id === idea.id ? { ...item, confidence } : item)); clearTimeout(saveTimers.current[idea.id]); saveTimers.current[idea.id] = setTimeout(() => void updateIdea(idea, { confidence }), 250); }} className="mt-4 block w-full accent-indigo-500"/><span className="mt-1 block text-[10px] text-zinc-600">Насколько верим, что эффект достижим</span></label></div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-800/70 pt-4">{showParked ? <Button variant="secondary" onClick={() => void updateIdea(idea, { status: 'CONSIDERING' })}><Sparkles size={14} className="mr-2"/>Вернуть к рассмотрению</Button> : <><Button variant="secondary" onClick={() => void convertToTask(idea)}><Check size={14} className="mr-2"/>Принять и создать задачу<ArrowRight size={14} className="ml-2"/></Button><Button variant="ghost" onClick={() => void updateIdea(idea, { status: 'PARKED' })}><Pause size={14} className="mr-2"/>Отложить</Button></>}<span className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600"><Clock3 size={12}/>Решение можно изменить позже</span></div>
      </article>)}
    </section>
  </div></main>
}
