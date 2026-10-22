# Backend Rules — Personal Growth OS

> Актуализация 13.10.2026. Фактический стек: Express 4 + TypeScript + Prisma 5 + SQLite. Bull/Redis, Winston и n8n пока не подключены; ниже остаются целевые соглашения.
> Инструкция запуска и обновления БД: `README_REVIEW.md`. Итоги проверки: `AUDIT_RU.md`.


## Стек
- Node.js 20 + Express + TypeScript (strict mode)
- Prisma ORM — все запросы к PostgreSQL
- Zod — валидация входящих данных
- Bull — очереди задач (Redis)
- Winston — логирование
- Axios — HTTP запросы к внешним API (n8n, Claude, SendGrid)

---

## Структура проекта

```
apps/api/src/
├── modules/          # бизнес-модули
│   ├── projects/     # нишевой менеджер
│   ├── content/      # контент движок
│   ├── leads/        # лидогенератор
│   ├── outreach/     # outreach менеджер
│   └── agent/        # AI sales агент
├── shared/
│   ├── middleware/   # auth (VPN check), errorHandler, requestLogger
│   ├── lib/          # prisma клиент, redis, axios инстансы
│   ├── types/        # глобальные TypeScript типы
│   └── utils/        # общие утилиты
├── queues/           # Bull очереди и процессоры
└── app.ts            # точка входа
```

Каждый модуль:
```
modules/leads/
├── leads.router.ts     # Express роутер, только маршруты
├── leads.controller.ts # обработка req/res, вызов сервиса
├── leads.service.ts    # бизнес-логика
├── leads.repository.ts # запросы к БД через Prisma
├── leads.schema.ts     # Zod схемы валидации
└── leads.types.ts      # типы модуля
```

---

## Слои архитектуры

**Строгое разделение.** Данные текут только вниз: Router → Controller → Service → Repository.

**Router** — только маршруты и middleware:
```ts
// leads.router.ts
const router = Router()
router.get('/', validate(getLeadsSchema), leadsController.getAll)
router.post('/', validate(createLeadSchema), leadsController.create)
export default router
```

**Controller** — только req/res, никакой бизнес-логики:
```ts
// leads.controller.ts
export const leadsController = {
  getAll: async (req: Request, res: Response) => {
    const leads = await leadsService.getAll(req.query.projectId as string)
    res.json({ data: leads, error: null, meta: { count: leads.length } })
  },
  create: async (req: Request, res: Response) => {
    const lead = await leadsService.create(req.body)
    res.status(201).json({ data: lead, error: null, meta: null })
  },
}
```

**Service** — вся бизнес-логика, оркестрация:
```ts
// leads.service.ts
export const leadsService = {
  getAll: async (projectId: string): Promise<Lead[]> => {
    return leadsRepository.findByProject(projectId)
  },
  create: async (dto: CreateLeadDto): Promise<Lead> => {
    const exists = await leadsRepository.findByContact(dto.contact)
    if (exists) throw new AppError('Лид уже существует', 409)
    return leadsRepository.create(dto)
  },
}
```

**Repository** — только Prisma запросы, никакой логики:
```ts
// leads.repository.ts
export const leadsRepository = {
  findByProject: (projectId: string) =>
    prisma.lead.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } }),
  create: (data: CreateLeadDto) =>
    prisma.lead.create({ data }),
}
```

---

## Ответы API

Единый формат для всех эндпоинтов:
```ts
// Успех
{ data: T, error: null, meta: { count?: number, page?: number } | null }

// Ошибка
{ data: null, error: { message: string, code: string }, meta: null }
```

Никогда не возвращай разные структуры в зависимости от модуля.

---

## Обработка ошибок

Кастомный класс ошибок + глобальный middleware:
```ts
// shared/lib/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) { super(message) }
}

// shared/middleware/errorHandler.ts
export const errorHandler = (err: Error, req: Request, res: Response) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      data: null,
      error: { message: err.message, code: err.code },
      meta: null,
    })
  }
  logger.error('Unhandled error', { err, url: req.url, body: req.body })
  res.status(500).json({
    data: null,
    error: { message: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
    meta: null,
  })
}
```

Все контроллеры оборачивай в `asyncHandler`:
```ts
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
```

---

## Валидация (Zod)

Каждый входящий запрос валидируется через middleware до контроллера:
```ts
// leads.schema.ts
export const createLeadSchema = z.object({
  body: z.object({
    projectId: z.string().uuid(),
    contact: z.string().min(1),
    source: z.enum(['telegram', 'linkedin', 'manual']),
    tags: z.array(z.string()).optional(),
  })
})

// middleware/validate.ts
export const validate = (schema: AnyZodObject) =>
  asyncHandler(async (req, res, next) => {
    await schema.parseAsync({ body: req.body, query: req.query, params: req.params })
    next()
  })
```

---

## Prisma

- Один инстанс клиента в `shared/lib/prisma.ts`, импортируй его везде
- Никогда не пиши raw SQL — только Prisma Client API
- Используй `select` для ограничения полей, не тяни лишнее
- Транзакции через `prisma.$transaction([...])` когда нужна атомарность
- Никогда не expose Prisma типы напрямую — создавай DTO типы в `*.types.ts`

```ts
// ПЛОХО — expose Prisma тип
export type Lead = Prisma.Lead

// ХОРОШО — собственный тип
export interface Lead {
  id: string
  projectId: string
  contact: string
  source: LeadSource
  status: LeadStatus
  createdAt: Date
}
```

