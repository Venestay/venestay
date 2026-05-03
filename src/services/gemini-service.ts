import { GoogleGenAI } from '@google/genai';

export const getLocalInsights = async (city: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  try {
    const prompt = `Actúa como un experto guía turístico de Venezuela. Dame 3 consejos breves y emocionantes sobre qué hacer o visitar específicamente en la ciudad de ${city}, Venezuela. Sé amigable y usa un tono acogedor. El texto debe estar en español y ser corto (máximo 150 palabras).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return (
      response.text ||
      'No se pudieron obtener consejos locales en este momento. ¡Pero disfruta tu estadía!'
    );
  } catch (error) {
    console.error('Gemini Error:', error);
    return 'Error al conectar con la guía local. ¡Venezuela te espera!';
  }
};


