import type { MuscleId } from '../../../domain/entities/muscles';

/**
 * Body map geometry.
 *
 * A hand-authored anatomical figure on a 300×700 grid, drawn in three layers:
 *
 *   SILHOUETTE   the body's solid masses — head, torso, limbs, hands, feet
 *   DETAIL_LINES non-interactive definition: clavicles, sternum, ab segments,
 *                serratus, quad separations, knees, gastrocnemius split
 *   BODY_REGIONS the eight interactive muscle groups laid over the top
 *
 * The grid is deliberately larger than the rendered size. Authoring at 300×700
 * and scaling down means curve control points land on whole numbers and the
 * figure stays crisp at any height, which is what lets the detail layer carry
 * this much line work without turning to mush on a phone.
 *
 * Paired muscles get one entry per side, both carrying the same `muscle` id, so
 * selecting either lights both and shows a single card.
 */

export const BODY_VIEWBOX = { width: 300, height: 700 } as const;

/** The body's masses. Filled, thin-stroked — the base the detail sits on. */
export const SILHOUETTE = {
  head: 'M 150 18 C 168 18 181 32 181 53 C 181 64 179 73 175 81 C 172 88 165 96 150 96 C 135 96 128 88 125 81 C 121 73 119 64 119 53 C 119 32 132 18 150 18 Z',
  neck: 'M 137 90 C 137 100 135 108 132 115 L 168 115 C 165 108 163 100 163 90 Z',
  trapezius:
    'M 132 113 C 116 117 98 123 82 131 L 218 131 C 202 123 184 117 168 113 Z',
  torso:
    'M 82 131 C 90 127 104 122 118 119 L 182 119 C 196 122 210 127 218 131 C 224 155 226 181 223 205 C 220 231 213 253 206 271 C 201 289 198 303 197 319 C 196 333 193 345 189 353 L 111 353 C 107 345 104 333 103 319 C 102 303 99 289 94 271 C 87 253 80 231 77 205 C 74 181 76 155 82 131 Z',

  upperArmLeft:
    'M 82 133 C 70 141 62 159 58 181 C 54 203 52 223 52 239 L 80 241 C 80 223 82 203 86 183 C 89 163 92 145 94 135 Z',
  forearmLeft:
    'M 52 241 C 51 263 52 287 55 309 C 57 325 59 337 61 345 L 82 343 C 81 333 80 321 79 307 C 77 285 78 261 80 241 Z',
  handLeft:
    'M 61 345 C 59 357 58 369 59 379 C 60 389 65 395 71 395 C 78 395 82 389 83 379 C 84 367 84 355 82 343 Z',

  upperArmRight:
    'M 218 133 C 230 141 238 159 242 181 C 246 203 248 223 248 239 L 220 241 C 220 223 218 203 214 183 C 211 163 208 145 206 135 Z',
  forearmRight:
    'M 248 241 C 249 263 248 287 245 309 C 243 325 241 337 239 345 L 218 343 C 219 333 220 321 221 307 C 223 285 222 261 220 241 Z',
  handRight:
    'M 239 345 C 241 357 242 369 241 379 C 240 389 235 395 229 395 C 222 395 218 389 217 379 C 216 367 216 355 218 343 Z',

  thighLeft:
    'M 111 353 C 103 379 99 411 101 443 C 102 463 105 475 107 485 L 142 485 C 143 473 144 457 144 441 C 145 411 146 379 146 353 Z',
  lowerLegLeft:
    'M 107 487 C 102 503 100 521 102 539 C 104 559 109 581 112 599 L 137 599 C 138 581 139 559 140 539 C 141 521 142 503 140 487 Z',
  footLeft:
    'M 112 599 C 110 611 109 621 110 629 C 111 637 118 641 128 641 L 146 641 C 148 637 147 631 144 627 C 140 621 138 611 137 599 Z',

  thighRight:
    'M 189 353 C 197 379 201 411 199 443 C 198 463 195 475 193 485 L 158 485 C 157 473 156 457 156 441 C 155 411 154 379 154 353 Z',
  lowerLegRight:
    'M 193 487 C 198 503 200 521 198 539 C 196 559 191 581 188 599 L 163 599 C 162 581 161 559 160 539 C 159 521 158 503 160 487 Z',
  footRight:
    'M 188 599 C 190 611 191 621 190 629 C 189 637 182 641 172 641 L 154 641 C 152 637 153 631 156 627 C 160 621 162 611 163 599 Z',
} as const;

