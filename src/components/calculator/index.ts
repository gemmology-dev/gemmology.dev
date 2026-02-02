/**
 * Calculator components exports.
 */

export { MeasurementTools } from './MeasurementTools';
export { ConversionTools } from './ConversionTools';
export { SGCalculator } from './SGCalculator';
export { BirefringenceCalc } from './BirefringenceCalc';
export { CriticalAngleCalc } from './CriticalAngleCalc';
export { WeightConverter } from './WeightConverter';
export { LengthConverter } from './LengthConverter';
export { TemperatureConverter } from './TemperatureConverter';
export { CaratEstimator } from './CaratEstimator';
export { RICalculator } from './RICalculator';
export { DispersionCalculator } from './DispersionCalculator';
export { DensityEstimator } from './DensityEstimator';

// Validation
export {
  ValidationMessage,
  validateNumber,
  validateRI,
  validateRIRange,
} from './ValidationMessage';

// Result display (legacy)
export { ResultCard, ResultInline, ResultGroup } from './ResultCard';

// Result display (new consolidated components)
export {
  ResultContainer,
  NumberResult,
  ClassifiedResult,
  MultiValueResult,
  GemMatchBadges,
  GemMatchCard,
  GemMatchList,
} from './results';
