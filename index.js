const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const soraCookie = process.env.SORA_COOKIES;

// Validar que la cookie esté bien
function validarCookie(cookieStr) {
  if (!cookieStr) {
    console.error('❌ ERROR: SORA_COOKIES está vacía.');
    return false;
  }
  if (cookieStr.match(/[\r\n]/)) {
    console.error('❌ ERROR: La cookie contiene saltos de línea. Debe estar en UNA sola línea.');
    return false;
  }
  if (cookieStr.length < 200) {
    console.warn('⚠️ ADVERTENCIA: La cookie parece demasiado corta.');
  }
  if (!cookieStr.includes('cf_clearance') || !cookieStr.includes('__Host-next-auth.csrf-token')) {
    console.warn('⚠️ ADVERTENCIA: Faltan claves importantes en la cookie.');
  }
  console.log('✅ Cookie cargada correctamente.');
  return true;
}

if (!validarCookie(soraCookie)) {
  console.log('🛑 Abortando servidor.');
  process.exit(1);
}

// Cabeceras tipo navegador
function getHeaders() {
  return {
    'Cookie': soraCookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Referer': 'https://sora.chatgpt.com/',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  };
}

// Ruta base: test de conexión
app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://sora.chatgpt.com/', {
      headers: getHeaders()
    });
    res.status(200).send(response.data);
  } catch (err) {
    console.error('❌ Error en /:', err.message);
    res.status(err.response?.status || 500).send(`❌ Error: ${err.message}`);
  }
});

// Ruta dinámica para usar desde GPT o Make: /generate?prompt=...
app.get('/generate', async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({ error: '❌ Falta el parámetro ?prompt=' });
  }

  // Simulación por ahora (sin API oficial de Sora)
  const response = {
    status: 'ok',
    received_prompt: prompt,
    simulated_action: `Aquí lanzaría la acción de Sora con el prompt: "${prompt}"`
  };

  res.status(200).json(response);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
