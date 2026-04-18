/**
 * AERIS Incident Type Configuration
 * Defines all reportable incidents, agency routing, and search metadata
 */

export type IncidentTrack = 'live_dispatch' | 'complaint_queue';

export interface IncidentType {
  agencies: string[];
  track: IncidentTrack;
  isEmergency: boolean;
  citizenLabel: string;
  requiresEvidence: boolean;
  searchKeywords: string[];
  tagalog: string;
  icon?: string;
  description?: string;
  nbiOfficeReferral?: boolean;
}

export const INCIDENT_TYPES: Record<string, IncidentType> = {
  // ─── POLICE — LIVE DISPATCH ──────────────────────────────────────
  crime: {
    agencies: ['police'],
    track: 'live_dispatch',
    isEmergency: false,
    citizenLabel: 'Crime',
    requiresEvidence: false,
    searchKeywords: ['crime', 'krimen', 'illegal', 'violation'],
    tagalog: 'Krimen',
    icon: '🚨',
  },

  robbery: {
    agencies: ['police'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Robbery',
    requiresEvidence: false,
    searchKeywords: ['robbery', 'holdap', 'holdup', 'nakawan', 'theft in progress', 'mugging', 'snatcher', 'agawan'],
    tagalog: 'Holdup / Nakawan',
    icon: '💰',
    description: 'Someone taking property by force or threat',
  },

  assault: {
    agencies: ['police'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Assault',
    requiresEvidence: false,
    searchKeywords: ['assault', 'attack', 'violence', 'away', 'suntok', 'bugbog', 'beating', 'fight'],
    tagalog: 'Pag-atake / Away',
    icon: '👊',
  },

  theft: {
    agencies: ['police'],
    track: 'live_dispatch',
    isEmergency: false,
    citizenLabel: 'Theft',
    requiresEvidence: false,
    searchKeywords: ['theft', 'stealing', 'nakaw', 'nagnakaw', 'burglary', 'shoplifting'],
    tagalog: 'Pagnanakaw',
    icon: '🔓',
  },

  domestic_violence: {
    agencies: ['police'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Domestic Violence',
    requiresEvidence: false,
    searchKeywords: ['domestic violence', 'family violence', 'abuse', 'wife beating', 'child abuse', 'battered'],
    tagalog: 'Pang-aabuso sa Pamilya',
    icon: '🏠',
  },

  public_disturbance: {
    agencies: ['police'],
    track: 'live_dispatch',
    isEmergency: false,
    citizenLabel: 'Public Disturbance',
    requiresEvidence: false,
    searchKeywords: ['disturbance', 'noise', 'fight', 'gulo', 'riot', 'brawl'],
    tagalog: 'Kaguluhan sa Publiko',
    icon: '📢',
  },

  trespassing: {
    agencies: ['police'],
    track: 'live_dispatch',
    isEmergency: false,
    citizenLabel: 'Trespassing',
    requiresEvidence: false,
    searchKeywords: ['trespassing', 'intruder', 'break in', 'unauthorized entry', 'walang pahintulot'],
    tagalog: 'Panghihimasok',
    icon: '🚪',
  },

  drug_use_public: {
    agencies: ['police'],
    track: 'complaint_queue',
    isEmergency: false,
    citizenLabel: 'Drug Use (Public)',
    requiresEvidence: true,
    searchKeywords: ['drugs', 'droga', 'drug use', 'shabu', 'marijuana', 'marijuana', 'high'],
    tagalog: 'Paggamit ng Droga',
    icon: '💊',
    nbiOfficeReferral: true,
  },

  drug_dealing: {
    agencies: ['police'],
    track: 'complaint_queue',
    isEmergency: false,
    citizenLabel: 'Drug Dealing',
    requiresEvidence: true,
    searchKeywords: ['drug dealing', 'drug sale', 'pusher', 'drug trafficking', 'nagbebenta ng droga'],
    tagalog: 'Pagbebenta ng Droga',
    icon: '🚫',
    nbiOfficeReferral: true,
  },

  // ─── FIRE — LIVE DISPATCH ────────────────────────────────────────
  fire: {
    agencies: ['fire'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Fire',
    requiresEvidence: false,
    searchKeywords: ['fire', 'sunog', 'flames', 'smoke', 'burning', 'apoy', 'nasusunog'],
    tagalog: 'Sunog',
    icon: '🔥',
    description: 'Active fire requiring immediate response',
  },

  gas_leak: {
    agencies: ['fire', 'rescue'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Gas Leak',
    requiresEvidence: false,
    searchKeywords: ['gas leak', 'lpg', 'smell gas', 'amoy gas', 'gas odor'],
    tagalog: 'Tagas ng Gas',
    icon: '⚠️',
  },

  // ─── MEDICAL — LIVE DISPATCH ─────────────────────────────────────
  medical_emergency: {
    agencies: ['medical'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Medical Emergency',
    requiresEvidence: false,
    searchKeywords: ['medical emergency', 'ambulance', 'sick', 'may sakit', 'injury', 'sugat', 'bleeding'],
    tagalog: 'Medikal na Emergency',
    icon: '🏥',
  },

  cardiac_arrest: {
    agencies: ['medical'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Cardiac Arrest',
    requiresEvidence: false,
    searchKeywords: ['heart attack', 'cardiac arrest', 'chest pain', 'puso', 'atake sa puso'],
    tagalog: 'Atake sa Puso',
    icon: '❤️',
  },

  accident_with_injury: {
    agencies: ['medical', 'police'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Accident with Injury',
    requiresEvidence: false,
    searchKeywords: ['accident', 'aksidente', 'crash', 'collision', 'bangga', 'injured', 'nasugatan'],
    tagalog: 'Aksidente na may Sugat',
    icon: '🚑',
  },

  // ─── RESCUE — LIVE DISPATCH ──────────────────────────────────────
  rescue: {
    agencies: ['rescue', 'fire'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Rescue Needed',
    requiresEvidence: false,
    searchKeywords: ['rescue', 'trapped', 'nakulong', 'nabaon', 'stuck', 'help', 'sagipin'],
    tagalog: 'Kailangan ng Sagipin',
    icon: '🛟',
  },

  drowning: {
    agencies: ['rescue', 'medical'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Drowning',
    requiresEvidence: false,
    searchKeywords: ['drowning', 'lunod', 'nalulunod', 'water emergency', 'swimming accident'],
    tagalog: 'Nalulunod',
    icon: '🌊',
  },

  typhoon_flood: {
    agencies: ['rescue', 'fire', 'medical'],
    track: 'live_dispatch',
    isEmergency: true,
    citizenLabel: 'Typhoon / Flood',
    requiresEvidence: false,
    searchKeywords: ['flood', 'baha', 'typhoon', 'bagyo', 'storm', 'water rising'],
    tagalog: 'Bagyo / Baha',
    icon: '🌀',
  },

  // ─── MMDA — LIVE DISPATCH ────────────────────────────────────────
  illegal_parking: {
    agencies: ['mmda', 'police'],
    track: 'live_dispatch',
    isEmergency: false,
    citizenLabel: 'Illegal Parking',
    requiresEvidence: false,
    searchKeywords: ['illegal parking', 'blocking', 'harang', 'double park', 'bawal na paradahan', 'wrong parking'],
    tagalog: 'Bawal na Paradahan',
    icon: '🚗',
  },

  reckless_driving: {
    agencies: ['mmda', 'police'],
    track: 'live_dispatch',
    isEmergency: false,
    citizenLabel: 'Reckless Driving',
    requiresEvidence: false,
    searchKeywords: ['reckless driving', 'dangerous driving', 'speeding', 'mabilis', 'counterflow'],
    tagalog: 'Mapanganib na Pagmamaneho',
    icon: '🏎️',
  },

  road_accident_no_injury: {
    agencies: ['mmda', 'police'],
    track: 'live_dispatch',
    isEmergency: false,
    citizenLabel: 'Road Accident (No Injury)',
    requiresEvidence: false,
    searchKeywords: ['accident', 'fender bender', 'bangga', 'car crash', 'minor accident', 'no injury'],
    tagalog: 'Aksidente (Walang Sugat)',
    icon: '🚙',
  },

  // ─── ENVIRONMENT — COMPLAINT QUEUE ───────────────────────────────
  illegal_dumping: {
    agencies: ['environment'],
    track: 'complaint_queue',
    isEmergency: false,
    citizenLabel: 'Illegal Dumping',
    requiresEvidence: true,
    searchKeywords: ['illegal dumping', 'trash', 'garbage', 'basura', 'waste', 'tapon', 'litter'],
    tagalog: 'Bawal na Pagtatapon ng Basura',
    icon: '🗑️',
  },

  pollution_noise: {
    agencies: ['environment'],
    track: 'complaint_queue',
    isEmergency: false,
    citizenLabel: 'Noise Pollution',
    requiresEvidence: true,
    searchKeywords: ['noise', 'loud', 'maingay', 'disturbance', 'public disturbance', 'karaoke'],
    tagalog: 'Ingay / Kaingayan',
    icon: '🔊',
  },

  air_pollution: {
    agencies: ['environment'],
    track: 'complaint_queue',
    isEmergency: false,
    citizenLabel: 'Air Pollution',
    requiresEvidence: true,
    searchKeywords: ['smoke', 'usok', 'pollution', 'fumes', 'burning waste', 'black smoke'],
    tagalog: 'Polusyon sa Hangin',
    icon: '💨',
  },
};

// Search alias mapping for natural language queries
export const SEARCH_ALIASES: Record<string, string[]> = {
  // Tagalog shortcuts
  holdap: ['robbery'],
  sunog: ['fire'],
  aksidente: ['accident_with_injury', 'road_accident_no_injury'],
  droga: ['drug_use_public', 'drug_dealing'],
  basura: ['illegal_dumping'],
  baha: ['typhoon_flood'],
  nakawan: ['theft', 'robbery'],
  away: ['assault', 'public_disturbance'],

  // Common phrases
  'break in': ['robbery', 'trespassing'],
  'car accident': ['accident_with_injury', 'road_accident_no_injury'],
  'heart attack': ['cardiac_arrest'],
  'someone drowning': ['drowning'],
  'loud noise': ['pollution_noise', 'public_disturbance'],
  'chest pain': ['cardiac_arrest'],
  'nakalimutan': ['trespassing'],
};
