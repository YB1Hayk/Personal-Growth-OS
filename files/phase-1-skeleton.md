# Фаза 1 — Скелет проекта

Цель: рабочая инфраструктура, пустой дашборд открывается в браузере, API отвечает на `/health`.

---

## Монорепо

- [ ] Инициализировать монорепо (pnpm workspaces)
- [ ] Создать `apps/dashboard` — Vite + React + TypeScript + Tailwind
- [ ] Создать `apps/api` — Node.js + Express + TypeScript
- [ ] Создать `packages/shared` — общие типы
- [ ] Настроить `tsconfig.json` с path aliases (`@/`) для каждого app
- [ ] Настроить `eslint` + `prettier` единый конфиг

---

## Docker Compose

- [ ] Сервис `postgres` — PostgreSQL 16, volume для данных
- [ ] Сервис `redis` — Redis 7, volume для данных
- [ ] Сервис `n8n` — порт 5678, volume для воркфлоу
- [ ] Сервис `api` — сборка из `apps/api`, порт 3001
- [ ] Сервис `nginx` — reverse proxy, порты 80/443
- [ ] Создать `.env.example` со всеми переменными
- [ ] Проверить: все сервисы стартуют через `docker-compose up -d`

---

## База данных (Prisma)

- [ ] Инициализировать Prisma в `apps/api`
- [ ] Описать все модели в `schema.prisma`:
  - [ ] `Project`
  - [ ] `Account`
  - [ ] `ContentPost`
  - [ ] `Lead`
  - [ ] `OutreachLog`
  - [ ] `Conversation`
  - [ ] `AgentPrompt`
- [ ] Запустить первую миграцию
- [ ] Проверить: таблицы созданы в PostgreSQL

---

## Бэкенд (API)

- [ ] Настроить Express app с middleware (cors, json, morgan)
- [ ] Подключить Prisma клиент
- [ ] Подключить Redis (ioredis)
- [ ] Создать `GET /health` — возвращает статус БД и Redis
- [ ] Настроить глобальный errorHandler
- [ ] Настроить Winston логгер
- [ ] Настроить `asyncHandler` утилиту

---

## Фронтенд (Dashboard)

- [ ] Настроить Tailwind (тёмная тема, цвета)
- [ ] Создать базовый layout: sidebar + main content
- [ ] Sidebar: навигация по 5 модулям
- [ ] Настроить React Router — маршруты для каждого модуля
- [ ] Настроить axios инстанс с базовым URL из `.env`
- [ ] Настроить Tanstack Query (`QueryClientProvider`)
- [ ] Настроить Zustand store (текущий проект)
- [ ] Заглушки-страницы для каждого модуля (просто заголовок)

---

## Nginx

- [ ] Конфиг: статика фронтенда на `/`
- [ ] Конфиг: проксирование `/api/*` → `api:3001`
- [ ] Конфиг: проксирование `/n8n/*` → `n8n:5678`

---

## Деплой на Timeweb VPS

- [ ] Настроить VPS (Ubuntu, Docker, Docker Compose)
- [ ] Создать Git репозиторий, подключить к VPS
- [ ] Первый деплой: `docker-compose up -d`
- [ ] Проверить: дашборд открывается, `/api/health` отвечает `200`

---

## Критерий готовности фазы
Открываю браузер → вижу дашборд с боковым меню → API отвечает на `/health` → все Docker сервисы запущены.
