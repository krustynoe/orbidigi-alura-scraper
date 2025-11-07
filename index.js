const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const keyword = req.query.q || 'digital planner';
 args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true

});

  const page = await browser.newPage();

   await page.goto('https://app.alura.io/login');
  await page.type('#email', process.env.ALURA_EMAIL);
  await page.type('#password', process.env.ALURA_PASS);
  await page.click("button[type='submit']");
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
console.log('Alura scraper live on port ' + port);
});
