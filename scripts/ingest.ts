/**
 * Livestock MCP -- Data Ingestion Script
 *
 * Sources:
 * 1. DEFRA Welfare Codes of Practice (sheep, cattle, pigs, poultry)
 * 2. APHA Movement Rules (standstill periods, reporting)
 * 3. AHDB Livestock Guidance (feed, breeding, stocking densities)
 * 4. DEFRA Notifiable Diseases (animal health conditions)
 *
 * These are primarily PDF/HTML sources from GOV.UK. Reference data is manually
 * extracted from the official publications and encoded as structured data below.
 *
 * Usage: npm run ingest
 */

import { createDatabase, type Database } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

// ── Species ──────────────────────────────────────────────────────

const SPECIES = [
  {
    id: 'sheep',
    name: 'Sheep',
    common_breeds: ['Suffolk', 'Texel', 'Cheviot', 'Romney', 'Scottish Blackface', 'Mule', 'Lleyn'],
  },
  {
    id: 'cattle',
    name: 'Cattle',
    common_breeds: ['Aberdeen Angus', 'Hereford', 'Charolais', 'Limousin', 'Simmental', 'Holstein Friesian', 'Jersey'],
  },
  {
    id: 'pigs',
    name: 'Pigs',
    common_breeds: ['Large White', 'Landrace', 'Duroc', 'Hampshire', 'Saddleback', 'Berkshire', 'Tamworth'],
  },
  {
    id: 'poultry',
    name: 'Poultry',
    common_breeds: ['Ross 308', 'Cobb 500', 'ISA Brown', 'Lohmann Brown', 'Light Sussex'],
  },
];

// ── Welfare Standards ────────────────────────────────────────────
// Extracted from DEFRA Welfare Codes of Practice

interface WelfareStandard {
  species_id: string;
  production_system: string;
  category: string;
  standard: string;
  legal_minimum: string;
  best_practice: string;
  regulation_ref: string;
  source: string;
}

