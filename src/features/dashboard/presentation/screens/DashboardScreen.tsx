import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FixedThemeProvider, Stack, Text, useTheme } from '@/design-system';
import { useSession } from '@/features/auth';
import { useProfile } from '@/features/profile';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { InteractiveBody } from '../components/body/InteractiveBody';
import { MuscleLegend } from '../components/body/MuscleLegend';
import { AICoachPanel } from '../components/AICoachPanel';
import { BodyViewControls } from '../components/BodyViewControls';
import { DailySummaryCard } from '../components/DailySummaryCard';
import { DashboardHeader } from '../components/DashboardHeader';
import { MetricDetailPanel } from '../components/MetricDetailPanel';
import { MetricGaugeRow } from '../components/MetricGaugeRow';
import { MuscleDetailsCard } from '../components/MuscleDetailsCard';
import { MuscleDiscomfortPanel } from '../components/MuscleDiscomfortPanel';
import { SleepCard } from '../components/SleepCard';
import { SleepDetailPanel } from '../components/SleepDetailPanel';
import { useDashboard, type DashboardDependencies } from '../hooks/useDashboard';

const MAX_WIDTH = 1120;

export type DashboardScreenProps = {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  /** Injected by the dev preview so the screen runs with no session or network. */
  dependencies?: DashboardDependencies;
};

/**
 * The dashboard.
 *
 * Composition only — every number, transition and piece of copy comes from
 * `useDashboard` or a child component. Layout is the one thing this file owns,
 * because it is the only place that can know how the pieces relate at each width.
 */
export function DashboardScreen({
  onOpenProfile,
  onOpenSettings,
  dependencies,
}: DashboardScreenProps) {
  return (
    // The dashboard is designed dark-only; see FixedThemeProvider.
    <FixedThemeProvider scheme="dark">
      <DashboardContent
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        dependencies={dependencies}
      />
    </FixedThemeProvider>
  );
}

function DashboardContent({
  onOpenProfile,
  onOpenSettings,
  dependencies,
}: DashboardScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide, isCompact, height } = useBreakpoint();
  const { session } = useSession();
  const { data: profile } = useProfile();
  const [isDiscomfortOpen, setDiscomfortOpen] = useState(false);

  const { data, metrics, isLoading, isError, refetch, panel, actions } =
    useDashboard(dependencies);

  const container = {
    flex: 1,
    backgroundColor: theme.colors.dashboard.backdrop,
  } as const;

  if (isLoading) {
    return (
      <View style={[container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Stack gap="lg" align="center">
          <ActivityIndicator color={theme.colors.accent} />
          <Text variant="callout" color="muted">
            Building your dashboard…
          </Text>
        </Stack>
      </View>
    );
  }

  if (isError || !data || !metrics) {
    return (
      <View style={[container, { justifyContent: 'center', padding: theme.spacing.xl }]}>
        <Stack gap="lg" align="center">
          <Text variant="heading" align="center">
            We couldn’t load your dashboard
          </Text>
          <Text variant="body" color="muted" align="center">
            Your data is safe — this is usually a connection problem.
          </Text>
          <Button label="Try again" onPress={() => void refetch()} fullWidth={false} />
        </Stack>
      </View>
    );
  }

  // The body scales with viewport height so it stays the focal point without
  // pushing the cards below it off-screen on short devices.
  const bodyHeight = Math.min(isWide ? 460 : 380, Math.max(260, height * 0.42));

  const detailColumn = (
    <Stack gap="lg">
      {data.selectedMuscle ? (
        <MuscleDetailsCard muscle={data.selectedMuscle} onClose={actions.clearMuscle} />
      ) : null}
      <SleepCard metrics={metrics} onPress={() => actions.openPanel({ kind: 'sleep' })} />
    </Stack>
  );

  return (
    <View style={container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: theme.spacing['2xl'],
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.xl,
          maxWidth: MAX_WIDTH,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Stack direction="row" justify="space-between" align="flex-start" gap="lg">
          <View style={{ flex: 1 }}>
            <MetricGaugeRow
              data={data}
              onSelect={(metric) => actions.openPanel({ kind: 'metric', metric })}
            />
          </View>

          <DashboardHeader
            displayName={profile?.displayName ?? null}
            email={session?.user.email ?? null}
            onOpenProfile={onOpenProfile}
            onOpenSettings={onOpenSettings}
          />
        </Stack>

        <Button
          label="Log muscle discomfort"
          variant="secondary"
          onPress={() => setDiscomfortOpen(true)}
        />

        {isWide ? (
          <Stack direction="row" gap="xl" align="flex-start">
            <BodyViewControls value={data.selectedBodyView} onChange={actions.setBodyView} />

            <Stack gap="lg" flex={1} align="center">
              <InteractiveBody
                view={data.selectedBodyView}
                muscles={data.muscles}
                highlightedMuscleIds={data.highlightedMuscleIds}
                selectedMuscleId={data.selectedMuscle?.id ?? null}
                onSelect={actions.selectMuscle}
                height={bodyHeight}
              />
              <MuscleLegend view={data.selectedBodyView} />
            </Stack>

            <View style={{ width: 320 }}>{detailColumn}</View>
          </Stack>
        ) : (
          <Stack gap="lg">
            <BodyViewControls value={data.selectedBodyView} onChange={actions.setBodyView} />

            <InteractiveBody
              view={data.selectedBodyView}
              muscles={data.muscles}
              highlightedMuscleIds={data.highlightedMuscleIds}
              selectedMuscleId={data.selectedMuscle?.id ?? null}
              onSelect={actions.selectMuscle}
              height={bodyHeight}
            />

            <MuscleLegend view={data.selectedBodyView} />

            {detailColumn}
          </Stack>
        )}

        <DailySummaryCard summary={data.summary} />

        {isCompact ? null : (
          <Text variant="caption" color="muted" align="center">
            Metrics are estimates from your survey and sample data, not measurements.
          </Text>
        )}
      </ScrollView>

      {panel?.kind === 'metric' ? (
        <MetricDetailPanel
          metric={panel.metric}
          metrics={metrics}
          onClose={actions.closePanel}
        />
      ) : null}

      {panel?.kind === 'sleep' ? (
        <SleepDetailPanel metrics={metrics} onClose={actions.closePanel} />
      ) : null}

      {panel?.kind === 'coach' ? (
        <AICoachPanel metrics={metrics} onClose={actions.closePanel} />
      ) : null}

      {isDiscomfortOpen ? (
        <MuscleDiscomfortPanel metrics={metrics} onClose={() => setDiscomfortOpen(false)} />
      ) : null}
    </View>
  );
}
