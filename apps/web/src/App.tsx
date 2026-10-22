import { useState, useEffect, useRef } from 'react'
import { 
  Sidebar, 
  SidebarItem, 
  Button, 
  Input,
  Textarea, 
  Badge, 
  ScrollArea 
} from './components/ui'
import { cn } from './lib/utils'
import { API_URL, checkedFetch as fetch } from './lib/api'
import LeadManager from './LeadManager'
import OutreachEditor from './OutreachEditor'
import OutreachEngine from './OutreachEngine'
import TrafficManager from './TrafficManager'
import AIChat from './AIChat'
import MarketAnalyzer from './MarketAnalyzer'
import Today from './Today'
import IdeaReview from './IdeaReview'
import ProjectWorkspace from './ProjectWorkspace'
import StrategyOverview from './StrategyOverview'
import { Search, TrendingUp, Factory, Users, Send, Settings as SettingsIcon, Sparkles, CalendarDays } from 'lucide-react'

// --- Types ---

type PostStatus = "PUBLISHING" | "PUBLISH_UNKNOWN" | "DRAFT" | "PUBLISHED" | "SCHEDULED" | "GENERATING" | "APPROVED"
type Platform = "telegram" | "threads" | "instagram"

interface ContentPost {
  id: string
  title: string
  content: string | null
  status: PostStatus
  projectId: string
  scheduledAt: string | null
  createdAt: string
  platform?: Platform
}

interface Project {
  id: string
  name: string
  niche: string
  dna: string | null
  brandVoice: string | null
  targetAudience: string | null
  hasTelegramToken?: boolean
  planGenerationDay?: number | null
  tgChatId?: string
  sourceUrl?: string
  currentFocus?: string | null
}


// --- SVGs ---

const IconTelegram = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
        <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
)

// --- Main App ---

