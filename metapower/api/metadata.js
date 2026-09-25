const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ALLOWED_ORIGIN = '*'; // ganti dengan domain website kamu untuk lebih aman, misal: 'https://situskamu.com'

// PENTING: file ini harus pakai Node.js Serverless Function (default di Vercel),
// BUKAN Edge Runtime. Jangan tambahkan baris `export const config = { runtime: 'edge' }`
// di file ini, karena Edge Runtime tersebar di banyak lokasi seperti Cloudflare Workers
// dan bisa kena masalah "User location is not supported" yang sama.

module.exports = async (req, res) => {
  // Header CORS
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).send('Vercel Function for Metadata Assistant is running!');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body;

    if (!body || !body.contents) {
      res.status(400).json({ error: { message: 'Body tidak valid, field "contents" wajib ada.' } });
      return;
    }

    // Model aktif per September 2026. Dipilih yang lebih cepat (flash-lite)
    // supaya muat di batas waktu 10 detik pada Vercel Hobby plan.
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: body.generationConfig || undefined,
    });

    const result = await model.generateContent(body.contents);
    const response = result.response;

    // Bentuk balasan dibuat semirip mungkin dengan REST API Gemini asli,
    // supaya kode callGeminiAPI di app.js tidak perlu diubah sama sekali.
    res.status(200).json({
      candidates: [
        {
          content: {
            parts: [{ text: response.text() }],
          },
        },
      ],
    });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: { message: err.message || 'Kesalahan pemrosesan AI' } });
  }
};
