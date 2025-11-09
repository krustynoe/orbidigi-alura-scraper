const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const ZR = process.env.ZENROWS_API_KEY || '';
const AL = (process.env.ALURA_COOKIES || process.env.ALURA_COOKIE || '').trim();

function headersWithCookie(cookie) {
  return cookie ? { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' } : { 'User-Agent': 'Mozilla/5.0' };
}
async function zenrows(url, extractor, cookie) {
  const params = { apikey: ZR, url, js_render: 'true', custom_headers: 'true', css_extractor: JSON.stringify(extractor) };
  const { data } = await axios.get('https://api.zenrows.com/v1/', { params, headers: headersWithCookie(cookie) });
  return data;
}

app.get('/alura/keywords', async (req, res) => {
  try {
    const q = req.query.q || '';
    const data = await zenrows(
      `https://app.alura.io/research?search=${encodeURIComponent(q)}`, // ajusta a la URL real
      { results: { selector: 'h1,h2,h3,.keyword', type: 'text', all: true } },
      AL
    );
    const results = Array.isArray(data.results) ? data.results.filter(Boolean) : [];
    res.json({ query: q, count: results.length, results: results.slice(0, 20) });
  } catch (e) { res.status(500).json({ error: e.response?.data || String(e) }); }
});

app.get('/alura/products', async (req, res) => {
  try {
    const q = req.query.q || '';
    const data = await zenrows(
      `https://app.alura.io/search?q=${encodeURIComponent(q)}`, // ajusta
      {
        items: [{
          selector: '.product-card',
          values: {
            title: { selector: '.product-title', type: 'text' },
            url:   { selector: 'a', type: 'attr', attr: 'href' },
            price: { selector: '.price', type: 'text', optional: true },
            shop:  { selector: '.shop-name', type: 'text', optional: true }
          }
        }]
      },
      AL
    );
    const items = Array.isArray(data.items) ? data.items : [];
    res.json({ query: q, count: items.length, items: items.slice(0, 20) });
  } catch (e) { res.status(500).json({ error: e.response?.data || String(e) }); }
});

app.get('/alura/shops', async (req, res) => {
  try {
    const q = req.query.q || '';
    const data = await zenrows(
      `https://app.alura.io/search?q=${encodeURIComponent(q)}`,
      { shops: { selector: '.shop-name', type: 'text', all: true } },
      AL
    );
    const shops = (data.shops || []).map((s) => ({ shop: s, url: '' }));
    res.json({ query: q, count: shops.length, shops: shops.slice(0, 20) });
  } catch (e) { res.status(500).json({ error: e.response?.data || String(e) }); }
});

app.get('/alura/myshop', async (req, res) => {
  try {
    const shop = String(req.query.shop || '');
    if (!shop) return res.status(400).json({ error: "Missing 'shop' param" });
    const data = await zenrows(
      `https://app.alura.io/shop/${encodeURIComponent(shop)}`,
      {
        items: [{
          selector: '.listing-card',
          values: {
            title: { selector: '.title', type: 'text' },
            url:   { selector: 'a', type: 'attr', attr: 'href' },
            price: { selector: '.price', type: 'text', optional: true },
            tags:  { selector: '.tags', type: 'text', optional: true }
          }
        }]
      },
      AL
    );
    const items = Array.isArray(data.items) ? data.items : [];
    res.json({ shop, count: items.length, items: items.slice(0, 50) });
  } catch (e) { res.status(500).json({ error: e.response?.data || String(e) }); }
});

app.listen(port, () => console.log('Alura scraper listening on', port));
