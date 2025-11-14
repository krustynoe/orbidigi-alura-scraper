const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;
const soraCookie = process.env.SORA_COOKIES;

if (!soraCookie || soraCookie.length < 100 || soraCookie.includes('\n')) {
  console.error('❌ Cookie inválida o mal formateada.');
  process.exit(1);
}

// Convertir string de cookie a array Puppeteer
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
      executablePath: '/usr/bin/chromium-browser',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const cookies = parseCookies(soraCookie);
    await page.setCookie(...cookies);

    await page.goto('https://sora.chatgpt.com', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 15000 });

    await page.type('textarea', prompt, { delay: 10 });
    await page.keyboard.press('Enter');

    await page.waitForTimeout(8000); // puedes ampliar si tarda más

    const respuesta = await page.evaluate(() => {
      const bloques = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] div'));
      return bloques.map(el => el.innerText).join('\n---\n');
    });

    await browser.close();

    res.json({
      status: 'ok',
      prompt,
      response: respuesta || '⚠️ No se detectó respuesta del sistema.'
    });
  } catch (err) {
    console.error('❌ Error en Puppeteer:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 Servidor Puppeteer-Core activo en http://localhost:${PORT}/generate`);
});
