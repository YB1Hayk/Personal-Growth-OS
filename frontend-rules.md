# Frontend Rules — Personal Growth OS

> Актуализация 13.10.2026. Фактический стек: React 19 + Vite 8 + TypeScript + Tailwind 4. TanStack Query, Zustand, React Router и React Hook Form пока не установлены; ниже — целевые соглашения, не перечень реализованных библиотек.
> Инструкция запуска и обновления БД: `README_REVIEW.md`. Итоги проверки: `AUDIT_RU.md`.


## Стек
- React 18 + Vite + TypeScript (strict mode)
- Tailwind CSS — только utility классы, никакого кастомного CSS
- Tanstack Query v5 — все запросы к API
- Zustand — глобальный стейт
- React Router v6 — навигация
- Zod — валидация форм на клиенте
- React Hook Form — управление формами

---

## Структура проекта

```
apps/dashboard/src/
├── api/              # функции запросов к API (по модулям)
│   ├── projects.ts
│   ├── leads.ts
│   ├── content.ts
│   ├── outreach.ts
│   └── agent.ts
├── components/       # переиспользуемые UI компоненты
│   ├── ui/           # базовые: Button, Input, Modal, Table, Badge
│   └── shared/       # составные: LeadCard, PostPreview, FunnelChart
├── modules/          # модули платформы
│   ├── niche/        # нишевой менеджер
│   ├── content/      # контент движок
│   ├── leads/        # лидогенератор
│   ├── outreach/     # outreach менеджер
│   └── agent/        # AI sales агент
├── hooks/            # кастомные хуки
├── store/            # Zustand сторы
├── types/            # TypeScript типы (импорт из packages/shared)
├── lib/              # утилиты, константы, axios инстанс
└── pages/            # страницы роутера
```

Каждый модуль внутри:
```
modules/leads/
├── components/       # компоненты только этого модуля
├── hooks/            # хуки только этого модуля
├── api.ts            # запросы к API этого модуля
└── index.ts          # публичный экспорт
```

---

## Компоненты

**Правило одной ответственности.** Компонент делает одно — рендерит UI. Логика в хуках.

```tsx
// ПЛОХО — логика в компоненте
const LeadList = () => {
  const [leads, setLeads] = useState([])
  useEffect(() => { fetch('/api/leads').then(...) }, [])
  return <div>{leads.map(...)}</div>
}

// ХОРОШО — логика в хуке
const LeadList = () => {
  const { leads, isLoading } = useLeads()
  if (isLoading) return <Spinner />
  return <div>{leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}</div>
}
```

**Размер компонента.** Если компонент больше 150 строк — разбивай. Если JSX глубже 4 уровней вложенности — выноси в отдельный компонент.

**Props.** Деструктурируй всегда. Типизируй через `interface`, не `type` для пропсов. Не передавай более 5 пропсов — если больше, используй объект конфигурации.

```tsx
// ПЛОХО
const Card = (props) => <div style={{color: props.color}}>{props.title}</div>

// ХОРОШО
interface CardProps {
  title: string
  status: 'active' | 'inactive'
  onAction: (id: string) => void
}
const Card = ({ title, status, onAction }: CardProps) => { ... }
```

---

## Работа с данными (Tanstack Query)

Один хук — один ресурс. Называй хуки `use{Ресурс}` или `use{Действие}{Ресурс}`.

```tsx
// Запрос данных
export const useLeads = (projectId: string) => {
  return useQuery({
    queryKey: ['leads', projectId],
    queryFn: () => api.leads.getAll(projectId),
    staleTime: 30_000,
  })
}

// Мутация
export const useCreateLead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.leads.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads', variables.projectId] })
    },
  })
}
```

**QueryKeys.** Всегда массив. Первый элемент — ресурс, далее — фильтры/идентификаторы.

```tsx
// Константы ключей в api/{module}.ts
export const leadsKeys = {
  all: ['leads'] as const,
  byProject: (id: string) => ['leads', id] as const,
  detail: (id: string) => ['leads', 'detail', id] as const,
}
```

**Обработка состояний.** Всегда обрабатывай `isLoading`, `isError`. Никогда не рендери данные без проверки.

---

## Глобальный стейт (Zustand)

Только для данных которые нужны во всём приложении: текущий проект, UI-стейт дашборда (открытое меню, выбранный модуль).

```tsx
// store/projectStore.ts
interface ProjectStore {
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
}))
```

Не храни в Zustand то, что уже есть в Tanstack Query. Серверные данные — в Query, UI-стейт — в Zustand.

---

## TypeScript

- `strict: true` в tsconfig, не отключать
- Никакого `any`. Если не знаешь тип — используй `unknown` и сужай
- Импортируй типы через `import type { ... }`
- Энумы только через `as const` объекты:

```tsx
// ПЛОХО
enum Status { Active, Inactive }

// ХОРОШО
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' } as const
type Status = typeof STATUS[keyof typeof STATUS]
```

---

## Стили (Tailwind)

- Никакого инлайн `style={}` кроме динамических значений (ширина в пикселях, цвет из переменной)
- Группируй классы: layout → spacing → typography → colors → effects
- Для условных классов используй `clsx` или `cn` утилиту
- Тема приложения: тёмный интерфейс (`bg-gray-900`, `bg-gray-800`), акцент — индиго (`indigo-500`)

```tsx
// ХОРОШО
<div className={cn(
  'flex items-center gap-3 px-4 py-2',
  'text-sm font-medium text-gray-300',
  isActive && 'bg-gray-700 text-white'
)}>
```

---

## Формы

Все формы через React Hook Form + Zod.

```tsx
const schema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  niche: z.string().min(1, 'Обязательное поле'),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})
```

---

## API слой

Единый axios инстанс в `lib/axios.ts` с базовым URL и интерцепторами для ошибок. Все запросы — типизированные функции в `api/{module}.ts`.

```tsx
// lib/axios.ts
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })
api.interceptors.response.use(
  (res) => res.data.data,
  (err) => Promise.reject(err.response?.data?.error ?? err.message)
)

// api/leads.ts
export const leadsApi = {
  getAll: (projectId: string): Promise<Lead[]> =>
    api.get(`/leads?projectId=${projectId}`),
  create: (data: CreateLeadDto): Promise<Lead> =>
    api.post('/leads', data),
}
```

---

## Обработка ошибок

- Глобальный error boundary на уровне App
- Toast-уведомления для ошибок мутаций (react-hot-toast)
- Пустые состояния (`EmptyState` компонент) для пустых списков
- Никогда не показывай техническую ошибку пользователю — только понятное сообщение

---

## Запрещено

- `useEffect` для запросов данных — только Tanstack Query
- Прямые вызовы `fetch` — только через axios инстанс
- Хардкод URL и строк — только константы из `lib/constants.ts`
- Импорты через `../../../` больше двух уровней — используй path aliases (`@/`)
- `console.log` в продакшн коде — только `console.error` для реальных ошибок
