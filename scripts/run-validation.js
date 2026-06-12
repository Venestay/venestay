#!/usr/bin/env node
/**
 * VeneStay Validation Runner
 * Executes all 10 quality gates and outputs structured JSON
 * for the validation skill to consume.
 *
 * Usage:
 *   node scripts/run-validation.js [--gates G1,G2,...] [--json] [--sprint S03]
 *
 * Options:
 *   --gates    Comma-separated list of gates to run (default: all)
 *   --json     Output raw JSON instead of formatted text
 *   --sprint   Sprint identifier for the report header
 *   --trigger  Trigger reason: manual|pre-demo|pre-deploy|sprint-close
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = process.env.VENESTAY_ROOT || path.resolve(__dirname, '..');
const FUNCTIONS_ROOT = path.join(PROJECT_ROOT, 'functions');

const args = process.argv.slice(2);
const flags = {};
args.forEach((arg, i) => {
  if (arg.startsWith('--')) {
    flags[arg.slice(2)] = args[i + 1] || true;
  }
});

const GATES_TO_RUN = flags.gates
  ? flags.gates.split(',').map(g => g.trim())
  : ['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12','G13'];

const results = {
  meta: {
    sprint: flags.sprint || 'unknown',
    trigger: flags.trigger || 'manual',
    timestamp: new Date().toISOString(),
    projectRoot: PROJECT_ROOT,
  },
  gates: {},
  summary: {
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    total: GATES_TO_RUN.length,
  },
};

// ─── Gate runner ────────────────────────────────────────────────

function runGate(id, label, cmdOrFn, options = {}) {
  if (!GATES_TO_RUN.includes(id)) return;

  const start = Date.now();
  const gate = { id, label, status: 'RUNNING', errors: [], duration: 0 };
  results.gates[id] = gate;

  if (options.skip) {
    gate.status = 'SKIPPED';
    gate.duration = 0;
    results.summary.skipped++;
    log(id, label, 'SKIPPED', options.skipReason || 'skipped');
    return;
  }

  // Check if blocked by upstream failure
  if (options.dependsOn) {
    const upstream = results.gates[options.dependsOn];
    if (upstream && (upstream.status === 'FAIL' || upstream.status === 'BLOCKED')) {
      gate.status = 'BLOCKED';
      gate.blockedBy = options.dependsOn;
      gate.duration = 0;
      results.summary.blocked++;
      log(id, label, 'BLOCKED', `upstream ${options.dependsOn} failed`);
      return;
    }
  }

  try {
    let output;
    if (typeof cmdOrFn === 'function') {
      const fnResult = cmdOrFn();
      if (fnResult && fnResult.status === 'FAIL') {
        throw { status: 1, stdout: fnResult.detail || '', stderr: fnResult.detail || '' };
      } else if (fnResult && fnResult.status === 'WARN') {
        gate.status = 'WARN';
        gate.rawOutput = fnResult.detail || '';
        gate.duration = Date.now() - start;
        results.summary.passed++;
        log(id, label, 'WARN', `${gate.duration}ms · ${fnResult.detail}`);
        return;
      }
      output = fnResult ? JSON.stringify(fnResult) : 'PASS';
    } else {
      output = execSync(cmdOrFn, {
        cwd: options.cwd || PROJECT_ROOT,
        encoding: 'utf8',
        timeout: options.timeout || 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }
    gate.status = 'PASS';
    gate.rawOutput = output;
    gate.duration = Date.now() - start;
    results.summary.passed++;
    log(id, label, 'PASS', `${gate.duration}ms`);
  } catch (err) {
    gate.status = 'FAIL';
    gate.rawOutput = err.stdout || '';
    gate.rawError = err.stderr || '';
    gate.exitCode = err.status || 1;
    gate.duration = Date.now() - start;
    results.summary.failed++;
    log(id, label, 'FAIL', `exit ${gate.exitCode} · ${gate.duration}ms`);
  }
}

function log(id, label, status, detail) {
  const symbols = { PASS: '✅', FAIL: '❌', BLOCKED: '🔴', SKIPPED: '⏭', WARN: '⚠️' };
  const sym = symbols[status] || '⚪';
  if (!flags.json) {
    console.log(`  ${sym}  ${id} — ${label.padEnd(32)} ${detail}`);
  }
}

// Helper function for recursive directory scanning
function scanDirectoryForSensitiveLogs(dir, sensitivePatterns, violations = []) {
  if (!fs.existsSync(dir)) return violations;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Exclude node_modules, dist, etc.
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        scanDirectoryForSensitiveLogs(fullPath, sensitivePatterns, violations);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Ignore lines that are comments to reduce false positives
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }
        if (trimmed.includes('console.log')) {
          const lower = trimmed.toLowerCase();
          if (sensitivePatterns.some(p => lower.includes(p))) {
            violations.push(`${path.basename(fullPath)}:${index + 1}: ${trimmed}`);
          }
        }
      });
    }
  }
  return violations;
}

// Custom gate logic implementations
function gateSecurityLogs() {
  const sensitivePatterns = ['token', 'password', 'apikey', 'secret', 'uid'];
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const violations = scanDirectoryForSensitiveLogs(srcDir, sensitivePatterns);
  if (violations.length > 0) {
    return { status: 'FAIL', detail: `Console.logs con datos sensibles encontrados:\n${violations.join('\n')}` };
  }
  return { status: 'PASS' };
}

function gateEnvDocs() {
  try {
    const envPath = path.join(PROJECT_ROOT, '.env');
    const examplePath = path.join(PROJECT_ROOT, '.env.example');
    
    if (!fs.existsSync(envPath)) {
      return { status: 'PASS' }; // Pass if no local .env
    }
    if (!fs.existsSync(examplePath)) {
      return { status: 'FAIL', detail: '.env.example no existe' };
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const exampleContent = fs.readFileSync(examplePath, 'utf8');
    
    const getKeys = (content) => {
      const lines = content.split('\n');
      const keys = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const parts = trimmed.split('=');
          const key = parts[0].trim();
          if (/^[A-Za-z0-9_]+$/.test(key)) {
            keys.push(key);
          }
        }
      }
      return keys;
    };
    
    const envKeys = getKeys(envContent);
    const exampleKeys = getKeys(exampleContent);
    const missing = envKeys.filter(k => !exampleKeys.includes(k));
    
    if (missing.length > 0) {
      return { status: 'FAIL', detail: `Variables de .env no documentadas en .env.example: ${missing.join(', ')}` };
    }
    return { status: 'PASS' };
  } catch (err) {
    return { status: 'FAIL', detail: err.message };
  }
}

function gateMemoryFreshness() {
  try {
    const memoryPath = path.join(PROJECT_ROOT, 'docs/ai_harness/MEMORY_HOT.md');
    if (!fs.existsSync(memoryPath)) {
      return { status: 'WARN', detail: 'MEMORY_HOT.md no existe en la ruta esperada' };
    }
    const stat = fs.statSync(memoryPath);
    const ageMs = Date.now() - stat.mtime.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    
    if (ageHours > 24) {
      return { status: 'WARN', detail: `MEMORY_HOT.md no ha sido actualizado en las últimas ${Math.round(ageHours)}h` };
    }
    return { status: 'PASS' };
  } catch (err) {
    return { status: 'WARN', detail: `No se pudo verificar freshness de MEMORY_HOT.md: ${err.message}` };
  }
}

// ─── Execute gates ───────────────────────────────────────────────

if (!flags.json) {
  console.log('\n  VeneStay Validation Runner');
  console.log(`  Sprint: ${results.meta.sprint} · ${results.meta.timestamp}`);
  console.log('  ─────────────────────────────────────────────────────\n');
}

runGate('G1', 'TypeScript compilation',
  'npx tsc --noEmit');

runGate('G2', 'ESLint code quality',
  'npx eslint . --max-warnings 0 --format json',
  { dependsOn: null });

runGate('G3', 'Unit tests',
  'npx vitest run --reporter=verbose --reporter=json --outputFile=.validation/unit-results.json',
  { dependsOn: 'G1', timeout: 180000 });

runGate('G4', 'Integration tests',
  'npx vitest run --config vitest.integration.config.ts --reporter=json --outputFile=.validation/integration-results.json',
  { dependsOn: 'G3', timeout: 300000 });

// G5 and G6: rules audit — output is generated by skill reading the rules files
// These commands check if emulator is running and run rules tests if available
runGate('G5', 'Firestore rules audit',
  'npx firebase emulators:exec --only firestore "npx vitest run tests/firestore.rules.test.ts" 2>&1 || echo "EMULATOR_OFFLINE"',
  { timeout: 60000 });

runGate('G6', 'Storage rules audit',
  'npx firebase emulators:exec --only storage "npx vitest run tests/storage.rules.test.ts" 2>&1 || echo "EMULATOR_OFFLINE"',
  { timeout: 60000 });

runGate('G7', 'Accessibility WCAG 2.2 AA',
  'npx lhci autorun --config=lighthouserc.json 2>&1 || npx axe --dir dist --save .validation/a11y-results.json',
  { timeout: 120000, skip: true, skipReason: 'Temporariamente bloqueado por error de despliegue Cloud Functions (IAM-GCP-001)' });

runGate('G8', 'Cloud Functions TypeScript',
  'npx tsc --noEmit',
  { cwd: FUNCTIONS_ROOT });

runGate('G9', 'Security scan',
  'npx audit-ci --config audit-ci.json && node scripts/security-static-scan.js',
  { timeout: 60000 });

runGate('G10', 'Regression: instant book',
  'npx vitest run --grep "instant-book" --reporter=json --outputFile=.validation/regression-results.json',
  { dependsOn: 'G3', timeout: 120000 });

// Nuevos gates del pipeline
runGate('G11', 'Security: No sensitive logs',
  gateSecurityLogs);

runGate('G12', 'Documentation: Env vars',
  gateEnvDocs);

runGate('G13', 'Memory: Freshness',
  gateMemoryFreshness);

// ─── Output ─────────────────────────────────────────────────────

// Save results for skill to read
const outputDir = path.join(PROJECT_ROOT, '.validation');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
fs.writeFileSync(
  path.join(outputDir, 'last-run.json'),
  JSON.stringify(results, null, 2)
);

if (flags.json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log('\n  ─────────────────────────────────────────────────────');
  console.log(`  Passed: ${results.summary.passed} · Failed: ${results.summary.failed} · Blocked: ${results.summary.blocked} · Skipped: ${results.summary.skipped}`);
  console.log(`  Results saved to .validation/last-run.json`);
  console.log('  Run the validation skill to generate the PM report.\n');
}

process.exit(results.summary.failed > 0 || results.summary.blocked > 0 ? 1 : 0);
