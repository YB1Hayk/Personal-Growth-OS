import { useEffect, useState } from 'react'
import { API_URL, checkedFetch } from './lib/api'
import { ArrowRight, Lightbulb, TrendingUp } from 'lucide-react'
import { Button } from './components/ui'

type Project = { id: string; name: string; niche: string }
type Idea = { id: string; projectId: string; title: string; expectedImpact: string | null; effort: 'LOW' | 'MEDIUM' | 'HIGH' | null; confidence: number; project?: Project }
const effortLabel = { LOW: 'Низкие усилия', MEDIUM: 'Средние усилия', HIGH: 'Высокие усилия' }

export default function StrategyOverview({ projects, onOpenIdeas }: { projects: Project[]; onOpenIdeas: () => void }) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  useEffect(() => {
    checkedFetch(`${API_URL}/api/ideas`).then(response => response.json()).then(json => setIdeas(json.data || [])).catch(error => console.error('Не удалось загрузить стратегические идеи', error))
  }, [])
  const activeProjects = projects.filter(project => ideas.some(idea => idea.projectId === project.id))
  const withoutPlan = projects.filter(project => !ideas.some(idea => idea.projectId === project.id))

  return <main className="flex-1 overflow-auto bg-[#09090b] p-8 lg:p-12"><div className="mx-auto max-w-5xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">Портфель направлений</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Стратегии роста</h1><p className="mt-2 text-sm text-zinc-500">Активные гипотезы, сгруппированные по проектам. Это рабочие предположения, а не подтверждённые результаты.</p></div><Button onClick={onOpenIdeas}><Lightbulb size={15} className="mr-2"/>Разобрать идеи</Button></header>
    <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><span className="text-xs text-zinc-500">Активных гипотез</span><p className="mt-3 text-3xl font-semibold">{ideas.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><span className="text-xs text-zinc-500">Направлений с гипотезами</span><p className="mt-3 text-3xl font-semibold">{activeProjects.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><span className="text-xs text-zinc-500">Без гипотез в работе</span><p className="mt-3 text-3xl font-semibold">{withoutPlan.length}</p></div></section>
    {activeProjects.length === 0 ? <section className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center"><TrendingUp size={22} className="mx-auto text-indigo-400"/><h2 className="mt-4 font-medium">Пока нечего сравнивать</h2><p className="mx-auto mt-2 max-w-lg text-sm text-zinc-500">Зафиксируйте несколько идей и заполните ожидаемый эффект и затраты. Тогда этот обзор поможет увидеть, какие направления требуют внимания.</p><Button onClick={onOpenIdeas} className="mt-5">Добавить первую гипотезу</Button></section> : <div className="space-y-6">{activeProjects.map(project => <section key={project.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"><div className="mb-4"><h2 className="font-semibold">{project.name}</h2><p className="mt-1 text-xs text-zinc-600">{project.niche}</p></div><div className="space-y-2">{ideas.filter(idea => idea.projectId === project.id).map(idea => <article key={idea.id} className="rounded-xl border border-zinc-800/70 bg-zinc-950/50 p-4"><h3 className="text-sm font-medium text-zinc-200">{idea.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-[10px]"><span className="rounded-full bg-indigo-500/10 px-2 py-1 text-indigo-300">Уверенность {idea.confidence}/5</span><span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">{idea.effort ? effortLabel[idea.effort] : 'Усилия не оценены'}</span></div>{idea.expectedImpact && <p className="mt-3 text-xs leading-5 text-zinc-500">Ожидаемый эффект: {idea.expectedImpact}</p>}</article>)}</div></section>)}</div>}
    {withoutPlan.length > 0 && <section><h2 className="mb-3 text-sm font-medium text-zinc-400">Направления без активных гипотез</h2><div className="flex flex-wrap gap-2">{withoutPlan.map(project => <span key={project.id} className="rounded-full border border-zinc-800 px-3 py-2 text-xs text-zinc-500">{project.name}</span>)}</div></section>}
    <button onClick={onOpenIdeas} className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300">Открыть разбор идей <ArrowRight size={14}/></button>
  </div></main>
}
