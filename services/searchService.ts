import { INCIDENT_TYPES, SEARCH_ALIASES, IncidentType } from '../constants/incidentTypes';

export interface SearchResult {
  key: string;
  config: IncidentType;
  score: number;
  matchReason: 'exact' | 'starts_with' | 'contains' | 'keyword' | 'alias';
}

/**
 * Search incidents with fuzzy matching and weighted scoring
 */
export function searchIncidents(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  Object.entries(INCIDENT_TYPES).forEach(([key, config]) => {
    let score = 0;
    let matchReason: SearchResult['matchReason'] = 'contains';

    const label = config.citizenLabel.toLowerCase();
    const tagalog = config.tagalog.toLowerCase();

    // Exact match (highest priority)
    if (label === normalizedQuery || tagalog === normalizedQuery) {
      score += 100;
      matchReason = 'exact';
    } else if (label.startsWith(normalizedQuery) || tagalog.startsWith(normalizedQuery)) {
      score += 80;
      matchReason = 'starts_with';
    } else if (label.includes(normalizedQuery) || tagalog.includes(normalizedQuery)) {
      score += 50;
      matchReason = 'contains';
    }

    // Keyword match
    const keywordMatch = config.searchKeywords.some(
      kw => kw.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(kw.toLowerCase())
    );
    if (keywordMatch) {
      score += 60;
      matchReason = score > 60 ? matchReason : 'keyword';
    }

    // Alias match
    const aliasMatches = SEARCH_ALIASES[normalizedQuery];
    if (aliasMatches?.includes(key)) {
      score += 70;
      matchReason = score > 70 ? matchReason : 'alias';
    }

    // Priority boosts
    if (config.isEmergency) score += 20;
    if (config.track === 'live_dispatch') score += 10;

    if (score > 0) {
      results.push({ key, config, score, matchReason });
    }
  });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Get quick access incident keys (most common emergencies)
 */
export function getQuickAccessIncidents(): string[] {
  return ['robbery', 'fire', 'medical_emergency', 'accident_with_injury', 'rescue'];
}
