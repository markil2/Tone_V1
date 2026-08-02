import { create } from 'zustand';

import type { BodyView } from '../../domain/entities/dashboard';
import type { MuscleId } from '../../domain/entities/muscles';

/**
 * Which parts of the dashboard are currently on screen.
 *
 * Zustand rather than component state because three unrelated places drive the
 * same selection — the body map, the muscle legend, and the training screen's
 * recovery list — and threading callbacks between them would mean lifting state
 * to a component that has no other reason to own it.
 *
 * Nothing here is persisted or synced: it is all transient view state, which is
 * why it lives outside `DashboardMetrics`.
 */

export type MetricKey = 'energyPotential' | 'recovery' | 'strain';

export type DashboardPanel =
  | { kind: 'metric'; metric: MetricKey }
  | { kind: 'sleep' }
  | { kind: 'coach' }
  | null;

type DashboardViewStore = {
  bodyView: BodyView;
  selectedMuscleId: MuscleId | null;
  panel: DashboardPanel;

  setBodyView: (view: BodyView) => void;
  selectMuscle: (id: MuscleId) => void;
  clearMuscle: () => void;
  openPanel: (panel: NonNullable<DashboardPanel>) => void;
  closePanel: () => void;
  reset: () => void;
};

/**
 * Two of the five body views are really shortcuts to a panel. Encoding that here
 * rather than in the control component means the rail, a deep link and any
 * future gesture all produce the same result.
 */
function panelForView(view: BodyView): DashboardPanel {
  if (view === 'sleep') return { kind: 'sleep' };
  if (view === 'ai') return { kind: 'coach' };
  return null;
}

export const useDashboardView = create<DashboardViewStore>((set) => ({
  bodyView: 'overview',
  selectedMuscleId: null,
  panel: null,

  setBodyView: (view) => set({ bodyView: view, panel: panelForView(view) }),

  // Selecting from the sleep or AI view implies the user is done with that
  // panel — leaving it open over the details card would cover the thing they
  // just asked to see.
  selectMuscle: (id) =>
    set((state) => ({
      selectedMuscleId: id,
      panel: state.panel?.kind === 'metric' ? null : state.panel,
      bodyView: state.bodyView === 'sleep' || state.bodyView === 'ai' ? 'muscles' : state.bodyView,
    })),

  clearMuscle: () => set({ selectedMuscleId: null }),

  openPanel: (panel) => set({ panel }),

  closePanel: () =>
    set((state) => ({
      panel: null,
      // A view whose whole purpose was the panel has nothing left to show.
      bodyView: state.bodyView === 'sleep' || state.bodyView === 'ai' ? 'overview' : state.bodyView,
    })),

  reset: () => set({ bodyView: 'overview', selectedMuscleId: null, panel: null }),
}));