export default function App() {
  const latestProjectId = useRef('')
  const postsRequestId = useRef(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectNiche, setNewProjectNiche] = useState('')
  const [activeTab, setActiveTab] = useState<'today' | 'workspace' | 'ideas' | 'content' | 'leads' | 'outreach' | 'ai_outreach' | 'traffic' | 'market' | 'strategies' | 'ai_chat'>(() => localStorage.getItem('growth-os.active-tab') === 'content' ? 'content' : 'today')
  
  const [dna, setDna] = useState('')
  const [voice, setVoice] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [botToken, setBotToken] = useState('')
  const [hasTelegramToken, setHasTelegramToken] = useState(false)
  const [chatId, setChatId] = useState('')
  const [planDay, setPlanDay] = useState<number | null>(null)

  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem('growth-os.active-project') || '')

  useEffect(() => { localStorage.setItem('growth-os.active-tab', activeTab) }, [activeTab])
  useEffect(() => { if (activeProjectId) localStorage.setItem('growth-os.active-project', activeProjectId) }, [activeProjectId])

  useEffect(() => {
    const init = async () => {
      try {
        await fetchProjects()
      } catch (err) {
        console.error('Core dump:', err)
      } finally {
        setIsInitialLoad(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (activeProjectId) {
      // Генерация только по явному действию: эффект со stale posts дублировал планы.
      void fetchPosts(activeProjectId);
    }
  }, [activeProjectId])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`)
      const json = await res.json()
      const data = json?.data || []
      setProjects(data)
      
      const project = data.find((p: Project) => p.id === activeProjectId) || data[0]
      if (project) {
        handleProjectSelect(project)
      }
    } catch (e) { console.error('Project fetch error:', e) }
  }

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectNiche) return;
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, niche: newProjectNiche })
      })
      if (res.ok) {
        const json = await res.json()
        await fetchProjects()
        handleProjectSelect(json.data)
        setShowNewProjectModal(false)
        setNewProjectName('')
        setNewProjectNiche('')
      }
    } catch (e) { console.error('Create error:', e) }
  }

  const handleProjectSelect = (project: Project) => {
    latestProjectId.current = project.id
    postsRequestId.current++
    if (project.id !== activeProjectId) { setPosts([]); setSelectedId(null); }
    setActiveProjectId(project.id)
    setDna(project.dna || '')
    setVoice(project.brandVoice || '')
    setBotToken('')
    setHasTelegramToken(Boolean(project.hasTelegramToken))
    setChatId(project.tgChatId || '')
    setSourceUrl(project.sourceUrl || '')
    setPlanDay(project.planGenerationDay !== undefined ? project.planGenerationDay : null)
  }

  const fetchPosts = async (projectId: string) => {
    if (latestProjectId.current !== projectId) return;
    const requestId = ++postsRequestId.current;
    try {
      const res = await fetch(`${API_URL}/api/content/project/${projectId}`)
      const json = await res.json()
      const data = json?.data || []
      if (latestProjectId.current !== projectId || requestId !== postsRequestId.current) return;
      setPosts(data)
      setSelectedId(previous => data.some((post: ContentPost) => post.id === previous) ? previous : data[0]?.id ?? null)
    } catch (e) { console.error('Content fetch error:', e) }
  }

  const handleScanMarket = async () => {
    if (!sourceUrl) return;
    setIsScanning(true)
    try {
      const res = await fetch(`${API_URL}/api/market/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl })
      })
      const json = await res.json()
      if (json.data) {
        setDna(json.data.dna)
        setVoice(json.data.brandVoice)
      }
    } catch (e) { console.error('Scan error:', e) }
    finally { setIsScanning(false) }
  }

  const handleUpdateSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${activeProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dna, 
          brandVoice: voice,
          ...(botToken.trim() ? { tgBotToken: botToken.trim() } : {}),
          tgChatId: chatId,
          sourceUrl,
          planGenerationDay: planDay
        })
      })
      if (res.ok) {
        await fetchProjects()
        setBotToken('')
        setShowSettings(false)
        await fetchPosts(activeProjectId)
      }
    } catch (e) { console.error('Sync error:', e) }
  }

  const handlePublishPost = async () => {
    if (!selectedId) return;
    setIsPublishing(true)
    try {
      const res = await fetch(`${API_URL}/api/posts/${selectedId}/publish`, {
        method: 'POST'
      })
      if (res.ok) {
        await fetchPosts(activeProjectId)
      }
    } catch (e) { console.error('Publish error:', e) }
    finally { setIsPublishing(false); await fetchPosts(activeProjectId); }
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    try {
      await fetch(`${API_URL}/api/content/project/${activeProjectId}/plan`, { method: 'POST' })
      await fetchPosts(activeProjectId)
    } catch (error) { console.error('Generation failed', error instanceof Error ? error.message : 'Ошибка'); }
    finally { setIsGenerating(false) }
  }

  const handleGeneratePost = async (id: string) => {
    setIsGenerating(true)
    try {
      await fetch(`${API_URL}/api/content/generate-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id })
      })
      await fetchPosts(activeProjectId)
    } catch (error) { console.error('Generation failed', error instanceof Error ? error.message : 'Ошибка'); }
    finally { setIsGenerating(false) }
  }

  const handleApprovePost = async (id: string) => {
    try {
        const res = await fetch(`${API_URL}/api/content/${id}/approve`, { method: 'PATCH' })
        if (res.ok) {
            await fetchPosts(activeProjectId)
        }
    } catch (e) { console.error('Approve error:', e) }
  }

  const handleDeletePost = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/content/${id}`, { method: 'DELETE' })
      await fetchPosts(activeProjectId)
      if (selectedId === id) setSelectedId(null)
    } catch (e) { console.error('Delete error:', e) }
  }

  const handleClearQueue = async () => {
    try {
      await fetch(`${API_URL}/api/content/project/${activeProjectId}/clear`, { method: 'DELETE' })
      await fetchPosts(activeProjectId)
      setSelectedId(null)
    } catch (e) { console.error('Clear error:', e) }
  }

  const handleUpdatePost = async (id: string, data: { title?: string; content?: string | null; scheduledAt?: string | null }) => {
    try {
      await fetch(`${API_URL}/api/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      await fetchPosts(activeProjectId)
    } catch (e) { console.error('Update error:', e) }
  }

  if (isInitialLoad && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#09090b] text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">
        Загрузка системы...
      </div>
    )
  }

  const currentProject = projects.find(p => p.id === activeProjectId)
  const selectedPost = posts.find(p => p.id === selectedId)

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Sidebar: w-64 */}
      <Sidebar className="w-64 shrink-0">
        <div className="p-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Growth OS</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <SidebarItem
              active={activeTab === 'today' && !showSettings}
              icon={<CalendarDays size={16} className="text-zinc-400" />}
              label="Сегодня"
              onClick={() => { setActiveTab('today'); setShowSettings(false); }}
            />
            <SidebarItem
              active={activeTab === 'ideas' && !showSettings}
              icon={<Sparkles size={16} className="text-zinc-400" />}
              label="Разбор идей"
              onClick={() => { setActiveTab('ideas'); setShowSettings(false); }}
            />
            <SidebarItem
              active={activeTab === 'workspace' && !showSettings}
              icon={<Factory size={16} className="text-zinc-400" />}
              label="Пространство проекта"
              onClick={() => { setActiveTab('workspace'); setShowSettings(false); }}
            />
            <SidebarItem 
              active={activeTab === 'market' && !showSettings} 
              icon={<Search size={16} className="text-zinc-400" />} 
              label="Анализатор Рынка" 
              onClick={() => { setActiveTab('market'); setShowSettings(false); }} 
            />
            <SidebarItem 
              active={activeTab === 'strategies' && !showSettings} 
              icon={<TrendingUp size={16} className="text-zinc-400" />} 
              label="Стратегии Роста" 
              onClick={() => { setActiveTab('strategies'); setShowSettings(false); }} 
            />
            <SidebarItem 
              active={activeTab === 'content' && !showSettings} 
              icon={<Factory size={16} className="text-zinc-400" />} 
              label="Контент-Завод" 
              onClick={() => { setActiveTab('content'); setShowSettings(false); if (posts.length > 0 && !selectedId) setSelectedId(posts[0].id); }} 
            />
            <SidebarItem 
              active={activeTab === 'leads' && !showSettings} 
              icon={<Users size={16} className="text-zinc-400" />} 
              label="Управление Лидами" 
              onClick={() => { setActiveTab('leads'); setShowSettings(false); }}
            />
            <SidebarItem
              active={activeTab === 'outreach' && !showSettings}
              icon={<Send size={16} className="text-zinc-400" />}
              label="Шаблоны Рассылок"
              onClick={() => { setActiveTab('outreach'); setShowSettings(false); }}
            />
            <SidebarItem
              active={activeTab === 'ai_outreach' && !showSettings}
              icon={<Sparkles size={16} className="text-zinc-400" />}
              label="AI Outreach"
              onClick={() => { setActiveTab('ai_outreach'); setShowSettings(false); }}
            />
            <SidebarItem
              active={activeTab === 'traffic' && !showSettings}
              icon={<TrendingUp size={16} className="text-zinc-400" />}
              label="Трафик"
              onClick={() => { setActiveTab('traffic'); setShowSettings(false); }}
            />
            <SidebarItem 
              active={activeTab === 'ai_chat' && !showSettings} 
              icon={<Sparkles size={16} className={activeTab === 'ai_chat' && !showSettings ? 'text-indigo-400' : 'text-zinc-400'} />} 
              label="AI-Ассистент" 
              onClick={() => { setActiveTab('ai_chat'); setShowSettings(false); }}
            />
            <SidebarItem 
              active={showSettings} 
              icon={<SettingsIcon size={16} className="text-zinc-400" />} 
              label="Настройки Системы" 
              onClick={() => setShowSettings(true)} 
            />
          </div>

          <div className="mt-10 mb-4 px-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Системные Центры</span>
            <button 
                onClick={() => setShowNewProjectModal(true)}
                className="text-indigo-500 hover:text-indigo-400 text-[10px] font-bold transition-all"
            >
                + Создать
            </button>
          </div>
          <div className="space-y-1">
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => handleProjectSelect(p)}
                className={cn(
                  "w-full flex flex-col items-start gap-1 p-3 rounded-xl transition-all border",
                  activeProjectId === p.id 
                    ? "bg-zinc-800/40 border-zinc-700/50 shadow-inner" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                )}
              >
                <span className={cn(
                  "text-[10px] font-bold tracking-tight",
                  activeProjectId === p.id ? "text-indigo-400" : ""
                )}>{p.name}</span>
                <span className="text-[8px] font-mono text-zinc-700 uppercase">{p.niche}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">N</div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold truncate">Nikol_System</span>
                    <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Root</span>
                </div>
            </div>
        </div>
      </Sidebar>

      {activeTab === 'today' && !showSettings && <Today projects={projects} onOpenProject={(projectId) => {
        const project = projects.find(item => item.id === projectId)
        if (project) handleProjectSelect(project)
        setActiveTab('content')
      }} />}
      {activeTab === 'ideas' && !showSettings && <IdeaReview projects={projects} onTaskCreated={() => setActiveTab('today')} />}

      {/* List Panel: w-80 */}
      {activeTab === 'content' && !showSettings && (
        <div className="w-80 border-r border-zinc-800/80 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-zinc-300">Очередь постов</h2>
                <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">{posts.length} постов</span>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={handleClearQueue}
                  className="px-2 py-1 text-[9px] font-bold text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 rounded transition-all uppercase"
                >
                  Очистить очередь
                </button>
                <button 
                    onClick={handleGeneratePlan}
                    className="px-3 py-1 text-[9px] font-bold bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 hover:bg-indigo-600/20 rounded transition-all uppercase"
                >
                    Сформировать план на неделю
                </button>
            </div>
        </div>

        <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
                {posts.map(post => (
                    <div 
                        key={post.id}
                        onClick={() => { setSelectedId(post.id); setShowSettings(false); }}
                        className={cn(
                            "group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer",
                            selectedId === post.id && !showSettings
                                ? "bg-zinc-900/80 border-indigo-500/40 shadow-[0_0_20px_-10px_rgba(99,102,241,0.3)]" 
                                : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700/50"
                        )}
                    >
                         <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <IconTelegram />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Telegram</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={post.status === 'APPROVED' ? 'default' : selectedId === post.id && !showSettings ? 'outline' : 'outline'} className={post.status === 'APPROVED' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : ''}>
                                      {post.status === 'PUBLISHED' ? 'В ЭФИРЕ' : post.status === 'PUBLISHING' ? 'Отправляется' : post.status === 'PUBLISH_UNKNOWN' ? 'Проверьте канал' : post.status === 'APPROVED' ? 'Ожидает авто-постинга' : 'Черновик'}
                                  </Badge>
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
                                  >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                      </svg>
                                  </button>
                                </div>
                             </div>
                             <p className="text-sm font-medium line-clamp-1">{post.title || 'Очередь постов'}</p>
                             <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono mt-1">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        post.status === 'PUBLISHED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-zinc-700"
                                    )} />
                                    <span>{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Очередь'}</span>
                                </div>
                                <span className={cn(
                                    "uppercase text-[9px]",
                                    post.status === 'PUBLISHED' ? "text-emerald-400 font-bold" : post.status === 'APPROVED' ? "text-indigo-400 font-bold" : ""
                                )}>{post.status === 'PUBLISHED' ? 'В ЭФИРЕ' : post.status === 'PUBLISHING' ? 'Отправляется' : post.status === 'PUBLISH_UNKNOWN' ? 'Проверьте канал' : post.status === 'APPROVED' ? 'Ожидает авто-постинга' : 'Черновик'}</span>
                             </div>

                             {selectedId === post.id && !showSettings && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {post.status === 'DRAFT' && !post.content && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleGeneratePost(post.id); }}
                                            className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                        >
                                            Создать текст
                                        </button>
                                    )}
                                    {post.status === 'DRAFT' && post.content && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleApprovePost(post.id); }}
                                            className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                        >
                                            Одобрить пост
                                        </button>
                                    )}
                                    {post.status === 'APPROVED' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePublishPost(); }}
                                            disabled={!(botToken || hasTelegramToken) || !chatId || isPublishing}
                                            className={cn(
                                                "w-full py-2 border text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                (!(botToken || hasTelegramToken) || !chatId) 
                                                  ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50"
                                                  : "bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_-5px_rgba(79,70,229,0.4)]"
                                            )}
                                        >
                                            {!(botToken || hasTelegramToken) || !chatId ? "Настрой Телеграм" : "Отправить в канал"}
                                        </button>
                                    )}
                                </div>
                             )}
                    </div>
                ))}
            </div>
        </ScrollArea>
      </div>
      )}

      {/* Detail Panel: flex-1 */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {showSettings ? (
          <ScrollArea className="flex-1 p-12 max-w-3xl">
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Настройки Системы</h1>
            </div>
            
            <div className="space-y-10">
                <div className="p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Анализатор Рынка</h3>
                    </div>
                    <div className="flex gap-3">
                        <Input 
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="https://competitor.com или brand-reference.com"
                            className="bg-zinc-950/50"
                        />
                        <button 
                            onClick={handleScanMarket}
                            disabled={isScanning}
                            className="shrink-0 px-6 bg-indigo-600 hover:bg-indigo-500 h-10 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {isScanning ? "Сканирование..." : "Просканировать рынок"}
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 italic">Это автоматически перезапишет параметры Философии и Атмосферы.</p>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block">Центральная Философия (DNA)</label>
                    <Textarea 
                        value={dna}
                        onChange={(e) => setDna(e.target.value)}
                        placeholder="Определи логику проекта..."
                        className="h-48 bg-zinc-950/40 border-zinc-800/60"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block">Атмосферные Параметры (Voice)</label>
                    <Textarea 
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        placeholder="Определи тональность бренда..."
                        className="h-48 bg-zinc-950/40 border-zinc-800/60"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 bg-zinc-900/20 border border-zinc-800/40 rounded-2xl">
                    <div className="space-y-3">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">TELEGRAM BOT TOKEN</label>
                        <Input 
                            type="password"
                            autoComplete="new-password"
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                            placeholder={hasTelegramToken ? "Токен сохранён. Введите новый для замены" : "Введите токен бота"}
                            className="bg-zinc-950/40 border-zinc-800/60"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">CHANNEL ID</label>
                        <Input 
                            value={chatId}
                            onChange={(e) => setChatId(e.target.value)}
                            placeholder="-100...."
                            className="bg-zinc-950/40 border-zinc-800/60"
                        />
                    </div>
                </div>

                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-4">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">День генерации плана (задел на будущее)</label>
                    <select 
                        disabled
                        value={planDay ?? ''} 
                        onChange={(e) => setPlanDay(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-sm p-3 rounded-lg outline-none focus:border-indigo-500/50"
                    >
                        <option value="">Отключено</option>
                        <option value="1">Понедельник</option>
                        <option value="2">Вторник</option>
                        <option value="3">Среда</option>
                        <option value="4">Четверг</option>
                        <option value="5">Пятница</option>
                        <option value="6">Суббота</option>
                        <option value="0">Воскресенье</option>
                    </select>
                    <p className="text-[9px] text-zinc-600 italic">Автоматическая генерация пока отключена: серверное расписание не реализовано. Создавайте план кнопкой. Одобренные посты публикуются по расписанию при работающем API.</p>
                </div>

                <div className="flex justify-start pt-4">
                    <Button onClick={handleUpdateSettings} className="px-10 py-4 text-xs font-bold uppercase tracking-widest">
                        Сохранить настройки
                    </Button>
                </div>
            </div>
          </ScrollArea>
        ) : activeTab === 'workspace' ? (
          <ProjectWorkspace
            key={activeProjectId}
            project={currentProject}
            onOpenIdeas={() => setActiveTab('ideas')}
            onOpenTasks={() => setActiveTab('today')}
          />
        ) : activeTab === 'market' ? (
          <MarketAnalyzer key={activeProjectId} projectId={activeProjectId} />
        ) : activeTab === 'strategies' ? (
          <StrategyOverview projects={projects} onOpenIdeas={() => setActiveTab('ideas')} />
        ) : activeTab === 'leads' ? (
          <LeadManager key={activeProjectId} projectId={activeProjectId} />
        ) : activeTab === 'outreach' ? (
          <OutreachEditor key={activeProjectId} projectId={activeProjectId} />
        ) : activeTab === 'ai_outreach' ? (
          <OutreachEngine key={activeProjectId} projectId={activeProjectId} />
        ) : activeTab === 'traffic' ? (
          <TrafficManager key={activeProjectId} projectId={activeProjectId} />
        ) : activeTab === 'ai_chat' ? (
          <AIChat key={activeProjectId} projectId={activeProjectId} />
        ) : activeTab === 'content' && selectedPost ? (
          <>
            <div className="px-12 py-10 border-b border-zinc-800/40 flex items-start justify-between">
                <div className="space-y-4 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <IconTelegram />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight leading-tight text-zinc-100">
                        {selectedPost.title || 'Ожидание системы...'}
                    </h1>
                    <div className="flex items-center gap-6">
                        <Badge variant={selectedPost.status === 'PUBLISHED' ? 'success' : selectedPost.status === 'APPROVED' ? 'default' : 'outline'} className={selectedPost.status === 'APPROVED' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-3' : ''}>
                            {selectedPost.status === 'PUBLISHED' ? 'В ЭФИРЕ' : selectedPost.status === 'APPROVED' ? 'Ожидает авто-постинга' : 'Черновик'}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Время публикации:</span>
                          <input 
                            key={selectedPost.id}
                            type="datetime-local"
                            defaultValue={selectedPost.scheduledAt ? new Date(new Date(selectedPost.scheduledAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                            onBlur={(e) => { 
                                handleUpdatePost(selectedPost.id, { scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null });
                            }}
                            className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 rounded px-2 py-1 focus:border-indigo-500/50 outline-none transition-all"
                          />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selectedPost.status === 'DRAFT' && (
                        <Button 
                            variant="primary"
                            onClick={() => handleApprovePost(selectedPost.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                        >
                            Одобрить к отправке
                        </Button>
                    )}
                    <Button 
                        variant="secondary"
                        disabled={isGenerating || isPublishing || !['DRAFT', 'APPROVED'].includes(selectedPost.status)}
                        onClick={() => handleGeneratePost(selectedPost.id)}
                    >
                        {isGenerating ? "ГЕНЕРАЦИЯ..." : "Перегенерировать текст"}
                    </Button>
                    {selectedPost.status !== 'DRAFT' && (
                        <Button 
                            onClick={handlePublishPost}
                            disabled={isPublishing || !['DRAFT', 'APPROVED'].includes(selectedPost.status) || !(botToken || hasTelegramToken) || !chatId}
                            className={cn(
                                "relative overflow-hidden group min-w-[140px]",
                                selectedPost.status === 'PUBLISHED' 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                  : (!(botToken || hasTelegramToken) || !chatId)
                                    ? "bg-zinc-900 text-zinc-600 border-zinc-800 opacity-50"
                                    : "bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]"
                            )}
                        >
                            {isPublishing ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span className="text-xs">ОТПРАВКА...</span>
                                </div>
                            ) : selectedPost.status === 'PUBLISHED' ? (
                                <div className="flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M20 6 9 17l-5-5"/>
                                    </svg>
                                    <span className="text-xs">В ЭФИРЕ</span>
                                </div>
                            ) : (!(botToken || hasTelegramToken) || !chatId) ? (
                                <span className="text-[10px]">НЕТ НАСТРОЕК</span>
                            ) : selectedPost.status === 'APPROVED' ? (
                                "ОТПРАВИТЬ В КАНАЛ" 
                            ) : (
                                "ОТПРАВИТЬ В КАНАЛ"
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {['PUBLISHING', 'PUBLISH_UNKNOWN'].includes(selectedPost.status) && (
              <p className="p-4 text-sm text-amber-400" role="status">
                {selectedPost.status === 'PUBLISHING' ? 'Пост отправляется. Если API прервался, проверьте канал перед восстановлением статуса.' : 'Результат отправки не подтверждён. Проверьте Telegram-канал: автоматический повтор заблокирован, чтобы не создать дубль.'}
              </p>
            )}
            <ScrollArea className="flex-1 p-12 bg-[#09090b]">
                <div className="max-w-4xl mx-auto">
                    {selectedPost.content ? (
                        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-10 shadow-2xl">
                            <p className="text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/40">
                                {selectedPost.content}
                            </p>
                            
                            {selectedPost.status === 'PUBLISHED' && (
                                <div className="mt-10 pt-10 border-t border-zinc-800/60 flex gap-8">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">👁️</span>
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Просмотры: 0</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">❤️</span>
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Реакции: 0</span>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.3em]">Analytics_Live</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-start py-20">
                             <div className="text-sm font-medium text-zinc-500 animate-pulse mb-6">Ожидание синтеза контента...</div>
                             <Button variant="secondary" onClick={() => handleGeneratePost(selectedPost.id)}>
                                Начать генерацию текста
                             </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="max-w-md">
                <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-10 text-zinc-800 shadow-inner">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-3 tracking-tight">{currentProject?.name || 'Система Роста'}</h1>
                <Button variant="secondary" onClick={() => setShowSettings(true)}>
                    Синхронизировать ДНК
                </Button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #09090b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
      
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-3xl w-full max-w-md p-8 space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Новый Системный Центр</h2>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Название проекта</label>
                        <Input 
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Напр: Эко-Система Alpha"
                            className="bg-zinc-900/50 border-zinc-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Ниша / Сегмент</label>
                        <Input 
                            value={newProjectNiche}
                            onChange={(e) => setNewProjectNiche(e.target.value)}
                            placeholder="Напр: Lifestyle Tech"
                            className="bg-zinc-900/50 border-zinc-800"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowNewProjectModal(false)}
                        className="flex-1 font-bold uppercase tracking-widest text-[10px]"
                    >
                        Отмена
                    </Button>
                    <Button 
                        onClick={handleCreateProject}
                        className="flex-1 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20"
                    >
                        Запустить Центр
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
