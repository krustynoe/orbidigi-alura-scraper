const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const soraCookie = process.env.SORA_COOKIES;

// Posibles rutas de Chromium en Render/Docker
const CHROME_PATHS = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chrome',
  '/usr/bin/chromium/chromium',
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) {
      console.log("✅ Chromium encontrado en:", p);
      return p;
    }
  }
  console.error("❌ No se encontró Chromium en ninguna ruta.");
  return null;
}

const chromePath = findChrome();
if (!chromePath) {
  console.error("❌ No se pudo iniciar Chromium. Revisa el Dockerfile.");
  process.exit(1);
}

if (!soraCookie || soraCookie.length < 50) {
  console.error('❌ Cookie inválida o demasiado corta.');
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
  if (!prompt) return res.status(400).json({ error: "❌ Falta ?prompt=" });

  try {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setCookie(...parseCookies(soraCookie));

    await page.goto("https://sora.chatgpt.com", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("textarea", { timeout: 15000 });

    await page.type("textarea", prompt, { delay: 10 });
    await page.keyboard.press("Enter");

    await page.waitForTimeout(8000);

    const respuesta = await page.evaluate(() => {
      const bloques = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] div'));
      return bloques.map(el => el.innerText).join("\n---\n");
    });

    await browser.close();

    res.json({
      status: "ok",
      prompt,
      response: respuesta || "⚠️ No se detectó respuesta"
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Sora backend activo en http://localhost:${PORT}/generate`);
});
