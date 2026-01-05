import React, { useState, useEffect, useCallback, useRef } from 'react';

import { tableConfigs, years, balanceSheetStructure, incomeStatementStructure } from '../data/constants';

import { ppeChangesReal } from '../data/ppeChangesReal';

import { balanceSheetAnalysisReal } from '../data/balanceSheetAnalysisReal';

import { balanceSheetReal } from '../data/balanceSheetReal';

import { investedCapitalReal } from '../data/investedCapitalReal';

import { nopatReal } from '../data/nopatReal';

import { freeCashFlowReal } from '../data/freeCashFlowReal';

import { financeHealthReal } from '../data/financeHealthReal';

import { roicReal } from '../data/roicReal';

import { balanceSheetCommonReal } from '../data/balanceSheetCommonReal';

import { incomeStatementCommonReal } from '../data/incomeStatementCommonReal';

import { operationalPerformanceReal, operationalPerformanceAverages, operationalPerformanceCAGR } from '../data/operationalPerformanceReal';

import { cashFlowReal } from '../data/cashFlowReal';

import { walmartMockData } from '../data/walmartMockData';

import { bjMockData } from '../data/bjMockData';

import { dgMockData } from '../data/dgMockData';

import { dltrMockData } from '../data/dltrMockData';

import { tgtMockData } from '../data/tgtMockData';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCompanyData } from '../contexts/CompanyDataContext';

import baseUrl from './api';

interface CompanyTicker {
  ticker: string;
  name: string;
  display_name?: string;
}

import {

  recalculateDependentFields as calculateDependentFields,

  isCalculatedField as isIncomeCalculatedField,

  isInputField as isIncomeInputField

} from '../utils/incomeStatementCalculations';

import { formatMonetaryValue, formatCAGR, formatPercentage, getMonetaryDisplayParts } from '../utils/formatMonetary';

import {

  recalculateDependentFields as calculateBalanceSheetDependentFields,

  isCalculatedField as isBalanceSheetCalculatedField,

  isInputField as isBalanceSheetInputField

} from '../utils/balanceSheetCalculations';

import {

  calculateAllFields as calculateAllNOPATFields,

  isCalculatedField as isNOPATCalculatedField,

  isInputField as isNOPATInputField

} from '../utils/nopatCalculations';

import {

  recalculateDependentFields as calculateInvestedCapitalDependentFields,

  calculateAllFields as calculateAllInvestedCapitalFields,

  isCalculatedField as isInvestedCapitalCalculatedField,

  isInputField as isInvestedCapitalInputField

} from '../utils/investedCapitalCalculations';

import {

  recalculateDependentFields as _calculatePPEChangesDependentFields,

  calculateAllFields as calculateAllPPEChangesFields,

  isCalculatedField as isPPEChangesCalculatedField,

  isInputField as isPPEChangesInputField

} from '../utils/ppeChangesCalculations';

import {

  recalculateDependentFields as _calculateROICDependentFields,

  calculateAllFields as calculateAllROICFields,

  isCalculatedField as isROICCalculatedField,

  isInputField as isROICInputField

} from '../utils/roicCalculations';

import {

  recalculateDependentFields as _calculateFinancingHealthDependentFields,

  calculateAllFields as calculateAllFinancingHealthFields,

  isCalculatedField as isFinancingHealthCalculatedField,

  isInputField as isFinancingHealthInputField

} from '../utils/financingHealthCalculations';

import {

  recalculateDependentFields as _calculateFreeCashFlowDependentFields,

  calculateAllFields as calculateAllFreeCashFlowFields,

  isCalculatedField as isFreeCashFlowCalculatedField,

  isInputField as isFreeCashFlowInputField

} from '../utils/freeCashFlowCalculations';

import {

  calculateAllFields as calculateAllOperationalPerformanceFields,

  isCalculatedField as _isOperationalPerformanceCalculatedField,

  isInputField as _isOperationalPerformanceInputField

} from '../utils/operationalPerformanceCalculations';



// removed navigate-based routing for balance sheet



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
  const { year, hideZero = false } = options;
  const rawExists = rawValue !== undefined && rawValue !== null && rawValue !== '';
  const parts = getMonetaryDisplayParts(numericValue, { year });
  const prefix = parts?.prefix ?? '$';
  const suffix = parts?.suffix ?? '';
  const shouldDisplay = rawExists && (!hideZero || numericValue !== 0) && !!parts;
  const valueString = shouldDisplay && parts ? parts.value : '';

  return {
    prefix,
    suffix,
    value: valueString,
    shouldDisplay,
  };
};

type ForecastReadonlyInputOptions = ForecastDisplayComputationOptions & {
  inputClassName?: string;
  wrapperClassName?: string;
  emptyValue?: string;
  prefixClassName?: string;
  suffixClassName?: string;
};

