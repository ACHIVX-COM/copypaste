FROM node:22.6-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json .
COPY copypaste/package*.json ./copypaste/
COPY copypaste-server/package*.json ./copypaste-server/

RUN --mount=type=cache,target=/root/.npm \
  npm ci --omit=dev -w copypaste -w copypaste-server

COPY copypaste/ ./copypaste/
COPY copypaste-server/ ./copypaste-server/

EXPOSE 50051

CMD ["npm", "run", "-w", "copypaste-server", "serve"]
