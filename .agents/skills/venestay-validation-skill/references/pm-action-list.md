# PM Action List — Format and Prioritization Rules

Used by the validation skill to generate the PM-ready output section.

## Purpose

The PM Action List is the final section of every validation report.
Its job is to give the Project Manager a prioritized, assignable list of
actions — no technical details, just: what broke, who fixes it, how urgent.

---

## Priority levels

| Priority | Label | Criteria | Expected resolution |
|:---|:---|:---|:---|
| P0 | 🔴 BLOCKER | Any BLOCKER severity FAIL. Sprint cannot close. Demo cannot proceed. | Same session |
| P1 | 🟠 HIGH | FAIL with HIGH severity or any REGRESSION | Next session |
| P2 | 🟡 MEDIUM | FAIL with MEDIUM severity | Within sprint |
| P3 | 🔵 LOW | FAIL with LOW severity or NOT_IMPLEMENTED items | Backlog |

**Rule:** If any P0 exists, the sprint status is `BLOCKED`. No exceptions.
The PM must assign P0 items before any other work continues.

---

## Action item format

Each action item follows this exact structure:

```
[PRIORITY] ACTION-[NNN]
─────────────────────────────────────────────────────────────────
Error ref  : ERR-[XXX] (links to error detail section)
Tag        : [ERROR_TAG]
Module     : [affected module name — no file paths]
Assignee   : [Frontend Tech / Backend Tech / QA / Security / PM]
Sprint     : [S-XX or "current sprint"]
Action     : [Plain language — what the assignee must do]
             Start with an action verb: Fix / Add / Update / Remove /
             Implement / Verify / Review
Acceptance : [How the PM knows this is done — testable condition]
Blocks     : [What cannot proceed until this is resolved, or "nothing"]
─────────────────────────────────────────────────────────────────
```

---

## Grouping rules

Group action items in this order:
1. All P0 items first (sorted by module)
2. All P1 items (sorted by module)
3. All P2 items (sorted by module)
4. All P3 items (sorted by module)

Within each group, sort by module name alphabetically.

---

## Sprint status declaration

After the action list, declare the sprint status:

```
┌─ SPRINT STATUS ─────────────────────────────────────────────────┐
│  [S-XX — Sprint name]                                           │
│                                                                  │
│  Status   : BLOCKED / READY_FOR_DEMO / READY_TO_CLOSE          │
│  P0 items : [N]                                                  │
│  P1 items : [N]                                                  │
│  P2 items : [N]                                                  │
│  P3 items : [N]                                                  │
│  Coverage : [N]% ([N] implemented / [total] total cases)        │
│                                                                  │
│  Decision required from PM:                                      │
│  [One sentence — e.g., "Assign P0 items before sprint closes"]  │
└──────────────────────────────────────────────────────────────────┘
```

**Status rules:**
- `BLOCKED` → Any P0 item exists
- `READY_FOR_DEMO` → No P0, no P1, coverage ≥ 70%
- `READY_TO_CLOSE` → No P0, no P1, no P2, coverage ≥ 85%

---

## Example PM Action List

```
════════════════════════════════════════════════════════════════
  PM ACTION LIST — S03 · 2026-05-21
════════════════════════════════════════════════════════════════

── P0 BLOCKERS (resolve before anything else) ──────────────────

[🔴 P0] ACTION-001
─────────────────────────────────────────────────────────────────
Error ref  : ERR-BR-007
Tag        : RULE_FIRESTORE
Module     : bookingRequests (Firestore rules)
Assignee   : Backend Tech
Sprint     : S03
Action     : Fix Firestore rule that allows third-party read of
             bookingRequests. Any authenticated user should be
             denied access unless they are the guest or host of
             that specific request.
Acceptance : Rule audit test BR-06 passes — unrelated user read
             returns permission-denied.
Blocks     : Sprint S03 close, next demo session
─────────────────────────────────────────────────────────────────

── P1 HIGH (resolve this sprint) ───────────────────────────────

[🟠 P1] ACTION-002
─────────────────────────────────────────────────────────────────
Error ref  : ERR-CP-004
Tag        : TEST_LOGIC
Module     : CheckoutPage
Assignee   : Frontend Tech
Sprint     : S03
Action     : Fix submit validation in request mode — currently
             still requires comprobante image even when
             bookingMode === 'request'. This was supposed to be
             removed in the checkout optimization.
Acceptance : Test CP-04 passes — submit allowed without proof
             in request mode.
Blocks     : GuestRequestVerificationDrawer integration testing
─────────────────────────────────────────────────────────────────

── P3 BACKLOG ───────────────────────────────────────────────────

[🔵 P3] ACTION-003
─────────────────────────────────────────────────────────────────
Error ref  : NOT_IMPLEMENTED
Tag        : TEST_MISSING
Module     : PaymentQRDisplay
Assignee   : QA
Sprint     : backlog
Action     : Implement unit tests QR-01 through QR-05 for the
             PaymentQRDisplay component (not yet written).
Acceptance : All 5 QR test cases exist and pass.
Blocks     : nothing — feature is working, tests are missing
─────────────────────────────────────────────────────────────────

┌─ SPRINT STATUS ──────────────────────────────────────────────┐
│  S03 — Reserva Async + Loyalty + Authenticator v2.0          │
│                                                               │
│  Status   : BLOCKED                                          │
│  P0 items : 1                                                │
│  P1 items : 1                                                │
│  P2 items : 0                                                │
│  P3 items : 1                                                │
│  Coverage : 58% (28 implemented / 48 total cases)            │
│                                                               │
│  Decision required from PM:                                  │
│  Assign ACTION-001 to Backend Tech immediately.              │
│  Sprint cannot close until Firestore rule is patched.        │
└───────────────────────────────────────────────────────────────┘
```
