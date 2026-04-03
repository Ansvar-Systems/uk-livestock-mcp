import { createDatabase, type Database } from '../../src/db.js';

export function createSeededDatabase(dbPath: string): Database {
  const db = createDatabase(dbPath);

  // Species
  db.run(
    `INSERT INTO species (id, name, common_breeds) VALUES (?, ?, ?)`,
    ['sheep', 'Sheep', JSON.stringify(['Suffolk', 'Texel', 'Cheviot'])]
  );
  db.run(
    `INSERT INTO species (id, name, common_breeds) VALUES (?, ?, ?)`,
    ['cattle', 'Cattle', JSON.stringify(['Angus', 'Hereford', 'Charolais'])]
  );
  db.run(
    `INSERT INTO species (id, name, common_breeds) VALUES (?, ?, ?)`,
    ['pigs', 'Pigs', JSON.stringify(['Large White', 'Landrace', 'Duroc'])]
  );

  // Welfare standards -- sheep
  db.run(
    `INSERT INTO welfare_standards (species_id, production_system, category, standard, legal_minimum, best_practice, regulation_ref, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sheep', 'outdoor', 'shelter', 'Provision of shelter from adverse weather',
     'Access to shelter in severe weather', 'Permanent shelter available year-round',
     'Welfare of Farmed Animals (England) Regulations 2007', 'DEFRA Code of Practice for the Welfare of Sheep', 'GB']
  );
  db.run(
    `INSERT INTO welfare_standards (species_id, production_system, category, standard, legal_minimum, best_practice, regulation_ref, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sheep', 'all', 'inspection', 'Regular inspection of flock',
     'Inspect at intervals sufficient to avoid suffering', 'Daily inspection of all animals',
     'Welfare of Farmed Animals (England) Regulations 2007', 'DEFRA Code of Practice for the Welfare of Sheep', 'GB']
  );

  // Welfare standards -- cattle
  db.run(
    `INSERT INTO welfare_standards (species_id, production_system, category, standard, legal_minimum, best_practice, regulation_ref, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cattle', 'indoor', 'housing', 'Adequate lying area and ventilation',
     'Sufficient space to lie down and rest without difficulty', 'Cubicle size matched to cow size with deep-bedded comfort',
     'Welfare of Farmed Animals (England) Regulations 2007', 'DEFRA Code of Practice for the Welfare of Cattle', 'GB']
  );
  db.run(
    `INSERT INTO welfare_standards (species_id, production_system, category, standard, legal_minimum, best_practice, regulation_ref, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cattle', 'all', 'water', 'Access to clean drinking water',
     'Adequate supply of fresh water each day', 'Ad-lib access to clean water at all times with multiple drinker points',
     'Welfare of Farmed Animals (England) Regulations 2007', 'DEFRA Code of Practice for the Welfare of Cattle', 'GB']
  );

  // Welfare standards -- pigs
  db.run(
    `INSERT INTO welfare_standards (species_id, production_system, category, standard, legal_minimum, best_practice, regulation_ref, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pigs', 'indoor', 'enrichment', 'Environmental enrichment materials',
     'Permanent access to manipulable material', 'Multiple enrichment types rotated regularly including straw and rootable substrate',
     'Welfare of Farmed Animals (England) Regulations 2007', 'DEFRA Code of Practice for the Welfare of Pigs', 'GB']
  );
  db.run(
    `INSERT INTO welfare_standards (species_id, production_system, category, standard, legal_minimum, best_practice, regulation_ref, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pigs', 'all', 'tail_docking', 'Restrictions on tail docking',
     'Not routine -- only where evidence of tail biting and environmental measures have failed', 'No tail docking -- resolve underlying husbandry issues',
     'Welfare of Farmed Animals (England) Regulations 2007', 'DEFRA Code of Practice for the Welfare of Pigs', 'GB']
  );

  // Movement rules
  db.run(
    `INSERT INTO movement_rules (species_id, rule_type, rule, standstill_days, exceptions, authority, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sheep', 'standstill', 'After moving sheep onto a holding, a 6-day standstill applies to all sheep and goats on that holding.',
     6, 'Licensed markets, shows with pre-movement testing, veterinary emergencies',
     'APHA', 'Sheep and Goats (Records, Identification and Movement) (England) Order 2009', 'GB']
  );
  db.run(
    `INSERT INTO movement_rules (species_id, rule_type, rule, standstill_days, exceptions, authority, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cattle', 'standstill', 'After moving cattle onto a holding, a 13-day standstill applies to all cattle on that holding. TB-restricted holdings may have additional restrictions.',
     13, 'Licensed markets, veterinary emergencies, slaughter within 13 days',
     'APHA', 'Cattle Identification Regulations 2007 / Disease Control (England) Order 2003', 'GB']
  );
  db.run(
    `INSERT INTO movement_rules (species_id, rule_type, rule, standstill_days, exceptions, authority, regulation_ref, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pigs', 'standstill', 'After moving pigs onto a holding, a 20-day standstill applies to all pigs on that holding.',
     20, 'Licensed markets, direct movement to slaughter',
     'APHA', 'Pigs (Records, Identification and Movement) (England) Order 2011', 'GB']
  );

  // Stocking densities
  db.run(
    `INSERT INTO stocking_densities (species_id, age_class, housing_type, density_value, density_unit, legal_minimum, recommended, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sheep', 'adult', 'indoor', 1.4, 'm2_per_head', 1.0, 1.4, 'DEFRA Code of Practice for the Welfare of Sheep', 'GB']
  );
  db.run(
    `INSERT INTO stocking_densities (species_id, age_class, housing_type, density_value, density_unit, legal_minimum, recommended, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cattle', 'adult', 'indoor', 6.0, 'm2_per_head', 5.0, 6.0, 'DEFRA Code of Practice for the Welfare of Cattle', 'GB']
  );
  db.run(
    `INSERT INTO stocking_densities (species_id, age_class, housing_type, density_value, density_unit, legal_minimum, recommended, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pigs', 'adult', 'indoor', 1.0, 'm2_per_head', 0.65, 1.0, 'DEFRA Code of Practice for the Welfare of Pigs', 'GB']
  );

  // Feed requirements
  db.run(
    `INSERT INTO feed_requirements (species_id, age_class, production_stage, energy_mj_per_day, protein_g_per_day, dry_matter_kg, minerals, example_ration, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sheep', 'adult', 'maintenance', 8.5, 80, 1.2, JSON.stringify({ calcium_g: 3, phosphorus_g: 2 }),
     'Good quality hay ad-lib plus 0.25 kg concentrate', 'Ewe at 70 kg liveweight', 'GB']
  );
  db.run(
    `INSERT INTO feed_requirements (species_id, age_class, production_stage, energy_mj_per_day, protein_g_per_day, dry_matter_kg, minerals, example_ration, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cattle', 'adult', 'maintenance', 55.0, 450, 9.0, JSON.stringify({ calcium_g: 25, phosphorus_g: 18 }),
     'Grass silage ad-lib', 'Suckler cow at 600 kg liveweight', 'GB']
  );
  db.run(
    `INSERT INTO feed_requirements (species_id, age_class, production_stage, energy_mj_per_day, protein_g_per_day, dry_matter_kg, minerals, example_ration, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pigs', 'grower', 'finishing', 32.0, 350, 2.5, JSON.stringify({ calcium_g: 12, phosphorus_g: 8, lysine_g: 15 }),
     'Compound finisher feed at 2.5 kg/day', 'Finishing pig 60-110 kg liveweight', 'GB']
  );

  // Housing requirements
  db.run(
    `INSERT INTO housing_requirements (species_id, age_class, system, space_per_head_m2, ventilation, flooring, temperature_range, lighting, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sheep', 'adult', 'indoor', 1.4, 'Natural ventilation with ridge outlet',
     'Straw bedding on solid floor', '5-20C', 'Natural daylight minimum',
     'DEFRA Code of Practice for the Welfare of Sheep', 'GB']
  );
  db.run(
    `INSERT INTO housing_requirements (species_id, age_class, system, space_per_head_m2, ventilation, flooring, temperature_range, lighting, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['cattle', 'adult', 'indoor', 6.0, 'Natural ventilation with 0.04 m2 outlet per cow',
     'Cubicles with mattress or deep sand bedding', '5-25C', 'Natural daylight minimum 8 hours',
     'DEFRA Code of Practice for the Welfare of Cattle', 'GB']
  );
  db.run(
    `INSERT INTO housing_requirements (species_id, age_class, system, space_per_head_m2, ventilation, flooring, temperature_range, lighting, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pigs', 'adult', 'indoor', 1.0, 'Mechanical or natural, max 0.2 m/s air speed at pig level',
     'Part slatted with solid lying area', '15-25C', 'Minimum 40 lux for 8 hours daily',
     'DEFRA Code of Practice for the Welfare of Pigs', 'GB']
  );

  // Breeding guidance
  db.run(
    `INSERT INTO breeding_guidance (species_id, topic, guidance, calendar, gestation_days, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['sheep', 'lambing', 'Ewes typically lamb 147 days after mating. Scan at 80-90 days to determine litter size. Increase feed in last 6 weeks of pregnancy.',
     JSON.stringify({ mating: 'Oct-Nov', scanning: 'Jan', lambing: 'Mar-Apr', weaning: 'Jul-Aug' }),
     147, 'AHDB Sheep BRP Manual', 'GB']
  );
  db.run(
    `INSERT INTO breeding_guidance (species_id, topic, guidance, calendar, gestation_days, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['cattle', 'calving', 'Cattle have a gestation of approximately 283 days. Monitor body condition score at drying off (target BCS 3.0). Transition diet 3 weeks before calving.',
     JSON.stringify({ mating: 'Jun-Aug', pregnancy_check: 'Sep-Nov', dry_period: 'Mar-Apr', calving: 'Mar-May' }),
     283, 'AHDB Beef & Dairy BRP', 'GB']
  );
  db.run(
    `INSERT INTO breeding_guidance (species_id, topic, guidance, calendar, gestation_days, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['pigs', 'farrowing', 'Sow gestation is approximately 114 days (3 months, 3 weeks, 3 days). Move to farrowing accommodation 5-7 days before due date. Target 2.3-2.5 litters per sow per year.',
     JSON.stringify({ service: 'continuous', gestation_check: '28_days_post_service', farrowing: '114_days_post_service', weaning: '21-28_days_post_farrowing' }),
     114, 'AHDB Pork BRP', 'GB']
  );

  // Animal health conditions
  db.run(
    `INSERT INTO animal_health (id, species_id, condition, symptoms, causes, treatment, prevention, notifiable, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['fmd-cattle', 'cattle', 'Foot-and-Mouth Disease',
     'Fever, blisters on mouth and feet, drooling, lameness, reluctance to move',
     'Foot-and-mouth disease virus (Aphthovirus)',
     'No treatment -- notify APHA immediately. Affected animals are culled under government direction.',
     'Strict biosecurity, import controls, vaccination (only under government direction during outbreaks)',
     1, 'DEFRA / APHA Notifiable Disease Guidance', 'GB']
  );
  db.run(
    `INSERT INTO animal_health (id, species_id, condition, symptoms, causes, treatment, prevention, notifiable, source, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['footrot-sheep', 'sheep', 'Footrot',
     'Lameness, foul smell from feet, separation of horn from sole, swelling between toes',
     'Dichelobacter nodosus bacterium, thrives in warm wet conditions',
     'Foot trimming, antibiotic spray, systemic antibiotics in severe cases. Isolate affected animals.',
     'Regular foot inspection, foot bathing, culling persistently lame animals, dry standing areas',
     0, 'AHDB Sheep BRP Manual', 'GB']
  );

  // FTS5 search index entries
  db.run(
    `INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)`,
    ['Sheep Welfare Standards', 'Welfare standards for sheep including shelter, inspection, feeding, and handling requirements per DEFRA codes of practice.', 'sheep', 'welfare', 'GB']
  );
  db.run(
    `INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)`,
    ['Cattle Movement Standstill', 'After moving cattle onto a holding, a 13-day standstill applies. Movement must be reported to BCMS within 3 days.', 'cattle', 'movement', 'GB']
  );
  db.run(
    `INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)`,
    ['Pig Housing Requirements', 'Indoor pig housing requires minimum space allowances, environmental enrichment, and temperature control. Finishing pigs need 0.65 m2 legal minimum.', 'pigs', 'housing', 'GB']
  );
  db.run(
    `INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)`,
    ['Sheep Breeding Calendar', 'Sheep breeding season runs October to November with lambing in March to April. Gestation period is 147 days.', 'sheep', 'breeding', 'GB']
  );
  db.run(
    `INSERT INTO search_index (title, body, species, category, jurisdiction) VALUES (?, ?, ?, ?, ?)`,
    ['Foot-and-Mouth Disease', 'Foot-and-mouth disease is a notifiable disease causing blisters on mouth and feet. Must report to APHA immediately.', 'cattle', 'health', 'GB']
  );

  return db;
}
