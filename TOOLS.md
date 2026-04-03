# Tools Reference

## Meta Tools

### `about`

Get server metadata: name, version, coverage, data sources, and links.

**Parameters:** None

**Returns:** Server name, version, jurisdiction list, data source names, tool count, homepage/repository links.

---

### `list_sources`

List all data sources with authority, URL, license, and freshness info.

**Parameters:** None

**Returns:** Array of data sources, each with `name`, `authority`, `official_url`, `retrieval_method`, `update_frequency`, `license`, `coverage`, `last_retrieved`.

---

### `check_data_freshness`

Check when data was last ingested, staleness status, and how to trigger a refresh.

**Parameters:** None

**Returns:** `status` (fresh/stale/unknown), `last_ingest`, `days_since_ingest`, `staleness_threshold_days`, `refresh_command`.

---

## Domain Tools

### `search_livestock_guidance`

Search livestock welfare, feed, health, housing, and breeding guidance. Use for broad queries about livestock management.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query |
| `species` | string | No | Filter by species (e.g. sheep, cattle, pigs) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |
| `limit` | number | No | Max results (default: 20, max: 50) |

**Example:** `{ "query": "welfare shelter sheep" }`

---

### `get_welfare_standards`

Get welfare standards for a species. Returns both legal minimum requirements and best practice recommendations from DEFRA welfare codes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `species` | string | Yes | Species ID or name (e.g. sheep, cattle, pigs) |
| `production_system` | string | No | Filter by production system (e.g. indoor, outdoor, free-range) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |

**Returns:** Array of standards, each with `category`, `production_system`, `standard`, `legal_minimum`, `best_practice`, `regulation_ref`, `source`.

**Example:** `{ "species": "sheep", "production_system": "outdoor" }`

---

### `get_stocking_density`

Get stocking density requirements for a species by age class and housing type.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `species` | string | Yes | Species ID or name (e.g. sheep, cattle, pigs) |
| `age_class` | string | No | Age class (e.g. adult, lamb, calf, piglet) |
| `housing_type` | string | No | Housing type (e.g. indoor, outdoor) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |

**Returns:** Array of densities with `density_value`, `density_unit`, `legal_minimum`, `recommended`.

---

### `get_feed_requirements`

Get feed and nutrition requirements for a species by age class and production stage.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `species` | string | Yes | Species ID or name (e.g. sheep, cattle, pigs) |
| `age_class` | string | No | Age class (e.g. adult, lamb, calf, grower) |
| `production_stage` | string | No | Production stage (e.g. maintenance, lactation, finishing) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |

**Returns:** Energy (MJ/day), protein (g/day), dry matter (kg), minerals, example ration.

---

### `search_animal_health`

Search animal health conditions, diseases, symptoms, and treatments. Notifiable diseases are flagged.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search term (condition name, symptom, or cause) |
| `species` | string | No | Filter by species (e.g. sheep, cattle, pigs) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |

**Returns:** Array of conditions with `condition`, `symptoms`, `causes`, `treatment`, `prevention`, `notifiable` (boolean).

---

### `get_housing_requirements`

Get housing requirements for a species: space per head, ventilation, flooring, temperature, lighting.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `species` | string | Yes | Species ID or name (e.g. sheep, cattle, pigs) |
| `age_class` | string | No | Age class (e.g. adult, lamb, calf) |
| `system` | string | No | Housing system (e.g. indoor, outdoor) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |

**Returns:** Space per head (m2), ventilation, flooring, temperature range, lighting requirements.

---

### `get_movement_rules`

Get livestock movement rules including standstill periods, exceptions, and APHA regulation references. Critical for disease control compliance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `species` | string | Yes | Species ID or name (e.g. sheep, cattle, pigs) |
| `rule_type` | string | No | Filter by rule type (e.g. standstill, reporting, identification) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |

**Returns:** Array of rules with `rule_type`, `rule`, `standstill_days`, `exceptions`, `authority`, `regulation_ref`.

**Example:** `{ "species": "cattle" }`

---

### `get_breeding_guidance`

Get breeding guidance for a species: gestation periods, breeding calendars, and management advice.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `species` | string | Yes | Species ID or name (e.g. sheep, cattle, pigs) |
| `topic` | string | No | Filter by topic (e.g. gestation, mating, lambing) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: GB) |

**Returns:** Guidance text, calendar (JSON object with key dates), gestation days, source.

**Example:** `{ "species": "sheep", "topic": "lambing" }`