/**
 * Definition lines.
 *
 * Stroked only, never filled, and never interactive — they exist to make the
 * figure read as a body rather than a mannequin. Kept separate from the
 * silhouette so the two can be styled independently: the detail sits at lower
 * opacity so it reads as anatomy rather than competing with the muscle overlays.
 */
export const DETAIL_LINES: string[] = [
  // Face — the barest suggestion. More than this reads as a portrait.
  'M 133 52 C 137 49 143 49 146 51',
  'M 154 51 C 157 49 163 49 167 52',
  'M 150 58 L 150 73 L 145 76',
  'M 140 84 C 145 87 155 87 160 84',

  // Sternocleidomastoid
  'M 141 97 L 134 114',
  'M 159 97 L 166 114',

  // Clavicles
  'M 106 136 C 120 129 136 127 148 130',
  'M 194 136 C 180 129 164 127 152 130',

  // Sternum and linea alba
  'M 150 134 L 150 190',
  'M 150 193 L 150 295',

  // Pectoral lower borders
  'M 102 168 C 116 186 134 191 147 187',
  'M 198 168 C 184 186 166 191 153 187',

  // Abdominal segments, curved to follow the taper
  'M 127 216 C 138 213 162 213 173 216',
  'M 129 240 C 139 237 161 237 171 240',
  'M 132 264 C 140 261 160 261 168 264',

  // Serratus anterior
  'M 105 185 L 118 195',
  'M 104 198 L 117 207',
  'M 105 211 L 118 219',
  'M 195 185 L 182 195',
  'M 196 198 L 183 207',
  'M 195 211 L 182 219',

  // Obliques sweeping into the hip
  'M 110 200 C 114 238 120 272 129 298',
  'M 190 200 C 186 238 180 272 171 298',

  // Inguinal crease
  'M 116 316 C 128 330 142 336 150 336',
  'M 184 316 C 172 330 158 336 150 336',

  // Biceps / triceps separation on the upper arm
  'M 76 180 C 73 202 72 224 73 240',
  'M 224 180 C 227 202 228 224 227 240',

  // Forearm flexor mass
  'M 61 256 C 63 282 65 306 67 330',
  'M 239 256 C 237 282 235 306 233 330',

  // Fingers
  'M 63 358 L 62 386',
  'M 70 357 L 70 388',
  'M 77 358 L 78 386',
  'M 237 358 L 238 386',
  'M 230 357 L 230 388',
  'M 223 358 L 222 386',

  // Rectus femoris against vastus lateralis
  'M 119 367 C 117 397 117 425 119 447',
  'M 181 367 C 183 397 183 425 181 447',
  // Vastus medialis teardrop
  'M 130 421 C 134 435 136 447 136 456',
  'M 170 421 C 166 435 164 447 164 456',
  // Sartorius
  'M 141 358 C 130 392 124 428 122 456',
  'M 159 358 C 170 392 176 428 178 456',

  // Knees
  'M 108 463 C 118 470 132 470 142 463',
  'M 192 463 C 182 470 168 470 158 463',

  // Gastrocnemius split and tibialis anterior
  'M 114 501 C 111 523 112 547 117 568',
  'M 186 501 C 189 523 188 547 183 568',
  'M 128 495 C 130 525 131 555 132 580',
  'M 172 495 C 170 525 169 555 168 580',

  // Ankles
  'M 113 596 C 121 601 130 601 137 596',
  'M 187 596 C 179 601 170 601 163 596',
];

export type BodyRegion = {
  /** Unique per shape — paired muscles have two. */
  key: string;
  muscle: MuscleId;
  side: 'left' | 'right' | 'center';
  d: string;
  /** Where a highlight dot sits. Roughly the visual centre of the shape. */
  anchor: { x: number; y: number };
  view: 'front' | 'back';
};

