# MoneyMate Documentation

This directory contains implementation-aligned product, architecture, data, operations, and policy documentation.

## Document map

| Document | Purpose |
| --- | --- |
| [architecture.md](./architecture.md) | Runtime topology, workspace boundaries, layers, and key flows |
| [auth_sessions.md](./auth_sessions.md) | Web/mobile token transport, rotation, replay handling, and session operations |
| [business_rules.md](./business_rules.md) | Executed domain invariants and workflow constraints |
| [diagrams.md](./diagrams.md) | Mermaid views of context, auth, mutations, Copilot, recurring processing, and mobile sync |
| [erd.md](./erd.md) | Prisma-aligned entity model, constraints, indexes, and data semantics |
| [requirements.md](./requirements.md) | Numbered functional and non-functional requirements |
| [srs.md](./srs.md) | System scope, interfaces, constraints, quality attributes, and verification |
| [user_stories.md](./user_stories.md) | User-centered scenarios and acceptance criteria |
| [mobile_release.md](./mobile_release.md) | Mobile build, device QA, rollout, and rollback runbook |
| [privacy_policy.md](./privacy_policy.md) | Draft privacy-policy content requiring legal and deployment-specific completion |

## Sources of truth

When documentation and implementation differ, use these sources in order and update the affected document:

1. Prisma schema and committed migrations for database structure.
2. Route, validator, service, repository, and security tests for API behavior.
3. Shared contracts for cross-platform payloads.
4. Application code and tests for web/mobile behavior.
5. Swagger UI for the currently generated HTTP schema.

## Maintenance rules

- Update documentation in the same change as material behavior, schema, security, environment, or release-process changes.
- Describe implemented behavior separately from targets or future work.
- Do not place real credentials, production identifiers, personal data, or private provider details in documentation.
- Keep diagrams small enough to render in standard Mermaid viewers.
- Date implementation snapshots when a document summarizes behavior that may drift.
- Preserve stable requirement and user-story IDs when refining wording.
