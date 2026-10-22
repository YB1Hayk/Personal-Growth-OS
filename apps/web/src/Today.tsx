import { useEffect, useMemo, useState } from 'react'
import { API_URL, checkedFetch } from './lib/api'
import { Button, Input, Textarea } from './components/ui'
import { ArrowRight, Check, Circle, Plus, Sparkles } from 'lucide-react'

type Project = { id: string; name: string; niche: string; currentFocus?: string | null }
type Task = { id: string; projectId: string; title: string; description: string | null; status: 'OPEN' | 'DONE'; priority: 'LOW' | 'NORMAL' | 'HIGH'; dueAt: string | null; project?: Project }

export default function Today({ projects, onOpenProject }: { projects: Project[]; onOpenProject: (projectId: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskProjectFilter, setTaskProjectFilter] = useState('ALL')
  const [isAdding, setIsAdding] = useState(false)

  const load = async () => {
    try {
      const response = await checkedFetch(`${API_URL}/api/tasks`)
      const json = await response.json()
      setTasks(json.data || [])
    } catch (error) { console.error('Не удалось загрузить задачи', error) }
  }
  useEffect(() => { void load() }, [])

  const visibleTasks = useMemo(() => taskProjectFilter === 'ALL' ? tasks : tasks.filter(task => task.projectId === taskProjectFilter), [tasks, taskProjectFilter])
  const openTasks = useMemo(() => visibleTasks.filter(task => task.status === 'OPEN'), [visibleTasks])
  const doneCount = tasks.length - openTasks.length

  const addTask = async () => {
    if (!title.trim() || !selectedProject) return
    setIsAdding(true)
    try {
      await checkedFetch(`${API_URL}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: selectedProject, title: title.trim(), description: description.trim() || null }) })
      setTitle(''); setDescription(''); await load()
    } catch (error) { console.error('Не удалось создать задачу', error) }
    finally { setIsAdding(false) }
  }

  const toggle = async (task: Task) => {
    try {
      await checkedFetch(`${API_URL}/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: task.status === 'OPEN' ? 'DONE' : 'OPEN' }) })
      await load()
    } catch (error) { console.error('Не удалось обновить задачу', error) }
  }

  return <main className="flex-1 overflow-auto bg-[#09090b] p-8 lg:p-12">
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">Личный рабочий центр</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Сегодня</h1><p className="mt-2 text-sm text-zinc-500">Обзор дел по всем проектам и быстрый захват новых идей.</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-3"><span className="text-2xl font-semibold">{openTasks.length}</span><span className="ml-2 text-sm text-zinc-500">открытых задач</span></div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Входящий набросок</h2><p className="mt-1 text-xs text-zinc-500">Запишите мысль, затем превратите её в задачу.</p></div><Sparkles className="text-indigo-400" size={18}/></div>
          <select value={selectedProject} onChange={event => setSelectedProject(event.target.value)} className="mb-3 h-10 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3 text-sm text-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500/40">
            <option value="">Выберите проект</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Например: обсудить позиционирование студии" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) void addTask() }}/>
          <Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Контекст или идея (необязательно)" className="mt-3 min-h-24"/>
          <Button disabled={!title.trim() || !selectedProject || isAdding} onClick={() => void addTask()} className="mt-3"><Plus size={16} className="mr-2"/>Добавить в задачи</Button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Мои проекты</h2><p className="mt-1 text-xs text-zinc-500">Перейдите к нужному рабочему пространству.</p></div><span className="text-xs text-zinc-600">{projects.length}</span></div>
          <div className="space-y-2">{projects.map(project => <button key={project.id} onClick={() => onOpenProject(project.id)} className="group flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3 text-left hover:border-indigo-500/40 hover:bg-zinc-900"><span className="min-w-0"><span className="block text-sm font-medium text-zinc-200">{project.name}</span><span className="mt-1 block text-xs text-zinc-600">{project.currentFocus || project.niche}</span></span><ArrowRight size={15} className="ml-3 shrink-0 text-zinc-600 group-hover:text-indigo-400"/></button>)}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Задачи по всем проектам</h2><p className="mt-1 text-xs text-zinc-500">{doneCount} завершено · {openTasks.length} осталось</p></div><select value={taskProjectFilter} onChange={event => setTaskProjectFilter(event.target.value)} className="h-9 rounded-lg border border-zinc-800 bg-[#18181b] px-3 text-xs text-zinc-300"><option value="ALL">Все проекты</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
        {visibleTasks.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-800 px-5 py-10 text-center text-sm text-zinc-500">{tasks.length === 0 ? 'Пока задач нет. Добавьте первый набросок выше.' : 'В этом проекте пока нет задач.'}</div> : <div className="space-y-2">{visibleTasks.map(task => <div key={task.id} className="flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4"><button aria-label={task.status === 'OPEN' ? 'Завершить задачу' : 'Вернуть задачу в работу'} onClick={() => void toggle(task)} className={task.status === 'DONE' ? 'text-emerald-400' : 'text-zinc-600 hover:text-indigo-400'}>{task.status === 'DONE' ? <Check size={18}/> : <Circle size={18}/>}</button><button onClick={() => onOpenProject(task.projectId)} className="min-w-0 flex-1 text-left"><span className={`block truncate text-sm ${task.status === 'DONE' ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>{task.title}</span><span className="mt-1 block text-xs text-zinc-600">{task.project?.name || projects.find(project => project.id === task.projectId)?.name || 'Проект'}</span></button><span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${task.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>{task.priority === 'HIGH' ? 'важно' : task.status === 'DONE' ? 'готово' : 'в работе'}</span></div>)}</div>}
      </section>
    </div>
  </main>
}
