import { useState, useEffect } from 'react'
import { Button, Input, Badge, ScrollArea, Card } from './components/ui'
import { API_URL } from './lib/api'
import { Link2, Plus, Trash2, Copy, Check, TrendingUp, TrendingDown } from 'lucide-react'

interface LinkStats {
  id: string
  name: string
  slug: string
  source: string
  creative: string | null
  targetUrl: string
  cost: number
  clicks: number
  registrations: number
  deposits: number
  revenue: number
  roi: number | null
  createdAt: string
}

function CreateLinkForm({ projectId, onSave, onCancel }: { projectId: string; onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [source, setSource] = useState('')
  const [creative, setCreative] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [cost, setCost] = useState('0')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !source.trim() || !targetUrl.trim()) {
      setError('Заполни имя, источник и целевой URL')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/traffic/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          source,
          creative: creative.trim() || null,
          targetUrl,
          cost: Number(cost) || 0,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Ошибка сохранения')
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
      <Card className="w-full max-w-lg p-8 bg-zinc-950 border-zinc-800/80 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Новая связка</h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Трафик · Источник × Креатив</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Имя связки</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Посев: канал ТрейдерПро" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Источник</label>
              <Input value={source} onChange={e => setSource(e.target.value)} placeholder="tg_traderpro" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Креатив</label>
              <Input value={creative} onChange={e => setCreative(e.target.value)} placeholder="post_v1 (опц.)" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Целевой URL</label>
            <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://лендинг-или-бот" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Расход, $</label>
            <Input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="50" />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 px-4 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onCancel} className="flex-1 text-[10px] font-bold uppercase tracking-widest">Отмена</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="flex-1 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500">
            {isSaving ? 'Сохранение...' : 'Создать'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function TrafficManager({ projectId }: { projectId: string }) {
  const [links, setLinks] = useState<LinkStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingCost, setEditingCost] = useState<{ id: string; value: string } | null>(null)

  useEffect(() => {
    if (projectId) fetchLinks()
  }, [projectId])

  const fetchLinks = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/traffic/links?projectId=${projectId}`)
      const j = await res.json()
      setLinks(j.data || [])
    } catch (e) {
      console.error('Traffic fetch error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const trackingUrl = (slug: string) => `${API_URL}/go/${slug}`

  const handleCopy = async (link: LinkStats) => {
    await navigator.clipboard.writeText(trackingUrl(link.slug))
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/api/traffic/links/${id}`, { method: 'DELETE' })
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  const saveCost = async () => {
    if (!editingCost) return
    const cost = Number(editingCost.value) || 0
    await fetch(`${API_URL}/api/traffic/links/${editingCost.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost }),
    })
    setEditingCost(null)
    fetchLinks()
  }

  const totals = links.reduce(
    (t, l) => ({ cost: t.cost + l.cost, revenue: t.revenue + l.revenue, clicks: t.clicks + l.clicks }),
    { cost: 0, revenue: 0, clicks: 0 },
  )
  const totalRoi = totals.cost > 0 ? (totals.revenue - totals.cost) / totals.cost : null

  const roiBadge = (roi: number | null) => {
    if (roi === null) return <span className="text-zinc-600 font-mono text-xs">—</span>
    const pct = (roi * 100).toFixed(0)
    return roi >= 0 ? (
      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-xs font-bold"><TrendingUp size={12} />+{pct}%</span>
    ) : (
      <span className="inline-flex items-center gap-1 text-red-400 font-mono text-xs font-bold"><TrendingDown size={12} />{pct}%</span>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
      {/* Header */}
      <div className="px-12 py-10 border-b border-zinc-800/40 flex items-center justify-between bg-zinc-950/20">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 mb-2 flex items-center gap-4">
            Трафик
            <Badge className="bg-indigo-600/10 text-indigo-400 border-indigo-500/20 font-mono text-[10px] tracking-widest uppercase">Tracker</Badge>
          </h1>
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.3em]">
            Связки · {links.length} · Клики {totals.clicks} · Расход ${totals.cost.toFixed(0)} · Доход ${totals.revenue.toFixed(0)}
            {totalRoi !== null && <> · ROI {(totalRoi * 100).toFixed(0)}%</>}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold uppercase tracking-widest">
          <Plus size={14} className="mr-2" /> Связка
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-zinc-700 font-mono text-[10px] uppercase tracking-widest animate-pulse">
              Загрузка связок...
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Link2 className="mx-auto text-zinc-700" size={32} />
              <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">Связок пока нет — создай первую и вставь ссылку в рекламный пост</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                  <th className="px-4 py-2">Связка</th>
                  <th className="px-4 py-2">Ссылка</th>
                  <th className="px-4 py-2 text-right">Клики</th>
                  <th className="px-4 py-2 text-right">Реги</th>
                  <th className="px-4 py-2 text-right">Депы</th>
                  <th className="px-4 py-2 text-right">Расход $</th>
                  <th className="px-4 py-2 text-right">Доход $</th>
                  <th className="px-4 py-2 text-right">ROI</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} className="bg-zinc-900/30 hover:bg-zinc-900/60 transition-all">
                    <td className="px-4 py-4 rounded-l-xl border-y border-l border-zinc-800/60">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-200">{link.name}</span>
                        <span className="text-[10px] font-mono text-zinc-600">{link.source}{link.creative ? ` · ${link.creative}` : ''}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-y border-zinc-800/60">
                      <button
                        onClick={() => handleCopy(link)}
                        className="inline-flex items-center gap-2 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                        title={trackingUrl(link.slug)}
                      >
                        {copiedId === link.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        /go/{link.slug}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-zinc-300 border-y border-zinc-800/60">{link.clicks}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-zinc-300 border-y border-zinc-800/60">{link.registrations}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-emerald-400 border-y border-zinc-800/60">{link.deposits}</td>
                    <td className="px-4 py-4 text-right border-y border-zinc-800/60">
                      {editingCost?.id === link.id ? (
                        <input
                          autoFocus
                          type="number"
                          value={editingCost.value}
                          onChange={e => setEditingCost({ id: link.id, value: e.target.value })}
                          onBlur={saveCost}
                          onKeyDown={e => e.key === 'Enter' && saveCost()}
                          className="w-20 bg-zinc-800 border border-indigo-500/40 rounded px-2 py-1 text-right font-mono text-xs text-zinc-200 outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingCost({ id: link.id, value: String(link.cost) })}
                          className="font-mono text-xs text-zinc-300 hover:text-indigo-400 border-b border-dashed border-zinc-700"
                        >
                          {link.cost.toFixed(0)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-zinc-200 border-y border-zinc-800/60">{link.revenue.toFixed(0)}</td>
                    <td className="px-4 py-4 text-right border-y border-zinc-800/60">{roiBadge(link.roi)}</td>
                    <td className="px-4 py-4 rounded-r-xl border-y border-r border-zinc-800/60 text-right">
                      <button onClick={() => handleDelete(link.id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {links.length > 0 && (
            <p className="mt-6 text-[10px] text-zinc-600 font-mono leading-relaxed">
              ПОСТБЕК (нужен заголовок x-postback-token; eventid уникален для каждого события): {API_URL}/api/traffic/postback?clickid={'{clickid}'}&eventid={'{unique_event_id}'}&type=deposit&payout={'{payout}'}
            </p>
          )}
        </div>
      </ScrollArea>

      {showForm && (
        <CreateLinkForm
          projectId={projectId}
          onSave={() => { setShowForm(false); fetchLinks() }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
