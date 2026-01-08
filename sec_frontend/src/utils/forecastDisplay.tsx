import React from 'react';
import { getMonetaryDisplayParts } from './formatMonetary';

type ForecastDisplayComputationOptions = {
  year?: number;
  hideZero?: boolean;
};

type ForecastDisplayComputation = {
  prefix: string;
  suffix: string;
  value: string;
  shouldDisplay: boolean;
};

const computeForecastDisplay = (
  numericValue: number,
  rawValue: number | string | undefined,
  options: ForecastDisplayComputationOptions = {}
): ForecastDisplayComputation => {
  const { year, hideZero } = options;
  const isForecastYear = typeof year === 'number' && year >= 2025 && year <= 2035;

  // Prefer explicit raw values if present (keeps user formatting intent)
  const rawString =
    rawValue === undefined || rawValue === null || rawValue === '' ? '' : String(rawValue);

  const shouldDisplay =
    (!hideZero || numericValue !== 0) && (rawString !== '' || numericValue !== 0);

  if (!shouldDisplay) {
    return { prefix: '', suffix: '', value: '', shouldDisplay: false };
  }

  // Forecast years are shown as scaled monetary display (B/M/K) via existing helper.
  // Historical can still use same helper for consistent visuals.
  const parts = getMonetaryDisplayParts(numericValue, { year: isForecastYear ? year : undefined });
  if (!parts) {
    return { prefix: '', suffix: '', value: rawString, shouldDisplay: true };
  }
  return { prefix: parts.prefix, suffix: parts.suffix, value: parts.value, shouldDisplay: true };
};

export type ForecastReadonlyInputOptions = ForecastDisplayComputationOptions & {
  inputClassName?: string;
  wrapperClassName?: string;
  emptyValue?: string;
  prefixClassName?: string;
  suffixClassName?: string;
};

export const renderForecastReadonlyInput = (
  numericValue: number,
  rawValue: number | string | undefined,
  options: ForecastReadonlyInputOptions = {}
): React.JSX.Element => {
  const {
    year,
    hideZero,
    inputClassName,
    wrapperClassName,
    emptyValue,
    prefixClassName,
    suffixClassName,
  } = options;

  const { prefix, suffix, value, shouldDisplay } = computeForecastDisplay(
    numericValue,
    rawValue,
    { year, hideZero }
  );

  const inputClasses = `${inputClassName ?? 'w-full p-2 text-center border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/20'} pl-6 pr-6`;
  const wrapperClasses = `relative w-full ${wrapperClassName ?? ''}`.trim();

  return (
    <div className={wrapperClasses}>
      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 ${prefixClassName ?? ''}`.trim()}>
        {prefix}
      </span>
      <input
        type="text"
        value={value}
        readOnly
        className={inputClasses}
        placeholder={shouldDisplay ? undefined : emptyValue}
      />
      {(suffix || shouldDisplay) && (
        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 ${suffixClassName ?? ''}`.trim()}>
          {suffix}
        </span>
      )}
    </div>
  );
};

export type ForecastReadonlyDisplayOptions = ForecastDisplayComputationOptions & {
  wrapperClassName?: string;
  emptyLabel?: string;
  prefixClassName?: string;
  suffixClassName?: string;
};

export const renderForecastReadonlyDisplay = (
  numericValue: number,
  rawValue: number | string | undefined,
  options: ForecastReadonlyDisplayOptions = {}
): React.JSX.Element => {
  const {
    year,
    hideZero,
    wrapperClassName,
    emptyLabel = '—',
    prefixClassName,
    suffixClassName,
  } = options;

  const { prefix, suffix, value, shouldDisplay } = computeForecastDisplay(
    numericValue,
    rawValue,
    { year, hideZero }
  );

  const baseClasses = shouldDisplay
    ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500';

  const wrapperClasses = `relative block rounded p-2 pl-6 pr-6 text-center ${baseClasses} ${wrapperClassName ?? ''}`.trim();

  if (!shouldDisplay) {
    return (
      <div className={wrapperClasses}>
        <span>{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 ${prefixClassName ?? ''}`.trim()}>
        {prefix}
      </span>
      <span>{value}</span>
      {(suffix || shouldDisplay) && (
        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 ${suffixClassName ?? ''}`.trim()}>
          {suffix}
        </span>
      )}
    </div>
  );
};


