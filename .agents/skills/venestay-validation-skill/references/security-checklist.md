# Security Checklist — Gate 9

Used by the VeneStay validation skill for Gate 9 security scan.
Perform a static analysis of the codebase against these items.

---

## S1 — Financial logic (BLOCKER severity for all)

| # | Check | How to verify |
|:---|:---|:---|
| SEC-F01 | No amount calculation in client code | Search for `* commissionRate`, `* 0.20`, `* bcvRate` in `src/features/` |
| SEC-F02 | All pricing logic in Cloud Functions | Verify `calculatePricing` exists only in `functions/src/` |
| SEC-F03 | No hardcoded commission rates in frontend | Search `src/` for commission percentage literals |
| SEC-F04 | UCP 20/80 split calculated server-side | Verify `anticipoAmount` comes from Cloud Function response |

## S2 — Authentication and authorization

| # | Check | How to verify |
|:---|:---|:---|
| SEC-A01 | No direct Firestore writes to `status` field from client | Search `src/` for `updateDoc` calls that include `status:` on bookingRequests |
| SEC-A02 | Custom Claims used for admin role, not Firestore field | Search `firestore.rules` for `token.admin` vs `data.role` |
| SEC-A03 | No API keys in source code | Scan all `src/` and `functions/src/` for hardcoded key patterns |
| SEC-A04 | `VITE_*` env vars used for Firebase config | Check `firebaseConfig` initialization uses `import.meta.env.VITE_*` |

## S3 — Data privacy (BLOCKER for KYC items)

| # | Check | Severity |
|:---|:---|:---|
| SEC-P01 | No sensitive user data in `localStorage` | BLOCKER |
| SEC-P02 | KYC documents never returned in public API responses | BLOCKER |
| SEC-P03 | Trust Score not directly writable by user | BLOCKER |
| SEC-P04 | Phone and cédula not logged in Cloud Function logs | HIGH |

## S4 — Demo environment safety

| # | Check |
|:---|:---|
| SEC-D01 | Demo accounts use Custom Claim `isDemo: true` |
| SEC-D02 | Demo checkout uses `DemoCheckoutSimulator`, not real payment flow |
| SEC-D03 | No production Firebase config in demo environment |

---

## Scoring

- Any SEC-F or SEC-P (BLOCKER) FAIL → Gate 9 = FAIL, severity BLOCKER
- Other FAILs → Gate 9 = FAIL, severity HIGH or MEDIUM
- Report each as ERR block with tag `SECURITY`
