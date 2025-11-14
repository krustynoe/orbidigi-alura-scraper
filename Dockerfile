FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app

# Copia solo package.json antes para instalar dependencias mínimas
COPY package*.json ./
RUN npm install

# Ahora sí, copia el resto
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
