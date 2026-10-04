# ADR-0002 — MongoDB DB-leg via official read-only MCP + mongosh seed

- **Status:** Proposed
- **Date:** 2026-09-28
- **Deciders:** QA (Nahuel)
- **Tags:** fixtures, test-data, db-tooling, mcp, trifuerza
- **Supersedes:** —
- **Superseded by:** —

---

## Context

The "trifuerza" (UI + API + DB) drives how QA verifies every feature. The UI leg is Playwright + KATA and the API leg is curl + OpenAPI; the DB leg was `dbhub` (the repo's `[DB_TOOL]`, resolved via `.mcp.json`). Backend ratified **MongoDB** as the data engine (minuta 24/09 §4.1 + contrato v0.3 §2), replacing the earlier PostgreSQL assumption.

`dbhub` cannot serve as the DB leg anymore: its supported types are `sqlserver | postgres | mysql | sqlite | mariadb` — no MongoDB. The DB leg is therefore broken for this project until a MongoDB-capable tool is chosen. The DB leg's job is narrow: prove what the API does **not** return — soft-delete persisted (`active=false`), password stored hashed not plaintext, order `userId` matches the JWT subject, `images[]` paths saved. It is not a full data-testing suite.

Two constraints shape the choice. First, this is an educational MVP with a small team, so the option must be fast and low-maintenance, not enterprise-grade. Second, the repo already standardizes MCP servers for tooling (`.mcp.json` + `opencode.jsonc` + `.codex/config.toml`, kept in parity by `agents:compat:check`), so a drop-in MCP replacement is cheaper than introducing a new tooling pattern.

A focused, source-backed comparison was run (Tavily + Context7 + the `skills` ecosystem search).

## Decision

We will use the **official MongoDB MCP server** (`mongodb-js/mongodb-mcp-server`) in **read-only mode** (`--readOnly`) as the DB leg, wired into all three MCP config files exactly like `dbhub` today, with `MDB_MCP_CONNECTION_STRING` read from `.env`. We will use **`mongosh`** (CLI) for seed data and ad-hoc verification, and keep the bulk of DB verification on the API leg.

Invariants this establishes:

1. **DB assertions are read-only.** The MCP runs with `--readOnly`; QA never mutates the database from the DB leg (mutation is verified through the API leg, or seeded via `mongosh`).
2. **Fixtures are JSON documents**, matching the existing `{resource}-{variant}.json` naming in `docs/qa-standard/traceability-trello-drive.md`, loaded via `mongosh` (or `mongoimport`).
3. **Test isolation via Docker**: one MongoDB container (INFRA-001) with a dedicated test DB, dropped/reseeded per run.
4. **~80% of DB assertions ride the API leg**; the DB leg is reserved for the data-integrity cases the API cannot prove.

The exact wiring (goes live once Back delivers a reachable MongoDB):

```jsonc
// .mcp.json
"mongodb": {
  "command": "npx",
  "args": ["-y", "mongodb-mcp-server@latest", "--readOnly"],
  "env": { "MDB_MCP_CONNECTION_STRING": "${MDB_MCP_CONNECTION_STRING}" }
}
```

## Consequences

- **Positive:** drop-in replacement for `dbhub` (same MCP pattern, same `.env`-driven auth); officially maintained, zero QA maintenance burden; `--readOnly` removes the risk of a test corrupting data; natural-language `find`/`aggregate`/`count` tools are token-efficient for targeted assertions.
- **Negative / trade-offs:** a skill wrapping `mongosh` would be marginally more token-lean (no MCP schema in context), but costs more (install `mongosh`, author/maintain the skill, more bash round-trips). We accept the small constant MCP cost. The server is **inert until `MDB_MCP_CONNECTION_STRING` is set** — a live dependency on Back delivering a reachable MongoDB (still pending: backend repo is empty). `@latest` should be pinned to a version before it is relied on in CI.
- **Neutral / follow-ups:** authoring is unblocked now; execution stays blocked on Back Block 1 (Auth) + a reachable Mongo. Pin the version; add `MDB_MCP_CONNECTION_STRING` to `.env` once Back provides it.

## Alternatives considered

- **`mongosh` CLI via a thin skill** — token-leaner in the narrow sense, and the repo prefers CLI-first. Rejected: no ready QA-focused mongosh skill exists in the skills ecosystem (MongoDB's official skills target query-optimizer / Atlas / AI); it adds install + maintenance for marginal token savings; `mongosh` stays as the seed/ad-hoc complement instead.
- **MongoDB Compass (GUI)** — fine for humans exploring data, not for an agent/automation DB leg. Rejected.
- **`mongodb-memory-server`** — spins up Mongo in-process; that is Back's unit/integration concern, not QA's E2E DB leg. Rejected.
- **Community MCP servers** (`mongodb-developer/mongodb-mcp-server`, `mcp-mongo-server`) — read-only Mongo MCPs; redundant once the official one is adopted. Rejected.
- **DBHub** — the incumbent, but has no MongoDB type. Superseded by this decision for the DB leg.

## References

- MongoDB MCP Server (official): https://github.com/mongodb-js/mongodb-mcp-server · https://www.mongodb.com/docs/mcp-server/tools
- mongosh scripting: https://www.mongodb.com/docs/mongodb-shell/reference/options (`--quiet --json --eval`)
- MCP vs CLI / skills trade-off: https://manveerc.substack.com/p/mcp-vs-cli-ai-agents · https://jannikreinhard.com/why-cli-tools-are-beating-mcp-for-ai-agents
- MongoDB data-modeling best practices (schema validation, atomic stock): https://www.mongodb.com/docs/manual/data-modeling/best-practices
- Skills ecosystem search (no QA mongosh skill): `npx skills find mongodb`
- Contrato API v0.3 (MongoDB ratified): https://docs.google.com/document/d/17FpT-SSeizSKYtnWysg01l8z4gbXHspWDnQlb23etJk/edit
