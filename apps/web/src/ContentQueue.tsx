import { useState } from "react"

type PostStatus = "draft" | "published" | "scheduled" | "generating"
type Platform = "telegram" | "threads" | "instagram"

interface Post {
    id: string
    title: string
    content: string | null
    status: PostStatus
    platform: Platform
    scheduledAt: string
    type?: string
}

const MOCK_POSTS: Post[] = [
    { id: "7764", title: "Минимализм в диджитал-продуктах", content: null, status: "draft", platform: "telegram", scheduledAt: "10:30" },
    { id: "b876", title: "Твой стиль — твои правила: Как носить классику сегодня", content: null, status: "published", platform: "instagram", scheduledAt: "10:30" },
    { id: "ab0f", title: "История одного релиза: Как 'Bred' изменили мир", content: "Ночь. Мехико. Запах свежего апельсина и шум старых скейт-парков. Ты выходишь из тени, и все взгляды прикованы к твоим ногам...", status: "draft", platform: "threads", scheduledAt: "10:30", type: "STORYTELLING" },
    { id: "9b2c", title: "Почему детали решают всё: Взгляд кикнутого сноба", content: null, status: "draft", platform: "telegram", scheduledAt: "10:30" },
    { id: "3dc2", title: "Сникер-культура в 2024: Что стоит твоего внимания?", content: null, status: "draft", platform: "instagram", scheduledAt: "10:30" },
    { id: "f1a3", title: "Легенда о Jarritos: Когда газировка становится искусством", content: null, status: "scheduled", platform: "threads", scheduledAt: "14:00" },
]

const STATUS_CONFIG = {
    draft: { label: "Черновик", color: "bg-zinc-700 text-zinc-300" },
    published: { label: "Опубликован", color: "bg-emerald-900/60 text-emerald-400" },
    scheduled: { label: "Запланирован", color: "bg-blue-900/60 text-blue-400" },
    generating: { label: "Генерация...", color: "bg-amber-900/60 text-amber-400" },
}

const PLATFORM_CONFIG = {
    telegram: { label: "TG", color: "text-sky-400" },
    threads: { label: "TH", color: "text-purple-400" },
    instagram: { label: "IG", color: "text-pink-400" },
}

const PlatformDot = ({ platform }: { platform: Platform }) => (
    <span className={`text-xs font-bold font-mono ${PLATFORM_CONFIG[platform].color}`}>
        {PLATFORM_CONFIG[platform].label}
    </span>
)

