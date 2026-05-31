---
name: venestay-validation
description: |
  Use this skill for ANY validation, testing, or quality assurance task in the VeneStay project.
  Triggers on phrases like: "run tests", "validate the project", "check what's passing", "QA report",
  "what tests are failing", "generate validation report", "check quality gates", "verify the sprint",
  "audit the codebase", "test coverage", "what's broken", "QA status".
  
  This skill runs the full VeneStay validation pipeline: executes TypeScript compilation, ESLint,
  integration tests, Firestore rules audits, accessibility checks, and security scans. It then
  classifies each result as PASS / FAIL / BLOCKED / NOT_IMPLEMENTED, generates a structured report,
  and emits a PM-ready action list with priorities for the orchestrator (Project Manager) to assign.
  
  Always use this skill before marking any sprint as complete, before any demo, before any deployment,
  or whenever the user asks about the health of the project. Do not attempt to run validations manually
  without consulting this skill first.
compatibility:
  tools:
    - bash_tool
    - create_file
    - present_files
  stack:
    - React 19 + TypeScript 5 (strict)
    - Vite 6
    - Firebase SDK v10 (Firestore, Auth, Storage)
    - Zod validation schemas
    - Vitest + Firebase Emulator Suite
  project_root: C:/VeneStay  # Windows path — adapt per environment
---

# VeneStay Validation Skill

Runs the complete quality gate pipeline for VeneStay, classifies results, and generates
a structured report ready for PM triage.

---

## 1. When to use this skill

Use this skill whenever:
- A sprint is about to be marked complete
- A demo session is being prepared
- The user asks "what's working / what's broken"
- The PM needs to assign fixes
- A new feature was just implemented and needs full regression coverage
- The agent is about to make architectural decisions and needs current project health

**Do not skip this skill** to run validation commands manually. This skill enforces
the correct order of operations and produces the structured output the PM needs.

---

## 2. Validation Pipeline — Execution Order

Run gates in this exact order. If a gate produces BLOCKED errors that prevent
subsequent gates from running (e.g., TypeScript errors that prevent test execution),
mark all dependent gates as `BLOCKED (upstream)` and explain why.

```
GATE 1  → TypeScript Compilation       tsc --noEmit
GATE 2  → ESLint Code Quality          eslint . --max-warnings 0
GATE 3  → Unit Tests                   vitest run --reporter=verbose
GATE 4  → Integration Tests            vitest run --config vitest.integration.config.ts
GATE 5  → Firestore Rules Audit        (see references/firestore-rules-audit.md)
GATE 6  → Storage Rules Audit          (see references/storage-rules-audit.md)
GATE 7  → Accessibility Check          axe-core / Lighthouse CI
GATE 8  → Cloud Functions TypeScript   cd functions && tsc --noEmit
GATE 9  → Security Scan               (see references/security-checklist.md)
GATE 10 → Regression: Instant Book     vitest run --grep "instant-book"
```

Each gate must complete before the next starts. Never parallelize gates.

---

## 3. Result Classification

For every gate and every test case within it, classify with exactly one of these statuses:

| Status | Symbol | Meaning |
|:---|:---:|:---|
| `PASS` | ✅ | Gate ran and all checks passed |
| `FAIL` | ❌ | Gate ran but one or more checks failed |
| `BLOCKED` | 🔴 | Gate could not run due to upstream failure |
| `NOT_IMPLEMENTED` | ⚪ | Test/gate not yet written for this module |
| `SKIPPED` | ⏭ | Intentionally skipped (must include reason) |

**Critical rule:** `BLOCKED` is not a failure of the gate itself — it is a consequence
of an upstream failure. The root cause must always be attributed to the earliest
FAIL in the chain.

---

## 4. Error Classification for PM Triage

Every FAIL must be tagged with one of these categories so the PM can route correctly:

| Tag | Description | Default assignee |
|:---|:---|:---|
| `TS_ERROR` | TypeScript type mismatch or missing type | Frontend Tech |
| `LINT_ERROR` | ESLint rule violation | Frontend Tech |
| `TEST_LOGIC` | Test case fails due to wrong business logic | Full-stack Tech |
| `TEST_MISSING` | Functionality exists but has no test coverage | QA |
| `RULE_FIRESTORE` | Firestore security rule violation | Backend Tech |
| `RULE_STORAGE` | Storage security rule violation | Backend Tech |
| `A11Y` | WCAG 2.2 AA accessibility violation | Frontend Tech |
| `SECURITY` | Security vulnerability or exposure | Security / Backend Lead |
| `REGRESSION` | Previously passing test now fails | PM escalation → Lead |
| `CLOUD_FN` | Cloud Function compilation or logic error | Backend Tech |

---

## 5. Report Format

After running all gates, generate the validation report using this exact structure.
Read `references/report-template.md` for the full template with examples.

### 5.1 Header block

