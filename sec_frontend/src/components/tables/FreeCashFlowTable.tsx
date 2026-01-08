import React, { useEffect, useRef, useState } from 'react';

import { years } from '../../data/constants';
import { formatMonetaryValue } from '../../utils/formatMonetary';
import { renderForecastReadonlyDisplay } from '../../utils/forecastDisplay';

interface CellData {
  [key: string]: number | string;
}

interface TableData {
  [year: number]: CellData;
}


const FreeCashFlowTable: React.FC<{ 

  data: TableData, 

  onDataChange: (tableId: string, year: number, field: string, value: number | string) => void,

  isInputField?: (field: string) => boolean,

  isCalculatedField?: (field: string) => boolean,

  companyTicker?: string

}> = ({ data, onDataChange, isInputField, isCalculatedField: _isCalculatedField, companyTicker = 'COST' }) => {

  // Debounce timers for real-time calculations
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Tooltips for Free Cash Flow fields
  const freeCashFlowTooltips: { [key: string]: string } = {
    // First image fields (28 fields)
    'NetOperatingProfitAfterTaxes': 'Referenced: from 3StatementModel',
    'DepreciationAndIntangibleAssetAmortization': 'Referenced: from 3StatementModel',
    'OperatingLeaseAmortization': 'Referenced: from 3StatementModel',
    'FinanceLeaseAmortization': 'Referenced: from 3StatementModel',
    'VariableLeaseAmortization': 'Referenced: from 3StatementModel',
    'AssetImpairmentCharge': 'Referenced: from 3StatementModel',
    'UnrealizedGainOnInvestments': 'Referenced: from 3StatementModel',
    'OtherNoncashChanges': 'Referenced: from 3StatementModel',
    'GrossCashFlow': 'Calculated: NetOperatingProfitAfterTaxes + Non-cash items',
    'CapitalExpenditures': 'Referenced: from 3StatementModel',
    'OperatingLeaseNewAssetsObtained': 'Referenced: from 3StatementModel',
    'FinanceLeaseNewAssetsObtained': 'Referenced: from 3StatementModel',
    'VariableLeaseNewAssetsObtained': 'Referenced: from 3StatementModel',
    'GrossCashFlowAfterCapitalAndLeaseExpenditures': 'Calculated: GrossCashFlow - CapitalAndLease Expenditures',
    'DecreaseInOperatingCash': 'Referenced: from 3StatementModel',
    'DecreaseInReceivablesCurrent': 'Referenced: from 3StatementModel',
    'DecreaseInInventory': 'Referenced: from 3StatementModel',
    'DecreaseInPrepaidExpense': 'Referenced: from 3StatementModel',
    'DecreaseInOtherAssetsCurrent': 'Referenced: from 3StatementModel',
    'IncreaseInAccountsPayable': 'Referenced: from 3StatementModel',
    'IncreaseInEmployeeAccruedLiabilities': 'Referenced: from 3StatementModel',
    'IncreaseInAccruedLiabilities': 'Referenced: from 3StatementModel',
    'IncreaseInAccruedIncomeTaxes': 'Referenced: from 3StatementModel',
    'IncreaseInDeferredRevenue': 'Referenced: from 3StatementModel',
    'IncreaseInOtherLiabilitiesCurrent': 'Referenced: from 3StatementModel',
    'DecreaseInWorkingCapital': 'Calculated: Sum of changes in current working assets and liabilities',
    'DecreaseInOtherAssetsNoncurrent': 'Referenced: from 3StatementModel',
    'IncreaseInOtherLiabilitiesNoncurrent': 'Referenced: from 3StatementModel',
    // Second image fields (23 fields)
    'IncreaseInDeferredIncomeTaxLiabilitiesNet': 'Referenced: from 3StatementModel',
    'DecreaseInReceivablesNoncurrent': 'Referenced: from 3StatementModel',
    'DecreaseInGoodwill': 'Referenced: from 3StatementModel',
    'DecreaseInNoncurrentAssetsNetOfLiabilities': 'Referenced: from 3StatementModel',
    'FreeCashFlow': 'Calculated: GrossCashFlowAfterExpenditures + DecreaseInWorkingCapital + DecreaseInNoncurrentAssetsNetOfLiabilities',
    'InterestIncome': 'Referenced: from 3StatementModel',
    'OtherNonoperatingIncome': 'Referenced: from 3StatementModel',
    'DecreaseInExcessCash': 'Referenced: from 3StatementModel',
    'NonOperatingTaxBenefitOrLoss': 'Calculated: Difference between cash generated and cash distributed incl. tax shield',
    'CashFlowToAllInvestors': 'Calculated: FreeCashFlow + Non-operating CashFlows',
    'AfterTaxInterestOnDebtAndLeases': 'Calculated: (1-Marginal Tax Rate) * Interest',
    'DebtIssuance': 'Calculated: Sum of short term and long-term issuances',
    'DebtPayment': 'Calculated: Sum of short term and long-term payments',
    'LeasePrinciplePayments': 'Calculated: Sum of all lease principle payments',
    'NewLeaseDebtIssuances': 'Calculated: Sum of all lease debt issuances',
    'CashFlowToDebtHolders': 'Calculated: Sum of cash flows to debt holders including lease lenders',
    'CommonStockDividendPayment': 'Referenced: from 3StatementModel',
    'CommonStockRepurchasePayment': 'Referenced: from 3StatementModel',
    'CommonStockIssuanceInclStockBasedCompensation': 'Referenced: from 3StatementModel',
    'MinorityDividendPayment': 'Referenced: from 3StatementModel',
    'MinorityShareholderPayment': 'Referenced: from 3StatementModel',
    'CashFlowToEquityHolders': 'Calculated: Sum of cash flows to equity holders',
    'CashFlowToDebtAndEquityHolders': 'Calculated: Sum of cash flows to both debt and equity holders'
  };

  // State for tooltip visibility
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const formatNumber = (value: number | string | undefined) => {

    return formatMonetaryValue(value);

  };



  const yearsList: number[] = years.filter((year: number) => year >= 2021);




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

    const isInput = isInputField ? isInputField(key) : false;


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
    // First image fields (28 fields)
    'NetOperatingProfitAfterTaxes',
    'DepreciationAndIntangibleAssetAmortization',
    'OperatingLeaseAmortization',
    'FinanceLeaseAmortization',
    'VariableLeaseAmortization',
    'AssetImpairmentCharge',
    'UnrealizedGainOnInvestments',
    'OtherNoncashChanges',
    'GrossCashFlow',
    'CapitalExpenditures',
    'OperatingLeaseNewAssetsObtained',
    'FinanceLeaseNewAssetsObtained',
    'VariableLeaseNewAssetsObtained',
    'GrossCashFlowAfterCapitalAndLeaseExpenditures',
    'DecreaseInOperatingCash',
    'DecreaseInReceivablesCurrent',
    'DecreaseInInventory',
    'DecreaseInPrepaidExpense',
    'DecreaseInOtherAssetsCurrent',
    'IncreaseInAccountsPayable',
    'IncreaseInEmployeeAccruedLiabilities',
    'IncreaseInAccruedLiabilities',
    'IncreaseInAccruedIncomeTaxes',
    'IncreaseInDeferredRevenue',
    'IncreaseInOtherLiabilitiesCurrent',
    'DecreaseInWorkingCapital',
    'DecreaseInOtherAssetsNoncurrent',
    'IncreaseInOtherLiabilitiesNoncurrent',
    // Second image fields (23 fields)
    'IncreaseInDeferredIncomeTaxLiabilitiesNet',
    'DecreaseInReceivablesNoncurrent',
    'DecreaseInGoodwill',
    'DecreaseInNoncurrentAssetsNetOfLiabilities',
    'FreeCashFlow',
    'InterestIncome',
    'OtherNonoperatingIncome',
    'DecreaseInExcessCash',
    'NonOperatingTaxBenefitOrLoss',
    'CashFlowToAllInvestors',
    'AfterTaxInterestOnDebtAndLeases',
    'DebtIssuance',
    'DebtPayment',
    'LeasePrinciplePayments',
    'NewLeaseDebtIssuances',
    'CashFlowToDebtHolders',
    'CommonStockDividendPayment',
    'CommonStockRepurchasePayment',
    'CommonStockIssuanceInclStockBasedCompensation',
    'MinorityDividendPayment',
    'MinorityShareholderPayment',
    'CashFlowToEquityHolders',
    'CashFlowToDebtAndEquityHolders'
  ];
  // NOTE: fieldTypes was unused; removed to satisfy TS noUnusedLocals.

  // NOTE: Average/CAGR helpers were unused in the current UI; removed to satisfy TS noUnusedLocals.
  return (

    <div className="bg-white rounded-lg shadow-sm border relative">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} Free Cash Flow</h3>

      </div>

      {/* Tooltip */}
      {hoveredField && freeCashFlowTooltips[hoveredField] && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg pointer-events-none max-w-md"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          {freeCashFlowTooltips[hoveredField]}
        </div>
      )}

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

            </tr>

          </thead>

          <tbody>

            {fields.map((field, _index) => (

              <tr 

                key={field} 

                className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"

              >

                <td 
                  className="px-4 py-3 font-semibold text-gray-800 dark:text-white sticky left-0 z-15 bg-white dark:bg-gray-800 border-r dark:border-gray-600 min-w-[250px] cursor-help"
                  onMouseEnter={(e) => {
                    setHoveredField(field);
                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredField(null)}
                >

                  {field}

                </td>

                {yearsList.map(year => (

                  <td key={`${year}-${field}`} className="p-1">

                    {renderCell(year, field)}

                  </td>

                ))}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};




export default FreeCashFlowTable;
