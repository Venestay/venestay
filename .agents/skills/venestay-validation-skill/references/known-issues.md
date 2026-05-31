# Known Issues — VeneStay

Read this file before classifying any error in the validation report.
If an error matches a known issue, reference it by ID rather than creating a new ERR entry.
This prevents the PM from seeing the same issue multiple times across different sprints.

---

## Format

```
ISSUE-[NNN]
Status    : OPEN / IN_PROGRESS / RESOLVED / WONT_FIX
Sprint    : [when first detected]
Tag       : [ERROR_TAG]
Module    : [module name]
Summary   : [one sentence]
Note      : [any context the team should know]
```

---

## Active issues (OPEN / IN_PROGRESS)

```
ISSUE-001
Status    : IN_PROGRESS
Sprint    : S03
Tag       : RULE_FIRESTORE
Module    : bookingRequests
Summary   : Third-party read of bookingRequests not blocked
Note      : Assigned to Backend Tech in ACTION-001. Expected fix in S03.
```

```
ISSUE-002
Status    : OPEN
Sprint    : S03
Tag       : TEST_MISSING
Module    : PaymentQRDisplay
Summary   : Unit tests QR-01 through QR-05 not yet written
Note      : Feature works. Tests are backlog item ACTION-003.
```

---

## Resolved issues (for reference)

_None yet — project in early beta._

---

## Instructions for validation skill

1. Before emitting an ERR block, check if the error matches any OPEN/IN_PROGRESS issue here.
2. If it matches: reference the ISSUE-ID in the ERR block instead of creating a new action item.
   Example: `Known issue: ISSUE-001 (IN_PROGRESS, assigned to Backend Tech)`
3. If it's new: create the ERR block normally and add a new ISSUE entry to this file.
4. Emit the updated `known-issues.md` at the end of the report for the user to save.
