const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;
const soraCookie = process.env.SORA_COOKIES;

// Validación mínima de cookie
if (!soraCookie || soraCookie.length < 100 || soraCookie.includes('\n')) {
  console.error('❌ Cookie inválida.');
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
  if (!prompt) return res.status(400).json({ error: '❌ Falta ?prompt=' });

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Cargar cookies
    const cookies = parseCookies(soraCookie);
    await page.setCookie(...cookies);

    // Ir a la página de Sora
    await page.goto('https://sora.chatgpt.com', { waitUntil: 'domcontentloaded' });

    // Esperar que cargue el input de prompt
    await page.waitForSelector('textarea', { timeout: 15000 });

    // Insertar el prompt
    await page.type('textarea', prompt, { delay: 10 });

    // Click en el botón de enviar
    await page.keyboard.press('Enter');

    // Esperar respuesta (espera básica)
    await page.waitForTimeout(8000);

    // Obtener texto generado (ajustar selector según respuesta de Sora)
    const respuesta = await page.evaluate(() => {
      const elementos = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] div'));
      return elementos.map(el => el.innerText).join('\n---\n');
    });

    await browser.close();

    res.json({
      status: 'ok',
      prompt,
      response: respuesta || '⚠️ No se detectó respuesta del sistema.'
    });

  } catch (err) {
    console.error('❌ Error en flujo Puppeteer:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 Flujo activo en /generate?prompt=...`);
});
