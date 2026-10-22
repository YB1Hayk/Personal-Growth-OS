import { useState, useEffect } from 'react'
import { Search, Zap, TrendingUp, Link as LinkIcon, Trash2, Loader2, PlusCircle } from 'lucide-react'
import { Badge, ScrollArea } from './components/ui'
import { cn } from './lib/utils'
import { API_URL } from './lib/api'

interface MarketInsight {
  id: string
  content: string
  category: string
  source: string | null
  createdAt: string
}

interface MarketAnalyzerProps {
  projectId: string
}


export default function MarketAnalyzer({ projectId }: MarketAnalyzerProps) {
  const [insights, setInsights] = useState<MarketInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchInsights = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/market/insights?projectId=${projectId}`)
      const json = await res.json()
      setInsights(json.data || [])
    } catch (e) {
      console.error('Fetch insights error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [projectId])

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'боль': return <Zap size={14} className="text-amber-500" />
      case 'запрос': return <Search size={14} className="text-indigo-400" />
      case 'тренд': return <TrendingUp size={14} className="text-emerald-500" />
      default: return <Zap size={14} />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'боль': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'запрос': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'тренд': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-zinc-100 font-sans animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-12 py-10 border-b border-zinc-800/40 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Анализатор Рынка</h1>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mt-2">
            Market Intelligence & User Insights Hub
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mr-3">Всего инсайтов:</span>
                <span className="text-sm font-bold text-indigo-400">{insights.length}</span>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-12">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Обработка данных...</span>
            </div>
          ) : insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.map((insight) => (
                <div 
                  key={insight.id}
                  className="group relative bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 hover:bg-zinc-900/50 hover:border-indigo-500/30 transition-all duration-300 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border", getCategoryColor(insight.category))}>
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(insight.category)}
                        {insight.category}
                      </div>
                    </Badge>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6 italic">
                    «{insight.content}»
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60">
                    {insight.source ? (
                      <a 
                        href={insight.source} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <LinkIcon size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Источник</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-700">
                        <PlusCircle size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">AI Extraction</span>
                      </div>
                    )}
                    
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-800/40 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-700">
                <Search size={24} />
              </div>
              <h2 className="text-xl font-bold text-zinc-400">Инсайтов пока нет</h2>
              <p className="text-xs text-zinc-600 mt-2 max-w-xs text-center">
                Общайся с ИИ-ассистентом и сохраняй интересные мысли в проект нажатием одной кнопки.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