const renderForecastReadonlyInput = (
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

type ForecastReadonlyDisplayOptions = ForecastDisplayComputationOptions & {
  wrapperClassName?: string;
  emptyLabel?: string;
  prefixClassName?: string;
  suffixClassName?: string;
};

const renderForecastReadonlyDisplay = (
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



interface CellData {

  [key: string]: number | string;

}



interface TableData {

  [year: number]: CellData;

}



interface EditableTableProps {

  title: string;

  data: TableData;

  isEditable: boolean;

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void;

  tableId: string;

  useHierarchicalStructure?: boolean;

}



const EditableTable: React.FC<EditableTableProps> = ({ 

  title, 

  data, 

  isEditable, 

  onDataChange, 

  tableId,

  useHierarchicalStructure = false

}) => {

  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});



  const handleCellChange = (year: number, field: string, value: string) => {

    const cleanValue = value.trim();

    

    // Handle empty input

    if (cleanValue === '') {

      onDataChange(tableId, year, field, 0);

      return;

    }

    

    // Parse the number

    const numericValue = parseFloat(cleanValue);

    

    // Only update if it's a valid number

    if (Number.isFinite(numericValue)) {

      onDataChange(tableId, year, field, numericValue);

    }

  };



  const formatValue = (value: number | string) => {

    if (typeof value === 'number') {

      return new Intl.NumberFormat('en-US').format(value);

    }

    return value;

  };



  const toggleSection = (sectionKey: string) => {

    setExpandedSections(prev => ({

      ...prev,

      [sectionKey]: !prev[sectionKey]

    }));

  };



  const fields = data[years[0]] ? Object.keys(data[years[0]]) : [];



  return (

    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">

      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>

      </div>

      

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">

              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-30 bg-gray-100 dark:bg-gray-700 border-r dark:border-gray-600 min-w-[250px]">

                Breakdown

              </th>

              {years.map(year => (

                <th key={year} className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px]">

                  {year}

                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {useHierarchicalStructure && (tableId === 'balanceSheet' || tableId === 'incomeStatement') ? (

              // Hierarchical structure for balance sheet or income statement

              Object.entries(tableId === 'balanceSheet' ? balanceSheetStructure : incomeStatementStructure).map(([mainCategory, subCategories]) => (

                <React.Fragment key={mainCategory}>

                  {/* Main category header */}

                  <tr className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">

                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-white sticky left-0 z-20 bg-gray-100 dark:bg-gray-700 border-r dark:border-gray-600">

                      <button

                        onClick={() => toggleSection(mainCategory)}

                        className="flex items-center gap-2 w-full text-left hover:text-gray-600"

                      >

                        <span className={`transform transition-transform ${expandedSections[mainCategory] ? 'rotate-90' : ''}`}>

                          ▶

                        </span>

                        {mainCategory}

                      </button>

                    </td>

                    {years.map(year => (

                      <td key={year} className="p-2 text-center bg-gray-100 dark:bg-gray-700"></td>

                    ))}

                  </tr>

                  

                  {/* Subcategories */}

                  {expandedSections[mainCategory] && Object.entries(subCategories).map(([subCategory, subItems]) => (

                    <React.Fragment key={subCategory}>

                      {typeof subItems === 'object' ? (

                        <>

                          {/* Subcategory header */}

                          <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">

                            <td className="pl-6 px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600">

                              <button

                                onClick={() => toggleSection(`${mainCategory}_${subCategory}`)}

                                className="flex items-center gap-2 w-full text-left hover:text-gray-600"

                              >

                                <span className={`transform transition-transform ${expandedSections[`${mainCategory}_${subCategory}`] ? 'rotate-90' : ''}`}>

                                  ▶

                                </span>

                                {tableId === 'balanceSheet' ? (

                                  subCategory === 'AssetsCurrent' ? '+ Assets Current' :

                                  subCategory === 'AssetsNoncurrent' ? '+ Assets Noncurrent' :

                                  subCategory === 'LiabilitiesCurrent' ? '+ Liabilities Current' :

                                  subCategory === 'LiabilitiesNoncurrent' ? '+ Liabilities Noncurrent' :

                                  subCategory

                                ) : (

                                  subCategory === 'OperatingExpense' ? '+ Operating Expense' :

                                  subCategory === 'NonoperatingIncomeExpense' ? '+ Nonoperating Income Expense' :

                                  subCategory

                                )}

                              </button>

                            </td>

                            {years.map(year => (

                              <td key={year} className="p-2 text-center bg-gray-50"></td>

                            ))}

                          </tr>

                          

                          {/* Individual items */}

                          {expandedSections[`${mainCategory}_${subCategory}`] && subItems && Object.entries(subItems).map(([fieldKey, displayName], index) => {

                            const isCalculatedFieldItem = (tableId === 'incomeStatement' && isIncomeCalculatedField(fieldKey)) || 

                                                              (tableId === 'balanceSheet' && isBalanceSheetCalculatedField(fieldKey));

                            return (

                              <tr 

                                key={fieldKey} 

                                className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-700/50'}`}

                              >

                                <td className="pl-12 px-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-5 bg-inherit border-r dark:border-gray-600">

                                  {isCalculatedFieldItem ? '=' : '^'} {displayName as string}

                                </td>

                              {years.map(year => {

                                const hasField = !!(data[year] && Object.prototype.hasOwnProperty.call(data[year], fieldKey));

                                const rawValue = hasField ? (data[year] as any)[fieldKey] : '';

                                const value = typeof rawValue === 'number' ? rawValue : '';

                                const isHistoricalYear = year <= 2024;

                                const isFutureYear = year >= 2025;

                                const isCalculatedFieldItem = (tableId === 'incomeStatement' && isIncomeCalculatedField(fieldKey)) || 

                                                              (tableId === 'balanceSheet' && isBalanceSheetCalculatedField(fieldKey));

                                const isCellEditable = isEditable && isFutureYear && !isCalculatedFieldItem;

                                const displayValue = value === '' ? '' : (tableId === 'balanceSheet' ? String(value) : formatValue(value));

                                

                                return (

                                  <td key={`${year}-${fieldKey}`} className="p-2 text-center">

                                    {isCellEditable ? (

                                      <input

                                        type="text"

                                        value={String(displayValue)}

                                        onChange={(e) => handleCellChange(year, fieldKey, e.target.value.replace(/,/g, ''))}

                                        className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white"

                                      />

                                    ) : (

                                      <span className={`block p-2 text-center rounded ${

                                        isCalculatedFieldItem

                                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-blue-900 font-bold border border-yellow-300 shadow-sm'

                                          : isHistoricalYear 

                                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300' 

                                            : isFutureYear && !isEditable 

                                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 

                                              : 'bg-gray-100 dark:bg-gray-700'

                                      }`}>

                                        {displayValue}

                                      </span>

                                    )}

                                  </td>

                                );

                              })}

                              </tr>

                            );

                          })}

                        </>

                      ) : (

                        // Direct item (like StockholdersEquity or CalculatedTotals)

                        <tr className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${mainCategory === 'CalculatedTotals' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-gray-800'}`}>

                          <td className={`pl-6 px-4 py-3 sticky left-0 z-5 bg-inherit border-r ${

                            mainCategory === 'CalculatedTotals' 

                              ? 'font-bold text-blue-800' 

                              : 'text-gray-700 dark:text-gray-300'

                          }`}>

                            {mainCategory === 'CalculatedTotals' ? `= ${subItems}` : String(subItems)}

                          </td>

                          {years.map(year => {

                            const hasField = !!(data[year] && Object.prototype.hasOwnProperty.call(data[year], subCategory));

                            const rawValue = hasField ? (data[year] as any)[subCategory] : '';

                            const value = typeof rawValue === 'number' ? rawValue : '';

                            const isHistoricalYear = year <= 2024;

                            const isFutureYear = year >= 2025;

                            const isCalculatedField = mainCategory === 'CalculatedTotals' || 

                              (tableId === 'incomeStatement' && isIncomeCalculatedField(mainCategory)) ||

                              (tableId === 'balanceSheet' && isBalanceSheetCalculatedField(mainCategory));

                            const isCellEditable = isEditable && isFutureYear && !isCalculatedField;

                            const displayValue = value === '' ? '' : (tableId === 'balanceSheet' ? String(value) : formatValue(value));

                            

                            return (

                              <td key={`${year}-${subCategory}`} className="p-2 text-center">

                                {isCellEditable ? (

                                  <input

                                    type="text"

                                    value={String(displayValue)}

                                    onChange={(e) => handleCellChange(year, subCategory, e.target.value.replace(/,/g, ''))}

                                    className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white"

                                  />

                                ) : (

                                  <span className={`block p-2 text-center rounded font-medium ${

                                    isCalculatedField

                                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-blue-900 font-bold border border-yellow-300 shadow-sm'

                                      : isHistoricalYear 

                                        ? 'bg-gray-200 text-gray-600' 

                                        : isFutureYear && !isEditable 

                                          ? 'bg-blue-100 text-blue-800' 

                                          : 'bg-gray-100'

                                  }`}>

                                    {displayValue}

                                  </span>

                                )}

                              </td>

                            );

                          })}

                        </tr>

                      )}

                    </React.Fragment>

                  ))}

                </React.Fragment>

              ))

            ) : (

              // Regular structure for other tables

              fields.map((field) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-5 bg-inherit border-r dark:border-gray-600">

                  {field}

                </td>

                {years.map(year => {

                  const hasField = !!(data[year] && Object.prototype.hasOwnProperty.call(data[year], field));

                  const rawValue = hasField ? (data[year] as any)[field] : '';

                  const value = typeof rawValue === 'number' ? rawValue : '';

                    const isHistoricalYear = year <= 2024;

                    const isFutureYear = year >= 2025;

                    const isCellEditable = isEditable && isFutureYear;

                    

                  return (

                    <td key={`${year}-${field}`} className="p-2 text-center">

                        {isCellEditable ? (

                        <input

                          type="text"

                          value={formatValue(value)}

                          onChange={(e) => handleCellChange(year, field, e.target.value.replace(/,/g, ''))}

                            className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white"

                        />

                      ) : (

                          <span className={`block p-2 text-center rounded ${

                            isHistoricalYear 

                              ? 'bg-gray-200 text-gray-600' 

                              : isFutureYear && !isEditable 

                                ? 'bg-blue-100 text-blue-800' 

                                : 'bg-gray-100'

                          }`}>

                          {formatValue(value)}

                        </span>

                      )}

                    </td>

                  );

                })}

              </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Income Statement table to match the provided image

const IncomeStatementTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isInputField, isCalculatedField, companyTicker = 'COST' }) => {

  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({

    Revenue: true,

    GrossIncome: true,

    OperatingExpense: true,

    Leases: true,

    OperatingIncome: true,

    NonoperatingIncomeExpense: true,

    OtherItems: true,

    PretaxIncome: true,

    ProfitLossControlling: true,

    NetIncome: true,

  });


  // Track raw input strings while user is typing (for natural number entry)
  const [editingInputs, setEditingInputs] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);


  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));



  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const incomeYears: (string | number)[] = ['TTM', ...Array.from({ length: 25 }, (_, i) => 2011 + i)];



  const isEditableYear = (yk: string | number) => typeof yk === 'number' && yk >= 2025 && yk <= 2035;



  // Static currency adorners helpers

  const getScale = (num: number, year?: number | string) => {
    // For forecasted years (2025-2035), always use billions
    if (typeof year === 'number' && year >= 2025 && year <= 2035) {
      return { suffix: 'B', divisor: 1_000_000_000 };
    }
    const abs = Math.abs(num);

    if (abs >= 1_000_000_000) return { suffix: 'B', divisor: 1_000_000_000 };

    if (abs >= 1_000_000) return { suffix: 'M', divisor: 1_000_000 };

    if (abs >= 1_000) return { suffix: 'K', divisor: 1_000 };

    return { suffix: '', divisor: 1 };

  };

  const toScaledString = (num: number, divisor: number) => {

    const scaled = num / divisor;

    return scaled.toFixed(2);

  };



  const getValue = (yearKey: string | number, fieldKey: string) => {

    if (yearKey === 'TTM') {

      // Use latest available year as a proxy for TTM if present

      const latestYear = Math.max(...Object.keys(data).map(y => Number(y)));

      return formatNumber(data[latestYear]?.[fieldKey] as number | string | undefined);

    }

    const yearNum = yearKey as number;

    const existing = data[yearNum]?.[fieldKey] as number | string | undefined;

    if (existing !== undefined && existing !== null && existing !== '') {

      // For forecasted years (2025-2035), format in billions
      if (yearNum >= 2025 && yearNum <= 2035) {
        const numValue = typeof existing === 'number' ? existing : Number(String(existing).replace(/,/g, ''));
        if (!Number.isNaN(numValue) && numValue !== 0) {
          const { suffix, divisor } = getScale(numValue, yearNum);
          const scaled = numValue / divisor;
          return `$${scaled.toFixed(2)}${suffix}`;
        }
      }
      return formatNumber(existing);

    }

    // No fallback dummy values; return empty when data is absent

    return '';

  };



  const getRawValue = (yearKey: string | number, fieldKey: string) => {

    if (typeof yearKey !== 'number') return '';

    // Return the actual value from data

    return (data[yearKey]?.[fieldKey] as number | string | undefined) ?? '';

  };



  const getNumeric = (yearKey: string | number, fieldKey: string) => {

    if (yearKey === 'TTM') {

      const latestYear = Math.max(...Object.keys(data).map(y => Number(y)));

      const v = data[latestYear]?.[fieldKey] as number | string | undefined;

      return typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.replace(/,/g, '')) : 0);

    }

    if (typeof yearKey === 'number') {

      const v = data[yearKey]?.[fieldKey] as number | string | undefined;

    if (typeof v === 'number') return v;

    if (typeof v === 'string') {

      const n = Number(v.replace(/,/g, ''));

      return Number.isNaN(n) ? 0 : n;

    }

    }

    return 0;

  };






  const renderCell = (yk: string | number, fieldKey: string) => {

    const editable = isEditableYear(yk);

    const isInput = isInputField ? isInputField(fieldKey) : false;

    const isCalculated = isCalculatedField ? isCalculatedField(fieldKey) : false;

    

    // For years 2025-2035, show formatted values

    if (typeof yk === 'number' && yk >= 2025 && yk <= 2035) {

      if (editable && (isInput || isCalculated)) {

        // Different rendering for input vs calculated fields

        if (isCalculated) {

          const current = getNumeric(yk as number, fieldKey);
          const rawValue = getRawValue(yk, fieldKey);
          return renderForecastReadonlyInput(current, rawValue, {
            year: yk as number,
            hideZero: true,
          });

        }

        return (

          (() => {

            const fieldKeyStr = `${yk}-${fieldKey}`;
            const isFocused = focusedField === fieldKeyStr;
            const current = getNumeric(yk as number, fieldKey);

            // For forecasted years, always use billions
            const { suffix, divisor } = getScale(current, yk as number);
            
            // Use raw input string while focused, formatted value when not focused
            let displayValue: string;
            if (isFocused && editingInputs[fieldKeyStr] !== undefined) {
              displayValue = editingInputs[fieldKeyStr];
            } else {
              displayValue = ((getRawValue(yk, fieldKey) === undefined || getRawValue(yk, fieldKey) === null || getRawValue(yk, fieldKey) === '')) ? '' : toScaledString(current, divisor);
            }
            
            return (

              <div className="relative">

                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>

                <input

                  type="text"

                  value={displayValue}
                  onFocus={() => {
                    setFocusedField(fieldKeyStr);
                    // Initialize editing input with current formatted value (remove $ and B)
                    const currentValue = getRawValue(yk, fieldKey);
                    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
                      const currentNum = getNumeric(yk as number, fieldKey);
                      const scaled = currentNum / divisor;
                      setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: scaled.toFixed(2) }));
                    } else {
                      setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: '' }));
                    }
                  }}
                  onChange={(e) => {

                    const rawText = e.target.value;

                    // Allow only numbers, decimal point, and minus sign
                    const cleaned = rawText.replace(/[^0-9.-]/g, '').trim();

                    
                    // Update local editing state with raw string for immediate visual feedback
                    setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: cleaned }));
                    
                    // Clear existing debounce timer for this field
                    if (debounceTimers.current[fieldKeyStr]) {
                      clearTimeout(debounceTimers.current[fieldKeyStr]);
                    }
                    
                    // Set new timer - trigger calculations after 100ms of no typing
                    debounceTimers.current[fieldKeyStr] = setTimeout(() => {
                      if (cleaned === '') {
                        onDataChange('incomeStatement', yk as number, fieldKey, '');
                      } else {
                        const numeric = parseFloat(cleaned);
                        if (Number.isFinite(numeric)) {
                          // For forecasted years, always multiply by billions divisor
                          const billionsDivisor = 1_000_000_000;
                          onDataChange('incomeStatement', yk as number, fieldKey, numeric * billionsDivisor);
                        }
                      }
                      delete debounceTimers.current[fieldKeyStr];
                    }, 100);
                  }}
                  onBlur={() => {
                    const rawInput = editingInputs[fieldKeyStr] || '';
                    setFocusedField(null);
                    
                    // Clear any pending debounce timer for this field
                    if (debounceTimers.current[fieldKeyStr]) {
                      clearTimeout(debounceTimers.current[fieldKeyStr]);
                      delete debounceTimers.current[fieldKeyStr];
                    }
                    
                    // Ensure final value is saved (in case debounce didn't trigger yet)
                    if (rawInput === '') {
                      onDataChange('incomeStatement', yk as number, fieldKey, '');

                      setEditingInputs(prev => {
                        const updated = { ...prev };
                        delete updated[fieldKeyStr];
                        return updated;
                      });
                      return;

                    }

                    
                    const numeric = parseFloat(rawInput);
                    if (Number.isFinite(numeric)) {

                      // For forecasted years, always multiply by billions divisor
                      const billionsDivisor = 1_000_000_000;
                      onDataChange('incomeStatement', yk as number, fieldKey, numeric * billionsDivisor);
                    }
                    
                    // Clear editing state after blur
                    setEditingInputs(prev => {
                      const updated = { ...prev };
                      delete updated[fieldKeyStr];
                      return updated;
                    });
                  }}

                  className="w-full pl-6 pr-6 p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                  placeholder=""

                />

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">{suffix}</span>

              </div>

            );

          })()

        );

      }

      const numericValue = getNumeric(yk as number, fieldKey);
      const rawValue = getRawValue(yk as number, fieldKey);



      return renderForecastReadonlyDisplay(numericValue, rawValue, {

        year: yk as number,

        hideZero: true,

      });

    }



    if (editable && typeof yk === 'number' && (isInput || isCalculated)) {

      if (isCalculated) {

        const numericValue = getNumeric(yk as number, fieldKey);
      const rawValue = getRawValue(yk as number, fieldKey);

        return renderForecastReadonlyInput(numericValue, rawValue, {
          year: yk as number,
          hideZero: true,
        });

      }

      return (

        <input

          type="text"

          value={getRawValue(yk, fieldKey) || ''}

          onChange={(e) => {

            const numeric = parseFloat(e.target.value.replace(/,/g, ''));

            onDataChange('incomeStatement', yk, fieldKey, Number.isFinite(numeric) ? numeric : '');

          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

          placeholder=""

        />

      );

    }

    

    // Special handling for OtherIncome to show negative values for historical years

    if (fieldKey === 'OtherIncome' && typeof yk === 'number' && yk <= 2024) {

      const value = getNumeric(yk, fieldKey);

      return (

        <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

          {formatNumber(-value)}

        </span>

      );

    }

    

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {getValue(yk, fieldKey)}

      </span>

    );

  };







  const calculateAverageIS = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length === 0) return '';

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return formatNumber(avg);

  };



  const renderAverageCellIS = (field: string, years: number) => {

    return (

      <td className="p-2 text-center bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white">

        {calculateAverageIS(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsIS = (field: string) => {

    return (

      <>

        {renderAverageCellIS(field, 1)}

        {renderAverageCellIS(field, 2)}

        {renderAverageCellIS(field, 3)}

        {renderAverageCellIS(field, 4)}

        {renderAverageCellIS(field, 5)}

        {renderAverageCellIS(field, 10)}

        {renderAverageCellIS(field, 15)}

      </>

    );

  };



  const calculateCAGRIS = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length < 2) return '';

    const startValue = values[values.length - 1]; // Oldest value

    const endValue = values[0]; // Newest value

    if (startValue === 0) return '';

    const cagr = Math.pow(endValue / startValue, 1 / (years - 1)) - 1;

    return formatCAGR(cagr * 100);

  };



  const renderCAGRCellIS = (field: string, years: number) => {

    return (

      <td className="p-2 text-center bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white">

        {calculateCAGRIS(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsIS = (field: string) => {

    return (

      <>

        {renderCAGRCellIS(field, 1)}

        {renderCAGRCellIS(field, 2)}

        {renderCAGRCellIS(field, 3)}

        {renderCAGRCellIS(field, 4)}

        {renderCAGRCellIS(field, 5)}

        {renderCAGRCellIS(field, 10)}

        {renderCAGRCellIS(field, 15)}

      </>

    );

  };



  return (

    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">

      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{companyTicker} Income Statement Expanded</h3>

              </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">

              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-30 bg-gray-100 dark:bg-gray-700 border-r dark:border-gray-600 min-w-[250px]">

                Breakdown

              </th>

              {incomeYears.map(yk => (

                <th key={String(yk)} className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px]">

                  {typeof yk === 'number' ? `8/31/${yk}` : 'TTM'}

                </th>

              ))}

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last1Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last2Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last3Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last4Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last5Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last10Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last15Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last1Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last2Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last3Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last4Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last5Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last10Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {/* Total Revenue group header with values */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="p-3 font-bold text-gray-800 dark:text-white sticky left-0 z-20 bg-white dark:bg-gray-800 border-r dark:border-gray-600">

                <button onClick={() => toggle('TotalRevenue')} className="w-full text-left">

                  {expanded['TotalRevenue'] ? 'v' : '^'} Total Revenue

              </button>

              </td>

              {incomeYears.map(yk => (

                <td key={`TotalRevenue-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'Revenue')}

                </td>

              ))}{renderAllAverageCellsIS('Revenue')}

              {renderAllCAGRCellsIS('Revenue')}

            </tr>

            {expanded['TotalRevenue'] && (

              <>

                {/* Cost of Revenue row under Total Revenue */}

                <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">

                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Cost of Revenue</td>

                  {incomeYears.map(yk => (

                    <td key={`CostOfRevenue-${String(yk)}`} className="p-2 text-center">

                      {renderCell(yk, 'CostOfRevenue')}

                    </td>

                  ))}{renderAllAverageCellsIS('CostOfRevenue')}

                  {renderAllCAGRCellsIS('CostOfRevenue')}

                </tr>

              </>

            )}



            {/* Gross Income - separate field beneath Total Revenue */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Gross Income</td>

              {incomeYears.map(yk => (

                <td key={`GrossIncome-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'GrossIncome')}

                </td>

              ))}{renderAllAverageCellsIS('GrossIncome')}

              {renderAllCAGRCellsIS('GrossIncome')}

            </tr>



            {/* Operating Expense group header */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                <button onClick={() => toggle('OperatingExpense')} className="w-full text-left">

                  {expanded['OperatingExpense'] ? 'v' : '^'} Operating Expense

                </button>

              </td>

              {incomeYears.map(yk => (

                  <td key={`OperatingExpense-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'OperatingExpense')}

                  </td>

              ))}{renderAllAverageCellsIS('OperatingExpense')}

              {renderAllCAGRCellsIS('OperatingExpense')}

            </tr>

            {expanded['OperatingExpense'] && (

              <>

                <tr className="border-b dark:border-gray-600">

                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Selling General and Administrative</td>

                  {incomeYears.map(yk => (

                    <td key={`SGA-${String(yk)}`} className="p-2 text-center">

                      {renderCell(yk, 'SGAExpense')}

                    </td>

                  ))}<td className="p-2 text-center">

                  </td>

                  {renderAllAverageCellsIS('SGAExpense')}

                  {renderAllCAGRCellsIS('SGAExpense')}

                </tr>

                {/* Additional breakdown rows: Selling & Marketing, G&A */}
                <tr className="border-b dark:border-gray-600">
                  <td className="pl-10 pr-4 py-3 text-gray-600 dark:text-gray-400 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] text-xs">Selling And Marketing</td>
                  {incomeYears.map(yk => (
                    <td key={`SellingAndMarketing-${String(yk)}`} className="p-2 text-center">
                      {renderCell(yk, 'SellingAndMarketingExpense')}
                    </td>
                  ))}<td className="p-2 text-center"></td>
                  {renderAllAverageCellsIS('SellingAndMarketingExpense')}
                  {renderAllCAGRCellsIS('SellingAndMarketingExpense')}
                </tr>

                <tr className="border-b dark:border-gray-600">
                  <td className="pl-10 pr-4 py-3 text-gray-600 dark:text-gray-400 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] text-xs">General And Administrative</td>
                  {incomeYears.map(yk => (
                    <td key={`GeneralAndAdministrative-${String(yk)}`} className="p-2 text-center">
                      {renderCell(yk, 'GeneralAndAdministrativeExpense')}
                    </td>
                  ))}<td className="p-2 text-center"></td>
                  {renderAllAverageCellsIS('GeneralAndAdministrativeExpense')}
                  {renderAllCAGRCellsIS('GeneralAndAdministrativeExpense')}
                </tr>

                <tr className="border-b dark:border-gray-600">

                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Research And Development</td>

                  {incomeYears.map(yk => (

                    <td key={`RND-${String(yk)}`} className="p-2 text-center">

                      {renderCell(yk, 'ResearchAndDevelopment')}

                    </td>

                  ))}<td className="p-2 text-center">

                  </td>

                  {renderAllAverageCellsIS('ResearchAndDevelopment')}

                  {renderAllCAGRCellsIS('ResearchAndDevelopment')}

                </tr>

                {/* Additional breakdown rows: Fulfillment, Technology */}
                <tr className="border-b dark:border-gray-600">
                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Fulfillment</td>
                  {incomeYears.map(yk => (
                    <td key={`Fulfillment-${String(yk)}`} className="p-2 text-center">
                      {renderCell(yk, 'FulfillmentExpense')}
                    </td>
                  ))}<td className="p-2 text-center"></td>
                  {renderAllAverageCellsIS('FulfillmentExpense')}
                  {renderAllCAGRCellsIS('FulfillmentExpense')}
                </tr>

                <tr className="border-b dark:border-gray-600">
                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Technology</td>
                  {incomeYears.map(yk => (
                    <td key={`Technology-${String(yk)}`} className="p-2 text-center">
                      {renderCell(yk, 'TechnologyExpense')}
                    </td>
                  ))}<td className="p-2 text-center"></td>
                  {renderAllAverageCellsIS('TechnologyExpense')}
                  {renderAllCAGRCellsIS('TechnologyExpense')}
                </tr>

                <tr className="border-b dark:border-gray-600">

                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Depreciation</td>

                  {incomeYears.map(yk => (

                    <td key={`Depreciation-${String(yk)}`} className="p-2 text-center">

                      {renderCell(yk, 'DepreciationAmortization')}

                    </td>

                  ))}<td className="p-2 text-center">

                  </td>

                  {renderAllAverageCellsIS('DepreciationAmortization')}

                  {renderAllCAGRCellsIS('DepreciationAmortization')}

                </tr>

              </>

            )}



            {/* Operating Income */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Operating Income</td>

              {incomeYears.map(yk => (

                <td key={`OperatingIncome-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'OperatingIncome')}

                </td>

              ))}{renderAllAverageCellsIS('OperatingIncome')}

              {renderAllCAGRCellsIS('OperatingIncome')}

            </tr>



            

            {/* NonoperatingIncomeExpense group */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                <button onClick={() => toggle('NetNonOperating')} className="w-full text-left">

                  {expanded['NetNonOperating'] ? 'v' : '^'} NonoperatingIncomeExpense

                </button>

              </td>

              {incomeYears.map(yk => (

                  <td key={`NetNonOperating-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'NetNonOperatingInterestIncome')}

                  </td>

              ))}{renderAllAverageCellsIS('NonoperatingIncomeExpense')}

              {renderAllCAGRCellsIS('NonoperatingIncomeExpense')}

            </tr>

            {expanded['NetNonOperating'] && (

              <>

                <tr className="border-b dark:border-gray-600">

                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Interest Income Non Operating</td>

                  {incomeYears.map(yk => (

                    <td key={`InterestIncome-${String(yk)}`} className="p-2 text-center">

                      {renderCell(yk, 'InterestIncome')}

                    </td>

                  ))}<td className="p-2 text-center">

                  </td>

                  {renderAllAverageCellsIS('InterestIncome')}

                  {renderAllCAGRCellsIS('InterestIncome')}

                </tr>

                <tr className="border-b dark:border-gray-600">

                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Interest Expense Non Operating</td>

                  {incomeYears.map(yk => (

                    <td key={`InterestExpense-${String(yk)}`} className="p-2 text-center">

                      {renderCell(yk, 'InterestExpense')}

                    </td>

                  ))}{renderAllAverageCellsIS('InterestExpense')}

                  {renderAllCAGRCellsIS('InterestExpense')}

                </tr>

                <tr className="border-b dark:border-gray-600">

                  <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]"> Other Income</td>

                  {incomeYears.map(yk => (

                    <td key={`OtherIncome-${String(yk)}`} className="p-2 text-center">

                      {renderCell(yk, 'OtherIncome')}

                    </td>

                  ))}{renderAllAverageCellsIS('OtherIncome')}

                  {renderAllCAGRCellsIS('OtherIncome')}

                </tr>

              </>

            )}



            {/* Pretax Income */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                <button onClick={() => toggle('PretaxIncome')} className="w-full text-left">

                  {expanded['PretaxIncome'] ? 'v' : '^'} Pretax Income

                </button>

              </td>

              {incomeYears.map(yk => (

                <td key={`PretaxIncome-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'PretaxIncome')}

                </td>

              ))}{renderAllAverageCellsIS('PretaxIncome')}

              {renderAllCAGRCellsIS('PretaxIncome')}

            </tr>

            {expanded['PretaxIncome'] && (

              <tr className="border-b dark:border-gray-600">

                <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">TaxProvision</td>

                {incomeYears.map(yk => (

                  <td key={`TaxProvision-${String(yk)}`} className="p-2 text-center">

                    {renderCell(yk, 'TaxProvision')}

                  </td>

                ))}{renderAllAverageCellsIS('TaxProvision')}

                {renderAllCAGRCellsIS('TaxProvision')}

              </tr>

            )}



            {/* ProfitLossControlling group */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                <button onClick={() => toggle('ProfitLossControlling')} className="w-full text-left">

                  {expanded['ProfitLossControlling'] ? 'v' : '^'} ProfitLossControlling

                </button>

              </td>

              {incomeYears.map(yk => (

                <td key={`ProfitLossControlling-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'ProfitLossControlling')}

                </td>

              ))}{renderAllAverageCellsIS('ProfitLossControlling')}

              {renderAllCAGRCellsIS('ProfitLossControlling')}

            </tr>

            {expanded['ProfitLossControlling'] && (

              <tr className="border-b dark:border-gray-600">

                <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">NetIncomeNoncontrolling</td>

                {incomeYears.map(yk => (

                  <td key={`NetIncomeNoncontrolling-${String(yk)}`} className="p-2 text-center">

                    {renderCell(yk, 'NetIncomeNoncontrolling')}

                  </td>

                ))}{renderAllAverageCellsIS('NetIncomeNoncontrolling')}

                {renderAllCAGRCellsIS('NetIncomeNoncontrolling')}

              </tr>

            )}



            {/* NetIncome - separate field */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">NetIncome</td>

              {incomeYears.map(yk => (

                <td key={`NetIncome-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'NetIncome')}

                </td>

              ))}{renderAllAverageCellsIS('NetIncome')}

              {renderAllCAGRCellsIS('NetIncome')}

            </tr>



            {/* OperatingLeaseCost - new field */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OperatingLeaseCost</td>

              {incomeYears.map(yk => (

                <td key={`OperatingLeaseCost-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'OperatingLeaseCost')}

                </td>

              ))}{renderAllAverageCellsIS('OperatingLeaseCost')}

              {renderAllCAGRCellsIS('OperatingLeaseCost')}

            </tr>



            {/* VariableLeaseCost - new field */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">VariableLeaseCost</td>

              {incomeYears.map(yk => (

                <td key={`VariableLeaseCost-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'VariableLeaseCost')}

                </td>

              ))}{renderAllAverageCellsIS('VariableLeaseCost')}

              {renderAllCAGRCellsIS('VariableLeaseCost')}

            </tr>



            {/* LeasesDiscountRate - new field */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">LeasesDiscountRate</td>

              {incomeYears.map(yk => (

                <td key={`LeasesDiscountRate-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'LeasesDiscountRate')}

                </td>

              ))}{renderAllAverageCellsIS('LeasesDiscountRate')}

              {renderAllCAGRCellsIS('LeasesDiscountRate')}

            </tr>



            {/* ForeignCurrencyAdjustment - new field */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">ForeignCurrencyAdjustment</td>

              {incomeYears.map(yk => (

                <td key={`ForeignCurrencyAdjustment-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'ForeignCurrencyAdjustment')}

                </td>

              ))}{renderAllAverageCellsIS('ForeignCurrencyAdjustment')}

              {renderAllCAGRCellsIS('ForeignCurrencyAdjustment')}

            </tr>



          </tbody>

        </table>

      </div>

    </div>

  );

};



// NoPAT table component

const NoPATTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isInputField: _isInputField, isCalculatedField, companyTicker = 'COST' }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const yearsList: number[] = years;




  const mapKeyFCF = (k: string): string => {

    switch (k) {

      case 'NetOperatingProfitAfterTax':

        return 'NetOperatingProfitAfterTaxes';

      case 'ChangeInWorkingCapital':

        // Prefer decrease series if available

        return 'DecreaseInWorkingCapital';

      case 'ChangeInOperatingLease':

        return 'DecreaseInOperatingLeases';

      case 'ChangeInVariableLease':

        return 'DecreaseInVariableLeases';

      case 'ChangeInFinanceLease':

        return 'DecreaseInFinanceLeases';

      case 'Goodwill':

        return 'DecreaseInGoodwill';

      case 'ChangeInOtherAssets':

        return 'DecreaseInOtherAssetsNetOfOtherLiabilities';

      case 'ChangeInCashAndCashEquiv':

        return 'DecreaseInExcessCash';

      default:

        return k;

    }

  };



  const getRaw = (year: number, key: string) => {

    const mapped = mapKeyFCF(key);

    return (data[year]?.[mapped] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };






  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    

    // For years 2025-2035, allow inputs for fields that are not calculated

    if (year >= 2025 && year <= 2035) {

      if (isCalculated) {

        const numericValue = getNumeric(year, key);
        const rawValue = getRaw(year, key);
        return renderForecastReadonlyInput(numericValue, rawValue, {
          year,
        });

      }

      return (

        <input

          type="text"

          value={(getRaw(year, key) === undefined || getRaw(year, key) === null) ? '' : String(getRaw(year, key) as any)}

          onChange={(e) => {

            const inputValue = e.target.value;

            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              if (inputValue.trim() === '') {
                onDataChange('nopat', year, key, '');
              } else {
                const numeric = parseFloat(inputValue.replace(/,/g, ''));
                if (Number.isFinite(numeric)) {
                  onDataChange('nopat', year, key, numeric);
                }
              }
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const inputValue = e.target.value;
            if (inputValue.trim() === '') {
              onDataChange('nopat', year, key, '');
            } else {
              const numeric = parseFloat(inputValue.replace(/,/g, ''));
              if (Number.isFinite(numeric)) {
                onDataChange('nopat', year, key, numeric);
              }
            }
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }

    

    if (year >= 2025 && year <= 2035) {

      if (isCalculated) {

      const numericValue = getNumeric(year, key);
      const rawValue = getRaw(year, key);
      return renderForecastReadonlyInput(numericValue, rawValue, {
        year,
      });

      }

      return (

        <input

          type="text"

          value={formatNumber(getNumeric(year, key))}

          onChange={(e) => {

            const inputValue = e.target.value.replace(/,/g, '').trim();

            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              if (inputValue === '') {
                onDataChange('nopat', year, key, '');
              } else {
                const numeric = parseFloat(inputValue);
                if (Number.isFinite(numeric)) {
                  onDataChange('nopat', year, key, numeric);
                }
              }
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const inputValue = e.target.value.replace(/,/g, '').trim();
            if (inputValue === '') {
              onDataChange('nopat', year, key, '');
            } else {
              const numeric = parseFloat(inputValue);
              if (Number.isFinite(numeric)) {
                onDataChange('nopat', year, key, numeric);
              }
            }
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }



    // Historical years (2005-2024) - non-editable

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {formatNumber(getNumeric(year, key))}

      </span>

    );

  };



  const fields = [

    'Revenue',

    'CostOfRevenue', 

    'SellingGeneralAndAdministration',

    'Depreciation',

    'EBITA_Unadjusted',

    'OperatingLeaseInterest',

    'VariableLeaseInterest',

    'EBITAAdjusted',

    'TaxProvision',

    'NetOperatingProfitAfterTaxes'

  ];



  const fieldTypes = [

    'Input',

    'Input', 

    'Input',

    'Input',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Input',

    'Calculated'

  ];



  const calculateAverageNoPAT = (field: string, years: number) => {

    const key = `Last${years}Y_AVG`;

    const avgData = data[key as any]?.[field] as number | undefined;

    return typeof avgData === 'number' ? formatNumber(avgData) : '';

  };



  const renderAverageCellNoPAT = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageNoPAT(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsNoPAT = (field: string) => {

    return (

      <>

        {renderAverageCellNoPAT(field, 1)}

        {renderAverageCellNoPAT(field, 2)}

        {renderAverageCellNoPAT(field, 3)}

        {renderAverageCellNoPAT(field, 4)}

        {renderAverageCellNoPAT(field, 5)}

        {renderAverageCellNoPAT(field, 10)}

        {renderAverageCellNoPAT(field, 15)}

      </>

    );

  };



  const calculateCAGRNoPAT = (field: string, years: number) => {

    const key = `Last${years}Y_CAGR`;

    const cagrData = data[key as any]?.[field] as number | undefined;

    return typeof cagrData === 'number' ? formatCAGR(cagrData * 100) : '';

  };



  const renderCAGRCellNoPAT = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRNoPAT(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsNoPAT = (field: string) => {

    return (

      <>

        {renderCAGRCellNoPAT(field, 1)}

        {renderCAGRCellNoPAT(field, 2)}

        {renderCAGRCellNoPAT(field, 3)}

        {renderCAGRCellNoPAT(field, 4)}

        {renderCAGRCellNoPAT(field, 5)}

        {renderCAGRCellNoPAT(field, 10)}

        {renderCAGRCellNoPAT(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} NoPAT</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsNoPAT(field)}

                {renderAllCAGRCellsNoPAT(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};





// Invested Capital table component

const InvestedCapitalTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isCalculatedField, companyTicker = 'COST' }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    

    // For years 2025-2035, all fields are calculated (read-only)

    if (year >= 2025 && year <= 2035) {

      const numericValue = getNumeric(year, key);
      const rawValue = getRaw(year, key);
      return renderForecastReadonlyInput(numericValue, rawValue, {
        year,
      });

    }

    

    if (year >= 2025 && year <= 2035) {

      if (isCalculated) {

        const numericValue = getNumeric(year, key);
        const rawValue = getRaw(year, key);

        return renderForecastReadonlyInput(numericValue, rawValue, {
          year,
        });

      }

      return (

        <input

          type="text"

          value={formatNumber(getNumeric(year, key))}

          onChange={(e) => {

            const inputValue = e.target.value.replace(/,/g, '').trim();
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              if (inputValue === '') {
                onDataChange('investedCapital', year, key, '');
              } else {
                const numeric = parseFloat(inputValue);
                onDataChange('investedCapital', year, key, Number.isFinite(numeric) ? numeric : '');
              }
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const inputValue = e.target.value.replace(/,/g, '').trim();
            if (inputValue === '') {
              onDataChange('investedCapital', year, key, '');
            } else {
              const numeric = parseFloat(inputValue);
              onDataChange('investedCapital', year, key, Number.isFinite(numeric) ? numeric : '');
            }
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }



    // Historical years (2005-2024) - non-editable

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {formatNumber(getNumeric(year, key))}

      </span>

    );

  };



  const fields = [

    'OperatingCash',

    'OperatingAssetsCurrent',

    'OperatingLiabilitiesCurrent',

    'OperatingWorkingCapital',

    'PropertyPlantAndEquipment',

    'OperatingLeaseAssets',

    'VariableLeaseAssets',

    'FinanceLeaseAssets',

    'OtherAssetsNetOtherLiabilities',

    'InvestedCapitalExcludingGoodwill',

    'Goodwill',

    'InvestedCapitalIncludingGoodwill',

    'ExcessCash',

    'ForeignTaxCreditCarryForward',

    'TotalFundsInvested',

    'Debt',

    'OperatingLeaseLiabilities',

    'VariableLeaseLiabilities',

    'FinanceLeaseLiabilities',

    'DebtAndDebtEquivalents',

    'DeferredIncomeTaxesNet',

    'NoncontrollingInterests',

    'Equity',

    'TotalFundsInvestedValidation'

  ];



  const fieldTypes = [

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated'

  ];



  const calculateAverageIC = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length === 0) return '';

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return formatNumber(avg);

  };



  const renderAverageCellIC = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageIC(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsIC = (field: string) => {

    return (

      <>

        {renderAverageCellIC(field, 1)}

        {renderAverageCellIC(field, 2)}

        {renderAverageCellIC(field, 3)}

        {renderAverageCellIC(field, 4)}

        {renderAverageCellIC(field, 5)}

        {renderAverageCellIC(field, 10)}

        {renderAverageCellIC(field, 15)}

      </>

    );

  };



  const calculateCAGRIC = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length < 2) return '';

    const startValue = values[values.length - 1]; // Oldest value

    const endValue = values[0]; // Newest value

    if (startValue === 0) return '';

    const cagr = Math.pow(endValue / startValue, 1 / (years - 1)) - 1;

    return formatCAGR(cagr * 100);

  };



  const renderCAGRCellIC = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRIC(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsIC = (field: string) => {

    return (

      <>

        {renderCAGRCellIC(field, 1)}

        {renderCAGRCellIC(field, 2)}

        {renderCAGRCellIC(field, 3)}

        {renderCAGRCellIC(field, 4)}

        {renderCAGRCellIC(field, 5)}

        {renderCAGRCellIC(field, 10)}

        {renderCAGRCellIC(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} Invested Capital</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsIC(field)}

                {renderAllCAGRCellsIC(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Free Cash Flow table component

const FreeCashFlowTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isInputField: _isInputField, isCalculatedField: _isCalculatedField, companyTicker = 'COST' }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  // Helper functions for scaling values

  const getScale = (num: number) => {

    const abs = Math.abs(num);

    if (abs >= 1_000_000_000) return { suffix: 'B', divisor: 1_000_000_000 };

    if (abs >= 1_000_000) return { suffix: 'M', divisor: 1_000_000 };

    if (abs >= 1_000) return { suffix: 'K', divisor: 1_000 };

    return { suffix: '', divisor: 1 };

  };



  const toScaledString = (num: number, divisor: number) => {

    const scaled = num / divisor;

    return scaled.toFixed(2);

  };



  const renderCell = (year: number, key: string) => {

    const isInput = isFreeCashFlowInputField ? isFreeCashFlowInputField(key) : false;


    const raw = getRaw(year, key);

    const hasData = raw !== undefined && raw !== null && raw !== '';

    const numericValue = getNumeric(year, key);

    const displayValue = hasData ? formatNumber(numericValue) : '';

    

    // For years 2025-2035 (forecast years)

    if (year >= 2025 && year <= 2035) {

      if (isInput) {

        return (

          (() => {

            const current = numericValue;

            const { suffix, divisor } = getScale(current);

            const inputValue = ((raw === undefined || raw === null || raw === '')) ? '' : toScaledString(current, divisor);

            return (

              <div className="relative">

                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>

                <input

                  type="text"

                  value={inputValue}

                  onChange={(e) => {

                    const rawText = e.target.value;
                    const cleaned = rawText.replace(/[^0-9.-]/g, '').trim();
                    const fieldKeyStr = `${year}-${key}`;
                    
                    // Clear existing debounce timer for this field
                    if (debounceTimers.current[fieldKeyStr]) {
                      clearTimeout(debounceTimers.current[fieldKeyStr]);
                    }
                    
                    // Set new timer - trigger calculations after 100ms of no typing
                    debounceTimers.current[fieldKeyStr] = setTimeout(() => {
                      if (cleaned === '') {
                        onDataChange('freeCashFlow', year, key, '');
                      } else {
                        const numeric = parseFloat(cleaned);
                        if (Number.isFinite(numeric)) {
                          onDataChange('freeCashFlow', year, key, numeric * divisor);
                        }
                      }
                      delete debounceTimers.current[fieldKeyStr];
                    }, 100);
                  }}

                  onBlur={(e) => {
                    const fieldKeyStr = `${year}-${key}`;
                    
                    // Clear any pending debounce timer for this field
                    if (debounceTimers.current[fieldKeyStr]) {
                      clearTimeout(debounceTimers.current[fieldKeyStr]);
                      delete debounceTimers.current[fieldKeyStr];
                    }
                    
                    // Ensure final value is saved (in case debounce didn't trigger yet)
                    const cleaned = e.target.value.replace(/[^0-9.-]/g, '').trim();
                    if (cleaned === '') {
                      onDataChange('freeCashFlow', year, key, '');
                    } else {
                      const numeric = parseFloat(cleaned);
                      if (Number.isFinite(numeric)) {
                        onDataChange('freeCashFlow', year, key, numeric * divisor);
                      }
                    }
                  }}

                  className="w-full pl-6 pr-6 p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                />

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">{suffix}</span>

              </div>

            );

          })()

        );

      } else {

        // Calculated fields for forecast years - light blue background

        return renderForecastReadonlyDisplay(numericValue, raw, {
          year,
        });

      }

    }

    

    // Historical years (2011-2024) - plain styling

    return (

      <span className={`block p-2 text-center ${hasData ? 'text-gray-700' : 'text-gray-400'}`}>

        {displayValue || '—'}

      </span>

    );

  };



  const fields = [

    'NetOperatingProfitAfterTaxes',

    'Depreciation',

    'GrossCashFlow',

    'DecreaseInWorkingCapital',

    'CapitalExpenditures',

    'DecreaseInOperatingLeases',

    'DecreaseInVariableLeases',

    'DecreaseInFinanceLeases',

    'DecreaseInGoodwill',

    'DecreaseInOtherAssetsNetOfOtherLiabilities',

    'FreeCashFlow',

    'InterestIncome',

    'OtherIncome',

    'TaxesNonoperating',

    'DecreaseInExcessCash',

    'DecreaseInForeignTaxCreditCarryForward',

    'ForeignCurrencyAdjustment',

    'UnexplainedChangesInPPE',

    'CashFlowToInvestors',

    'ExcessCash',

    'DiscountFactor',

    'PresentValue'

  ];



  const fieldTypes = [

    'Calculated', // NetOperatingProfitAfterTaxes

    'Calculated', // Depreciation

    'Calculated', // GrossCashFlow

    'Calculated', // DecreaseInWorkingCapital

    'Input', // CapitalExpenditures

    'Calculated', // DecreaseInOperatingLeases

    'Calculated', // DecreaseInVariableLeases

    'Calculated', // DecreaseInFinanceLeases

    'Calculated', // DecreaseInGoodwill

    'Calculated', // DecreaseInOtherAssetsNetOfOtherLiabilities

    'Calculated', // FreeCashFlow

    'Calculated', // InterestIncome

    'Calculated', // OtherIncome

    'Input', // TaxesNonoperating

    'Calculated', // DecreaseInExcessCash

    'Calculated', // DecreaseInForeignTaxCreditCarryForward

    'Calculated', // ForeignCurrencyAdjustment

    'Calculated', // UnexplainedChangesInPPE

    'Calculated', // CashFlowToInvestors

    'Calculated', // ExcessCash

    'Calculated', // DiscountFactor

    'Calculated'  // PresentValue

  ];



  const calculateAverageFCF = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length === 0) return '';

    const sum = values.reduce((acc, val) => acc + val, 0);

    return (sum / values.length).toFixed(2);

  };



  const renderAverageCellFCF = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageFCF(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsFCF = (field: string) => {

    return (

      <>

        {renderAverageCellFCF(field, 1)}

        {renderAverageCellFCF(field, 2)}

        {renderAverageCellFCF(field, 3)}

        {renderAverageCellFCF(field, 4)}

        {renderAverageCellFCF(field, 5)}

        {renderAverageCellFCF(field, 10)}

        {renderAverageCellFCF(field, 15)}

      </>

    );

  };



  const calculateCAGRFCF = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length < 2) return '';

    const startValue = values[values.length - 1]; // Oldest value

    const endValue = values[0]; // Newest value

    if (startValue === 0) return '';

    const cagr = Math.pow(endValue / startValue, 1 / (years - 1)) - 1;

    return formatCAGR(cagr * 100);

  };



  const renderCAGRCellFCF = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRFCF(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsFCF = (field: string) => {

    return (

      <>

        {renderCAGRCellFCF(field, 1)}

        {renderCAGRCellFCF(field, 2)}

        {renderCAGRCellFCF(field, 3)}

        {renderCAGRCellFCF(field, 4)}

        {renderCAGRCellFCF(field, 5)}

        {renderCAGRCellFCF(field, 10)}

        {renderCAGRCellFCF(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} Free Cash Flow</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsFCF(field)}

                {renderAllCAGRCellsFCF(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Cash Flows table component

const CashFlowsTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isCalculatedField, companyTicker = 'COST' }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    

    if (year >= 2025 && year <= 2035) {

      if (isCalculated) {

        const numericValue = getNumeric(year, key);
        const rawValue = getRaw(year, key);

        return renderForecastReadonlyInput(numericValue, rawValue, {
          year,
        });

      }

      return (

        <input

          type="text"

          value={formatNumber(getNumeric(year, key))}

          onChange={(e) => {

            const inputValue = e.target.value;
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              const numeric = parseFloat(inputValue.replace(/,/g, ''));
              onDataChange('cashFlows', year, key, Number.isFinite(numeric) ? numeric : 0);
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const numeric = parseFloat(e.target.value.replace(/,/g, ''));
            onDataChange('cashFlows', year, key, Number.isFinite(numeric) ? numeric : 0);
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }



    // Historical years (2011-2024) - non-editable

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {formatNumber(getNumeric(year, key))}

      </span>

    );

  };



  const fields = [

    // Operating Cash Flow

    'NetIncome',

    'DepreciationDepletionAndAmortization',

    'OtherNoncashChanges',

    'DeferredTax',

    'AssetImpairmentCharge',

    'ShareBasedCompensation',

    'ChangeInReceivables',

    'ChangeInInventory',

    'ChangeInPayable',

    'ChangeInOtherCurrentAssets',

    'ChangeInOtherCurrentLiabilities',

    'ChangeInOtherWorkingCapital',

    // Investing Cash Flow

    'PurchaseOfPPE',

    'SaleOfPPE',

    'PurchaseOfBusiness',

    'SaleOfBusiness',

    'PurchaseOfInvestment',

    'SaleOfInvestment',

    'OtherInvestingChanges',

    // Financing Cash Flow

    'ShortTermDebtIssuance',

    'ShortTermDebtPayment',

    'LongTermDebtIssuance',

    'LongTermDebtPayment',

    'CommonStockIssuance',

    'CommonStockRepurchasePayment',

    'CommonStockDividendPayment',

    'TaxWithholdingPayment',

    'FinancingLeasePayment',

    'MinorityDividendPayment',

    'MinorityShareholderPayment'

  ];



  const fieldTypes = [

    'Input', // NetIncome

    'Input', // DepreciationDepletionAndAmortization

    'Input', // OtherNoncashChanges

    'Input', // DeferredTax

    'Input', // AssetImpairmentCharge

    'Input', // ShareBasedCompensation

    'Input', // ChangeInReceivables

    'Input', // ChangeInInventory

    'Input', // ChangeInPayable

    'Input', // ChangeInOtherCurrentAssets

    'Input', // ChangeInOtherCurrentLiabilities

    'Input', // ChangeInOtherWorkingCapital

    'Input', // PurchaseOfPPE

    'Input', // SaleOfPPE

    'Input', // PurchaseOfBusiness

    'Input', // SaleOfBusiness

    'Input', // PurchaseOfInvestment

    'Input', // SaleOfInvestment

    'Input', // OtherInvestingChanges

    'Input', // ShortTermDebtIssuance

    'Input', // ShortTermDebtPayment

    'Input', // LongTermDebtIssuance

    'Input', // LongTermDebtPayment

    'Input', // CommonStockIssuance

    'Input', // CommonStockRepurchasePayment

    'Input', // CommonStockDividendPayment

    'Input', // TaxWithholdingPayment

    'Input', // FinancingLeasePayment

    'Input', // MinorityDividendPayment

    'Input'  // MinorityShareholderPayment

  ];



  const calculateAverageCF = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length === 0) return '';

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return formatNumber(avg);

  };



  const renderAverageCellCF = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageCF(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsCF = (field: string) => {

    return (

      <>

        {renderAverageCellCF(field, 1)}

        {renderAverageCellCF(field, 2)}

        {renderAverageCellCF(field, 3)}

        {renderAverageCellCF(field, 4)}

        {renderAverageCellCF(field, 5)}

        {renderAverageCellCF(field, 10)}

        {renderAverageCellCF(field, 15)}

      </>

    );

  };



  const calculateCAGRCF = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length < 2) return '';

    

    const firstValue = values[values.length - 1];

    const lastValue = values[0];

    

    if (firstValue === 0 || lastValue === 0) return '';

    

    const cagr = Math.pow(lastValue / firstValue, 1 / (values.length - 1)) - 1;

    return formatCAGR(cagr * 100);

  };



  const renderCAGRCellCF = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRCF(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsCF = (field: string) => {

    return (

      <>

        {renderCAGRCellCF(field, 1)}

        {renderCAGRCellCF(field, 2)}

        {renderCAGRCellCF(field, 3)}

        {renderCAGRCellCF(field, 4)}

        {renderCAGRCellCF(field, 5)}

        {renderCAGRCellCF(field, 10)}

        {renderCAGRCellCF(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} Cash Flows</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsCF(field)}

                {renderAllCAGRCellsCF(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Income Statement Common Size table component

const IncomeStatementCommonSizeTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isCalculatedField, companyTicker = 'COST' }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined) => {

    return formatPercentage(value);

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    

    // For years 2025-2035, all fields are calculated (read-only)

    if (year >= 2025 && year <= 2035) {

      const numericValue = getNumeric(year, key);
      const rawValue = getRaw(year, key);

      return renderForecastReadonlyInput(numericValue, rawValue, {
        year,
      });

    }

    

    if (year >= 2025 && year <= 2035) {

      if (isCalculated) {

        const numericValue = getNumeric(year, key);
        const rawValue = getRaw(year, key);

        return renderForecastReadonlyInput(numericValue, rawValue, {
          year,
        });

      }

      return (

        <input

          type="text"

          value={formatNumber(getNumeric(year, key))}

          onChange={(e) => {

            const inputValue = e.target.value;
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              const numeric = parseFloat(inputValue.replace(/,/g, ''));
              onDataChange('incomeStatementCommonSize', year, key, Number.isFinite(numeric) ? numeric : 0);
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const numeric = parseFloat(e.target.value.replace(/,/g, ''));
            onDataChange('incomeStatementCommonSize', year, key, Number.isFinite(numeric) ? numeric : 0);
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }



    // Historical years (2005-2024) - non-editable

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {formatNumber(getNumeric(year, key))}

      </span>

    );

  };



  const fields = [

    'CostOfRevenueAsPercentOfRevenue',

    'GrossMarginAsPercentOfRevenue',

    'SGAAsPercentOfRevenue',

    'DepreciationAsPercentOfRevenue',

    'DepreciationAsPercentOfLastYearPPE',

    'OtherOperatingExpenseAsPercentOfRevenue',

    'OperatingIncomeAsPercentOfRevenue',

    'InterestExpenseAsPercentOfRevenue',

    'InterestIncomeAsPercentOfRevenue',

    'OtherIncomeAsPercentOfRevenue',

    'PretaxIncomeAsPercentOfRevenue',

    'TaxProvisionAsPercentOfRevenue',

    'TaxProvisionAsPercentOfPretaxIncome',

    'NetIncomeNoncontrollingAsPercentOfRevenue',

    'NetIncomeAsPercentOfRevenue',

    'CapitalExpendituresAsPercentOfRevenue',

    'UnexplainedChangedInPPEAsPercentOfRevenue',

    'InterestExpenseAsPercentOfPriorYearDebt',

    'InterestIncomeAsPercentOfPriorYearExcessCash',

    'DividendAsPercentOfNetIncome',

    'OperatingLeaseCostAsPercentOfRevenue',

    'VariableLeaseCostAsPercentOfRevenue',

    'ForeignCurrencyAdjustmentAsPercentOfRevenue'

  ];



  const fieldTypes = [

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated'

  ];



  const calculateAverageISCS = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length === 0) return '';

    const sum = values.reduce((acc, val) => acc + val, 0);

    return formatPercentage(sum / values.length);

  };



  const renderAverageCellISCS = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageISCS(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsISCS = (field: string) => {

    return (

      <>

        {renderAverageCellISCS(field, 1)}

        {renderAverageCellISCS(field, 2)}

        {renderAverageCellISCS(field, 3)}

        {renderAverageCellISCS(field, 4)}

        {renderAverageCellISCS(field, 5)}

        {renderAverageCellISCS(field, 10)}

        {renderAverageCellISCS(field, 15)}

      </>

    );

  };



  const calculateCAGRISCS = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length < 2) return '';

    const startValue = values[values.length - 1]; // Oldest value

    const endValue = values[0]; // Newest value

    if (startValue === 0) return '';

    const cagr = Math.pow(endValue / startValue, 1 / (years - 1)) - 1;

    return formatCAGR(cagr * 100);

  };



  const renderCAGRCellISCS = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRISCS(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsISCS = (field: string) => {

    return (

      <>

        {renderCAGRCellISCS(field, 1)}

        {renderCAGRCellISCS(field, 2)}

        {renderCAGRCellISCS(field, 3)}

        {renderCAGRCellISCS(field, 4)}

        {renderCAGRCellISCS(field, 5)}

        {renderCAGRCellISCS(field, 10)}

        {renderCAGRCellISCS(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} Income Statement Common Size</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsISCS(field)}

                {renderAllCAGRCellsISCS(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Balance Sheet Common Size table component

const BalanceSheetCommonSizeTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isCalculatedField, companyTicker = 'COST' }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined) => {

    return formatPercentage(value);

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    const rawValue = getRaw(year, key);

    const hasData = rawValue !== undefined && rawValue !== null && rawValue !== '';

    

    // For years 2025-2035, all fields are calculated (read-only)

    if (year >= 2025 && year <= 2035) {

      const numericValue = getNumeric(year, key);
      return renderForecastReadonlyInput(numericValue, rawValue, {
        year,
      });

    }

    

    if (year >= 2025 && year <= 2035) {

      if (isCalculated) {

        return (

          <input

            type="text"

            value={hasData ? formatNumber(getNumeric(year, key)) : ''}

            readOnly

            className="w-full p-2 text-center border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white"

          />

        );

      }

      return (

        <input

          type="text"

          value={hasData ? formatNumber(getNumeric(year, key)) : ''}

          onChange={(e) => {

            const inputValue = e.target.value;
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              const numeric = parseFloat(inputValue.replace(/,/g, ''));
              onDataChange('balanceSheetCommonSize', year, key, Number.isFinite(numeric) ? numeric : 0);
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const numeric = parseFloat(e.target.value.replace(/,/g, ''));
            onDataChange('balanceSheetCommonSize', year, key, Number.isFinite(numeric) ? numeric : 0);
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }



    // Historical years (2005-2024) - non-editable, show blank if no data

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {hasData ? formatNumber(getNumeric(year, key)) : ''}

      </span>

    );

  };






  const fields = [

    // Asset fields

    'CashAndCashEquivalentsAsPercentOfRevenue',

    'ReceivablesCurrentAsPercentOfRevenue', 

    'InventoryAsPercentOfRevenue',

    'OtherAssetsCurrentAsPercentOfRevenue',

    'AssetsCurrentAsPercentOfRevenue',

    'PropertyPlantAndEquipmentAsPercentOfRevenue',

    'OperatingLeaseAssetsAsPercentOfRevenue',

    'FinanceLeaseAssetsAsPercentOfRevenue',

    'GoodwillAsPercentOfRevenue',

    'DeferredIncomeTaxAssetsNoncurrentAsPercentOfRevenue',

    'OtherAssetsNoncurrentAsPercentOfRevenue',

    'AssetsAsPercentOfRevenue',

    // Liability fields

    'AccountsPayableCurrentAsPercentOfRevenue',

    'EmployeeLiabilitiesCurrentAsPercentOfRevenue',

    'AccruedLiabilitiesCurrentAsPercentOfRevenue',

    'DeferredRevenueCurrentAsPercentOfRevenue',

    'LongTermDebtCurrentAsPercentOfRevenue',

    'OperatingLeaseLiabilitiesCurrentAsPercentOfRevenue',

    'FinanceLeaseLiabilitiesCurrentAsPercentOfRevenue',

    'OtherLiabilitiesCurrentAsPercentOfRevenue',

    'LiabilitiesCurrentAsPercentOfRevenue',

    'LongTermDebtNoncurrentAsPercentOfRevenue',

    'OperatingLeaseLiabilitiesNoncurrentAsPercentOfRevenue',

    'FinanceLeaseLiabilitiesNoncurrentAsPercentOfRevenue',

    'DeferredIncomeTaxLiabilitiesNoncurrentAsPercentOfRevenue',

    'OtherLiabilitiesNoncurrentAsPercentOfRevenue',

    'LiabilitiesAsPercentOfRevenue',

    // Equity and other fields

    'RetainedEarningsAccumulatedAsPercentOfRevenue',

    'EquityAsPercentOfRevenue',

    'VariableLeaseAssetsAsPercentOfRevenue',

    'ForeignTaxCreditCarryForwardAsPercentOfRevenue',

    'DeferredIncomeTaxesNetAsPercentOfRevenue',

    'NoncontrollingInterestsAsPercentOfRevenue',

    // Days fields

    'DaysCashAsPercentOfRevenue',

    'DaysReceivablesCurrentAsPercentOfRevenue',

    'DaysInventoryAsPercentOfRevenue',

    'DaysOtherAssetsCurrentAsPercentOfRevenue',

    'DaysAssetsCurrentAsPercentOfRevenue',

    'DaysAccountsPayableCurrentAsPercentOfRevenue',

    'DaysEmployeeLiabilitiesCurrentAsPercentOfRevenue',

    'DaysAccruedLiabilitiesCurrentAsPercentOfRevenue',

    'DaysDeferredRevenueCurrentAsPercentOfRevenue',

    'DaysLongTermDebtCurrentAsPercentOfRevenue',

    'DaysOperatingLeaseLiabilitiesCurrentAsPercentOfRevenue',

    'DaysFinanceLeaseLiabilitiesCurrentAsPercentOfRevenue',

    'DaysOtherLiabilitiesCurrentAsPercentOfRevenue',

    'DaysLiabilitiesCurrentAsPercentOfRevenue',

    'ForeignCurrencyAdjustmentAsPercentOfRevenue'

  ];



  const fieldTypes = [

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated',

    'Calculated'

  ];



  const calculateAverageBSCS = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length === 0) return '';

    const sum = values.reduce((acc, val) => acc + val, 0);

    return formatPercentage(sum / values.length);

  };



  const renderAverageCellBSCS = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageBSCS(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsBSCS = (field: string) => {

    return (

      <>

        {renderAverageCellBSCS(field, 1)}

        {renderAverageCellBSCS(field, 2)}

        {renderAverageCellBSCS(field, 3)}

        {renderAverageCellBSCS(field, 4)}

        {renderAverageCellBSCS(field, 5)}

        {renderAverageCellBSCS(field, 10)}

        {renderAverageCellBSCS(field, 15)}

      </>

    );

  };



  const calculateCAGRBSCS = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length < 2) return '';

    const startValue = values[values.length - 1]; // Oldest value

    const endValue = values[0]; // Newest value

    if (startValue === 0) return '';

    const cagr = Math.pow(endValue / startValue, 1 / (years - 1)) - 1;

    return formatCAGR(cagr * 100);

  };



  const renderCAGRCellBSCS = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRBSCS(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsBSCS = (field: string) => {

    return (

      <>

        {renderCAGRCellBSCS(field, 1)}

        {renderCAGRCellBSCS(field, 2)}

        {renderCAGRCellBSCS(field, 3)}

        {renderCAGRCellBSCS(field, 4)}

        {renderCAGRCellBSCS(field, 5)}

        {renderCAGRCellBSCS(field, 10)}

        {renderCAGRCellBSCS(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} Balance Sheet Common Size</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsBSCS(field)}

                {renderAllCAGRCellsBSCS(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// ROIC Performance table component

const ROICPerformanceTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean

}> = ({ data, onDataChange, isCalculatedField }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined) => {

    return formatPercentage(value);

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    

    if (year >= 2025 && year <= 2035) {

      // For years 2025-2035, all fields are calculated (read-only)

      if (isCalculated) {

      const numericValue = getNumeric(year, key);
      const rawValue = getRaw(year, key);
      return renderForecastReadonlyInput(numericValue, rawValue, {
        year,
      });

      }

      return (

        <input

          type="text"

          value={formatNumber(getNumeric(year, key))}

          onChange={(e) => {

            const inputValue = e.target.value;
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              const numeric = parseFloat(inputValue.replace(/,/g, ''));
              onDataChange('roicPerformance', year, key, Number.isFinite(numeric) ? numeric : 0);
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const numeric = parseFloat(e.target.value.replace(/,/g, ''));
            onDataChange('roicPerformance', year, key, Number.isFinite(numeric) ? numeric : 0);
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }



    // Historical years (2005-2024) - non-editable

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {formatNumber(getNumeric(year, key))}

      </span>

    );

  };



  const fields = [

    'CostOfRevenueAsPercentOfRevenue',

    'SellingGeneralAndAdministrationAsPercentOfRevenue',

    'OperatingProfitAsPercentOfRevenue',

    'WorkingCapitalAsPercentOfRevenue',

    'FixedAssetsAsPercentOfRevenue',

    'OtherAssetsAsPercentOfRevenue',

    'PretaxReturnOnInvestedCapital',

    'ReturnOnInvestedCapitalExcludingGoodwill',

    'GoodwillAsPercentOfInvestedCapital',

    'ReturnOnInvestedCapitalIncludingGoodwill'

  ];



  const fieldTypes = [

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated'

  ];



  const calculateAverageROIC = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length === 0) return '';

    const sum = values.reduce((acc, val) => acc + val, 0);

    return (sum / values.length).toFixed(2) + '%';

  };



  const renderAverageCellROIC = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageROIC(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsROIC = (field: string) => {

    return (

      <>

        {renderAverageCellROIC(field, 1)}

        {renderAverageCellROIC(field, 2)}

        {renderAverageCellROIC(field, 3)}

        {renderAverageCellROIC(field, 4)}

        {renderAverageCellROIC(field, 5)}

        {renderAverageCellROIC(field, 10)}

        {renderAverageCellROIC(field, 15)}

      </>

    );

  };



  const calculateCAGRROIC = (field: string, years: number) => {

    const values: number[] = [];

    for (let i = 2024; i > 2024 - years; i--) {

      const value = getNumeric(i, field);

      if (value !== 0) values.push(value);

    }

    if (values.length < 2) return '';

    const startValue = values[values.length - 1]; // Oldest value

    const endValue = values[0]; // Newest value

    if (startValue === 0) return '';

    const cagr = Math.pow(endValue / startValue, 1 / (years - 1)) - 1;

    return formatCAGR(cagr * 100);

  };



  const renderCAGRCellROIC = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRROIC(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsROIC = (field: string) => {

    return (

      <>

        {renderCAGRCellROIC(field, 1)}

        {renderCAGRCellROIC(field, 2)}

        {renderCAGRCellROIC(field, 3)}

        {renderCAGRCellROIC(field, 4)}

        {renderCAGRCellROIC(field, 5)}

        {renderCAGRCellROIC(field, 10)}

        {renderCAGRCellROIC(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900">COST ROIC Performance</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsROIC(field)}

                {renderAllCAGRCellsROIC(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Financing Health table component

const FinancingHealthTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean

}> = ({ data, onDataChange, isCalculatedField }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const formatNumber = (value: number | string | undefined, isCurrency: boolean = false) => {

    if (isCurrency) {

      return formatMonetaryValue(value);

    } else {

      // For decimal values, format to 2 decimal places

      if (typeof value === 'number') {

        return value.toFixed(2);

      }

      if (typeof value === 'string' && value.trim().length > 0) {

        const num = Number(value.replace(/,/g, ''));

        if (!Number.isNaN(num)) {

          return num.toFixed(2);

        }

        return value;

      }

      return '';

    }

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    const isCurrency = key === 'TotalInterestIncludingLeaseInterest' || key === 'NetDebt';

    

    if (year >= 2025 && year <= 2035) {

      // For years 2025-2035, all fields are calculated (read-only)

      if (isCalculated) {

      const numericValue = getNumeric(year, key);
      if (isCurrency) {
        const rawValue = getRaw(year, key);
        return renderForecastReadonlyInput(numericValue, rawValue, {
          year,
        });
      }

      return (

        <input

          type="text"

          value={formatNumber(numericValue, false)}

          readOnly

          className="w-full p-2 text-center border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white"

        />

      );

      }

      return (

        <input

          type="text"

          value={formatNumber(getNumeric(year, key), isCurrency)}

          onChange={(e) => {

            const inputValue = e.target.value;
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear existing debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
            }
            
            // Set new timer - trigger calculations after 100ms of no typing
            debounceTimers.current[fieldKeyStr] = setTimeout(() => {
              const numeric = parseFloat(inputValue.replace(/,/g, ''));
              onDataChange('financingHealth', year, key, Number.isFinite(numeric) ? numeric : 0);
              delete debounceTimers.current[fieldKeyStr];
            }, 100);
          }}

          onBlur={(e) => {
            const fieldKeyStr = `${year}-${key}`;
            
            // Clear any pending debounce timer for this field
            if (debounceTimers.current[fieldKeyStr]) {
              clearTimeout(debounceTimers.current[fieldKeyStr]);
              delete debounceTimers.current[fieldKeyStr];
            }
            
            // Ensure final value is saved (in case debounce didn't trigger yet)
            const numeric = parseFloat(e.target.value.replace(/,/g, ''));
            onDataChange('financingHealth', year, key, Number.isFinite(numeric) ? numeric : 0);
          }}

          className="w-full p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

        />

      );

    }



    // Historical years (2005-2024) - non-editable

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {formatNumber(getNumeric(year, key), isCurrency)}

      </span>

    );

  };



  const fields = [

    'NetDebt',

    'AssetsToEquity',

    'DebtToEquity',

    'DebtToTangibleNetWorth',

    'DebtToEBITA',

    'DebtToEBITDA',

    'CurrentRatio',

    'QuickRatio',

    'TotalInterestIncludingLeaseInterest',

    'EBITAToTotalInterest',

    'EBITDAToTotalInterest'

  ];



  const fieldTypes = [

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated',

    'Calculated'

  ];



  const calculateAverageFH = (field: string, years: number) => {

    const key = `Last${years}Y_AVG` as const;

    const raw = ((data as any)[key]?.[field] as number | string | undefined) ?? undefined;

    if (raw !== undefined && raw !== 0) {

      return formatNumber(raw, false);

    }

    return '';

  };



  const renderAverageCellFH = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageFH(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsFH = (field: string) => {

    return (

      <>

        {renderAverageCellFH(field, 1)}

        {renderAverageCellFH(field, 2)}

        {renderAverageCellFH(field, 3)}

        {renderAverageCellFH(field, 4)}

        {renderAverageCellFH(field, 5)}

        {renderAverageCellFH(field, 10)}

        {renderAverageCellFH(field, 15)}

      </>

    );

  };



  const calculateCAGRFH = (field: string, years: number) => {

    const key = `Last${years}Y_CAGR` as const;

    const raw = ((data as any)[key]?.[field] as number | string | undefined) ?? undefined;

    if (raw !== undefined && raw !== 0) {

      return formatCAGR(typeof raw === 'number' ? raw * 100 : parseFloat(String(raw)) * 100);

    }

    return '';

  };



  const renderCAGRCellFH = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGRFH(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsFH = (field: string) => {

    return (

      <>

        {renderCAGRCellFH(field, 1)}

        {renderCAGRCellFH(field, 2)}

        {renderCAGRCellFH(field, 3)}

        {renderCAGRCellFH(field, 4)}

        {renderCAGRCellFH(field, 5)}

        {renderCAGRCellFH(field, 10)}

        {renderCAGRCellFH(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900">COST Financing Health</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsFH(field)}

                {renderAllCAGRCellsFH(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Operational Performance table component

const OperationalPerformanceTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean

}> = ({ data, onDataChange: _onDataChange, isCalculatedField: _isCalculatedField }) => {

  const formatNumber = (value: number | string | undefined, asPercent: boolean = true) => {

    if (typeof value === 'number') {

      if (asPercent) {

        return value.toFixed(2) + '%';

      }

      return value.toFixed(2);

    }

    if (typeof value === 'string' && value.trim().length > 0) {

      const num = Number(value.replace(/,/g, '').replace('%', ''));

      if (!Number.isNaN(num)) {

        if (asPercent) {

          return num.toFixed(2) + '%';

        }

        return num.toFixed(2);

      }

      return value;

    }

    return asPercent ? '0.00%' : '0.00';

  };



  const yearsList: number[] = years;




  const getRaw = (year: number, key: string) => {

    return (data[year]?.[key] as number | string | undefined) ?? undefined;

  };



  const getNumeric = (year: number, key: string) => {

    const raw = getRaw(year, key);

    if (typeof raw === 'number') return raw;

    if (typeof raw === 'string' && raw.trim().length > 0) {

      const parsed = parseFloat(raw.replace(/,/g, '').replace('%', ''));

      return Number.isNaN(parsed) ? 0 : parsed;

    }

    return 0;

  };



  const renderCell = (year: number, key: string) => {


    const isTurnover = key.includes('Turnover');

    

    if (year >= 2025 && year <= 2035) {

      // For years 2025-2035, all fields are calculated (read-only)

      return (

        <input

          type="text"

          value={formatNumber(getNumeric(year, key), !isTurnover)}

          readOnly

          className="w-full p-2 text-center border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white"

        />

      );

    }



    // Historical years (2011-2024) - non-editable

    return (

      <span className="block p-2 text-center rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">

        {formatNumber(getNumeric(year, key), !isTurnover)}

      </span>

    );

  };



  const fields = [

    'RevenueGrowth',

    'EBITDAMargin',

    'ReturnOnEquity',

    'ReturnOnAssets',

    'ReturnOnInvestedCapitalExcludingGoodwill',

    'ReturnOnInvestedCapitalIncludingGoodwill',

    'GrossMarginAsPercentOfRevenue',

    'OperatingIncomeAsPercentOfRevenue',

    'NetIncomeAsPercentOfRevenue',

    'EffectiveInterestRate',

    'InterestBurden',

    'EffectiveTaxRate',

    'TaxBurden',

    'AssetTurnover',

    'PropertyPlantAndEquipmentTurnover',

    'CashTurnover',

    'ReceivablesCurrentTurnover',

    'InventoryTurnover',

    'AccountsPayableCurrentTurnover'

  ];



  const fieldTypes = fields.map(() => 'Calculated');



  const calculateAverageOps = (field: string, years: number) => {

    // Use pre-calculated averages from Excel

    const avgKey = `Last${years}Y_AVG` as keyof typeof operationalPerformanceAverages.ReturnOnEquity;

    const fieldAvgs = operationalPerformanceAverages[field as keyof typeof operationalPerformanceAverages];

    

    if (!fieldAvgs) return '';

    

    const avgValue = fieldAvgs[avgKey];

    if (avgValue === undefined || avgValue === 0) return '';

    

    const isTurnover = field.includes('Turnover');

    return isTurnover ? avgValue.toFixed(2) : (avgValue * 100).toFixed(2) + '%';

  };



  const renderAverageCellOps = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">

        {calculateAverageOps(field, years)}

      </td>

    );

  };



  const renderAllAverageCellsOps = (field: string) => {

    return (

      <>

        {renderAverageCellOps(field, 1)}

        {renderAverageCellOps(field, 2)}

        {renderAverageCellOps(field, 3)}

        {renderAverageCellOps(field, 4)}

        {renderAverageCellOps(field, 5)}

        {renderAverageCellOps(field, 10)}

        {renderAverageCellOps(field, 15)}

      </>

    );

  };



  const calculateCAGROps = (field: string, years: number) => {

    // Use pre-calculated CAGR from Excel

    const cagrKey = `Last${years}Y_CAGR` as keyof typeof operationalPerformanceCAGR.ReturnOnEquity;

    const fieldCAGRs = operationalPerformanceCAGR[field as keyof typeof operationalPerformanceCAGR];

    

    if (!fieldCAGRs) return '';

    

    const cagrValue = fieldCAGRs[cagrKey];

    if (cagrValue === undefined || cagrValue === 0) return '';

    

    return formatCAGR(cagrValue * 100);

  };



  const renderCAGRCellOps = (field: string, years: number) => {

    return (

      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white border-l dark:border-gray-600 bg-green-50 dark:bg-green-900/20">

        {calculateCAGROps(field, years)}

      </td>

    );

  };



  const renderAllCAGRCellsOps = (field: string) => {

    return (

      <>

        {renderCAGRCellOps(field, 1)}

        {renderCAGRCellOps(field, 2)}

        {renderCAGRCellOps(field, 3)}

        {renderCAGRCellOps(field, 4)}

        {renderCAGRCellOps(field, 5)}

        {renderCAGRCellOps(field, 10)}

        {renderCAGRCellOps(field, 15)}

      </>

    );

  };



  return (

    <div className="bg-white rounded-lg shadow-sm border">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900">COST Operational Performance</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">

              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600 shadow-sm">

                Field

              </th>

              {yearsList.map(year => (

                <th key={year} className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">

                  {year}

                </th>

              ))}

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_AVG

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last1Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last2Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last3Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last4Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last5Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last10Y_CAGR

              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {fields.map((field, index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

                <td className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400 border-l dark:border-gray-600">

                  {fieldTypes[index]}

                </td>

                {renderAllAverageCellsOps(field)}

                {renderAllCAGRCellsOps(field)}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};



// Balance Sheet table to match the provided image

const BalanceSheetTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isCalculatedField, companyTicker = 'COST' }) => {

  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({ TotalAssets: true, CurrentAssets: true, CashGroup: true, Receivables: true, Inventory: true, NonCurrentAssets: true, NetPPE: true, GrossPPE: true, TotalLiabilities: true, CurrentLiabilities: true, PayablesAndAccrued: true, Payables: true, LongTermDebtGroup: true, TotalEquity: true, CapitalStock: true, GainsLossesNA: true });


  // Track raw input strings while user is typing (for natural number entry)
  const [editingInputs, setEditingInputs] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);


  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));



  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const yearsList: number[] = Array.from({ length: 25 }, (_, i) => 2011 + i);




  // Helpers to render numeric input with static $ and suffix

  const getScale = (num: number, year?: number) => {
    // For forecasted years (2025-2035), always use billions
    if (typeof year === 'number' && year >= 2025 && year <= 2035) {
      return { suffix: 'B', divisor: 1_000_000_000 };
    }
    const abs = Math.abs(num);

    if (abs >= 1_000_000_000) return { suffix: 'B', divisor: 1_000_000_000 };

    if (abs >= 1_000_000) return { suffix: 'M', divisor: 1_000_000 };

    if (abs >= 1_000) return { suffix: 'K', divisor: 1_000 };

    return { suffix: '', divisor: 1 };

  };

  const toScaledString = (num: number, divisor: number) => {

    const scaled = num / divisor;

    return scaled.toFixed(2);

  };



  const mapKey = (k: string): string => {

    switch (k) {

      // Current assets - all available in JSON

      case 'CashAndCashEquivalents': return 'CashAndCashEquivalents';

      case 'ShortTermInvestments': return 'ShortTermInvestments';

      case 'Receivables': return 'ReceivablesCurrent';

      case 'Inventory': return 'Inventory';

      case 'OtherAssetsCurrent': return 'OtherAssetsCurrent';

      // Non-current assets - all available in JSON

      case 'PropertyPlantAndEquipmentNet': return 'PropertyPlantAndEquipment';

      case 'OperatingLeaseRightOfUseAsset': return 'OperatingLeaseAssets';

      case 'LeaseFinanceAssetsNoncurrent': return 'FinanceLeaseAssets';

      case 'Goodwill': return 'Goodwill';

      case 'OtherNonCurrentAssets': return 'OtherAssetsNoncurrent';

      // Current liabilities - all available in JSON

      case 'AccountsPayable': return 'AccountsPayableCurrent';

      case 'AccountsPayableCurrent': return 'AccountsPayableCurrent';

      case 'EmployeeRelatedLiabilitiesCurrent': return 'EmployeeRelatedLiabilitiesCurrent';

      case 'EmployeeLiabilitiesCurrent': return 'EmployeeRelatedLiabilitiesCurrent';

      case 'AccruedLiabilitiesCurrent': return 'AccruedLiabilitiesCurrent';

      case 'DeferredRevenueCurrent': return 'DeferredRevenueCurrent';

      case 'CurrentDeferredLiabilities': return 'DeferredRevenueCurrent';

      case 'CurrentDebt': return 'LongTermDebtCurrent';

      case 'LongTermDebtCurrent': return 'LongTermDebtCurrent';

      case 'OperatingLeaseLiabilitiesCurrent': return 'OperatingLeaseLiabilitiesCurrent';

      case 'FinanceLeaseLiabilitiesCurrent': return 'FinanceLeaseLiabilitiesCurrent';

      case 'OtherCurrentLiabilities': return 'OtherLiabilitiesCurrent';

      case 'OtherLiabilitiesCurrent': return 'OtherLiabilitiesCurrent';

      // Non-current liabilities - all available in JSON

      case 'LongTermDebt': return 'LongTermDebtNoncurrent';

      case 'LongTermDebtNoncurrent': return 'LongTermDebtNoncurrent';

      case 'OperatingLeaseLiabilityNoncurrent': return 'OperatingLeaseLiabilityNoncurrent';

      case 'OperatingLeaseLiabilitiesNoncurrent': return 'OperatingLeaseLiabilityNoncurrent';

      case 'FinanceLeaseLiabilitiesNonCurrent': return 'FinanceLeaseLiabilitiesNonCurrent';

      case 'FinanceLeaseLiabilitiesNoncurrent': return 'FinanceLeaseLiabilitiesNonCurrent';

      case 'DeferredIncomeTaxLiabilitiesNonCurrent': return 'DeferredIncomeTaxLiabilitiesNonCurrent';

      case 'DeferredIncomeTaxLiabilitiesNoncurrent': return 'DeferredIncomeTaxLiabilitiesNonCurrent';

      case 'OtherNonCurrentLiabilities': return 'OtherLiabilitiesNoncurrent';

      case 'OtherLiabilitiesNoncurrent': return 'OtherLiabilitiesNoncurrent';

      // Aggregated totals - all available in JSON

      case 'AssetsCurrent': return 'AssetsCurrent';

      case 'CurrentAssets': return 'AssetsCurrent';

      case 'AssetsNoncurrent': return 'AssetsNoncurrent';

      case 'TotalNonCurrentAssets': return 'AssetsNoncurrent';

      case 'Assets': return 'Assets';

      case 'TotalAssets': return 'Assets';

      case 'LiabilitiesCurrent': return 'LiabilitiesCurrent';

      case 'CurrentLiabilities': return 'LiabilitiesCurrent';

      case 'LiabilitiesNoncurrent': return 'LiabilitiesNoncurrent';

      case 'Liabilities': return 'Liabilities';

      case 'TotalLiabilities': return 'Liabilities';

      case 'Equity': return 'Equity';

      case 'StockholdersEquity': return 'Equity';

      case 'LiabilitiesAndStockholdersEquity': return 'LiabilitiesAndEquity';

      case 'LiabilitiesAndEquity': return 'LiabilitiesAndEquity';

      // Additional metrics

      case 'RetainedEarningsAccumulated': return 'RetainedEarningsAccumulated';

      case 'Debt': return 'Debt';

      case 'ForeignTaxCreditCarryForward': return 'ForeignTaxCreditCarryForward';

      case 'CapitalExpenditures': return 'CapitalExpenditures';

      case 'OperatingCash': return 'OperatingCash';

      case 'ExcessCash': return 'ExcessCash';

      // New missing fields

      case 'ShortTermInvestments': return 'ShortTermInvestments';

      case 'ReceivablesNoncurrent': return 'ReceivablesNoncurrent';

      case 'VariableLeaseAssets': return 'VariableLeaseAssets';

      case 'NoncontrollingInterests': return 'NoncontrollingInterests';

      default: return k;

    }

  };



  const getRaw = (year: number, key: string) => {

    // Return the actual value from data using mapped key

    const realKey = mapKey(key);

    

    // Handle specific cases where JSON field names differ from data file field names

    if (realKey === 'Assets') {

      // Calculate Assets as AssetsCurrent + AssetsNoncurrent

      const currentAssets = (data[year]?.['AssetsCurrent'] as number | undefined) ?? 0;

      const noncurrentAssets = (data[year]?.['AssetsNoncurrent'] as number | undefined) ?? 0;

      return currentAssets + noncurrentAssets;

    }

    if (realKey === 'Equity') {

      return (data[year]?.['StockholdersEquity'] as number | string | undefined) ?? undefined;

    }

    if (realKey === 'LiabilitiesAndEquity') {

      // Calculate LiabilitiesAndEquity as Liabilities + StockholdersEquity

      const liabilities = (data[year]?.['Liabilities'] as number | undefined) ?? 0;

      const equity = (data[year]?.['StockholdersEquity'] as number | undefined) ?? 0;

      return liabilities + equity;

    }

    if (realKey === 'OperatingLeaseLiabilityNoncurrent') {

      return (data[year]?.['OperatingLeaseLiabilityNoncurrent'] as number | string | undefined) ?? undefined;

    }

    if (realKey === 'FinanceLeaseLiabilitiesNonCurrent') {

      return (data[year]?.['FinanceLeaseLiabilitiesNoncurrent'] as number | string | undefined) ?? undefined;

    }

    if (realKey === 'DeferredIncomeTaxLiabilitiesNonCurrent') {

      return (data[year]?.['DeferredIncomeTaxLiabilitiesNoncurrent'] as number | string | undefined) ?? undefined;

    }

    

    return (data[year]?.[realKey] as number | string | undefined) ?? undefined;

  };

  const getNumeric = (year: number, key: string) => {

    // For years 2025-2035, return the actual numeric value if it exists, otherwise 0

    if (year >= 2025 && year <= 2035) {

      const realKey = mapKey(key);

      let v: number | string | undefined;

      

      // Handle specific cases where JSON field names differ from data file field names

      if (realKey === 'Assets') {

        // Calculate Assets as AssetsCurrent + AssetsNoncurrent

        const currentAssets = (data[year]?.['AssetsCurrent'] as number | undefined) ?? 0;

        const noncurrentAssets = (data[year]?.['AssetsNoncurrent'] as number | undefined) ?? 0;

        v = currentAssets + noncurrentAssets;

      } else if (realKey === 'Equity') {

        v = data[year]?.['StockholdersEquity'] as number | string | undefined;

      } else if (realKey === 'LiabilitiesAndEquity') {

        // Calculate LiabilitiesAndEquity as Liabilities + StockholdersEquity

        const liabilities = (data[year]?.['Liabilities'] as number | undefined) ?? 0;

        const equity = (data[year]?.['StockholdersEquity'] as number | undefined) ?? 0;

        v = liabilities + equity;

      } else if (realKey === 'OperatingLeaseLiabilityNoncurrent') {

        v = data[year]?.['OperatingLeaseLiabilityNoncurrent'] as number | string | undefined;

      } else if (realKey === 'FinanceLeaseLiabilitiesNonCurrent') {

        v = data[year]?.['FinanceLeaseLiabilitiesNoncurrent'] as number | string | undefined;

      } else if (realKey === 'DeferredIncomeTaxLiabilitiesNonCurrent') {

        v = data[year]?.['DeferredIncomeTaxLiabilitiesNoncurrent'] as number | string | undefined;

      } else {

        v = data[year]?.[realKey] as number | string | undefined;

      }

      

      return typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.replace(/,/g, '')) : 0);

    }

    const v = getRaw(year, key);

    if (typeof v === 'number') return v;

    if (typeof v === 'string') {

      const n = Number(v.replace(/,/g, ''));

      return Number.isNaN(n) ? 0 : n;

    }

    return 0;

  };




  const renderCell = (year: number, key: string) => {

    const isCalculated = isCalculatedField ? isCalculatedField(key) : false;

    // For years 2025-2035, show empty cells to match the clean appearance

    if (year >= 2025 && year <= 2035) {

      if (year >= 2025 && year <= 2035) {

        if (isCalculated) {

          const current = getNumeric(year, key);
          const rawValue = getRaw(year, key);
          return renderForecastReadonlyInput(current, rawValue, {
            year,
            hideZero: true,
          });

        }

        {

          const fieldKeyStr = `${year}-${key}`;
          const isFocused = focusedField === fieldKeyStr;
          const current = getNumeric(year, key);

          // For forecasted years, always use billions
          const { suffix, divisor } = getScale(current, year);
          
          // Use raw input string while focused, formatted value when not focused
          let displayValue: string;
          if (isFocused && editingInputs[fieldKeyStr] !== undefined) {
            displayValue = editingInputs[fieldKeyStr];
          } else {
            displayValue = ((getRaw(year, key) === undefined || getRaw(year, key) === null || getRaw(year, key) === '')) ? '' : toScaledString(current, divisor);
          }
          
          return (

            <div className="relative">

              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>

              <input

                type="text"

                value={displayValue}
                onFocus={() => {
                  setFocusedField(fieldKeyStr);
                  // Initialize editing input with current formatted value (remove $ and B)
                  const currentValue = getRaw(year, key);
                  if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
                    const currentNum = getNumeric(year, key);
                    const scaled = currentNum / divisor;
                    setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: scaled.toFixed(2) }));
                  } else {
                    setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: '' }));
                  }
                }}
                onChange={(e) => {

                  const rawText = e.target.value;

                  // Allow only numbers, decimal point, and minus sign
                  const cleaned = rawText.replace(/[^0-9.-]/g, '').trim();

                  
                  // Update local editing state with raw string for immediate visual feedback
                  setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: cleaned }));
                  
                  // Clear existing debounce timer for this field
                  if (debounceTimers.current[fieldKeyStr]) {
                    clearTimeout(debounceTimers.current[fieldKeyStr]);
                  }
                  
                  // Set new timer - trigger calculations after 100ms of no typing
                  debounceTimers.current[fieldKeyStr] = setTimeout(() => {
                    if (cleaned === '') {
                      onDataChange('balanceSheet', year, key, '');
                    } else {
                      const numeric = parseFloat(cleaned);
                      if (Number.isFinite(numeric)) {
                        const billionsDivisor = 1_000_000_000;
                        const finalValue = numeric * billionsDivisor;
                        onDataChange('balanceSheet', year, key, finalValue);
                      }
                    }
                    delete debounceTimers.current[fieldKeyStr];
                  }, 100);
                }}
                onBlur={() => {
                  const rawInput = editingInputs[fieldKeyStr] || '';
                  setFocusedField(null);
                  
                  // Clear any pending debounce timer for this field
                  if (debounceTimers.current[fieldKeyStr]) {
                    clearTimeout(debounceTimers.current[fieldKeyStr]);
                    delete debounceTimers.current[fieldKeyStr];
                  }
                  
                  // Ensure final value is saved (in case debounce didn't trigger yet)
                  if (rawInput === '') {
                    onDataChange('balanceSheet', year, key, '');

                    setEditingInputs(prev => {
                      const updated = { ...prev };
                      delete updated[fieldKeyStr];
                      return updated;
                    });
                    return;

                  }

                  
                  const numeric = parseFloat(rawInput);
                  if (Number.isFinite(numeric)) {

                    // For forecasted years, always multiply by billions divisor
                    const billionsDivisor = 1_000_000_000;
                    const finalValue = numeric * billionsDivisor;
                    onDataChange('balanceSheet', year, key, finalValue);
                  }
                  
                  // Clear editing state after blur
                  setEditingInputs(prev => {
                    const updated = { ...prev };
                    delete updated[fieldKeyStr];
                    return updated;
                  });
                }}

                className="w-full pl-6 pr-6 p-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                placeholder=""

              />

              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">{suffix}</span>

            </div>

          );

        }

      }

      return (

        <span className="block p-2 text-center">

          {/* Empty cell for years 2025-2035 */}

        </span>

      );

    }

    

    if (year >= 2025 && year <= 2035) {

      if (isCalculated) {

        const numericValue = getNumeric(year, key);
        const rawValue = getRaw(year, key);

        return renderForecastReadonlyInput(numericValue, rawValue, {
          year,
          hideZero: true,
        });

      }

      {

        const fieldKeyStr = `${year}-${key}`;
        const isFocused = focusedField === fieldKeyStr;
        const current = getNumeric(year, key);

        // For forecasted years, always use billions
        const { suffix, divisor } = getScale(current, year);
        
        // Use raw input string while focused, formatted value when not focused
        let displayValue: string;
        if (isFocused && editingInputs[fieldKeyStr] !== undefined) {
          displayValue = editingInputs[fieldKeyStr];
        } else {
          displayValue = ((getRaw(year, key) === undefined || getRaw(year, key) === null || getRaw(year, key) === '')) ? '' : toScaledString(current, divisor);
        }
        
        return (

          <div className="relative">

            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>

            <input

              type="text"

              value={displayValue}
              onFocus={() => {
                setFocusedField(fieldKeyStr);
                // Initialize editing input with current formatted value (remove $ and B)
                const currentValue = getRaw(year, key);
                if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
                  const currentNum = getNumeric(year, key);
                  const scaled = currentNum / divisor;
                  setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: scaled.toFixed(2) }));
                } else {
                  setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: '' }));
                }
              }}
              onChange={(e) => {

                const rawText = e.target.value;

                // Allow only numbers, decimal point, and minus sign
                const cleaned = rawText.replace(/[^0-9.-]/g, '').trim();

                
                // Update local editing state with raw string
                setEditingInputs(prev => ({ ...prev, [fieldKeyStr]: cleaned }));
                
                // Don't convert to billions yet - wait for blur
              }}
              onBlur={() => {
                const rawInput = editingInputs[fieldKeyStr] || '';
                setFocusedField(null);
                
                if (rawInput === '') {
                  onDataChange('balanceSheet', year, key, '');

                  setEditingInputs(prev => {
                    const updated = { ...prev };
                    delete updated[fieldKeyStr];
                    return updated;
                  });
                  return;

                }

                
                const numeric = parseFloat(rawInput);
                if (Number.isFinite(numeric)) {
                  // For forecasted years, always multiply by billions divisor
                  const billionsDivisor = 1_000_000_000;
                  onDataChange('balanceSheet', year, key, numeric * billionsDivisor);
                }
                
                // Clear editing state after blur
                setEditingInputs(prev => {
                  const updated = { ...prev };
                  delete updated[fieldKeyStr];
                  return updated;
                });
              }}

              className="w-full pl-6 pr-6 p-2 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

            />

            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">{suffix}</span>

          </div>

        );

      }

    }

    // For historical display, show only real values; if missing, leave blank

    return <span className="block p-2 text-center">{formatNumber(getRaw(year, key))}</span>;

  };



























  // Equity calculations





























  const calculateAverage = (field: string, years: number) => {

    let realKey = mapKey(field);

    

    // Handle specific cases for analysis data field names

    if (realKey === 'OperatingLeaseLiabilityNoncurrent') {

      realKey = 'OperatingLeaseLiabilitiesNoncurrent'; // Analysis uses plural

    }

    if (realKey === 'FinanceLeaseLiabilitiesNonCurrent') {

      realKey = 'FinanceLeaseLiabilitiesNoncurrent'; // Analysis uses lowercase c

    }

    if (realKey === 'DeferredIncomeTaxLiabilitiesNonCurrent') {

      realKey = 'DeferredIncomeTaxLiabilitiesNoncurrent'; // Analysis uses lowercase c

    }

    

    const group = (balanceSheetAnalysisReal as any)?.averages?.[realKey];

    const key = `Last${years}Y_AVG` as const;

    const raw = group ? group[key] : undefined;

    return typeof raw === 'number' ? formatNumber(raw) : '';

  };



  const renderAverageCell = (field: string, years: number) => {

    return (

      <td className="p-2 text-center bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white">

        {calculateAverage(field, years)}

      </td>

    );

  };



  const renderAllAverageCells = (field: string) => {

    return (

      <>

        {renderAverageCell(field, 1)}

        {renderAverageCell(field, 2)}

        {renderAverageCell(field, 3)}

        {renderAverageCell(field, 4)}

        {renderAverageCell(field, 5)}

        {renderAverageCell(field, 10)}

        {renderAverageCell(field, 15)}

      </>

    );

  };



  const calculateCAGR = (field: string, years: number) => {

    let realKey = mapKey(field);

    

    // Handle specific cases for analysis data field names

    if (realKey === 'OperatingLeaseLiabilityNoncurrent') {

      realKey = 'OperatingLeaseLiabilitiesNoncurrent'; // Analysis uses plural

    }

    if (realKey === 'FinanceLeaseLiabilitiesNonCurrent') {

      realKey = 'FinanceLeaseLiabilitiesNoncurrent'; // Analysis uses lowercase c

    }

    if (realKey === 'DeferredIncomeTaxLiabilitiesNonCurrent') {

      realKey = 'DeferredIncomeTaxLiabilitiesNoncurrent'; // Analysis uses lowercase c

    }

    

    const group = (balanceSheetAnalysisReal as any)?.cagr?.[realKey];

    const key = `Last${years}Y_CAGR` as const;

    const raw = group ? group[key] : undefined;

    // Format CAGR to 2 decimal places with no trailing zeros

    return typeof raw === 'number' ? formatCAGR(raw) : '';

  };



  const renderCAGRCell = (field: string, years: number) => {

    return (

      <td className="p-2 text-center bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white">

        {calculateCAGR(field, years)}

      </td>

    );

  };



  const renderAllCAGRCells = (field: string) => {

    return (

      <>

        {renderCAGRCell(field, 1)}

        {renderCAGRCell(field, 2)}

        {renderCAGRCell(field, 3)}

        {renderCAGRCell(field, 4)}

        {renderCAGRCell(field, 5)}

        {renderCAGRCell(field, 10)}

        {renderCAGRCell(field, 15)}

      </>

    );

  };



  return (

    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">

      <div className="p-4 border-b bg-gray-50">

        <h3 className="text-lg font-semibold text-gray-800">{companyTicker} Balance Sheet Expanded</h3>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="bg-gray-100 border-b">

              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-30 bg-gray-100 dark:bg-gray-700 border-r dark:border-gray-600 min-w-[250px]">Breakdown</th>

              {yearsList.map(y => (

                <th key={y} className="text-center px-3 py-3 font-medium text-gray-700 min-w-[160px]">{`8/31/${y}`}</th>

              ))}

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last1Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last2Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last3Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last4Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last5Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last10Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-blue-50 dark:bg-blue-900/20">

                Last15Y_AVG

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last1Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last2Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last3Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last4Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last5Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last10Y_CAGR

              </th>

              <th className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px] bg-green-50 dark:bg-green-900/20">

                Last15Y_CAGR

              </th>

            </tr>

          </thead>

          <tbody>

            {/* Total Assets */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="p-3 font-bold text-gray-800 dark:text-white sticky left-0 z-20 bg-white dark:bg-gray-800 border-r dark:border-gray-600">

                Total Assets

              </td>

              {yearsList.map(y => (

                <td key={`TotalAssets-${y}`} className="p-2 text-center">

                  {renderCell(y, 'TotalAssets')}

                </td>

              ))}{renderAllAverageCells('TotalAssets')}

              {renderAllCAGRCells('TotalAssets')}

            </tr>



            {/* Current Assets group */}

            <tr className="border-b-2 border-gray-200">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                <button onClick={() => toggle('CurrentAssets')} className="w-full text-left">

                  {expanded['CurrentAssets'] ? 'v' : '^'} Current Assets

                </button>

              </td>

              {yearsList.map(y => (

                <td key={`CurrentAssets-${y}`} className="p-2 text-center">

                  {renderCell(y, 'CurrentAssets')}

                </td>

              ))}{renderAllAverageCells('CurrentAssets')}

              {renderAllCAGRCells('CurrentAssets')}

            </tr>



            {expanded['CurrentAssets'] && (

              <>

                {/* CashAndCashEquivalents */}

                    <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">CashAndCashEquivalents</td>

                      {yearsList.map(y => (

                    <td key={`CashAndCashEquivalents-${y}`} className="p-2 text-center">{renderCell(y, 'CashAndCashEquivalents')}</td>

                      ))}{renderAllAverageCells('CashAndCashEquivalents')}

                    {renderAllCAGRCells('CashAndCashEquivalents')}

                    </tr>



                {/* ShortTermInvestments */}

                    <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">ShortTermInvestments</td>

                      {yearsList.map(y => (

                    <td key={`ShortTermInvestments-${y}`} className="p-2 text-center">{renderCell(y, 'ShortTermInvestments')}</td>

                  ))}{renderAllAverageCells('ShortTermInvestments')}

                    {renderAllCAGRCells('ShortTermInvestments')}

                    </tr>



                {/* Receivables */}

                  <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Receivables</td>

                    {yearsList.map(y => (

                    <td key={`Receivables-${y}`} className="p-2 text-center">{renderCell(y, 'Receivables')}</td>

                  ))}{renderAllAverageCells('Receivables')}

                    {renderAllCAGRCells('Receivables')}

                    </tr>



                {/* Inventory */}

                  <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Inventory</td>

                    {yearsList.map(y => (

                    <td key={`Inventory-${y}`} className="p-2 text-center">{renderCell(y, 'Inventory')}</td>

                    ))}{renderAllAverageCells('Inventory')}

                    {renderAllCAGRCells('Inventory')}

                </tr>



                {/* Remove DeferredTaxesAssetsCurrent - not in JSON */}



                {/* OtherAssetsCurrent */}

                <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OtherAssetsCurrent</td>

                  {yearsList.map(y => (

                    <td key={`OtherAssetsCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'OtherAssetsCurrent')}</td>

                  ))}{renderAllAverageCells('OtherAssetsCurrent')}

                  {renderAllCAGRCells('OtherAssetsCurrent')}

                </tr>

              </>

            )}



            {/* Non-current Assets */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="p-3 font-bold text-gray-800 dark:text-white sticky left-0 bg-white dark:bg-gray-800 border-r dark:border-gray-600">

                <button onClick={() => toggle('NonCurrentAssets')} className="w-full text-left">

                  {expanded['NonCurrentAssets'] ? 'v' : '^'} Total non-current assets

                </button>

              </td>

              {yearsList.map(y => (

                <td key={`TotalNonCurrent-${y}`} className="p-2 text-center">

                  {renderCell(y, 'TotalNonCurrentAssets')}

                </td>

              ))}{renderAllAverageCells('AssetsNoncurrent')}

              {renderAllCAGRCells('AssetsNoncurrent')}

            </tr>



            {expanded['NonCurrentAssets'] && (

              <>

                {/* PropertyPlantAndEquipmentNet */}

                <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">PropertyPlantAndEquipmentNet</td>

                  {yearsList.map(y => (

                    <td key={`PropertyPlantAndEquipmentNet-${y}`} className="p-2 text-center">{renderCell(y, 'PropertyPlantAndEquipmentNet')}</td>

                  ))}{renderAllAverageCells('PropertyPlantAndEquipmentNet')}

                  {renderAllCAGRCells('PropertyPlantAndEquipmentNet')}

                </tr>



                {/* OperatingLeaseRightOfUseAsset */}

                        <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OperatingLeaseRightOfUseAsset</td>

                          {yearsList.map(y => (

                    <td key={`OperatingLeaseRightOfUseAsset-${y}`} className="p-2 text-center">{renderCell(y, 'OperatingLeaseRightOfUseAsset')}</td>

                          ))}{renderAllAverageCells('OperatingLeaseRightOfUseAsset')}

                  {renderAllCAGRCells('OperatingLeaseRightOfUseAsset')}

                </tr>



                {/* LeaseFinanceAssetsNoncurrent */}

                        <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">LeaseFinanceAssetsNoncurrent</td>

                          {yearsList.map(y => (

                    <td key={`LeaseFinanceAssetsNoncurrent-${y}`} className="p-2 text-center">{renderCell(y, 'LeaseFinanceAssetsNoncurrent')}</td>

                          ))}{renderAllAverageCells('LeaseFinanceAssetsNoncurrent')}

                  {renderAllCAGRCells('LeaseFinanceAssetsNoncurrent')}

                </tr>



                {/* Goodwill */}

                        <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">Goodwill</td>

                          {yearsList.map(y => (

                    <td key={`Goodwill-${y}`} className="p-2 text-center">{renderCell(y, 'Goodwill')}</td>

                          ))}{renderAllAverageCells('Goodwill')}

                  {renderAllCAGRCells('Goodwill')}

                </tr>



                {/* OtherAssetsNoncurrent */}

                <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OtherAssetsNoncurrent</td>

                  {yearsList.map(y => (

                    <td key={`OtherAssetsNoncurrent-${y}`} className="p-2 text-center">{renderCell(y, 'OtherAssetsNoncurrent')}</td>

                  ))}{renderAllAverageCells('OtherAssetsNoncurrent')}

                  {renderAllCAGRCells('OtherAssetsNoncurrent')}

                </tr>



                {/* ReceivablesNoncurrent */}

                <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">ReceivablesNoncurrent</td>

                  {yearsList.map(y => (

                    <td key={`ReceivablesNoncurrent-${y}`} className="p-2 text-center">{renderCell(y, 'ReceivablesNoncurrent')}</td>

                  ))}{renderAllAverageCells('ReceivablesNoncurrent')}

                  {renderAllCAGRCells('ReceivablesNoncurrent')}

                </tr>



                {/* VariableLeaseAssets */}

                <tr className="border-b dark:border-gray-600">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">VariableLeaseAssets</td>

                  {yearsList.map(y => (

                    <td key={`VariableLeaseAssets-${y}`} className="p-2 text-center">{renderCell(y, 'VariableLeaseAssets')}</td>

                  ))}{renderAllAverageCells('VariableLeaseAssets')}

                  {renderAllCAGRCells('VariableLeaseAssets')}

                </tr>

              </>

            )}



            {/* Total Liabilities */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="p-3 font-bold text-gray-800 dark:text-white sticky left-0 z-20 bg-white dark:bg-gray-800 border-r dark:border-gray-600">

                <button onClick={() => toggle('TotalLiabilities')} className="w-full text-left">

                  {expanded['TotalLiabilities'] ? 'v' : '^'} Total Liabilities

                </button>

              </td>

              {yearsList.map(y => (

                <td key={`TotalLiabilities-${y}`} className="p-2 text-center">

                  {renderCell(y, 'TotalLiabilities')}

                </td>

              ))}{renderAllAverageCells('TotalLiabilities')}

              {renderAllCAGRCells('TotalLiabilities')}

            </tr>



            {expanded['TotalLiabilities'] && (

              <>

                {/* Current Liabilities */}

                <tr className="border-b-2 border-gray-200">

                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                    <button onClick={() => toggle('CurrentLiabilities')} className="w-full text-left">

                      {expanded['CurrentLiabilities'] ? 'v' : '^'} Current Liabilities

                    </button>

                  </td>

                  {yearsList.map(y => (

                    <td key={`CurrentLiabilities-${y}`} className="p-2 text-center">

                      {renderCell(y, 'CurrentLiabilities')}

                    </td>

                  ))}{renderAllAverageCells('LiabilitiesCurrent')}

                  {renderAllCAGRCells('LiabilitiesCurrent')}

                </tr>



                {expanded['CurrentLiabilities'] && (

                  <>

                    {/* AccountsPayableCurrent */}

                    <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">AccountsPayableCurrent</td>

                      {yearsList.map(y => (

                        <td key={`AccountsPayableCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'AccountsPayableCurrent')}</td>

                      ))}{renderAllAverageCells('AccountsPayableCurrent')}

                      {renderAllCAGRCells('AccountsPayableCurrent')}

                        </tr>



                    {/* EmployeeRelatedLiabilitiesCurrent */}

                          <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">EmployeeRelatedLiabilitiesCurrent</td>

                            {yearsList.map(y => (

                        <td key={`EmployeeRelatedLiabilitiesCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'EmployeeRelatedLiabilitiesCurrent')}</td>

                            ))}{renderAllAverageCells('EmployeeLiabilitiesCurrent')}

                      {renderAllCAGRCells('EmployeeLiabilitiesCurrent')}

                          </tr>



                    {/* AccruedLiabilitiesCurrent */}

                        <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">AccruedLiabilitiesCurrent</td>

                          {yearsList.map(y => (

                        <td key={`AccruedLiabilitiesCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'AccruedLiabilitiesCurrent')}</td>

                      ))}{renderAllAverageCells('AccruedLiabilitiesCurrent')}

                      {renderAllCAGRCells('AccruedLiabilitiesCurrent')}

                    </tr>

                    {/* AccruedIncomeTaxesCurrent */}
                    <tr className="border-b dark:border-gray-600">
                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">AccruedIncomeTaxesCurrent</td>
                      {yearsList.map(y => (
                        <td key={`AccruedIncomeTaxesCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'AccruedIncomeTaxesCurrent')}</td>
                      ))}{renderAllAverageCells('AccruedIncomeTaxesCurrent')}
                      {renderAllCAGRCells('AccruedIncomeTaxesCurrent')}
                    </tr>

                    {/* DeferredRevenueCurrent */}

                      <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">DeferredRevenueCurrent</td>

                        {yearsList.map(y => (

                        <td key={`DeferredRevenueCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'DeferredRevenueCurrent')}</td>

                        ))}{renderAllAverageCells('DeferredRevenueCurrent')}

                      {renderAllCAGRCells('DeferredRevenueCurrent')}

                      </tr>



                    {/* LongTermDebtCurrent */}

                    <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">LongTermDebtCurrent</td>

                      {yearsList.map(y => (

                        <td key={`LongTermDebtCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'LongTermDebtCurrent')}</td>

                      ))}{renderAllAverageCells('LongTermDebtCurrent')}

                      {renderAllCAGRCells('LongTermDebtCurrent')}

                    </tr>



                    {/* OperatingLeaseLiabilitiesCurrent */}

                    <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OperatingLeaseLiabilitiesCurrent</td>

                      {yearsList.map(y => (

                        <td key={`OperatingLeaseLiabilitiesCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'OperatingLeaseLiabilitiesCurrent')}</td>

                      ))}{renderAllAverageCells('OperatingLeaseLiabilitiesCurrent')}

                      {renderAllCAGRCells('OperatingLeaseLiabilitiesCurrent')}

                    </tr>



                    {/* FinanceLeaseLiabilitiesCurrent */}

                    <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">FinanceLeaseLiabilitiesCurrent</td>

                  {yearsList.map(y => (

                        <td key={`FinanceLeaseLiabilitiesCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'FinanceLeaseLiabilitiesCurrent')}</td>

                      ))}{renderAllAverageCells('FinanceLeaseLiabilitiesCurrent')}

                  {renderAllCAGRCells('FinanceLeaseLiabilitiesCurrent')}

                </tr>



                    {/* OtherLiabilitiesCurrent */}

                    <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OtherLiabilitiesCurrent</td>

                      {yearsList.map(y => (

                        <td key={`OtherLiabilitiesCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'OtherLiabilitiesCurrent')}</td>

                      ))}{renderAllAverageCells('OtherLiabilitiesCurrent')}

                      {renderAllCAGRCells('OtherLiabilitiesCurrent')}

                </tr>

              </>

            )}



                {/* LiabilitiesNoncurrent */}

                <tr className="border-b-2 border-gray-200">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                    <button onClick={() => toggle('LiabilitiesNoncurrent')} className="w-full text-left">

                      {expanded['LiabilitiesNoncurrent'] ? 'v' : '^'} LiabilitiesNoncurrent

                </button>

              </td>

              {yearsList.map(y => (

                    <td key={`LiabilitiesNoncurrent-${y}`} className="p-2 text-center">

                      {renderCell(y, 'LiabilitiesNoncurrent')}

                </td>

              ))}{renderAllAverageCells('LiabilitiesNoncurrent')}

                  {renderAllCAGRCells('LiabilitiesNoncurrent')}

            </tr>



                {expanded['LiabilitiesNoncurrent'] && (

                  <>

                    {/* LongTermDebtNoncurrent */}

                    <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">LongTermDebtNoncurrent</td>

                      {yearsList.map(y => (

                        <td key={`LongTermDebtNoncurrent-${y}`} className="p-2 text-center">{renderCell(y, 'LongTermDebtNoncurrent')}</td>

                      ))}{renderAllAverageCells('LongTermDebtNoncurrent')}

                      {renderAllCAGRCells('LongTermDebtNoncurrent')}

                    </tr>



                    {/* OperatingLeaseLiabilityNoncurrent */}

                    <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OperatingLeaseLiabilityNoncurrent</td>

                      {yearsList.map(y => (

                        <td key={`OperatingLeaseLiabilityNoncurrent-${y}`} className="p-2 text-center">{renderCell(y, 'OperatingLeaseLiabilityNoncurrent')}</td>

                      ))}{renderAllAverageCells('OperatingLeaseLiabilitiesNoncurrent')}

                      {renderAllCAGRCells('OperatingLeaseLiabilitiesNoncurrent')}

                    </tr>



                    {/* FinanceLeaseLiabilitiesNonCurrent */}

                <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">FinanceLeaseLiabilitiesNonCurrent</td>

                  {yearsList.map(y => (

                        <td key={`FinanceLeaseLiabilitiesNonCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'FinanceLeaseLiabilitiesNonCurrent')}</td>

                  ))}{renderAllAverageCells('FinanceLeaseLiabilitiesNoncurrent')}

                      {renderAllCAGRCells('FinanceLeaseLiabilitiesNoncurrent')}

                </tr>



                    {/* DeferredIncomeTaxLiabilitiesNonCurrent */}

                <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">DeferredIncomeTaxLiabilitiesNonCurrent</td>

                  {yearsList.map(y => (

                        <td key={`DeferredIncomeTaxLiabilitiesNonCurrent-${y}`} className="p-2 text-center">{renderCell(y, 'DeferredIncomeTaxLiabilitiesNonCurrent')}</td>

                      ))}{renderAllAverageCells('DeferredIncomeTaxLiabilitiesNoncurrent')}

                  {renderAllCAGRCells('DeferredIncomeTaxLiabilitiesNoncurrent')}

                </tr>



                    {/* OtherLiabilitiesNoncurrent */}

                  <tr className="border-b dark:border-gray-600">

                      <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">OtherLiabilitiesNoncurrent</td>

                    {yearsList.map(y => (

                        <td key={`OtherLiabilitiesNoncurrent-${y}`} className="p-2 text-center">{renderCell(y, 'OtherLiabilitiesNoncurrent')}</td>

                    ))}{renderAllAverageCells('OtherLiabilitiesNoncurrent')}

                      {renderAllCAGRCells('OtherLiabilitiesNoncurrent')}

                  </tr>

                  </>

                )}

              </>

            )}



            {/* Total Stockholders' Equity */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                <button onClick={() => toggle('StockholdersEquity')} className="w-full text-left">
                  {expanded['StockholdersEquity'] ? 'v' : '^'} Stockholders' Equity
                </button>

                </td>

              {yearsList.map(y => (

                <td key={`TotalEquity-${y}`} className="p-2 text-center">

                  {renderCell(y, 'StockholdersEquity')}

                </td>

              ))}{renderAllAverageCells('StockholdersEquity')}

                {renderAllCAGRCells('StockholdersEquity')}

            </tr>

            {expanded['StockholdersEquity'] && (
              <>
                <tr className="border-b dark:border-gray-600">
                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">CommonStockEquity</td>
                  {yearsList.map(y => (
                    <td key={`CommonStockEquity-${y}`} className="p-2 text-center">{renderCell(y, 'CommonStockEquity')}</td>
                  ))}{renderAllAverageCells('CommonStockEquity')}
                  {renderAllCAGRCells('CommonStockEquity')}
                </tr>

                <tr className="border-b dark:border-gray-600">
                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">PaidInCapitalCommonStock</td>
                  {yearsList.map(y => (
                    <td key={`PaidInCapitalCommonStock-${y}`} className="p-2 text-center">{renderCell(y, 'PaidInCapitalCommonStock')}</td>
                  ))}{renderAllAverageCells('PaidInCapitalCommonStock')}
                  {renderAllCAGRCells('PaidInCapitalCommonStock')}
                </tr>

                <tr className="border-b dark:border-gray-600">
                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">AccumulatedOtherComprehensiveIncomeLossNetOfTax</td>
                  {yearsList.map(y => (
                    <td key={`AccumulatedOtherComprehensiveIncomeLossNetOfTax-${y}`} className="p-2 text-center">{renderCell(y, 'AccumulatedOtherComprehensiveIncomeLossNetOfTax')}</td>
                  ))}{renderAllAverageCells('AccumulatedOtherComprehensiveIncomeLossNetOfTax')}
                  {renderAllCAGRCells('AccumulatedOtherComprehensiveIncomeLossNetOfTax')}
                </tr>

                <tr className="border-b dark:border-gray-600">
                  <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">RetainedEarningsAccumulated</td>
                  {yearsList.map(y => (
                    <td key={`RetainedEarningsAccumulated-${y}`} className="p-2 text-center">{renderCell(y, 'RetainedEarningsAccumulated')}</td>
                  ))}{renderAllAverageCells('RetainedEarningsAccumulated')}
                  {renderAllCAGRCells('RetainedEarningsAccumulated')}
                </tr>
              </>
            )}



            {/* NoncontrollingInterests */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                NoncontrollingInterests

              </td>

              {yearsList.map(y => (

                <td key={`NoncontrollingInterests-${y}`} className="p-2 text-center">

                  {renderCell(y, 'NoncontrollingInterests')}

                </td>

              ))}{renderAllAverageCells('NoncontrollingInterests')}

              {renderAllCAGRCells('NoncontrollingInterests')}

            </tr>



            {/* LiabilitiesAndStockholdersEquity */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                LiabilitiesAndStockholdersEquity

                </td>

              {yearsList.map(y => (

                <td key={`LiabilitiesAndStockholdersEquity-${y}`} className="p-2 text-center">

                  {renderCell(y, 'LiabilitiesAndStockholdersEquity')}

                </td>

              ))}{renderAllAverageCells('LiabilitiesAndEquity')}

              {renderAllCAGRCells('LiabilitiesAndEquity')}

            </tr>



            {/* Additional Metrics Section */}

            <tr className="border-b-2 border-gray-300 dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] font-bold">

                Additional Metrics

              </td>

              {yearsList.map(y => (

                <td key={`AdditionalMetrics-${y}`} className="p-2 text-center">

                  {/* Empty header row */}

                </td>

              ))}

              <td className="p-2 text-center">

                {/* Empty cell */}

              </td>

              <td className="p-2 text-center">

                {/* Empty cell */}

              </td>

              {renderAllAverageCells('AdditionalMetrics')}

              {renderAllCAGRCells('AdditionalMetrics')}

            </tr>



            {/* RetainedEarningsAccumulated */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                RetainedEarningsAccumulated

              </td>

              {yearsList.map(y => (

                <td key={`RetainedEarningsAccumulated-${y}`} className="p-2 text-center">

                  {renderCell(y, 'RetainedEarningsAccumulated')}

                </td>

              ))}{renderAllAverageCells('RetainedEarningsAccumulated')}

              {renderAllCAGRCells('RetainedEarningsAccumulated')}

            </tr>



            {/* Debt */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                Debt

              </td>

              {yearsList.map(y => (

                <td key={`Debt-${y}`} className="p-2 text-center">

                  {renderCell(y, 'Debt')}

                </td>

              ))}{renderAllAverageCells('Debt')}

              {renderAllCAGRCells('Debt')}

            </tr>



            {/* ForeignTaxCreditCarryForward */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                ForeignTaxCreditCarryForward

              </td>

              {yearsList.map(y => (

                <td key={`ForeignTaxCreditCarryForward-${y}`} className="p-2 text-center">

                  {renderCell(y, 'ForeignTaxCreditCarryForward')}

                </td>

              ))}{renderAllAverageCells('ForeignTaxCreditCarryForward')}

              {renderAllCAGRCells('ForeignTaxCreditCarryForward')}

            </tr>



            {/* CapitalExpenditures */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                CapitalExpenditures

              </td>

              {yearsList.map(y => (

                <td key={`CapitalExpenditures-${y}`} className="p-2 text-center">

                  {renderCell(y, 'CapitalExpenditures')}

                </td>

              ))}{renderAllAverageCells('CapitalExpenditures')}

              {renderAllCAGRCells('CapitalExpenditures')}

            </tr>



            {/* OperatingCash */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                OperatingCash

              </td>

              {yearsList.map(y => (

                <td key={`OperatingCash-${y}`} className="p-2 text-center">

                  {renderCell(y, 'OperatingCash')}

                </td>

              ))}{renderAllAverageCells('OperatingCash')}

              {renderAllCAGRCells('OperatingCash')}

            </tr>



            {/* ExcessCash */}

            <tr className="border-b dark:border-gray-600">

              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px]">

                ExcessCash

              </td>

              {yearsList.map(y => (

                <td key={`ExcessCash-${y}`} className="p-2 text-center">

                  {renderCell(y, 'ExcessCash')}

                </td>

              ))}{renderAllAverageCells('ExcessCash')}

              {renderAllCAGRCells('ExcessCash')}

            </tr>



          </tbody>

        </table>

      </div>

    </div>

  );

};



interface ValuationPageProps {

  onClose?: () => void;
  
  initialCompany?: string;
  
  onCompanyChange?: (company: string) => void;

}



// Map balance sheet display keys to actual data keys
// This function maps display keys (like 'Receivables', 'Assets') to actual data keys (like 'ReceivablesCurrent', calculated 'Assets')
const mapBalanceSheetKey = (k: string): string => {
  switch (k) {
    // Current assets - all available in JSON
    case 'CashAndCashEquivalents': return 'CashAndCashEquivalents';
    case 'ShortTermInvestments': return 'ShortTermInvestments';
    case 'Receivables': return 'ReceivablesCurrent';
    case 'Inventory': return 'Inventory';
    case 'OtherAssetsCurrent': return 'OtherAssetsCurrent';
    // Non-current assets - all available in JSON
    case 'PropertyPlantAndEquipmentNet': return 'PropertyPlantAndEquipment';
    case 'OperatingLeaseRightOfUseAsset': return 'OperatingLeaseAssets';
    case 'LeaseFinanceAssetsNoncurrent': return 'FinanceLeaseAssets';
    case 'Goodwill': return 'Goodwill';
    case 'OtherNonCurrentAssets': return 'OtherAssetsNoncurrent';
    // Current liabilities - all available in JSON
    case 'AccountsPayable': return 'AccountsPayableCurrent';
    case 'AccountsPayableCurrent': return 'AccountsPayableCurrent';
    case 'EmployeeRelatedLiabilitiesCurrent': return 'EmployeeRelatedLiabilitiesCurrent';
    case 'EmployeeLiabilitiesCurrent': return 'EmployeeRelatedLiabilitiesCurrent';
    case 'AccruedLiabilitiesCurrent': return 'AccruedLiabilitiesCurrent';
    case 'DeferredRevenueCurrent': return 'DeferredRevenueCurrent';
    case 'CurrentDeferredLiabilities': return 'DeferredRevenueCurrent';
    case 'CurrentDebt': return 'LongTermDebtCurrent';
    case 'LongTermDebtCurrent': return 'LongTermDebtCurrent';
    case 'OperatingLeaseLiabilitiesCurrent': return 'OperatingLeaseLiabilitiesCurrent';
    case 'FinanceLeaseLiabilitiesCurrent': return 'FinanceLeaseLiabilitiesCurrent';
    case 'OtherCurrentLiabilities': return 'OtherLiabilitiesCurrent';
    case 'OtherLiabilitiesCurrent': return 'OtherLiabilitiesCurrent';
    // Non-current liabilities - all available in JSON
    case 'LongTermDebt': return 'LongTermDebtNoncurrent';
    case 'LongTermDebtNoncurrent': return 'LongTermDebtNoncurrent';
    case 'OperatingLeaseLiabilityNoncurrent': return 'OperatingLeaseLiabilityNoncurrent';
    case 'OperatingLeaseLiabilitiesNoncurrent': return 'OperatingLeaseLiabilityNoncurrent';
    case 'FinanceLeaseLiabilitiesNonCurrent': return 'FinanceLeaseLiabilitiesNonCurrent';
    case 'FinanceLeaseLiabilitiesNoncurrent': return 'FinanceLeaseLiabilitiesNonCurrent';
    case 'DeferredIncomeTaxLiabilitiesNonCurrent': return 'DeferredIncomeTaxLiabilitiesNonCurrent';
    case 'DeferredIncomeTaxLiabilitiesNoncurrent': return 'DeferredIncomeTaxLiabilitiesNonCurrent';
    case 'OtherNonCurrentLiabilities': return 'OtherLiabilitiesNoncurrent';
    case 'OtherLiabilitiesNoncurrent': return 'OtherLiabilitiesNoncurrent';
    // Aggregated totals - all available in JSON
    case 'AssetsCurrent': return 'AssetsCurrent';
    case 'CurrentAssets': return 'AssetsCurrent';
    case 'AssetsNoncurrent': return 'AssetsNoncurrent';
    case 'TotalNonCurrentAssets': return 'AssetsNoncurrent';
    case 'Assets': return 'Assets';
    case 'TotalAssets': return 'Assets';
    case 'LiabilitiesCurrent': return 'LiabilitiesCurrent';
    case 'CurrentLiabilities': return 'LiabilitiesCurrent';
    case 'LiabilitiesNoncurrent': return 'LiabilitiesNoncurrent';
    case 'Liabilities': return 'Liabilities';
    case 'TotalLiabilities': return 'Liabilities';
    case 'Equity': return 'Equity';
    case 'StockholdersEquity': return 'Equity';
    case 'LiabilitiesAndStockholdersEquity': return 'LiabilitiesAndEquity';
    case 'LiabilitiesAndEquity': return 'LiabilitiesAndEquity';
    // Additional metrics
    case 'RetainedEarningsAccumulated': return 'RetainedEarningsAccumulated';
    case 'Debt': return 'Debt';
    case 'ForeignTaxCreditCarryForward': return 'ForeignTaxCreditCarryForward';
    case 'CapitalExpenditures': return 'CapitalExpenditures';
    case 'OperatingCash': return 'OperatingCash';
    case 'ExcessCash': return 'ExcessCash';
    // New missing fields
    case 'ReceivablesNoncurrent': return 'ReceivablesNoncurrent';
    case 'VariableLeaseAssets': return 'VariableLeaseAssets';
    case 'NoncontrollingInterests': return 'NoncontrollingInterests';
    default: return k;
  }
};

const ValuationPage: React.FC<ValuationPageProps> = ({ onClose, initialCompany, onCompanyChange }) => {

  const { updateCompanyTableData, resetCompanyData, getModifiedCompanyData } = useCompanyData();
  const [hasIncomeStatementData, setHasIncomeStatementData] = useState<boolean>(true);
  
  // Helper function to merge static data with context modifications
  const mergeDataWithContext = useCallback((staticData: {[key: string]: TableData}, ticker: string): {[key: string]: TableData} => {
    const modifiedData = getModifiedCompanyData(ticker);
    if (!modifiedData) {
      console.log(`[mergeDataWithContext] No modified data for ${ticker}, returning static data as-is`);
      return staticData;
    }
    
    console.log(`[mergeDataWithContext] Merging data for ${ticker}, modified tables:`, Object.keys(modifiedData));
    
    const merged = { ...staticData };
    
    // Merge each table that has modifications
    Object.keys(modifiedData).forEach(tableId => {
      // Special handling for income statement: ensure API data (staticData) is the base
      // Only merge user edits from context, not full table replacements
      if (tableId === 'incomeStatement') {
        console.log(`[mergeDataWithContext] Merging income statement for ${ticker}`);
        console.log(`[mergeDataWithContext] Static income statement has ${Object.keys(staticData[tableId] || {}).length} years`);
        console.log(`[mergeDataWithContext] Modified income statement has ${Object.keys(modifiedData[tableId] || {}).length} years`);
        
        // If we have API data (staticData), use it as the base - it takes precedence
        // If staticData is empty but we have context data, that means API hasn't loaded yet, so use context
        const hasApiData = staticData[tableId] && Object.keys(staticData[tableId]).length > 0;
        
        if (hasApiData) {
          // Start with API data as base - this is the source of truth
          const mergedTable: TableData = { ...staticData[tableId] };
          
          // Only merge user edits (field-level modifications) from context on top of API data
          Object.keys(modifiedData[tableId]).forEach(year => {
            const yearNum = typeof year === 'string' && !isNaN(Number(year)) ? Number(year) : year;
            if ((mergedTable as any)[yearNum]) {
              // Merge user edits on top of API data (user edits take precedence for specific fields)
              (mergedTable as any)[yearNum] = {
                ...(mergedTable as any)[yearNum],
                ...(modifiedData as any)[tableId][year]
              };
            } else {
              // If year doesn't exist in API data, add it from context (user-added forecast year)
              (mergedTable as any)[yearNum] = { ...(modifiedData as any)[tableId][year] };
            }
          });
          
          merged[tableId] = mergedTable;
          console.log(`[mergeDataWithContext] Using API data as base, final merged income statement has ${Object.keys(mergedTable).length} years`);
        } else {
          // No API data yet, use context data temporarily (shouldn't happen after API loads)
          console.warn(`[mergeDataWithContext] No API data for income statement, using context data`);
          merged[tableId] = { ...(modifiedData[tableId] as TableData) };
        }
      } else {
        // For other tables, use existing merge logic
        if (modifiedData[tableId] && staticData[tableId]) {
          const mergedTable: TableData = { ...staticData[tableId] };
          
          // Merge each year's data
          Object.keys(modifiedData[tableId]).forEach(year => {
            const yearNum = typeof year === 'string' && !isNaN(Number(year)) ? Number(year) : year;
            if ((mergedTable as any)[yearNum]) {
              (mergedTable as any)[yearNum] = {
                ...(mergedTable as any)[yearNum],
                ...(modifiedData as any)[tableId][year]
              };
            } else {
              (mergedTable as any)[yearNum] = { ...(modifiedData as any)[tableId][year] };
            }
          });
          
          merged[tableId] = mergedTable;
        }
      }
    });
    
    return merged;
  }, [getModifiedCompanyData]);

  // Initialize state with static data merged with context data
  const getInitialData = useCallback((ticker: string) => {
    const baseData = {
      balanceSheet: balanceSheetReal,
      ppeChanges: ppeChangesReal,
      freeCashFlow: freeCashFlowReal,
      cashFlows: (cashFlowReal as unknown) as TableData,
      incomeStatement: {} as TableData, // Will be loaded from API
      incomeStatementCommonSize: (incomeStatementCommonReal as unknown) as TableData,
      balanceSheetCommonSize: (balanceSheetCommonReal as unknown) as TableData,
      nopat: nopatReal,
      investedCapital: investedCapitalReal,
      roicPerformance: (roicReal as unknown) as TableData,
      financingHealth: (financeHealthReal as unknown) as TableData,
      operationalPerformance: (operationalPerformanceReal as unknown) as TableData
    };
    
    return mergeDataWithContext(baseData, ticker);
  }, [mergeDataWithContext]);

  const [allData, setAllData] = useState<{[key: string]: TableData}>(() => getInitialData(initialCompany || 'COST'));



  const [selectedCompany, setSelectedCompany] = useState(initialCompany || 'COST');

  const [activeTab, setActiveTab] = useState('incomeStatement');

  // Company dropdown state
  const [availableCompanies, setAvailableCompanies] = useState<CompanyTicker[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState<boolean>(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState<boolean>(false);
  const [companyInput, setCompanyInput] = useState<string>('');
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch companies from API
  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/companies`);
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`);
      }
      const data = await response.json();
      
      // Handle both paginated (results) and non-paginated responses
      const companiesList = data.results || data;
      
      const companies: CompanyTicker[] = [];
      companiesList.forEach((company: any) => {
        const ticker = company.ticker;
        const display_name = company.display_name || company.name || company.ticker;
        const name = company.name || company.ticker;
        companies.push({ ticker, name, display_name });
      });
      
      setAvailableCompanies(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Map CSV metric names to frontend field names
  const mapMetricNameToFrontendField = (csvMetricName: string): string => {
    const mapping: { [key: string]: string } = {
      // API Name -> Frontend Structure Name
      'SellingGeneralAndAdministration': 'SGAExpense',
      'SellingAndMarketingExpense': 'SellingAndMarketingExpense',
      'GeneralAndAdministrativeExpense': 'GeneralAndAdministrativeExpense',
      'ResearchAndDevelopment': 'ResearchAndDevelopment',
      'FulfillmentExpense': 'FulfillmentExpense',
      'TechnologyExpense': 'TechnologyExpense',
      'DepreciationAndAmortization': 'DepreciationAmortization',
      'GrossMargin': 'GrossProfit',
      'NetIncomeControlling': 'ProfitLossControlling', // Keep if used elsewhere, but check structure
      'OtherNonoperatingIncome': 'OtherIncome',
      'Revenue': 'Revenue',
      'CostOfRevenue': 'CostOfRevenue',
      'OperatingIncome': 'OperatingIncome',
      'OperatingExpenses': 'OperatingExpenses',
      'InterestExpense': 'InterestExpense',
      'InterestIncome': 'InterestIncome',
      'TaxProvision': 'TaxProvision',
      'NetIncome': 'NetIncome',
      'NetIncomeNoncontrolling': 'NetIncomeNoncontrolling'
    };
    
    // Return mapped name if exists, otherwise return original
    return mapping[csvMetricName] || csvMetricName;
  };

  // Map balance sheet CSV metric names to frontend field names
  const mapBalanceSheetMetricNameToFrontendField = (csvMetricName: string): string => {
    const mapping: { [key: string]: string } = {
      // API Name -> Frontend Structure Name
      // Assets Current
      'CashAndCashEquivalents': 'CashAndCashEquivalents',
      'ShortTermInvestments': 'ShortTermInvestments',
      'ReceivablesCurrent': 'ReceivablesCurrent', // Was 'Receivables' in structure but API sends 'ReceivablesCurrent'. Structure uses 'ReceivablesCurrent' as key.
      'Inventory': 'Inventory',
      'DeferredTaxAssetsCurrentBS': 'DeferredTaxAssetsCurrentBS',
      'OtherAssetsCurrent': 'OtherAssetsCurrent',
      
      // Assets Noncurrent
      'PropertyPlantAndEquipment': 'PropertyPlantAndEquipmentNet', // Map API 'PropertyPlantAndEquipment' to 'PropertyPlantAndEquipmentNet'
      'OperatingLeaseAssets': 'OperatingLeaseAssetsNoncurrent',   // Map API 'OperatingLeaseAssets' to 'OperatingLeaseAssetsNoncurrent'
      'FinanceLeaseAssets': 'FinanceLeaseAssetsNoncurrent',       // Map API 'FinanceLeaseAssets' to 'FinanceLeaseAssetsNoncurrent'
      'Goodwill': 'Goodwill',
      'DeferredIncomeTaxAssetsNoncurrent': 'DeferredIncomeTaxAssetsNoncurrent',
      'OtherAssetsNoncurrent': 'OtherAssetsNoncurrent',
      'ReceivablesNoncurrent': 'ReceivablesNoncurrent',
      'VariableLeaseAssets': 'VariableLeaseAssets',
      
      // Liabilities Current
      'AccountsPayableCurrent': 'AccountsPayableCurrent',
      'EmployeeAccruedLiabilitiesCurrent': 'EmployeeLiabilitiesCurrent', // Map API 'EmployeeAccruedLiabilitiesCurrent' to 'EmployeeLiabilitiesCurrent'
      'AccruedLiabilitiesCurrent': 'AccruedLiabilitiesCurrent',
      'AccruedIncomeTaxesCurrent': 'AccruedIncomeTaxesCurrent',
      'DeferredRevenueCurrent': 'DeferredRevenueCurrent',
      'LongTermDebtCurrent': 'LongTermDebtCurrent',
      'OperatingLeaseLiabilitiesCurrent': 'OperatingLeaseLiabilitiesCurrent',
      'FinanceLeaseLiabilitiesCurrent': 'FinanceLeaseLiabilitiesCurrent',
      'OtherLiabilitiesCurrent': 'OtherLiabilitiesCurrent',

      // Liabilities Noncurrent
      'LongTermDebtNoncurrent': 'LongTermDebtNoncurrent',
      'OperatingLeaseLiabilitiesNoncurrent': 'OperatingLeaseLiabilitiesNoncurrent', // Map API to Frontend
      'FinanceLeaseLiabilitiesNoncurrent': 'FinanceLeaseLiabilitiesNoncurrent',
      'DeferredIncomeTaxLiabilitiesNoncurrent': 'DeferredIncomeTaxLiabilitiesNoncurrent',
      'OtherLiabilitiesNoncurrent': 'OtherLiabilitiesNoncurrent',

      // Equity
      'CommonStock': 'CommonStockEquity', // Map API 'CommonStock' to 'CommonStockEquity'
      'PaidInCapitalCommonStock': 'PaidInCapitalCommonStock',
      'AccumulatedOtherIncome': 'AccumulatedOtherComprehensiveIncomeLossNetOfTax', // Map API 'AccumulatedOtherIncome'
      'NoncontrollingInterests': 'NoncontrollingInterests',
      'RetainedEarningsAccumulated': 'RetainedEarningsAccumulated',
      
      // Additional Metrics
      'Debt': 'Debt',
      'ForeignTaxCreditCarryForward': 'ForeignTaxCreditCarryForward',
      'CapitalExpenditures': 'CapitalExpenditures',
      'OperatingCash': 'OperatingCash',
      'ExcessCash': 'ExcessCash'
    };
    
    // Return mapped name if exists, otherwise return original
    return mapping[csvMetricName] || csvMetricName;
  };

  // Map cash flow CSV metric names to frontend field names
  const mapCashFlowMetricNameToFrontendField = (csvMetricName: string): string => {
    const mapping: { [key: string]: string } = {
      // API Name -> Frontend CashFlowsTable Name
      'DepreciationAndAmortization': 'DepreciationDepletionAndAmortization',
      'PaidInCapitalCommonStockIssuance': 'CommonStockIssuance',
      'PaidInCapitalCommonStockRepurchasePayment': 'CommonStockRepurchasePayment',
      'PaidInCapitalCommonStockDividendPayment': 'CommonStockDividendPayment',
      
      // Direct matches (explicitly listed for clarity)
      'NetIncome': 'NetIncome',
      'DeferredTax': 'DeferredTax',
      'OtherNoncashChanges': 'OtherNoncashChanges',
      'ChangeInReceivables': 'ChangeInReceivables',
      'ChangeInInventory': 'ChangeInInventory',
      'ChangeInPayable': 'ChangeInPayable',
      'ChangeInOtherCurrentAssets': 'ChangeInOtherCurrentAssets',
      'ChangeInOtherCurrentLiabilities': 'ChangeInOtherCurrentLiabilities',
      'ChangeInOtherWorkingCapital': 'ChangeInOtherWorkingCapital',
      'PurchaseOfPPE': 'PurchaseOfPPE',
      'SaleOfPPE': 'SaleOfPPE',
      'PurchaseOfBusiness': 'PurchaseOfBusiness',
      'SaleOfBusiness': 'SaleOfBusiness',
      'PurchaseOfInvestment': 'PurchaseOfInvestment',
      'SaleOfInvestment': 'SaleOfInvestment',
      'ShortTermDebtIssuance': 'ShortTermDebtIssuance',
      'ShortTermDebtPayment': 'ShortTermDebtPayment',
      'LongTermDebtIssuance': 'LongTermDebtIssuance',
      'LongTermDebtPayment': 'LongTermDebtPayment',
      'TaxWithholdingPayment': 'TaxWithholdingPayment',
      'FinancingLeasePayment': 'FinancingLeasePayment',
      'MinorityDividendPayment': 'MinorityDividendPayment',
      'MinorityShareholderPayment': 'MinorityShareholderPayment'
    };
    
    // Return mapped name if exists, otherwise return original
    return mapping[csvMetricName] || csvMetricName;
  };

  // Fetch income statement data from API
  const fetchIncomeStatementData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Income Statement] Fetching data for ${ticker}...`);
    try {
      // Use new centralized API endpoint
      const response = await fetch(`${baseUrl}/api/sec/central/financials/income-statement/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Income Statement] No income statement data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch income statement data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Income Statement] Raw API response for ${ticker}:`, data);
      
      // Transform API response to TableData format
      // API returns: { [year: string]: { [metric_name: string]: number } }
      // We need: { [year: number]: { [field_name: string]: number } }
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          
          // Map each metric name to frontend field name
          for (const [csvMetricName, value] of Object.entries(metrics as { [key: string]: number | string })) {
            const frontendFieldName = mapMetricNameToFrontendField(csvMetricName);
            yearData[frontendFieldName] = value;
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Income Statement] Transformed data for ${ticker}:`, tableData);
      console.log(`[Income Statement] Years available:`, Object.keys(tableData));
      if (Object.keys(tableData).length > 0) {
        const firstYear = Object.keys(tableData)[0];
        console.log(`[Income Statement] Sample year ${firstYear} fields:`, Object.keys(tableData[parseInt(firstYear)]));
      }
      
      return tableData;
    } catch (error) {
      console.error(`[Income Statement] Error fetching income statement data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch balance sheet data from API
  const fetchBalanceSheetData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Balance Sheet] Fetching data for ${ticker}...`);
    try {
      // Use new centralized API endpoint
      const response = await fetch(`${baseUrl}/api/sec/central/financials/balance-sheet/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Balance Sheet] No balance sheet data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch balance sheet data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Balance Sheet] Raw API response for ${ticker}:`, data);
      
      // Transform API response to TableData format
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          
          // Map each metric name to frontend field name
          for (const [csvMetricName, value] of Object.entries(metrics as { [key: string]: number | string })) {
            const frontendFieldName = mapBalanceSheetMetricNameToFrontendField(csvMetricName);
            yearData[frontendFieldName] = value;
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Balance Sheet] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Balance Sheet] Error fetching balance sheet data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch cash flow data from API
  const fetchCashFlowData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Cash Flow] Fetching data for ${ticker}...`);
    try {
      // Use new centralized API endpoint
      const response = await fetch(`${baseUrl}/api/sec/central/financials/cash-flow/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Cash Flow] No cash flow data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch cash flow data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Cash Flow] Raw API response for ${ticker}:`, data);
      
      // Transform API response to TableData format
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          
          // Map each metric name to frontend field name
          for (const [csvMetricName, value] of Object.entries(metrics as { [key: string]: number | string })) {
            const frontendFieldName = mapCashFlowMetricNameToFrontendField(csvMetricName);
            yearData[frontendFieldName] = value;
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Cash Flow] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Cash Flow] Error fetching cash flow data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // removed navigate = useNavigate();



  // removed handleTabChange = (val: string) => { ... };






  // Fetch NOPAT data from API
  const fetchNOPATData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[NOPAT] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/nopat/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[NOPAT] No NOPAT data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch NOPAT data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[NOPAT] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          // Map API fields to Frontend fields
          if (m.EBIT !== undefined) yearData['EBITAAdjusted'] = m.EBIT;
          if (m.CashTaxAdjustment !== undefined) yearData['TaxProvision'] = m.CashTaxAdjustment;
          if (m.NOPAT !== undefined) yearData['NOPAT'] = m.NOPAT;
          
          // Fill other fields if possible or leave empty/calculated
          // Usually NOPAT table has more rows, but we only get these 3 from API.
          // The calculation logic might override this if we trigger recalculations.
          // But for historical data, we should trust the API if available.
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[NOPAT] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[NOPAT] Error fetching NOPAT data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Invested Capital data from API
  const fetchInvestedCapitalData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Invested Capital] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/invested-capital/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Invested Capital] No Invested Capital data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Invested Capital data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Invested Capital] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          // Map API fields to Frontend fields
          if (m.OperatingWorkingCapital !== undefined) yearData['OperatingWorkingCapital'] = m.OperatingWorkingCapital;
          if (m['NetPP&E'] !== undefined) yearData['PropertyPlantAndEquipment'] = m['NetPP&E'];
          if (m.InvestedCapital !== undefined) yearData['InvestedCapitalIncludingGoodwill'] = m.InvestedCapital;
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Invested Capital] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Invested Capital] Error fetching Invested Capital data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Free Cash Flow data from API
  const fetchFreeCashFlowData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Free Cash Flow] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/free-cash-flow/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Free Cash Flow] No Free Cash Flow data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Free Cash Flow data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Free Cash Flow] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.NOPAT !== undefined) yearData['NetOperatingProfitAfterTaxes'] = m.NOPAT;
          if (m.FreeCashFlow !== undefined) yearData['FreeCashFlow'] = m.FreeCashFlow;
          // ChangeInInvestedCapital is an aggregate, might not map directly to a single breakdown line
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Free Cash Flow] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Free Cash Flow] Error fetching Free Cash Flow data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch ROIC data from API
  const fetchROICData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[ROIC] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/roic/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[ROIC] No ROIC data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch ROIC data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[ROIC] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.NOPATMargin !== undefined && typeof m.NOPATMargin === 'number') {
            yearData['OperatingProfitAsPercentOfRevenue'] = m.NOPATMargin * 100; // Convert to percentage
          }
          if (m.ROIC !== undefined && typeof m.ROIC === 'number') {
            yearData['ReturnOnInvestedCapitalIncludingGoodwill'] = m.ROIC * 100; // Convert to percentage
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[ROIC] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[ROIC] Error fetching ROIC data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Operational Performance data from API
  const fetchOperationalPerformanceData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Operational Performance] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/operational-performance/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Operational Performance] No Operational Performance data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Operational Performance data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Operational Performance] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.RevenueGrowth !== undefined) yearData['RevenueGrowth'] = m.RevenueGrowth; // Percentage value (e.g. 6.7)
          if (m.EBITDAMargin !== undefined) yearData['EBITDAMargin'] = (m.EBITDAMargin as number) * 100; // Ratio (e.g. 0.034) -> Percentage (3.4)
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Operational Performance] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Operational Performance] Error fetching Operational Performance data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Financing Health data from API
  const fetchFinancingHealthData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Financing Health] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/financing-health/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Financing Health] No Financing Health data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Financing Health data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Financing Health] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.NetDebt !== undefined) yearData['NetDebt'] = m.NetDebt;
          if (m.NetDebtToEBITDA !== undefined) yearData['DebtToEBITDA'] = m.NetDebtToEBITDA;
          if (m.InterestCoverage !== undefined) yearData['EBITAToTotalInterest'] = m.InterestCoverage;
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Financing Health] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Financing Health] Error fetching Financing Health data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Switch company data when selectedCompany changes

  useEffect(() => {
    const loadCompanyData = async () => {
      console.log(`[ValuationPage] Loading company data for ${selectedCompany}`);
      // Fetch income statement from API
      const incomeStatementData = await fetchIncomeStatementData(selectedCompany);
      console.log(`[ValuationPage] Income statement data received:`, incomeStatementData ? `Has ${Object.keys(incomeStatementData).length} years` : 'null/empty');
      
      const hasData = !!(incomeStatementData && Object.keys(incomeStatementData).length > 0);
      setHasIncomeStatementData(hasData);
      
      if (!hasData) {
        console.warn(`No income statement data available for ${selectedCompany}`);
      }
      
      // Fetch balance sheet from API
      const balanceSheetData = await fetchBalanceSheetData(selectedCompany);
      console.log(`[ValuationPage] Balance sheet data received:`, balanceSheetData ? `Has ${Object.keys(balanceSheetData).length} years` : 'null/empty');
      
      // Fetch cash flow from API
      const cashFlowData = await fetchCashFlowData(selectedCompany);
      console.log(`[ValuationPage] Cash flow data received:`, cashFlowData ? `Has ${Object.keys(cashFlowData).length} years` : 'null/empty');
      
      // Fetch NOPAT from API
      const nopatData = await fetchNOPATData(selectedCompany);
      console.log(`[ValuationPage] NOPAT data received:`, nopatData ? `Has ${Object.keys(nopatData).length} years` : 'null/empty');

      // Fetch Invested Capital from API
      const investedCapitalData = await fetchInvestedCapitalData(selectedCompany);
      console.log(`[ValuationPage] Invested Capital data received:`, investedCapitalData ? `Has ${Object.keys(investedCapitalData).length} years` : 'null/empty');

      // Fetch Free Cash Flow from API
      const freeCashFlowData = await fetchFreeCashFlowData(selectedCompany);
      console.log(`[ValuationPage] Free Cash Flow data received:`, freeCashFlowData ? `Has ${Object.keys(freeCashFlowData).length} years` : 'null/empty');

      // Fetch ROIC from API
      const roicData = await fetchROICData(selectedCompany);
      console.log(`[ValuationPage] ROIC data received:`, roicData ? `Has ${Object.keys(roicData).length} years` : 'null/empty');

      // Fetch Operational Performance from API
      const opData = await fetchOperationalPerformanceData(selectedCompany);
      console.log(`[ValuationPage] Operational Performance data received:`, opData ? `Has ${Object.keys(opData).length} years` : 'null/empty');

      // Fetch Financing Health from API
      const fhData = await fetchFinancingHealthData(selectedCompany);
      console.log(`[ValuationPage] Financing Health data received:`, fhData ? `Has ${Object.keys(fhData).length} years` : 'null/empty');
      
      // For now, keep other tables as hardcoded (will be replaced later)
      // Start with default/fallback data structure
      let staticData: any = {
        balanceSheet: balanceSheetData || {} as TableData,
        ppeChanges: ppeChangesReal as TableData,
        freeCashFlow: freeCashFlowData || {} as TableData,
        cashFlows: cashFlowData || {} as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: {} as TableData,
        balanceSheetCommonSize: {} as TableData,
        nopat: nopatData || {} as TableData,
        investedCapital: investedCapitalData || {} as TableData,
        roicPerformance: roicData || {} as TableData,
        financingHealth: fhData || {} as TableData,
        operationalPerformance: opData || {} as TableData
      };

      // Load other tables from mock data for specific companies (temporary until we load them from DB)
      if (selectedCompany === 'WMT') {
        staticData = {
          ...staticData,
          balanceSheet: walmartMockData.balanceSheet as TableData,
          freeCashFlow: walmartMockData.cashFlow as TableData,
          cashFlows: walmartMockData.cashFlow as TableData,
          incomeStatementCommonSize: walmartMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: walmartMockData.balanceSheetCommonSize as TableData,
          nopat: walmartMockData.nopat as TableData,
          investedCapital: walmartMockData.investedCapital as TableData,
          roicPerformance: walmartMockData.roicPerformance as TableData,
          financingHealth: walmartMockData.financingHealth as TableData,
          operationalPerformance: walmartMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'BJ') {
        staticData = {
          ...staticData,
          balanceSheet: bjMockData.balanceSheet as TableData,
          freeCashFlow: bjMockData.freeCashFlow as TableData,
          cashFlows: bjMockData.cashFlow as TableData,
          incomeStatementCommonSize: bjMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: bjMockData.balanceSheetCommonSize as TableData,
          nopat: bjMockData.nopat as TableData,
          investedCapital: bjMockData.investedCapital as TableData,
          roicPerformance: bjMockData.roicPerformance as TableData,
          financingHealth: bjMockData.financingHealth as TableData,
          operationalPerformance: bjMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'DG') {
        staticData = {
          ...staticData,
          balanceSheet: dgMockData.balanceSheet as TableData,
          freeCashFlow: dgMockData.cashFlow as TableData,
          cashFlows: dgMockData.cashFlow as TableData,
          incomeStatementCommonSize: dgMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: dgMockData.balanceSheetCommonSize as TableData,
          nopat: dgMockData.nopat as TableData,
          investedCapital: dgMockData.investedCapital as TableData,
          roicPerformance: dgMockData.roicPerformance as TableData,
          financingHealth: dgMockData.financingHealth as TableData,
          operationalPerformance: dgMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'DLTR') {
        staticData = {
          ...staticData,
          balanceSheet: dltrMockData.balanceSheet as TableData,
          ppeChanges: dltrMockData.ppeChanges as TableData,
          freeCashFlow: dltrMockData.freeCashFlow as TableData,
          cashFlows: dltrMockData.cashFlow as TableData,
          incomeStatementCommonSize: dltrMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: dltrMockData.balanceSheetCommonSize as TableData,
          nopat: dltrMockData.nopat as TableData,
          investedCapital: dltrMockData.investedCapital as TableData,
          roicPerformance: dltrMockData.roicPerformance as TableData,
          financingHealth: dltrMockData.financingHealth as TableData,
          operationalPerformance: dltrMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'TGT') {
        staticData = {
          ...staticData,
          balanceSheet: tgtMockData.balanceSheet as TableData,
          ppeChanges: tgtMockData.ppeChanges as TableData,
          freeCashFlow: tgtMockData.freeCashFlow as TableData,
          cashFlows: tgtMockData.cashFlow as TableData,
          incomeStatementCommonSize: tgtMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: tgtMockData.balanceSheetCommonSize as TableData,
          nopat: tgtMockData.nopat as TableData,
          investedCapital: tgtMockData.investedCapital as TableData,
          roicPerformance: tgtMockData.roicPerformance as TableData,
          financingHealth: tgtMockData.financingHealth as TableData,
          operationalPerformance: tgtMockData.operationalPerformance as TableData
        };
      } else {
        // Default to Costco data structure for other companies (only as fallback if API data not available)
        staticData = {
          ...staticData,
          balanceSheet: staticData.balanceSheet && Object.keys(staticData.balanceSheet).length > 0 ? staticData.balanceSheet : balanceSheetReal,
          freeCashFlow: staticData.freeCashFlow && Object.keys(staticData.freeCashFlow).length > 0 ? staticData.freeCashFlow : freeCashFlowReal,
          cashFlows: staticData.cashFlows && Object.keys(staticData.cashFlows).length > 0 ? staticData.cashFlows : (cashFlowReal as unknown) as TableData,
          incomeStatementCommonSize: (incomeStatementCommonReal as unknown) as TableData,
          balanceSheetCommonSize: (balanceSheetCommonReal as unknown) as TableData,
          nopat: nopatReal,
          investedCapital: investedCapitalReal,
          roicPerformance: (roicReal as unknown) as TableData,
          financingHealth: (financeHealthReal as unknown) as TableData,
          operationalPerformance: (operationalPerformanceReal as unknown) as TableData
        };
      }
      
      console.log(`[ValuationPage] Static data before merge for ${selectedCompany}:`, {
        incomeStatement: staticData.incomeStatement ? `Has ${Object.keys(staticData.incomeStatement).length} years` : 'empty',
        balanceSheet: staticData.balanceSheet ? `Has ${Object.keys(staticData.balanceSheet).length} years` : 'empty'
      });
      
      const mergedData = mergeDataWithContext(staticData, selectedCompany);
      console.log(`[ValuationPage] Merged data for ${selectedCompany}:`, {
        incomeStatement: mergedData.incomeStatement ? `Has ${Object.keys(mergedData.incomeStatement).length} years` : 'empty',
        balanceSheet: mergedData.balanceSheet ? `Has ${Object.keys(mergedData.balanceSheet).length} years` : 'empty'
      });
      
      // Log sample income statement data to verify it's from API
      if (mergedData.incomeStatement && Object.keys(mergedData.incomeStatement).length > 0) {
        const sampleYear = Object.keys(mergedData.incomeStatement).sort().reverse()[0]; // Get latest year
        const sampleData = mergedData.incomeStatement[parseInt(sampleYear)];
        console.log(`[ValuationPage] Sample income statement data for year ${sampleYear}:`, {
          Revenue: sampleData?.Revenue,
          CostOfRevenue: sampleData?.CostOfRevenue,
          SellingGeneralAdministrative: sampleData?.SellingGeneralAdministrative,
          NetIncome: sampleData?.NetIncome
        });
      }
      
      setAllData(mergedData);
      console.log(`[ValuationPage] allData state updated for ${selectedCompany}`);
    };
    
    loadCompanyData();
  }, [selectedCompany, mergeDataWithContext, fetchIncomeStatementData, fetchBalanceSheetData, fetchCashFlowData]);



  // Note: Operational performance data is now loaded from static data file

  // including both historical (2011-2024) and forecast years (2025-2035)



  // Calculate derived tables based on input data

  const calculateDerivedData = useCallback(() => {

    const { balanceSheet, ppeChanges = {}, freeCashFlow, incomeStatement } = allData;



    // Calculate NOPAT using proper formulas from the image

    const nopat: TableData = {};

    years.forEach(year => {

      if (incomeStatement[year]) {

        const incomeData = incomeStatement[year];

        const balanceSheetData = balanceSheet[year] || {};

        

        // Get input fields from Income Statement

        const revenue = (incomeData.Revenue as number) || 0;

        const costOfRevenue = (incomeData.CostOfRevenue as number) || 0;

        const sga = (incomeData.SellingGeneralAdministrative as number) || 0;

        const depreciation = (incomeData.Depreciation as number) || 0;

        const taxProvision = (incomeData.TaxProvision as number) || 0;

        const leasesDiscountRate = (incomeData.LeasesDiscountRate as number) || 0;

        

        // Calculate EBITA Unadjusted = Revenue + CostOfRevenue + SG&A + Depreciation

        const ebitaUnadjusted = revenue + costOfRevenue + sga + depreciation;

        

        // Calculate Operating Lease Interest = CapitalTable_prior_year['OperatingLeaseLiabilities'] * LeasesDiscountRate / 100

        const priorYear = year - 1;

        const priorYearCapital = allData.investedCapital?.[priorYear] || {};

        const operatingLeaseLiabilities = (priorYearCapital.OperatingLeaseLiabilities as number) || 0;

        const operatingLeaseInterest = operatingLeaseLiabilities * leasesDiscountRate / 100;

        

        // Calculate Variable Lease Interest = BalanceSheet['VariableLeaseAssets'] * LeasesDiscountRate / 100

        const variableLeaseAssets = (balanceSheetData.VariableLeaseAssets as number) || 0;

        const variableLeaseInterest = variableLeaseAssets * leasesDiscountRate / 100;

        

        // Calculate EBITA Adjusted = EBITA_Unadjusted + OperatingLeaseInterest + VariableLeaseInterest

        const ebitaAdjusted = ebitaUnadjusted + operatingLeaseInterest + variableLeaseInterest;

        

        // Calculate NOPAT = EBITAAdjusted - TaxProvision

        const calculatedNOPAT = ebitaAdjusted - taxProvision;

        

        nopat[year] = {

          Revenue: revenue,

          CostOfRevenue: costOfRevenue,

          SellingGeneralAndAdministration: sga,

          Depreciation: depreciation,

          EBITA_Unadjusted: ebitaUnadjusted,

          OperatingLeaseInterest: operatingLeaseInterest,

          VariableLeaseInterest: variableLeaseInterest,

          EBITAAdjusted: ebitaAdjusted,

          TaxProvision: taxProvision,

          NOPAT: calculatedNOPAT

        };

      }

    });



    // Calculate Invested Capital (simplified)

    const calculatedInvestedCapital: TableData = {};

    years.forEach(year => {

      if (ppeChanges[year]) {

        calculatedInvestedCapital[year] = {

          PPE: (ppeChanges[year].PPEEndOfYear as number) || 0,

          WorkingCapital: 0,

          TotalInvestedCapital: ((ppeChanges[year].PPEEndOfYear as number) || 0)

        };

      }

    });



    return {

      ...allData,

      nopat: nopat, // Use the calculated nopat data

      investedCapital: calculatedInvestedCapital,

      freeCashFlow: freeCashFlow,

      roicPerformance: allData.roicPerformance || {} // Include roicPerformance from allData

    };

  }, [allData]);



  const [calculatedData, setCalculatedData] = useState(calculateDerivedData());



  useEffect(() => {

    setCalculatedData(calculateDerivedData());

  }, [calculateDerivedData]);












  // Field type definitions - use imported utilities for income statement

  const inputFields = [

    'Revenue', 'CostOfRevenue', 'SGAExpense',

    'SellingAndMarketingExpense', 'GeneralAndAdministrativeExpense', 'ResearchAndDevelopment',
    'FulfillmentExpense', 'TechnologyExpense', 'OtherOperatingExpense',

    'DepreciationAmortization', 'OperatingLeaseCost', 'VariableLeaseCost', 'LeasesDiscountRate',

    'InterestExpense', 'InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment',

    'TaxProvision', 'NetIncomeNoncontrolling',

    // Balance Sheet Inputs
    'CashAndCashEquivalents', 'ShortTermInvestments', 'ReceivablesCurrent', 'Inventory', 'DeferredTaxAssetsCurrentBS', 'OtherAssetsCurrent',
    'PropertyPlantAndEquipmentNet', 'OperatingLeaseAssetsNoncurrent', 'FinanceLeaseAssetsNoncurrent', 'Goodwill', 'DeferredIncomeTaxAssetsNoncurrent', 'OtherAssetsNoncurrent', 'ReceivablesNoncurrent', 'VariableLeaseAssets',
    
    'AccountsPayableCurrent', 'EmployeeLiabilitiesCurrent', 'AccruedLiabilitiesCurrent', 'AccruedIncomeTaxesCurrent', 'DeferredRevenueCurrent', 'LongTermDebtCurrent', 'OperatingLeaseLiabilitiesCurrent', 'FinanceLeaseLiabilitiesCurrent', 'OtherLiabilitiesCurrent',
    
    'LongTermDebtNoncurrent', 'OperatingLeaseLiabilitiesNoncurrent', 'FinanceLeaseLiabilitiesNoncurrent', 'DeferredIncomeTaxLiabilitiesNoncurrent', 'OtherLiabilitiesNoncurrent',
    
    'CommonStockEquity', 'PaidInCapitalCommonStock', 'AccumulatedOtherComprehensiveIncomeLossNetOfTax', 'RetainedEarningsAccumulated', 'NoncontrollingInterest', 'NoncontrollingInterests',
    
    'Debt', 'ForeignTaxCreditCarryForward', 'CapitalExpenditures', 'OperatingCash', 'ExcessCash'
  ];



  const calculatedFields = [

    'GrossIncome', 'OperatingExpense', 'OperatingIncome',

    'NetNonOperatingInterestIncome', 'PretaxIncome',

    'ProfitLossControlling', 'NetIncome'

  ];



  // Use imported calculation utilities for income statement, balance sheet, and NOPAT fields

  const isInputField = (field: string) => isIncomeInputField(field) || isBalanceSheetInputField(field) || isNOPATInputField(field) || isInvestedCapitalInputField(field) || isPPEChangesInputField(field) || isROICInputField(field) || isFinancingHealthInputField(field) || isFreeCashFlowInputField(field) || inputFields.includes(field);

  const isCalculatedField = (field: string) => {

    // Explicitly ensure these fields ARE calculated - they are read-only

    const alwaysCalculatedFields = [

      'GrossIncome', 'OperatingExpense', 'OperatingIncome',

      'NetNonOperatingInterestIncome', 'PretaxIncome',

      'ProfitLossControlling', 'NetIncome'

    ];

    if (alwaysCalculatedFields.includes(field)) {

      return true;

    }

    

    // Explicitly ensure these fields are NOT calculated - they are user input fields

    const alwaysInputFields = [

      'Revenue', 'CostOfRevenue', 'SGAExpense', 'DepreciationAmortization',
      'SellingAndMarketingExpense', 'GeneralAndAdministrativeExpense', 'ResearchAndDevelopment',
      'FulfillmentExpense', 'TechnologyExpense', 'OtherOperatingExpense',

      'OperatingLeaseCost', 'VariableLeaseCost', 'LeasesDiscountRate',

      'InterestExpense', 'InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment',

      'TaxProvision', 'NetIncomeNoncontrolling',

      // Balance Sheet Always Input
      'CashAndCashEquivalents', 'ShortTermInvestments', 'ReceivablesCurrent', 'Inventory', 'DeferredTaxAssetsCurrentBS', 'OtherAssetsCurrent',
      'PropertyPlantAndEquipmentNet', 'OperatingLeaseAssetsNoncurrent', 'FinanceLeaseAssetsNoncurrent', 'Goodwill', 'DeferredIncomeTaxAssetsNoncurrent', 'OtherAssetsNoncurrent', 'ReceivablesNoncurrent', 'VariableLeaseAssets',
      
      'AccountsPayableCurrent', 'EmployeeLiabilitiesCurrent', 'AccruedLiabilitiesCurrent', 'AccruedIncomeTaxesCurrent', 'DeferredRevenueCurrent', 'LongTermDebtCurrent', 'OperatingLeaseLiabilitiesCurrent', 'FinanceLeaseLiabilitiesCurrent', 'OtherLiabilitiesCurrent',
      
      'LongTermDebtNoncurrent', 'OperatingLeaseLiabilitiesNoncurrent', 'FinanceLeaseLiabilitiesNoncurrent', 'DeferredIncomeTaxLiabilitiesNoncurrent', 'OtherLiabilitiesNoncurrent',
      
      'CommonStockEquity', 'PaidInCapitalCommonStock', 'AccumulatedOtherComprehensiveIncomeLossNetOfTax', 'RetainedEarningsAccumulated', 'NoncontrollingInterest', 'NoncontrollingInterests',
      
      'Debt', 'ForeignTaxCreditCarryForward', 'CapitalExpenditures', 'OperatingCash', 'ExcessCash'
    ];

    if (alwaysInputFields.includes(field)) {

      return false;

    }

    return isIncomeCalculatedField(field) || isBalanceSheetCalculatedField(field) || isNOPATCalculatedField(field) || isInvestedCapitalCalculatedField(field) || isPPEChangesCalculatedField(field) || isROICCalculatedField(field) || isFinancingHealthCalculatedField(field) || isFreeCashFlowCalculatedField(field) || calculatedFields.includes(field);

  };



  const handleDataChange = (tableId: string, year: number, field: string, value: number | string) => {

    // Prevent user edits on calculated fields
    // For balance sheet, map display key to actual data key before checking
    const fieldToCheck = tableId === 'balanceSheet' ? mapBalanceSheetKey(field) : field;
    
    if ((tableId === 'incomeStatement' || tableId === 'balanceSheet' || tableId === 'nopat' || tableId === 'investedCapital' || tableId === 'ppeChanges' || tableId === 'roicPerformance' || tableId === 'financingHealth' || tableId === 'freeCashFlow') && isCalculatedField(fieldToCheck)) {

      return;

    }



    // Update local state immediately with the new value
    // For balance sheet, map display key to actual data key before storing
    const storageField = tableId === 'balanceSheet' ? mapBalanceSheetKey(field) : field;
    let computedUpdatedData: any = null;
    setAllData(prev => {

      const updatedData = {

      ...prev,

      [tableId]: {

        ...prev[tableId],

        [year]: {

          ...(prev[tableId] && prev[tableId][year] ? prev[tableId][year] : {}),

          [storageField]: value

        }

      }

      };



      // For income statement fields, calculate dependent fields immediately

      if (tableId === 'incomeStatement' && isInputField(field)) {

        try {

          // Calculate dependent fields using our client-side utilities

          const calculatedValues = calculateDependentFields(updatedData.incomeStatement as any, year, field);

          

          // Update the data with calculated values

          updatedData.incomeStatement = {

            ...updatedData.incomeStatement,

            [year]: {

              ...(updatedData.incomeStatement?.[year] || {}),

              ...calculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating income statement dependent fields:', error);

        }

      }



      // For balance sheet fields, calculate dependent fields immediately

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        // Map display key to actual data key for balance sheet fields
        // BalanceSheetTable uses display keys (like 'Receivables', 'Assets') but 
        // calculation functions expect actual data keys (like 'ReceivablesCurrent', calculated 'Assets')
        const mappedField = mapBalanceSheetKey(field);

        // Check if the mapped field is an input field
        if (isInputField(mappedField)) {
          try {

            // Calculate dependent fields using our client-side utilities
            // Use the mapped field name for calculations

            const calculatedValues = calculateBalanceSheetDependentFields(updatedData.balanceSheet as any, year, mappedField);

            // Update the data with calculated values

            updatedData.balanceSheet = {

              ...updatedData.balanceSheet,

              [year]: {

                ...(updatedData.balanceSheet?.[year] || {}),

                ...calculatedValues

              }

            };

          } catch (error) {

            console.error('Error calculating balance sheet dependent fields:', error);

          }

        }

      }



      // For income statement changes, recalculate NOPAT fields automatically

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          // Calculate all NOPAT fields when income statement changes

          const nopatCalculatedValues = calculateAllNOPATFields(

            updatedData.nopat as any,

            year,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any,

            updatedData.incomeStatement as any

          );

          

          // Update NOPAT data with calculated values

          updatedData.nopat = {

            ...updatedData.nopat,

            [year]: {

              ...(updatedData.nopat?.[year] || {}),

              ...nopatCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating NOPAT fields from income statement changes:', error);

        }

      }



      // For invested capital fields, calculate dependent fields immediately

      if (tableId === 'investedCapital' && isInputField(field) && year >= 2025 && year <= 2035) {

        try {

          const calculatedValues = calculateInvestedCapitalDependentFields(

            updatedData.investedCapital as any,

            year,

            field,

            updatedData.balanceSheet as any,

            updatedData.incomeStatement as any

          );

          

          updatedData.investedCapital = {

            ...updatedData.investedCapital,

            [year]: {

              ...(updatedData.investedCapital?.[year] || {}),

              ...calculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating invested capital dependent fields:', error);

        }

      }



      // For balance sheet changes, recalculate invested capital fields automatically

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        try {

          // Only calculate if we have prior year data (needed for YoY changes)

          if (updatedData.balanceSheet && updatedData.balanceSheet[year - 1]) {

            // Calculate all invested capital fields when balance sheet changes

            const investedCapitalCalculatedValues = calculateAllInvestedCapitalFields(

              updatedData.investedCapital as any,

              year,

              updatedData.balanceSheet as any,

              updatedData.incomeStatement as any

            );

            

            // Update invested capital data with calculated values

            updatedData.investedCapital = {

              ...updatedData.investedCapital,

              [year]: {

                ...(updatedData.investedCapital?.[year] || {}),

                ...investedCapitalCalculatedValues

              }

            };



            // Also recalculate PPE Changes when balance sheet changes

            const ppeChangesCalculatedValues = calculateAllPPEChangesFields(

              updatedData.ppeChanges as any,

              year,

              updatedData.balanceSheet as any,

              updatedData.incomeStatement as any

            );

            

            updatedData.ppeChanges = {

              ...updatedData.ppeChanges,

              [year]: {

                ...(updatedData.ppeChanges?.[year] || {}),

                ...ppeChangesCalculatedValues

              }

            };

          }

        } catch (error) {

          console.error('Error calculating invested capital fields from balance sheet changes:', error);

        }

      }



      // For income statement changes, also recalculate PPE Changes (for depreciation) and ROIC

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          // Calculate PPE Changes fields when income statement changes (affects depreciation)

          const ppeChangesCalculatedValues = calculateAllPPEChangesFields(

            updatedData.ppeChanges as any,

            year,

            updatedData.balanceSheet as any,

            updatedData.incomeStatement as any

          );

          

          updatedData.ppeChanges = {

            ...updatedData.ppeChanges,

            [year]: {

              ...(updatedData.ppeChanges?.[year] || {}),

              ...ppeChangesCalculatedValues

            }

          };



          // Calculate ROIC fields when income statement changes

          const roicCalculatedValues = calculateAllROICFields(

            updatedData.roicPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.roicPerformance = {

            ...updatedData.roicPerformance,

            [year]: {

              ...(updatedData.roicPerformance?.[year] || {}),

              ...roicCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating PPE Changes/ROIC fields from income statement changes:', error);

        }

      }



      // For invested capital changes, recalculate ROIC fields

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const roicCalculatedValues = calculateAllROICFields(

            updatedData.roicPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.roicPerformance = {

            ...updatedData.roicPerformance,

            [year]: {

              ...(updatedData.roicPerformance?.[year] || {}),

              ...roicCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating ROIC fields from invested capital changes:', error);

        }

      }



      // For NOPAT changes, recalculate ROIC and Financing Health fields

      if (tableId === 'nopat' && year >= 2025 && year <= 2035) {

        try {

          const roicCalculatedValues = calculateAllROICFields(

            updatedData.roicPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.roicPerformance = {

            ...updatedData.roicPerformance,

            [year]: {

              ...(updatedData.roicPerformance?.[year] || {}),

              ...roicCalculatedValues

            }

          };



          // Calculate Financing Health fields when NOPAT changes

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...(updatedData.financingHealth?.[year] || {}),

              ...financingHealthCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating ROIC/Financing Health fields from NOPAT changes:', error);

        }

      }



      // For income statement changes, also recalculate Financing Health fields

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...(updatedData.financingHealth?.[year] || {}),

              ...financingHealthCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Financing Health fields from income statement changes:', error);

        }

      }



      // For invested capital changes, recalculate Financing Health fields

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...(updatedData.financingHealth?.[year] || {}),

              ...financingHealthCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Financing Health fields from invested capital changes:', error);

        }

      }



      // For balance sheet changes, recalculate Financing Health and Free Cash Flow fields

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        try {

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...updatedData.financingHealth[year],

              ...financingHealthCalculatedValues

            }

          };



          // Calculate Free Cash Flow fields when balance sheet changes

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...updatedData.freeCashFlow[year],

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Financing Health/Free Cash Flow fields from balance sheet changes:', error);

        }

      }



      // For NOPAT changes, also recalculate Free Cash Flow fields

      if (tableId === 'nopat' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from NOPAT changes:', error);

        }

      }



      // For income statement changes, also recalculate Free Cash Flow fields

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from income statement changes:', error);

        }

      }



      // For invested capital changes, recalculate Free Cash Flow fields

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from invested capital changes:', error);

        }

      }



      // For PPE changes, recalculate Free Cash Flow fields

      if (tableId === 'ppeChanges' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from PPE changes:', error);

        }

      }



      // For income statement changes, recalculate Operational Performance fields

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

            updatedData.operationalPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.operationalPerformance = {

            ...updatedData.operationalPerformance,

            [year]: {

              ...(updatedData.operationalPerformance?.[year] || {}),

              ...operationalPerformanceCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Operational Performance fields from income statement changes:', error);

        }

      }



      // For balance sheet changes, recalculate Operational Performance fields

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        try {

          // Only calculate if we have all required prerequisite data

          if (updatedData.incomeStatement?.[year] && 

              updatedData.investedCapital?.[year] && 

              updatedData.nopat?.[year]) {

            const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

              updatedData.operationalPerformance as any,

              year,

              updatedData.incomeStatement as any,

              updatedData.balanceSheet as any,

              updatedData.investedCapital as any,

              updatedData.nopat as any

            );

            

            updatedData.operationalPerformance = {

              ...updatedData.operationalPerformance,

              [year]: {

                ...(updatedData.operationalPerformance?.[year] || {}),

                ...operationalPerformanceCalculatedValues

              }

            };

          }

        } catch (error) {

          console.error('Error calculating Operational Performance fields from balance sheet changes:', error);

        }

      }



      // For NOPAT changes, recalculate Operational Performance fields (ROIC metrics)

      if (tableId === 'nopat' && year >= 2025 && year <= 2035) {

        try {

          const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

            updatedData.operationalPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.operationalPerformance = {

            ...updatedData.operationalPerformance,

            [year]: {

              ...(updatedData.operationalPerformance?.[year] || {}),

              ...operationalPerformanceCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Operational Performance fields from NOPAT changes:', error);

        }

      }



      // For invested capital changes, recalculate Operational Performance fields (ROIC metrics)

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

            updatedData.operationalPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.operationalPerformance = {

            ...updatedData.operationalPerformance,

            [year]: {

              ...(updatedData.operationalPerformance?.[year] || {}),

              ...operationalPerformanceCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Operational Performance fields from invested capital changes:', error);

        }

      }

      computedUpdatedData = updatedData;
      return updatedData;

    });

    // Sync updated data to context for the selected company
    // Use setTimeout to ensure state update completes, then sync using computed data
    setTimeout(() => {
      if (computedUpdatedData) {
        // Sync the table that was changed
        if (computedUpdatedData[tableId]) {
          console.log(`Syncing ${tableId} for ${selectedCompany}, year ${year}, field ${field}:`, computedUpdatedData[tableId][year]);
          updateCompanyTableData(selectedCompany, tableId, computedUpdatedData[tableId]);
        }
        
        // Also sync dependent tables that may have been recalculated
        const dependentTables: { [key: string]: string[] } = {
          'incomeStatement': ['nopat', 'roicPerformance', 'financingHealth', 'freeCashFlow', 'operationalPerformance', 'ppeChanges'],
          'balanceSheet': ['investedCapital', 'ppeChanges', 'financingHealth', 'freeCashFlow'],
          'nopat': ['roicPerformance', 'financingHealth', 'freeCashFlow'],
          'investedCapital': ['roicPerformance', 'financingHealth', 'freeCashFlow'],
          'ppeChanges': ['freeCashFlow']
        };

        const tablesToSync = dependentTables[tableId] || [];
        tablesToSync.forEach(depTableId => {
          if (computedUpdatedData[depTableId]) {
            updateCompanyTableData(selectedCompany, depTableId, computedUpdatedData[depTableId]);
          }
        });
      }
    }, 0);

    // NOTE: Backend calculations are disabled in favor of client-side calculations above

    // to prevent race conditions that overwrite user input with stale data

    

    // // Trigger backend calculations for balance sheet input fields

    // if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

    //   // Call balance sheet dependent fields endpoint for any change

    //   recalculateBalanceSheetDependentFields(year, field, value);

    // }



    // // Optional: Also trigger backend calculation for validation/backup

    // if (tableId === 'incomeStatement' && isInputField(field) && year >= 2025 && year <= 2035) {

    //   // Trigger backend calculation in background for validation

    //   recalculateDependentFields(year, field, value);

    // }

  };



  const handleReset = async () => {
    // Reset context for the selected company
    resetCompanyData(selectedCompany);

    // Fetch income statement from API
    const incomeStatementData = await fetchIncomeStatementData(selectedCompany);

    // Reload static data for the selected company (without context merge since we just cleared it)
    if (selectedCompany === 'WMT') {
      setAllData({
        balanceSheet: walmartMockData.balanceSheet as TableData,
        ppeChanges: ppeChangesReal as TableData,
        freeCashFlow: walmartMockData.cashFlow as TableData,
        cashFlows: walmartMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: walmartMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: walmartMockData.balanceSheetCommonSize as TableData,
        nopat: walmartMockData.nopat as TableData,
        investedCapital: walmartMockData.investedCapital as TableData,
        roicPerformance: walmartMockData.roicPerformance as TableData,
        financingHealth: walmartMockData.financingHealth as TableData,
        operationalPerformance: walmartMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'BJ') {
      setAllData({
        balanceSheet: bjMockData.balanceSheet as TableData,
        ppeChanges: bjMockData.ppeChanges as TableData,
        freeCashFlow: bjMockData.freeCashFlow as TableData,
        cashFlows: bjMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: bjMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: bjMockData.balanceSheetCommonSize as TableData,
        nopat: bjMockData.nopat as TableData,
        investedCapital: bjMockData.investedCapital as TableData,
        roicPerformance: bjMockData.roicPerformance as TableData,
        financingHealth: bjMockData.financingHealth as TableData,
        operationalPerformance: bjMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'DG') {
      setAllData({
        balanceSheet: dgMockData.balanceSheet as TableData,
        ppeChanges: ppeChangesReal as TableData,
        freeCashFlow: dgMockData.cashFlow as TableData,
        cashFlows: dgMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: dgMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: dgMockData.balanceSheetCommonSize as TableData,
        nopat: dgMockData.nopat as TableData,
        investedCapital: dgMockData.investedCapital as TableData,
        roicPerformance: dgMockData.roicPerformance as TableData,
        financingHealth: dgMockData.financingHealth as TableData,
        operationalPerformance: dgMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'DLTR') {
      setAllData({
        balanceSheet: dltrMockData.balanceSheet as TableData,
        ppeChanges: dltrMockData.ppeChanges as TableData,
        freeCashFlow: dltrMockData.freeCashFlow as TableData,
        cashFlows: dltrMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: dltrMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: dltrMockData.balanceSheetCommonSize as TableData,
        nopat: dltrMockData.nopat as TableData,
        investedCapital: dltrMockData.investedCapital as TableData,
        roicPerformance: dltrMockData.roicPerformance as TableData,
        financingHealth: dltrMockData.financingHealth as TableData,
        operationalPerformance: dltrMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'TGT') {
      setAllData({
        balanceSheet: tgtMockData.balanceSheet as TableData,
        ppeChanges: tgtMockData.ppeChanges as TableData,
        freeCashFlow: tgtMockData.freeCashFlow as TableData,
        cashFlows: tgtMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: tgtMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: tgtMockData.balanceSheetCommonSize as TableData,
        nopat: tgtMockData.nopat as TableData,
        investedCapital: tgtMockData.investedCapital as TableData,
        roicPerformance: tgtMockData.roicPerformance as TableData,
        financingHealth: tgtMockData.financingHealth as TableData,
        operationalPerformance: tgtMockData.operationalPerformance as TableData
      });
    } else {
      // COST (default)
      setAllData({
        balanceSheet: balanceSheetReal,
        ppeChanges: ppeChangesReal,
        freeCashFlow: freeCashFlowReal,
        cashFlows: (cashFlowReal as unknown) as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: (incomeStatementCommonReal as unknown) as TableData,
        balanceSheetCommonSize: (balanceSheetCommonReal as unknown) as TableData,
        nopat: nopatReal,
        investedCapital: investedCapitalReal,
        roicPerformance: (roicReal as unknown) as TableData,
        financingHealth: (financeHealthReal as unknown) as TableData,
        operationalPerformance: (operationalPerformanceReal as unknown) as TableData
      });
    }

  };































  const getTableData = (configId: string) => {

    switch (configId) {

      case 'balanceSheet':

        return (allData as any).balanceSheet || {};

      case 'ppeChanges':

        return (allData as any).ppeChanges || {};

      case 'incomeStatement':

        return (allData as any).incomeStatement || {};

      case 'investedCapital':

        return (allData as any).investedCapital || {};

      case 'nopat':

        return (calculatedData as any).nopat || {};

      case 'freeCashFlow':

        return (allData as any).freeCashFlow || {};

      case 'incomeStatementCommonSize':

        return (allData as any).incomeStatementCommonSize || {};

      case 'balanceSheetCommonSize':

        return (allData as any).balanceSheetCommonSize || {};

      case 'roicPerformance':

        return (allData as any).roicPerformance || {};

      case 'financingHealth':

        return (allData as any).financingHealth || {};

      default:

        return {};

    }

  };



  return (

    <div className="bg-white dark:bg-[#0B0F0E] rounded-lg w-full min-h-full flex flex-col">

      {/* Header */}

      <div className="bg-white dark:bg-[#0B0F0E] border-b dark:border-[#161C1A] flex-shrink-0">

        <div className="px-4 py-4">

          <div className="flex justify-between items-center">

            <div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E0E6E4]">Company Valuation & Analysis</h1>

              <p className="text-gray-600 dark:text-[#889691] mt-1">Interactive financial modeling and valuation</p>

            </div>



            <div className="flex items-center gap-4">

              {/* Company Selector */}

              <div className="flex items-center gap-2">

                <label className="text-sm font-medium text-gray-700 dark:text-[#E0E6E4]">Company:</label>

                <div className="relative" ref={companyDropdownRef}>
                  <input
                    type="text"
                    value={
                      showCompanyDropdown || companyInput
                        ? companyInput
                        : (availableCompanies.find(c => c.ticker === selectedCompany)?.display_name || 
                           availableCompanies.find(c => c.ticker === selectedCompany)?.name || 
                           selectedCompany)
                    }
                    onChange={(e) => {
                      setCompanyInput(e.target.value);
                      setShowCompanyDropdown(true);
                    }}
                    onFocus={() => {
                      setShowCompanyDropdown(true);
                      setCompanyInput('');
                    }}
                    placeholder={companiesLoading ? "Loading..." : "Select company..."}
                    className="px-3 py-2 pr-8 border border-gray-300 dark:border-[#161C1A] rounded-lg bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] placeholder-gray-400 dark:placeholder-[#889691] focus:outline-none focus:ring-2 focus:ring-[#144D37] min-w-[200px]"
                    disabled={companiesLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400 dark:text-[#889691]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {showCompanyDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-[50vh] overflow-auto">
                      {companiesLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">Loading companies...</div>
                      ) : availableCompanies.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No companies available</div>
                      ) : (
                        availableCompanies
                          .filter(company => 
                            !companyInput || 
                            company.ticker.toLowerCase().includes(companyInput.toLowerCase()) ||
                            company.name.toLowerCase().includes(companyInput.toLowerCase()) ||
                            (company.display_name && company.display_name.toLowerCase().includes(companyInput.toLowerCase()))
                          )
                          .map(company => (
                            <div
                              key={company.ticker}
                              onClick={() => {
                                setSelectedCompany(company.ticker);
                                setCompanyInput('');
                                setShowCompanyDropdown(false);
                                onCompanyChange?.(company.ticker);
                              }}
                              className={`px-3 py-2 text-sm text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] cursor-pointer ${
                                selectedCompany === company.ticker ? 'bg-blue-50 dark:bg-[#144D37]/30' : ''
                              }`}
                            >
                              {company.display_name || company.name} ({company.ticker})
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>

              </div>



              {/* Reset Button */}

              <button

                onClick={handleReset}

                className="px-3 py-2 bg-[#144D37] text-white rounded-lg hover:bg-[#0F3A28] transition-colors flex items-center gap-2"

              >

                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />

                </svg>

                Reset

              </button>












              {/* Minimize Button */}

              {onClose && (

                <button

                  onClick={onClose}

                  className="px-3 py-2 bg-gray-600 dark:bg-[#161C1A] text-white dark:text-[#E0E6E4] rounded-lg hover:bg-gray-700 dark:hover:bg-[#1C2220] transition-colors flex items-center gap-2"

                >

                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />

                  </svg>

                  Minimize

                </button>

              )}

            </div>

          </div>

        </div>

      </div>



      {/* Content */}

      <div className="px-4 py-6">

        {/* Summary Section */}

        <div className="mb-8 p-6 bg-white dark:bg-[#0B0F0E] rounded-lg shadow-sm border dark:border-[#161C1A]">

          <h3 className="text-xl font-semibold text-gray-800 dark:text-[#E0E6E4] mb-4">Valuation Summary</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">

            <div className="p-4 bg-blue-50 dark:bg-[#161C1A] rounded-lg">

              <h4 className="font-medium text-blue-800 dark:text-[#889691] text-sm mb-2">Equity Value</h4>

              <p className="text-2xl font-bold text-blue-900 dark:text-[#E0E6E4]">

                ${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(

                  (calculatedData.freeCashFlow?.[2025]?.FreeCashFlow as number) || 0

                )}

              </p>

            </div>

            <div className="p-4 bg-green-50 dark:bg-[#161C1A] rounded-lg">

              <h4 className="font-medium text-green-800 dark:text-[#889691] text-sm mb-2">Market Cap</h4>

              <p className="text-2xl font-bold text-green-900 dark:text-[#E0E6E4]">

                ${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(

                  (calculatedData.nopat?.[2025]?.NOPAT as number) || 0

                )}

              </p>

            </div>

            <div className="p-4 bg-purple-50 dark:bg-[#161C1A] rounded-lg">

              <h4 className="font-medium text-purple-800 dark:text-[#889691] text-sm mb-2">ROIC</h4>

              <p className="text-2xl font-bold text-purple-900 dark:text-[#E0E6E4]">

                {((calculatedData.roicPerformance?.[2024]?.ROIC as number) || 0).toFixed(1)}%

              </p>

            </div>

            <div className="p-4 bg-orange-50 dark:bg-[#161C1A] rounded-lg">

              <h4 className="font-medium text-orange-800 dark:text-[#889691] text-sm mb-2">Earnings Yield</h4>

              <p className="text-2xl font-bold text-orange-900 dark:text-[#E0E6E4]">

                {((calculatedData.nopat?.[2024]?.NOPAT as number) || 0).toFixed(1)}%

              </p>

            </div>

            <div className="p-4 bg-teal-50 dark:bg-[#161C1A] rounded-lg">

              <h4 className="font-medium text-teal-800 dark:text-[#889691] text-sm mb-2">Margin of Safety</h4>

              <p className="text-2xl font-bold text-teal-900 dark:text-[#E0E6E4]">

                {((calculatedData.investedCapital?.[2025]?.TotalInvestedCapital as number) || 0).toFixed(1)}%

              </p>

            </div>

          </div>

        </div>



        {/* Tables with Individual Tabs */}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <div className="space-y-2">

            {/* First Row of Tabs */}

            <TabsList className="grid w-full grid-cols-3 gap-1">

              <TabsTrigger value="investedCapital" className="text-xs px-2 py-1">capital</TabsTrigger>

              <TabsTrigger value="cashFlow" className="text-xs px-2 py-1">Free Cash Flow</TabsTrigger>

              <TabsTrigger value="forecastedStatements" className="text-xs px-2 py-1">ForecastedStatements</TabsTrigger>

            </TabsList>

          </div>

          {/* Income Statement content */}

          <TabsContent value="incomeStatement" className="mt-6">
            {!hasIncomeStatementData && (
               <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400 dark:text-yellow-500">⚠</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        No income statement data available for {selectedCompany}. The API returned no historical records.
                      </p>
                    </div>
                  </div>
                </div>
            )}

            <IncomeStatementTable 

              data={allData.incomeStatement || {}} 

              onDataChange={handleDataChange}

              isInputField={isInputField}

              isCalculatedField={isCalculatedField}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* Balance Sheet content */}

          <TabsContent value="balanceSheet" className="mt-6">

            <BalanceSheetTable 

              data={allData.balanceSheet || {}} 

              onDataChange={handleDataChange}

              isCalculatedField={isBalanceSheetCalculatedField}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* NoPAT content */}

          <TabsContent value="nopat" className="mt-6">

            <NoPATTable 

              data={allData.nopat || {}} 

              onDataChange={handleDataChange}

              isInputField={isNOPATInputField}

              isCalculatedField={isNOPATCalculatedField}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* Cash Flows content */}

          <TabsContent value="ppeChanges" className="mt-6">

            <CashFlowsTable 

              data={allData.cashFlows || {}} 

              onDataChange={handleDataChange}

              isCalculatedField={() => false}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* Invested Capital content */}

          <TabsContent value="investedCapital" className="mt-6">

            <InvestedCapitalTable 

              data={allData.investedCapital || {}} 

              onDataChange={handleDataChange}

              isInputField={isInvestedCapitalInputField}

              isCalculatedField={isInvestedCapitalCalculatedField}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* Free Cash Flow content */}

          <TabsContent value="cashFlow" className="mt-6">

            <FreeCashFlowTable 

              data={allData.freeCashFlow || {}} 

              onDataChange={handleDataChange}

              isInputField={isFreeCashFlowInputField}

              isCalculatedField={isFreeCashFlowCalculatedField}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* Income Statement Common Size content */}

          <TabsContent value="incomeStatementCommonSize" className="mt-6">

            <IncomeStatementCommonSizeTable 

              data={allData.incomeStatementCommonSize || {}} 

              onDataChange={handleDataChange}

              isInputField={(_field: string) => false}

              isCalculatedField={(_field: string) => true}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* Balance Sheet Common Size content */}

          <TabsContent value="balanceSheetCommonSize" className="mt-6">

            <BalanceSheetCommonSizeTable 

              data={allData.balanceSheetCommonSize || {}} 

              onDataChange={handleDataChange}

              isInputField={(_field: string) => false}

              isCalculatedField={(_field: string) => true}

              companyTicker={selectedCompany}

            />

          </TabsContent>

          {/* ROIC Performance content */}

          <TabsContent value="roicPerformance" className="mt-6">

            <ROICPerformanceTable 

              data={allData.roicPerformance || {}} 

              onDataChange={handleDataChange}

              isInputField={isROICInputField}

              isCalculatedField={isROICCalculatedField}

            />

          </TabsContent>

          {/* Financing Health content */}

          <TabsContent value="financingHealth" className="mt-6">

            <FinancingHealthTable 

              data={allData.financingHealth || {}} 

              onDataChange={handleDataChange}

              isInputField={isFinancingHealthInputField}

              isCalculatedField={isFinancingHealthCalculatedField}

            />

          </TabsContent>

          {/* Operational Performance content */}

          <TabsContent value="operationalPerformance" className="mt-6">

            <OperationalPerformanceTable 

              data={allData.operationalPerformance || {}} 

              onDataChange={handleDataChange}

              isInputField={(_field: string) => false}

              isCalculatedField={(_field: string) => true}

            />

          </TabsContent>

          {/* Other tables except balance sheet, nopat, ppeChanges, investedCapital, cashFlow, incomeStatementCommonSize, balanceSheetCommonSize, roicPerformance, and financingHealth */}

          {tableConfigs

            .filter(cfg => cfg.id !== 'incomeStatement' && cfg.id !== 'balanceSheet' && cfg.id !== 'nopat' && cfg.id !== 'ppeChanges' && cfg.id !== 'investedCapital' && cfg.id !== 'cashFlow' && cfg.id !== 'incomeStatementCommonSize' && cfg.id !== 'balanceSheetCommonSize' && cfg.id !== 'roicPerformance' && cfg.id !== 'financingHealth')

            .map(config => (

            <TabsContent key={config.id} value={config.id} className="mt-6">

              <EditableTable

                title={config.title}

                data={getTableData(config.id)}

                isEditable={config.isEditable}

                onDataChange={handleDataChange}

                tableId={config.id}

                  useHierarchicalStructure={false}

              />

            </TabsContent>

          ))}

        </Tabs>

        {/* Info Box */}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">

          <div className="flex items-start gap-3">

            <svg className="w-5 h-5 text-gray-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

            </svg>

            <div>

              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Excel-like Functionality</h3>

              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">

                <strong>Historical data (2024 and earlier):</strong> Protected and cannot be edited (gray background). <br/>

                <strong>Forecasted years (2025+):</strong> Input tables are editable (green background), calculated tables remain read-only (blue background). <br/>

                Changes will automatically update linked calculations across all tables.

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default ValuationPage;


