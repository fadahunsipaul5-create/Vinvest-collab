// Utility function for formatting monetary values with 3 significant figures

export interface MonetaryScaleOptions {
  year?: number;
  forecastStart?: number;
  forecastEnd?: number;
}

export interface MonetaryDisplayOptions extends MonetaryScaleOptions {
  digits?: number;
  trimTrailingZeros?: boolean;
  prefix?: string;
}

export interface MonetaryDisplayParts {
  prefix: string;
  value: string;
  suffix: string;
  divisor: number;
  scaledValue: number;
}

export const getMonetaryScale = (num: number, options?: MonetaryScaleOptions): { suffix: string; divisor: number } => {
  const { year, forecastStart = 2025, forecastEnd = 2035 } = options ?? {};

  if (typeof year === 'number' && year >= forecastStart && year <= forecastEnd) {
    return { suffix: 'B', divisor: 1_000_000_000 };
  }

  const absValue = Math.abs(num);

  if (absValue >= 1_000_000_000) {
    return { suffix: 'B', divisor: 1_000_000_000 };
  }

  if (absValue >= 1_000_000) {
    return { suffix: 'M', divisor: 1_000_000 };
  }

  if (absValue >= 1_000) {
    return { suffix: 'K', divisor: 1_000 };
  }

  return { suffix: '', divisor: 1 };
};

export const getMonetaryDisplayParts = (
  value: number | string | undefined,
  options?: MonetaryDisplayOptions
): MonetaryDisplayParts | null => {
  if (value === null || value === undefined || value === '') return null;

  let numValue: number;

  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    numValue = parseFloat(cleaned);
    if (Number.isNaN(numValue)) return null;
  } else {
    return null;
  }

  const { digits = 2, trimTrailingZeros = false, prefix = '$' } = options ?? {};
  const { suffix, divisor } = getMonetaryScale(numValue, options);
  const scaled = numValue / divisor;

  let magnitude = Math.abs(scaled).toFixed(digits);
  if (trimTrailingZeros) {
    magnitude = parseFloat(magnitude).toString();
  }

  const sign = numValue < 0 ? '-' : '';

  return {
    prefix,
    value: `${sign}${magnitude}`,
    suffix,
    divisor,
    scaledValue: scaled,
  };
};

export const formatMonetaryValue = (value: number | string | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '');
    numValue = parseFloat(cleaned);
    if (isNaN(numValue)) return value; // Return original string if not a number
  } else {
    return '';
  }
  
  if (numValue === 0) return '$0';
  
  const absValue = Math.abs(numValue);
  let suffix = '';
  let divisor = 1;
  
  if (absValue >= 1_000_000_000) {
    suffix = 'B';
    divisor = 1_000_000_000;
  } else if (absValue >= 1_000_000) {
    suffix = 'M';
    divisor = 1_000_000;
  } else if (absValue >= 1_000) {
    suffix = 'K';
    divisor = 1_000;
  }
  
  const scaledValue = numValue / divisor;
  const roundedValue = parseFloat(scaledValue.toPrecision(3));
  
  return `${numValue < 0 ? '-' : ''}$${Math.abs(roundedValue)}${suffix}`;
};

// Alternative formatting for smaller values that need more precision
export const formatMonetaryValuePrecise = (value: number | string | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    numValue = parseFloat(cleaned);
    if (isNaN(numValue)) return value;
  } else {
    return '';
  }
  
  // Round to 2 decimal places for smaller values
  const rounded = Math.round(numValue * 100) / 100;
  
  if (rounded >= 1000000) {
    const millions = rounded / 1000000;
    return `$${millions.toFixed(1)}M`;
  } else if (rounded >= 1000) {
    const thousands = rounded / 1000;
    return `$${thousands.toFixed(1)}K`;
  } else {
    return `$${rounded.toLocaleString()}`;
  }
};

// Format CAGR values to 2 decimal places with no trailing zeros
export const formatCAGR = (value: number | string | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    numValue = parseFloat(cleaned);
    if (isNaN(numValue)) return value;
  } else {
    return '';
  }
  
  // Round to 2 decimal places and remove trailing zeros
  const rounded = Math.round(numValue * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, '') + '%';
};

// Format percentage values to 2 decimal places for common size tables
export const formatPercentage = (value: number | string | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    numValue = parseFloat(cleaned);
    if (isNaN(numValue)) return value;
  } else {
    return '';
  }
  
  // Round to 2 decimal places
  const rounded = Math.round(numValue * 100) / 100;
  return rounded.toFixed(2) + '%';
};