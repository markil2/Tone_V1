import { useState } from 'react';
import { View } from 'react-native';

import { NumberField, Stack, Text, useTheme } from '@/design-system';
import { cmToFeetInches, feetInchesToCm, type UnitSystem } from '@/shared/units';
import { HEIGHT_CM_RANGE } from '../../domain/use-cases/validation';

export type HeightInputProps = {
  valueCm: number | null;
  onChange: (cm: number | null) => void;
  unitSystem: UnitSystem;
};

const CM_PER_INCH = 2.54;

/**
 * Imperial bounds derived from the centimetre range rather than hardcoded.
 *
 * Written out by hand they are wrong in a way that is easy to miss: 3′11″ is
 * 119.4 cm and 7′3″ is 221 cm, so both fall outside the 120–220 cm domain range.
 * The honest range is 4′0″–7′2″, and deriving it keeps the message correct if
 * HEIGHT_CM_RANGE ever changes.
 */
const IMPERIAL_BOUNDS = (() => {
  const format = (totalInches: number) =>
    `${Math.floor(totalInches / 12)}′${totalInches % 12}″`;
  return {
    // Round inward: the nearest whole inch that still lands inside the range.
    min: format(Math.ceil(HEIGHT_CM_RANGE.min / CM_PER_INCH)),
    max: format(Math.floor(HEIGHT_CM_RANGE.max / CM_PER_INCH)),
    minFeet: Math.floor(Math.ceil(HEIGHT_CM_RANGE.min / CM_PER_INCH) / 12),
    maxFeet: Math.floor(Math.floor(HEIGHT_CM_RANGE.max / CM_PER_INCH) / 12),
  };
})();

/**
 * Height entry, unit-aware.
 *
 * Imperial gets two fields rather than a decimal feet value, because nobody
 * thinks of their height as 5.75 feet. The pair is combined and validated
 * against the same centimetre bounds, so the domain only ever sees canonical cm.
 */
export function HeightInput({ valueCm, onChange, unitSystem }: HeightInputProps) {
  const theme = useTheme();

  if (unitSystem === 'metric') {
    return (
      <NumberField
        label="Height"
        value={valueCm}
        onChange={onChange}
        min={HEIGHT_CM_RANGE.min}
        max={HEIGHT_CM_RANGE.max}
        unit="cm"
      />
    );
  }

  return <ImperialHeight valueCm={valueCm} onChange={onChange} theme={theme} />;
}

function ImperialHeight({
  valueCm,
  onChange,
  theme,
}: {
  valueCm: number | null;
  onChange: (cm: number | null) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const seed = valueCm === null ? null : cmToFeetInches(valueCm);
  const [feet, setFeet] = useState<number | null>(seed?.feet ?? null);
  const [inches, setInches] = useState<number | null>(seed?.inches ?? null);
  const [outOfRange, setOutOfRange] = useState(false);

  /**
   * Both fields must be present before a height exists. Note inches uses
   * `?? null` rather than `|| null` — 0 inches is a perfectly good answer.
   */
  const commit = (nextFeet: number | null, nextInches: number | null) => {
    if (nextFeet === null || nextInches === null) {
      setOutOfRange(false);
      onChange(null);
      return;
    }

    const cm = feetInchesToCm({ feet: nextFeet, inches: nextInches });
    const withinRange = cm >= HEIGHT_CM_RANGE.min && cm <= HEIGHT_CM_RANGE.max;

    setOutOfRange(!withinRange);
    onChange(withinRange ? cm : null);
  };

  return (
    <Stack gap="xs">
      <Text variant="caption" color="muted">
        Height
      </Text>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <NumberField
            value={feet}
            onChange={(next) => {
              setFeet(next);
              commit(next, inches);
            }}
            min={IMPERIAL_BOUNDS.minFeet}
            max={IMPERIAL_BOUNDS.maxFeet}
            unit="ft"
          />
        </View>
        <View style={{ flex: 1 }}>
          <NumberField
            value={inches}
            onChange={(next) => {
              setInches(next);
              commit(feet, next);
            }}
            min={0}
            max={11}
            unit="in"
          />
        </View>
      </View>

      {outOfRange ? (
        <Text variant="caption" color="danger">
          Enter a height between {IMPERIAL_BOUNDS.min} and {IMPERIAL_BOUNDS.max}.
        </Text>
      ) : null}
    </Stack>
  );
}
