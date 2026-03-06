# ============================================
# ЭТАП 1: Сборка приложения (Build Stage)
# ============================================
FROM node:20-bookworm AS builder

# Рабочая директория
WORKDIR /app

# 🔥 Ключевое: включаем CI-режим для npm
ENV CI=true

# Копируем package files
COPY package*.json ./

 

# 2. Используем современный флаг для продакшена
# --omit=dev вместо устаревшего --only=production
RUN npm ci --omit=dev

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
# 2. Используем современный флаг для продакшена
# --omit=dev вместо устаревшего --only=production
RUN npm ci --omit=dev && npm install -g serve

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Открываем порт 80
EXPOSE 80

# Запускаем serve для раздачи статических файлов
# -s означает SPA режим (перенаправляет все запросы на index.html)
CMD ["serve", "-s", "dist", "-l", "80"]