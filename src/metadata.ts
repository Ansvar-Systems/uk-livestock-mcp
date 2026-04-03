export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'This data is provided for informational purposes only. It does not constitute professional ' +
  'veterinary or livestock management advice. Always consult a qualified veterinarian or livestock ' +
  'advisor before making animal welfare, health, or management decisions. Data sourced from AHDB ' +
  'Livestock Guidance, DEFRA Welfare Codes of Practice, and APHA Movement Rules under Open ' +
  'Government Licence.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://ahdb.org.uk/knowledge-library',
    copyright: 'Data: Crown Copyright, AHDB, and DEFRA. Server: Apache-2.0 Ansvar Systems.',
    server: 'livestock-mcp',
    version: '0.1.0',
    ...overrides,
  };
}
