# AERIS Category Constants — Mobile Export

> **Auto-derived from `lib/categoryToAgencyTypes.ts` in the AERIS web portal.**
> Re-sync this file whenever categories, agency routing, or dispatch logic changes in the web portal.
>

> - `citizen-app/constants/categories.ts`
>
> Copy the TypeScript block below **as-is**. Do NOT import from the web portal.

---

```typescript
/**
 * AERIS Category Constants
 * ========================

 *
 * Standalone TypeScript — NO imports from the web portal.
 * Compatible with React Native (Expo) TypeScript projects.
 *
 * Re-sync this file when the web portal constants change.
 * Source of truth: lib/categoryToAgencyTypes.ts
 * Sync target:     functions/src/utils/constants.ts
 *
 * Last synced: 2026-03-03
 * Category count: 83
 * Agency count: 12
 */

// ─── Agency IDs ────────────────────────────────────────────────────────────────

export const AGENCY_IDS = {
  POLICE:      'police',
  FIRE:        'fire',
  MEDICAL:     'medical',
  RESCUE:      'rescue',
  MMDA:        'mmda',
  LTO:         'lto',
  NBI:         'nbi',
  BOC:         'boc',
  BOI:         'boi',
  PCG:         'pcg',
  PDEA:        'pdea',
  ENVIRONMENT: 'environment',
} as const;

export type AgencyId = typeof AGENCY_IDS[keyof typeof AGENCY_IDS];

// ─── Agency Labels ─────────────────────────────────────────────────────────────

export const AGENCY_LABELS: Record<AgencyId, string> = {
  police:      'PNP',
  fire:        'BFP',
  medical:     'EMS',
  rescue:      'NDRRMO',
  mmda:        'MMDA',
  lto:         'LTO',
  nbi:         'NBI',
  boc:         'BOC',
  boi:         'BOI',
  pcg:         'PCG',
  pdea:        'PDEA',
  environment: 'DENR',
};

// ─── Category Keys ─────────────────────────────────────────────────────────────

export const CATEGORIES = {
  // Police
  CRIME:                    'crime',
  ASSAULT:                  'assault',
  ROBBERY:                  'robbery',
  THEFT:                    'theft',
  DOMESTIC_VIOLENCE:        'domestic_violence',
  MISSING_PERSON:           'missing_person',
  CRIME_WITH_WEAPON:        'crime_with_weapon',
  KIDNAPPING:               'kidnapping',
  HOMICIDE:                 'homicide',
  VANDALISM:                'vandalism',
  TRESPASSING:              'trespassing',
  PUBLIC_DISTURBANCE:       'public_disturbance',
  ILLEGAL_GAMBLING:         'illegal_gambling',
  CHILD_ABUSE:              'child_abuse',
  ACTIVE_SHOOTER:           'active_shooter',
  BOMB_THREAT:              'bomb_threat',
  // Fire
  FIRE:                     'fire',
  GAS_LEAK:                 'gas_leak',
  EXPLOSION:                'explosion',
  HAZMAT_INCIDENT:          'hazmat_incident',
  VEHICLE_FIRE:             'vehicle_fire',
  // Medical
  MEDICAL_EMERGENCY:        'medical_emergency',
  ACCIDENT_WITH_INJURY:     'accident_with_injury',
  CARDIAC_ARREST:           'cardiac_arrest',
  UNCONSCIOUS_PERSON:       'unconscious_person',
  CHILDBIRTH_EMERGENCY:     'childbirth_emergency',
  // Rescue
  RESCUE:                   'rescue',
  DROWNING:                 'drowning',
  DISASTER:                 'disaster',
  TYPHOON_FLOOD:            'typhoon_flood',
  EARTHQUAKE_DAMAGE:        'earthquake_damage',
  STRUCTURAL_COLLAPSE:      'structural_collapse',
  LANDSLIDE:                'landslide',
  TRAPPED_PERSON:           'trapped_person',
  // MMDA
  ILLEGAL_PARKING:          'illegal_parking',
  RECKLESS_DRIVING:         'reckless_driving',
  ROAD_OBSTRUCTION:         'road_obstruction',
  TRAFFIC_SIGNAL_PROBLEM:   'traffic_signal_problem',
  COUNTERFLOW_VIOLATION:    'counterflow_violation',
  ROAD_ACCIDENT_NO_INJURY:  'road_accident_no_injury',
  // LTO
  UNREGISTERED_VEHICLE:     'unregistered_vehicle',
  NO_DRIVERS_LICENSE:       'no_drivers_license',
  COLORUM_VEHICLE:          'colorum_vehicle',
  OVERLOADED_VEHICLE:       'overloaded_vehicle',
  ROAD_RAGE_VIDEO:          'road_rage_video',
  LICENSE_PLATE_VIOLATION:  'license_plate_violation',
  DRUNK_DRIVING:            'drunk_driving',
  ILLEGAL_RACING:           'illegal_racing',
  NO_HELMET:                'no_helmet',
  // PDEA
  DRUG_USE_PUBLIC:          'drug_use_public',
  DRUG_DEALING:             'drug_dealing',
  DRUG_LABORATORY:          'drug_laboratory',
  DRUG_PARAPHERNALIA:       'drug_paraphernalia',
  ORGANIZED_DRUG_CRIME:     'organized_drug_crime',
  // NBI
  FRAUD:                    'fraud',
  CYBERCRIME:               'cybercrime',
  HUMAN_TRAFFICKING:        'human_trafficking',
  IDENTITY_THEFT:           'identity_theft',
  ORGANIZED_CRIME:          'organized_crime',
  ESTAFA:                   'estafa',
  // BOC
  SMUGGLING:                'smuggling',
  COUNTERFEIT_GOODS:        'counterfeit_goods',
  UNDECLARED_GOODS:         'undeclared_goods',
  // BOI
  ILLEGAL_ALIEN:            'illegal_alien',
  VISA_VIOLATION:           'visa_violation',
  OVERSTAYING_FOREIGNER:    'overstaying_foreigner',
  // PCG
  MARITIME_EMERGENCY:       'maritime_emergency',
  VESSEL_IN_DISTRESS:       'vessel_in_distress',
  DROWNING_COASTAL:         'drowning_coastal',
  MARITIME_SMUGGLING:       'maritime_smuggling',
  OIL_SPILL:                'oil_spill',
  ILLEGAL_FISHING:          'illegal_fishing',
  // Environment (DENR/EMB)
  ILLEGAL_DUMPING:          'illegal_dumping',
  POLLUTION_AIR:            'pollution_air',
  POLLUTION_WATER:          'pollution_water',
  POLLUTION_NOISE:          'pollution_noise',
  ILLEGAL_LOGGING:          'illegal_logging',
  WILDLIFE_VIOLATION:       'wildlife_violation',
  OPEN_BURNING:             'open_burning',
  MINING_VIOLATION:         'mining_violation',
  QUARRYING_VIOLATION:      'quarrying_violation',
  // Local Government
  BUSINESS_VIOLATION:       'business_violation',
  BUILDING_VIOLATION:       'building_violation',
} as const;

export type CategoryKey = typeof CATEGORIES[keyof typeof CATEGORIES];

// ─── Human-Readable Labels ─────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  // Police
  crime:                    'Crime',
  assault:                  'Assault',
  robbery:                  'Robbery',
  theft:                    'Theft',
  domestic_violence:        'Domestic Violence',
  missing_person:           'Missing Person',
  crime_with_weapon:        'Armed Crime',
  kidnapping:               'Kidnapping',
  homicide:                 'Homicide',
  vandalism:                'Vandalism',
  trespassing:              'Trespassing',
  public_disturbance:       'Public Disturbance',
  illegal_gambling:         'Illegal Gambling',
  child_abuse:              'Child Abuse',
  active_shooter:           'Active Shooter',
  bomb_threat:              'Bomb Threat',
  // Fire
  fire:                     'Fire',
  gas_leak:                 'Gas Leak',
  explosion:                'Explosion',
  hazmat_incident:          'Hazardous Materials',
  vehicle_fire:             'Vehicle Fire',
  // Medical
  medical_emergency:        'Medical Emergency',
  accident_with_injury:     'Accident with Injury',
  cardiac_arrest:           'Cardiac Arrest',
  unconscious_person:       'Unconscious Person',
  childbirth_emergency:     'Emergency Childbirth',
  // Rescue
  rescue:                   'Rescue Needed',
  drowning:                 'Drowning',
  disaster:                 'Disaster',
  typhoon_flood:            'Typhoon / Flood',
  earthquake_damage:        'Earthquake Damage',
  structural_collapse:      'Structural Collapse',
  landslide:                'Landslide',
  trapped_person:           'Trapped Person',
  // MMDA
  illegal_parking:          'Illegal Parking',
  reckless_driving:         'Reckless Driving',
  road_obstruction:         'Road Obstruction',
  traffic_signal_problem:   'Traffic Signal Problem',
  counterflow_violation:    'Counterflow Violation',
  road_accident_no_injury:  'Road Accident (No Injury)',
  // LTO
  unregistered_vehicle:     'Unregistered Vehicle',
  no_drivers_license:       "No Driver's License",
  colorum_vehicle:          'Colorum Vehicle',
  overloaded_vehicle:       'Overloaded Vehicle',
  road_rage_video:          'Road Rage (Video Evidence)',
  license_plate_violation:  'License Plate Violation',
  drunk_driving:            'Drunk Driving',
  illegal_racing:           'Illegal Street Racing',
  no_helmet:                'No Helmet Violation',
  // PDEA
  drug_use_public:          'Drug Use in Public',
  drug_dealing:             'Drug Dealing',
  drug_laboratory:          'Drug Laboratory',
  drug_paraphernalia:       'Drug Paraphernalia',
  organized_drug_crime:     'Organized Drug Crime',
  // NBI
  fraud:                    'Fraud / Scam',
  cybercrime:               'Cybercrime',
  human_trafficking:        'Human Trafficking',
  identity_theft:           'Identity Theft',
  organized_crime:          'Organized Crime',
  estafa:                   'Estafa',
  // BOC
  smuggling:                'Smuggling',
  counterfeit_goods:        'Counterfeit Goods',
  undeclared_goods:         'Undeclared Goods',
  // BOI
  illegal_alien:            'Illegal Alien',
  visa_violation:           'Visa Violation',
  overstaying_foreigner:    'Overstaying Foreigner',
  // PCG
  maritime_emergency:       'Maritime Emergency',
  vessel_in_distress:       'Vessel in Distress',
  drowning_coastal:         'Drowning (Coastal)',
  maritime_smuggling:       'Maritime Smuggling',
  oil_spill:                'Oil Spill',
  illegal_fishing:          'Illegal Fishing',
  // Environment (DENR/EMB)
  illegal_dumping:          'Illegal Dumping',
  pollution_air:            'Air Pollution',
  pollution_water:          'Water Pollution',
  pollution_noise:          'Noise Pollution',
  illegal_logging:          'Illegal Logging',
  wildlife_violation:       'Wildlife Violation',
  open_burning:             'Open Burning',
  mining_violation:         'Mining Violation',
  quarrying_violation:      'Quarrying Violation',
  // Local Government
  business_violation:       'Business Permit Violation',
  building_violation:       'Building / Construction Violation',
};

// ─── Agency Routing Map ────────────────────────────────────────────────────────
// Maps each category to one or more agencies. First agency = primary responder.

export const CATEGORY_TO_AGENCY_TYPES: Record<CategoryKey, AgencyId[]> = {
  // Police
  crime:                    ['police'],
  assault:                  ['police'],
  robbery:                  ['police'],
  theft:                    ['police'],
  domestic_violence:        ['police'],
  missing_person:           ['police'],
  crime_with_weapon:        ['police'],
  kidnapping:               ['police'],
  homicide:                 ['police'],
  vandalism:                ['police'],
  trespassing:              ['police'],
  public_disturbance:       ['police'],
  illegal_gambling:         ['police'],
  child_abuse:              ['police', 'nbi'],
  active_shooter:           ['police', 'medical'],
  bomb_threat:              ['police', 'fire', 'rescue'],
  // Fire
  fire:                     ['fire'],
  gas_leak:                 ['fire', 'rescue'],
  explosion:                ['fire', 'rescue', 'police'],
  hazmat_incident:          ['fire', 'rescue'],
  vehicle_fire:             ['fire', 'police', 'medical'],
  // Medical
  medical_emergency:        ['medical'],
  accident_with_injury:     ['medical', 'police'],
  cardiac_arrest:           ['medical'],
  unconscious_person:       ['medical'],
  childbirth_emergency:     ['medical'],
  // Rescue
  rescue:                   ['rescue', 'fire'],
  drowning:                 ['rescue', 'medical'],
  disaster:                 ['rescue', 'fire', 'medical'],
  typhoon_flood:            ['rescue', 'fire', 'medical'],
  earthquake_damage:        ['rescue', 'fire', 'medical'],
  structural_collapse:      ['rescue', 'fire', 'medical'],
  landslide:                ['rescue', 'fire'],
  trapped_person:           ['rescue', 'fire', 'medical'],
  // MMDA
  illegal_parking:          ['mmda', 'police'],
  reckless_driving:         ['mmda', 'police'],
  road_obstruction:         ['mmda', 'police'],
  traffic_signal_problem:   ['mmda'],
  counterflow_violation:    ['mmda', 'police'],
  road_accident_no_injury:  ['mmda', 'police'],
  // LTO
  unregistered_vehicle:     ['lto'],
  no_drivers_license:       ['lto', 'police'],
  colorum_vehicle:          ['lto', 'police'],
  overloaded_vehicle:       ['lto', 'police'],
  road_rage_video:          ['lto', 'police'],
  license_plate_violation:  ['lto'],
  drunk_driving:            ['police', 'lto'],
  illegal_racing:           ['police', 'lto'],
  no_helmet:                ['police', 'lto'],
  // PDEA
  drug_use_public:          ['pdea', 'police'],
  drug_dealing:             ['pdea', 'police'],
  drug_laboratory:          ['pdea', 'police', 'fire'],
  drug_paraphernalia:       ['police'],
  organized_drug_crime:     ['pdea', 'nbi'],
  // NBI
  fraud:                    ['nbi', 'police'],
  cybercrime:               ['nbi', 'police'],
  human_trafficking:        ['police', 'nbi'],
  identity_theft:           ['nbi', 'police'],
  organized_crime:          ['nbi', 'police'],
  estafa:                   ['nbi', 'police'],
  // BOC
  smuggling:                ['boc', 'police'],
  counterfeit_goods:        ['boc', 'nbi', 'police'],
  undeclared_goods:         ['boc'],
  // BOI
  illegal_alien:            ['boi', 'police'],
  visa_violation:           ['boi'],
  overstaying_foreigner:    ['boi', 'police'],
  // PCG
  maritime_emergency:       ['pcg', 'rescue', 'medical'],
  vessel_in_distress:       ['pcg', 'rescue'],
  drowning_coastal:         ['pcg', 'rescue', 'medical'],
  maritime_smuggling:       ['pcg', 'boc', 'police'],
  oil_spill:                ['pcg', 'environment'],
  illegal_fishing:          ['pcg', 'environment'],
  // Environment (DENR/EMB)
  illegal_dumping:          ['environment'],
  pollution_air:            ['environment'],
  pollution_water:          ['environment'],
  pollution_noise:          ['environment'],
  illegal_logging:          ['environment', 'police'],
  wildlife_violation:       ['environment', 'police'],
  open_burning:             ['environment', 'fire'],
  mining_violation:         ['environment', 'police'],
  quarrying_violation:      ['environment', 'police'],
  // Local Government
  business_violation:       ['mmda'],
  building_violation:       ['mmda', 'police'],
};

// ─── Emergency vs Violation Classification ─────────────────────────────────────

const EMERGENCY_CATEGORY_SET = new Set<CategoryKey>([
  'assault', 'robbery', 'domestic_violence', 'crime_with_weapon', 'kidnapping',
  'homicide', 'active_shooter', 'bomb_threat',
  'fire', 'gas_leak', 'explosion', 'hazmat_incident', 'vehicle_fire',
  'medical_emergency', 'accident_with_injury', 'cardiac_arrest',
  'unconscious_person', 'childbirth_emergency',
  'rescue', 'drowning', 'disaster', 'typhoon_flood', 'earthquake_damage',
  'structural_collapse', 'landslide', 'trapped_person',
  'maritime_emergency', 'vessel_in_distress', 'drowning_coastal',
  'drug_laboratory', 'human_trafficking',
]);

/** Stage 3 categories: immediate broadcast, skip Stages 1 & 2, all available units. */
const STAGE_3_CATEGORY_SET = new Set<CategoryKey>([
  'human_trafficking', 'drug_laboratory', 'active_shooter', 'bomb_threat',
]);

export function isEmergencyCategory(category: CategoryKey): boolean {
  return EMERGENCY_CATEGORY_SET.has(category);
}

export function isViolationCategory(category: CategoryKey): boolean {
  return !EMERGENCY_CATEGORY_SET.has(category);
}

export function isStage3Category(category: CategoryKey): boolean {
  return STAGE_3_CATEGORY_SET.has(category);
}

// ─── Dispatch Priority ─────────────────────────────────────────────────────────

export type DispatchPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const MEDIUM_PRIORITY_VIOLATIONS = new Set<CategoryKey>([
  'drug_dealing', 'drug_use_public', 'child_abuse', 'domestic_violence',
  'drunk_driving', 'colorum_vehicle', 'smuggling',
]);

export function getDispatchPriority(category: CategoryKey): DispatchPriority {
  if (STAGE_3_CATEGORY_SET.has(category)) return 'CRITICAL';
  if (EMERGENCY_CATEGORY_SET.has(category)) return 'HIGH';
  return MEDIUM_PRIORITY_VIOLATIONS.has(category) ? 'MEDIUM' : 'LOW';
}

// ─── Agency Helpers ────────────────────────────────────────────────────────────

export function getPrimaryAgency(category: CategoryKey): AgencyId | null {
  return CATEGORY_TO_AGENCY_TYPES[category]?.[0] ?? null;
}

export function getSecondaryAgencies(category: CategoryKey): AgencyId[] {
  return CATEGORY_TO_AGENCY_TYPES[category]?.slice(1) ?? [];
}

/**
 * Returns only the categories relevant to a specific agency.
 * Used by the Responder App to filter the report category selector.
 */
export function getCategoriesForAgency(agencyId: AgencyId): CategoryKey[] {
  return (Object.entries(CATEGORY_TO_AGENCY_TYPES) as [CategoryKey, AgencyId[]][])
    .filter(([, agencies]) => agencies.includes(agencyId))
    .map(([category]) => category);
}

/**
 * Returns the dispatch card border color based on priority.
 * CRITICAL → '#FF0000' | HIGH → '#CD0E11' | MEDIUM → '#F59E0B' | LOW → '#3B82F6'
 */
export function getDispatchCardColor(category: CategoryKey): string {
  const priority = getDispatchPriority(category);
  switch (priority) {
    case 'CRITICAL': return '#FF0000';
    case 'HIGH':     return '#CD0E11';
    case 'MEDIUM':   return '#F59E0B';
    case 'LOW':      return '#3B82F6';
  }
}
```

---

## Post-Copy Verification Checklist

After copying to a mobile project, confirm:

- [ ] Category count: **83** (count keys in `CATEGORIES`)
- [ ] Agency count: **12** (count keys in `AGENCY_IDS`)
- [ ] `getPrimaryAgency('drug_dealing')` returns `'pdea'`
- [ ] `isStage3Category('human_trafficking')` returns `true`
- [ ] `isStage3Category('active_shooter')` returns `true`
- [ ] `isStage3Category('bomb_threat')` returns `true`
- [ ] `isStage3Category('drug_laboratory')` returns `true`
- [ ] `isEmergencyCategory('vehicle_fire')` returns `true`
- [ ] `isViolationCategory('child_abuse')` returns `true`
- [ ] `getDispatchCardColor('active_shooter')` returns `'#FF0000'`
