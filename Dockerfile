# ---------- Etapa builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src

# ---------- Etapa runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Copiar dependencias y código desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package.json ./

# Crear grupo y usuario sin privilegios
RUN addgroup -S app && adduser -S app -G app

# Cambiar dueño de los archivos al nuevo usuario
RUN chown -R app:app /app

# Usar usuario no root
USER node


HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "src/server.js"]