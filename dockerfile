FROM node:20-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p /app/data/uploads /app/data/tmp
EXPOSE 4000
CMD ["node", "app.js"]
