import { useState } from 'react';
import { Pressable } from 'react-native';

import { Stack, Text, useTheme } from '@/design-system';
import { useFocusRing } from '@/shared/hooks/useFocusRing';
import type { DashboardMetrics } from '../../domain/entities/dashboard';
import {
  COACH_TOPICS,
  generateCoachMessage,
  type CoachTopic,
} from '../../domain/use-cases/generate-coach-message';
import { GlowCard } from './GlowCard';
import { Panel } from './Panel';

function TopicButton({
  question,
  isActive,
  onPress,
}: {
  question: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { isFocused, focusProps } = useFocusRing();

  return (
    <Pressable
      onPress={onPress}
      {...focusProps}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={question}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm + 2,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor:
          isActive || isFocused ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
        backgroundColor: isActive ? theme.colors.dashboard.glowFaint : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text variant="caption" color={isActive ? 'accent' : 'muted'}>
        {question}
      </Text>
    </Pressable>
  );
}

/**
 * The AI Coach.
 *
 * Every answer is produced locally by `generateCoachMessage` from the numbers
 * already on screen — there is no model call here, and the panel says so. Real
 * inference has to run server-side (an Anthropic key in the bundle would be
 * readable by anyone with the app), so this stays a deterministic stand-in until
 * the Edge Function exists.
 */
export function AICoachPanel({
  metrics,
  onClose,
}: {
  metrics: DashboardMetrics;
  onClose: () => void;
}) {
  const [topic, setTopic] = useState<CoachTopic>('today');
  const message = generateCoachMessage(topic, metrics);

  return (
    <Panel title="AI Coach" subtitle="Based on today’s numbers" onClose={onClose}>
      <Stack direction="row" gap="sm" wrap>
        {COACH_TOPICS.map((entry) => (
          <TopicButton
            key={entry.topic}
            question={entry.question}
            isActive={entry.topic === topic}
            onPress={() => setTopic(entry.topic)}
          />
        ))}
      </Stack>

      <GlowCard active>
        <Stack gap="sm">
          <Text variant="caption" color="accent" style={{ letterSpacing: 0.6 }}>
            {message.question.toUpperCase()}
          </Text>
          <Text variant="body" accessibilityLiveRegion="polite">
            {message.answer}
          </Text>
        </Stack>
      </GlowCard>

      <Text variant="caption" color="muted">
        Generated on your device from your current metrics — not a live model, and not
        medical advice. Server-side analysis arrives with the insights milestone.
      </Text>
    </Panel>
  );
}
