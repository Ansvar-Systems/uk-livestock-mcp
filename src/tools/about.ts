import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Livestock MCP',
    description:
      'UK livestock welfare standards, feed requirements, animal health, housing, stocking densities, ' +
      'movement rules, and breeding guidance. Covers sheep, cattle, and pigs with data from AHDB, ' +
      'DEFRA welfare codes, and APHA regulations.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'AHDB Livestock Guidance',
      'DEFRA Welfare Codes of Practice',
      'APHA Movement Rules',
      'DEFRA Notifiable Diseases',
    ],
    tools_count: 11,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/ansvar-systems/livestock-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
