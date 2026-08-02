import type { DashboardMetrics } from '../entities/dashboard';

/**
 * Breaks a headline score into the things that moved it.
 *
 * Every factor below is computed from a value already on the dashboard, never
 * invented — if a contributor genuinely has no data source yet it says so rather
 * than showing a plausible-looking number. A metric explanation that quietly
 * fabricates its own inputs is worse than no explanation.
 */

export type MetricFactor = {
  label: string;
  /** Null when nothing feeds this factor yet. */
  value: number | null;
  hint: string;
};

export type MetricExplanation = {
  title: string;
  headline: string;
  factors: MetricFactor[];
  recommendation: string;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function muscleReadiness(metrics: DashboardMetrics): number {
  return average(metrics.muscles.map((muscle) => muscle.recovery));
}

function averageLoad(metrics: DashboardMetrics): number {
  return average(metrics.muscles.map((muscle) => muscle.trainingLoad));
}

export function explainEnergy(metrics: DashboardMetrics): MetricExplanation {
  return {
    title: 'Energy potential',
    headline: `${metrics.energyPotential}% — how much you have available to spend today.`,
    factors: [
      {
        label: 'Sleep',
        value: metrics.sleepScore,
        hint: 'Last night’s sleep score.',
      },
      {
        label: 'Recovery',
        value: metrics.recovery,
        hint: 'How far your body has bounced back.',
      },
      {
        label: 'Activity headroom',
        value: 100 - metrics.strain,
        hint: 'What is left before today’s strain adds up.',
      },
      {
        label: 'Nutrition',
        value: null,
        hint: 'No food logged yet — start logging on the Nutrition tab and this fills in.',
      },
    ],
    recommendation:
      metrics.energyPotential >= 70
        ? 'Good day to take on the harder thing you have been putting off.'
        : 'Keep the day’s demands modest and protect tonight’s sleep.',
  };
}

export function explainRecovery(metrics: DashboardMetrics): MetricExplanation {
  const readiness = muscleReadiness(metrics);

  return {
    title: 'Recovery',
    headline: `${metrics.recovery}% recovered, ${
      metrics.recoveryChange >= 0 ? 'up' : 'down'
    } ${Math.abs(metrics.recoveryChange)} points on yesterday.`,
    factors: [
      {
        label: 'Sleep contribution',
        value: metrics.sleepScore,
        hint: 'The largest single input to this score.',
      },
      {
        label: 'Muscle readiness',
        value: readiness,
        hint: 'Averaged across all tracked muscle groups.',
      },
      {
        label: 'Overnight change',
        value: metrics.recoveryChange,
        hint: 'Points gained or lost since yesterday.',
      },
    ],
    recommendation:
      metrics.recovery >= 70
        ? 'You are recovered enough to train as planned.'
        : 'Favour lighter work today and revisit tomorrow.',
  };
}

export function explainStrain(metrics: DashboardMetrics): MetricExplanation {
  return {
    title: 'Strain',
    headline: `${metrics.strain}% of a demanding day accumulated so far.`,
    factors: [
      {
        label: 'Recent training load',
        value: averageLoad(metrics),
        hint: 'Averaged across your tracked muscle groups.',
      },
      {
        label: 'Recovery offset',
        value: metrics.recovery,
        hint: 'Higher recovery means the same work costs you less.',
      },
      {
        label: 'Workouts today',
        value: null,
        hint: 'No workouts logged yet — log one on the Training tab and this updates.',
      },
    ],
    recommendation:
      metrics.strain >= 70
        ? 'Anything else today is best kept easy — mobility, walking, or rest.'
        : 'There is room for a normal session. Warm up properly and stop if form goes.',
  };
}

export function explainMetric(
  metric: 'energyPotential' | 'recovery' | 'strain',
  metrics: DashboardMetrics,
): MetricExplanation {
  switch (metric) {
    case 'energyPotential':
      return explainEnergy(metrics);
    case 'recovery':
      return explainRecovery(metrics);
    case 'strain':
      return explainStrain(metrics);
  }
}
