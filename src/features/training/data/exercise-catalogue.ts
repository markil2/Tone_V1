import type { Exercise, Equipment, MuscleGroup } from '../domain/entities/exercise';

/**
 * The bundled exercise catalogue.
 *
 * Shipped with the app rather than fetched: the library is searched on every
 * keystroke while someone is mid-set in a gym with bad signal, and a network
 * round-trip there is unacceptable. It sits behind `ExerciseRepository`, so a
 * server-backed catalogue can replace it without touching a screen.
 *
 * Covers the movements people actually log — the common lifts plus the less
 * common accessory and machine work that usually forces a "custom exercise"
 * in other apps.
 *
 * MET values follow the Compendium of Physical Activities bands: ~3.5 isolation,
 * ~5.0 compound, ~6.0+ explosive or full-body.
 */

/** Compact tuple form. Expanded below — spelling every field out 140 times is unreadable. */
type Row = [
  name: string,
  primary: MuscleGroup,
  equipment: Equipment,
  isCompound: boolean,
  met: number,
  secondary?: MuscleGroup[],
  aliases?: string[],
];

const ROWS: Row[] = [
  // ---------------------------------------------------------------- chest ---
  ['Barbell Bench Press', 'chest', 'barbell', true, 5, ['shoulders', 'arms'], ['bench', 'bench press', 'flat bench']],
  ['Incline Barbell Bench Press', 'chest', 'barbell', true, 5, ['shoulders', 'arms'], ['incline bench']],
  ['Decline Barbell Bench Press', 'chest', 'barbell', true, 5, ['arms'], ['decline bench']],
  ['Dumbbell Bench Press', 'chest', 'dumbbell', true, 5, ['shoulders', 'arms'], ['db bench']],
  ['Incline Dumbbell Press', 'chest', 'dumbbell', true, 5, ['shoulders', 'arms'], ['incline db']],
  ['Dumbbell Fly', 'chest', 'dumbbell', false, 3.5, ['shoulders'], ['flyes', 'flys']],
  ['Incline Dumbbell Fly', 'chest', 'dumbbell', false, 3.5, [], []],
  ['Cable Crossover', 'chest', 'cable', false, 3.5, ['shoulders'], ['crossover']],
  ['Cable Fly', 'chest', 'cable', false, 3.5, [], []],
  ['Pec Deck', 'chest', 'machine', false, 3.5, [], ['machine fly', 'butterfly']],
  ['Machine Chest Press', 'chest', 'machine', true, 4.5, ['arms'], []],
  ['Smith Machine Bench Press', 'chest', 'smith', true, 5, ['arms'], []],
  ['Push-Up', 'chest', 'bodyweight', true, 4.5, ['arms', 'core'], ['pushup', 'press up']],
  ['Deficit Push-Up', 'chest', 'bodyweight', true, 4.5, ['arms'], []],
  ['Chest Dip', 'chest', 'bodyweight', true, 5, ['arms', 'shoulders'], ['dips']],
  ['Svend Press', 'chest', 'other', false, 3.5, [], ['plate press']],
  ['Landmine Press', 'chest', 'barbell', true, 5, ['shoulders'], []],

  // ----------------------------------------------------------------- back ---
  ['Deadlift', 'back', 'barbell', true, 6, ['legs', 'glutes', 'forearms'], ['conventional deadlift', 'dl']],
  ['Sumo Deadlift', 'back', 'barbell', true, 6, ['legs', 'glutes'], []],
  ['Romanian Deadlift', 'back', 'barbell', true, 5.5, ['glutes', 'legs'], ['rdl']],
  ['Trap Bar Deadlift', 'back', 'trap_bar', true, 6, ['legs', 'glutes'], ['hex bar deadlift']],
  ['Rack Pull', 'back', 'barbell', true, 5.5, ['glutes'], []],
  ['Pull-Up', 'back', 'bodyweight', true, 5, ['arms', 'forearms'], ['pullup', 'pull ups']],
  ['Chin-Up', 'back', 'bodyweight', true, 5, ['arms'], ['chinup']],
  ['Lat Pulldown', 'back', 'cable', true, 4.5, ['arms'], ['pulldown']],
  ['Close-Grip Lat Pulldown', 'back', 'cable', true, 4.5, ['arms'], []],
  ['Straight-Arm Pulldown', 'back', 'cable', false, 3.5, [], []],
  ['Barbell Row', 'back', 'barbell', true, 5, ['arms', 'forearms'], ['bent over row', 'pendlay row']],
  ['Dumbbell Row', 'back', 'dumbbell', true, 4.5, ['arms'], ['one arm row', 'db row']],
  ['Seated Cable Row', 'back', 'cable', true, 4.5, ['arms'], ['cable row']],
  ['Chest-Supported Row', 'back', 'machine', true, 4.5, ['arms'], []],
  ['T-Bar Row', 'back', 'barbell', true, 5, ['arms'], []],
  ['Meadows Row', 'back', 'barbell', true, 5, ['arms'], []],
  ['Inverted Row', 'back', 'bodyweight', true, 4.5, ['arms'], ['australian pull up']],
  ['Face Pull', 'back', 'cable', false, 3.5, ['shoulders'], []],
  ['Shrug', 'back', 'dumbbell', false, 3.5, ['forearms'], ['shrugs']],
  ['Barbell Shrug', 'back', 'barbell', false, 3.5, ['forearms'], []],
  ['Good Morning', 'back', 'barbell', true, 5, ['glutes', 'legs'], []],
  ['Back Extension', 'back', 'bodyweight', false, 4, ['glutes'], ['hyperextension']],
  ['Reverse Hyperextension', 'back', 'machine', false, 4, ['glutes'], ['reverse hyper']],

  // ------------------------------------------------------------ shoulders ---
  ['Overhead Press', 'shoulders', 'barbell', true, 5, ['arms', 'core'], ['ohp', 'military press', 'strict press']],
  ['Seated Dumbbell Shoulder Press', 'shoulders', 'dumbbell', true, 4.5, ['arms'], ['db shoulder press']],
  ['Arnold Press', 'shoulders', 'dumbbell', true, 4.5, ['arms'], []],
  ['Push Press', 'shoulders', 'barbell', true, 6, ['legs', 'arms'], []],
  ['Machine Shoulder Press', 'shoulders', 'machine', true, 4.5, ['arms'], []],
  ['Lateral Raise', 'shoulders', 'dumbbell', false, 3.5, [], ['side raise', 'lat raise']],
  ['Cable Lateral Raise', 'shoulders', 'cable', false, 3.5, [], []],
  ['Front Raise', 'shoulders', 'dumbbell', false, 3.5, [], []],
  ['Rear Delt Fly', 'shoulders', 'dumbbell', false, 3.5, ['back'], ['reverse fly', 'rear delt']],
  ['Reverse Pec Deck', 'shoulders', 'machine', false, 3.5, ['back'], []],
  ['Upright Row', 'shoulders', 'barbell', true, 4, ['back', 'forearms'], []],
  ['Cuban Press', 'shoulders', 'dumbbell', false, 3.5, [], []],
  ['Handstand Push-Up', 'shoulders', 'bodyweight', true, 6, ['arms'], ['hspu']],

  // ----------------------------------------------------------------- arms ---
  ['Barbell Curl', 'arms', 'barbell', false, 3.5, ['forearms'], ['bicep curl']],
  ['EZ Bar Curl', 'arms', 'ez_bar', false, 3.5, ['forearms'], []],
  ['Dumbbell Curl', 'arms', 'dumbbell', false, 3.5, ['forearms'], ['db curl']],
  ['Hammer Curl', 'arms', 'dumbbell', false, 3.5, ['forearms'], []],
  ['Incline Dumbbell Curl', 'arms', 'dumbbell', false, 3.5, [], []],
  ['Preacher Curl', 'arms', 'ez_bar', false, 3.5, [], []],
  ['Concentration Curl', 'arms', 'dumbbell', false, 3.5, [], []],
  ['Cable Curl', 'arms', 'cable', false, 3.5, ['forearms'], []],
  ['Spider Curl', 'arms', 'dumbbell', false, 3.5, [], []],
  ['Drag Curl', 'arms', 'barbell', false, 3.5, [], []],
  ['Close-Grip Bench Press', 'arms', 'barbell', true, 5, ['chest', 'shoulders'], ['cgbp']],
  ['Triceps Pushdown', 'arms', 'cable', false, 3.5, [], ['pushdown', 'tricep pushdown']],
  ['Rope Pushdown', 'arms', 'cable', false, 3.5, [], []],
  ['Overhead Triceps Extension', 'arms', 'dumbbell', false, 3.5, [], ['tricep extension']],
  ['Skull Crusher', 'arms', 'ez_bar', false, 3.5, [], ['lying tricep extension']],
  ['Triceps Dip', 'arms', 'bodyweight', true, 5, ['chest'], ['bench dip']],
  ['JM Press', 'arms', 'barbell', true, 4.5, [], []],
  ['Kickback', 'arms', 'dumbbell', false, 3.5, [], ['tricep kickback']],

  // ------------------------------------------------------------- forearms ---
  ['Wrist Curl', 'forearms', 'barbell', false, 3, [], []],
  ['Reverse Wrist Curl', 'forearms', 'barbell', false, 3, [], []],
  ['Reverse Curl', 'forearms', 'ez_bar', false, 3.5, ['arms'], []],
  ['Farmer’s Carry', 'forearms', 'dumbbell', true, 5.5, ['core', 'back'], ['farmers walk']],
  ['Plate Pinch', 'forearms', 'other', false, 3, [], []],
  ['Dead Hang', 'forearms', 'bodyweight', false, 3.5, ['back'], []],

  // ----------------------------------------------------------------- legs ---
  ['Back Squat', 'legs', 'barbell', true, 6, ['glutes', 'core'], ['squat', 'barbell squat']],
  ['Front Squat', 'legs', 'barbell', true, 6, ['glutes', 'core'], []],
  ['Box Squat', 'legs', 'barbell', true, 5.5, ['glutes'], []],
  ['Goblet Squat', 'legs', 'dumbbell', true, 5, ['glutes', 'core'], []],
  ['Hack Squat', 'legs', 'machine', true, 5.5, ['glutes'], []],
  ['Smith Machine Squat', 'legs', 'smith', true, 5.5, ['glutes'], []],
  ['Leg Press', 'legs', 'machine', true, 5, ['glutes'], []],
  ['Bulgarian Split Squat', 'legs', 'dumbbell', true, 5.5, ['glutes'], ['split squat', 'bss']],
  ['Walking Lunge', 'legs', 'dumbbell', true, 5.5, ['glutes'], ['lunges']],
  ['Reverse Lunge', 'legs', 'dumbbell', true, 5, ['glutes'], []],
  ['Step-Up', 'legs', 'dumbbell', true, 5, ['glutes'], []],
  ['Leg Extension', 'legs', 'machine', false, 3.5, [], ['quad extension']],
  ['Lying Leg Curl', 'legs', 'machine', false, 3.5, [], ['hamstring curl']],
  ['Seated Leg Curl', 'legs', 'machine', false, 3.5, [], []],
  ['Nordic Curl', 'legs', 'bodyweight', false, 4.5, [], ['nordic hamstring curl']],
  ['Sissy Squat', 'legs', 'bodyweight', false, 4, [], []],
  ['Pistol Squat', 'legs', 'bodyweight', true, 5.5, ['glutes', 'core'], []],
  ['Zercher Squat', 'legs', 'barbell', true, 6, ['glutes', 'core'], []],
  ['Belt Squat', 'legs', 'machine', true, 5.5, ['glutes'], []],

  // --------------------------------------------------------------- glutes ---
  ['Hip Thrust', 'glutes', 'barbell', true, 5, ['legs'], ['barbell hip thrust']],
  ['Glute Bridge', 'glutes', 'bodyweight', false, 4, ['legs'], []],
  ['Cable Kickback', 'glutes', 'cable', false, 3.5, [], ['glute kickback']],
  ['Hip Abduction', 'glutes', 'machine', false, 3.5, [], ['abductor machine']],
  ['Hip Adduction', 'glutes', 'machine', false, 3.5, ['legs'], ['adductor machine']],
  ['Frog Pump', 'glutes', 'bodyweight', false, 3.5, [], []],
  ['Kettlebell Swing', 'glutes', 'kettlebell', true, 6, ['back', 'legs'], ['kb swing']],

  // --------------------------------------------------------------- calves ---
  ['Standing Calf Raise', 'calves', 'machine', false, 3.5, [], ['calf raise']],
  ['Seated Calf Raise', 'calves', 'machine', false, 3.5, [], []],
  ['Smith Machine Calf Raise', 'calves', 'smith', false, 3.5, [], []],
  ['Donkey Calf Raise', 'calves', 'machine', false, 3.5, [], []],
  ['Single-Leg Calf Raise', 'calves', 'bodyweight', false, 3.5, [], []],

  // ----------------------------------------------------------------- core ---
  ['Plank', 'core', 'bodyweight', false, 3.5, ['shoulders'], []],
  ['Side Plank', 'core', 'bodyweight', false, 3.5, [], []],
  ['Hanging Leg Raise', 'core', 'bodyweight', false, 4, ['forearms'], ['leg raise']],
  ['Hanging Knee Raise', 'core', 'bodyweight', false, 4, [], []],
  ['Cable Crunch', 'core', 'cable', false, 3.5, [], []],
  ['Crunch', 'core', 'bodyweight', false, 3.5, [], ['sit up', 'situp']],
  ['Ab Wheel Rollout', 'core', 'other', false, 4, ['shoulders'], ['ab rollout']],
  ['Russian Twist', 'core', 'other', false, 3.5, [], []],
  ['Pallof Press', 'core', 'cable', false, 3.5, [], []],
  ['Dead Bug', 'core', 'bodyweight', false, 3, [], []],
  ['Bird Dog', 'core', 'bodyweight', false, 3, ['back'], []],
  ['Dragon Flag', 'core', 'bodyweight', false, 5, [], []],
  ['Toes to Bar', 'core', 'bodyweight', false, 5, ['back'], ['t2b']],
  ['Woodchopper', 'core', 'cable', false, 3.5, [], []],

  // ------------------------------------------------------------ full body ---
  ['Clean and Jerk', 'full_body', 'barbell', true, 7, ['legs', 'shoulders', 'back'], []],
  ['Power Clean', 'full_body', 'barbell', true, 7, ['legs', 'back'], ['clean']],
  ['Hang Clean', 'full_body', 'barbell', true, 6.5, ['legs', 'back'], []],
  ['Snatch', 'full_body', 'barbell', true, 7, ['legs', 'shoulders', 'back'], []],
  ['Thruster', 'full_body', 'barbell', true, 6.5, ['legs', 'shoulders'], []],
  ['Burpee', 'full_body', 'bodyweight', true, 8, ['chest', 'legs'], ['burpees']],
  ['Turkish Get-Up', 'full_body', 'kettlebell', true, 5.5, ['core', 'shoulders'], ['tgu']],
  ['Sled Push', 'full_body', 'other', true, 8, ['legs', 'glutes'], ['prowler push']],
  ['Battle Ropes', 'full_body', 'other', true, 8, ['shoulders', 'core'], []],
  ['Box Jump', 'full_body', 'bodyweight', true, 7, ['legs', 'glutes'], []],
  ['Mountain Climber', 'full_body', 'bodyweight', true, 7, ['core'], []],
  ['Wall Ball', 'full_body', 'other', true, 7, ['legs', 'shoulders'], []],
];

/** Stable, human-readable ids — `barbell-bench-press`, not a random uuid. */
function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const EXERCISE_CATALOGUE: Exercise[] = ROWS.map(
  ([name, primaryMuscle, equipment, isCompound, met, secondaryMuscles, aliases]) => ({
    id: toId(name),
    name,
    primaryMuscle,
    secondaryMuscles: secondaryMuscles ?? [],
    equipment,
    isCompound,
    met,
    aliases: aliases ?? [],
  }),
);
