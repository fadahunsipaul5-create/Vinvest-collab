import { ChartDataPoint } from '../components/home';

/**
 * Interface matching the structure of modifiedData in CompanyDataContext
 * { [ticker: string]: { [tableId: string]: { [year: number]: { [field: string]: number | string } } } }
 */
interface CompanyModifiedData {
  [tableId: string]: {
    [year: number]: {
      [key: string]: number | string;
    };
  };
}

/**
 * Mapping of Dashboard Metrics (from API/Charts) to Valuation Model Fields (internal keys)
 * 
 * Keys = Metric names as they appear in home.tsx / API response
 * Values = Field keys used in the Valuation Model tables (IncomeStatement, BalanceSheet, etc.)
 */
const METRIC_TO_FIELD_MAP: { [key: string]: string } = {
  // Income Statement
  'Revenue': 'Revenue',
  'Cost of Revenue': 'CostOfRevenue',
  'Gross Profit': 'GrossProfit',
  'Operating Expenses': 'OperatingExpenses',
  'Operating Income': 'OperatingIncome',
  'Net Income': 'NetIncome',
  'EBITDA': 'EBITDA',
  'EBIT': 'EBIT',
  'EPS': 'EPS',
  
  // Balance Sheet
  'Total Assets': 'TotalAssets',
  'Total Liabilities': 'TotalLiabilities',
  'Total Equity': 'TotalEquity',
  'Cash and Cash Equivalents': 'CashAndCashEquivalents',
  'Total Debt': 'TotalDebt',
  
  // Cash Flow / Calculated Metrics
  'Free Cash Flow': 'FreeCashFlow',
  'Capital Expenditure': 'CapitalExpenditure',
};

/**
 * Merges API chart data with Sandbox (modified) data.
 * 
 * @param apiData - The original data array from the API (ChartDataPoint[])
 * @param modifiedData - The user's modified data for the current company (from Context)
 * @param isSandboxMode - Boolean flag to enable/disable the merge
 * @param currentTicker - The ticker of the currently selected company
 * @returns A new array of ChartDataPoint with updated values where applicable
 */
export const getEffectiveChartData = (
  apiData: ChartDataPoint[],
  modifiedData: CompanyModifiedData | null,
  isSandboxMode: boolean,
  currentTicker: string
): ChartDataPoint[] => {
  // 1. If Sandbox Mode is OFF or no modified data exists, return original data
  if (!isSandboxMode || !modifiedData) {
    return apiData;
  }

  // 2. Deep copy to avoid mutating original state
  const mergedData = apiData.map(item => ({ ...item }));

  // 3. Iterate through the chart data points
  mergedData.forEach(point => {
    // Extract the year from the point name (e.g., "2025" or "2025-12-31")
    // Assuming 'name' contains the year or is the year string
    const yearStr = point.name.toString().substring(0, 4);
    const year = parseInt(yearStr);

    if (isNaN(year)) return; // Skip if we can't parse a year

    // 4. Iterate through all tables in modifiedData (IncomeStatement, BalanceSheet, etc.)
    Object.keys(modifiedData).forEach(tableId => {
      const tableData = modifiedData[tableId];
      const yearData = tableData[year];

      if (yearData) {
        // 5. Check each metric in the chart point to see if we have an override
        Object.keys(point).forEach(key => {
          // 'value' is often the main metric being charted
          // But chart points can also have dynamic keys like "Revenue", "Net Income" depending on the chart type
          
          // Case A: The key matches a mapped field directly (e.g., point['Revenue'])
          const mappedField = METRIC_TO_FIELD_MAP[key] || key; // Try map, fallback to key itself
          
          if (yearData[mappedField] !== undefined) {
             const val = yearData[mappedField];
             // Ensure we preserve the type (number vs string) if possible, but charts usually want numbers
             point[key] = typeof val === 'string' ? parseFloat(val) : val;
          }
          
          // Case B: Special handling for the generic 'value' key
          // This usually requires knowing WHAT metric 'value' represents.
          // In home.tsx, 'chartData' is often constructed for a specific metric (e.g., selectedSearchMetrics[0]).
          // This function might need to be context-aware or we rely on specific metric keys.
        });
      }
    });
  });

  return mergedData;
};

/**
 * Helper to check if a specific metric has been modified for a specific year
 */
export const isMetricModified = (
  metric: string,
  year: number,
  modifiedData: CompanyModifiedData | null
): boolean => {
  if (!modifiedData) return false;
  
  const fieldKey = METRIC_TO_FIELD_MAP[metric] || metric;
  
  return Object.values(modifiedData).some(table => 
    table[year] && table[year][fieldKey] !== undefined
  );
};

