import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum diatur di Environment Variables Vercel.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const body = req.body;
    if (!body || !body.contents) {
      return res.status(400).json({ error: 'Payload request tidak valid.' });
    }

    const result = await model.generateContent(body.contents);
    const responseText = result.response.text();

    return res.status(200).json({
      candidates: [
        {
          content: {
            parts: [{ text: responseText }]
          }
        }
      ]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server.' });
  }
}
