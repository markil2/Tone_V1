import Svg, { G, Path } from 'react-native-svg';

import { useTheme } from '@/design-system';
import type { MuscleId } from '../../../domain/entities/muscles';
import { BODY_REGIONS, SILHOUETTE } from './regions';

/**
 * A zoomed crop of the body map showing one muscle in place.
 *
 * Reuses the same geometry as the full figure rather than shipping a second set
 * of illustrations — one source of truth, and a muscle can never be drawn in a
 * different shape here than on the body the user just tapped.
 */
export function MuscleThumbnail({ muscleId, size = 44 }: { muscleId: MuscleId; size?: number }) {
  const theme = useTheme();

  const region = BODY_REGIONS.find((candidate) => candidate.muscle === muscleId);
  if (!region) return null;

  // Scaled with the 300×700 grid — a fixed window would crop differently for
  // every muscle once the figure's proportions changed.
  const zoom = 48;
  const viewBox = `${region.anchor.x - zoom} ${region.anchor.y - zoom} ${zoom * 2} ${zoom * 2}`;

  return (
    <Svg width={size} height={size} viewBox={viewBox} aria-hidden>
      <G opacity={0.5}>
        {Object.entries(SILHOUETTE).map(([part, d]) => (
          <Path
            key={part}
            d={d}
            fill={theme.colors.dashboard.bodyFill}
            stroke={theme.colors.dashboard.bodyStroke}
            strokeWidth={1}
          />
        ))}
      </G>

      {BODY_REGIONS.filter((candidate) => candidate.muscle === muscleId).map((match) => (
        <Path
          key={match.key}
          d={match.d}
          fill={theme.colors.accent}
          fillOpacity={0.85}
          stroke={theme.colors.accent}
          strokeWidth={1}
        />
      ))}
    </Svg>
  );
}
