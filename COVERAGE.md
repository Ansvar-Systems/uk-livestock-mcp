# Coverage

## What Is Included

- **Welfare standards** from DEFRA Codes of Practice: legal minimums and best practice recommendations for sheep, cattle, and pigs
- **Stocking densities**: Space requirements by species, age class, and housing type
- **Feed requirements**: Energy, protein, dry matter, minerals by species and production stage
- **Animal health**: Common conditions, notifiable diseases, symptoms, treatments, prevention
- **Movement rules**: APHA standstill periods, reporting requirements, exemptions
- **Housing requirements**: Space, ventilation, flooring, temperature, lighting by species
- **Breeding guidance**: Gestation periods, breeding calendars, management advice

## Species

| Species | Welfare | Stocking | Feed | Health | Movement | Housing | Breeding |
|---------|---------|----------|------|--------|----------|---------|----------|
| Sheep | Yes | Yes | Yes | Yes | Yes (6-day standstill) | Yes | Yes (147d gestation) |
| Cattle | Yes | Yes | Yes | Yes | Yes (13-day standstill) | Yes | Yes (283d gestation) |
| Pigs | Yes | Yes | Yes | Yes | Yes (20-day standstill) | Yes | Yes (114d gestation) |

## Jurisdictions

| Code | Country | Status |
|------|---------|--------|
| GB | Great Britain | Supported |

## What Is NOT Included

- **Poultry** -- separate welfare codes, not yet ingested
- **Goats** -- share some sheep rules but have separate guidance
- **Horses** -- separate welfare code
- **Scotland-specific rules** -- Scottish equivalents may differ
- **Northern Ireland** -- NI follows separate DAERA guidance
- **Organic standards** -- Soil Association / OF&G organic rules are not included
- **Real-time disease alerts** -- This is reference data, not a live alert system
- **TB testing schedules** -- Individual herd testing intervals depend on area risk level

## Known Gaps

1. Movement rules may change during disease outbreaks -- always check APHA for current restrictions
2. Stocking densities for specialist breeds (e.g. rare breeds) may differ from standard guidance
3. Feed requirements are reference values -- actual needs vary by breed, condition, and climate

## Data Freshness

Run `check_data_freshness` to see when data was last updated. The ingestion pipeline runs on a schedule; manual triggers available via `gh workflow run ingest.yml`.
