FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src

FROM node:20-alpine AS runtime
WORKDIR /app
# Copiamos todo y nos aseguramos de que 'node' sea el dueño de TODO
COPY --from=builder --chown=node:node /app /app
USER node
EXPOSE 3000
# Usamos la forma directa para evitar errores de shell
CMD ["node", "src/server.js"]