export const BODY_REGIONS: BodyRegion[] = [
  {
    key: 'deltoid-left',
    muscle: 'deltoid',
    side: 'left',
    d: 'M 94 133 C 82 139 72 153 68 171 C 76 180 90 177 96 165 C 100 153 99 141 94 133 Z',
    anchor: { x: 84, y: 156 },
    view: 'front',
  },
  {
    key: 'deltoid-right',
    muscle: 'deltoid',
    side: 'right',
    d: 'M 206 133 C 218 139 228 153 232 171 C 224 180 210 177 204 165 C 200 153 201 141 206 133 Z',
    anchor: { x: 216, y: 156 },
    view: 'front',
  },
  {
    key: 'pectoral-left',
    muscle: 'pectoral',
    side: 'left',
    d: 'M 102 142 C 116 134 134 132 147 136 L 147 178 C 145 187 135 192 123 190 C 111 188 104 180 101 168 C 98 158 99 148 102 142 Z',
    anchor: { x: 122, y: 161 },
    view: 'front',
  },
  {
    key: 'pectoral-right',
    muscle: 'pectoral',
    side: 'right',
    d: 'M 198 142 C 184 134 166 132 153 136 L 153 178 C 155 187 165 192 177 190 C 189 188 196 180 199 168 C 202 158 201 148 198 142 Z',
    anchor: { x: 178, y: 161 },
    view: 'front',
  },
  {
    key: 'biceps-left',
    muscle: 'biceps',
    side: 'left',
    d: 'M 86 179 C 80 195 78 215 80 233 C 90 233 96 217 98 199 C 99 187 95 179 86 179 Z',
    anchor: { x: 88, y: 206 },
    view: 'front',
  },
  {
    key: 'biceps-right',
    muscle: 'biceps',
    side: 'right',
    d: 'M 214 179 C 220 195 222 215 220 233 C 210 233 204 217 202 199 C 201 187 205 179 214 179 Z',
    anchor: { x: 212, y: 206 },
    view: 'front',
  },
  /**
   * Triceps sit on the posterior arm, so on a front view they can only be shown
   * as the lateral edge of the upper arm. They move to their real position when
   * the back view is added — see the `view` field.
   */
  {
    key: 'triceps-left',
    muscle: 'triceps',
    side: 'left',
    d: 'M 66 177 C 60 195 57 215 58 235 C 66 235 70 219 72 201 C 73 189 72 179 66 177 Z',
    anchor: { x: 65, y: 206 },
    view: 'front',
  },
  {
    key: 'triceps-right',
    muscle: 'triceps',
    side: 'right',
    d: 'M 234 177 C 240 195 243 215 242 235 C 234 235 230 219 228 201 C 227 189 228 179 234 177 Z',
    anchor: { x: 235, y: 206 },
    view: 'front',
  },
  {
    key: 'abdominals',
    muscle: 'abdominals',
    side: 'center',
    // Tapered rather than rectangular — the rectus abdominis narrows toward the
    // pubis, and a straight-sided box reads as a panel bolted to the torso.
    d: 'M 125 195 C 138 192 162 192 175 195 C 175 224 173 251 169 273 C 166 288 160 297 150 299 C 140 297 134 288 131 273 C 127 251 125 224 125 195 Z',
    anchor: { x: 150, y: 243 },
    view: 'front',
  },
  {
    key: 'quadriceps-left',
    muscle: 'quadriceps',
    side: 'left',
    d: 'M 112 359 C 104 387 101 419 104 449 C 116 451 126 425 130 395 C 132 375 130 361 128 355 Z',
    anchor: { x: 117, y: 402 },
    view: 'front',
  },
  {
    key: 'quadriceps-right',
    muscle: 'quadriceps',
    side: 'right',
    d: 'M 188 359 C 196 387 199 419 196 449 C 184 451 174 425 170 395 C 168 375 170 361 172 355 Z',
    anchor: { x: 183, y: 402 },
    view: 'front',
  },
  /** Same caveat as the triceps — posterior, shown here as the lateral thigh. */
  {
    key: 'hamstrings-left',
    muscle: 'hamstrings',
    side: 'left',
    d: 'M 104 361 C 99 391 98 421 100 447 C 105 447 108 421 110 393 C 111 373 109 361 107 357 Z',
    anchor: { x: 104, y: 402 },
    view: 'front',
  },
  {
    key: 'hamstrings-right',
    muscle: 'hamstrings',
    side: 'right',
    d: 'M 196 361 C 201 391 202 421 200 447 C 195 447 192 421 190 393 C 189 373 191 361 193 357 Z',
    anchor: { x: 196, y: 402 },
    view: 'front',
  },
  {
    key: 'calves-left',
    muscle: 'calves',
    side: 'left',
    d: 'M 108 493 C 103 509 101 527 103 545 C 106 563 112 575 116 579 C 122 571 124 551 124 531 C 124 513 122 499 120 491 Z',
    anchor: { x: 113, y: 534 },
    view: 'front',
  },
  {
    key: 'calves-right',
    muscle: 'calves',
    side: 'right',
    d: 'M 192 493 C 197 509 199 527 197 545 C 194 563 188 575 184 579 C 178 571 176 551 176 531 C 176 513 178 499 180 491 Z',
    anchor: { x: 187, y: 534 },
    view: 'front',
  },
];

export function regionsForView(view: 'front' | 'back' = 'front'): BodyRegion[] {
  return BODY_REGIONS.filter((region) => region.view === view);
}
