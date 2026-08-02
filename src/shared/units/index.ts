/**
 * Unit conversion.
 *
 * Canonical storage is SI — centimetres and kilograms — everywhere in the domain
 * and database. Imperial exists only at the presentation edge. Mixing units in
 * storage is effectively unrecoverable once real data accumulates, so conversion
 * happens here and nowhere else.
 */

export type UnitSystem = 'metric' | 'imperial';

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
const LB_PER_KG = 2.2046226218;

export const round = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/* ---------------------------------- height --------------------------------- */

export type FeetInches = { feet: number; inches: number };

export function cmToFeetInches(cm: number): FeetInches {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return {
    feet: Math.floor(totalInches / INCHES_PER_FOOT),
    inches: totalInches % INCHES_PER_FOOT,
  };
}

export function feetInchesToCm({ feet, inches }: FeetInches): number {
  return round((feet * INCHES_PER_FOOT + inches) * CM_PER_INCH, 1);
}

export function formatHeight(cm: number, system: UnitSystem): string {
  if (system === 'metric') return `${Math.round(cm)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}′ ${inches}″`;
}

/* ---------------------------------- weight --------------------------------- */

export const kgToLb = (kg: number): number => round(kg * LB_PER_KG, 1);
export const lbToKg = (lb: number): number => round(lb / LB_PER_KG, 1);

export function formatWeight(kg: number, system: UnitSystem): string {
  return system === 'metric' ? `${round(kg, 1)} kg` : `${Math.round(kgToLb(kg))} lb`;
}

/* --------------------------------- volume ---------------------------------- */

export const mlToFlOz = (ml: number): number => round(ml / 29.5735, 1);

export function formatVolume(ml: number, system: UnitSystem): string {
  if (system === 'metric') {
    return ml >= 1000 ? `${round(ml / 1000, 1)} L` : `${Math.round(ml)} ml`;
  }
  return `${Math.round(mlToFlOz(ml))} fl oz`;
}
