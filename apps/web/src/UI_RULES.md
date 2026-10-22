# UI Rules — Personal Growth OS

## Философия дизайна

Референсы: Notion, Linear, Raycast, Vercel Dashboard.
Стиль: **тёмный, плотный, профессиональный**. Всё лишнее убрано. Информация на первом месте.

---

## Цвета (CSS переменные)

```css
:root {
  /* Фоны */
  --bg-base:        #09090b;  /* zinc-950 — основной фон */
  --bg-surface:     #18181b;  /* zinc-900 — карточки, панели */
  --bg-elevated:    #27272a;  /* zinc-800 — hover, выделение */
  --bg-overlay:     #3f3f46;  /* zinc-700 — активные элементы */

  /* Границы */
  --border:         rgba(39,39,42,0.6);  /* zinc-800/60 */
  --border-strong:  #3f3f46;             /* zinc-700 */

  /* Текст */
  --text-primary:   #f4f4f5;  /* zinc-100 */
  --text-secondary: #a1a1aa;  /* zinc-400 */
  --text-muted:     #71717a;  /* zinc-500 */
  --text-ghost:     #52525b;  /* zinc-600 */

  /* Акцент */
  --accent:         #6366f1;  /* indigo-500 */
  --accent-hover:   #818cf8;  /* indigo-400 */
  --accent-bg:      rgba(99,102,241,0.15);

  /* Статусы */
  --status-draft:   #71717a;  /* zinc-500 */
  --status-published: #34d399; /* emerald-400 */
  --status-scheduled: #60a5fa; /* blue-400 */
  --status-error:   #f87171;  /* red-400 */

  /* Платформы */
  --platform-tg:    #38bdf8;  /* sky-400 */
  --platform-threads: #a78bfa; /* purple-400 */
  --platform-ig:    #f472b6;  /* pink-400 */
}
```

---

## Типографика

```css
/* Шрифты */
font-family: 'Geist', 'Inter', system-ui;      /* основной */
font-family: 'Geist Mono', 'JetBrains Mono';   /* монospace — ID, код, время */

/* Размеры */
--text-xs:   11px;  /* метки, теги, мета */
--text-sm:   13px;  /* основной контент списков */
--text-base: 15px;  /* заголовки панелей */
--text-lg:   18px;  /* заголовки страниц */

/* Веса */
font-weight: 400;  /* обычный текст */
font-weight: 500;  /* заголовки, лейблы */
font-weight: 600;  /* акцентные заголовки */
font-weight: 700;  /* цифры, счётчики */
```

---

## Структура layout (3-колонки)

```
┌─────────────┬──────────────────┬────────────────────────┐
│  Sidebar    │   List panel     │   Detail panel         │
│  56px nav   │   320px          │   flex-1               │
│  иконки +   │   фильтры +      │   контент выбранного   │
│  лейблы     │   список карточек│   элемента             │
└─────────────┴──────────────────┴────────────────────────┘
```

- Sidebar: `w-14` (иконки) или `w-56` (иконки + текст)
- List panel: `w-80` фиксированная, `overflow-y-auto`
- Detail panel: `flex-1`, `min-w-0`
- Все колонки: `h-screen`, разделены `border-r border-zinc-800/60`

---

## Компоненты

### Карточка в списке
```
высота: auto, min 56px
padding: px-4 py-3.5
border-bottom: 1px zinc-800/60
border-left: 2px transparent (неактивна) / indigo-500 (активна)
hover: bg-zinc-800/40
active: bg-zinc-800/60
```

### Бейдж статуса
```
размер: text-[10px], px-2 py-0.5, rounded-full
uppercase, tracking-wider, font-semibold
draft:     bg-zinc-700     text-zinc-300
published: bg-emerald-900/60 text-emerald-400
scheduled: bg-blue-900/60   text-blue-400
error:     bg-red-900/60    text-red-400
```

### Кнопка (primary)
```
bg-indigo-600 hover:bg-indigo-500
text-white, text-sm, font-medium
px-3.5 py-2, rounded-lg
transition-colors duration-150
```

### Кнопка (secondary)
```
bg-zinc-800/60 hover:bg-zinc-700
text-zinc-400 hover:text-zinc-200
text-xs, font-medium
px-3 py-1.5, rounded-md
```

### Метка платформы
```
TG  → text-sky-400,    font-mono, font-bold, text-xs
TH  → text-purple-400, font-mono, font-bold, text-xs
IG  → text-pink-400,   font-mono, font-bold, text-xs
```

### Input / Textarea
```
bg-zinc-900 border border-zinc-700
focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
text-zinc-100 placeholder-zinc-600
text-sm, px-3 py-2, rounded-lg
```

### Пустое состояние (empty state)
```
flex flex-col items-center justify-center
иконка: 48px, bg-zinc-800/60 border border-zinc-700, rounded-2xl
заголовок: text-sm font-medium text-zinc-300
подзаголовок: text-xs text-zinc-600
кнопка действия ниже
```

---

## Правила UX

**Состояния загрузки:**
- Список: skeleton строки (animate-pulse, bg-zinc-800, rounded)
- Кнопка во время действия: spinner + "..." текст, disabled

**Иерархия информации в карточке:**
1. Платформа (цветной лейбл) + тип контента
2. Заголовок поста (truncate)
3. Превью текста если есть (line-clamp-2, muted)
4. Статус + время (справа)

**Интерактивность:**
- Клик на карточку → открывает detail panel (не новая страница)
- Hover на карточку → показывает действия (edit, delete иконки)
- Выбранная карточка → border-left indigo + bg выделение

**Плотность:**
- Не оставляй пустого места без причины
- Используй gap-3 / gap-4 между элементами, не gap-6+
- Padding внутри карточек: px-4 py-3.5 (компактно, не просторно)

---

## Запрещено

- Белый или светлый фон — только тёмная тема
- Карточки с тенями (box-shadow) — только border
- Rounded-2xl и больше для карточек в списке — только rounded-md / rounded-lg
- Градиенты на фонах панелей
- Анимации дольше 200ms на hover/transition
- Текст мельче 11px
- Иконки без подписей в основной навигации
- Модальные окна для простых действий — используй inline редактирование или side panel
