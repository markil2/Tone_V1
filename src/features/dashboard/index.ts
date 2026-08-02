/** Public API of the dashboard feature. */
export { DashboardScreen } from './presentation/screens/DashboardScreen';
export { BottomNavigation } from './presentation/components/BottomNavigation';
export { GlowCard, glow } from './presentation/components/GlowCard';
export { Panel, PanelRow, CloseButton } from './presentation/components/Panel';
export { DashboardHeader } from './presentation/components/DashboardHeader';
export { useDashboard, dashboardKeys } from './presentation/hooks/useDashboard';
export { useDashboardView } from './presentation/store/dashboard-view';

export {
  formatDuration,
  formatLastTrained,
  scoreBand,
  MUSCLE_STATUS_LABELS,
} from './domain/entities/dashboard';
export type {
  BodyView,
  DashboardData,
  DashboardMetrics,
  MuscleData,
  MuscleStatus,
} from './domain/entities/dashboard';
export {
  MUSCLE_IDS,
  MUSCLE_LABELS,
  MUSCLE_REGIONS,
  MUSCLE_REGION_LABELS,
  isMuscleId,
} from './domain/entities/muscles';
export type { MuscleId } from './domain/entities/muscles';
export { muscleStatusFromRecovery } from './domain/use-cases/muscle-status';
export { createInMemoryDashboardRepository } from './data/mock-dashboard.repository';
