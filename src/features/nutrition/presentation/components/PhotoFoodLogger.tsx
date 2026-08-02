import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';

import { Button, Stack, Text, useTheme } from '@/design-system';
import { GlowCard, Panel } from '@/features/dashboard';
import {
  createId,
  MEAL_SLOT_LABELS,
  type Food,
  type Meal,
} from '../../domain/entities/nutrition';

type FoodProfile = {
  id: string;
  name: string;
  servingG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  isPlantWhole: boolean;
  detailQuestion: string;
  variants: { label: string; multiplier: number }[];
};

const PROFILES: FoodProfile[] = [
  { id: 'ground-beef', name: 'Ground beef', servingG: 113, calories: 287, proteinG: 19, carbsG: 0, fatG: 23, fiberG: 0, isPlantWhole: false, detailQuestion: 'What lean-to-fat ratio is it?', variants: [{ label: '70/30', multiplier: 1.2 }, { label: '80/20', multiplier: 1 }, { label: '90/10', multiplier: 0.72 }, { label: '93/7', multiplier: 0.62 }] },
  { id: 'chicken', name: 'Chicken', servingG: 113, calories: 187, proteinG: 35, carbsG: 0, fatG: 4, fiberG: 0, isPlantWhole: false, detailQuestion: 'What cut is it?', variants: [{ label: 'Breast, skinless', multiplier: 1 }, { label: 'Thigh, skinless', multiplier: 1.25 }, { label: 'Thigh with skin', multiplier: 1.55 }, { label: 'Wing', multiplier: 1.6 }] },
  { id: 'salmon', name: 'Salmon', servingG: 113, calories: 233, proteinG: 25, carbsG: 0, fatG: 14, fiberG: 0, isPlantWhole: false, detailQuestion: 'Which type is closest?', variants: [{ label: 'Atlantic, farmed', multiplier: 1 }, { label: 'Sockeye, wild', multiplier: 0.78 }, { label: 'Coho, wild', multiplier: 0.82 }, { label: 'Canned', multiplier: 0.72 }] },
  { id: 'rice', name: 'Rice', servingG: 158, calories: 205, proteinG: 4.3, carbsG: 45, fatG: 0.4, fiberG: 0.6, isPlantWhole: true, detailQuestion: 'What kind of rice?', variants: [{ label: 'White', multiplier: 1 }, { label: 'Brown', multiplier: 1.05 }, { label: 'Jasmine', multiplier: 1 }, { label: 'Fried rice', multiplier: 1.65 }] },
  { id: 'eggs', name: 'Eggs', servingG: 100, calories: 143, proteinG: 13, carbsG: 0.7, fatG: 9.5, fiberG: 0, isPlantWhole: false, detailQuestion: 'How were they prepared?', variants: [{ label: 'Boiled/poached', multiplier: 1 }, { label: 'Scrambled, no oil', multiplier: 1 }, { label: 'Fried in oil', multiplier: 1.35 }, { label: 'With cheese', multiplier: 1.55 }] },
  { id: 'yogurt', name: 'Yogurt', servingG: 170, calories: 100, proteinG: 17, carbsG: 6, fatG: 0, fiberG: 0, isPlantWhole: false, detailQuestion: 'What style is it?', variants: [{ label: 'Greek, nonfat', multiplier: 1 }, { label: 'Greek, whole milk', multiplier: 1.45 }, { label: 'Regular, plain', multiplier: 1.25 }, { label: 'Flavored/sweetened', multiplier: 1.65 }] },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={{
        borderWidth: 1,
        borderColor: active ? theme.colors.accent : theme.colors.dashboard.bodyStroke,
        backgroundColor: active ? theme.colors.dashboard.glowFaint : 'transparent',
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Text variant="caption" color={active ? 'accent' : 'muted'}>{label}</Text>
    </Pressable>
  );
}

export function PhotoFoodLogger({
  meals,
  onClose,
  onSave,
}: {
  meals: Meal[];
  onClose: () => void;
  onSave: (mealId: string, food: Food) => void;
}) {
  const theme = useTheme();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [profileId, setProfileId] = useState(PROFILES[0]!.id);
  const [variantIndex, setVariantIndex] = useState(1);
  const [portion, setPortion] = useState('113');
  const [brand, setBrand] = useState('');
  const [mealId, setMealId] = useState(meals[0]?.id ?? '');
  const [preparation, setPreparation] = useState('');

  const profile = PROFILES.find((entry) => entry.id === profileId) ?? PROFILES[0]!;
  const variant = profile.variants[Math.min(variantIndex, profile.variants.length - 1)]!;
  const grams = Math.max(1, Number.parseFloat(portion) || profile.servingG);
  const scale = (grams / profile.servingG) * variant.multiplier;
  const estimate = useMemo(() => ({
    calories: Math.round(profile.calories * scale),
    proteinG: Math.round(profile.proteinG * scale),
    carbsG: Math.round(profile.carbsG * scale),
    fatG: Math.round(profile.fatG * scale),
  }), [profile, scale]);

  const chooseProfile = (id: string) => {
    const next = PROFILES.find((entry) => entry.id === id) ?? PROFILES[0]!;
    setProfileId(id);
    setVariantIndex(0);
    setPortion(String(next.servingG));
  };

  const takePhoto = async () => {
    const photo = await camera.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) setPhotoUri(photo.uri);
  };

  const save = () => {
    const details = [variant.label, brand.trim() ? `brand: ${brand.trim()}` : '', preparation.trim()].filter(Boolean);
    onSave(mealId, {
      id: createId('food'),
      name: `${profile.name}${brand.trim() ? ` (${brand.trim()})` : ''}`,
      serving: `${Math.round(grams)} g · ${details.join(' · ')}`,
      quantity: 1,
      ...estimate,
      fiberG: profile.fiberG * scale,
      isPlantWhole: profile.isPlantWhole,
    });
    onClose();
  };

  if (!permission?.granted) {
    return (
      <Panel title="Photo food check" subtitle="Camera access needed" onClose={onClose}>
        <Text variant="body">Take a meal photo, then confirm the details that change its nutrition estimate.</Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
      </Panel>
    );
  }

  if (!photoUri) {
    return (
      <Panel title="Photo food check" subtitle="Keep the whole plate in frame" onClose={onClose}>
        <View style={{ height: 420, overflow: 'hidden', borderRadius: theme.radius.xl }}>
          <CameraView ref={camera} facing="back" style={{ flex: 1 }} />
        </View>
        <Text variant="caption" color="muted">A photo can suggest what is present, but portion, recipe, cut and brand still need confirmation.</Text>
        <Button label="Take photo" onPress={() => void takePhoto()} />
      </Panel>
    );
  }

  const inputStyle = { borderWidth: 1, borderColor: theme.colors.dashboard.bodyStroke, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, color: theme.colors.text, ...theme.typography.body };

  return (
    <Panel title="Check the estimate" subtitle="Answer a few questions for accuracy" onClose={onClose}>
      <Image source={{ uri: photoUri }} style={{ width: '100%', height: 180, borderRadius: theme.radius.lg }} resizeMode="cover" />

      <Stack gap="sm">
        <Text variant="callout">What is the main food?</Text>
        <Stack direction="row" gap="sm" style={{ flexWrap: 'wrap' }}>
          {PROFILES.map((entry) => <Chip key={entry.id} label={entry.name} active={entry.id === profile.id} onPress={() => chooseProfile(entry.id)} />)}
        </Stack>
      </Stack>

      <Stack gap="sm">
        <Text variant="callout">{profile.detailQuestion}</Text>
        <Stack direction="row" gap="sm" style={{ flexWrap: 'wrap' }}>
          {profile.variants.map((entry, index) => <Chip key={entry.label} label={entry.label} active={index === variantIndex} onPress={() => setVariantIndex(index)} />)}
        </Stack>
      </Stack>

      <Stack gap="sm">
        <Text variant="callout">How much did you eat?</Text>
        <TextInput value={portion} onChangeText={setPortion} keyboardType="decimal-pad" accessibilityLabel="Portion in grams" placeholder="Grams" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
      </Stack>

      <Stack gap="sm">
        <Text variant="callout">Brand or restaurant</Text>
        <TextInput value={brand} onChangeText={setBrand} accessibilityLabel="Brand or restaurant" placeholder="Optional, e.g. Kirkland or Chipotle" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
      </Stack>

      <Stack gap="sm">
        <Text variant="callout">Anything added during cooking?</Text>
        <TextInput value={preparation} onChangeText={setPreparation} accessibilityLabel="Preparation details" placeholder="Oil, butter, sauce, breading…" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
      </Stack>

      <Stack gap="sm">
        <Text variant="callout">Add to</Text>
        <Stack direction="row" gap="sm" style={{ flexWrap: 'wrap' }}>
          {meals.map((meal) => <Chip key={meal.id} label={MEAL_SLOT_LABELS[meal.slot]} active={meal.id === mealId} onPress={() => setMealId(meal.id)} />)}
        </Stack>
      </Stack>

      <GlowCard active padding="md">
        <Stack gap="sm">
          <Text variant="caption" color="muted">ESTIMATED NUTRITION</Text>
          <Text variant="title" color="accent">{estimate.calories} kcal</Text>
          <Text variant="body">{estimate.proteinG}g protein · {estimate.carbsG}g carbs · {estimate.fatG}g fat</Text>
          <Text variant="caption" color="muted">Estimate based on your answers, not a lab measurement. Added oils and recipes can change it substantially.</Text>
        </Stack>
      </GlowCard>

      <Button label="Add to nutrition log" disabled={!mealId} onPress={save} />
      <Button label="Retake photo" variant="ghost" onPress={() => setPhotoUri(null)} />
    </Panel>
  );
}
