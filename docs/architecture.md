# Architecture and decisions

## Request flow

```mermaid
sequenceDiagram
    participant UI as Angular dashboard
    participant Form as Reactive form / native dialog
    participant API as Spring MVC
    participant Service as Transactional service
    participant DB as MySQL
    UI->>API: GET students, then dashboard
    API->>DB: Query student, school, fees, activation
    DB-->>UI: Dashboard DTO
    UI->>Form: Activate Now
    Form->>Form: Normalize and validate
    Form->>API: PUT activation DTO
    API->>API: Normalize and Bean Validation
    API->>Service: activate(studentId, request)
    Service->>DB: Lock student; read/upsert activation
    DB-->>Service: Commit
    Service-->>Form: Persisted activation response
    Form-->>UI: Close dialog and announce success
    UI->>API: Refetch dashboard
```

## Why this structure

- **One monorepo, one small backend:** controllers expose HTTP; services own transactions; repositories own persistence. DTOs isolate the wire contract from JPA entities. The feature is too small to justify microservices, queues, CQRS, or a global frontend state library.
- **Angular standalone components:** dashboard, activation, and API responsibilities are separated. Signals hold view state; typed reactive forms own field state and validation. OnPush limits unnecessary rendering.
- **Native dialog:** `showModal()` provides top-layer rendering, background inertness, focus containment, and browser focus restoration. Explicit Tab wrapping keeps focus inside the form in both directions; Escape/cancel handling blocks dismissal while submitting; scroll locking prevents the page moving behind the modal. Keyboard behavior is verified in Chromium.
- **PUT and student-keyed activation:** the resource has a stable student identity. Retries update one resource rather than appending submissions. Identical normalized payloads preserve the submission timestamp.
- **Lock the parent row:** a lock on a nonexistent activation cannot reliably serialize first insertions. Locking the existing student row serializes both first and later submissions. The database key remains a second correctness boundary.
- **Database-derived status:** activation row existence determines Activated. The successful PUT response is authoritative; the UI uses it immediately, then refetches the complete dashboard. If that refresh fails, the activation remains correctly displayed and a notice explains how to reload.
- **Migrations over automatic DDL:** immutable Flyway migrations make schema/seed behavior reproducible. Hibernate validation catches mapping drift. Tests use real MySQL rather than relying on H2 compatibility.
- **Frontend/backend validation:** the client gives immediate feedback and normalizes input for the canonical wire contract. Server validation remains authoritative. Tests cover corresponding phone, email, PAN, and name boundaries on both sides.
- **Local fonts/assets:** Lato is bundled through Fontsource. The supplied Figma portrait was extracted from its visible design reference; the blank school mark and fee illustration are local SVGs. No business data or assets depend on a third-party request at runtime.

## Design choices and limitations

The Figma canvas was inspected at 100%: a 414px mobile frame, 386px cards, a 94px student card, and a 280px fee widget guided layout. The modal follows the four visible fields and their order. The fee illustration is recreated as SVG because source layer export requires Figma sign-in. Typography and spacing were tuned against the visible reference; this is not a claim of pixel-identical exported assets.

The example Figma phone has a visual hyphen and does not satisfy the emailed ten-digit rule. The implementation follows the written validation requirement. The activation button uses dark text on mint for legibility, and validation labels/errors use sufficient contrast. Placeholder values are examples, not prefilled personal information.

The single demo student is discovered from the API. Authentication, a multi-student picker, PAN verification, lending decisions, and actual payment processing are outside scope. Local ports bind to loopback. CORS restrictions do not replace authorization.

Production improvements would include authenticated student/guardian ownership, encryption/tokenization of PAN/contact details, retention/deletion controls, rate limiting, validated asset URLs, request correlation IDs, safe operational metrics, database backups, deployment secrets, and browser coverage across Safari/Firefox. Monetary calculations would stay on the backend. None of those controls should be represented as implemented here.
