import { useState, useRef, useEffect } from 'react'
import { Send, Save, Sparkles, User, Bot, Loader2, CheckCircle2, Zap, Trash2 } from 'lucide-react'
import { cn } from './lib/utils'
import { API_URL, checkedFetch as fetch } from './lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

interface AIChatProps {
  projectId: string
}


const QUICK_PROMPTS = [
  'Проанализируй текущий контент-план и предложи улучшения',
  'Напиши стратегию outreach для холодных лидов',
  'Сгенерируй 5 идей постов для Telegram-канала',
  'Оцени позиционирование проекта и выяви слабые места',
]

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function AIChat({ projectId }: AIChatProps) {
  // 1. Hydration: Инициализируем стейт из localStorage или дефолтным приветствием
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`growth_os_chat_${projectId}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse chat history', e)
      }
    }
    return [
      {
        id: genId(),
        role: 'assistant',
        content:
          'Система инициализирована.\n\nЯ — Growth OS Neural Core. Могу анализировать контент, строить стратегии и работать с данными твоего проекта. Задай вопрос или выбери быстрый промпт.',
        ts: Date.now(),
      },
    ]
  })

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 2. Persistence: Сохраняем историю при каждом изменении messages
  useEffect(() => {
    try { localStorage.setItem(`growth_os_chat_${projectId}`, JSON.stringify(messages)) }
    catch { console.error('Не удалось сохранить историю чата в браузере') }
  }, [messages, projectId])

  // App монтирует отдельный экземпляр с key={projectId}: история не смешивается.

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Автоматически подстраиваем высоту textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading) return

    const userMessage: Message = { id: genId(), role: 'user', content: msg, ts: Date.now() }
    setInput('')
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, projectId }),
      })

      const json = await res.json()
      const reply: Message = {
        id: genId(),
        role: 'assistant',
        content: json.data ?? 'Ошибка: не удалось получить ответ от системы.',
        ts: Date.now(),
      }
      setMessages(prev => [...prev, reply])
    } catch {
      setMessages(prev => [
        ...prev,
        { id: genId(), role: 'assistant', content: 'Критическая ошибка связи с ядром.', ts: Date.now() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToProject = async () => {
    // Находим последнее сообщение от ассистента
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistantMsg) return

    setSavedToast(true) // Показываем состояние загрузки/процесса

    try {
      // 1. Извлекаем инсайт через ИИ
      const extractRes = await fetch(`${API_URL}/api/ai/extract-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: lastAssistantMsg.content })
      })
      const extractJson = await extractRes.json()
      
      if (extractJson.data) {
        // 2. Сохраняем инсайт в базу
        await fetch(`${API_URL}/api/market/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            content: extractJson.data.content,
            category: extractJson.data.category,
            source: extractJson.data.source || ''
          })
        })
      }
    } catch (e) {
      console.error('Save insight error:', e)
    } finally {
      setTimeout(() => setSavedToast(false), 2500)
    }
  }

  const handleClear = () => {
    localStorage.removeItem(`growth_os_chat_${projectId}`)
    setMessages([
      {
        id: genId(),
        role: 'assistant',
        content: 'Сессия сброшена. Готов к новому заданию.',
        ts: Date.now(),
      },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-zinc-100 font-sans animate-in fade-in duration-300 relative">

      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-8 py-5 border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 rounded-xl bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_-6px_rgba(99,102,241,0.4)]">
            <Sparkles size={18} />
            {/* Live indicator */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] border-2 border-[#09090b]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">AI-Ассистент</h1>
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.25em] mt-0.5">
              Neural Core · Project_
              <span className="text-indigo-500/70">{projectId.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            title="Очистить сессию"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-800/60 text-zinc-600 hover:text-red-400 hover:border-red-900/40 transition-all"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={handleSaveToProject}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all',
              savedToast
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:border-indigo-500/30 hover:text-indigo-400'
            )}
          >
            {savedToast ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {savedToast ? 'Сохранено' : 'Сохранить в проект'}
          </button>
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 pb-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 animate-in slide-in-from-bottom-1 duration-200',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border',
                  msg.role === 'user'
                    ? 'bg-zinc-900 border-zinc-700/60 text-zinc-400'
                    : 'bg-indigo-900/20 border-indigo-500/20 text-indigo-400'
                )}
              >
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-tr-sm'
                    : 'bg-zinc-900/40 border border-zinc-800/50 text-zinc-300 rounded-tl-sm'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={cn(
                    'text-[9px] font-mono mt-2 opacity-40 uppercase tracking-[0.15em]',
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  )}
                >
                  {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center animate-in fade-in duration-300">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-900/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Quick Prompts ────────────────────────────────────── */}
      {messages.length <= 1 && !isLoading && (
        <div className="shrink-0 px-8 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <Zap size={9} className="text-indigo-600" />
              Быстрые промпты
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map(qp => (
                <button
                  key={qp}
                  onClick={() => handleSend(qp)}
                  className="text-left px-4 py-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-xs text-zinc-500 hover:text-zinc-300 hover:border-indigo-500/20 hover:bg-indigo-900/10 transition-all leading-relaxed"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Input ────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pb-8 pt-3 border-t border-zinc-800/60 bg-[#09090b]">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="relative flex-1 group">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Задай вопрос или дай задание... (Enter — отправить, Shift+Enter — перенос)"
              className={cn(
                'w-full resize-none bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-5 py-3.5 pr-20',
                'text-sm text-zinc-200 placeholder:text-zinc-600',
                'focus:outline-none focus:border-indigo-500/40 focus:bg-zinc-900/80',
                'transition-all duration-200 leading-relaxed min-h-[48px] max-h-[160px]',
                'custom-scrollbar'
              )}
            />
            <div className="absolute right-4 bottom-3.5 flex items-center gap-1.5 pointer-events-none">
              <span className="text-[8px] font-bold text-zinc-700 font-mono border border-zinc-800 rounded px-1 py-0.5 group-focus-within:border-indigo-500/30 group-focus-within:text-indigo-600/50 transition-all">
                ↵
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0',
              isLoading || !input.trim()
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40'
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
