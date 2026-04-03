# UK Livestock MCP

[![CI](https://github.com/ansvar-systems/uk-livestock-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/ansvar-systems/uk-livestock-mcp/actions/workflows/ci.yml)
[![GHCR](https://github.com/ansvar-systems/uk-livestock-mcp/actions/workflows/ghcr-build.yml/badge.svg)](https://github.com/ansvar-systems/uk-livestock-mcp/actions/workflows/ghcr-build.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

UK livestock welfare, feed, health, housing, movement rules, and breeding guidance via the [Model Context Protocol](https://modelcontextprotocol.io). Query DEFRA welfare codes, APHA movement standstills, stocking densities, and breeding calendars -- all from your AI assistant.

Part of [Ansvar Open Agriculture](https://ansvar.eu/open-agriculture).

## Why This Exists

Farmers and livestock advisors need quick access to welfare codes, movement standstill periods, feed tables, and breeding calendars. This information is published by DEFRA, APHA, and AHDB but is spread across PDFs, web pages, and statutory instruments that AI assistants cannot query directly. This MCP server makes it all searchable.

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "uk-livestock": {
      "command": "npx",
      "args": ["-y", "@ansvar/uk-livestock-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add uk-livestock npx @ansvar/uk-livestock-mcp
```

### Streamable HTTP (remote)

```
https://mcp.ansvar.eu/uk-livestock/mcp
```

### Docker (self-hosted)

```bash
docker run -p 3000:3000 ghcr.io/ansvar-systems/uk-livestock-mcp:latest
```

### npm (stdio)

```bash
npx @ansvar/uk-livestock-mcp
```

## Example Queries

Ask your AI assistant:

- "What is the standstill period for sheep movements?"
- "What are the welfare standards for indoor pigs?"
- "What feed does a finishing pig need per day?"
- "What are the housing requirements for cattle?"
- "Is foot-and-mouth disease notifiable?"
- "What is the gestation period for sheep?"

## Stats

| Metric | Value |
|--------|-------|
| Tools | 11 (3 meta + 8 domain) |
| Species | Sheep, Cattle, Pigs |
| Jurisdiction | GB |
| Data sources | AHDB Livestock, DEFRA Welfare Codes, APHA Movement Rules, DEFRA Notifiable Diseases |
| License (data) | Open Government Licence v3 |
| License (code) | Apache-2.0 |
| Transport | stdio + Streamable HTTP |

## Tools

| Tool | Description |
|------|-------------|
| `about` | Server metadata and links |
| `list_sources` | Data sources with freshness info |
| `check_data_freshness` | Staleness status and refresh command |
| `search_livestock_guidance` | FTS5 search across all livestock guidance |
| `get_welfare_standards` | Welfare standards with legal minimum and best practice |
| `get_stocking_density` | Space requirements by species and housing |
| `get_feed_requirements` | Nutrition requirements by species and stage |
| `search_animal_health` | Disease and condition search with notifiable flagging |
| `get_housing_requirements` | Space, ventilation, flooring, temperature, lighting |
| `get_movement_rules` | Standstill periods, exceptions, APHA regulation refs |
| `get_breeding_guidance` | Gestation periods, breeding calendars |

See [TOOLS.md](TOOLS.md) for full parameter documentation.

## Security Scanning

This repository runs 6 security checks on every push:

- **CodeQL** -- static analysis for JavaScript/TypeScript
- **Gitleaks** -- secret detection across full history
- **Dependency review** -- via Dependabot
- **Container scanning** -- via GHCR build pipeline

See [SECURITY.md](SECURITY.md) for reporting policy.

## Disclaimer

This tool provides reference data for informational purposes only. Welfare codes and movement rules are summaries -- always check DEFRA welfare codes and APHA guidance for the full requirements. See [DISCLAIMER.md](DISCLAIMER.md).

## Contributing

Issues and pull requests welcome. For security vulnerabilities, email security@ansvar.eu (do not open a public issue).

## License

Apache-2.0. Data sourced under Open Government Licence v3.
