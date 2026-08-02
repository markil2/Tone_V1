import { formatDuration } from '../entities/dashboard';
import type { DashboardMetrics, MuscleData } from '../entities/dashboard';
import { MUSCLE_LABELS } from '../entities/muscles';

/**
 * The AI Coach's answers — for now, a deterministic generator over the same
 * numbers the dashboard is already showing.
 *
 * A mock rather than a real model call by design at this stage: the Anthropic key
 * must never ship in the bundle (it would be readable by anyone with the app), so
 * real inference belongs in an Edge Function over aggregated summaries. Until
 * that exists, this keeps the panel honest — every sentence is traceable to a
 * value on screen, and the panel says plainly that it is not a live model.
 *
 * Guardrails baked in: general wellness and training guidance only, no diagnosis,
 * no prescriptions, and no claims about anything the app has not measured.
 */

export type CoachTopic = 'today' | 'training' | 'recovery' | 'sleep';

export type CoachMessage = {
  topic: CoachTopic;
  question: string;
  answer: string;
};

export const COACH_TOPICS: { topic: CoachTopic; question: string }[] = [
  { topic: 'today', question: 'What should I do today?' },
  { topic: 'training', question: 'Am I ready to train hard?' },
  { topic: 'recovery', question: 'How is my recovery trending?' },
  { topic: 'sleep', question: 'Is my sleep helping?' },
];

function heaviestLoad(muscles: readonly MuscleData[]): MuscleData | null {
  return muscles.reduce<MuscleData | null>(
    (heaviest, muscle) =>
      heaviest === null || muscle.trainingLoad > heaviest.trainingLoad ? muscle : heaviest,
    null,
  );
}

function answerFor(topic: CoachTopic, metrics: DashboardMetrics): string {
  const loaded = heaviestLoad(metrics.muscles);
  const fatigued = metrics.muscles.filter((muscle) => muscle.status === 'fatigued');

  switch (topic) {
    case 'today': {
      if (loaded === null) {
        return `Recovery is at ${metrics.recovery}% and strain at ${metrics.strain}%. Nothing is flagged, so train the way you had planned and see how it feels.`;
      }
      return `Your recovery is ${
        metrics.recovery >= 65 ? 'good' : 'still coming back'
      }, but your ${MUSCLE_LABELS[
        loaded.id
      ].toLowerCase()} are carrying a ${loaded.trainingLoad}% training load. Consider lighter work there today, or mobility instead.`;
    }

    case 'training': {
      if (metrics.strain >= 70) {
        return `Strain is at ${metrics.strain}%, which is on the high side. A hard session on top of that tends to cost more than it returns — an easy or technical day is the better trade.`;
      }
      if (metrics.recovery >= 70) {
        return `Recovery at ${metrics.recovery}% and strain at ${metrics.strain}% both point the right way. This is a reasonable day to push, as long as you warm up properly.`;
      }
      return `Recovery is ${metrics.recovery}% and strain is ${metrics.strain}%. That is a middling picture — start the session, and let the first few sets tell you whether to add load.`;
    }

    case 'recovery': {
      const direction =
        metrics.recoveryChange > 0
          ? `up ${metrics.recoveryChange} points`
          : metrics.recoveryChange < 0
            ? `down ${Math.abs(metrics.recoveryChange)} points`
            : 'flat';
      const tail =
        fatigued.length > 0
          ? ` ${fatigued.length} ${
              fatigued.length === 1 ? 'muscle group is' : 'muscle groups are'
            } still marked fatigued, so keep an eye on those.`
          : ' Nothing is flagged as fatigued right now.';
      return `Recovery is ${metrics.recovery}% today, ${direction} on yesterday.${tail}`;
    }

    case 'sleep': {
      const gap = metrics.sleepTargetMinutes - metrics.sleepDurationMinutes;
      const versus =
        gap > 0
          ? `about ${formatDuration(gap)} under your ${formatDuration(
              metrics.sleepTargetMinutes,
            )} goal`
          : `at or above your ${formatDuration(metrics.sleepTargetMinutes)} goal`;
      return `You slept ${formatDuration(metrics.sleepDurationMinutes)} with ${formatDuration(
        metrics.deepSleepMinutes,
      )} deep — ${versus}. Sleep is the single biggest input to the recovery score, so consistency here moves everything else.`;
    }
  }
}

export function generateCoachMessage(
  topic: CoachTopic,
  metrics: DashboardMetrics,
): CoachMessage {
  const question =
    COACH_TOPICS.find((entry) => entry.topic === topic)?.question ?? 'What should I do today?';

  return { topic, question, answer: answerFor(topic, metrics) };
}
