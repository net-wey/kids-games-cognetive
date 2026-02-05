# Cognitive Kids - Backend

Backend для мобильного приложения развития когнитивных способностей детей дошкольного возраста.

## Технологии

- Node.js
- Express.js
- **SQLite** + Sequelize ORM
- JWT для аутентификации
- bcryptjs для хеширования паролей

## Преимущества SQLite

✅ **Не требует установки** отдельного сервера БД  
✅ **Простое развертывание** - один файл базы данных  
✅ **Быстрая работа** для небольших и средних приложений  
✅ **Портативность** - легко перенести на другой компьютер  
✅ **Идеально для разработки** и тестирования  

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env`:
```bash
PORT=5000
DB_PATH=./database.sqlite
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

3. Создайте администратора:
```bash
node scripts/createAdmin.js
```

База данных (`database.sqlite`) будет создана автоматически при первом запуске.

## Запуск

### Режим разработки (с автоперезагрузкой):
```bash
npm run dev
```

### Обычный режим:
```bash
npm start
```

Сервер будет доступен по адресу: `http://localhost:5000`

## API Endpoints

### Аутентификация (`/api/auth`)

- `POST /api/auth/login` - Вход в систему
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```

- `GET /api/auth/me` - Получить текущего пользователя (требует токен)

- `POST /api/auth/register-parent` - Регистрация родителя (только админ)
  ```json
  {
    "username": "parent1",
    "password": "password123"
  }
  ```

- `POST /api/auth/register-child` - Регистрация ребенка (только родитель)
  ```json
  {
    "username": "child1",
    "password": "password123",
    "childName": "Маша",
    "age": 5
  }
  ```

### Игры (`/api/games`)

- `POST /api/games/result` - Сохранить результат игры
- `GET /api/games/results/:childId` - Получить результаты ребенка
- `GET /api/games/statistics/:childId` - Получить статистику ребенка
- `GET /api/games/leaderboard` - Получить таблицу лидеров

### Друзья (`/api/friends`)

- `POST /api/friends/request` - Отправить запрос в друзья
- `GET /api/friends/requests` - Получить входящие запросы
- `PUT /api/friends/accept/:requestId` - Принять запрос
- `PUT /api/friends/reject/:requestId` - Отклонить запрос
- `GET /api/friends` - Получить список друзей
- `DELETE /api/friends/:friendId` - Удалить из друзей

### Администрирование (`/api/admin`)

- `GET /api/admin/users` - Получить всех пользователей
- `PUT /api/admin/users/:userId/deactivate` - Деактивировать пользователя
- `PUT /api/admin/users/:userId/activate` - Активировать пользователя
- `GET /api/admin/statistics` - Получить статистику приложения
- `DELETE /api/admin/users/:userId` - Удалить пользователя

## Роли пользователей

1. **Admin** - Администратор
   - Регистрирует родителей
   - Управляет пользователями
   - Просматривает статистику приложения

2. **Parent** - Родитель
   - Регистрирует детей
   - Просматривает статистику своих детей
   - Получает рекомендации

3. **Child** - Ребенок
   - Играет в игры
   - Добавляет друзей
   - Просматривает таблицу лидеров

## Типы игр

1. `memory` - Мемори (Memory/Pairs)
2. `odd-one-out` - Найди лишнее
3. `sorting` - Сортировка по признакам
4. `counting` - Счет и сопоставление
5. `shadow-matching` - Тени и Силуэты
6. `building` - Построй по Образцу
7. `predicting` - Что будет дальше?

## Структура проекта

```
backend/
├── config/          # Конфигурация (SQLite)
├── controllers/     # Контроллеры
├── middleware/      # Middleware
├── models/          # Модели Sequelize
├── routes/          # Маршруты
├── scripts/         # Скрипты (создание admin)
├── .env            # Переменные окружения
├── .gitignore
├── package.json
├── README.md
├── server.js       # Точка входа
└── database.sqlite # База данных (создается автоматически)
```

## База данных SQLite

### Таблицы:

1. **Users** - Пользователи
   - id, username, password, role, parentId, childName, age, isActive

2. **GameResults** - Результаты игр
   - id, childId, gameType, level, score, maxScore, timeSpent, attempts, completed, details, playedAt

3. **FriendRequests** - Запросы в друзья
   - id, senderId, receiverId, status

4. **Friendships** - Связи друзей (many-to-many)
   - userId, friendId

### Просмотр базы данных

Вы можете использовать любой SQLite клиент для просмотра базы данных:

**DB Browser for SQLite** (рекомендуется):
- Скачайте: https://sqlitebrowser.org/
- Откройте файл `database.sqlite`

**Командная строка:**
```bash
sqlite3 database.sqlite
.tables
SELECT * FROM Users;
.quit
```

**VS Code расширение:**
- Установите "SQLite" расширение
- Откройте файл `database.sqlite`

## Безопасность

- Пароли хешируются с помощью bcryptjs (10 раундов)
- JWT токены для аутентификации (срок действия 30 дней)
- Проверка ролей и прав доступа на уровне middleware
- Валидация данных с помощью express-validator

## Данные по умолчанию

После запуска `node scripts/createAdmin.js`:
- **Username:** admin
- **Password:** admin123

⚠️ Обязательно смените пароль в продакшене!

## Миграция данных

Если вы хотите перенести базу данных на другой компьютер:

1. Скопируйте файл `database.sqlite`
2. Поместите его в папку backend нового проекта
3. Укажите путь в `.env`: `DB_PATH=./database.sqlite`

## Резервное копирование

Для создания резервной копии просто скопируйте файл `database.sqlite`:

```bash
# Windows
copy database.sqlite database.backup.sqlite

# macOS/Linux
cp database.sqlite database.backup.sqlite
```

## Очистка базы данных

Для полной очистки БД удалите файл `database.sqlite` и перезапустите сервер:

```bash
# Windows
del database.sqlite

# macOS/Linux
rm database.sqlite
```

База данных будет создана заново при следующем запуске.

## Производительность

SQLite отлично подходит для:
- ✅ До 100 одновременных пользователей
- ✅ До 10-100 запросов в секунду
- ✅ Файлы БД до нескольких ГБ

Для больших нагрузок рекомендуется PostgreSQL или MySQL.

## Troubleshooting

### Ошибка: "SQLITE_CANTOPEN"
- Проверьте права доступа к папке
- Убедитесь, что путь в DB_PATH корректен

### Ошибка: "database is locked"
- Закройте другие программы, использующие БД
- Перезапустите сервер

### Потеря данных
- Восстановите из резервной копии `database.backup.sqlite`
- Или создайте новую БД с помощью `node scripts/createAdmin.js`

## Обновление схемы БД

Sequelize автоматически обновляет схему в режиме разработки:

```javascript
// config/db.js
await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
```

Для продакшена используйте миграции Sequelize CLI.
