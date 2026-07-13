/**
 * VeneStay - Servidor Local Express para Pruebas de Twilio (Sin Emulador de Firebase)
 * 
 * Este servidor permite realizar pruebas locales de verificación por WhatsApp o SMS
 * directamente desde el frontend (localhost:3000) sin necesidad de levantar los emuladores
 * de Firebase ni de consumir Cloud Functions en la nube.
 * 
 * Uso:
 *   1. Ejecuta: node scripts/local-twilio-server.js
 *   2. En tu frontend, asegúrate de tener VITE_USE_LOCAL_TWILIO_SERVER=true en .env.local
 */

import fs from 'fs';
import path from 'path';
import express from 'express';
import crypto from 'crypto';
import twilio from 'twilio';

// 1. Cargar variables desde functions/.env
const envPath = path.resolve(process.cwd(), 'functions/.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const app = express();
const PORT = 3001;

app.use(express.json());

// CORS simple para permitir solicitudes desde localhost:3000 o cualquier puerto de desarrollo
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Almacén local en memoria para los códigos OTP
const otpStore = new Map();

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER?.trim() || '+15559525528';
const contentSid = process.env.TWILIO_CONTENT_SID?.trim();

console.log('╔══ SERVIDOR LOCAL TWILIO EXPRESS · VeneStay SDD ═════════╗');
console.log(`🚀 Puerto      : http://localhost:${PORT}`);
console.log(`📡 Account SID : ${accountSid ? accountSid.slice(0, 6) + '...' : '❌ NO DEFINIDO'}`);
console.log(`📱 Remitente   : ${whatsappNumber}`);
if (contentSid) console.log(`📄 Plantilla   : ${contentSid}`);
console.log('╚═════════════════════════════════════════════════════════╝');

app.post('/api/send-whatsapp-otp', async (req, res) => {
  try {
    const data = req.body.data || req.body;
    let normalizedPhone = (data.phoneNumber || '').trim();
    if (!normalizedPhone) {
      return res.status(400).json({ error: { message: 'Número de teléfono requerido.' } });
    }

    if (/^\+54[1-8]\d{9}$/.test(normalizedPhone)) {
      normalizedPhone = normalizedPhone.replace(/^\+54/, '+549');
    }

    // Verificar cooldown (1 minuto)
    const existing = otpStore.get(normalizedPhone);
    if (existing && existing.expiresAt > Date.now() && (existing.createdAt + 60000) > Date.now()) {
      return res.status(429).json({
        error: { message: 'Ya enviamos un código recientemente. Espera 1 minuto antes de solicitar otro.' }
      });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    otpStore.set(normalizedPhone, {
      codeHash,
      codePlain: code, // Solo para log local
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: Date.now(),
      attempts: 0
    });

    console.log(`\n📲 [LocalServer] Solicitud OTP para: ${normalizedPhone}`);
    console.log(`🔑 [LocalServer] Código generado   : ${code}`);

    if (!accountSid || !authToken) {
      console.warn('⚠️ Credenciales Twilio incompletas. Simulando envío en consola.');
      return res.json({ result: { success: true, message: 'Código simulado correctamente.' } });
    }

    const client = twilio(accountSid, authToken);
    const cleanFrom = whatsappNumber.replace(/^whatsapp:/i, '').trim();
    const cleanTo = normalizedPhone.replace(/^whatsapp:/i, '').trim();

    try {
      console.log(`🚀 Intentando enviar vía WhatsApp (whatsapp:${cleanFrom} -> whatsapp:${cleanTo})...`);
      let message;
      if (contentSid) {
        console.log(`📄 Usando Content Template: ${contentSid} con código OTP: ${code}`);
        message = await client.messages.create({
          from: `whatsapp:${cleanFrom}`,
          to: `whatsapp:${cleanTo}`,
          contentSid: contentSid,
          contentVariables: JSON.stringify({ '1': code }),
        });
      } else {
        message = await client.messages.create({
          from: `whatsapp:${cleanFrom}`,
          to: `whatsapp:${cleanTo}`,
          body: `Tu código de verificación para VeneStay es: ${code}. No lo compartas con nadie. Vence en 10 minutos.`,
        });
      }
      console.log(`✅ ¡Mensaje de WhatsApp enviado! SID: ${message.sid}`);
    } catch (waError) {
      console.warn(`⚠️ Falló envío WhatsApp (${waError.message}). Intentando por SMS estándar...`);
      try {
        const smsMessage = await client.messages.create({
          from: cleanFrom,
          to: cleanTo,
          body: `Tu código de verificación para VeneStay es: ${code}. No lo compartas con nadie. Vence en 10 minutos.`,
        });
        console.log(`✅ ¡Mensaje SMS enviado con éxito! SID: ${smsMessage.sid}`);
      } catch (smsError) {
        console.error(`❌ Error también al enviar por SMS: ${smsError.message}`);
        console.log(`💡 [NOTA] Puedes usar el código mostrado en consola para probar en la UI: ${code}`);
      }
    }

    return res.json({ result: { success: true, message: 'Código enviado correctamente.' } });
  } catch (error) {
    console.error('Error in /api/send-whatsapp-otp:', error);
    return res.status(500).json({ error: { message: error.message || 'Error interno del servidor local.' } });
  }
});

app.post('/api/confirm-whatsapp-otp', async (req, res) => {
  try {
    const data = req.body.data || req.body;
    let normalizedPhone = (data.phoneNumber || '').trim();
    const inputCode = (data.code || '').trim();

    if (/^\+54[1-8]\d{9}$/.test(normalizedPhone)) {
      normalizedPhone = normalizedPhone.replace(/^\+54/, '+549');
    }

    const stored = otpStore.get(normalizedPhone);
    if (!stored) {
      return res.status(404).json({ error: { message: 'No hay un código OTP pendiente para este número.' } });
    }

    if (stored.attempts >= 3) {
      otpStore.delete(normalizedPhone);
      return res.status(429).json({ error: { message: 'Demasiados intentos incorrectos. Solicita un nuevo código.' } });
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({ error: { message: 'El código ha expirado. Solicita uno nuevo.' } });
    }

    const inputHash = crypto.createHash('sha256').update(inputCode).digest('hex');
    if (inputHash !== stored.codeHash) {
      stored.attempts += 1;
      return res.status(400).json({ error: { message: 'Código incorrecto.' } });
    }

    console.log(`\n🎉 [LocalServer] ¡OTP Verificado con éxito para ${normalizedPhone}!`);
    otpStore.delete(normalizedPhone);

    return res.json({ result: { success: true, message: 'Número verificado correctamente.' } });
  } catch (error) {
    console.error('Error in /api/confirm-whatsapp-otp:', error);
    return res.status(500).json({ error: { message: error.message || 'Error interno del servidor local.' } });
  }
});

app.listen(PORT, () => {
  console.log(`\n⚡ Servidor listo en http://localhost:${PORT}`);
  console.log(`👉 Ejecuta este servidor en otra terminal y prueba desde tu app (localhost:3000).\n`);
});
