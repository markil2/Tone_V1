import { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { useTheme, type Theme } from '@/design-system';
import type { BodyView, MuscleData } from '../../../domain/entities/dashboard';
import { MUSCLE_LABELS, type MuscleId } from '../../../domain/entities/muscles';
import {
  BODY_VIEWBOX,
  DETAIL_LINES,
  SILHOUETTE,
  regionsForView,
  type BodyRegion,
} from './regions';

export type InteractiveBodyProps = {
  view: BodyView;
  muscles: MuscleData[];
  highlightedMuscleIds: MuscleId[];
  selectedMuscleId: MuscleId | null;
  onSelect: (id: MuscleId) => void;
  height: number;
};

/**
 * Fill for one region.
 *
 * Colour carries meaning here, so it is never the only channel: the legend spells
 * out every band in words, the details card states the status, and each region
 * exposes its status through its accessibility label.
 */
function regionFill(params: {
  view: BodyView;
  muscle: MuscleData | undefined;
  isSelected: boolean;
  isHighlighted: boolean;
  isPressed: boolean;
  theme: Theme;
}): { fill: string; fillOpacity: number } {
  const { view, muscle, isSelected, isHighlighted, isPressed, theme } = params;
  const accent = theme.colors.accent;

  if (isSelected) return { fill: accent, fillOpacity: 0.85 };
  if (isPressed) return { fill: accent, fillOpacity: 0.6 };

  switch (view) {
    case 'muscles':
      // Load maps onto opacity, so a heavily worked muscle reads as denser.
      return {
        fill: accent,
        fillOpacity: 0.14 + ((muscle?.trainingLoad ?? 0) / 100) * 0.5,
      };

    case 'recovery':
      return {
        fill: muscle ? theme.colors.dashboard.muscle[muscle.status] : accent,
        fillOpacity: muscle ? 0.55 : 0.1,
      };

    case 'overview':
      return { fill: accent, fillOpacity: isHighlighted ? 0.5 : 0.1 };

    // Sleep and AI Coach put their panel in front; the body recedes.
    case 'sleep':
    case 'ai':
      return { fill: accent, fillOpacity: 0.07 };
  }
}

/** Stable DOM id per region, shared by the renderer and the web listener effect. */
function regionElementId(region: BodyRegion): string {
  return `muscle-region-${region.key}`;
}

export function InteractiveBody({
  view,
  muscles,
  highlightedMuscleIds,
  selectedMuscleId,
  onSelect,
  height,
}: InteractiveBodyProps) {
  const theme = useTheme();
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const width = (height * BODY_VIEWBOX.width) / BODY_VIEWBOX.height;
  // Memoised so the listener effect below does not re-bind on every render.
  const regions = useMemo(() => regionsForView('front'), []);
  const byId = new Map(muscles.map((muscle) => [muscle.id, muscle]));

  const showDots = view === 'overview';

  /**
   * Makes the regions interactive on the web.
   *
   * react-native-svg strips every event prop before the <path> reaches the DOM,
   * and its ref hands back the component instance rather than the element — so
   * neither props nor refs can wire this up. What does survive to the DOM is
   * `id`, which is enough to find each path and bind listeners directly.
   *
   * This is also what makes a region keyboard-operable: an `<svg>` child is not
   * focusable by default, so it needs an explicit tabindex and a key handler.
   * That matters more than usual now the muscle names are hidden until
   * selection — the figure is the only way to reach them.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const cleanups: (() => void)[] = [];

    for (const region of regions) {
      const target = document.getElementById(regionElementId(region));
      if (!target) continue;

      const select = () => onSelect(region.muscle);
      const enter = () => setPressedKey(region.key);
      const leave = () => setPressedKey(null);
      const keydown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        select();
      };

      target.addEventListener('click', select);
      target.addEventListener('mouseenter', enter);
      target.addEventListener('mouseleave', leave);
      target.addEventListener('keydown', keydown);
      target.setAttribute('tabindex', '0');
      target.setAttribute('role', 'button');
      target.style.cursor = 'pointer';

      cleanups.push(() => {
        target.removeEventListener('click', select);
        target.removeEventListener('mouseenter', enter);
        target.removeEventListener('mouseleave', leave);
        target.removeEventListener('keydown', keydown);
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [regions, onSelect]);

  const renderRegion = (region: BodyRegion) => {
    const muscle = byId.get(region.muscle);
    const isSelected = selectedMuscleId === region.muscle;
    const isHighlighted = highlightedMuscleIds.includes(region.muscle);
    const { fill, fillOpacity } = regionFill({
      view,
      muscle,
      isSelected,
      isHighlighted,
      isPressed: pressedKey === region.key,
      theme,
    });

    const status = muscle ? `, ${muscle.status}, ${muscle.recovery} percent recovered` : '';

    /**
     * Touch props work on native only.
     *
     * react-native-svg's web renderer passes just presentation attributes to the
     * <path>: it drops `onClick` silently, and `onPress` makes it attach React
     * Native's responder props, which React rejects as unknown event handlers.
     * Verified by inspecting the rendered element — no handler survives either
     * way. Web is handled by `attachWebHandlers` below instead.
     */
    const interaction = Platform.select({
      web: {},
      default: {
        onPress: () => onSelect(region.muscle),
        onPressIn: () => setPressedKey(region.key),
        onPressOut: () => setPressedKey(null),
      },
    });

    // Strokes are authored on a 300-wide grid and scaled down, so widths are
    // specified against that grid rather than in rendered pixels.
    const strokeWidth = isSelected ? 2.2 : 1;

    return (
      <Path
        key={region.key}
        // `id` is one of the few props that survives to the DOM on web, which is
        // how the effect above finds this element to bind listeners to.
        id={regionElementId(region)}
        d={region.d}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={isSelected ? theme.colors.accent : theme.colors.dashboard.bodyStroke}
        strokeWidth={strokeWidth}
        {...interaction}
        // react-native-svg shapes take a label but not a role or selected state,
        // so the selection is folded into the label itself.
        accessibilityLabel={`${MUSCLE_LABELS[region.muscle]}${status}${
          isSelected ? ', selected' : ''
        }`}
      />
    );
  };

  return (
    <View style={{ width, height, alignSelf: 'center' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`}>
        <Defs>
          <RadialGradient id="bodyGlow" cx="50%" cy="45%" r="60%">
            <Stop offset="0%" stopColor={theme.colors.accent} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={theme.colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Radius is exactly half the viewBox width so the gradient reaches zero
            opacity precisely at the left and right edges. Anything larger is
            still faintly opaque where the SVG clips, which draws a hard-edged
            box behind the figure. */}
        <Circle
          cx={BODY_VIEWBOX.width / 2}
          cy={BODY_VIEWBOX.height * 0.47}
          r={BODY_VIEWBOX.width / 2}
          fill="url(#bodyGlow)"
        />

        {/* Ground rings, as in the reference — the figure stands on something. */}
        <G opacity={0.5}>
          {[86, 58, 34].map((radius, index) => (
            <Ellipse
              key={radius}
              cx={BODY_VIEWBOX.width / 2}
              cy={648}
              rx={radius}
              ry={radius * 0.22}
              fill="none"
              stroke={theme.colors.accent}
              strokeWidth={0.8}
              strokeOpacity={0.18 + index * 0.08}
            />
          ))}
        </G>

        {/* The figure. Non-interactive — only muscle regions respond to touch. */}
        <G>
          {Object.entries(SILHOUETTE).map(([part, d]) => (
            <Path
              key={part}
              d={d}
              fill={theme.colors.dashboard.bodyFill}
              stroke={theme.colors.dashboard.bodyStroke}
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
          ))}
        </G>

        {/* Anatomical definition. Sits under the muscle overlays so a selected
            region reads as a solid shape rather than a hatched one. */}
        <G opacity={0.55}>
          {DETAIL_LINES.map((d) => (
            <Path
              key={d}
              d={d}
              fill="none"
              stroke={theme.colors.dashboard.bodyStroke}
              strokeWidth={0.9}
              strokeLinecap="round"
            />
          ))}
        </G>

        <G>{regions.map(renderRegion)}</G>

        {/* Pulse dots mark today's flagged muscles, as in the reference. */}
        {showDots
          ? regions
              .filter((region) => highlightedMuscleIds.includes(region.muscle))
              .map((region) => (
                <G key={`dot-${region.key}`}>
                  <Circle
                    cx={region.anchor.x}
                    cy={region.anchor.y}
                    r={10}
                    fill={theme.colors.accent}
                    fillOpacity={0.2}
                  />
                  <Circle
                    cx={region.anchor.x}
                    cy={region.anchor.y}
                    r={3.6}
                    fill={theme.colors.accent}
                  />
                </G>
              ))
          : null}
      </Svg>
    </View>
  );
}
