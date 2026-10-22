import { useState, useEffect } from 'react'
import { Button, Input, Textarea, Badge, ScrollArea, Card } from './components/ui'
import { cn } from './lib/utils'
import { API_URL } from './lib/api'

interface Lead {
  id: string
  name: string
  handle: string
  source: string
  status: string
  notes?: string | null
  createdAt: string
  projectId: string
}

interface OutreachTemplate {
  id: string
  name: string
  content: string
}


// ─── Interpolation (same logic as backend) ───────────────────────────────────
function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-950 border border-emerald-700/60 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <span className="text-emerald-400 text-lg">✓</span>
      <span className="text-sm font-medium text-emerald-300">{message}</span>
    </div>
  )
}

// ─── Outreach Modal ───────────────────────────────────────────────────────────
function OutreachModal({
  lead,
  projectId,
  onClose,
  onSent,
}: {
  lead: Lead
  projectId: string
  onClose: () => void
  onSent: () => void
}) {
  const [templates, setTemplates] = useState<OutreachTemplate[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/outreach/templates?projectId=${projectId}`)
      .then(r => r.json())
      .then(j => {
        const list: OutreachTemplate[] = j.data || []
        setTemplates(list)
        if (list.length > 0) setSelectedId(list[0].id)
      })
      .catch(console.error)
  }, [projectId])

  const selected = templates.find(t => t.id === selectedId)
  const preview = selected
    ? interpolate(selected.content, {
        name: lead.name,
        username: lead.handle.replace('@', ''),
      })
    : ''

  const handleSend = async () => {
    if (!selectedId) return
    setIsSending(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/outreach/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, templateId: selectedId }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error?.message || 'Ошибка отправки')
        return
      }
      onSent()
      onClose()
    } catch {
      setError('Нет связи с сервером')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <Card className="w-full max-w-lg p-8 bg-zinc-950 border-zinc-800/80 shadow-2xl space-y-7 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Отправить сообщение</h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">
            Лид: <span className="text-indigo-400">{lead.name}</span> · {lead.handle}
          </p>
        </div>

        {/* Template selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
            Шаблон
          </label>
          {templates.length === 0 ? (
            <p className="text-xs text-zinc-600 italic py-2">
              Нет шаблонов для этого проекта. Создай через API: POST /api/outreach/templates
            </p>
          ) : (
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-indigo-500/60 transition-colors"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id} className="bg-zinc-950">
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Live preview */}
        {preview && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
              Предпросмотр
            </label>
            <div className="relative">
              <div className="w-full min-h-[80px] bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {preview}
              </div>
              <span className="absolute top-2 right-3 text-[9px] text-zinc-600 font-mono">live</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 text-[10px] font-bold uppercase tracking-widest"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !selectedId}
            className="flex-1 text-[10px] font-bold uppercase tracking-widest"
          >
            {isSending ? 'Отправка...' : '✉ Отправить'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeadManager({ projectId }: { projectId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [outreachLead, setOutreachLead] = useState<Lead | null>(null)
  const [toast, setToast] = useState('')
  // Track "last touch today" per lead id
  const [touchedLeads, setTouchedLeads] = useState<Set<string>>(new Set())

  // New Lead form
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      console.error('Leads fetch error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLead = async () => {
    if (!name || !contact || !source) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, source, note, projectId }),
      })
      if (res.ok) {
        await fetchLeads()
        setShowModal(false)
        resetForm()
      }
    } catch (e) {
      console.error('Create lead error:', e)
    } finally {
      setIsSubmitting(false)
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
      console.error('Update status error:', e)
    }
  }

  const handleOutreachSent = (leadId: string) => {
    setTouchedLeads(prev => new Set(prev).add(leadId))
    setToast('Сообщение доставлено')
  }

  const resetForm = () => {
    setName('')
    setContact('')
    setSource('')
    setNote('')
  }

  const statusColor = (status: string) => {
    if (status === 'NEW') return 'text-indigo-400'
    if (status === 'IN_PROGRESS' || status === 'CONTACTED') return 'text-yellow-400'
    if (status === 'QUALIFIED' || status === 'CLOSED') return 'text-emerald-400'
    return 'text-zinc-500'
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
      {/* Header */}
      <div className="px-12 py-10 border-b border-zinc-800/40 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 mb-2">Управление Лидами</h1>
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.3em]">
            Центр работы с клиентами · {leads.length} контактов
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="px-8 font-bold uppercase tracking-widest text-[10px]"
        >
          + Добавить лида
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1 p-12">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
              Загрузка базы лидов...
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 text-zinc-800">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-400 mb-2">Лидов пока нет</h3>
              <p className="text-sm text-zinc-600 mb-8 max-w-xs">
                Начни добавлять контакты вручную или включи авто-сбор.
              </p>
              <Button variant="secondary" onClick={() => setShowModal(true)}>
                Создать первого лида
              </Button>
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/40">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Имя</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TG-контакт</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Статус</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Источник</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Заметка</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Дата</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Касание</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {leads.map(lead => (
                    <tr key={lead.id} className="group hover:bg-zinc-800/20 transition-all">
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-zinc-200">{lead.name}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono text-indigo-400">{lead.handle}</span>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={lead.status}
                          onChange={e => handleUpdateStatus(lead.id, e.target.value)}
                          className={cn(
                            'bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-colors',
                            statusColor(lead.status),
                          )}
                        >
                          <option value="NEW" className="bg-zinc-950">Новый</option>
                          <option value="IN_PROGRESS" className="bg-zinc-950">В работе</option>
                          <option value="CLOSED" className="bg-zinc-950">Закрыт</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className="text-[9px]">{lead.source}</Badge>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-zinc-500 max-w-[180px] truncate" title={lead.notes || ''}>
                          {lead.notes || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-mono text-zinc-600">
                          {new Date(lead.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </td>
                      {/* Touch column */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-start gap-1">
                          <button
                            onClick={() => setOutreachLead(lead)}
                            title="Отправить сообщение"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                          >
                            ✉
                          </button>
                          {touchedLeads.has(lead.id) && (
                            <span className="text-[9px] font-mono text-emerald-500 leading-none">
                              касание: сегодня
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <Card className="w-full max-w-md p-8 bg-zinc-950 border-zinc-800/80 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-200">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Новый Лид</h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Регистрация нового контакта</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Имя</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">TG-контакт</label>
                <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="@username" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Источник</label>
                <Input value={source} onChange={e => setSource(e.target.value)} placeholder="TG Канал, Холодный поиск..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Заметка</label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Доп. информация..." className="h-24" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1 text-[10px] font-bold uppercase tracking-widest">
                Отмена
              </Button>
              <Button onClick={handleCreateLead} disabled={isSubmitting} className="flex-1 text-[10px] font-bold uppercase tracking-widest">
                {isSubmitting ? 'Сохранение...' : 'Добавить'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Outreach Modal */}
      {outreachLead && (
        <OutreachModal
          lead={outreachLead}
          projectId={projectId}
          onClose={() => setOutreachLead(null)}
          onSent={() => handleOutreachSent(outreachLead.id)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}
