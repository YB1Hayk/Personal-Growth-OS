import { useState, useEffect } from 'react'
import { Button, Badge, ScrollArea, Input } from './components/ui'
import { cn } from './lib/utils'
import { API_URL, checkedFetch as fetch } from './lib/api'
import { Sparkles, Copy, Send, User, MessageSquare, History } from 'lucide-react'

interface Lead {
  id: string
  name: string
  handle: string
  source: string
  status: string
  notes?: string | null
  lastContact?: string | null
  createdAt: string
}


export default function OutreachEngine({ projectId }: { projectId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (projectId) fetchLeads()
  }, [projectId])

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/leads?projectId=${projectId}`)
      const json = await res.json()
      setLeads(json.data || [])
    } catch (e) {
      console.error('Outreach leads fetch error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateMessage = async (lead: Lead) => {
    setSelectedLead(lead)
    setIsGenerating(true)
    setGeneratedMessage('')
    try {
      const res = await fetch(`${API_URL}/api/outreach/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, projectId }),
      })
      const json = await res.json()
      setGeneratedMessage(json.data)
    } catch (e) {
      console.error('Generation error:', e)
      setGeneratedMessage('Ошибка при генерации сообщения...')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setLeads(prev => prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)))
    } catch (e) {
      console.error('Status update error:', e)
    }
  }

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.handle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusMap: Record<string, { label: string; color: string }> = {
    'NEW': { label: 'Новый', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    'IN_PROGRESS': { label: 'В работе', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    'REJECTED': { label: 'Отказ', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    'DEAL': { label: 'Сделка', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
      {/* Header */}
      <div className="px-12 py-10 border-b border-zinc-800/40 flex items-center justify-between bg-zinc-950/20">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 mb-2 flex items-center gap-4">
            Outreach Engine
            <Badge className="bg-indigo-600/10 text-indigo-400 border-indigo-500/20 font-mono text-[10px] tracking-widest uppercase">AI Agent Active</Badge>
          </h1>
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.3em]">
            Автоматизация персонализированных касаний · {leads.length} целей
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Input 
              placeholder="Поиск лида..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 h-10 pl-10 text-xs"
            />
            <MessageSquare className="absolute left-3 top-3 text-zinc-600" size={14} />
          </div>
          <Button variant="secondary" onClick={fetchLeads} className="h-10 px-4">
             <History size={14} />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Leads Table Section */}
        <ScrollArea className="flex-1 border-r border-zinc-800/40">
          <div className="p-8">
            {isLoading ? (
               <div className="flex items-center justify-center py-20 text-zinc-700 font-mono text-[10px] uppercase tracking-widest animate-pulse">
                Синхронизация базы лидов...
              </div>
            ) : filteredLeads.length === 0 ? (
               <div className="text-center py-20 text-zinc-600 text-xs font-mono uppercase tracking-widest">
                База пуста или ничего не найдено
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredLeads.map(lead => (
                  <div 
                    key={lead.id}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                      selectedLead?.id === lead.id 
                        ? "bg-zinc-900 border-indigo-500/40 shadow-lg shadow-indigo-600/5" 
                        : "bg-zinc-900/30 border-zinc-800/60 hover:border-zinc-700/60"
                    )}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors border border-zinc-700/50">
                        <User size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-200">{lead.name}</span>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">{lead.handle}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end gap-1">
                        <select 
                          value={lead.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className={cn(
                            "bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer",
                            statusMap[lead.status]?.color.split(' ')[0]
                          )}
                        >
                          <option value="NEW" className="bg-zinc-950">Новый</option>
                          <option value="IN_PROGRESS" className="bg-zinc-950">В работе</option>
                          <option value="REJECTED" className="bg-zinc-950">Отказ</option>
                          <option value="DEAL" className="bg-zinc-950">Сделка</option>
                        </select>
                        <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">
                           Last: {lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : 'Never'}
                        </span>
                      </div>

                      <Button
                        variant="secondary"
                        className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border-indigo-500/20 h-8 font-bold uppercase tracking-widest text-[9px] px-3 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleGenerateMessage(lead); }}
                      >
                        <Sparkles size={12} className="mr-2" />
                        Магия ИИ
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Panel */}
        <div className="w-[450px] flex flex-col bg-[#0c0c0e] border-l border-zinc-800/60 animate-in slide-in-from-right duration-300">
          {selectedLead ? (
            <div className="flex flex-col h-full p-8 space-y-8">
              <div className="space-y-2">
                 <h2 className="text-xl font-bold tracking-tight text-white mb-1">{selectedLead.name}</h2>
                 <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em]">{selectedLead.handle} · {selectedLead.source}</p>
                 <div className="pt-2 flex gap-2">
                    <Badge variant="outline" className="text-[9px] bg-zinc-900 border-zinc-800">{selectedLead.status}</Badge>
                    {selectedLead.notes && <Badge variant="outline" className="text-[9px] bg-zinc-900 border-zinc-800">Has Notes</Badge>}
                 </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Сгенерированное касание</label>
                   {isGenerating && <span className="text-[9px] text-indigo-400 animate-pulse font-mono uppercase">AI Thinking...</span>}
                </div>
                
                <div className="relative flex-1 min-h-[300px] bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 shadow-inner group overflow-hidden">
                   {isGenerating ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-700">
                         <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                         <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Синтез структуры...</span>
                      </div>
                   ) : generatedMessage ? (
                      <textarea 
                        value={generatedMessage}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                        className="w-full h-full bg-transparent text-sm text-zinc-300 leading-relaxed outline-none resize-none selection:bg-indigo-500/30 font-sans"
                      />
                   ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                         <Sparkles size={40} className="text-zinc-800" />
                         <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 px-10">Нажми кнопку "Магия ИИ" для создания персонального оффера</p>
                      </div>
                   )}
                   {generatedMessage && !isGenerating && (
                      <div className="absolute top-2 right-3 text-[8px] text-indigo-500 font-mono opacity-40 uppercase tracking-widest">AI Result</div>
                   )}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Button 
                  disabled={!generatedMessage || isGenerating}
                  onClick={() => navigator.clipboard.writeText(generatedMessage).catch(() => alert('Не удалось скопировать. Выделите текст и скопируйте вручную.'))}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-xl shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-3"
                >
                  <Copy size={16} />
                  Скопировать сообщение
                </Button>
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="secondary" className="text-[10px] font-bold uppercase tracking-widest h-10 border-zinc-800" onClick={() => handleGenerateMessage(selectedLead)}>
                      Регенерация
                   </Button>
                   <Button variant="secondary" className="text-[10px] font-bold uppercase tracking-widest h-10 border-zinc-800" onClick={() => setSelectedLead(null)}>
                      Закрыть
                   </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30 select-none">
               <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center mb-8 shadow-inner text-zinc-800">
                  <Send size={32} />
               </div>
               <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Область Анализа</h3>
               <p className="text-[10px] text-zinc-700 font-mono leading-relaxed">Выбери лида из списка слева, чтобы начать процесс персонализированного аутрича.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
