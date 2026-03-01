# ============================================
# ЭТАП 1: Сборка приложения (Build Stage)
# ============================================
FROM node:20-alpine AS builder

# Рабочая директория
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# ============================================
# ЭТАП 2: Production (Production Stage)
# ============================================
FROM node:20-alpine AS production

# Рабочая директория
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем только production зависимости + serve для раздачи файлов
RUN npm ci --only=production && npm install -g serve

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Открываем порт 3000
EXPOSE 3000

# Запускаем serve для раздачи статических файлов
# -s означает SPA режим (перенаправляет все запросы на index.html)
CMD ["serve", "-s", "dist", "-l", "3000"]