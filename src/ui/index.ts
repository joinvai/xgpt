/**
 * UI components for XGPT CLI
 * Exports progress bars, spinners, and status displays
 */

// Progress indicators
export {
  ProgressIndicator,
  SingleProgressBar,
  MultiStepProgress,
  createProgressBar,
  ProgressPresets,
  type ProgressOptions,
  type ProgressContext
} from './progress.js';

// Spinners
export {
  Spinner,
  createSpinner,
  SpinnerPresets,
  withSpinner,
  type SpinnerOptions
} from './spinner.js';

// Status displays
export {
  StatusLine,
  StatusDisplay,
  StatusPresets,
  withStatus,
  type StatusLineOptions,
  type StatusMetrics
} from './status.js';