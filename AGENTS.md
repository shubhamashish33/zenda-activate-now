# Agent instructions

## Structure
- `frontend/`: Angular 21 standalone application, typed reactive forms, signals, SCSS.
- `backend/`: Java 21 / Spring Boot 4, controller-service-repository layers, DTOs, Flyway migrations.
- `docs/`: API/schema/decisions, demo evidence, submission and interview preparation.
- `compose.yaml`: local full-stack runtime with MySQL 8.4.

## Commands
- Database: `docker compose up -d db`.
- Backend: `cd backend` then `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` (Windows: `mvnw.cmd`).
- Backend verification: `./mvnw verify` (requires Docker for real MySQL Testcontainers tests).
- Frontend: `cd frontend`, `npm ci`, `npm start`, `npm test -- --watch=false`, `npm run build`.
- Browser tests: `cd frontend`, `npx playwright install chromium`, `npm run e2e` (database and backend running).
- Full runtime: `docker compose up --build`.

## Conventions
- APIs and MySQL are the source of truth; never replace business data with frontend constants or localStorage.
- Validation must agree on client and server. Keep entities internal; expose DTOs and Problem Details errors.
- Migrations are immutable once committed. Synthetic seed data belongs only to the dev profile.
- Never commit credentials, real PAN/contact details, logs containing submitted values, or the interview email PDF.
- Match the supplied Figma, preserve accessibility, and test failures as well as success.
- Avoid unnecessary infrastructure and abstractions. Explain significant tradeoffs in `docs/architecture.md`.
- Test each meaningful milestone, inspect staged diffs, and make a descriptive conventional commit before the next milestone.
- Update README and interview materials when behavior or commands change. Report unrun checks honestly.