```
╔══════════════════════════════════════════════════════════════════╗
║  VENESTAY VALIDATION REPORT                                      ║
║  Sprint   : [S-XX — Sprint name from MEMORY_HOT.md]             ║
║  Date     : [YYYY-MM-DD HH:MM]                                   ║
║  Trigger  : [manual / pre-demo / pre-deploy / sprint-close]      ║
║  Gates    : [N passed] / [N total] — [overall status]            ║
╚══════════════════════════════════════════════════════════════════╝
```

### 5.2 Gate summary table

| Gate | Description | Status | Errors | Duration |
|:---|:---|:---:|:---:|:---:|
| G1 | TypeScript compilation | ✅ / ❌ / 🔴 | N | Xs |
| G2 | ESLint | ✅ / ❌ / 🔴 | N | Xs |
| ... | ... | ... | ... | ... |

### 5.3 Error detail section

For every FAIL, emit a structured error block:

```
─── ERROR [ERR-XXX] ──────────────────────────────────────────────
Gate      : G[N] — [Gate name]
Tag       : [ERROR_TAG]
File      : [src/path/to/file.ts]
Line      : [N] (if applicable)
Severity  : BLOCKER / HIGH / MEDIUM / LOW
Message   : [Exact error message]
Context   : [One sentence explaining why this matters for VeneStay]
Fix hint  : [Specific actionable suggestion for the developer]
──────────────────────────────────────────────────────────────────
```

### 5.4 NOT_IMPLEMENTED section

List all functionality that exists in the codebase but has no test coverage.
Read `references/coverage-map.md` for the complete module-to-test mapping.

### 5.5 PM Action List

This is the primary output for the Project Manager. Generate after all errors are catalogued.
Read `references/pm-action-list.md` for format and prioritization rules.

---

## 6. Memory update after validation

After generating the report, update `MEMORY_HOT.md` with the validation result.
The QA_GATE field must reflect the current state:

```
QA_GATE: PASS (G10/G10) | [date]
  — or —
QA_GATE: FAIL (G7/G10 passed) | [N] blockers | [date]
```

Also append a summary row to the Quality Gate History table in `MEMORY_WARM.md`.

---

## 7. Reference files

Read these files as needed during execution:

| File | When to read |
|:---|:---|
| `references/firestore-rules-audit.md` | When executing Gate 5 |
| `references/storage-rules-audit.md` | When executing Gate 6 |
| `references/security-checklist.md` | When executing Gate 9 |
| `references/coverage-map.md` | When building the NOT_IMPLEMENTED section |
| `references/report-template.md` | When generating the final report |
| `references/pm-action-list.md` | When generating the PM Action List |
| `references/known-issues.md` | Before classifying — check if error is already tracked |

---

## 8. Edge cases and special handling

### 8.1 Environment not configured

If `npm`, `vitest`, `tsc`, or `eslint` are not available in the current environment:
- Mark all affected gates as `SKIPPED (environment not configured)`
- Still generate the report structure with available results
- Add a setup note at the top of the report

### 8.2 Firebase Emulator not running

Gates 4 (integration tests) and 5–6 (rules audit) require Firebase Emulator.
If it's not running, mark those gates as `BLOCKED (emulator offline)` and include
the startup command in the report: `firebase emulators:start --only firestore,storage,auth`

### 8.3 Partial sprint — module not yet implemented

If a module referenced in a test doesn't exist yet (e.g., Cloud Functions not written),
mark affected tests as `NOT_IMPLEMENTED` rather than `FAIL`. The distinction matters
for PM triage: `FAIL` means something broke; `NOT_IMPLEMENTED` means it was never built.

### 8.4 Regression detected

If a test that passed in a previous sprint now fails, tag it `REGRESSION` and
elevate severity to `BLOCKER` regardless of the underlying error type.
Always include the sprint when it last passed (from `MEMORY_WARM.md`).

---

## 9. Quick reference — VeneStay module-to-gate mapping

| Module | Primary gate | Secondary gate |
|:---|:---|:---|
| `CheckoutPage.tsx` | G1, G3 | G10 (regression) |
| `booking-service.ts` | G1, G4 | G5 (Firestore rules) |
| `user-service.ts` | G1, G4 | G5 |
| `GuestRequestVerificationDrawer.tsx` | G1, G3 | G7 (a11y) |
| `ListingForm.tsx` | G1, G3 | G7 (a11y) |
| `ListingDetail.tsx` | G1, G3 | G7 (a11y), G10 |
| `firestore.rules` | G5 | — |
| `storage.rules` | G6 | — |
| `functions/src/*.ts` | G8 | G4 |
| `dashboard.schema.ts` | G1 | G3 |
| `PaymentQRDisplay.tsx` | G1, G3 | G7 (a11y) |
| `PaymentRequestCard.tsx` | G1, G3 | G7 (a11y) |
