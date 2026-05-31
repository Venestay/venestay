# Firestore Rules Audit — Reference

Used by Gate 5 of the VeneStay validation pipeline.

## How to execute Gate 5

If Firebase Emulator is running, use the Rules Unit Testing SDK:

```bash
# Install if not present
npm install --save-dev @firebase/rules-unit-testing

# Run rules tests
npx firebase emulators:exec --only firestore \
  "vitest run tests/firestore.rules.test.ts"
```

If the emulator is not running, perform a static audit by reading
`firestore.rules` and checking each rule against the checklist below.
Mark each item PASS, FAIL, or NOT_IMPLEMENTED.

---

## Audit Checklist

### Users collection `/users/{userId}`

| # | Rule | Expected | How to verify |
|:---|:---|:---|:---|
| U-01 | Only owner can write their profile | `request.auth.uid == userId` | Attempt write as different UID |
| U-02 | Authenticated users can read public profiles | `request.auth != null` | Read as non-owner authenticated user |
| U-03 | Unauthenticated read is denied | — | Read without auth token |
| U-04 | `trustScore` cannot be self-modified by user | Field-level write restriction | Attempt direct update of trustScore |

### Listings collection `/listings/{listingId}`

| # | Rule | Expected | How to verify |
|:---|:---|:---|:---|
| L-01 | Only host can update their listing | `resource.data.hostId == request.auth.uid` | Update as non-host |
| L-02 | Only host can delete their listing | Same as L-01 | Delete as non-host |
| L-03 | `bookingMode` only accepts valid enum values | `in ['instant', 'request']` | Set invalid value |
| L-04 | `cleaningFee` must be >= 0 | `>= 0 && is number` | Set negative value |
| L-05 | Authenticated users can read any listing | `request.auth != null` | Read as non-host |

### BookingRequests collection `/bookingRequests/{requestId}`

| # | Rule | Expected | How to verify |
|:---|:---|:---|:---|
| BR-01 | Only guest can create their own request | `request.auth.uid == guestId` | Create as non-guest |
| BR-02 | Initial status must be `pending_host` | Enforced on create | Create with different status |
| BR-03 | Host cannot be the same as guest | `hostId != guestId` | Create self-booking |
| BR-04 | Guest can read their own requests | `request.auth.uid == guestId` | Read as guest |
| BR-05 | Host can read requests for their properties | `request.auth.uid == hostId` | Read as host |
| BR-06 | Third party cannot read any request | — | Read as unrelated user |
| BR-07 | Guest can update `paymentProofUrl` only when `pending_payment` | Status + field restriction | Update in wrong status |
| BR-08 | No client can change `status` directly | `allow update: if false` (for status changes) | Attempt status change from client |
| BR-09 | No one can delete a request | `allow delete: if false` | Attempt delete |

### Critical security rules

| # | Rule | Severity | Notes |
|:---|:---|:---|:---|
| SEC-01 | KYC documents only accessible by owner and admin | BLOCKER | `/kyc/{uid}/` path restriction |
| SEC-02 | Payment proofs only accessible by guest and host | BLOCKER | `/booking-proofs/{requestId}/` |
| SEC-03 | Admin role verified via Custom Claims, not Firestore field | BLOCKER | `request.auth.token.admin == true` |

---

## Scoring

- All BLOCKER items that FAIL → Gate 5 = FAIL (overall BLOCKER severity)
- Any non-BLOCKER FAIL → Gate 5 = FAIL (HIGH severity)
- All PASS or NOT_IMPLEMENTED → Gate 5 = PASS
- If emulator offline → Gate 5 = BLOCKED (emulator offline)

Report each failing rule as an individual ERR block with tag `RULE_FIRESTORE`.
