import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || '';

interface PropertyContext {
  title: string;
  city: string;
  amenities: string[];
  pricePerNight: number;
}

export const getLocalInsights = async (city: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return 'Descubre lo mejor de Venezuela con VeneStay.';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Actúa como un guía local experto en Venezuela. Proporciona 3 curiosidades breves y valiosas para un viajero sobre la ciudad de ${city}. Formato: Un párrafo corto por cada punto. Enfócate en seguridad, gastronomía y lugares ocultos.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Error:', error);
    return 'Descubre lo mejor de Venezuela con VeneStay.';
  }
};

export const askAboutProperty = async (
  question: string,
  context: PropertyContext
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY no configurada');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const systemPrompt = `
    Eres el asistente virtual de VeneStay para la propiedad "${context.title}" en ${context.city}.
    Comodidades disponibles: ${context.amenities.join(', ')}.
    Precio: $${context.pricePerNight}/noche (anticipo 20%).
    Responde en español, de forma amigable y concisa. Máximo 100 palabras.
  `;
  
  try {
    const result = await model.generateContent(`${systemPrompt}\n\nPregunta del huésped: ${question}`);
    const response = await result.response;
    return response.text() || 'No pude procesar tu consulta. Intenta de nuevo.';
  } catch (error) {
    console.error('Gemini Ask Error:', error);
    throw error;
  }
};
