FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

# 👇 Obligatorio para instalar Chromium y que NO falle
RUN npx playwright install --with-deps

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