---

## Очереди (Bull)

Для всего что асинхронно: публикация постов, рассылки, парсинг лидов.

```ts
// queues/content.queue.ts
export const contentQueue = new Queue('content', { redis: redisConfig })

contentQueue.process('publish-post', async (job) => {
  const { postId, platform } = job.data
  await contentService.publishPost(postId, platform)
})

// Добавление задачи
await contentQueue.add('publish-post', { postId, platform }, {
  delay: scheduledAt - Date.now(),
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
})
```

Всегда указывай `attempts` и `backoff`. Логируй успех и провал джобов.

---

## Логирование (Winston)

```ts
// shared/lib/logger.ts
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
})
```

Что логировать:
- `info` — старт/стоп сервисов, успешные публикации, созданные лиды
- `warn` — retry попытки, медленные запросы (>2с), rate limit предупреждения
- `error` — все ошибки с контекстом: `{ err, module, leadId, projectId }`

Запрещено логировать: пароли, токены, персональные данные.

---

## Внешние API

Каждый внешний сервис — отдельный клиент в `shared/lib/`:
```ts
// shared/lib/claude.ts
export const claudeClient = axios.create({
  baseURL: 'https://api.anthropic.com/v1',
  headers: { 'x-api-key': process.env.CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }
})

// shared/lib/n8n.ts
export const n8nClient = axios.create({
  baseURL: `http://n8n:5678/api/v1`,
  headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
})
```

---

## Переменные окружения

Все через `.env`. Типизированный доступ через конфиг объект:
```ts
// shared/lib/config.ts
export const config = {
  port: Number(process.env.PORT ?? 3001),
  db: { url: process.env.DATABASE_URL! },
  redis: { host: process.env.REDIS_HOST ?? 'redis', port: 6379 },
  claude: { apiKey: process.env.CLAUDE_API_KEY! },
  n8n: { apiKey: process.env.N8N_API_KEY! },
} as const
```

Никогда не обращайся к `process.env` напрямую в модулях — только через `config`.

---

## TypeScript

- `strict: true` в tsconfig, не отключать
- Никакого `any` — используй `unknown` и сужай тип
- `async/await` везде, никаких `.then()` цепочек
- Возвращаемые типы функций всегда явные для сервисов и репозиториев

---

## AI-Ассистент (модуль `ai`)

Модуль для чат-интерфейса с контекстом проекта. Данные проекта (DNA, brandVoice, контент, лиды) инжектируются в системный промпт автоматически.

### Структура модуля
```
modules/ai/
├── ai.router.ts
├── ai.controller.ts
├── ai.service.ts
├── ai.repository.ts   # хранение истории сессий
├── ai.schema.ts
└── ai.types.ts
```

### Endpoint `POST /api/ai/chat`

**Body (Zod schema):**
```ts
export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(4000),
    projectId: z.string().uuid(),
    conversationId: z.string().uuid().optional(), // для продолжения сессии
  })
})
```

**Логика сервиса:**
```ts
export const aiService = {
  chat: async (dto: ChatDto): Promise<string> => {
    // 1. Загружаем контекст проекта
    const project = await projectsRepository.findById(dto.projectId)
    if (!project) throw new AppError('Проект не найден', 404)

    // 2. Строим системный промпт с ДНК проекта
    const systemPrompt = buildSystemPrompt(project)

    // 3. (Опционально) Загружаем историю сессии
    const history = dto.conversationId
      ? await aiRepository.getHistory(dto.conversationId)
      : []

    // 4. Вызываем Claude
    const response = await claudeClient.post('/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: dto.message }
      ],
    })

    return response.data.content[0].text
  },
}

// Системный промпт инжектирует данные проекта
function buildSystemPrompt(project: Project): string {
  return `Ты — AI-ассистент Growth OS для проекта "${project.name}" (ниша: ${project.niche}).
DNA проекта: ${project.dna ?? 'не задано'}
Голос бренда: ${project.brandVoice ?? 'не задано'}
Целевая аудитория: ${project.targetAudience ?? 'не задано'}

Отвечай по-русски. Будь конкретен, предлагай действия. Не давай общих советов.`
}
```

### Endpoint `POST /api/ai/conversations` (будущий)

Сохранение диалога в БД.

**Prisma модели (добавить в schema.prisma):**
```prisma
model AiConversation {
  id        String       @id @default(uuid())
  projectId String
  savedAt   DateTime     @default(now())
  messages  AiMessage[]
  project   Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model AiMessage {
  id             String         @id @default(uuid())
  conversationId String
  role           String         // 'user' | 'assistant'
  content        String
  ts             DateTime
  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}
```

### Правила модуля

- Никогда не логируй содержимое сообщений пользователя (privacy)
- Всегда передавай `projectId` — ответы без контекста проекта запрещены
- Таймаут Claude API — 30 секунд, при превышении бросай `AppError('Timeout', 504)`
- Стоимость токенов логируй на уровне `info`: `{ inputTokens, outputTokens, projectId }`

---

## Запрещено

- Бизнес-логика в роутерах или контроллерах
- Prisma запросы вне репозиториев
- Прямые `process.env` в модулях — только через `config`
- `console.log` — только `logger`
- Синхронные операции ввода-вывода (`fs.readFileSync` и подобные)
- Хардкод URL внешних сервисов — только через `config`
