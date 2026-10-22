import { useState, useEffect } from 'react'
import { Button, Input, Textarea, ScrollArea, Card } from './components/ui'
import { API_URL } from './lib/api'

interface OutreachTemplate {
  id: string
  name: string
  content: string
  projectId: string
  createdAt: string
}


// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-8 bg-slate-950 border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1 text-[10px] font-bold uppercase tracking-widest">
            Отмена
          </Button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Удалить
          </button>
        </div>
      </Card>
    </div>
  )
}

// ─── Template Form (create / edit) ───────────────────────────────────────────
function TemplateForm({
  initial,
  projectId,
  onSave,
  onCancel,
}: {
  initial?: OutreachTemplate
  projectId: string
  onSave: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      setError('Заполни название и текст шаблона')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const url = initial
        ? `${API_URL}/api/outreach/templates/${initial.id}`
        : `${API_URL}/api/outreach/templates`
      const method = initial ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, projectId }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error?.message || 'Ошибка сохранения')
        return
      }
      onSave()
    } catch {
      setError('Нет связи с сервером')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <Card className="w-full max-w-lg p-8 bg-slate-950 border-slate-800 shadow-2xl space-y-7 animate-in fade-in zoom-in duration-200">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {initial ? 'Редактировать шаблон' : 'Новый шаблон'}
          </h2>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">
            Outreach Editor · Шаблоны сообщений
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Название шаблона
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Напр: Холодный старт v1"
              className="bg-slate-900 border-slate-700/60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Текст сообщения
            </label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Привет, {name}! Увидел твой профиль и хочу предложить..."
              className="h-40 bg-slate-900 border-slate-700/60 leading-relaxed"
            />
            <p className="text-[10px] text-indigo-400/60 ml-1">
              💡 Используй <code className="bg-slate-800 px-1 rounded">{'{name}'}</code> для подстановки имени лида и{' '}
              <code className="bg-slate-800 px-1 rounded">{'{username}'}</code> — для ника в TG.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1 text-[10px] font-bold uppercase tracking-widest"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500"
          >
            {isSaving ? 'Сохранение...' : initial ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OutreachEditor({ projectId }: { projectId: string }) {
  const [templates, setTemplates] = useState<OutreachTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<OutreachTemplate | undefined>()

  useEffect(() => {
    if (projectId) fetchTemplates()
  }, [projectId])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/outreach/templates?projectId=${projectId}`)
      const j = await res.json()
      setTemplates(j.data || [])
    } catch (e) {
      console.error('Templates fetch error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/outreach/templates/${id}`, { method: 'DELETE' })
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      console.error('Delete error:', e)
    } finally {
      setDeleteTarget(undefined)
    }
  }

  const openCreate = () => {
    setEditingTemplate(undefined)
    setShowForm(true)
  }

  const openEdit = (t: OutreachTemplate) => {
    setEditingTemplate(t)
    setShowForm(true)
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditingTemplate(undefined)
    fetchTemplates()
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
      {/* Header */}
      <div className="px-12 py-10 border-b border-slate-800/60 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 mb-2">
            Шаблоны Сообщений
          </h1>
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">
            Outreach Engine · {templates.length} шаблонов
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="px-8 font-bold uppercase tracking-widest text-[10px] bg-indigo-600 hover:bg-indigo-500"
        >
          + Создать шаблон
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1 p-12">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-600 font-mono text-[10px] uppercase tracking-widest">
              Загрузка шаблонов...
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 text-slate-700 text-3xl">
                📑
              </div>
              <h3 className="text-lg font-medium text-slate-400 mb-2">Шаблонов пока нет</h3>
              <p className="text-sm text-slate-600 mb-8 max-w-xs">
                Создай первый шаблон и используй его для отправки сообщений лидам.
              </p>
              <Button onClick={openCreate} variant="secondary">
                Создать первый шаблон
              </Button>
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/40">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Название
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Текст сообщения
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Дата создания
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {templates.map(t => (
                    <tr key={t.id} className="group hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-slate-200">{t.name}</span>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        <p
                          className="text-xs text-slate-400 truncate leading-relaxed"
                          title={t.content}
                        >
                          {t.content}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-mono text-slate-600">
                          {new Date(t.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(t)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 border border-slate-700/50 hover:border-indigo-500/30 transition-all"
                          >
                            Ред.
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-slate-800 hover:bg-red-600/20 text-slate-500 hover:text-red-400 border border-slate-700/50 hover:border-red-900/40 transition-all"
                          >
                            Удалить
                          </button>
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

      {/* Create / Edit Modal */}
      {showForm && (
        <TemplateForm
          initial={editingTemplate}
          projectId={projectId}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditingTemplate(undefined) }}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Удалить шаблон «${deleteTarget.name}»? Это действие нельзя отменить.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
        />
      )}
    </div>
  )
}
