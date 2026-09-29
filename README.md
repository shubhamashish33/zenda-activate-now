# Zenda activation assessment

A mobile-first Angular + Spring Boot + MySQL implementation of Zenda's supplied **Activate Now** flow. Dashboard content comes from real APIs; activation state survives reloads and application restarts.

## Quick start: Docker

Requirements: Docker Desktop with Linux containers, Docker Compose, and Git. Run these commands from the cloned repository (or extracted source ZIP).

```sh
cp .env.example .env
docker compose up --build -d --wait
```

Windows PowerShell: use `Copy-Item .env.example .env` instead of `cp`.

Open **http://localhost:8081**. API: http://localhost:8080/api/v1/students. MySQL: `localhost:3307`.

Compose runs MySQL 8.4.8, Spring Boot, and the production Angular build served through Nginx. Startup health checks wait for database/API readiness. The named database volume persists across `docker compose down` and rebuilds. `.env.example` contains local demonstration credentials only; use different credentials if adapting this outside a local assessment.

## Native development

Requirements: Node 24.14.1, Java 21, Docker Desktop. Angular 21.2.24 and Spring Boot 4.0.8 are pinned; npm lockfile and Maven Wrapper are committed. No global Angular CLI or Maven install is necessary.

1. Copy `.env.example` to `.env`; run `docker compose up -d db` from the repository root.
2. In a backend terminal:

```sh
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

PowerShell: `.\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=dev'`. Quoting `-D` options avoids PowerShell argument parsing issues.

3. In a frontend terminal:

```sh
cd frontend
npm ci
npm start
```

Open **http://localhost:4200**. The development proxy forwards `/api` to port 8080. Default local CORS permits localhost and 127.0.0.1 on port 4200.

Do not run the native backend and Docker backend on the same port. The native application does not automatically read the root `.env` file: export `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` if changing defaults. Defaults in the explicit dev profile match the example database configuration.

## Feature behavior

- The first student returned by the discovery API supplies the dashboard identity; school, student, annual fee, interest, and activation state come from MySQL.
- Phone, PAN, name as on PAN, and email are required. Phone normalizes to `+91` plus ten digits; email must be valid and end in `.com`. PAN is uppercased and format-checked.
- Valid phone/email fields show green ticks. Invalid fields show inline messages; server-side validation independently protects the API.
- Cancel, close, and Escape discard unsaved fields, write nothing, and restore focus. Reopening starts with an empty form.
- Activate disables duplicate submissions, persists transactionally, returns to the dashboard, and shows Activated. Failed requests preserve details for retry.
- A native dialog provides focus containment/background inertness. The 414px reference layout adapts to narrower screens and remains centered on desktop.

## Verification

Backend integration suite (starts disposable **real MySQL** through Testcontainers):

```sh
cd backend
./mvnw verify
```

Windows: `.\mvnw.cmd verify`. Stop a native app running from `target/*.jar` before packaging: Windows locks an open JAR. Using `spring-boot:run` avoids that JAR lock during normal development.

Frontend unit tests and production build:

```sh
cd frontend
npm ci
npm test -- --watch=false
npm run build
```

Browser suite with the native backend/database running:

```sh
cd frontend
npx playwright install chromium
npm run e2e
```

The suite starts or reuses the Angular dev server. Against the full Docker stack, set `E2E_BASE_URL=http://localhost:8081` first. On PowerShell: `$env:E2E_BASE_URL='http://localhost:8081'`.

**Browser tests reset the synthetic demo student's activation between cases.** They verify the database name and seeded student's name before writing. Use only the disposable demonstration database. Optional test configuration: `E2E_DB_HOST`, `E2E_DB_PORT`, `E2E_DB_NAME` (`zenda` or `zenda_e2e`), `E2E_DB_USER`, and `E2E_DB_PASSWORD`.

Capture the demonstration screenshots again:

```sh
CAPTURE_EVIDENCE=1 npm run e2e:evidence
```

PowerShell: `$env:CAPTURE_EVIDENCE='1'; npm run e2e:evidence`. Output: [`docs/evidence`](docs/evidence). Reports/traces remain local in ignored `playwright-report` and `test-results` directories.

GitHub Actions runs backend, frontend, and production Docker/browser checks. See [verification evidence](docs/verification.md) for the actual results and limitations.

## Reset and troubleshooting

Reset **only the synthetic demonstration activation**, preserving school/student/fee data:

```sh
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE" -e "DELETE FROM activations WHERE student_id = 1;"'
```

Then reload the dashboard. A cross-platform Node reset command is also available after `npm ci`: `cd frontend` then `npm run demo:reset`.

- Docker unavailable: start Docker Desktop and enable Linux containers.
- Port collision: stop the previous app or set `MYSQL_PORT`, `API_PORT`, and `WEB_PORT` in `.env`. Native URLs and browser-test configuration must match any custom ports.
- Flyway checksum mismatch: committed migrations must not be edited after use. Use a new migration; for an explicitly disposable demo database, recreate its volume only if you intend to discard all demo data.
- Diagnose startup with `docker compose ps` and `docker compose logs backend`.
- A clean database contains no submitted PAN/contact details. Examples and screenshots use synthetic values only.

## Review guide

| Topic | Documentation |
| --- | --- |
| API payloads, validation, errors | [API contract](docs/api.md) |
| Tables, keys, migrations | [Database schema](docs/schema.md) |
| Data flow and tradeoffs | [Architecture decisions](docs/architecture.md) |
| Requirement mapping and checks | [Acceptance checklist](docs/acceptance.md) |
| How I used agentic tools | [AI usage disclosure](docs/ai-usage.md) |
| 30-minute walkthrough and Q&A | [Interview guide](docs/interview-guide.md) |
| Suggested submission email | [Submission draft](docs/submission-draft.md) |

Repository agent conventions are in [AGENTS.md](AGENTS.md); [CLAUDE.md](CLAUDE.md) references the same instructions.

This is a local assessment feature, not a production payment/identity verification system. Authentication, real PAN verification, and lending/payment processing are outside scope. The portrait comes from the supplied Figma reference; the fee illustration is recreated as SVG. Fontsource Lato includes its upstream license under the installed package.
