# Rooms Messenger

## Тебе нужно сделать 3 вещи. Всё остальное уже готово.

---

### 1. Создай Supabase (2 мин)

- Открой https://supabase.com → войди через GitHub → **New Project**
- Имя: `rooms`, регион: Frankfurt, план: Free
- Подожди пока создастся (~1 мин)
- Зайди в **Settings → API** и скопируй **Project URL** и **anon public key**
- Зайди в **SQL Editor** → New query → вставь всё из файла `supabase/schema.sql` → нажми **Run**
- Зайди в **Authentication → Providers → Email** → выключи **Confirm email** (чтобы не ждать код при тестах)

### 2. Залей на GitHub (1 мин)

```bash
cd rooms
npm install
git init
git add .
git commit -m "init"
```

Создай репозиторий на github.com, потом:

```bash
git remote add origin https://github.com/ТВОЙ_НИК/rooms.git
git branch -M main
git push -u origin main
```

### 3. Задеплой на Vercel (2 мин)

- Открой https://vercel.com → войди через GitHub → **Add New Project** → выбери `rooms`
- В **Environment Variables** добавь:
  - `NEXT_PUBLIC_SUPABASE_URL` = твой URL из шага 1
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = твой ключ из шага 1
  - `NEXT_PUBLIC_ADMIN_ID` = (пока пусто)
- Нажми **Deploy**
- Через минуту получишь рабочий URL

### После деплоя

Вернись в Supabase → **Authentication → URL Configuration**:
- **Site URL** = `https://rooms-xxx.vercel.app` (твой URL с Vercel)
- **Redirect URLs** → добавь `https://rooms-xxx.vercel.app/**`

---

### Готово. Открой URL — мессенджер работает.

---

## Как пользоваться

- Войди с любым email → задай username
- Кнопка 💬+ → поиск по username → личный чат
- Кнопка 👥 → создать группу → в группе нажми ℹ️ → создай ссылку → отправь другу
- ⚙️ → смена темы, профиль, выход

## Announcement канал (опционально)

После первого входа найди свой UUID в Supabase → Table Editor → profiles → скопируй id.
Вставь его в Vercel Environment Variables как `NEXT_PUBLIC_ADMIN_ID`. Потом в SQL Editor:

```sql
INSERT INTO chats (type, name, created_by) VALUES ('announcement', '📢 Объявления', 'ТВОЙ_UUID');
INSERT INTO chat_members (chat_id, user_id, role) VALUES ((SELECT id FROM chats WHERE type='announcement' LIMIT 1), 'ТВОЙ_UUID', 'owner');
```

## Лимиты (бесплатно)

| | Лимит |
|---|---|
| Пользователей | ~1000 |
| База | 500 MB |
| Realtime соединений | ~200 |
| Стоимость | **$0** |
