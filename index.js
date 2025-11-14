const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Cookie real de Sora (si prefieres, pásala como variable de entorno también)
const soraCookie = process.env.SORA_COOKIES;

app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://sora.com/', {
      headers: {
        'Cookie': soraCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    res.send(response.data); // Devuelve la página HTML de Sora si la cookie es válida
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).send('❌ Error al conectar con Sora. Verifica la cookie.');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
});
