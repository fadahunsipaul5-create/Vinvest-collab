import React, { useEffect, useRef, useState } from 'react';

import { formatMonetaryValue } from '../../utils/formatMonetary';
import { renderForecastReadonlyDisplay, renderForecastReadonlyInput } from '../../utils/forecastDisplay';

interface CellData {
  [key: string]: number | string;
}

interface TableData {
  [year: number]: CellData;
}


const IncomeStatementTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string,

  forecastDriverValues?: any

}> = ({ data, onDataChange, isInputField, isCalculatedField, companyTicker = 'COST', forecastDriverValues }) => {

  // Track raw input strings while user is typing (for natural number entry)
  const [editingInputs, setEditingInputs] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hoveredBreakdown, setHoveredBreakdown] = useState<string | null>(null);
  const [hoveredForecastDriverValue, setHoveredForecastDriverValue] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Fields that should be editable for forecast years (2025–2035), regardless of calculated/input classification
  // NOTE: Some display labels map to different internal keys (e.g., CommonStock -> CommonStockEquity)
  const forceEditableForecastFieldKeys = new Set<string>([
    'RevenueGrowthRate',
    'GoodwillImpairment',
    'AssetImpairmentCharge',
    'UnrealizedGainOnInvestments',
    'OtherNoncashChanges',
    'CommonStockRepurchasePayment',
    'CommonStockEquity', // label: CommonStock
    'AccumulatedOtherComprehensiveIncomeLossNetOfTax', // label: AccumulatedOtherIncome
    'NoncontrollingInterests', // label: EquityInNoncontrollingInterests
    'MinBalanceOfShortTermDebtInclPaper',
  ]);

  // Hover tooltip text for breakdown rows (from provided images)
  const breakdownTooltips: Record<string, string> = {
    RevenueGrowthRate: 'User Input:',
    Revenue: 'Forecasted: (1 + RevenueGrowthRate/100) * PrioryearRevenue',
    CostOfRevenue: 'Calculated: Revenue - GrossMargin',
    GrossMargin: 'Forecasted: GrossMarginAsPercentOfRevenue * Revenue',
    SellingGeneralAndAdministration: 'Forecasted: SGAAsPercentOfRevenue * Revenue',
    Depreciation: 'Forecasted: DepreciationAsPercentOfLastYearPPE * Revenue',
    IntangibleAssetAmortization: 'Forecasted: AmortizationAsPercentOfRevenue * Revenue',
    DepreciationAndIntangibleAssetAmortization: 'Calculated: Depreciation + Amortization',
    OperatingLeaseAmortization: 'Calculated: OperatingLeaseCost - OperatingLeaseInterestExpense',
    FinanceLeaseAmortization:
      'Forecasted: (PrioryearFinanceLeaseLiabilitiesCurrent + PrioryearFinanceLeaseLiabilitiesNoncurrent) / FinanceLeaseTerm',
    VariableLeaseAmortization: 'Calculated: VariableLeaseCost - VariableLeaseInterestExpense',
    LeaseAmortization:
      'Calculated: OperatingLeaseInterestExpense + OperatingLeaseAmortization + FinanceLeaseAmortization + VariableLeaseAmortization',
    ResearchAndDevelopment: 'Forecasted: ResearchAndDevelopmentAsPercentOfRevenue * Revenue',
    GoodwillImpairment: 'User Input: Default forecast is PrioryearGoodwill',
    OtherOperatingExpense: 'Forecasted: OtherOperatingExpenseAsPercentOfRevenue * Revenue',
    OperatingExpenses:
      'Calculated: SellingGeneralAndAdministration + DepreciationAndAmortization + LeaseExpenses + ResearchAndDevelopment + GoodwillImpairment + OtherOperatingExpense',
    VariableLeaseCost: 'Forecasted: VariableLeaseCostAsPercentOfRevenue * Revenue',
    OperatingExpensesAdjusted: 'Calculated: OperatingExpenses - VariableLeaseCost',
    OperatingIncome: 'Calculated: GrossMargin - OperatingExpensesAdjusted',
    InterestExpenseDebt: 'Forecasted: InterestRateOnDebt * PrioryearDebt',
    OperatingLeaseInterestExpense:
      'Forecasted: OperatingLeaseDiscountRate * (PrioryearOperatingLeaseLiabilitiesCurrent + PrioryearOperatingLeaseLiabilitiesNoncurrent)',
    FinanceLeaseInterestExpense:
      'Forecasted: FinanceLeaseDiscountRate * (PrioryearFinanceLeaseLiabilitiesCurrent + FinanceLeaseLiabilitiesNoncurrent)',
    VariableLeaseInterestExpense:
      'Forecasted: VariableLeaseDiscountRate * (PrioryearOperatingLeaseLiabilitiesCurrent + PrioryearOperatingLeaseLiabilitiesNoncurrent)',
    InterestExpense: 'Calculated: InterestExpenseDebt + FinanceLeaseInterestExpense + VariableLeaseInterestExpense',
    InterestIncome: 'Forecasted: InterestIncomeAsPercentOfPriorYearExcessCash * PrioryearExcessCash',
    InterestExpenseIncomeNet: 'Calculated: InterestIncome - InterestExpense',
    OtherNonoperatingIncome: 'Forecasted: OtherNonoperatingIncomeAsPercentOfRevenue * Revenue',
    NonoperatingIncomeNet: 'Calculated: InterestExpenseIncomeNet + OtherNonoperatingIncome',
    PretaxIncome: 'Calculated: OperatingIncome + NonoperatingIncomeNet',
    TaxProvision: 'Forecasted: TaxProvisionAsPercentOfPretaxIncome * PretaxIncome',
    NetIncomeControlling: 'Calculated: PretaxIncome - TaxProvision',
    NetIncomeNoncontrolling: 'Forecasted: NetIncomeNoncontrollingAsPercentOfRevenue * Revenue',
    NetIncome: 'Calculated: NetIncomeControlling + NetIncomeNoncontrolling',
    AssetImpairmentCharge: 'User Input: None or Assumed 0',
    UnrealizedGainOnInvestments: 'User Input: None or Assumed 0',
    OtherNoncashChanges: 'User Input: None or Assumed 0',
    StockBasedCompensation: 'Forecasted: ShareBasedCompensationAsPercentOfRevenue * Revenue',
    CommonStockDividendPayment: 'Forecasted: CommonStockDividendPaymentAsPercentOfNetIncome * NetIncome',
    CommonStockRepurchasePayment: 'User Input: Assumed Average of Last 4 Years',
    EBIT: 'Referenced: OperatingIncome',
    EBITA:
      'Calculated: OperatingIncome + Amortization + FinanceLeaseAmortization + VariableLeaseAmortization',
    EBITDA: 'Calculated: EBITA + Depreciation',
    TaxOperating: 'Forecasted: MarginalTaxRate * EBIT',
    NetOperatingProfitAfterTaxes: 'Calculated: EBIT - TaxOperating',
    OperatingLeaseCost: 'Forecasted: OperatingLeaseCostAsPercentOfRevenue * Revenue',
    CapitalExpenditures: 'Forecasted: CapitalExpendituresAsPercentOfRevenue * Revenue',
    UnexplainedChangesInPPE: 'Forecasted: No unexplained changes to PPE',
    CashAndCashEquivalents: 'Calculated: PrioryearCashAndCashEquivalents + NetCashFlow',

    ReceivablesCurrent: 'Forecasted: ReceivablesCurrentAsPercentOfRevenue * Revenue',
    Inventory: 'Forecasted: InventoryAsPercentOfRevenue * Revenue',
    PrepaidExpense: 'Forecasted: PrepaidExpenseAsPercentOfRevenue * Revenue',
    OtherAssetsCurrent: 'Forecasted: OtherAssetsCurrentAsPercentOfRevenue * Revenue',
    OtherAssetsNoncurrent: 'Forecasted: OtherAssetsNoncurrentAsPercentOfRevenue * Revenue',
    AccountsPayableCurrent: 'Forecasted: AccountsPayableCurrentAsPercentOfRevenue * Revenue',
    EmployeeAccruedLiabilitiesCurrent: 'Forecasted: EmployeeLiabilitiesCurrentAsPercentOfRevenue * Revenue',
    AccruedLiabilitiesCurrent: 'Forecasted: AccruedLiabilitiesCurrentAsPercentOfRevenue * Revenue',
    AccruedIncomeTaxesCurrent: 'Forecasted: AccruedIncomeTaxesCurrentAsPercentOfPretaxIncome * PretaxIncome',
    DeferredRevenueCurrent: 'Forecasted: DeferredRevenueCurrentAsPercentOfRevenue * Revenue',
    LongTermDebtCurrent: 'Forecasted: LongTermDebtCurrentAsPercentOfRevenue * Revenue',
    VariableLeaseLiabilitiesCurrent: 'Forecasted: VariableLeaseAssets * VariableLeaseCurrentVsTotalLiability',
    OtherLiabilitiesCurrent: 'Forecasted: OtherLiabilitiesCurrentAsPercentOfRevenue * Revenue',
    LongTermDebtNoncurrent: 'Forecasted: LongTermDebtNoncurrentAsPercentOfRevenue * Revenue',
    DeferredIncomeTaxLiabilitiesNet: 'Forecasted: DeferredIncomeTaxLiabilitiesNetAsPercentOfTaxProvision * TaxProvision',
    OtherLiabilitiesNoncurrent: 'Forecasted: OtherLiabilitiesNoncurrentAsPercentOfRevenue * Revenue',
    OperatingCash: 'Forecasted: OperatingCashAsPercentOfRevenue * Revenue',
    OperatingLeaseNewAssetsObtained: 'Forecasted: OperatingLeaseIntensity * Revenue',
    FinanceLeaseNewAssetsObtained: 'Forecasted: FinanceLeaseIntensity * Revenue',
  };

  // Log when forecast driver values change
  useEffect(() => {
    if (forecastDriverValues) {
      console.log(`[IncomeStatementTable] Received forecast driver values for ${companyTicker}:`, {
        GrossMarginAsPercentOfRevenue: forecastDriverValues.GrossMarginAsPercentOfRevenue,
        SGAAsPercentOfRevenue: forecastDriverValues.SGAAsPercentOfRevenue,
        DepreciationAsPercentOfLastYearPPE: forecastDriverValues.DepreciationAsPercentOfLastYearPPE
      });
    }
  }, [forecastDriverValues, companyTicker]);

  // Helper function to get forecast driver value from API data
  const getForecastDriverValue = (breakdownField: string): string => {
    if (!forecastDriverValues) {
      console.log(`[IncomeStatementTable] No forecast driver values available for ${breakdownField}`);
      return '-';
    }
    
    // Map breakdown field names to API field names (from ValuationForecastDriverValues endpoint)
    const fieldMapping: Record<string, string> = {
      'RevenueGrowthRate': 'RevenueGrowthInLast4y',
      'GrossMargin': 'GrossMarginAsPercentOfRevenue',
      'SellingGeneralAndAdministration': 'SGAAsPercentOfRevenue',
      'Depreciation': 'DepreciationAsPercentOfLastYearPPE',
      'IntangibleAssetAmortization': 'IntangibleAssetAmortizationAsPercentOfRevenue',
      'FinanceLeaseAmortization': 'FinanceLeaseTerm',
      'VariableLeaseCost': 'VariableLeaseCostAsPercentOfRevenue',
      'InterestIncome': 'InterestIncomeAsPercentOfPriorYearExcessCash',
      'OtherNonoperatingIncome': 'OtherNonoperatingIncomeAsPercentOfRevenue',
      'TaxProvision': 'TaxProvisionAsPercentOfPretaxIncome',
      'NetIncomeNoncontrolling': 'NetIncomeNoncontrollingAsPercentOfRevenue',
      'StockBasedCompensation': 'StockBasedCompensationAsPercentOfRevenue',
      'CommonStockDividendPayment': 'CommonStockDividendPaymentAsPercentOfNetIncome',
      'CommonStockRepurchasePayment': 'CommonStockRepurchasePayment',
      'OperatingLeaseCost': 'OperatingLeaseCostAsPercentOfRevenue',
      'CapitalExpenditures': 'CapitalExpendituresAsPercentOfRevenue',
      'ReceivablesCurrent': 'ReceivablesCurrentAsPercentOfRevenue',
      'Inventory': 'InventoryAsPercentOfRevenue',
      'PrepaidExpense': 'PrepaidExpenseAsPercentOfRevenue',
      'OtherAssetsCurrent': 'OtherAssetsCurrentAsPercentOfRevenue',
      'OtherLiabilitiesCurrent': 'OtherLiabilitiesCurrentAsPercentOfRevenue',
      'LongTermDebtNoncurrent': 'LongTermDebtNoncurrentAsPercentOfRevenue',
      'OtherLiabilitiesNoncurrent': 'OtherLiabilitiesNoncurrentAsPercentOfRevenue',
      'OperatingCash': 'OperatingCashAsPercentOfRevenue',
      'OperatingLeaseNewAssetsObtained': 'OperatingLeaseIntensity',
      'FinanceLeaseNewAssetsObtained': 'FinanceLeaseIntensity',
    };
    
    const apiFieldName = fieldMapping[breakdownField];
    if (!apiFieldName || forecastDriverValues[apiFieldName] === undefined || forecastDriverValues[apiFieldName] === null) {
      return '-';
    }
    
    // Format as percentage (API returns decimal, e.g., 0.03 -> 3%)
    const value = forecastDriverValues[apiFieldName];
    if (typeof value === 'number') {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    return '-';
  };

  // Hover tooltip text for the ForecastDriverValue column (only for breakdowns shown in the screenshot)
  const forecastDriverValueTooltips: Record<string, string> = {
    Revenue: 'RevenueGrowthRate\nSee row name: Input year-over-year RevenueGrowthRate line item above',
    GrossMargin: 'GrossMarginAsPercentOfRevenue',
    SellingGeneralAndAdministration: 'SGAAsPercentOfRevenue',
    Depreciation: 'DepreciationAsPercentOfLastYearPPE',
    IntangibleAssetAmortization: 'AmortizationAsPercentOfRevenue',
    FinanceLeaseAmortization: 'FinanceLeaseTerm',
    GoodwillImpairment: 'NONE',
    VariableLeaseCost: 'VariableLeaseCostAsPercentOfRevenue',
    InterestExpenseDebt: 'InterestRateOnDebt',
    OperatingLeaseInterestExpense: 'OperatingLeaseDiscountRate',
    FinanceLeaseInterestExpense: 'FinanceLeaseDiscountRate',
    VariableLeaseInterestExpense: 'VariableLeaseDiscountRate',
    InterestIncome: 'InterestIncomeAsPercentOfPriorYearExcessCash',
    OtherNonoperatingIncome: 'OtherNonoperatingIncomeAsPercentOfRevenue',
    TaxProvision: 'TaxProvisionAsPercentOfPretaxIncome',
    NetIncomeNoncontrolling: 'NetIncomeNoncontrollingAsPercentOfRevenue',
    StockBasedCompensation: 'ShareBasedCompensationAsPercentOfRevenue',
    CommonStockDividendPayment: 'CommonStockDividendPaymentAsPercentOfNetIncome',
    CommonStockRepurchasePayment: 'Can input year-over-year value directly',
    TaxOperating: 'MarginalTaxRate',
    OperatingLeaseCost: 'OperatingLeaseCostAsPercentOfRevenue',
    CapitalExpenditures: 'CapitalExpendituresAsPercentOfRevenue',
    ReceivablesCurrent: 'ReceivablesCurrentAsPercentOfRevenue',
    Inventory: 'InventoryAsPercentOfRevenue',
    PrepaidExpense: 'PrepaidExpenseAsPercentOfRevenue',
    OtherAssetsCurrent: 'OtherAssetsCurrentAsPercentOfRevenue',
    VariableLeaseLiabilitiesCurrent: 'VariableLeaseCurrentVsTotalLiability',
    OtherLiabilitiesCurrent: 'OtherLiabilitiesCurrentAsPercentOfRevenue',
    LongTermDebtNoncurrent: 'LongTermDebtNoncurrentAsPercentOfRevenue',
    DeferredIncomeTaxLiabilitiesNet: 'DeferredIncomeTaxLiabilitiesNetAsPercentOfTaxProvision',
    OtherLiabilitiesNoncurrent: 'OtherLiabilitiesNoncurrentAsPercentOfRevenue',
    OperatingCash: 'OperatingCashAsPercentOfRevenue',
    OperatingLeaseNewAssetsObtained:
      'OperatingLeaseIntensity, which is based on historical ratio of OperatingLeaseNewAssetsObtained / Revenue',
    FinanceLeaseNewAssetsObtained:
      'FinanceLeaseIntensity, which is based on historical ratio of FinanceLeaseNewAssetsObtained / Revenue',
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);



  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const incomeYears: (string | number)[] = Array.from({ length: 15 }, (_, i) => 2021 + i);



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

    const isForecastYear = typeof yk === 'number' && yk >= 2025 && yk <= 2035;
    const forceEditableForecast =
      editable && isForecastYear && forceEditableForecastFieldKeys.has(fieldKey);

    // IMPORTANT: For forecast years, ONLY the allowlisted fields are editable.
    // We intentionally ignore `isInputField` for 2025–2035 so no other fields become editable.
    const isInput = isForecastYear
      ? forceEditableForecast
      : (isInputField ? isInputField(fieldKey) : false);

    // If we're forcing editability, treat it as NOT calculated so it renders as an input.
    const isCalculated =
      (isCalculatedField ? isCalculatedField(fieldKey) : false) && !forceEditableForecast;

    

    // For years 2025-2035, show formatted values

    if (isForecastYear) {
      // Only allow editing for explicit allowlist fields
      if (forceEditableForecast) {

        // Different rendering for input vs calculated fields

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

  // NOTE: Average/CAGR helpers were unused in the current UI; removed to satisfy TS noUnusedLocals.
  return (

    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">

      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{companyTicker} Income Statement Expanded</h3>

              </div>

      {/* Breakdown hover tooltip */}
      {(hoveredForecastDriverValue || hoveredBreakdown) &&
        (forecastDriverValueTooltips[hoveredForecastDriverValue ?? ''] ||
          breakdownTooltips[hoveredBreakdown ?? '']) && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg pointer-events-none max-w-3xl whitespace-pre-line"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          {forecastDriverValueTooltips[hoveredForecastDriverValue ?? ''] ??
            breakdownTooltips[hoveredBreakdown ?? '']}
        </div>
      )}

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-gray-900 dark:text-gray-200">

          <thead>

            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">

              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-30 bg-gray-100 dark:bg-gray-700 border-r dark:border-gray-600 min-w-[250px]">

                Breakdown

              </th>

              {incomeYears.map(yk => (

                <th key={String(yk)} className="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[160px]">

                  {typeof yk === 'number' ? `${yk}` : 'TTM'}

                </th>

              ))}

              <th className="text-center px-4 py-3 font-medium text-gray-700 dark:text-gray-300 border-l dark:border-gray-600 min-w-[180px] bg-blue-50 dark:bg-blue-900/20">
                ForecastDriverValue
              </th>

            </tr>

          </thead>

          <tbody>

            {/* RevenueGrowthRate */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('RevenueGrowthRate');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>RevenueGrowthRate</td>
              {incomeYears.map(yk => (
                <td key={`RevenueGrowthRate-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'RevenueGrowthRate')}
                </td>
              ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <input
                  type="text"
                  placeholder=""
                  className="w-full px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </td>
            </tr>

            {/* Revenue */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Revenue');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Revenue</td>
              {incomeYears.map(yk => (
                <td key={`Revenue-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Revenue')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('Revenue');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">RevenueGrowthRate</span>
              </td>
            </tr>

            {/* CostOfRevenue */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CostOfRevenue');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CostOfRevenue</td>
              {incomeYears.map(yk => (
                <td key={`CostOfRevenue-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CostOfRevenue')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>



            {/* GrossMargin */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('GrossMargin');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>GrossMargin</td>
              {incomeYears.map(yk => (
                <td key={`GrossMargin-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'GrossMargin')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('GrossMargin');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">{getForecastDriverValue('GrossMargin')}</span>
              </td>
            </tr>

            {/* SellingGeneralAndAdministration */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('SellingGeneralAndAdministration');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>SellingGeneralAndAdministration</td>
              {incomeYears.map(yk => (
                <td key={`SellingGeneralAndAdministration-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'SGAExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('SellingGeneralAndAdministration');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">{getForecastDriverValue('SellingGeneralAndAdministration')}</span>
              </td>
            </tr>

            {/* Depreciation */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Depreciation');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Depreciation</td>
              {incomeYears.map(yk => (
                <td key={`Depreciation-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Depreciation')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('Depreciation');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">{getForecastDriverValue('Depreciation')}</span>
              </td>
            </tr>

            {/* IntangibleAssetAmortization */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IntangibleAssetAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IntangibleAssetAmortization</td>
              {incomeYears.map(yk => (
                <td key={`IntangibleAssetAmortization-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IntangibleAssetAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('IntangibleAssetAmortization');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DepreciationAndIntangibleAssetAmortization */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DepreciationAndIntangibleAssetAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DepreciationAndIntangibleAssetAmortization</td>
              {incomeYears.map(yk => (
                <td key={`DepreciationAndIntangibleAssetAmortization-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DepreciationAndIntangibleAssetAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingLeaseAmortization */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseAmortization</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseAmortization-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinanceLeaseAmortization */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseAmortization</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseAmortization-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceLeaseAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('FinanceLeaseAmortization');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.5</span>
              </td>
            </tr>

            {/* VariableLeaseAmortization */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseAmortization</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseAmortization-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* LeaseAmortization */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LeaseAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LeaseAmortization</td>
              {incomeYears.map(yk => (
                <td key={`LeaseAmortization-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LeaseAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* ResearchAndDevelopment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('ResearchAndDevelopment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>ResearchAndDevelopment</td>
              {incomeYears.map(yk => (
                <td key={`ResearchAndDevelopment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ResearchAndDevelopment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* GoodwillImpairment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('GoodwillImpairment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>GoodwillImpairment</td>
              {incomeYears.map(yk => (
                <td key={`GoodwillImpairment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'GoodwillImpairment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('GoodwillImpairment');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0</span>
              </td>
            </tr>

            {/* OtherOperatingExpense */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherOperatingExpense');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherOperatingExpense</td>
              {incomeYears.map(yk => (
                <td key={`OtherOperatingExpense-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherOperatingExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingExpenses */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingExpenses');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingExpenses</td>
              {incomeYears.map(yk => (
                <td key={`OperatingExpenses-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* VariableLeaseCost */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseCost');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseCost</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseCost-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseCost')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('VariableLeaseCost');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1</span>
              </td>
            </tr>

            {/* OperatingExpensesAdjusted */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingExpensesAdjusted');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingExpensesAdjusted</td>
              {incomeYears.map(yk => (
                <td key={`OperatingExpensesAdjusted-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingExpensesAdjusted')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingIncome */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingIncome');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingIncome</td>
              {incomeYears.map(yk => (
                <td key={`OperatingIncome-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingIncome')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            <tr className="border-b dark:border-gray-600">

              <td className="pl-6 pr-4 py-3 text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Selling General and Administrative');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Selling General and Administrative</td>

              {incomeYears.map(yk => (

                <td key={`SGA-${String(yk)}`} className="p-2 text-center">

                  {renderCell(yk, 'SGAExpense')}

                </td>

              ))}<td className="p-2 text-center">

              </td>


            </tr>

            {/* InterestExpenseDebt */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('InterestExpenseDebt');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>InterestExpenseDebt</td>
              {incomeYears.map(yk => (
                <td key={`InterestExpenseDebt-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'InterestExpenseDebt')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('InterestExpenseDebt');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">3%</span>
              </td>
            </tr>

            {/* OperatingLeaseInterestExpense */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseInterestExpense');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseInterestExpense</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseInterestExpense-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseInterestExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OperatingLeaseInterestExpense');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.2</span>
              </td>
            </tr>

            {/* FinanceLeaseInterestExpense */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseInterestExpense');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseInterestExpense</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseInterestExpense-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceLeaseInterestExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('FinanceLeaseInterestExpense');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.1</span>
              </td>
            </tr>

            {/* VariableLeaseInterestExpense */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseInterestExpense');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseInterestExpense</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseInterestExpense-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseInterestExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('VariableLeaseInterestExpense');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.05</span>
              </td>
            </tr>

            {/* InterestExpense */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('InterestExpense');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>InterestExpense</td>
              {incomeYears.map(yk => (
                <td key={`InterestExpense-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'InterestExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* InterestIncome */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('InterestIncome');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>InterestIncome</td>
              {incomeYears.map(yk => (
                <td key={`InterestIncome-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'InterestIncome')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('InterestIncome');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1%</span>
              </td>
            </tr>

            {/* InterestExpenseIncomeNet */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('InterestExpenseIncomeNet');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>InterestExpenseIncomeNet</td>
              {incomeYears.map(yk => (
                <td key={`InterestExpenseIncomeNet-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'InterestExpenseIncomeNet')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OtherNonoperatingIncome */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherNonoperatingIncome');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherNonoperatingIncome</td>
              {incomeYears.map(yk => (
                <td key={`OtherNonoperatingIncome-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherIncome')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OtherNonoperatingIncome');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0</span>
              </td>
            </tr>

            {/* NonoperatingIncomeNet */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NonoperatingIncomeNet');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NonoperatingIncomeNet</td>
              {incomeYears.map(yk => (
                <td key={`NonoperatingIncomeNet-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NetNonOperatingInterestIncome')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PretaxIncome */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PretaxIncome');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PretaxIncome</td>
              {incomeYears.map(yk => (
                <td key={`PretaxIncome-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PretaxIncome')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* TaxProvision */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('TaxProvision');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>TaxProvision</td>
              {incomeYears.map(yk => (
                <td key={`TaxProvision-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'TaxProvision')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('TaxProvision');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">25%</span>
              </td>
            </tr>

            {/* NetIncomeControlling */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NetIncomeControlling');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NetIncomeControlling</td>
              {incomeYears.map(yk => (
                <td key={`NetIncomeControlling-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ProfitLossControlling')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* NetIncomeNoncontrolling */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NetIncomeNoncontrolling');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NetIncomeNoncontrolling</td>
              {incomeYears.map(yk => (
                <td key={`NetIncomeNoncontrolling-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NetIncomeNoncontrolling')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('NetIncomeNoncontrolling');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0</span>
              </td>
            </tr>

            {/* NetIncome */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NetIncome');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NetIncome</td>
              {incomeYears.map(yk => (
                <td key={`NetIncome-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NetIncome')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* AssetImpairmentCharge */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AssetImpairmentCharge');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AssetImpairmentCharge</td>
              {incomeYears.map(yk => (
                <td key={`AssetImpairmentCharge-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'AssetImpairmentCharge')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* UnrealizedGainOnInvestments */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('UnrealizedGainOnInvestments');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>UnrealizedGainOnInvestments</td>
              {incomeYears.map(yk => (
                <td key={`UnrealizedGainOnInvestments-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'UnrealizedGainOnInvestments')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OtherNoncashChanges */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherNoncashChanges');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherNoncashChanges</td>
              {incomeYears.map(yk => (
                <td key={`OtherNoncashChanges-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherNoncashChanges')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* StockBasedCompensation */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('StockBasedCompensation');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>StockBasedCompensation</td>
              {incomeYears.map(yk => (
                <td key={`StockBasedCompensation-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ShareBasedCompensation')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('StockBasedCompensation');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1%</span>
              </td>
            </tr>

            {/* CommonStockDividendPayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CommonStockDividendPayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CommonStockDividendPayment</td>
              {incomeYears.map(yk => (
                <td key={`CommonStockDividendPayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CommonStockDividendPayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('CommonStockDividendPayment');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.5</span>
              </td>
            </tr>

            {/* CommonStockRepurchasePayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CommonStockRepurchasePayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CommonStockRepurchasePayment</td>
              {incomeYears.map(yk => (
                <td key={`CommonStockRepurchasePayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CommonStockRepurchasePayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('CommonStockRepurchasePayment');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1.0</span>
              </td>
            </tr>

            {/* EBIT */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('EBIT');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>EBIT</td>
              {incomeYears.map(yk => (
                <td key={`EBIT-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'EBIT')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* EBITA */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('EBITA');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>EBITA</td>
              {incomeYears.map(yk => (
                <td key={`EBITA-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'EBITA')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* EBITDA */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('EBITDA');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>EBITDA</td>
              {incomeYears.map(yk => (
                <td key={`EBITDA-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'EBITDA')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* TaxOperating */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('TaxOperating');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>TaxOperating</td>
              {incomeYears.map(yk => (
                <td key={`TaxOperating-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'TaxOperating')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('TaxOperating');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">25%</span>
              </td>
            </tr>

            {/* NetOperatingProfitAfterTaxes */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NetOperatingProfitAfterTaxes');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NetOperatingProfitAfterTaxes</td>
              {incomeYears.map(yk => (
                <td key={`NetOperatingProfitAfterTaxes-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NetOperatingProfitAfterTaxes')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingLeaseCost */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseCost');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseCost</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseCost-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseCost')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OperatingLeaseCost');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.3</span>
              </td>
            </tr>

            {/* CapitalExpenditures */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CapitalExpenditures');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CapitalExpenditures</td>
              {incomeYears.map(yk => (
                <td key={`CapitalExpenditures-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CapitalExpenditures')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('CapitalExpenditures');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">2.0</span>
              </td>
            </tr>

            {/* UnexplainedChangesInPPE */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('UnexplainedChangesInPPE');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>UnexplainedChangesInPPE</td>
              {incomeYears.map(yk => (
                <td key={`UnexplainedChangesInPPE-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'UnexplainedChangesInPPE')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* CashAndCashEquivalents */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CashAndCashEquivalents');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CashAndCashEquivalents</td>
              {incomeYears.map(yk => (
                <td key={`CashAndCashEquivalents-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CashAndCashEquivalents')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* ReceivablesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('ReceivablesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>ReceivablesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`ReceivablesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Receivables')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('ReceivablesCurrent');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">5</span>
              </td>
            </tr>

            {/* Inventory */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Inventory');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Inventory</td>
              {incomeYears.map(yk => (
                <td key={`Inventory-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Inventory')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('Inventory');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">10</span>
              </td>
            </tr>

            {/* PrepaidExpense */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PrepaidExpense');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PrepaidExpense</td>
              {incomeYears.map(yk => (
                <td key={`PrepaidExpense-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PrepaidExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('PrepaidExpense');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1</span>
              </td>
            </tr>

            {/* OtherAssetsCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherAssetsCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherAssetsCurrent</td>
              {incomeYears.map(yk => (
                <td key={`OtherAssetsCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherAssetsCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OtherAssetsCurrent');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">2</span>
              </td>
            </tr>

            {/* AssetsCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AssetsCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AssetsCurrent</td>
              {incomeYears.map(yk => (
                <td key={`AssetsCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CurrentAssets')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PropertyPlantAndEquipment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PropertyPlantAndEquipment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PropertyPlantAndEquipment</td>
              {incomeYears.map(yk => (
                <td key={`PropertyPlantAndEquipment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PropertyPlantAndEquipmentNet')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingLeaseAssets */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseAssets');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseAssets</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseAssets-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseRightOfUseAsset')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinanceLeaseAssets */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseAssets');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseAssets</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseAssets-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LeaseFinanceAssetsNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* VariableLeaseAssets */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseAssets');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseAssets</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseAssets-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseAssets')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* Goodwill */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Goodwill');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Goodwill</td>
              {incomeYears.map(yk => (
                <td key={`Goodwill-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Goodwill')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DeferredIncomeTaxAssetsNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DeferredIncomeTaxAssetsNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DeferredIncomeTaxAssetsNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`DeferredIncomeTaxAssetsNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DeferredIncomeTaxAssetsNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* ReceivablesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('ReceivablesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>ReceivablesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`ReceivablesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ReceivablesNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OtherAssetsNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherAssetsNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherAssetsNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`OtherAssetsNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherAssetsNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">3</span>
              </td>
            </tr>

            {/* AssetsNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AssetsNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AssetsNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`AssetsNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'AssetsNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* Assets */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Assets');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Assets</td>
              {incomeYears.map(yk => (
                <td key={`Assets-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Assets')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* AccountsPayableCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AccountsPayableCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AccountsPayableCurrent</td>
              {incomeYears.map(yk => (
                <td key={`AccountsPayableCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'AccountsPayableCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">4</span>
              </td>
            </tr>

            {/* EmployeeAccruedLiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('EmployeeAccruedLiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>EmployeeAccruedLiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`EmployeeAccruedLiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'EmployeeRelatedLiabilitiesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">1</span>
              </td>
            </tr>

            {/* AccruedLiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AccruedLiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AccruedLiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`AccruedLiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'AccruedLiabilitiesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">2</span>
              </td>
            </tr>

            {/* AccruedIncomeTaxesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AccruedIncomeTaxesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AccruedIncomeTaxesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`AccruedIncomeTaxesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'AccruedIncomeTaxesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">1</span>
              </td>
            </tr>

            {/* DeferredRevenueCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DeferredRevenueCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DeferredRevenueCurrent</td>
              {incomeYears.map(yk => (
                <td key={`DeferredRevenueCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DeferredRevenueCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">2</span>
              </td>
            </tr>

            {/* ShortTermDebtInclPaper */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('ShortTermDebtInclPaper');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>ShortTermDebtInclPaper</td>
              {incomeYears.map(yk => (
                <td key={`ShortTermDebtInclPaper-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ShortTermDebtInclPaper')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* LongTermDebtCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LongTermDebtCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LongTermDebtCurrent</td>
              {incomeYears.map(yk => (
                <td key={`LongTermDebtCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LongTermDebtCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">5</span>
              </td>
            </tr>

            {/* OperatingLeaseLiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseLiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseLiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseLiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseLiabilitiesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinanceLeaseLiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseLiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseLiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseLiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceLeaseLiabilitiesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* VariableLeaseLiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseLiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseLiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseLiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseLiabilitiesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('VariableLeaseLiabilitiesCurrent');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1</span>
              </td>
            </tr>

            {/* OtherLiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherLiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherLiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`OtherLiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherLiabilitiesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OtherLiabilitiesCurrent');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">2</span>
              </td>
            </tr>

            {/* LiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`LiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LiabilitiesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* LongTermDebtNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LongTermDebtNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LongTermDebtNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`LongTermDebtNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LongTermDebtNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('LongTermDebtNoncurrent');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">10</span>
              </td>
            </tr>

            {/* OperatingLeaseLiabilitiesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseLiabilitiesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseLiabilitiesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseLiabilitiesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseLiabilityNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinanceLeaseLiabilitiesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseLiabilitiesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseLiabilitiesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseLiabilitiesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceLeaseLiabilitiesNonCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* VariableLeaseLiabilitiesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseLiabilitiesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseLiabilitiesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseLiabilitiesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseLiabilitiesNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DeferredIncomeTaxLiabilitiesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DeferredIncomeTaxLiabilitiesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DeferredIncomeTaxLiabilitiesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`DeferredIncomeTaxLiabilitiesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DeferredIncomeTaxLiabilitiesNonCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DeferredIncomeTaxLiabilitiesNet */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DeferredIncomeTaxLiabilitiesNet');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DeferredIncomeTaxLiabilitiesNet</td>
              {incomeYears.map(yk => (
                <td key={`DeferredIncomeTaxLiabilitiesNet-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DeferredIncomeTaxLiabilitiesNet')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('DeferredIncomeTaxLiabilitiesNet');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1</span>
              </td>
            </tr>

            {/* OtherLiabilitiesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherLiabilitiesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherLiabilitiesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`OtherLiabilitiesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherLiabilitiesNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OtherLiabilitiesNoncurrent');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">3</span>
              </td>
            </tr>

            {/* LiabilitiesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LiabilitiesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LiabilitiesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`LiabilitiesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LiabilitiesNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* Liabilities */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Liabilities');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Liabilities</td>
              {incomeYears.map(yk => (
                <td key={`Liabilities-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Liabilities')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* CommonStock */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CommonStock');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CommonStock</td>
              {incomeYears.map(yk => (
                <td key={`CommonStock-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CommonStockEquity')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PaidInCapitalCommonStock */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PaidInCapitalCommonStock');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PaidInCapitalCommonStock</td>
              {incomeYears.map(yk => (
                <td key={`PaidInCapitalCommonStock-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PaidInCapitalCommonStock')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* AccumulatedOtherIncome */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AccumulatedOtherIncome');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AccumulatedOtherIncome</td>
              {incomeYears.map(yk => (
                <td key={`AccumulatedOtherIncome-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'AccumulatedOtherComprehensiveIncomeLossNetOfTax')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* RetainedEarningsAccumulated */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('RetainedEarningsAccumulated');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>RetainedEarningsAccumulated</td>
              {incomeYears.map(yk => (
                <td key={`RetainedEarningsAccumulated-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'RetainedEarningsAccumulated')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* Equity */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Equity');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Equity</td>
              {incomeYears.map(yk => (
                <td key={`Equity-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'StockholdersEquity')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* EquityInNoncontrollingInterests */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('EquityInNoncontrollingInterests');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>EquityInNoncontrollingInterests</td>
              {incomeYears.map(yk => (
                <td key={`EquityInNoncontrollingInterests-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NoncontrollingInterests')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* LiabilitiesAndEquity */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LiabilitiesAndEquity');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LiabilitiesAndEquity</td>
              {incomeYears.map(yk => (
                <td key={`LiabilitiesAndEquity-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LiabilitiesAndStockholdersEquity')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* BalanceSheetBalanceSheet */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('BalanceSheetBalanceSheet');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>BalanceSheetBalanceSheet</td>
              {incomeYears.map(yk => (
                <td key={`BalanceSheetBalanceSheet-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'BalanceSheetBalanceSheet')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingCash */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingCash');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingCash</td>
              {incomeYears.map(yk => (
                <td key={`OperatingCash-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingCash')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OperatingCash');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">1</span>
              </td>
            </tr>

            {/* ExcessCash */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('ExcessCash');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>ExcessCash</td>
              {incomeYears.map(yk => (
                <td key={`ExcessCash-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ExcessCash')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingLeaseNewAssetsObtained */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseNewAssetsObtained');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseNewAssetsObtained</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseNewAssetsObtained-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseNewAssetsObtained')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('OperatingLeaseNewAssetsObtained');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.2</span>
              </td>
            </tr>

            {/* FinanceLeaseNewAssetsObtained */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseNewAssetsObtained');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseNewAssetsObtained</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseNewAssetsObtained-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceLeaseNewAssetsObtained')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px] cursor-help"
                onMouseEnter={(e) => {
                  setHoveredForecastDriverValue('FinanceLeaseNewAssetsObtained');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredForecastDriverValue(null)}>
                <span className="text-gray-700 dark:text-gray-200">0.1</span>
              </td>
            </tr>

            {/* VariableLeaseNewAssetsObtained */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseNewAssetsObtained');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseNewAssetsObtained</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseNewAssetsObtained-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseNewAssetsObtained')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* Receivables */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Receivables');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Receivables</td>
              {incomeYears.map(yk => (
                <td key={`Receivables-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Receivables')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* LongTermDebt */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LongTermDebt');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LongTermDebt</td>
              {incomeYears.map(yk => (
                <td key={`LongTermDebt-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LongTermDebt')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* Debt */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Debt');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Debt</td>
              {incomeYears.map(yk => (
                <td key={`Debt-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Debt')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* CurrentLiabilitiesExclRevolver */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CurrentLiabilitiesExclRevolver');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CurrentLiabilitiesExclRevolver</td>
              {incomeYears.map(yk => (
                <td key={`CurrentLiabilitiesExclRevolver-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CurrentLiabilitiesExclRevolver')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingCashFlow */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingCashFlow');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingCashFlow</td>
              {incomeYears.map(yk => (
                <td key={`OperatingCashFlow-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingCashFlow')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* NetIncome (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NetIncome');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NetIncome</td>
              {incomeYears.map(yk => (
                <td key={`NetIncome2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NetIncome')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* Depreciation (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('Depreciation');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>Depreciation</td>
              {incomeYears.map(yk => (
                <td key={`Depreciation2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'Depreciation')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">2%</span>
              </td>
            </tr>

            {/* IntangibleAssetAmortization (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IntangibleAssetAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IntangibleAssetAmortization</td>
              {incomeYears.map(yk => (
                <td key={`IntangibleAssetAmortization2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IntangibleAssetAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DepreciationAndIntangibleAssetAmortization (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DepreciationAndIntangibleAssetAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DepreciationAndIntangibleAssetAmortization</td>
              {incomeYears.map(yk => (
                <td key={`DepreciationAndIntangibleAssetAmortization2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DepreciationAndIntangibleAssetAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingLeaseAmortization (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseAmortization</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseAmortization2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinanceLeaseAmortization (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseAmortization</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseAmortization2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceLeaseAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">0.5</span>
              </td>
            </tr>

            {/* VariableLeaseAmortization (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseAmortization');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseAmortization</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseAmortization2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseAmortization')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* AssetImpairmentCharge (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('AssetImpairmentCharge');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>AssetImpairmentCharge</td>
              {incomeYears.map(yk => (
                <td key={`AssetImpairmentCharge2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'AssetImpairmentCharge')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* UnrealizedGainOnInvestments (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('UnrealizedGainOnInvestments');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>UnrealizedGainOnInvestments</td>
              {incomeYears.map(yk => (
                <td key={`UnrealizedGainOnInvestments2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'UnrealizedGainOnInvestments')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OtherNoncashChanges (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherNoncashChanges');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherNoncashChanges</td>
              {incomeYears.map(yk => (
                <td key={`OtherNoncashChanges2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherNoncashChanges')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* StockBasedCompensation (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('StockBasedCompensation');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>StockBasedCompensation</td>
              {incomeYears.map(yk => (
                <td key={`StockBasedCompensation2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ShareBasedCompensation')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">1%</span>
              </td>
            </tr>

            {/* DecreaseInReceivablesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInReceivablesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInReceivablesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInReceivablesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DecreaseInReceivablesCurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DecreaseInInventory */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInInventory');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInInventory</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInInventory-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ChangeInInventory')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DecreaseInPrepaidExpense */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInPrepaidExpense');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInPrepaidExpense</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInPrepaidExpense-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DecreaseInPrepaidExpense')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DecreaseInOtherAssetsCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInOtherAssetsCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInOtherAssetsCurrent</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInOtherAssetsCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ChangeInOtherCurrentAssets')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DecreaseInDeferredIncomeTaxAssets */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInDeferredIncomeTaxAssets');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInDeferredIncomeTaxAssets</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInDeferredIncomeTaxAssets-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DecreaseInDeferredIncomeTaxAssets')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DecreaseInReceivablesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInReceivablesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInReceivablesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInReceivablesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DecreaseInReceivablesNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DecreaseInOtherAssetsNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInOtherAssetsNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInOtherAssetsNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInOtherAssetsNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'DecreaseInOtherAssetsNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInAccountsPayable */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInAccountsPayable');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInAccountsPayable</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInAccountsPayable-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ChangeInPayable')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInEmployeeAccruedLiabilities */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInEmployeeAccruedLiabilities');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInEmployeeAccruedLiabilities</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInEmployeeAccruedLiabilities-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IncreaseInEmployeeAccruedLiabilities')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInAccruedLiabilities */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInAccruedLiabilities');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInAccruedLiabilities</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInAccruedLiabilities-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IncreaseInAccruedLiabilities')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInAccruedIncomeTaxes */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInAccruedIncomeTaxes');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInAccruedIncomeTaxes</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInAccruedIncomeTaxes-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IncreaseInAccruedIncomeTaxes')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInDeferredRevenue */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInDeferredRevenue');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInDeferredRevenue</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInDeferredRevenue-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IncreaseInDeferredRevenue')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInOtherLiabilitiesCurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInOtherLiabilitiesCurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInOtherLiabilitiesCurrent</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInOtherLiabilitiesCurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ChangeInOtherCurrentLiabilities')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInDeferredIncomeTaxLiabilities */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInDeferredIncomeTaxLiabilities');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInDeferredIncomeTaxLiabilities</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInDeferredIncomeTaxLiabilities-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IncreaseInDeferredIncomeTaxLiabilities')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInDeferredIncomeTaxLiabilitiesNet */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInDeferredIncomeTaxLiabilitiesNet');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInDeferredIncomeTaxLiabilitiesNet</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInDeferredIncomeTaxLiabilitiesNet-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IncreaseInDeferredIncomeTaxLiabilitiesNet')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* IncreaseInOtherLiabilitiesNoncurrent */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('IncreaseInOtherLiabilitiesNoncurrent');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>IncreaseInOtherLiabilitiesNoncurrent</td>
              {incomeYears.map(yk => (
                <td key={`IncreaseInOtherLiabilitiesNoncurrent-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'IncreaseInOtherLiabilitiesNoncurrent')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* DecreaseInOtherOperatingCapitalNet */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('DecreaseInOtherOperatingCapitalNet');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>DecreaseInOtherOperatingCapitalNet</td>
              {incomeYears.map(yk => (
                <td key={`DecreaseInOtherOperatingCapitalNet-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ChangeInOtherWorkingCapital')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* InvestingCashFlow */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('InvestingCashFlow');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>InvestingCashFlow</td>
              {incomeYears.map(yk => (
                <td key={`InvestingCashFlow-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'InvestingCashFlow')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PurchaseOfPPE */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PurchaseOfPPE');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PurchaseOfPPE</td>
              {incomeYears.map(yk => (
                <td key={`PurchaseOfPPE-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PurchaseOfPPE')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* SaleOfPPE */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('SaleOfPPE');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>SaleOfPPE</td>
              {incomeYears.map(yk => (
                <td key={`SaleOfPPE-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'SaleOfPPE')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingLeaseNewAssetsObtained (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeaseNewAssetsObtained');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeaseNewAssetsObtained</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeaseNewAssetsObtained2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeaseNewAssetsObtained')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">0.2</span>
              </td>
            </tr>

            {/* FinanceLeaseNewAssetsObtained (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeaseNewAssetsObtained');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeaseNewAssetsObtained</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeaseNewAssetsObtained2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceLeaseNewAssetsObtained')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">0.1</span>
              </td>
            </tr>

            {/* VariableLeaseNewAssetsObtained (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeaseNewAssetsObtained');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeaseNewAssetsObtained</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeaseNewAssetsObtained2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeaseNewAssetsObtained')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PurchaseOfBusiness */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PurchaseOfBusiness');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PurchaseOfBusiness</td>
              {incomeYears.map(yk => (
                <td key={`PurchaseOfBusiness-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PurchaseOfBusiness')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* SaleOfBusiness */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('SaleOfBusiness');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>SaleOfBusiness</td>
              {incomeYears.map(yk => (
                <td key={`SaleOfBusiness-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'SaleOfBusiness')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PurchaseOfInvestment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PurchaseOfInvestment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PurchaseOfInvestment</td>
              {incomeYears.map(yk => (
                <td key={`PurchaseOfInvestment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PurchaseOfInvestment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* SaleOfInvestment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('SaleOfInvestment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>SaleOfInvestment</td>
              {incomeYears.map(yk => (
                <td key={`SaleOfInvestment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'SaleOfInvestment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OtherInvestingChanges */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OtherInvestingChanges');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OtherInvestingChanges</td>
              {incomeYears.map(yk => (
                <td key={`OtherInvestingChanges-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OtherInvestingChanges')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinancingCashFlow */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinancingCashFlow');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinancingCashFlow</td>
              {incomeYears.map(yk => (
                <td key={`FinancingCashFlow-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinancingCashFlow')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* ShortTermDebtIssuance */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('ShortTermDebtIssuance');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>ShortTermDebtIssuance</td>
              {incomeYears.map(yk => (
                <td key={`ShortTermDebtIssuance-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ShortTermDebtIssuance')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* ShortTermDebtPayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('ShortTermDebtPayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>ShortTermDebtPayment</td>
              {incomeYears.map(yk => (
                <td key={`ShortTermDebtPayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'ShortTermDebtPayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* LongTermDebtIssuance */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LongTermDebtIssuance');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LongTermDebtIssuance</td>
              {incomeYears.map(yk => (
                <td key={`LongTermDebtIssuance-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LongTermDebtIssuance')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* LongTermDebtPayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('LongTermDebtPayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>LongTermDebtPayment</td>
              {incomeYears.map(yk => (
                <td key={`LongTermDebtPayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'LongTermDebtPayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* CommonStockIssuance */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CommonStockIssuance');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CommonStockIssuance</td>
              {incomeYears.map(yk => (
                <td key={`CommonStockIssuance-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CommonStockIssuance')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* CommonStockRepurchasePayment (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CommonStockRepurchasePayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CommonStockRepurchasePayment</td>
              {incomeYears.map(yk => (
                <td key={`CommonStockRepurchasePayment2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CommonStockRepurchasePayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">1.0</span>
              </td>
            </tr>

            {/* CommonStockDividendPayment (duplicate - using same field) */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CommonStockDividendPayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CommonStockDividendPayment</td>
              {incomeYears.map(yk => (
                <td key={`CommonStockDividendPayment2-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CommonStockDividendPayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-700 dark:text-gray-200">0.5</span>
              </td>
            </tr>

            {/* TaxWithholdingPayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('TaxWithholdingPayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>TaxWithholdingPayment</td>
              {incomeYears.map(yk => (
                <td key={`TaxWithholdingPayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'TaxWithholdingPayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingNewLeaseDebtIssuance */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingNewLeaseDebtIssuance');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingNewLeaseDebtIssuance</td>
              {incomeYears.map(yk => (
                <td key={`OperatingNewLeaseDebtIssuance-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingNewLeaseDebtIssuance')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* OperatingLeasePrinciplePayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('OperatingLeasePrinciplePayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>OperatingLeasePrinciplePayment</td>
              {incomeYears.map(yk => (
                <td key={`OperatingLeasePrinciplePayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'OperatingLeasePrinciplePayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinanceNewLeaseDebtIssuance */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceNewLeaseDebtIssuance');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceNewLeaseDebtIssuance</td>
              {incomeYears.map(yk => (
                <td key={`FinanceNewLeaseDebtIssuance-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinanceNewLeaseDebtIssuance')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinanceLeasePrinciplePayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinanceLeasePrinciplePayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinanceLeasePrinciplePayment</td>
              {incomeYears.map(yk => (
                <td key={`FinanceLeasePrinciplePayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinancingLeasePayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* VariableNewLeaseDebtIssuance */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableNewLeaseDebtIssuance');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableNewLeaseDebtIssuance</td>
              {incomeYears.map(yk => (
                <td key={`VariableNewLeaseDebtIssuance-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableNewLeaseDebtIssuance')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* VariableLeasePrinciplePayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('VariableLeasePrinciplePayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>VariableLeasePrinciplePayment</td>
              {incomeYears.map(yk => (
                <td key={`VariableLeasePrinciplePayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'VariableLeasePrinciplePayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* MinorityDividendPayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('MinorityDividendPayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>MinorityDividendPayment</td>
              {incomeYears.map(yk => (
                <td key={`MinorityDividendPayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'MinorityDividendPayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* MinorityShareholderPayment */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('MinorityShareholderPayment');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>MinorityShareholderPayment</td>
              {incomeYears.map(yk => (
                <td key={`MinorityShareholderPayment-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'MinorityShareholderPayment')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PurchaseofNoncontrollingInterest */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PurchaseofNoncontrollingInterest');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PurchaseofNoncontrollingInterest</td>
              {incomeYears.map(yk => (
                <td key={`PurchaseofNoncontrollingInterest-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PurchaseofNoncontrollingInterest')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* EffectOfExchangeRate */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('EffectOfExchangeRate');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>EffectOfExchangeRate</td>
              {incomeYears.map(yk => (
                <td key={`EffectOfExchangeRate-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'EffectOfExchangeRate')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* NetCashFlow */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NetCashFlow');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NetCashFlow</td>
              {incomeYears.map(yk => (
                <td key={`NetCashFlow-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NetCashFlow')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* FinancingCashFlowExclRevolver */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('FinancingCashFlowExclRevolver');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>FinancingCashFlowExclRevolver</td>
              {incomeYears.map(yk => (
                <td key={`FinancingCashFlowExclRevolver-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'FinancingCashFlowExclRevolver')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* NetCashFlowExclShortTermDebtInclPaper */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('NetCashFlowExclShortTermDebtInclPaper');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>NetCashFlowExclShortTermDebtInclPaper</td>
              {incomeYears.map(yk => (
                <td key={`NetCashFlowExclShortTermDebtInclPaper-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'NetCashFlowExclShortTermDebtInclPaper')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* CashFlowToShortTermDebtInclPaper */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('CashFlowToShortTermDebtInclPaper');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>CashFlowToShortTermDebtInclPaper</td>
              {incomeYears.map(yk => (
                <td key={`CashFlowToShortTermDebtInclPaper-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'CashFlowToShortTermDebtInclPaper')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* MinBalanceOfShortTermDebtInclPaper */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('MinBalanceOfShortTermDebtInclPaper');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>MinBalanceOfShortTermDebtInclPaper</td>
              {incomeYears.map(yk => (
                <td key={`MinBalanceOfShortTermDebtInclPaper-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'MinBalanceOfShortTermDebtInclPaper')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

            {/* PaydownOfShortTermDebtInclPaper */}
            <tr className="border-b dark:border-gray-600">
              <td className="px-4 py-3 text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
  onMouseEnter={(e) => {
    setHoveredBreakdown('PaydownOfShortTermDebtInclPaper');
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseMove={(e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }}
  onMouseLeave={() => setHoveredBreakdown(null)}>PaydownOfShortTermDebtInclPaper</td>
              {incomeYears.map(yk => (
                <td key={`PaydownOfShortTermDebtInclPaper-${String(yk)}`} className="p-2 text-center">
                  {renderCell(yk, 'PaydownOfShortTermDebtInclPaper')}
                </td>
                            ))}
              <td className="p-2 text-center border-l dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 min-w-[180px]">
                <span className="text-gray-400">-</span>
              </td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>

  );

};



// NoPAT table component


export default IncomeStatementTable;
