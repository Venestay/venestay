# Report Template — VeneStay Validation

Full annotated template for the validation report output.
Copy and fill every section. Do not omit sections — write "none" if empty.

---

```
╔══════════════════════════════════════════════════════════════════╗
║  VENESTAY VALIDATION REPORT                                      ║
║  Sprint   : S[XX] — [sprint name]                               ║
║  Date     : YYYY-MM-DD HH:MM                                     ║
║  Trigger  : manual | pre-demo | pre-deploy | sprint-close        ║
║  Gates    : [N passed] / 10 total                               ║
║  Coverage : [N]% ([N implemented] / [N total] test cases)       ║
║  Status   : ✅ ALL CLEAR | ❌ BLOCKED ([N] P0 items)            ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GATE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌────┬─────────────────────────────────┬────────┬────────┬──────────┐
│ G# │ Gate                            │ Status │ Errors │ Duration │
├────┼─────────────────────────────────┼────────┼────────┼──────────┤
│ G1 │ TypeScript compilation          │   ✅   │   0    │   4.2s   │
│ G2 │ ESLint code quality             │   ❌   │   2    │   3.1s   │
│ G3 │ Unit tests                      │   ❌   │   3    │  18.4s   │
│ G4 │ Integration tests               │   🔴   │   —    │   —      │
│ G5 │ Firestore rules audit           │   ✅   │   0    │   6.8s   │
│ G6 │ Storage rules audit             │   ✅   │   0    │   5.2s   │
│ G7 │ Accessibility (WCAG 2.2 AA)     │   ❌   │   1    │   9.3s   │
│ G8 │ Cloud Functions TypeScript      │   ✅   │   0    │   3.7s   │
│ G9 │ Security scan                   │   ✅   │   0    │   2.1s   │
│G10 │ Regression: instant book        │   🔴   │   —    │   —      │
└────┴─────────────────────────────────┴────────┴────────┴──────────┘

Note: G4 and G10 blocked because G3 unit test failures must be
resolved before integration and regression suites can run reliably.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ERROR DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

─── ERROR [ERR-001] ──────────────────────────────────────────────
Gate      : G2 — ESLint
Tag       : LINT_ERROR
File      : src/features/dashboard/components/GuestRequestVerification
            Drawer.tsx
Line      : 142
Severity  : MEDIUM
Message   : react-hooks/exhaustive-deps: useEffect missing dependency
            'request.guestId'
Context   : The subscription to the guest profile may not re-subscribe
            if the drawer opens for a different request without unmounting.
Fix hint  : Add 'request.guestId' to the useEffect dependency array.
            Verify the unsubscribe cleanup still works after the fix.
──────────────────────────────────────────────────────────────────

─── ERROR [ERR-002] ──────────────────────────────────────────────
Gate      : G2 — ESLint
Tag       : LINT_ERROR
File      : src/features/bookings/components/checkout/PaymentQRDisplay.tsx
Line      : 67
Severity  : LOW
Message   : @typescript-eslint/no-floating-promises: Promise returned
            from 'generatePaymentQR' not handled
Context   : Unhandled promise rejections can crash the QR display silently
            without showing an error state to the user.
Fix hint  : Wrap the Cloud Function call in try/catch and set an error
            state to render a fallback UI when QR generation fails.
──────────────────────────────────────────────────────────────────

─── ERROR [ERR-003] ──────────────────────────────────────────────
Gate      : G3 — Unit tests
Tag       : TEST_LOGIC
File      : tests/unit/GuestRequestVerificationDrawer.test.tsx
Line      : 89
Severity  : HIGH
Message   : Expected button text "Aprobar y solicitar pago" but received
            "Aprobar solicitud" when paymentProofUrl is undefined
Context   : The drawer is not correctly detecting the absence of a proof
            to show the correct approval button text. This means the
            anfitrión always sees "Aprobar solicitud" regardless of whether
            the huésped has attached proof or not.
Fix hint  : In GuestRequestVerificationDrawer.tsx, check
            `request.paymentProofUrl` (not `!!request.paymentProofUrl`)
            — the field may be present as an empty string.
──────────────────────────────────────────────────────────────────

─── ERROR [ERR-004] ──────────────────────────────────────────────
Gate      : G7 — Accessibility
Tag       : A11Y
File      : src/features/dashboard/components/GuestRequestVerification
            Drawer.tsx
Line      : 38
Severity  : HIGH
Message   : WCAG 2.2 SC 2.1.1: Drawer does not trap focus. Tab key
            moves focus outside the dialog while it is open.
Context   : Screen reader users and keyboard-only users cannot operate
            the drawer safely. This violates the WCAG 2.2 AA gate.
Fix hint  : Use `focus-trap-react` or implement manual focus trap with
            a ref on the first and last focusable elements inside the
            drawer. Ensure Escape key closes the drawer.
──────────────────────────────────────────────────────────────────

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NOT IMPLEMENTED (no test coverage)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following test cases are defined in coverage-map.md but do not
exist in the codebase. No action required this sprint unless
coverage drops below 70%.

⚪ QR-01 → QR-05      PaymentQRDisplay unit tests (5 cases)
⚪ EXP-01 → EXP-03    expireBookingRequests Cloud Function (3 cases)
⚪ REG-01 → REG-04    Instant book regression suite (4 cases)

Total not implemented: 12 / 48 cases (25%)
Current coverage: 30 / 48 = 62.5%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PM ACTION LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[See pm-action-list.md for full format — populate here]

┌─ SPRINT STATUS ──────────────────────────────────────────────────┐
│  S03 — Reserva Async + Loyalty + Authenticator v2.0             │
│                                                                   │
│  Status   : BLOCKED                                              │
│  P0 items : 0                                                    │
│  P1 items : 2  (ERR-003, ERR-004)                               │
│  P2 items : 1  (ERR-001)                                        │
│  P3 items : 1  (ERR-002) + 3 NOT_IMPLEMENTED groups             │
│  Coverage : 62.5% (below 70% threshold for demo)                │
│                                                                   │
│  Decision required from PM:                                      │
│  Resolve P1 items before scheduling next demo session.           │
│  Coverage must reach 70% before sprint closes.                   │
└───────────────────────────────────────────────────────────────────┘
```
