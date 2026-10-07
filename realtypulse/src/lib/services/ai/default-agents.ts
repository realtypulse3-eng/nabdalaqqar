// Default agent registry created for every new organization. These are
// real rows in `ai_agents` with status 'idle' and zero run history —
// nothing here is a fabricated result. An agent only shows activity
// once someone actually triggers it via runAgent().

export const DEFAULT_AGENTS = [
  {
    key: 'lead_intelligence',
    name: 'Lead Intelligence',
    description: 'Analyzes inbound leads and enriches CRM records with source, intent, and budget signals.',
    icon: 'radar',
    capabilities: ['lead-enrichment', 'intent-scoring'],
  },
  {
    key: 'lead_qualifier',
    name: 'Lead Qualifier',
    description: 'Scores and routes new leads based on your qualification criteria.',
    icon: 'filter',
    capabilities: ['lead-scoring', 'routing'],
  },
  {
    key: 'property_match',
    name: 'Property Match',
    description: 'Matches qualified leads against your active property portfolio.',
    icon: 'home',
    capabilities: ['property-matching'],
  },
  {
    key: 'revenue_predictor',
    name: 'Revenue Predictor',
    description: 'Forecasts pipeline revenue from open and in-progress deals.',
    icon: 'trending-up',
    capabilities: ['forecasting'],
  },
  {
    key: 'market_intel',
    name: 'Market Intel',
    description: 'Summarizes local market conditions relevant to your active listings.',
    icon: 'globe',
    capabilities: ['market-research'],
  },
  {
    key: 'daily_digest',
    name: 'Daily Digest',
    description: 'Compiles a daily summary of pipeline activity for your team.',
    icon: 'file-text',
    capabilities: ['reporting'],
  },
  {
    key: 'follow_up_bot',
    name: 'Follow-Up Bot',
    description: 'Drafts follow-up messages for leads and clients awaiting a response.',
    icon: 'message-circle',
    capabilities: ['drafting', 'multi-lingual'],
  },
  {
    key: 'conversion_auditor',
    name: 'Conversion Auditor',
    description: 'Reviews the pipeline for stalled deals and conversion bottlenecks.',
    icon: 'search',
    capabilities: ['pipeline-analysis'],
  },
  {
    key: 'comms_engine',
    name: 'Comms Engine',
    description: 'Drafts and translates buyer communications across channels.',
    icon: 'mail',
    capabilities: ['drafting', 'translation'],
  },
  {
    key: 'omni_ads',
    name: 'Omni-Ads Agent',
    description: 'Drafts and reports on ad campaign performance across channels.',
    icon: 'megaphone',
    capabilities: ['campaign-drafting'],
  },
  {
    key: 'appointment_sync',
    name: 'Appointment Sync',
    description: 'Coordinates viewing schedules between agents and clients.',
    icon: 'calendar',
    capabilities: ['scheduling'],
  },
] as const;
