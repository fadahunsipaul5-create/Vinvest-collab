// Company data index mapping tickers to mock data files
// Used for Business Performance page chart data

import { walmartMockData } from './walmartMockData';
import { walmartIncomeStatementCommonAverages as walmartIncomeStatementAverages, walmartIncomeStatementCommonCAGR as walmartIncomeStatementCAGR } from './walmartIncomeStatementCommonReal';
import { walmartBalanceSheetAverages, walmartBalanceSheetCAGR } from './walmartBalanceSheetReal';
import { walmartCashFlowAverages, walmartCashFlowCAGR } from './walmartCashFlowReal';
import { walmartNopatAverages as walmartNOPATTableAverages, walmartNopatCAGR as walmartNOPATTableCAGR } from './walmartNopatReal';
import { walmartInvestedCapitalAverages as walmartCapitalTableAverages, walmartInvestedCapitalCAGR as walmartCapitalTableCAGR } from './walmartInvestedCapitalReal';
import { walmartFreeCashFlowAverages as walmartFreeCashFlowTableAverages, walmartFreeCashFlowCAGR as walmartFreeCashFlowTableCAGR } from './walmartFreeCashFlowReal';
import { walmartRoicAverages as walmartROICBreakdownTableAverages, walmartRoicCAGR as walmartROICBreakdownTableCAGR } from './walmartRoicReal';
import { walmartOperationalPerformanceAverages as walmartOpsPerformanceRatiosAverages, walmartOperationalPerformanceCAGR as walmartOpsPerformanceRatiosCAGR } from './walmartOperationalPerformanceReal';
import { walmartFinancingHealthAverages as walmartFinancingHealthRatiosAverages, walmartFinancingHealthCAGR as walmartFinancingHealthRatiosCAGR } from './walmartFinancingHealthReal';
import { bjMockData } from './bjMockData';
import { dgMockData } from './dgMockData';
import { dltrMockData } from './dltrMockData';
import { tgtMockData } from './tgtMockData';
import { costcoMockData } from './costcoMockData';

export const COMPANY_DATA_MAP = {
  'WMT': walmartMockData,
  'BJ': bjMockData,
  'DG': dgMockData,
  'DLTR': dltrMockData,
  'TGT': tgtMockData,
  'COST': costcoMockData
};

// Walmart-specific averages and CAGRs (separate exports)
export const WALMART_AVERAGES_MAP = {
  incomeStatement: walmartIncomeStatementAverages,
  balanceSheet: walmartBalanceSheetAverages,
  cashFlow: walmartCashFlowAverages,
  nopat: walmartNOPATTableAverages,
  investedCapital: walmartCapitalTableAverages,
  freeCashFlow: walmartFreeCashFlowTableAverages,
  roicBreakdown: walmartROICBreakdownTableAverages,
  operationalPerformance: walmartOpsPerformanceRatiosAverages,
  financingHealth: walmartFinancingHealthRatiosAverages
};

export const WALMART_CAGR_MAP = {
  incomeStatement: walmartIncomeStatementCAGR,
  balanceSheet: walmartBalanceSheetCAGR,
  cashFlow: walmartCashFlowCAGR,
  nopat: walmartNOPATTableCAGR,
  investedCapital: walmartCapitalTableCAGR,
  freeCashFlow: walmartFreeCashFlowTableCAGR,
  roicBreakdown: walmartROICBreakdownTableCAGR,
  operationalPerformance: walmartOpsPerformanceRatiosCAGR,
  financingHealth: walmartFinancingHealthRatiosCAGR
};

// Deep clone function to prevent mutation of static data
function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned: any = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
}

// Helper function to get company data by ticker (static data only)
// For components that need context-aware data, use useCompanyDataWithContext hook instead
// Returns a deep copy to prevent mutation of static data
export function getCompanyData(ticker: string): any {
  const staticData = COMPANY_DATA_MAP[ticker as keyof typeof COMPANY_DATA_MAP] || null;
  return staticData ? deepClone(staticData) : null;
}

// Deep merge function to merge modified data with static data
function deepMergeTables(staticData: any, modifiedData: any): any {
  if (!modifiedData) return staticData;
  if (!staticData) return modifiedData;

  // Use deep clone to prevent mutations to original static data
  const merged = deepClone(staticData);

  // Merge each table
  Object.keys(modifiedData).forEach(tableId => {
    if (modifiedData[tableId]) {
      if (!merged[tableId]) {
        merged[tableId] = {};
      }

      // Merge years within the table
      // Handle both string and number year keys
      Object.keys(modifiedData[tableId]).forEach(year => {
        const yearNum = typeof year === 'string' && !isNaN(Number(year)) ? Number(year) : year;
        const yearKey = yearNum; // Use numeric key consistently
        const modifiedYearData = modifiedData[tableId][year] || modifiedData[tableId][yearKey] || modifiedData[tableId][String(yearKey)];
        
        if (!merged[tableId][yearKey]) {
          merged[tableId][yearKey] = {};
        }
        // Merge fields within the year (modified data takes precedence)
        merged[tableId][yearKey] = {
          ...merged[tableId][yearKey],
          ...modifiedYearData
        };
      });
    }
  });

  return merged;
}

// Helper function that can be used outside React components (for utilities)
// This version checks context if provided, otherwise returns static data
export function getCompanyDataWithContext(ticker: string, contextData?: any): any {
  const staticData = getCompanyData(ticker);
  
  if (!staticData) return null;
  
  // If context data is provided, merge it
  if (contextData) {
    const modifiedData = contextData.getModifiedCompanyData?.(ticker);
    if (modifiedData) {
      return deepMergeTables(staticData, modifiedData);
    }
  }
  
  return staticData;
}

// Get all available company tickers
export function getAvailableCompanies(): string[] {
  return Object.keys(COMPANY_DATA_MAP);
}

// Check if a company has data for a specific metric
export function hasMetricData(ticker: string, metricName: string): boolean {
  const companyData = getCompanyData(ticker);
  if (!companyData) return false;
  
  // Check all possible table locations
  const tablesToCheck = [
    'incomeStatement',
    'balanceSheet', 
    'cashFlow',
    'nopat',
    'investedCapital',
    'freeCashFlow',
    'operationalPerformance',
    'financingHealth',
    'incomeStatementCommonSize',
    'balanceSheetCommonSize',
    'incomeStatementAverages',
    'balanceSheetAverages',
    'cashFlowAverages',
    'nopatAverages',
    'investedCapitalAverages',
    'freeCashFlowAverages'
  ];

  for (const tableName of tablesToCheck) {
    if (companyData[tableName] && companyData[tableName][metricName]) {
      return true;
    }
  }
  
  return false;
}

// Get company name from ticker
export function getCompanyName(ticker: string): string {
  const companyNames: { [key: string]: string } = {
    'WMT': 'Walmart Inc.',
    'BJ': "BJ's Wholesale Club",
    'DG': 'Dollar General',
    'DLTR': 'Dollar Tree',
    'TGT': 'Target Corporation',
    'COST': 'Costco'
  };
  
  return companyNames[ticker] || ticker;
}