const StatusBadge = ({ status }: { status: PostStatus }) => (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_CONFIG[status].color}`}>
        {STATUS_CONFIG[status].label}
    </span>
)

const PostCard = ({ post, isSelected, onClick }: { post: Post; isSelected: boolean; onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`group relative px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-zinc-800/60 hover:bg-zinc-800/40 ${isSelected ? "bg-zinc-800/60 border-l-2 border-l-indigo-500" : "border-l-2 border-l-transparent"}`}
    >
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <PlatformDot platform={post.platform} />
                    {post.type && (
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {post.type}
                        </span>
                    )}
                </div>
                <p className="text-sm font-medium text-zinc-200 leading-snug truncate pr-2">
                    {post.title}
                </p>
                {post.content ? (
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {post.content}
                    </p>
                ) : (
                    <p className="text-xs text-zinc-600 mt-1 italic">Контент не сгенерирован</p>
                )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge status={post.status} />
                <span className="text-[11px] text-zinc-500 font-mono">{post.scheduledAt}</span>
            </div>
        </div>
    </div>
)

const GenerateButton = () => (
    <button className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        Сгенерировать
    </button>
)

export default function ContentQueue() {
    const [selected, setSelected] = useState<string | null>("ab0f")
    const [filter, setFilter] = useState<"all" | Platform>("all")

    const selectedPost = MOCK_POSTS.find(p => p.id === selected)
    const filtered = filter === "all" ? MOCK_POSTS : MOCK_POSTS.filter(p => p.platform === filter)

    const counts = {
        draft: MOCK_POSTS.filter(p => p.status === "draft").length,
        published: MOCK_POSTS.filter(p => p.status === "published").length,
        scheduled: MOCK_POSTS.filter(p => p.status === "scheduled").length,
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">

            {/* Sidebar */}
            <div className="w-56 border-r border-zinc-800/60 flex flex-col shrink-0">
                <div className="p-4 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold text-zinc-100">Growth OS</span>
                    </div>
                    <div className="space-y-0.5">
                        {[
                            { icon: "◈", label: "Проекты" },
                            { icon: "✦", label: "Контент", active: true },
                            { icon: "◉", label: "Лиды" },
                            { icon: "◎", label: "Outreach" },
                            { icon: "◆", label: "Sales агент" },
                        ].map(item => (
                            <button key={item.label} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${item.active ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"}`}>
                                <span className="text-xs">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-3 mt-auto border-t border-zinc-800/60">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">N</div>
                        <span className="text-xs text-zinc-400">Nikol</span>
                    </div>
                </div>
            </div>

            {/* Main: Post list */}
            <div className="w-80 border-r border-zinc-800/60 flex flex-col shrink-0">
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-zinc-800/60">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-sm font-semibold text-zinc-100">Контент</h1>
                        <GenerateButton />
                    </div>
                    {/* Stats row */}
                    <div className="flex gap-3">
                        {[
                            { label: "черновик", count: counts.draft, color: "text-zinc-400" },
                            { label: "план", count: counts.scheduled, color: "text-blue-400" },
                            { label: "готово", count: counts.published, color: "text-emerald-400" },
                        ].map(s => (
                            <div key={s.label} className="flex items-baseline gap-1">
                                <span className={`text-base font-bold tabular-nums ${s.color}`}>{s.count}</span>
                                <span className="text-[10px] text-zinc-600">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform filter */}
                <div className="flex gap-1 px-3 py-2.5 border-b border-zinc-800/60">
                    {(["all", "telegram", "threads", "instagram"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${filter === f ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            {f === "all" ? "Все" : PLATFORM_CONFIG[f].label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isSelected={selected === post.id}
                            onClick={() => setSelected(post.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Detail panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {selectedPost ? (
                    <>
                        {/* Detail header */}
                        <div className="px-6 py-4 border-b border-zinc-800/60 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <PlatformDot platform={selectedPost.platform} />
                                    <StatusBadge status={selectedPost.status} />
                                    <span className="text-xs text-zinc-600 font-mono">#{selectedPost.id}</span>
                                </div>
                                <h2 className="text-base font-semibold text-zinc-100 leading-snug max-w-lg">
                                    {selectedPost.title}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                <button className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-700 rounded-md transition-colors">
                                    Редактировать
                                </button>
                                <button className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">
                                    Опубликовать
                                </button>
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {selectedPost.content ? (
                                <div>
                                    {selectedPost.type && (
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 border border-zinc-700 px-2 py-1 rounded">
                                                Тип: {selectedPost.type}
                                            </span>
                                        </div>
                                    )}
                                    <div className="prose prose-sm prose-invert max-w-none">
                                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {selectedPost.content}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Meta */}
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        {[
                                            { label: "Платформа", value: selectedPost.platform },
                                            { label: "Время", value: selectedPost.scheduledAt },
                                            { label: "ID", value: `#${selectedPost.id}` },
                                        ].map(m => (
                                            <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                                                <p className="text-[10px] text-zinc-600 mb-0.5">{m.label}</p>
                                                <p className="text-xs font-medium text-zinc-300 font-mono">{m.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700 flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-300 mb-1">Контент не сгенерирован</p>
                                        <p className="text-xs text-zinc-600">Нажми "Сгенерировать" чтобы создать текст</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                        Сгенерировать контент
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
                        Выбери пост из списка
                    </div>
                )}
            </div>

        </div>
    )
}
