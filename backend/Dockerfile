# Backend de Vertix — imagen lista para desplegar (Render, Fly.io, Railway, Koyeb…)
FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# La base de datos SQLite vive aquí. En hosts con disco/volumen persistente,
# monta el volumen en /data para conservar los datos entre despliegues.
RUN mkdir -p /data
ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/data/surebets.db

EXPOSE 4000
CMD ["npm", "start"]
