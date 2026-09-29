# Zenda activation assessment

Angular + Spring Boot + MySQL implementation of the supplied mobile activation flow.

## Prerequisites
Node 24, Java 21, Docker Desktop (Linux containers), and Git. Maven Wrapper is included.

## Development
1. Copy `.env.example` to `.env`.
2. Run `docker compose up -d db`.
3. In `backend`, run `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` (`mvnw.cmd` on Windows).
4. In `frontend`, run `npm ci` then `npm start`.
5. Open http://localhost:4200.

## Approach
A small layered backend and feature-oriented frontend keep this assessment easy to review. MySQL persists every dashboard record and activation. Development migrations provide synthetic demonstration data.

## AI tooling
Codex assisted with planning, implementation, tests, and documentation. Repository instructions live in `AGENTS.md`. Final verification evidence and a detailed disclosure will be recorded with delivery.
