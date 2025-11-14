const express = require('express');
const { chromium } = require('@playwright/test');

const app = express();
const PORT = process.env.PORT || 3000;
const soraCookie = process.env.SORA_COOKIES;

// Validación de cookie
if (!soraCookie || soraCookie.length < 50 || soraCookie.includes('\n')) {
  console.error('❌ Cookie inválida o mal formateada.');
  process.exit(1);
}

// Convierte string en cookies Playwright
function parseCookies(cookieStr) {
  return cookieStr.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=');
    return {
      name,
      value: rest.join('='),
      domain: '.sora.chatgpt.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'Lax'
    };
  });
}

// Endpoint principal
app.get('/generate', async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.status(400).json({ error: '❌ Falta el parámetro ?prompt=' });

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const context = await browser.newContext();
    await context.addCookies(parseCookies(soraCookie));

    const page = await context.newPage();
    await page.goto('https://sora.chatgpt.com', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('textarea', { timeout: 15000 });
    await page.type('textarea', prompt, { delay: 10 });
    await page.keyboard.press('Enter');

    await page.waitForTimeout(10000); // espera para la respuesta

    const respuesta = await page.evaluate(() => {
      const bloques = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] div'));
      return bloques.map(el => el.innerText).join("\n---\n");
    });

    await browser.close();

    res.json({
      status: "ok",
      prompt,
      response: respuesta || "⚠️ No se detectó respuesta del sistema."
    });

  } catch (err) {
    console.error("❌ Error en Playwright:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 Backend Playwright activo en http://localhost:${PORT}/generate`);
});
