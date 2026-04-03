import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'AHDB Livestock Guidance',
      authority: 'Agriculture and Horticulture Development Board',
      official_url: 'https://ahdb.org.uk/knowledge-library',
      retrieval_method: 'HTML_SCRAPE',
      update_frequency: 'quarterly',
      license: 'Open Government Licence v3',
      coverage: 'Welfare standards, feed requirements, stocking densities, breeding guidance for sheep, cattle, and pigs',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'DEFRA Welfare Codes of Practice',
      authority: 'Department for Environment, Food and Rural Affairs',
      official_url: 'https://www.gov.uk/government/collections/animal-welfare-codes-of-practice',
      retrieval_method: 'PDF_PARSE',
      update_frequency: 'as_amended',
      license: 'Open Government Licence v3',
      coverage: 'Statutory welfare codes for cattle, sheep, pigs -- legal minimum standards and best practice',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'APHA Movement Rules',
      authority: 'Animal and Plant Health Agency',
      official_url: 'https://www.gov.uk/guidance/cattle-movement-rules',
      retrieval_method: 'HTML_SCRAPE',
      update_frequency: 'as_amended',
      license: 'Open Government Licence v3',
      coverage: 'Standstill periods, movement reporting, exemptions for sheep, cattle, and pigs',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'DEFRA Notifiable Diseases',
      authority: 'Department for Environment, Food and Rural Affairs',
      official_url: 'https://www.gov.uk/government/collections/notifiable-diseases-in-animals',
      retrieval_method: 'HTML_SCRAPE',
      update_frequency: 'as_amended',
      license: 'Open Government Licence v3',
      coverage: 'Notifiable animal diseases, symptoms, reporting requirements',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta({ source_url: 'https://ahdb.org.uk/knowledge-library' }),
  };
}
