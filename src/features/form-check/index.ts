/** Public API of the form-check feature. */
export { FormCheckScreen } from './presentation/screens/FormCheckScreen';
export {
  FORM_CHECK_EXERCISES,
  findFormCheckExercise,
  formatTempo,
  CUE_SEVERITY_LABELS,
} from './domain/entities/form-check';
export type {
  AnalysisSource,
  CueSeverity,
  FormAnalysis,
  FormCheckExercise,
  FormCue,
  Recording,
} from './domain/entities/form-check';
export type { FormAnalyzer } from './domain/ports/form-analyzer';
export { createSampleFormAnalyzer } from './data/sample-form-analyzer';
