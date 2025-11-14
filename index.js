const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Cookie real desde variable de entorno
const soraCookie = process.env.SORA_COOKIES;

// Ruta base de test: devuelve HTML si cookie es válida
app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://sora.com/', {
      headers: getHeaders()
    });
    res.status(200).send(response.data);
  } catch (err) {
    console.error('❌ Error en /:', err.message);
    res.status(err.response?.status || 500).send(`❌ Error: ${err.message}`);
  }
});

// NUEVA RUTA: recibe prompt dinámico desde query (?prompt=...)
app.get('/generate', async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({ error: '❌ Falta el parámetro ?prompt=' });
  }

  try {
    // Aquí iría la llamada real a la API de Sora (si tuviera endpoint).
    // Por ahora simulamos que responde con JSON basado en el prompt.
    const fakeResponse = {
      status: 'success',
      prompt_received: prompt,
      message: `🔁 Aquí lanzaría el vídeo o acción con el prompt: "${prompt}"`
    };

    res.status(200).json(fakeResponse);

    // Si Sora tuviera API real:
    /*
    const response = await axios.post('https://sora.com/api/endpoint', {
      prompt: prompt
    }, {
      headers: getHeaders()
    });
    res.json(response.data);
    */

  } catch (err) {
    console.error('❌ Error en /generate:', err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Función común para headers "navegador real"
function getHeaders() {
  return {
    'Cookie': soraCookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Referer': 'https://sora.com/',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  };
}

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
