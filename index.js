const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const keyword = req.query.q || 'digital planner';
  const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

  const page = await browser.newPage();

  await page.goto('https://app.alura.io/login');
  await page.type('#email', 'TU_CORREO');
  await page.type('#password', 'TU_PASSWORD');
  await page.click('button[type=\"submit\"]');
  await page.waitForNavigation();

  await page.goto('https://app.alura.io/research');
  await page.waitForTimeout(5000); // espera carga real

  const result = await page.evaluate(() => {
    return [...document.querySelectorAll('h3')].map(el => el.innerText);
  });

  await browser.close();
  res.json({ keyword, result });
});

app.listen(port, () => {
  console.log(`Scraper en vivo en puerto ${port}`);
});
