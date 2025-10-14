// Canonical stages with probabilities and order
export const CANONICAL_STAGES = [
  'Prospecting',
  'Qualification', 
  'Approach/Discovery',
  'Presentation/POC',
  'Proposal/Negotiation',
  'Closed Won',
  'Closed Lost'
] as const;

export const OPEN_STAGES = [
  'Qualification',
  'Approach/Discovery', 
  'Presentation/POC',
  'Proposal/Negotiation'
] as const;

export const CLOSED_STAGES = [
  'Closed Won',
  'Closed Lost'
] as const;

export const STAGE_PROBABILITIES: Record<string, number> = {
  // Cumulative progress based on stage point mapping: 10,10,20,20,20,20
  'Prospecting': 0.10,
  'Qualification': 0.20,
  'Approach/Discovery': 0.40,
  'Presentation/POC': 0.60,
  'Proposal/Negotiation': 0.80,
  'Closed Won': 1.00,
  'Closed Lost': 0.00,
};

export const FORECAST_CATEGORIES = {
  Pipeline: ['Prospecting', 'Qualification', 'Approach/Discovery'],
  'Best Case': ['Presentation/POC'],
  Commit: ['Proposal/Negotiation'],
  Closed: ['Closed Won', 'Closed Lost']
} as const;

// Helper functions
export const formatCurrency = (amount: number, currency = 'IDR'): string => {
  const decimals = currency === 'IDR' || currency === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const formatDate = (date: string | null): string => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const getCountdown = (date: string | null): { text: string; isOverdue: boolean } => {
  if (!date) return { text: 'No date', isOverdue: false };
  
  const targetDate = new Date(date);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return { text: `in ${diffDays} days`, isOverdue: false };
  } else if (diffDays === 0) {
    return { text: 'today', isOverdue: false };
  } else {
    return { text: `${Math.abs(diffDays)} days`, isOverdue: true };
  }
};

// Performance scoring rules per stage
// Points are awarded if the opportunity is within the timeline for the current stage.
// Reference: Manager-decided timelines and points.
export const STAGE_PERFORMANCE_RULES: Record<string, { timelineDays: number; points: number }> = {
  'Prospecting': { timelineDays: 7, points: 10 },
  'Qualification': { timelineDays: 7, points: 15 },
  'Approach/Discovery': { timelineDays: 7, points: 20 },
  'Presentation/POC': { timelineDays: 7, points: 15 },
  'Proposal/Negotiation': { timelineDays: 7, points: 20 },
  'Closed Won': { timelineDays: 30, points: 20 },
  'Closed Lost': { timelineDays: 30, points: 0 },
};

// Compute performance score for a given opportunity
export const computePerformanceScore = (opp: {
  stage?: string | null;
  days_in_stage?: number | null;
  stage_entered_at?: string | null;
  created_at?: string | null;
}): number => {
  const stage = opp.stage || '';
  const rule = STAGE_PERFORMANCE_RULES[stage];
  if (!rule) return 0;

  const now = new Date();
  const toDays = (ms: number) => Math.ceil(ms / (1000 * 60 * 60 * 24));

  // Prefer explicit days_in_stage if present
  let daysInStage: number | null = typeof opp.days_in_stage === 'number' ? opp.days_in_stage : null;

  if (daysInStage == null) {
    // Fallback to stage_entered_at
    const enteredAt = opp.stage_entered_at || opp.created_at;
    if (enteredAt) {
      const enteredDate = new Date(enteredAt);
      daysInStage = toDays(now.getTime() - enteredDate.getTime());
    }
  }

  // For closed stages, measure from creation to now if we don't have days_in_stage
  if ((stage === 'Closed Won' || stage === 'Closed Lost') && daysInStage == null) {
    const created = opp.created_at ? new Date(opp.created_at) : now;
    daysInStage = toDays(now.getTime() - created.getTime());
  }

  // If we still cannot determine, return 0
  if (daysInStage == null) return 0;

  // Award full points if within timeline, otherwise 0 for simplicity
  return daysInStage <= rule.timelineDays ? rule.points : 0;
};

// Compute cumulative performance score up to the current stage.
// Past stages are assumed completed; current stage is gated by its timeline.
export const computeCumulativePerformanceScore = (opp: {
  stage?: string | null;
  days_in_stage?: number | null;
  stage_entered_at?: string | null;
  created_at?: string | null;
}): number => {
  const stage = opp.stage || '';
  if (stage === 'Closed Lost') return 0;

  const currentIndex = CANONICAL_STAGES.indexOf(stage as any);
  if (currentIndex < 0) return 0;

  // Sum points from all previous stages (assumed achieved)
  let total = 0;
  for (let i = 0; i < currentIndex; i++) {
    const s = CANONICAL_STAGES[i];
    total += STAGE_PERFORMANCE_RULES[s]?.points || 0;
  }

  // Add current stage points only if within timeline using computePerformanceScore
  total += computePerformanceScore(opp);

  return total;
};