const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const keyword = req.query.q || 'digital planner';
  const apiKey = process.env.ZENROWS_API_KEY;
  const cookiesString = process.env.ALURA_COOKIES || process.env.ALURA_COOKIE || '';

  let cookieHeader = '';
  if (cookiesString && cookiesString.trim()) {
    const lines = cookiesString.split(/\r?\n/);
    const cookiePairs = [];
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      const parts = line.split('\t');
      if (parts.length >= 7) {
        cookiePairs.push(`${parts[5]}=${parts[6]}`);
      }
    }
    if (cookiePairs.length > 0) {
      cookieHeader = cookiePairs.join('; ');
    }
  }

  const url = 'https://app.alura.io/research';

  const params = {
    apikey: apiKey,
    url: url,
    js_render: 'true',
    css_extractor: 'h3'
  };

  const headers = {};
  if (cookieHeader) {
    params.custom_headers = true;
    headers['Cookie'] = cookieHeader;
  }

  try {
    const response = await axios.get('https://api.zenrows.com/v1/', { params, headers });
    if (response.data && response.data.results && response.data.results.h3) {
      return res.json({ keyword, result: response.data.results.h3 });
    }

    const html = response.data;
    const $ = cheerio.load(html);
    const result = [];
    $('h3').each((_, el) => {
      result.push($(el).text().trim());
    });
    return res.json({ keyword, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Error fetching data' });
  }
});

app.listen(port, () => {
  console.log('Alura scraper live on port ' + port);
});
