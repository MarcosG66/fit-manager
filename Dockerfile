# Opcional: executa o React compilado e o Express juntos em uma hospedagem Docker.
# Banco MySQL é externo (ou outro contêiner); nunca empacotado nessa imagem.
FROM node:22-alpine AS frontend
WORKDIR /app
COPY client/package*.json ./client/
RUN npm install --prefix client --no-audit --no-fund
COPY client ./client
RUN npm run build --prefix client

FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY server/package*.json ./server/
RUN npm install --omit=dev --prefix server --no-audit --no-fund
COPY server ./server
COPY --from=frontend /app/client/dist ./client/dist
EXPOSE 3001
CMD ["node", "server/scripts/start-cloud.js"]
