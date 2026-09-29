# API contract

Base URL: `http://localhost:8080/api/v1`. The Angular development proxy and Docker Nginx proxy expose the same routes under `/api/v1` on the frontend origin. JSON request/response bodies use camelCase. There is no authentication in this local assessment.

## Discover students

`GET /students` → `200`

```json
[{ "id": 1, "name": "Jessica John Jones" }]
```

The UI selects the first API-provided student. The demonstration migration supplies one student; a multi-student picker is outside scope.

## Dashboard

`GET /students/{id}/dashboard` → `200`

```json
{
  "school": { "id": 1, "name": "School name", "logoUrl": "/assets/school.svg" },
  "student": { "id": 1, "name": "Jessica John Jones", "className": "FS1 Acacia", "avatarUrl": "/assets/student.png" },
  "fee": { "annualFee": 340000.00, "currency": "INR", "interestRate": 0.00 },
  "activated": false
}
```

Every business value is queried from MySQL. Asset URLs refer to bundled frontend files. Missing student or fee data returns `404`.

## Activation

`PUT /students/{id}/activation` → `200` for both create and update

```json
{
  "phone": "+919876543210",
  "pan": "ABCDE1234F",
  "nameAsOnPan": "DEMO PARENT",
  "email": "parent@example.com"
}
```

```json
{ "studentId": 1, "activated": true, "submittedAt": "2026-09-29T15:00:00.123456" }
```

`submittedAt` is UTC, stored with microsecond precision; interpret the offset-free value as UTC. An identical normalized retry preserves the timestamp. A changed request updates the same activation row and timestamp. The student row is locked inside the transaction before reading or creating an activation, so concurrent first submissions serialize. The activation's primary key is the student ID.

| Field | Rules |
| --- | --- |
| phone | Canonical `+91` plus exactly ten ASCII digits. Frontend removes visual spaces/hyphens before sending. Server accepts only canonical phone values after trimming. |
| pan | Five letters, four digits, one letter. Uppercased and trimmed before validation. This checks format, not government identity. |
| nameAsOnPan | Trimmed, nonblank, maximum 150 characters. |
| email | Trimmed, maximum 254 characters; valid local-part/domain structure ending in `.com`, case insensitive. No consecutive local-part dots or leading/trailing domain hyphens. |

The endpoint returns the activation status and timestamp, never the submitted contact or PAN details. Cancel has no API endpoint and sends no write.

## Errors

Errors use `application/problem+json`. Validation errors are keyed by field:

```json
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 400,
  "detail": "Check the highlighted fields and try again.",
  "instance": "/api/v1/students/1/activation",
  "errors": { "phone": "Enter +91 followed by exactly 10 digits" }
}
```

| Status | Meaning |
| --- | --- |
| 400 | Invalid fields, malformed JSON, or nonnumeric student ID. |
| 404 | Unknown student, missing fee summary, or unknown route. |
| 405 | Unsupported HTTP method. |
| 500 | Generic safe failure; no input values or exception messages are echoed. |

CORS allows the explicitly configured frontend origins, GET and PUT, and Content-Type. It is browser access policy, not authentication.
