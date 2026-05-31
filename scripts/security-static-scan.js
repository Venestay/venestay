#!/usr/bin/env node
/**
 * VeneStay Security Static Scanner
 * Performs code-level security checks that npm audit doesn't cover.
 * Part of Gate 9 in the validation pipeline.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.env.VENESTAY_ROOT || path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const FUNCTIONS_SRC = path.join(ROOT, 'functions', 'src');

const findings = [];

function scan(label, dir, pattern, message, severity = 'HIGH') {
  try {
    const cmd = `grep -rn "${pattern}" "${dir}" --include="*.ts" --include="*.tsx" -l 2>/dev/null`;
    const output = execSync(cmd, { encoding: 'utf8' }).trim();
    if (output) {
      const files = output.split('\n').filter(Boolean);
      findings.push({ label, files, message, severity });
    }
  } catch {
    // grep returns exit 1 when no match — that's a pass
  }
}

// F01 — No amount calculation in client src
scan(
  'SEC-F01',
  SRC,
  '\\* commissionRate\\|\\* 0\\.20\\|\\* bcvRate\\|anticipoAmount.*\\*',
  'Financial calculation found in client code. Must be in Cloud Functions only.',
  'BLOCKER'
);

// F03 — No hardcoded commission rates
scan(
  'SEC-F03',
  SRC,
  '0\\.05\\|0\\.08\\|0\\.10\\|0\\.12\\|commission.*=.*0\\.',
  'Hardcoded commission rate found in frontend. Use server-side config.',
  'HIGH'
);

// A03 — No API keys in source
scan(
  'SEC-A03',
  SRC,
  'AIzaSy\\|sk-\\|Bearer [A-Za-z0-9]\\{20,\\}',
  'Potential API key or token hardcoded in source.',
  'BLOCKER'
);

scan(
  'SEC-A03-fn',
  FUNCTIONS_SRC,
  'AIzaSy\\|sk-\\|Bearer [A-Za-z0-9]\\{20,\\}',
  'Potential API key or token hardcoded in Cloud Functions source.',
  'BLOCKER'
);

// A01 — No direct status writes on bookingRequests from client
scan(
  'SEC-A01',
  SRC,
  "updateDoc.*status.*:\\|status.*:.*'pending_host'\\|status.*:.*'confirmed'",
  'Direct Firestore status write from client detected. Use Cloud Functions.',
  'BLOCKER'
);

// P01 — No sensitive data in localStorage
scan(
  'SEC-P01',
  SRC,
  "localStorage\\.setItem.*trust\\|localStorage\\.setItem.*kyc\\|localStorage\\.setItem.*cedula\\|localStorage\\.setItem.*passport",
  'Sensitive user data being stored in localStorage.',
  'BLOCKER'
);

// Output
const blockers = findings.filter(f => f.severity === 'BLOCKER');
const highs = findings.filter(f => f.severity === 'HIGH');

if (findings.length === 0) {
  console.log('Security static scan: all checks passed.');
  process.exit(0);
} else {
  console.log(`Security static scan: ${blockers.length} blockers, ${highs.length} high severity\n`);
  findings.forEach(f => {
    console.log(`[${f.severity}] ${f.label}: ${f.message}`);
    f.files.forEach(file => console.log(`  → ${file}`));
  });

  // Save for validation skill
  const outputDir = path.join(ROOT, '.validation');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(
    path.join(outputDir, 'security-findings.json'),
    JSON.stringify(findings, null, 2)
  );

  process.exit(blockers.length > 0 ? 2 : 1);
}
