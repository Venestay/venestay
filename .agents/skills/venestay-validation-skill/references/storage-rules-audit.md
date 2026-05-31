# Storage Rules Audit — Reference

Used by Gate 6 of the VeneStay validation pipeline.

## Audit Checklist

### Profile photos `/profile-photos/{uid}/{fileName}`

| # | Rule | Expected |
|:---|:---|:---|
| SP-01 | Only owner can upload | `request.auth.uid == uid` |
| SP-02 | Max file size 5MB | `request.resource.size < 5 * 1024 * 1024` |
| SP-03 | Only image types accepted | `request.resource.contentType.matches('image/.*')` |
| SP-04 | Authenticated users can read | `request.auth != null` |

### KYC documents `/kyc/{uid}/{fileName}`

| # | Rule | Expected | Severity |
|:---|:---|:---|:---|
| KYC-01 | Only owner can upload | `request.auth.uid == uid` | BLOCKER |
| KYC-02 | Only owner and admin roles can read | Custom Claims check | BLOCKER |
| KYC-03 | Max file size 5MB | Size check | HIGH |
| KYC-04 | Only image or PDF accepted | `image/.*` or `application/pdf` | HIGH |
| KYC-05 | No public read under any circumstance | Deny all without auth | BLOCKER |

### Listing gallery `/listings/{listingId}/gallery/{fileName}`

| # | Rule | Expected |
|:---|:---|:---|
| LG-01 | Only listing host can upload | Verify via Firestore hostId lookup |
| LG-02 | Max 5MB per image | Size check |
| LG-03 | Only image types | Content type check |
| LG-04 | Public read (authenticated) | Any authenticated user |

### Payment proofs `/booking-proofs/{requestId}/{fileName}`

| # | Rule | Expected | Severity |
|:---|:---|:---|:---|
| PP-01 | Only guest of that request can upload | Participant check | BLOCKER |
| PP-02 | Max 5MB | Size check | HIGH |
| PP-03 | Only image types | Content type check | HIGH |
| PP-04 | Only guest and host can read | Participant check | BLOCKER |
| PP-05 | No write after request reaches terminal status | Status check | HIGH |

---

## Scoring

Same as Firestore audit — any BLOCKER FAIL = Gate 6 FAIL with BLOCKER severity.
Report each failing rule as ERR block with tag `RULE_STORAGE`.
