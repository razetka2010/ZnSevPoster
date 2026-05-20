# ЗС Афиша (Знание Севера Афиша)

`znanie-severa-afisha` — это Next.js-приложение на базе App Router для поиска и бронирования культурных событий Северо-Запада.

## О проекте

Приложение предоставляет:
- показ мероприятий с фильтрами и картой
- регистрацию/вход пользователей
- "Пойду" / билеты для событий
- страницу `Мои билеты`
- админскую панель для управления событиями и просмотра билетов
- поддержку реальной базы данных PostgreSQL и мок-режим для разработки

## Технологии

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL (`pg`)
- Neon/Postgres support via `@neondatabase/serverless`
- JWT-авторизация и cookie-сессии
- Leaflet / React Leaflet для карты

## Быстрый запуск

```bash
npm install
npm run dev
```

Откройте приложение по адресу `http://localhost:3000`.

## Сборка

```bash
npm run build
npm run start
```

## Переменные окружения

В корне про проекта используйте `.env.local` с такими значениями:

```env
DATABASE_URL=postgres://user:password@host:port/database
USE_MOCK_DATA=true
```

- `DATABASE_URL` — строка подключения к PostgreSQL.
- `USE_MOCK_DATA=true` — включает демо-режим и использует файлы из `data/mock-db.json`.

Если `DATABASE_URL` не задан, проект автоматически работает в мок-режиме.

## Инициализация базы данных

Для создания схемы выполните:

```bash
npm run db:init
```

Или примените миграции:

```bash
npm run db:migrate
```

## Структура приложения

### Основные страницы

- `/` — главная лента мероприятий
- `/events/[id]` — подробная страница события
- `/tickets` — страница пользователя "Мои билеты"
- `/login` — вход
- `/register` — регистрация
- `/admin` — админ-панель
- `/admin/events/new` — создание события
- `/admin/events/[id]/edit` — редактирование события
- `/admin/events/[id]/tickets` — просмотр билетов по событию

### API

- `GET /api/bootstrap` — загрузка списка событий, избранного и статуса посещения
- `GET /api/events` — список событий
- `GET /api/events/[id]` — данные одного события
- `POST /api/auth/login` — авторизация
- `POST /api/auth/register` — регистрация
- `GET /api/auth/me` — данные текущего пользователя
- `POST /api/favorites` — добавление/удаление избранного
- `GET /api/favorites` — список избранного
- `POST /api/going` — регистрация/отмена статуса "Пойду" и создание билета
- `GET /api/going` — список событий, на которые пользователь идет
- `GET /api/tickets` — билеты текущего пользователя
- `GET /api/admin/events` — список всех событий для админа
- `POST /api/admin/events` — создание события (админ)
- `GET /api/admin/events/[id]` — получение одного события (админ)
- `PUT /api/admin/events/[id]` — редактирование события (админ)
- `DELETE /api/admin/events/[id]` — удаление события (админ)
- `GET /api/admin/events/[id]/tickets` — билеты для события (админ)

## База данных

Основная схема хранится в `db/schema.sql`.

Таблицы:
- `users`
- `events`
- `user_events` — статусы `favorite` / `going`
- `tickets`

## Мок-режим

Для разработки и тестирования без базы используется `lib/mock-store.ts`.

- данные сохраняются в `data/mock-db.json`
- при запуске в режиме `USE_MOCK_DATA=true` или без `DATABASE_URL` используется мок-режим
- мок автоматически создает админа, если его нет

## Роли и доступ

- `user` — обычный пользователь
- `admin` — администратор

Админ может:
- управлять событиями
- просматривать билеты по каждому событию

## Компоненты и логика

- `components/Navbar.tsx` — навигация приложения
- `components/EventFeed.tsx` — карточки списка событий
- `components/EventDetailView.tsx` — подробная страница события и форма регистрации
- `components/Filters.tsx` — фильтры по категории, цене и дате
- `components/LocationPrompt.tsx` — работа с геолокацией
- `components/MapPicker.tsx` и `EventMap.tsx` — карта
- `components/admin/AdminEventForm.tsx` — форма админа для создания и редактирования события

## Развертывание на Vercel

Проект совместим с Vercel:

1. Подключите репозиторий к Vercel.
2. В настройках проекта добавьте переменную `DATABASE_URL`.
3. Если хотите работать в мок-режиме, добавьте `USE_MOCK_DATA=true`.
4. Убедитесь, что команды установлены как `npm install` и `npm run build`.

## Полезные советы

- Для тестирования админки используйте демо-режим или настоящий PostgreSQL.
- Если `GET /api/tickets` возвращает ошибки с `images`, проверьте данные событий и формат поля `images`.
- `app/page.tsx` содержит основной бренд и описание приложения.

## Контакты и нейминг

Проект оформлен как `ЗС Афиша` / `Знание Севера Афиша`.

---