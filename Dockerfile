FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app

# Solo instalamos express, no tocamos playwright ni navegadores
COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
