# Coverage Map — VeneStay Modules vs. Tests

Used by the validation skill to identify NOT_IMPLEMENTED test coverage.

## How to use this file

For each module, check if the corresponding test file exists and contains
the listed test cases. If a test file doesn't exist → NOT_IMPLEMENTED.
If it exists but a specific case is missing → NOT_IMPLEMENTED for that case.

---

## Coverage Map

### `src/services/booking-service.ts`
Expected test file: `tests/integration/booking-service.test.ts`

| Test ID | Description | Type |
|:---|:---|:---|
| BS-01 | Successful reservation creation | Integration |
| BS-02 | Double-booking prevention (concurrent requests) | Integration |
| BS-03 | Date conflict detection returns true | Unit |
| BS-04 | Soft-block applied on request creation | Integration |
| BS-05 | Hard-block applied on request approval | Integration |
| BS-06 | Soft-block released on rejection | Integration |
| BS-07 | Soft-block released on expiration | Integration |

### `src/services/user-service.ts`
Expected test file: `tests/unit/user-service.test.ts`

| Test ID | Description | Type |
|:---|:---|:---|
| US-01 | `subscribeToUserProfile` returns live updates | Unit |
| US-02 | Trust Score calculation matches expected formula | Unit |
| US-03 | User profile not found returns null | Unit |
| US-04 | CRUD operations on Firestore (create, read, update) | Integration |

### `src/services/booking-request.service.ts`
Expected test file: `tests/integration/booking-request.service.test.ts`

| Test ID | Description | Type |
|:---|:---|:---|
| BRS-01 | `createBookingRequest` creates doc with status `pending_host` | Integration |
| BRS-02 | `uploadPaymentProof` uploads to correct Storage path | Integration |
| BRS-03 | `approveBookingRequest` — no proof → status `pending_payment` | Integration |
| BRS-04 | `approveBookingRequest` — with proof → status `awaiting_verification` | Integration |
| BRS-05 | `rejectBookingRequest` releases soft-block atomically | Integration |
| BRS-06 | Cannot call approve/reject on terminal status | Integration |
| BRS-07 | Host cannot approve request for another host's listing | Integration |

### `src/features/bookings/components/checkout/CheckoutPage.tsx`
Expected test file: `tests/unit/CheckoutPage.test.tsx`

| Test ID | Description | Type |
|:---|:---|:---|
| CP-01 | Renders instant book mode correctly | Unit |
| CP-02 | Renders request mode — hides comprobante section | Unit |
| CP-03 | Validation blocks submit without proof in instant mode | Unit |
| CP-04 | Validation allows submit without proof in request mode | Unit |
| CP-05 | Payment method toggle updates displayed amounts | Unit |
| CP-06 | UCP 20/80 split calculation is correct | Unit |

### `src/features/bookings/components/checkout/PaymentQRDisplay.tsx`
Expected test file: `tests/unit/PaymentQRDisplay.test.tsx`

| Test ID | Description | Type |
|:---|:---|:---|
| QR-01 | QR renders loading skeleton while fetching | Unit |
| QR-02 | QR image displays after successful generation | Unit |
| QR-03 | Shows correct amount in VES | Unit |
| QR-04 | Countdown matches request expiration | Unit |
| QR-05 | Expired state disables "Ya pagué" button | Unit |

### `src/features/dashboard/components/GuestRequestVerificationDrawer.tsx`
Expected test file: `tests/unit/GuestRequestVerificationDrawer.test.tsx`

| Test ID | Description | Type |
|:---|:---|:---|
| DRW-01 | Drawer opens with slide-in animation | Unit |
| DRW-02 | Trust Score radial renders correct color (< 40 red, ≥ 80 green) | Unit |
| DRW-03 | Countdown updates every second | Unit |
| DRW-04 | Overlap alert shown when `hasDateConflict === true` | Unit |
| DRW-05 | Approve button text changes based on proof presence | Unit |
| DRW-06 | Reject requires minimum 10 char note | Unit |
| DRW-07 | Buttons disabled during Cloud Function call | Unit |
| DRW-08 | Drawer closes after successful approval | Unit |
| DRW-09 | Focus moves into drawer on open (accessibility) | Unit |
| DRW-10 | Focus returns to trigger button on close (accessibility) | Unit |

### `src/features/dashboard/components/ListingForm.tsx`
Expected test file: `tests/unit/ListingForm.test.tsx`

| Test ID | Description | Type |
|:---|:---|:---|
| LF-01 | Step progression (General → Gallery → Map → Payments) | Unit |
| LF-02 | `bookingMode` toggle persists between steps | Unit |
| LF-03 | `cleaningFee` defaults to 0 | Unit |
| LF-04 | `cleaningFee` rejects negative values | Unit |
| LF-05 | HostPaymentInfo required for Pago Móvil mode | Unit |

### `functions/src/approveBookingRequest.ts`
Expected test file: `functions/tests/approveBookingRequest.test.ts`

| Test ID | Description | Type |
|:---|:---|:---|
| AF-01 | Approval with proof → `awaiting_verification` | Integration |
| AF-02 | Approval without proof → `pending_payment` | Integration |
| AF-03 | Non-host caller → `permission-denied` error | Integration |
| AF-04 | Already-terminal status → `failed-precondition` error | Integration |
| AF-05 | Guest notification sent after approval | Integration |

### `functions/src/rejectBookingRequest.ts`
Expected test file: `functions/tests/rejectBookingRequest.test.ts`

| Test ID | Description | Type |
|:---|:---|:---|
| RF-01 | Rejection updates status to `rejected` | Integration |
| RF-02 | Soft-block released in same transaction | Integration |
| RF-03 | Non-host caller → `permission-denied` | Integration |
| RF-04 | Guest notification sent after rejection | Integration |

### `functions/src/generatePaymentQR.ts`
Expected test file: `functions/tests/generatePaymentQR.test.ts`

| Test ID | Description | Type |
|:---|:---|:---|
| QRF-01 | Returns valid base64 QR image | Integration |
| QRF-02 | QR contains correct phone, bank, amount fields | Integration |
| QRF-03 | VES amount calculated with live BCV rate | Integration |
| QRF-04 | Non-guest caller → `permission-denied` | Integration |
| QRF-05 | Terminal status request → `failed-precondition` | Integration |

### `functions/src/expireBookingRequests.ts` (scheduled)
Expected test file: `functions/tests/expireBookingRequests.test.ts`

| Test ID | Description | Type |
|:---|:---|:---|
| EXP-01 | Requests past `expiresAt` are marked `expired` | Integration |
| EXP-02 | Soft-block released for expired requests | Integration |
| EXP-03 | Requests not yet expired are untouched | Integration |

### Regression suite — Instant Book (Gate 10)
Expected test file: `tests/regression/instant-book.test.ts`

| Test ID | Description |
|:---|:---|
| REG-01 | Instant book flow completes end-to-end without regression |
| REG-02 | Comprobante upload still required in instant mode |
| REG-03 | `bookingMode === 'instant'` does not show request UI elements |
| REG-04 | UCP calculation unchanged in instant mode |

---

## Coverage score formula

```
coverage_score = (PASS_count / total_test_cases) * 100
not_implemented_score = (NOT_IMPLEMENTED_count / total_test_cases) * 100
```

Report both scores in the validation report header.
A sprint is NOT ready for demo if `coverage_score < 70%` or any BLOCKER FAIL exists.