const WELFARE_STANDARDS: WelfareStandard[] = [
  // Sheep
  {
    species_id: 'sheep', production_system: 'indoor', category: 'space',
    standard: 'Floor space allowance per ewe',
    legal_minimum: '1.0 m2/ewe (hill), 1.2 m2/ewe (lowland)',
    best_practice: '1.4 m2/ewe with deep litter bedding',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  {
    species_id: 'sheep', production_system: 'all', category: 'inspection',
    standard: 'Regular inspection of flock',
    legal_minimum: 'Daily in intensive systems',
    best_practice: 'Twice daily during lambing',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  {
    species_id: 'sheep', production_system: 'all', category: 'feed_access',
    standard: 'Provision of adequate feed',
    legal_minimum: 'Access to feed daily',
    best_practice: 'Ad lib roughage plus concentrate feeding based on body condition score',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  {
    species_id: 'sheep', production_system: 'all', category: 'water',
    standard: 'Access to clean drinking water',
    legal_minimum: 'Fresh water available daily',
    best_practice: 'Continuous access, particularly during lactation',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  {
    species_id: 'sheep', production_system: 'all', category: 'condition_scoring',
    standard: 'Body condition scoring to prevent welfare issues',
    legal_minimum: 'Not below 2.0 (lowland) or 1.5 (hill)',
    best_practice: 'Regular scoring, target 3.0-3.5 at mating',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  {
    species_id: 'sheep', production_system: 'outdoor', category: 'shelter',
    standard: 'Provision of shelter from adverse weather',
    legal_minimum: 'Access to shelter in severe weather',
    best_practice: 'Permanent shelter available year-round',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },

  // Cattle
  {
    species_id: 'cattle', production_system: 'indoor', category: 'space',
    standard: 'Space allowance per head based on liveweight',
    legal_minimum: 'Based on weight -- 2.5 m2 for 200kg',
    best_practice: '3.0 m2 for 200kg with good ventilation',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },
  {
    species_id: 'cattle', production_system: 'indoor', category: 'feed_trough',
    standard: 'Feed trough space per head',
    legal_minimum: '450mm/head',
    best_practice: '600mm/head',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },
  {
    species_id: 'cattle', production_system: 'all', category: 'water',
    standard: 'Access to clean drinking water',
    legal_minimum: 'Adequate supply of fresh water each day',
    best_practice: 'Ad-lib access to clean water at all times with multiple drinker points, 10% of body weight per day capacity',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },
  {
    species_id: 'cattle', production_system: 'indoor', category: 'housing',
    standard: 'Adequate lying area and ventilation',
    legal_minimum: 'Sufficient space to lie down and rest without difficulty',
    best_practice: 'Cubicle size matched to cow size with deep-bedded comfort',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },
  {
    species_id: 'cattle', production_system: 'all', category: 'inspection',
    standard: 'Regular inspection of cattle',
    legal_minimum: 'Daily inspection of all housed cattle',
    best_practice: 'Twice daily inspection with locomotion scoring monthly',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },

  // Pigs
  {
    species_id: 'pigs', production_system: 'indoor', category: 'space',
    standard: 'Floor space allowance per pig',
    legal_minimum: '0.65 m2/pig (up to 110kg)',
    best_practice: '0.80 m2/pig minimum',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },
  {
    species_id: 'pigs', production_system: 'indoor', category: 'enrichment',
    standard: 'Environmental enrichment materials',
    legal_minimum: 'Permanent access to manipulable material',
    best_practice: 'Straw preferred plus additional rootable substrates rotated regularly',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },
  {
    species_id: 'pigs', production_system: 'all', category: 'tail_docking',
    standard: 'Restrictions on tail docking',
    legal_minimum: 'Only by veterinary surgeon, not routine',
    best_practice: 'No tail docking -- manage environment to prevent biting',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },
  {
    species_id: 'pigs', production_system: 'all', category: 'water',
    standard: 'Access to clean drinking water',
    legal_minimum: 'Continuous access to fresh water',
    best_practice: 'Nipple drinkers checked twice daily, flow rate 1-1.5 litres/min for finishers',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },
  {
    species_id: 'pigs', production_system: 'all', category: 'inspection',
    standard: 'Regular inspection of pigs',
    legal_minimum: 'Daily inspection of all pigs',
    best_practice: 'Twice daily inspection with tail and ear scoring',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },

  // Poultry
  {
    species_id: 'poultry', production_system: 'indoor', category: 'stocking_density',
    standard: 'Stocking density limits for broilers',
    legal_minimum: '33-39 kg/m2 depending on welfare outcome data',
    best_practice: 'Max 30 kg/m2',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007 / Welfare of Meat Chickens',
    source: 'DEFRA Code of Practice for the Welfare of Meat Chickens',
  },
  {
    species_id: 'poultry', production_system: 'indoor', category: 'lighting',
    standard: 'Lighting regime for broiler welfare',
    legal_minimum: '8 hours continuous darkness per 24h',
    best_practice: '6-8 hours darkness with natural light spectrum',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Meat Chickens',
  },
  {
    species_id: 'poultry', production_system: 'all', category: 'water',
    standard: 'Access to clean drinking water',
    legal_minimum: 'Continuous access to clean water',
    best_practice: 'Nipple drinkers at bird height, cleaned daily, 1 per 10 birds',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Meat Chickens',
  },
  {
    species_id: 'poultry', production_system: 'all', category: 'inspection',
    standard: 'Regular inspection of flock',
    legal_minimum: 'Twice daily inspection of all birds',
    best_practice: 'Three times daily with litter quality checks',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Meat Chickens',
  },
  {
    species_id: 'poultry', production_system: 'indoor', category: 'litter',
    standard: 'Litter quality management',
    legal_minimum: 'All chickens must have permanent access to dry friable litter',
    best_practice: 'Wood shavings 5-10 cm depth, moisture below 35%, topped up as needed',
    regulation_ref: 'Welfare of Farmed Animals (England) Regulations 2007',
    source: 'DEFRA Code of Practice for the Welfare of Meat Chickens',
  },
];

// ── Stocking Densities ──────────────────────────────────────────

interface StockingDensity {
  species_id: string;
  age_class: string;
  housing_type: string;
  density_value: number;
  density_unit: string;
  legal_minimum: number;
  recommended: number;
  source: string;
}

const STOCKING_DENSITIES: StockingDensity[] = [
  // Sheep
  {
    species_id: 'sheep', age_class: 'adult', housing_type: 'indoor',
    density_value: 1.4, density_unit: 'm2_per_head',
    legal_minimum: 1.0, recommended: 1.4,
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  {
    species_id: 'sheep', age_class: 'adult', housing_type: 'pasture_lowland',
    density_value: 8.0, density_unit: 'head_per_ha',
    legal_minimum: 6.0, recommended: 10.0,
    source: 'AHDB Sheep BRP Manual',
  },
  {
    species_id: 'sheep', age_class: 'adult', housing_type: 'pasture_hill',
    density_value: 1.0, density_unit: 'head_per_ha',
    legal_minimum: 0.5, recommended: 2.0,
    source: 'AHDB Sheep BRP Manual',
  },
  // Cattle
  {
    species_id: 'cattle', age_class: 'adult', housing_type: 'indoor',
    density_value: 6.0, density_unit: 'm2_per_head',
    legal_minimum: 5.0, recommended: 6.0,
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },
  {
    species_id: 'cattle', age_class: 'adult', housing_type: 'pasture_beef',
    density_value: 2.5, density_unit: 'head_per_ha',
    legal_minimum: 2.0, recommended: 3.0,
    source: 'AHDB Beef & Dairy BRP',
  },
  {
    species_id: 'cattle', age_class: 'adult', housing_type: 'pasture_dairy',
    density_value: 2.0, density_unit: 'head_per_ha',
    legal_minimum: 1.5, recommended: 2.5,
    source: 'AHDB Beef & Dairy BRP',
  },
  // Pigs
  {
    species_id: 'pigs', age_class: 'adult', housing_type: 'indoor',
    density_value: 1.0, density_unit: 'm2_per_head',
    legal_minimum: 0.65, recommended: 1.0,
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },
  {
    species_id: 'pigs', age_class: 'adult', housing_type: 'outdoor_sows',
    density_value: 17.5, density_unit: 'head_per_ha',
    legal_minimum: 15.0, recommended: 20.0,
    source: 'AHDB Pork BRP',
  },
  // Poultry
  {
    species_id: 'poultry', age_class: 'broiler', housing_type: 'indoor',
    density_value: 33.0, density_unit: 'kg_per_m2',
    legal_minimum: 33.0, recommended: 30.0,
    source: 'DEFRA Code of Practice for the Welfare of Meat Chickens',
  },
  {
    species_id: 'poultry', age_class: 'layer', housing_type: 'free_range',
    density_value: 2500.0, density_unit: 'head_per_ha',
    legal_minimum: 2500.0, recommended: 1000.0,
    source: 'DEFRA Laying Hens Regulations',
  },
];

// ── Feed Requirements ───────────────────────────────────────────
// Extracted from AHDB BRP manuals

interface FeedRequirement {
  species_id: string;
  age_class: string;
  production_stage: string;
  energy_mj_per_day: number;
  protein_g_per_day: number;
  dry_matter_kg: number;
  minerals: Record<string, number>;
  example_ration: string;
  notes: string;
}

const FEED_REQUIREMENTS: FeedRequirement[] = [
  // Sheep
  {
    species_id: 'sheep', age_class: 'adult', production_stage: 'maintenance',
    energy_mj_per_day: 8.5, protein_g_per_day: 80, dry_matter_kg: 1.2,
    minerals: { calcium_g: 3, phosphorus_g: 2 },
    example_ration: 'Good quality hay ad-lib plus 0.25 kg concentrate',
    notes: 'Ewe at 70 kg liveweight',
  },
  {
    species_id: 'sheep', age_class: 'adult', production_stage: 'late_pregnancy',
    energy_mj_per_day: 12.0, protein_g_per_day: 150, dry_matter_kg: 1.5,
    minerals: { calcium_g: 5, phosphorus_g: 3.5, magnesium_g: 2 },
    example_ration: 'Silage ad-lib plus 0.5-0.75 kg concentrate, increasing in final 6 weeks',
    notes: '70 kg ewe carrying twins in last 6 weeks of pregnancy',
  },
  // Cattle
  {
    species_id: 'cattle', age_class: 'adult', production_stage: 'maintenance',
    energy_mj_per_day: 55.0, protein_g_per_day: 450, dry_matter_kg: 9.0,
    minerals: { calcium_g: 25, phosphorus_g: 18 },
    example_ration: 'Grass silage ad-lib',
    notes: 'Suckler cow at 600 kg liveweight',
  },
  {
    species_id: 'cattle', age_class: 'adult', production_stage: 'lactating',
    energy_mj_per_day: 110.0, protein_g_per_day: 1200, dry_matter_kg: 12.0,
    minerals: { calcium_g: 55, phosphorus_g: 35, magnesium_g: 12 },
    example_ration: 'Grass silage ad-lib plus 4-6 kg concentrate, mineral bolus',
    notes: '500 kg suckler cow lactating, peak milk yield period',
  },
  // Pigs
  {
    species_id: 'pigs', age_class: 'grower', production_stage: 'finishing',
    energy_mj_per_day: 32.0, protein_g_per_day: 350, dry_matter_kg: 2.5,
    minerals: { calcium_g: 12, phosphorus_g: 8, lysine_g: 15 },
    example_ration: 'Compound finisher feed at 2.5 kg/day',
    notes: 'Finishing pig 60-110 kg liveweight',
  },
  {
    species_id: 'pigs', age_class: 'adult', production_stage: 'finishing',
    energy_mj_per_day: 30.0, protein_g_per_day: 550, dry_matter_kg: 2.5,
    minerals: { calcium_g: 14, phosphorus_g: 10, lysine_g: 18 },
    example_ration: 'Compound finisher feed at 2.5 kg/day with amino acid balance',
    notes: 'Finishing pig 60-110 kg, higher protein for lean growth',
  },
  // Poultry
  {
    species_id: 'poultry', age_class: 'layer', production_stage: 'laying',
    energy_mj_per_day: 1.2, protein_g_per_day: 18, dry_matter_kg: 0.12,
    minerals: { calcium_g: 4.0, phosphorus_g: 0.35 },
    example_ration: 'Layer mash or pellet 110-120 g/bird/day with oyster shell grit',
    notes: 'Laying hen in peak production',
  },
  {
    species_id: 'poultry', age_class: 'broiler', production_stage: 'grower',
    energy_mj_per_day: 1.5, protein_g_per_day: 22, dry_matter_kg: 0.15,
    minerals: { calcium_g: 1.0, phosphorus_g: 0.45 },
    example_ration: 'Grower pellet ad-lib, 20-23% crude protein',
    notes: 'Broiler 14-28 days, rapid growth phase',
  },
];

// ── Animal Health ───────────────────────────────────────────────
// From DEFRA Notifiable Diseases + AHDB guidance

interface AnimalHealthCondition {
  id: string;
  species_id: string;
  condition: string;
  symptoms: string;
  causes: string;
  treatment: string;
  prevention: string;
  notifiable: number;
  source: string;
}

const ANIMAL_HEALTH: AnimalHealthCondition[] = [
  // Sheep
  {
    id: 'footrot-sheep', species_id: 'sheep', condition: 'Footrot',
    symptoms: 'Lameness, foul smell from feet, separation of horn from sole, swelling between toes',
    causes: 'Dichelobacter nodosus bacterium, thrives in warm wet conditions',
    treatment: 'Foot trimming, antibiotic spray, systemic antibiotics in severe cases. Isolate affected animals.',
    prevention: 'Regular foot inspection, foot bathing, culling persistently lame animals, dry standing areas',
    notifiable: 0, source: 'AHDB Sheep BRP Manual',
  },
  {
    id: 'scrapie-sheep', species_id: 'sheep', condition: 'Scrapie',
    symptoms: 'Itching, wool loss, weight loss, behavioural changes, incoordination, trembling',
    causes: 'Prion disease (transmissible spongiform encephalopathy)',
    treatment: 'No treatment available -- notify APHA immediately. Affected animals culled under government direction.',
    prevention: 'Breed for ARR/ARR genotype (resistant), membership of Scrapie Monitored Flock Scheme, avoid buying from affected flocks',
    notifiable: 1, source: 'DEFRA / APHA Notifiable Disease Guidance',
  },
  {
    id: 'orf-sheep', species_id: 'sheep', condition: 'Orf (contagious ecthyma)',
    symptoms: 'Scabby lesions around mouth, nostrils, teats; difficulty feeding in lambs',
    causes: 'Parapoxvirus, highly contagious, survives in environment for months',
    treatment: 'Supportive care, soft food for lambs, topical antiseptic on secondary infections',
    prevention: 'Vaccination of ewes pre-lambing where endemic, quarantine new stock, PPE handling',
    notifiable: 0, source: 'AHDB Sheep BRP Manual',
  },
  {
    id: 'twin-lamb-disease', species_id: 'sheep', condition: 'Twin Lamb Disease (pregnancy toxaemia)',
    symptoms: 'Lethargy, separation from flock, staggering, teeth grinding, sweet-smelling breath, blindness',
    causes: 'Negative energy balance in late pregnancy, usually ewes carrying multiples on inadequate nutrition',
    treatment: 'Oral propylene glycol, IV glucose, corticosteroids. Early intervention critical. Consider caesarean if near term.',
    prevention: 'Body condition scoring at tupping and mid-pregnancy, adequate nutrition in final 6 weeks, avoid sudden diet changes',
    notifiable: 0, source: 'AHDB Sheep BRP Manual',
  },

  // Cattle
  {
    id: 'bvd-cattle', species_id: 'cattle', condition: 'Bovine Viral Diarrhoea (BVD)',
    symptoms: 'Diarrhoea, nasal discharge, reduced milk yield, poor fertility, immunosuppression, birth defects in calves',
    causes: 'BVD virus (Pestivirus). Persistently infected (PI) animals are main reservoir.',
    treatment: 'No specific treatment. Supportive care for clinical cases. Identify and remove PI animals.',
    prevention: 'Test and cull PI animals, vaccination programme, biosecurity at boundaries, test purchased stock',
    notifiable: 0, source: 'AHDB Beef & Dairy BRP',
  },
  {
    id: 'tb-cattle', species_id: 'cattle', condition: 'Bovine Tuberculosis (bTB)',
    symptoms: 'Often subclinical in early stages. Chronic cough, weight loss, enlarged lymph nodes in advanced cases.',
    causes: 'Mycobacterium bovis. Transmitted cattle-to-cattle and from wildlife (badgers).',
    treatment: 'No treatment -- notify APHA immediately. Reactor animals slaughtered under government direction.',
    prevention: 'Annual or more frequent TB testing (SICCT), pre-movement testing in HRA/edge areas, biosecurity, cattle vaccination trials ongoing',
    notifiable: 1, source: 'DEFRA / APHA Notifiable Disease Guidance',
  },
  {
    id: 'mastitis-cattle', species_id: 'cattle', condition: 'Mastitis',
    symptoms: 'Swollen udder quarter, clots in milk, pain on touch, fever, reduced yield, off-colour milk',
    causes: 'Bacterial infection (Staph aureus, Strep uberis, E. coli). Environmental or contagious routes.',
    treatment: 'Intramammary antibiotics (tube), systemic antibiotics and NSAIDs for severe cases. Culture and sensitivity testing recommended.',
    prevention: 'Teat dipping post-milking, dry cow therapy, clean bedding, milking machine maintenance, cell count monitoring',
    notifiable: 0, source: 'AHDB Dairy BRP',
  },
  {
    id: 'lameness-cattle', species_id: 'cattle', condition: 'Lameness (digital dermatitis, sole ulcer)',
    symptoms: 'Altered gait, reluctance to bear weight, arched back when walking, reduced feed intake and yield',
    causes: 'Digital dermatitis (Treponema bacteria), sole ulcers from poor foot conformation or hard surfaces, white line disease',
    treatment: 'Foot trimming by trained operator, topical antibiotics for digital dermatitis, pain relief (NSAIDs), foot blocks',
    prevention: 'Regular foot trimming schedule, clean dry passageways, rubber matting, foot bathing, mobility scoring',
    notifiable: 0, source: 'AHDB Dairy BRP',
  },

  // Pigs
  {
    id: 'prrs-pigs', species_id: 'pigs', condition: 'Porcine Reproductive and Respiratory Syndrome (PRRS)',
    symptoms: 'Reproductive failure in sows, respiratory distress in growing pigs, blue ears (cyanosis), poor growth rates',
    causes: 'PRRS virus (Arterivirus). Spread by aerosol, semen, and fomites.',
    treatment: 'No specific treatment. Supportive care and secondary infection management with antibiotics.',
    prevention: 'Vaccination, all-in-all-out management, air filtration in high-density areas, closed herd policy, gilt acclimatisation',
    notifiable: 0, source: 'AHDB Pork BRP',
  },
  {
    id: 'asf-pigs', species_id: 'pigs', condition: 'African Swine Fever (ASF)',
    symptoms: 'High fever, haemorrhages in skin and organs, vomiting, bloody diarrhoea, sudden death. Up to 100% mortality.',
    causes: 'African Swine Fever virus (Asfivirus). Spread by direct contact, ticks, contaminated feed/fomites.',
    treatment: 'No treatment or vaccine available -- notify APHA immediately. Culling and movement restrictions applied.',
    prevention: 'Strict biosecurity, swill feeding ban (already in force in UK), border controls, awareness of signs, avoid contact with wild boar',
    notifiable: 1, source: 'DEFRA / APHA Notifiable Disease Guidance',
  },
  {
    id: 'tail-biting-pigs', species_id: 'pigs', condition: 'Tail Biting',
    symptoms: 'Chewed or shortened tails, blood on pen walls, infection at bite site, reduced feed intake in bitten pigs',
    causes: 'Multifactorial: insufficient enrichment, overstocking, poor ventilation, feed competition, mixing of unfamiliar groups',
    treatment: 'Remove bitten pig to hospital pen, treat wounds with antiseptic and antibiotics if infected, identify and address triggers',
    prevention: 'Adequate enrichment materials (straw, rope, wood), correct stocking density, stable groups, good ventilation and temperature control',
    notifiable: 0, source: 'AHDB Pork BRP',
  },

  // Poultry
  {
    id: 'ai-poultry', species_id: 'poultry', condition: 'Avian Influenza (bird flu)',
    symptoms: 'Sudden high mortality, swollen head, purple discolouration of comb and wattles, drop in egg production, respiratory distress, diarrhoea',
    causes: 'Influenza A virus (H5N1, H5N8 and other subtypes). Spread by wild birds, direct contact, contaminated equipment.',
    treatment: 'No treatment -- notify APHA immediately. Affected flock culled. Protection and surveillance zones established.',
    prevention: 'Housing orders during outbreaks, biosecurity measures, netting over outdoor areas, disinfectant foot dips, no contact with wild birds',
    notifiable: 1, source: 'DEFRA / APHA Notifiable Disease Guidance',
  },
  {
    id: 'coccidiosis-poultry', species_id: 'poultry', condition: 'Coccidiosis',
    symptoms: 'Bloody droppings, lethargy, huddling, reduced feed intake, poor growth, dehydration, high mortality in young birds',
    causes: 'Eimeria species (protozoan parasites). Oocysts persist in litter and soil.',
    treatment: 'Anticoccidial drugs in feed or water (e.g., toltrazuril). Severe outbreaks may need veterinary prescription.',
    prevention: 'Coccidiostats in feed from day one, vaccination programmes, good litter management, avoid wet litter',
    notifiable: 0, source: 'AHDB Poultry BRP',
  },
  {
    id: 'red-mite-poultry', species_id: 'poultry', condition: 'Red Mite (Dermanyssus gallinae)',
    symptoms: 'Anaemia, pale combs, restlessness at night, reduced egg production, blood spots on eggs, skin irritation',
    causes: 'Dermanyssus gallinae ectoparasite. Hides in cracks during day, feeds on birds at night. Multiplies rapidly in warm weather.',
    treatment: 'Acaricide treatments (licensed products), silica-based dusts, heat treatment of empty houses between flocks',
    prevention: 'Regular monitoring with mite traps, thorough cleaning between flocks, sealing cracks in housing, biosecurity between sheds',
    notifiable: 0, source: 'AHDB Poultry BRP',
  },
];

// ── Movement Rules ──────────────────────────────────────────────
// From GOV.UK guidance and APHA regulations

interface MovementRule {
  species_id: string;
  rule_type: string;
  rule: string;
  standstill_days: number;
  exceptions: string;
  authority: string;
  regulation_ref: string;
}

const MOVEMENT_RULES: MovementRule[] = [
  {
    species_id: 'sheep', rule_type: 'standstill',
    rule: 'After moving sheep onto a holding, a 6-day standstill applies to all sheep and goats on that holding.',
    standstill_days: 6,
    exceptions: 'Licensed markets, shows with pre-movement testing, veterinary emergencies',
    authority: 'APHA',
    regulation_ref: 'Sheep and Goats (Records, Identification and Movement) (England) Order 2009',
  },
  {
    species_id: 'sheep', rule_type: 'identification',
    rule: 'Sheep must be identified with an EID tag and a conventional tag before leaving the holding of birth.',
    standstill_days: 0,
    exceptions: 'Movements direct to slaughter before 12 months may use a single tag',
    authority: 'APHA',
    regulation_ref: 'Sheep and Goats (Records, Identification and Movement) (England) Order 2009',
  },
  {
    species_id: 'cattle', rule_type: 'standstill',
    rule: 'After moving cattle onto a holding, a 13-day standstill applies to all cattle on that holding. TB-restricted holdings may have additional restrictions.',
    standstill_days: 13,
    exceptions: 'Licensed markets, veterinary emergencies, slaughter within 13 days',
    authority: 'APHA',
    regulation_ref: 'Cattle Identification Regulations 2007 / Disease Control (England) Order 2003',
  },
  {
    species_id: 'cattle', rule_type: 'identification',
    rule: 'Cattle must be double ear-tagged and have a cattle passport. All movements reported to BCMS within 3 days.',
    standstill_days: 0,
    exceptions: 'None -- all cattle movements must be reported',
    authority: 'APHA',
    regulation_ref: 'Cattle Identification Regulations 2007',
  },
  {
    species_id: 'pigs', rule_type: 'standstill',
    rule: 'After moving pigs onto a holding, a 20-day standstill applies to all pigs on that holding.',
    standstill_days: 20,
    exceptions: 'Licensed markets, direct movement to slaughter',
    authority: 'APHA',
    regulation_ref: 'Pigs (Records, Identification and Movement) (England) Order 2011',
  },
  {
    species_id: 'pigs', rule_type: 'identification',
    rule: 'Pigs must be identified with ear tag or slap mark showing herd mark before leaving the holding.',
    standstill_days: 0,
    exceptions: 'Temporary marks acceptable for shows with return to same holding',
    authority: 'APHA',
    regulation_ref: 'Pigs (Records, Identification and Movement) (England) Order 2011',
  },
  {
    species_id: 'poultry', rule_type: 'standstill',
    rule: 'No standstill period applies to poultry. However, registration is required if 50 or more birds are kept, and APHA notification is required for certain movements.',
    standstill_days: 0,
    exceptions: 'Exempt from standstill rules',
    authority: 'APHA',
    regulation_ref: 'Registration of Establishments Keeping Poultry (England) Regulations 2010',
  },
  {
    species_id: 'poultry', rule_type: 'registration',
    rule: 'Any premises keeping 50 or more birds must be registered with APHA. Keepers of fewer than 50 birds are encouraged to register voluntarily.',
    standstill_days: 0,
    exceptions: 'Birds kept as pets in small numbers',
    authority: 'APHA',
    regulation_ref: 'Registration of Establishments Keeping Poultry (England) Regulations 2010',
  },
];

// ── Housing Requirements ────────────────────────────────────────

interface HousingRequirement {
  species_id: string;
  age_class: string;
  system: string;
  space_per_head_m2: number;
  ventilation: string;
  flooring: string;
  temperature_range: string;
  lighting: string;
  source: string;
}

const HOUSING_REQUIREMENTS: HousingRequirement[] = [
  // Sheep
  {
    species_id: 'sheep', age_class: 'adult', system: 'indoor',
    space_per_head_m2: 1.4,
    ventilation: 'Natural ventilation with ridge outlet, minimum 4 air changes per hour',
    flooring: 'Straw bedding on solid floor, non-slip surface',
    temperature_range: '5-20C',
    lighting: '40-60 lux, natural daylight minimum',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  {
    species_id: 'sheep', age_class: 'lamb', system: 'indoor',
    space_per_head_m2: 0.5,
    ventilation: 'Draught-free with good air circulation above lamb height',
    flooring: 'Deep straw bedding, dry and clean',
    temperature_range: '10-20C',
    lighting: 'Natural daylight minimum',
    source: 'DEFRA Code of Practice for the Welfare of Sheep',
  },
  // Cattle
  {
    species_id: 'cattle', age_class: 'adult', system: 'cubicle_housing',
    space_per_head_m2: 4.0,
    ventilation: '0.1-0.3 m/s air speed, natural ventilation with 0.04 m2 outlet per cow',
    flooring: 'Rubber matting on concrete, cubicles with mattress or deep sand bedding',
    temperature_range: '5-25C',
    lighting: '200 lux at feed face, 16 hours light for dairy cows',
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },
  {
    species_id: 'cattle', age_class: 'adult', system: 'indoor',
    space_per_head_m2: 6.0,
    ventilation: 'Natural ventilation with 0.04 m2 outlet per cow',
    flooring: 'Cubicles with mattress or deep sand bedding',
    temperature_range: '5-25C',
    lighting: 'Natural daylight minimum 8 hours',
    source: 'DEFRA Code of Practice for the Welfare of Cattle',
  },
  // Pigs
  {
    species_id: 'pigs', age_class: 'adult', system: 'indoor',
    space_per_head_m2: 1.0,
    ventilation: 'Mechanical or natural, max 0.2 m/s air speed at pig level',
    flooring: 'Part slatted with solid lying area',
    temperature_range: '15-25C',
    lighting: 'Minimum 40 lux for 8 hours daily',
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },
  {
    species_id: 'pigs', age_class: 'finishing', system: 'indoor',
    space_per_head_m2: 0.8,
    ventilation: 'Mechanical ventilation, 0.1-0.2 m/s air speed, max 25C',
    flooring: 'Partially slatted floors with solid lying area',
    temperature_range: '15-25C',
    lighting: '40 lux minimum for 8 hours',
    source: 'DEFRA Code of Practice for the Welfare of Pigs',
  },
  // Poultry
  {
    species_id: 'poultry', age_class: 'broiler', system: 'indoor',
    space_per_head_m2: 0.047,
    ventilation: 'Mechanical ventilation maintaining 20C target, ammonia below 20 ppm',
    flooring: 'Litter floor (wood shavings 5-10 cm), maintained below 35% moisture',
    temperature_range: '18-22C',
    lighting: '20 lux minimum during light period, 8 hours continuous darkness',
    source: 'DEFRA Code of Practice for the Welfare of Meat Chickens',
  },
  {
    species_id: 'poultry', age_class: 'layer', system: 'free_range',
    space_per_head_m2: 0.11,
    ventilation: 'Natural and mechanical combined, ammonia below 20 ppm',
    flooring: 'Litter and slatted areas with outdoor access',
    temperature_range: '16-24C',
    lighting: '20 lux, access to natural daylight via pop-holes',
    source: 'DEFRA Laying Hens Regulations',
  },
];

// ── Breeding Guidance ───────────────────────────────────────────

interface BreedingGuidanceEntry {
  species_id: string;
  topic: string;
  guidance: string;
  calendar: Record<string, string>;
  gestation_days: number;
  source: string;
}

const BREEDING_GUIDANCE: BreedingGuidanceEntry[] = [
  {
    species_id: 'sheep', topic: 'lambing',
    guidance: 'Ewes typically lamb 147 days after mating. Scan at 80-90 days to determine litter size. Increase feed in last 6 weeks of pregnancy. Breeding season is September to November with lambing January to April.',
    calendar: { mating: 'Sep-Nov', scanning: 'Jan', lambing: 'Jan-Apr', weaning: 'Jul-Aug' },
    gestation_days: 147,
    source: 'AHDB Sheep BRP Manual',
  },
  {
    species_id: 'cattle', topic: 'calving',
    guidance: 'Cattle have a gestation of approximately 283 days. Monitor body condition score at drying off (target BCS 3.0). Transition diet 3 weeks before calving. Dairy herds breed year-round; beef herds typically May to July for spring calving.',
    calendar: { mating: 'May-Jul (beef) or year-round (dairy)', pregnancy_check: 'Sep-Nov', dry_period: 'Mar-Apr', calving: 'Mar-May' },
    gestation_days: 283,
    source: 'AHDB Beef & Dairy BRP',
  },
  {
    species_id: 'pigs', topic: 'farrowing',
    guidance: 'Sow gestation is approximately 114 days (3 months, 3 weeks, 3 days). Move to farrowing accommodation 5-7 days before due date. Target 2.3-2.5 litters per sow per year. Breeding is year-round.',
    calendar: { service: 'continuous', gestation_check: '28_days_post_service', farrowing: '114_days_post_service', weaning: '21-28_days_post_farrowing' },
    gestation_days: 114,
    source: 'AHDB Pork BRP',
  },
  {
    species_id: 'poultry', topic: 'hatching',
    guidance: 'Chicken incubation period is 21 days. Breeding is year-round for commercial flocks. Egg fertility is best within first 7 days of lay. Incubator temperature 37.5C with 55-60% humidity, increasing to 65% in final 3 days.',
    calendar: { egg_collection: 'continuous', incubation_start: 'within_7_days_of_lay', hatch: '21_days_post_set', brooding: '0-21_days_post_hatch' },
    gestation_days: 21,
    source: 'AHDB Poultry BRP',
  },
];

// ── Ingestion Logic ─────────────────────────────────────────────

function ingest(db: Database): void {
  const now = new Date().toISOString().split('T')[0];
  console.log(`Livestock MCP ingestion started at ${now}`);
  console.log('Sources: DEFRA Welfare Codes, APHA Movement Rules, AHDB Guidance, DEFRA Notifiable Diseases\n');

  // Clear existing data
  console.log('Clearing existing data...');
  for (const table of [
    'search_index', 'breeding_guidance', 'housing_requirements', 'movement_rules',
    'animal_health', 'feed_requirements', 'stocking_densities', 'welfare_standards', 'species',
  ]) {
    db.run(`DELETE FROM ${table}`);
  }

  // Insert species
  console.log('Inserting species...');
  for (const s of SPECIES) {
    db.run(
      'INSERT INTO species (id, name, common_breeds) VALUES (?, ?, ?)',
      [s.id, s.name, JSON.stringify(s.common_breeds)]
    );
  }
  console.log(`  ${SPECIES.length} species inserted.`);

  // Insert welfare standards
  console.log('Inserting welfare standards...');
  for (const w of WELFARE_STANDARDS) {
    db.run(
      `INSERT INTO welfare_standards (species_id, production_system, category, standard, legal_minimum, best_practice, regulation_ref, source, jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.species_id, w.production_system, w.category, w.standard, w.legal_minimum, w.best_practice, w.regulation_ref, w.source, 'GB']
    );
  }
  console.log(`  ${WELFARE_STANDARDS.length} welfare standards inserted.`);

  // Insert stocking densities
  console.log('Inserting stocking densities...');
  for (const sd of STOCKING_DENSITIES) {
    db.run(
      `INSERT INTO stocking_densities (species_id, age_class, housing_type, density_value, density_unit, legal_minimum, recommended, source, jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sd.species_id, sd.age_class, sd.housing_type, sd.density_value, sd.density_unit, sd.legal_minimum, sd.recommended, sd.source, 'GB']
    );
  }
  console.log(`  ${STOCKING_DENSITIES.length} stocking densities inserted.`);

  // Insert feed requirements
  console.log('Inserting feed requirements...');
  for (const fr of FEED_REQUIREMENTS) {
    db.run(
      `INSERT INTO feed_requirements (species_id, age_class, production_stage, energy_mj_per_day, protein_g_per_day, dry_matter_kg, minerals, example_ration, notes, jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fr.species_id, fr.age_class, fr.production_stage, fr.energy_mj_per_day, fr.protein_g_per_day, fr.dry_matter_kg, JSON.stringify(fr.minerals), fr.example_ration, fr.notes, 'GB']
    );
  }
  console.log(`  ${FEED_REQUIREMENTS.length} feed requirements inserted.`);

  // Insert animal health conditions
  console.log('Inserting animal health conditions...');
  for (const ah of ANIMAL_HEALTH) {
    db.run(
      `INSERT INTO animal_health (id, species_id, condition, symptoms, causes, treatment, prevention, notifiable, source, jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ah.id, ah.species_id, ah.condition, ah.symptoms, ah.causes, ah.treatment, ah.prevention, ah.notifiable, ah.source, 'GB']
    );
  }
  console.log(`  ${ANIMAL_HEALTH.length} animal health conditions inserted.`);

  // Insert movement rules
  console.log('Inserting movement rules...');
  for (const mr of MOVEMENT_RULES) {
    db.run(
      `INSERT INTO movement_rules (species_id, rule_type, rule, standstill_days, exceptions, authority, regulation_ref, jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [mr.species_id, mr.rule_type, mr.rule, mr.standstill_days, mr.exceptions, mr.authority, mr.regulation_ref, 'GB']
    );
  }
  console.log(`  ${MOVEMENT_RULES.length} movement rules inserted.`);

  // Insert housing requirements
  console.log('Inserting housing requirements...');
  for (const hr of HOUSING_REQUIREMENTS) {
    db.run(
      `INSERT INTO housing_requirements (species_id, age_class, system, space_per_head_m2, ventilation, flooring, temperature_range, lighting, source, jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [hr.species_id, hr.age_class, hr.system, hr.space_per_head_m2, hr.ventilation, hr.flooring, hr.temperature_range, hr.lighting, hr.source, 'GB']
    );
  }
  console.log(`  ${HOUSING_REQUIREMENTS.length} housing requirements inserted.`);

  // Insert breeding guidance
  console.log('Inserting breeding guidance...');
  for (const bg of BREEDING_GUIDANCE) {
    db.run(
      `INSERT INTO breeding_guidance (species_id, topic, guidance, calendar, gestation_days, source, jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bg.species_id, bg.topic, bg.guidance, JSON.stringify(bg.calendar), bg.gestation_days, bg.source, 'GB']
    );
  }
  console.log(`  ${BREEDING_GUIDANCE.length} breeding guidance entries inserted.`);

  // Build FTS5 search index
  console.log('Building FTS5 search index...');
  db.run('DELETE FROM search_index');

  // Index welfare standards
  for (const w of WELFARE_STANDARDS) {
    const species = SPECIES.find(s => s.id === w.species_id);
    db.run(
      'INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)',
      [
        `${species?.name ?? w.species_id} Welfare: ${w.category}`,
        `${w.standard}. Legal minimum: ${w.legal_minimum}. Best practice: ${w.best_practice}. ${w.regulation_ref}.`,
        w.species_id,
        'welfare',
        'GB',
      ]
    );
  }

  // Index stocking densities
  for (const sd of STOCKING_DENSITIES) {
    const species = SPECIES.find(s => s.id === sd.species_id);
    db.run(
      'INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)',
      [
        `${species?.name ?? sd.species_id} Stocking Density: ${sd.housing_type}`,
        `${species?.name} ${sd.age_class} stocking density for ${sd.housing_type}: ${sd.density_value} ${sd.density_unit}. Legal minimum ${sd.legal_minimum}, recommended ${sd.recommended}. Source: ${sd.source}.`,
        sd.species_id,
        'stocking',
        'GB',
      ]
    );
  }

  // Index feed requirements
  for (const fr of FEED_REQUIREMENTS) {
    const species = SPECIES.find(s => s.id === fr.species_id);
    db.run(
      'INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)',
      [
        `${species?.name ?? fr.species_id} Feed: ${fr.production_stage}`,
        `${species?.name} ${fr.age_class} ${fr.production_stage}: ${fr.energy_mj_per_day} MJ ME/day, ${fr.protein_g_per_day}g CP, ${fr.dry_matter_kg} kg DM. ${fr.example_ration}. ${fr.notes}.`,
        fr.species_id,
        'feed',
        'GB',
      ]
    );
  }

  // Index animal health
  for (const ah of ANIMAL_HEALTH) {
    const species = SPECIES.find(s => s.id === ah.species_id);
    db.run(
      'INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)',
      [
        `${ah.condition}${ah.notifiable ? ' (NOTIFIABLE)' : ''}`,
        `${ah.condition} in ${species?.name ?? ah.species_id}. Symptoms: ${ah.symptoms}. Causes: ${ah.causes}. Treatment: ${ah.treatment}. Prevention: ${ah.prevention}. ${ah.notifiable ? 'This is a notifiable disease -- must report to APHA.' : ''}`,
        ah.species_id,
        'health',
        'GB',
      ]
    );
  }

  // Index movement rules
  for (const mr of MOVEMENT_RULES) {
    const species = SPECIES.find(s => s.id === mr.species_id);
    db.run(
      'INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)',
      [
        `${species?.name ?? mr.species_id} Movement: ${mr.rule_type}`,
        `${mr.rule} Exceptions: ${mr.exceptions}. Authority: ${mr.authority}. ${mr.regulation_ref}.${mr.standstill_days > 0 ? ` Standstill period: ${mr.standstill_days} days.` : ''}`,
        mr.species_id,
        'movement',
        'GB',
      ]
    );
  }

  // Index housing requirements
  for (const hr of HOUSING_REQUIREMENTS) {
    const species = SPECIES.find(s => s.id === hr.species_id);
    db.run(
      'INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)',
      [
        `${species?.name ?? hr.species_id} Housing: ${hr.system}`,
        `${species?.name} ${hr.age_class} ${hr.system} housing: ${hr.space_per_head_m2} m2/head. Ventilation: ${hr.ventilation}. Flooring: ${hr.flooring}. Temperature: ${hr.temperature_range}. Lighting: ${hr.lighting}.`,
        hr.species_id,
        'housing',
        'GB',
      ]
    );
  }

  // Index breeding guidance
  for (const bg of BREEDING_GUIDANCE) {
    const species = SPECIES.find(s => s.id === bg.species_id);
    db.run(
      'INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)',
      [
        `${species?.name ?? bg.species_id} Breeding: ${bg.topic}`,
        `${bg.guidance} Gestation: ${bg.gestation_days} days.`,
        bg.species_id,
        'breeding',
        'GB',
      ]
    );
  }

  const totalFts = WELFARE_STANDARDS.length + STOCKING_DENSITIES.length + FEED_REQUIREMENTS.length
    + ANIMAL_HEALTH.length + MOVEMENT_RULES.length + HOUSING_REQUIREMENTS.length + BREEDING_GUIDANCE.length;
  console.log(`  ${totalFts} FTS5 entries created.`);

  // Update metadata
  console.log('Updating db_metadata...');
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)", [now]);
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)", [now]);
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('species_count', ?)", [String(SPECIES.length)]);
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('welfare_standards_count', ?)", [String(WELFARE_STANDARDS.length)]);
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('health_conditions_count', ?)", [String(ANIMAL_HEALTH.length)]);
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('movement_rules_count', ?)", [String(MOVEMENT_RULES.length)]);
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('feed_requirements_count', ?)", [String(FEED_REQUIREMENTS.length)]);

  // Write coverage.json
  const coverage = {
    mcp_name: 'Livestock MCP',
    jurisdiction: 'GB',
    build_date: now,
    species: SPECIES.length,
    welfare_standards: WELFARE_STANDARDS.length,
    stocking_densities: STOCKING_DENSITIES.length,
    feed_requirements: FEED_REQUIREMENTS.length,
    animal_health_conditions: ANIMAL_HEALTH.length,
    movement_rules: MOVEMENT_RULES.length,
    housing_requirements: HOUSING_REQUIREMENTS.length,
    breeding_guidance: BREEDING_GUIDANCE.length,
    fts_entries: totalFts,
    notifiable_diseases: ANIMAL_HEALTH.filter(ah => ah.notifiable === 1).length,
    source_hash: createHash('sha256')
      .update(JSON.stringify({ SPECIES, WELFARE_STANDARDS, STOCKING_DENSITIES, FEED_REQUIREMENTS, ANIMAL_HEALTH, MOVEMENT_RULES, HOUSING_REQUIREMENTS, BREEDING_GUIDANCE }))
      .digest('hex')
      .slice(0, 16),
  };
  writeFileSync('data/coverage.json', JSON.stringify(coverage, null, 2));
  console.log('Wrote data/coverage.json');

  console.log('\nIngestion complete.');
  console.log(`  Species: ${SPECIES.length}`);
  console.log(`  Welfare standards: ${WELFARE_STANDARDS.length}`);
  console.log(`  Stocking densities: ${STOCKING_DENSITIES.length}`);
  console.log(`  Feed requirements: ${FEED_REQUIREMENTS.length}`);
  console.log(`  Animal health conditions: ${ANIMAL_HEALTH.length} (${ANIMAL_HEALTH.filter(a => a.notifiable).length} notifiable)`);
  console.log(`  Movement rules: ${MOVEMENT_RULES.length}`);
  console.log(`  Housing requirements: ${HOUSING_REQUIREMENTS.length}`);
  console.log(`  Breeding guidance: ${BREEDING_GUIDANCE.length}`);
  console.log(`  FTS5 entries: ${totalFts}`);
}

// ── Main ─────────────────────────────────────────────────────────

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');
ingest(db);
db.close();
