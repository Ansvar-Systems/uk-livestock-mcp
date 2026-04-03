# Changelog

## [0.1.0] - 2026-04-03

### Added

- Initial release with 11 MCP tools (3 meta + 8 domain)
- SQLite + FTS5 database with schema for species, welfare standards, stocking densities, feed requirements, animal health, movement rules, housing requirements, breeding guidance
- Dual transport: stdio (npm) and Streamable HTTP (Docker)
- Jurisdiction validation (GB supported)
- Data freshness monitoring
- Welfare standards separate legal minimum from best practice (DEFRA welfare codes)
- Movement rules include standstill days, exceptions, authority, and regulation references (APHA)
- Breeding guidance includes gestation periods and calendar JSON
- Notifiable disease flagging in animal health search
- Docker image with non-root user, health check
- CI/CD: TypeScript build, lint, test, CodeQL, Gitleaks, GHCR image build
- Veterinary disclaimer and privacy statement
