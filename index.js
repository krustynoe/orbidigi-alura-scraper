const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const soraCookie = process.env.SORA_COOKIES;

// Ruta específica de Chromium en imagen Playwright (confirmada)
const chromePath = '/ms-playwright/chromium-1106/chrome-linux/chrome';

if (!fs.existsSync(chromePath)) {
  console.error("❌ No se encontró Chromium en:", chromePath);
  process.exit(1);
}

if (!soraCookie || soraCookie.length < 50 || soraCookie.includes('\n')) {
  console.error('❌ Cookie SORA_COOKIES inválida o mal formateada.');
  process.exit(1);
}

function parseCookies(cookieStr) {
  return cookieStr.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=');
    return {
      name,
      value: rest.join('='),
      domain: '.sora.chatgpt.com',
      path: '/',
      secure: true
    };
  });
}

app.get('/generate', async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.status(400).json({ error: "❌ Falta el parámetro ?prompt=" });

  try {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setCookie(...parseCookies(soraCookie));

    await page.goto('https://sora.chatgpt.com', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('textarea', { timeout: 15000 });
    await page.type('textarea', prompt, { delay: 10 });
    await page.keyboard.press('Enter');

    await page.waitForTimeout(10000); // esperar la respuesta

    const respuesta = await page.evaluate(() => {
      const bloques = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] div'));
      return bloques.map(el => el.innerText).join("\n---\n");
    });

    await browser.close();

    res.json({
      status: "ok",
      prompt,
      response: respuesta || "⚠️ No se detectó respuesta."
    });

  } catch (err) {
    console.error("❌ Error en Puppeteer:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 Sora backend activo en http://localhost:${PORT}/generate`);
});
