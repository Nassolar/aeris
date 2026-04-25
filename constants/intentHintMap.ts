export const INTENT_HINT_MAP = {
  medical:   { category: 'medical_emergency',  track: 'live_dispatch'   },
  fire:      { category: 'fire',               track: 'live_dispatch'   },
  rescue:    { category: 'rescue',             track: 'live_dispatch'   },
  police:    { category: 'public_disturbance', track: 'live_dispatch'   },
  violation: { category: 'public_disturbance', track: 'complaint_queue' },
} as const;

export type IntentHint = keyof typeof INTENT_HINT_MAP;
