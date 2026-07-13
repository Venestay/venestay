/**
 * VeneStay - Script de Prueba Local de Twilio WhatsApp API
 * 
 * Uso:
 *   1. Asegúrate de tener las credenciales en variables de entorno o en `functions/.env`:
 *      TWILIO_ACCOUNT_SID=AC...
 *      TWILIO_AUTH_TOKEN=...
 *      TWILIO_WHATSAPP_NUMBER=+14155238886
 *   2. Ejecuta desde la terminal indicando el número de teléfono destino (en formato E.164):
 *      node scripts/test-twilio-whatsapp.js +584121234567
 */

import fs from 'fs';
import path from 'path';
import twilio from 'twilio';

// Intentar cargar variables desde functions/.env si no están en process.env
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

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER?.trim() || '+15559525528';
const contentSid = process.env.TWILIO_CONTENT_SID?.trim();

const targetPhone = process.argv[2];

console.log('╔══ PRUEBA LOCAL DE TWILIO WHATSAPP · VeneStay SDD ═══════╗');
if (!targetPhone) {
  console.error('❌ ERROR: Debes indicar el teléfono destino como argumento.');
  console.error('   Ejemplo: node scripts/test-twilio-whatsapp.js +584121234567');
  process.exit(1);
}

if (!accountSid || !authToken) {
  console.error('❌ ERROR: No se encontraron las credenciales TWILIO_ACCOUNT_SID ni TWILIO_AUTH_TOKEN.');
  console.error('   Asegúrate de configurarlas en functions/.env o en tu terminal.');
  process.exit(1);
}

const cleanFrom = whatsappNumber.replace(/^whatsapp:/i, '').trim();
const cleanTo = targetPhone.replace(/^whatsapp:/i, '').trim();

console.log(`📡 Account SID : ${accountSid.slice(0, 6)}...`);
console.log(`📱 Origen      : whatsapp:${cleanFrom}`);
console.log(`📲 Destino     : whatsapp:${cleanTo}`);
if (contentSid) {
  console.log(`📄 Content SID : ${contentSid}`);
}
console.log('─────────────────────────────────────────────────────────────');

async function runTest() {
  try {
    const client = twilio(accountSid, authToken);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const baseOptions = {
      from: `whatsapp:${cleanFrom}`,
      to: `whatsapp:${cleanTo}`,
    };

    let message;
    if (contentSid) {
      console.log(`[Twilio] Enviando con Content Template (WABA)... SID: ${contentSid}, OTP: ${code}`);
      message = await client.messages.create({
        ...baseOptions,
        contentSid: contentSid,
        contentVariables: JSON.stringify({ '1': code }),
      });
    } else {
      console.log(`[Twilio] Enviando mensaje de texto estándar... OTP prueba: ${code}`);
      message = await client.messages.create({
        ...baseOptions,
        body: `Tu código de verificación para VeneStay es: ${code}. No lo compartas con nadie. Vence en 10 minutos.`,
      });
    }

    console.log('\n✅ ¡MENSAJE ENVIADO CON ÉXITO AL SERVIDOR DE TWILIO!');
    console.log(`🔖 Message SID : ${message.sid}`);
    console.log(`📊 Estado      : ${message.status}`);
    console.log('\nSi estás en Sandbox, asegúrate de que el número destino haya enviado previamente el comando "join <keyword>" a tu número Twilio.');
  } catch (error) {
    console.error('\n❌ ERROR AL ENVIAR MENSAJE VÍA TWILIO:');
    if (error && typeof error === 'object') {
      console.error(`   Código  : ${error.code || 'N/A'}`);
      console.error(`   Mensaje : ${error.message || error}`);
      if (error.moreInfo) console.error(`   Info    : ${error.moreInfo}`);
    } else {
      console.error(error);
    }
  }
}

runTest();
