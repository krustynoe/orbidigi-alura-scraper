const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const soraCookie = process.env.SORA_COOKIES;
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

if (!fs.existsSync(CHROME_PATH)) {
  console.error('❌ Chromium no encontrado en:', CHROME_PATH);
  process.exit(1);
}

if (!soraCookie || soraCookie.length < 50 || soraCookie.includes('\n')) {
  console.error('❌ Cookie inválida o mal formateada.');
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

async function openSoraPage(prompt) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setCookie(...parseCookies(soraCookie));

  await page.goto('https://sora.chatgpt.com', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('textarea', { timeout: 15000 });
  await page.type('textarea', prompt, { delay: 10 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(8000);

  return { browser, page };
}

// /generate – devuelve respuesta JSON
app.get('/generate', async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.status(400).json({ error: "❌ Falta el parámetro ?prompt=" });

  try {
    const { browser, page } = await openSoraPage(prompt);

    const respuesta = await page.evaluate(() => {
      const bloques = Array.from(document.querySelectorAll('[data-message-author-role="assistant"] div'));
      return bloques.map(el => el.innerText).join('\n---\n');
    });

    await browser.close();
    res.json({ status: "ok", prompt, response: respuesta || "⚠️ No se detectó respuesta." });

  } catch (err) {
    console.error("❌ Error en /generate:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /screenshot – devuelve imagen PNG de la página
app.get('/screenshot', async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.status(400).json({ error: "❌ Falta el parámetro ?prompt=" });

  try {
    const { browser, page } = await openSoraPage(prompt);
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    res.set('Content-Type', 'image/png');
    res.send(screenshot);

  } catch (err) {
    console.error("❌ Error en /screenshot:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// /html – devuelve el HTML completo de la página
app.get('/html', async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.status(400).json({ error: "❌ Falta el parámetro ?prompt=" });

  try {
    const { browser, page } = await openSoraPage(prompt);
    const html = await page.content();
    await browser.close();

    res.set('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    console.error("❌ Error en /html:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend Puppeteer listo en http://localhost:${PORT}`);
});
