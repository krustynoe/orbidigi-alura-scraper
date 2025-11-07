const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const keyword = req.query.q || 'digital planner';
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });
  const page = await browser.newPage();

  const cookiesString = process.env.ALURA_COOKIES || '';
  if (cookiesString.trim()) {
    try {
      const cookies = [];
      const lines = cookiesString.split(/\r?\n/);
      for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const parts = line.split('\t');
        if (parts.length >= 7) {
          cookies.push({
            name: parts[5],
            value: parts[6],
            domain: parts[0],
            path: parts[2],
            httpOnly: false,
            secure: parts[3].toUpperCase() === 'TRUE'
          });
        }
      }
      if (cookies.length) {
        await page.setCookie(...cookies);
      }
    } catch (err) {
      console.error('Failed to parse ALURA_COOKIES', err);
    }
  } else {
    await page.goto('https://app.alura.io/login');
    await page.type('#email', process.env.ALURA_EMAIL);
    await page.type('#password', process.env.ALURA_PASS);
    await page.click("button[type='submit']");
    await page.waitForNavigation();
  }

  await page.goto('https://app.alura.io/research');
  await page.waitForTimeout(5000); // espera carga real

  const result = await page.evaluate(() => {
    return [...document.querySelectorAll('h3')].map(el => el.innerText);
  });

  await browser.close();
  res.json({ keyword, result });
});

app.listen(port, () => {
  console.log('Alura scraper live on port ' + port);
});
