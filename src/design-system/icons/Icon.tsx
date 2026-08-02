import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme';
import { ICON_PATHS, type IconName } from './paths';

export type IconProps = {
  name: IconName;
  size?: number;
  /** Defaults to the current text color so icons inherit their context. */
  color?: string;
  strokeWidth?: number;
};

/**
 * The only icon primitive in the app.
 *
 * Icons are decorative here by design — every one sits inside a control that
 * already carries its own `accessibilityLabel`, so the SVG is hidden from
 * assistive tech rather than announcing a duplicate name.
 */
export function Icon({ name, size = 24, color, strokeWidth = 1.6 }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.text;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      // `aria-hidden` rather than RN's accessibilityElementsHidden: the latter
      // has no DOM equivalent, so react-native-svg forwards it verbatim to the
      // <svg> element on web and React warns about an unknown attribute.
      aria-hidden
      pointerEvents="none"
    >
      {ICON_PATHS[name].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
