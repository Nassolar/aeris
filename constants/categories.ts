/**
 * AERIS Category Constants — Mobile Export
 * ==========================================
 * Standalone TypeScript — NO imports from web portal or functions.
 * Compatible with React Native (Expo) TypeScript projects.
 *
 * COPY TARGETS (copy this file as-is to both apps):
 *   citizen-app/constants/categories.ts
 *   responder-app/constants/categories.ts
 *
 * RE-SYNC WHEN:
 *   - Categories are added or removed in lib/categoryToAgencyTypes.ts
 *   - Agency type routing changes
 *   - CitizenLabel text changes
 *   - Track, isEmergency, isStage3 values change
 *
 * INTERNATIONAL DESIGN:
 *   - AgencyTypeKey values are universal (never PH abbreviations)
 *   - Local agency names (PNP, FBI, etc.) are resolved at runtime
 *     from Firestore /agencyTypes/{key}.localNames[country]
 *   - Do NOT hardcode country-specific agency names here
 *
 * Last synced: 2026-03-14
 * Category count: 89
 * Agency type count: 13
 */

// ─── Agency Type Keys ──────────────────────────────────────────────────────────

export const AGENCY_TYPE_KEYS = {
    LAW_ENFORCEMENT: 'law_enforcement',
    FIRE_PROTECTION: 'fire_protection',
    EMERGENCY_MEDICAL: 'emergency_medical',
    DISASTER_RESPONSE: 'disaster_response',
    TRAFFIC_MANAGEMENT: 'traffic_management',
    VEHICLE_LICENSING: 'vehicle_licensing',
    ENVIRONMENTAL_PROTECTION: 'environmental_protection',
    CRIMINAL_INVESTIGATION: 'criminal_investigation',
    DRUG_ENFORCEMENT: 'drug_enforcement',
    CUSTOMS_ENFORCEMENT: 'customs_enforcement',
    IMMIGRATION: 'immigration',
    COAST_GUARD: 'coast_guard',
    LOCAL_GOVERNMENT: 'local_government',
} as const

export type AgencyTypeKey = typeof AGENCY_TYPE_KEYS[keyof typeof AGENCY_TYPE_KEYS]

// ─── Report Track ──────────────────────────────────────────────────────────────

export type ReportTrack = 'live_dispatch' | 'complaint_queue'

// ─── Dispatch Priority ─────────────────────────────────────────────────────────

export type DispatchPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

// ─── Category Config Interface ─────────────────────────────────────────────────

export interface CategoryConfig {
    agencyTypes: AgencyTypeKey[]
    track: ReportTrack
    isEmergency: boolean
    isStage3: boolean
    citizenLabel: string
    requiresEvidence: boolean
    generatesCaseNumber: boolean
}

