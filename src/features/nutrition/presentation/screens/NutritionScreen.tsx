import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedThemeProvider, Stack, Text, useTheme } from '@/design-system';
import { useSession } from '@/features/auth';
import { DashboardHeader, useDashboard } from '@/features/dashboard';
import { useProfile } from '@/features/profile';
import type { Meal, Micronutrient } from '../../domain/entities/nutrition';
import { generateGuidance } from '../../domain/use-cases/generate-guidance';
import { AIGuidanceCard } from '../components/AIGuidanceCard';
import { EnergyCard } from '../components/EnergyCard';
import { HydrationCard } from '../components/HydrationCard';
import { MealCard } from '../components/MealCard';
import { MealLogger, type LogMethod } from '../components/MealLogger';
import { PhotoFoodLogger } from '../components/PhotoFoodLogger';
import { MicronutrientsCard } from '../components/MicronutrientsCard';
import {
  GuidanceModal,
  LogMethodModal,
  MealDetailsModal,
  MicronutrientModal,
  NutritionOverviewModal,
  SupplementsModal,
} from '../components/NutritionModals';
import { SupplementsCard } from '../components/SupplementsCard';
import { useNutrition } from '../hooks/useNutrition';

const MAX_WIDTH = 720;

type OpenPanel =
  | { kind: 'overview' }
  | { kind: 'meal'; mealId: string }
  | { kind: 'micro'; microId: string }
  | { kind: 'supplements' }
  | { kind: 'guidance' }
  | { kind: 'photo' }
  | { kind: 'logMethod'; method: 'photo' | 'barcode' | 'voice' }
  | null;

/** Staggered entrance, so the page assembles rather than snapping in all at once. */
function Section({ index, children }: { index: number; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(index * 60).duration(320)}
    >
      {children}
    </Animated.View>
  );
}

export type NutritionScreenProps = {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
};

export function NutritionScreen(props: NutritionScreenProps) {
  return (
    <FixedThemeProvider scheme="dark">
      <NutritionContent {...props} />
    </FixedThemeProvider>
  );
}

function NutritionContent({ onOpenProfile, onOpenSettings }: NutritionScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { data: profile } = useProfile();
  const { data: dashboard } = useDashboard();
  const { day, consumed, isLoading, actions } = useNutrition();

  const [panel, setPanel] = useState<OpenPanel>(null);

  const guidance = useMemo(
    () =>
      day
        ? generateGuidance({
            nutrition: day,
            recovery: dashboard?.recovery ?? null,
            strain: dashboard?.strain ?? null,
          })
        : [],
    [day, dashboard],
  );

  const container = { flex: 1, backgroundColor: theme.colors.dashboard.backdrop } as const;

  if (isLoading || !day || !consumed) {
    return (
      <View style={[container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Stack gap="lg" align="center">
          <ActivityIndicator color={theme.colors.accent} />
          <Text variant="callout" color="muted">
            Loading today’s nutrition…
          </Text>
        </Stack>
      </View>
    );
  }

  const openMeal = (meal: Meal) => setPanel({ kind: 'meal', mealId: meal.id });
  const openMicro = (micro: Micronutrient) => setPanel({ kind: 'micro', microId: micro.id });

  const handleLogMethod = (method: LogMethod) => {
    if (method === 'manual') {
      // Manual entry belongs to a meal, so send the user to the first unlogged
      // slot rather than asking which one they meant.
      const target = day.meals.find((meal) => meal.foods.length === 0) ?? day.meals[0];
      if (target) setPanel({ kind: 'meal', mealId: target.id });
      return;
    }
    if (method === 'photo') {
      setPanel({ kind: 'photo' });
      return;
    }
    setPanel({ kind: 'logMethod', method });
  };

  const selectedMeal =
    panel?.kind === 'meal' ? day.meals.find((meal) => meal.id === panel.mealId) : undefined;
  const selectedMicro =
    panel?.kind === 'micro'
      ? day.micronutrients.find((micro) => micro.id === panel.microId)
      : undefined;

  return (
    <View style={container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: theme.spacing['2xl'],
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.lg,
          maxWidth: MAX_WIDTH,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Stack direction="row" justify="space-between" align="flex-start" gap="lg">
          <Stack gap="xs" flex={1}>
            <Text variant="display">Nutrition</Text>
            <Text variant="body" color="muted">
              Fuel your recovery
            </Text>
          </Stack>

          <DashboardHeader
            displayName={profile?.displayName ?? null}
            email={session?.user.email ?? null}
            onOpenProfile={onOpenProfile}
            onOpenSettings={onOpenSettings}
          />
        </Stack>

        <Section index={0}>
          <EnergyCard
            consumed={consumed}
            targets={day.targets}
            onPress={() => setPanel({ kind: 'overview' })}
          />
        </Section>

        <Section index={1}>
          <MealLogger onSelect={handleLogMethod} />
        </Section>

        <Section index={2}>
          <MealCard meals={day.meals} onSelect={openMeal} />
        </Section>

        <Section index={3}>
          <MicronutrientsCard micronutrients={day.micronutrients} onSelect={openMicro} />
        </Section>

        <Section index={4}>
          <HydrationCard
            water={day.water}
            onAddCup={actions.addCup}
            onAddBottle={actions.addBottle}
            onUndo={actions.undoWater}
          />
        </Section>

        <Section index={5}>
          <SupplementsCard
            supplements={day.supplements}
            onOpen={() => setPanel({ kind: 'supplements' })}
          />
        </Section>

        <Section index={6}>
          <AIGuidanceCard guidance={guidance} onPress={() => setPanel({ kind: 'guidance' })} />
        </Section>

        <Text variant="caption" color="muted" align="center">
          Intake and micronutrient figures are sample data until food logging is connected.
        </Text>
      </ScrollView>

      {panel?.kind === 'overview' ? (
        <NutritionOverviewModal
          consumed={consumed}
          targets={day.targets}
          onClose={() => setPanel(null)}
        />
      ) : null}

      {selectedMeal ? (
        <MealDetailsModal
          meal={selectedMeal}
          onClose={() => setPanel(null)}
          onAddFood={(food) => actions.addFood(selectedMeal.id, food)}
          onRemoveFood={(foodId) => actions.removeFood(selectedMeal.id, foodId)}
          onClear={() => actions.clearMeal(selectedMeal.id)}
          onDuplicate={() => {
            actions.duplicateMeal(selectedMeal.id);
            setPanel(null);
          }}
          onRename={(name) => actions.renameMeal(selectedMeal.id, name)}
        />
      ) : null}

      {selectedMicro ? (
        <MicronutrientModal micro={selectedMicro} onClose={() => setPanel(null)} />
      ) : null}

      {panel?.kind === 'supplements' ? (
        <SupplementsModal
          supplements={day.supplements}
          onClose={() => setPanel(null)}
          onToggle={actions.toggleSupplement}
          onRemove={actions.removeSupplement}
          onAdd={actions.addSupplement}
        />
      ) : null}

      {panel?.kind === 'guidance' ? (
        <GuidanceModal guidance={guidance} onClose={() => setPanel(null)} />
      ) : null}

      {panel?.kind === 'photo' ? (
        <PhotoFoodLogger
          meals={day.meals}
          onClose={() => setPanel(null)}
          onSave={(mealId, food) => actions.addFood(mealId, food)}
        />
      ) : null}

      {panel?.kind === 'logMethod' ? (
        <LogMethodModal
          method={panel.method}
          onClose={() => setPanel(null)}
          onUseManual={() => handleLogMethod('manual')}
        />
      ) : null}
    </View>
  );
}
