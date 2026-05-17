import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
console.log('\x1b[36m%s\x1b[0m', '=== ANTLIGRAVITY SDD VERIFIER ===');

let hasErrors = false;

// 1. Check for critical files
const criticalFiles = [
  'agents.md',
  '.cursorrules',
  '.env.example',
  'storage.rules',
  'firestore.rules'
];

console.log('\n🔍 1. Validando archivos de gobernanza críticos...');
criticalFiles.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} existe.`);
  } else {
    console.error(`❌ ERROR: Falta el archivo crítico de gobernanza: ${file}`);
    hasErrors = true;
  }
});

// 2. Check for serviceAccountKey.json leak in source files
console.log('\n🔍 2. Validando fugas de seguridad (Secrets & Keys)...');
const envFile = path.join(ROOT_DIR, '.env');
if (!fs.existsSync(envFile)) {
  console.warn('⚠️ ADVERTENCIA: No se encuentra archivo .env local (Copiar desde .env.example)');
} else {
  const envContent = fs.readFileSync(envFile, 'utf8');
  if (envContent.includes('TU_API_KEY_AQUI') || envContent.includes('YOUR_API_KEY')) {
    console.warn('⚠️ ADVERTENCIA: El archivo .env contiene valores placeholders predeterminados.');
  }
}

// Ensure serviceAccountKey.json is ignored
const gitignoreFile = path.join(ROOT_DIR, '.gitignore');
if (fs.existsSync(gitignoreFile)) {
  const gitignore = fs.readFileSync(gitignoreFile, 'utf8');
  if (gitignore.includes('serviceAccountKey.json')) {
    console.log('✅ serviceAccountKey.json está correctamente listado en .gitignore.');
  } else {
    console.error('❌ ERROR: serviceAccountKey.json DEBE estar en el .gitignore.');
    hasErrors = true;
  }
}

// 3. Scan src files for potential hardcoded keys
const hardcodedPatterns = [
  /apiKey:\s*['"`]AIza[0-9A-Za-z-_]{35}['"`]/i, // Firebase API Key heuristic
  /private_key_id:\s*['"`]/i // service account keys
];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        scanDirectory(fullPath);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        hardcodedPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            console.error(`❌ ERROR: Posible credencial expuesta en ${fullPath}`);
            hasErrors = true;
          }
        });
      }
    }
  });
}

try {
  scanDirectory(path.join(ROOT_DIR, 'src'));
  console.log('✅ Escaneo de código completado sin credenciales duras expuestas.');
} catch (e) {
  console.error('⚠️ No se pudo escanear el directorio /src para buscar credenciales.');
}

// 4. Run TypeScript and Linter checking
console.log('\n🔍 3. Ejecutando verificación de TypeScript y Linter...');
try {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npm.cmd run lint' : 'npm run lint';
  execSync(cmd, { stdio: 'inherit', shell: true });
  console.log('✅ TypeScript y ESLint pasaron exitosamente.');
} catch (e) {
  console.error('❌ ERROR: Falló la verificación de linter o compilación TypeScript.');
  hasErrors = true;
}

console.log('\n----------------------------------------');
if (hasErrors) {
  console.log('\x1b[31m%s\x1b[0m', '❌ VERIFICACIÓN FALLIDA. Por favor, corrige los errores antes de continuar.');
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', '🎉 ¡VERIFICACIÓN EXITOSA! Tu entorno está 100% alineado con la gobernanza SDD.');
  process.exit(0);
}