// ─── Full Category Config ──────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {

    // ── Law Enforcement — Live Dispatch ──────────────────────────────────────────
    assault: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Assault', requiresEvidence: false, generatesCaseNumber: false },
    robbery: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Robbery', requiresEvidence: false, generatesCaseNumber: false },
    crime_with_weapon: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Armed Crime', requiresEvidence: false, generatesCaseNumber: false },
    kidnapping: { agencyTypes: ['law_enforcement', 'criminal_investigation'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Kidnapping', requiresEvidence: false, generatesCaseNumber: false },
    homicide: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Homicide', requiresEvidence: false, generatesCaseNumber: false },
    active_shooter: { agencyTypes: ['law_enforcement', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: true, citizenLabel: 'Active Shooter', requiresEvidence: false, generatesCaseNumber: false },
    bomb_threat: { agencyTypes: ['law_enforcement', 'fire_protection', 'disaster_response'], track: 'live_dispatch', isEmergency: true, isStage3: true, citizenLabel: 'Bomb Threat', requiresEvidence: false, generatesCaseNumber: false },
    domestic_violence: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Domestic Violence', requiresEvidence: false, generatesCaseNumber: false },
    crime: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Crime', requiresEvidence: false, generatesCaseNumber: false },
    theft: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Theft', requiresEvidence: false, generatesCaseNumber: false },
    missing_person: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Missing Person', requiresEvidence: false, generatesCaseNumber: false },
    vandalism: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Vandalism', requiresEvidence: false, generatesCaseNumber: false },
    trespassing: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Trespassing', requiresEvidence: false, generatesCaseNumber: false },
    public_disturbance: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Public Disturbance', requiresEvidence: false, generatesCaseNumber: false },
    illegal_gambling: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Illegal Gambling', requiresEvidence: false, generatesCaseNumber: false },
    child_abuse: { agencyTypes: ['law_enforcement', 'criminal_investigation'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Child Abuse', requiresEvidence: false, generatesCaseNumber: false },
    drunk_driving: { agencyTypes: ['law_enforcement', 'vehicle_licensing'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Drunk Driving', requiresEvidence: false, generatesCaseNumber: false },
    illegal_racing: { agencyTypes: ['law_enforcement', 'vehicle_licensing'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Illegal Street Racing', requiresEvidence: false, generatesCaseNumber: false },
    no_helmet: { agencyTypes: ['law_enforcement', 'vehicle_licensing'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'No Helmet Violation', requiresEvidence: false, generatesCaseNumber: false },
    drug_paraphernalia: { agencyTypes: ['law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Drug Paraphernalia', requiresEvidence: false, generatesCaseNumber: false },

    // ── Fire Protection — Live Dispatch ──────────────────────────────────────────
    fire: { agencyTypes: ['fire_protection'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Fire', requiresEvidence: false, generatesCaseNumber: false },
    gas_leak: { agencyTypes: ['fire_protection', 'disaster_response'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Gas Leak', requiresEvidence: false, generatesCaseNumber: false },
    explosion: { agencyTypes: ['fire_protection', 'disaster_response', 'law_enforcement'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Explosion', requiresEvidence: false, generatesCaseNumber: false },
    hazmat_incident: { agencyTypes: ['fire_protection', 'disaster_response'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Hazardous Materials', requiresEvidence: false, generatesCaseNumber: false },
    vehicle_fire: { agencyTypes: ['fire_protection', 'law_enforcement', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Vehicle Fire', requiresEvidence: false, generatesCaseNumber: false },
    open_burning: { agencyTypes: ['fire_protection', 'environmental_protection'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Open Burning', requiresEvidence: false, generatesCaseNumber: false },

    // ── Emergency Medical — Live Dispatch ─────────────────────────────────────────
    medical_emergency: { agencyTypes: ['emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Medical Emergency', requiresEvidence: false, generatesCaseNumber: false },
    accident_with_injury: { agencyTypes: ['emergency_medical', 'law_enforcement'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Accident with Injury', requiresEvidence: false, generatesCaseNumber: false },
    cardiac_arrest: { agencyTypes: ['emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Cardiac Arrest', requiresEvidence: false, generatesCaseNumber: false },
    unconscious_person: { agencyTypes: ['emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Unconscious Person', requiresEvidence: false, generatesCaseNumber: false },
    childbirth_emergency: { agencyTypes: ['emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Emergency Childbirth', requiresEvidence: false, generatesCaseNumber: false },

    // ── Disaster Response — Live Dispatch ─────────────────────────────────────────
    rescue: { agencyTypes: ['disaster_response', 'fire_protection'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Rescue Needed', requiresEvidence: false, generatesCaseNumber: false },
    drowning: { agencyTypes: ['disaster_response', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Drowning', requiresEvidence: false, generatesCaseNumber: false },
    disaster: { agencyTypes: ['disaster_response', 'fire_protection', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Disaster', requiresEvidence: false, generatesCaseNumber: false },
    typhoon_flood: { agencyTypes: ['disaster_response', 'fire_protection', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Typhoon / Flood', requiresEvidence: false, generatesCaseNumber: false },
    earthquake_damage: { agencyTypes: ['disaster_response', 'fire_protection', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Earthquake Damage', requiresEvidence: false, generatesCaseNumber: false },
    structural_collapse: { agencyTypes: ['disaster_response', 'fire_protection', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Structural Collapse', requiresEvidence: false, generatesCaseNumber: false },
    landslide: { agencyTypes: ['disaster_response', 'fire_protection'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Landslide', requiresEvidence: false, generatesCaseNumber: false },
    trapped_person: { agencyTypes: ['disaster_response', 'fire_protection', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Trapped Person', requiresEvidence: false, generatesCaseNumber: false },

    // ── Traffic Management — Live Dispatch ────────────────────────────────────────
    illegal_parking: { agencyTypes: ['traffic_management', 'law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Illegal Parking', requiresEvidence: false, generatesCaseNumber: false },
    reckless_driving: { agencyTypes: ['traffic_management', 'law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Reckless Driving', requiresEvidence: false, generatesCaseNumber: false },
    road_obstruction: { agencyTypes: ['traffic_management', 'law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Road Obstruction', requiresEvidence: false, generatesCaseNumber: false },
    traffic_signal_problem: { agencyTypes: ['traffic_management'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Traffic Signal Problem', requiresEvidence: false, generatesCaseNumber: false },
    counterflow_violation: { agencyTypes: ['traffic_management', 'law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Counterflow Violation', requiresEvidence: false, generatesCaseNumber: false },
    road_accident_no_injury: { agencyTypes: ['traffic_management', 'law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Road Accident (No Injury)', requiresEvidence: false, generatesCaseNumber: false },
    business_violation: { agencyTypes: ['traffic_management'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Business Permit Violation', requiresEvidence: false, generatesCaseNumber: false },
    building_violation: { agencyTypes: ['traffic_management', 'law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Building / Construction Violation', requiresEvidence: false, generatesCaseNumber: false },

    // ── Vehicle Licensing — Complaint Queue ───────────────────────────────────────
    unregistered_vehicle: { agencyTypes: ['vehicle_licensing'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Unregistered Vehicle', requiresEvidence: true, generatesCaseNumber: true },
    no_drivers_license: { agencyTypes: ['vehicle_licensing', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: "No Driver's License", requiresEvidence: true, generatesCaseNumber: true },
    colorum_vehicle: { agencyTypes: ['vehicle_licensing', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Colorum Vehicle', requiresEvidence: true, generatesCaseNumber: true },
    overloaded_vehicle: { agencyTypes: ['vehicle_licensing', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Overloaded Vehicle', requiresEvidence: true, generatesCaseNumber: true },
    road_rage_video: { agencyTypes: ['vehicle_licensing', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Road Rage (Video Evidence)', requiresEvidence: true, generatesCaseNumber: true },
    license_plate_violation: { agencyTypes: ['vehicle_licensing'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'License Plate Violation', requiresEvidence: true, generatesCaseNumber: true },

    // ── Drug Enforcement — Split ──────────────────────────────────────────────────
    drug_use_public: { agencyTypes: ['law_enforcement', 'drug_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Drug Use in Public', requiresEvidence: false, generatesCaseNumber: false },
    drug_dealing: { agencyTypes: ['drug_enforcement', 'law_enforcement'], track: 'live_dispatch', isEmergency: false, isStage3: false, citizenLabel: 'Drug Dealing', requiresEvidence: false, generatesCaseNumber: false },
    drug_laboratory: { agencyTypes: ['drug_enforcement', 'law_enforcement', 'fire_protection'], track: 'live_dispatch', isEmergency: true, isStage3: true, citizenLabel: 'Drug Laboratory', requiresEvidence: false, generatesCaseNumber: false },
    organized_drug_crime: { agencyTypes: ['drug_enforcement', 'criminal_investigation'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Organized Drug Crime', requiresEvidence: true, generatesCaseNumber: true },

    // ── Criminal Investigation — Complaint Queue ──────────────────────────────────
    fraud: { agencyTypes: ['criminal_investigation', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Fraud / Scam', requiresEvidence: true, generatesCaseNumber: true },
    cybercrime: { agencyTypes: ['criminal_investigation', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Cybercrime', requiresEvidence: true, generatesCaseNumber: true },
    human_trafficking: { agencyTypes: ['criminal_investigation', 'law_enforcement'], track: 'complaint_queue', isEmergency: true, isStage3: true, citizenLabel: 'Human Trafficking', requiresEvidence: true, generatesCaseNumber: true },
    identity_theft: { agencyTypes: ['criminal_investigation', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Identity Theft', requiresEvidence: true, generatesCaseNumber: true },
    organized_crime: { agencyTypes: ['criminal_investigation', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Organized Crime', requiresEvidence: true, generatesCaseNumber: true },
    estafa: { agencyTypes: ['criminal_investigation', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Estafa / Swindling', requiresEvidence: true, generatesCaseNumber: true },

    // ── Customs Enforcement — Complaint Queue ─────────────────────────────────────
    smuggling: { agencyTypes: ['customs_enforcement', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Smuggling', requiresEvidence: true, generatesCaseNumber: true },
    counterfeit_goods: { agencyTypes: ['customs_enforcement', 'criminal_investigation', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Counterfeit Goods', requiresEvidence: true, generatesCaseNumber: true },
    undeclared_goods: { agencyTypes: ['customs_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Undeclared Goods', requiresEvidence: true, generatesCaseNumber: true },

    // ── Immigration — Complaint Queue ─────────────────────────────────────────────
    illegal_alien: { agencyTypes: ['immigration', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Illegal Alien', requiresEvidence: true, generatesCaseNumber: true },
    visa_violation: { agencyTypes: ['immigration'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Visa Violation', requiresEvidence: true, generatesCaseNumber: true },
    overstaying_foreigner: { agencyTypes: ['immigration', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Overstaying Foreigner', requiresEvidence: true, generatesCaseNumber: true },

    // ── Coast Guard — Split ────────────────────────────────────────────────────────
    maritime_emergency: { agencyTypes: ['coast_guard', 'disaster_response', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Maritime Emergency', requiresEvidence: false, generatesCaseNumber: false },
    vessel_in_distress: { agencyTypes: ['coast_guard', 'disaster_response'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Vessel in Distress', requiresEvidence: false, generatesCaseNumber: false },
    drowning_coastal: { agencyTypes: ['coast_guard', 'disaster_response', 'emergency_medical'], track: 'live_dispatch', isEmergency: true, isStage3: false, citizenLabel: 'Drowning (Coastal)', requiresEvidence: false, generatesCaseNumber: false },
    maritime_smuggling: { agencyTypes: ['coast_guard', 'customs_enforcement', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Maritime Smuggling', requiresEvidence: true, generatesCaseNumber: true },
    oil_spill: { agencyTypes: ['coast_guard', 'environmental_protection'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Oil Spill', requiresEvidence: true, generatesCaseNumber: true },
    illegal_fishing: { agencyTypes: ['coast_guard', 'environmental_protection'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Illegal Fishing', requiresEvidence: true, generatesCaseNumber: true },

    // ── Environmental Protection — Complaint Queue ────────────────────────────────
    illegal_dumping: { agencyTypes: ['environmental_protection'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Illegal Dumping', requiresEvidence: true, generatesCaseNumber: true },
    pollution_air: { agencyTypes: ['environmental_protection'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Air Pollution', requiresEvidence: true, generatesCaseNumber: true },
    pollution_water: { agencyTypes: ['environmental_protection'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Water Pollution', requiresEvidence: true, generatesCaseNumber: true },
    pollution_noise: { agencyTypes: ['environmental_protection'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Noise Pollution', requiresEvidence: true, generatesCaseNumber: true },
    illegal_logging: { agencyTypes: ['environmental_protection', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Illegal Logging', requiresEvidence: true, generatesCaseNumber: true },
    wildlife_violation: { agencyTypes: ['environmental_protection', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Wildlife Violation', requiresEvidence: true, generatesCaseNumber: true },
    mining_violation: { agencyTypes: ['environmental_protection', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Mining Violation', requiresEvidence: true, generatesCaseNumber: true },
    quarrying_violation: { agencyTypes: ['environmental_protection', 'law_enforcement'], track: 'complaint_queue', isEmergency: false, isStage3: false, citizenLabel: 'Quarrying Violation', requiresEvidence: true, generatesCaseNumber: true },
}

// ─── Typed Constants ───────────────────────────────────────────────────────────

export type CategoryKey = keyof typeof CATEGORY_CONFIG

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => [key, cfg.citizenLabel])
)

// ─── Derived Sets ──────────────────────────────────────────────────────────────

const EMERGENCY_SET = new Set<string>(
    Object.entries(CATEGORY_CONFIG).filter(([, c]) => c.isEmergency).map(([k]) => k)
)

const STAGE_3_SET = new Set<string>(
    Object.entries(CATEGORY_CONFIG).filter(([, c]) => c.isStage3).map(([k]) => k)
)

// ─── Complaint Queue Agency Types ──────────────────────────────────────────────

export const COMPLAINT_QUEUE_AGENCY_TYPES: AgencyTypeKey[] = [
    'vehicle_licensing',
    'customs_enforcement',
    'immigration',
    'criminal_investigation',
    'environmental_protection',
]

// ─── Helper Functions ──────────────────────────────────────────────────────────

export function isEmergencyCategory(category: string): boolean {
    return EMERGENCY_SET.has(category)
}

export function isViolationCategory(category: string): boolean {
    return !EMERGENCY_SET.has(category)
}

export function isStage3Category(category: string): boolean {
    return STAGE_3_SET.has(category)
}

export function getReportTrack(category: string): ReportTrack {
    return CATEGORY_CONFIG[category]?.track ?? 'live_dispatch'
}

export function requiresEvidence(category: string): boolean {
    return CATEGORY_CONFIG[category]?.requiresEvidence ?? false
}

export function generatesCaseNumber(category: string): boolean {
    return CATEGORY_CONFIG[category]?.generatesCaseNumber ?? false
}

export function getPrimaryAgencyType(category: string): AgencyTypeKey {
    return (CATEGORY_CONFIG[category]?.agencyTypes[0] ?? 'law_enforcement') as AgencyTypeKey
}

export function getSecondaryAgencyTypes(category: string): AgencyTypeKey[] {
    return (CATEGORY_CONFIG[category]?.agencyTypes.slice(1) ?? []) as AgencyTypeKey[]
}

export function getAllAgencyTypes(category: string): AgencyTypeKey[] {
    return (CATEGORY_CONFIG[category]?.agencyTypes ?? ['law_enforcement']) as AgencyTypeKey[]
}

export function getCategoriesForAgencyType(agencyTypeKey: string): string[] {
    return Object.entries(CATEGORY_CONFIG)
        .filter(([, cfg]) => cfg.agencyTypes.includes(agencyTypeKey as AgencyTypeKey))
        .map(([key]) => key)
}

export function isComplaintQueueAgencyType(agencyTypeKey: string): boolean {
    return COMPLAINT_QUEUE_AGENCY_TYPES.includes(agencyTypeKey as AgencyTypeKey)
}

const HIGH_PRIORITY_VIOLATIONS = new Set<string>([
    'drug_dealing', 'drug_use_public', 'child_abuse', 'domestic_violence',
    'drunk_driving', 'colorum_vehicle', 'smuggling',
])

export function getDispatchPriority(category: string): DispatchPriority {
    if (STAGE_3_SET.has(category)) return 'CRITICAL'
    if (EMERGENCY_SET.has(category)) return 'HIGH'
    return HIGH_PRIORITY_VIOLATIONS.has(category) ? 'MEDIUM' : 'LOW'
}

export function getDispatchCardColor(category: string): string {
    switch (getDispatchPriority(category)) {
        case 'CRITICAL': return '#FF0000'
        case 'HIGH': return '#CD0E11'
        case 'MEDIUM': return '#F59E0B'
        case 'LOW': return '#3B82F6'
    }
}

// ─── Post-Copy Verification ────────────────────────────────────────────────────
/*
  After copying, verify:

  [ ] isEmergencyCategory('assault')            === true
  [ ] isEmergencyCategory('illegal_parking')    === false
  [ ] isStage3Category('active_shooter')        === true
  [ ] isStage3Category('drug_laboratory')       === true
  [ ] isStage3Category('bomb_threat')           === true
  [ ] isStage3Category('human_trafficking')     === true
  [ ] isStage3Category('assault')               === false
  [ ] getReportTrack('fraud')                   === 'complaint_queue'
  [ ] getReportTrack('fire')                    === 'live_dispatch'
  [ ] requiresEvidence('unregistered_vehicle')  === true
  [ ] requiresEvidence('assault')               === false
  [ ] generatesCaseNumber('cybercrime')         === true
  [ ] generatesCaseNumber('robbery')            === false
  [ ] getPrimaryAgencyType('drug_dealing')      === 'drug_enforcement'
  [ ] getPrimaryAgencyType('illegal_parking')   === 'traffic_management'
  [ ] getDispatchPriority('bomb_threat')        === 'CRITICAL'
  [ ] getDispatchPriority('fire')               === 'HIGH'
  [ ] getDispatchPriority('drug_dealing')       === 'MEDIUM'
  [ ] getDispatchPriority('illegal_dumping')    === 'LOW'
  [ ] getDispatchCardColor('active_shooter')    === '#FF0000'
  [ ] Object.keys(CATEGORY_CONFIG).length       === 89
*/