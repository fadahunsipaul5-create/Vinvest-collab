import React, { useEffect, useRef, useState } from 'react';

import { years } from '../../data/constants';
import { formatMonetaryValue } from '../../utils/formatMonetary';
import { renderForecastReadonlyInput } from '../../utils/forecastDisplay';

interface CellData {
  [key: string]: number | string;
}

interface TableData {
  [year: number]: CellData;
}


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

  // Tooltips for Invested Capital fields
  const investedCapitalTooltips: { [key: string]: string } = {
    // First image fields (31 fields)
    'ReceivablesCurrent': 'Referenced: from 3StatementModel',
    'Inventory': 'Referenced: from 3StatementModel',
    'PrepaidExpense': 'Referenced: from 3StatementModel',
    'OtherAssetsCurrent': 'Referenced: from 3StatementModel',
    'OperaingCurrentAssets': 'Calculated: Sum of current operating assets',
    'AccountsPayableCurrent': 'Referenced: from 3StatementModel',
    'EmployeeAccruedLiabilitiesCurrent': 'Referenced: from 3StatementModel',
    'AccruedLiabilitiesCurrent': 'Referenced: from 3StatementModel',
    'AccruedIncomeTaxesCurrent': 'Referenced: from 3StatementModel',
    'DeferredRevenueCurrent': 'Referenced: from 3StatementModel',
    'OtherLiabilitiesCurrent': 'Referenced: from 3StatementModel',
    'OperaingCurrentLiabilities': 'Calculated: Sum of current operating liabilities',
    'OperaingWorkingCapital': 'Calculated: OperaingCurrentAssets - OperaingCurrentLiabilities',
    'PropertyPlantAndEquipment': 'Referenced: from 3StatementModel',
    'OperatingLeaseAssets': 'Referenced: from 3StatementModel',
    'FinanceLeaseAssets': 'Referenced: from 3StatementModel',
    'VariableLeaseAssets': 'Referenced: from 3StatementModel',
    'ReceivablesNoncurrent': 'Referenced: from 3StatementModel',
    'OtherAssetsNoncurrent': 'Referenced: from 3StatementModel',
    'OtherLiabilitiesNoncurrent': 'Referenced: from 3StatementModel',
    'InvestedCapitalExclGoodwill': 'Calculated: OperaingWorkingCapital + PropertyPlantAndEquipment + LeaseAssets + OtherAssetsNetOfLiabilities',
    'Goodwill': 'Referenced: from 3StatementModel',
    'InvestedCapitalInclGoodwill': 'Calculated: InvestedCapitalExclGoodwill + Goodwill',
    'ExcessCash': 'Referenced: from 3StatementModel',
    'DeferredIncomeTaxAssetsNet': 'Referenced: from 3StatementModel',
    'TotalFundsInvested': 'Calculated: InvestedCapitalInclGoodwill + ExcessCash + DeferredIncomeTaxAssetsNet',
    'ShortTermDebtInclPaper': 'Referenced: from 3StatementModel',
    'LongTermDebt': 'Referenced: from 3StatementModel',
    'OperatingLeaseLiabilities': 'Referenced: from 3StatementModel',
    'FinanceLeaseLiabilities': 'Referenced: from 3StatementModel',
    'VariableLeaseLiabilities': 'Referenced: from 3StatementModel',
    // Second image fields (6 fields)
    'DebtAndDebtEquivalents': 'Calculated: ShortTermDebtInclPaper + LongTermDebt + OperatingLeaseLiabilities + FinanceLeaseLiabilities + VariableLeaseLiabilities',
    'Equity': 'Referenced: from 3StatementModel',
    'EquityInNoncontrollingInterests': 'Referenced: from 3StatementModel',
    'EquityAndEquityEquivalents': 'Calculated: Equity + EquityInNoncontrollingInterests',
    'DebtAndEquity': 'Calculated: DebtAndDebtEquivalents + EquityAndEquityEquivalents',
    'BalanceInvestedCapital': 'Calculated: Validation check - TotalFundsInvested should equal DebtAndEquity'
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
    // First image fields (31 fields)
    'ReceivablesCurrent',
    'Inventory',
    'PrepaidExpense',
    'OtherAssetsCurrent',
    'OperaingCurrentAssets', // Note: keeping typo as shown in image
    'AccountsPayableCurrent',
    'EmployeeAccruedLiabilitiesCurrent',
    'AccruedLiabilitiesCurrent',
    'AccruedIncomeTaxesCurrent',
    'DeferredRevenueCurrent',
    'OtherLiabilitiesCurrent',
    'OperaingCurrentLiabilities', // Note: keeping typo as shown in image
    'OperaingWorkingCapital', // Note: keeping typo as shown in image
    'PropertyPlantAndEquipment',
    'OperatingLeaseAssets',
    'FinanceLeaseAssets',
    'VariableLeaseAssets',
    'ReceivablesNoncurrent',
    'OtherAssetsNoncurrent',
    'OtherLiabilitiesNoncurrent',
    'InvestedCapitalExclGoodwill',
    'Goodwill',
    'InvestedCapitalInclGoodwill',
    'ExcessCash',
    'DeferredIncomeTaxAssetsNet',
    'TotalFundsInvested',
    'ShortTermDebtInclPaper',
    'LongTermDebt',
    'OperatingLeaseLiabilities',
    'FinanceLeaseLiabilities',
    'VariableLeaseLiabilities',
    // Second image fields (6 fields)
    'DebtAndDebtEquivalents',
    'Equity',
    'EquityInNoncontrollingInterests',
    'EquityAndEquityEquivalents',
    'DebtAndEquity',
    'BalanceInvestedCapital'
  ];
  // NOTE: fieldTypes was unused; removed to satisfy TS noUnusedLocals.

  // NOTE: Average/CAGR helpers were unused in the current UI; removed to satisfy TS noUnusedLocals.
  return (

    <div className="bg-white rounded-lg shadow-sm border relative">

      <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyTicker} Invested Capital</h3>

      </div>

      {/* Tooltip */}
      {hoveredField && investedCapitalTooltips[hoveredField] && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg pointer-events-none max-w-md"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          {investedCapitalTooltips[hoveredField]}
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



// Free Cash Flow table component


export default InvestedCapitalTable;
