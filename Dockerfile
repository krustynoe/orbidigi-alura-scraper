FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

# 🚨 ESTE COMANDO ES CRÍTICO PARA QUE FUNCIONE EN RENDER
RUN npx playwright install --with-deps

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
