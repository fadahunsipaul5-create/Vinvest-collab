// Chart data helper functions for Business Performance page
// Extracts data from company mock data files for different period types
// Handles 5 different data structures across companies

import { WALMART_AVERAGES_MAP, WALMART_CAGR_MAP } from '../data/companyDataIndex';

export interface ChartDataPoint {
  year?: number;
  period?: string;
  value: number;
  isHistorical?: boolean;
  company?: string;
}

export interface AnnualDataPoint {
  year: number;
  value: number;
  isHistorical: boolean;
}

export interface AverageDataPoint {
  period: string;
  value: number;
}

export interface CAGRDataPoint {
  period: string;
  value: number;
}

// Helper function to find metric data in company tables (handles inverted structure)
export function findMetricInTables(companyData: any, metricName: string): any {
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
    'balanceSheetCommonSize'
  ];

  for (const tableName of tablesToCheck) {
    if (companyData[tableName]) {
      // Check if data is in correct format: metric: { year: value }
      if (companyData[tableName][metricName]) {
        return companyData[tableName][metricName];
      }
      
      // Check if data is in inverted format: year: { metric: value }
      // If so, transform it to correct format
      const years = Object.keys(companyData[tableName]);
      if (years.length > 0 && typeof companyData[tableName][years[0]] === 'object') {
        // This is inverted structure, transform it
        const transformedData: any = {};
        years.forEach(year => {
          // Skip Last*_AVG and Last*_CAGR keys (they're not years)
          if (!year.startsWith('Last') && companyData[tableName][year][metricName] !== undefined) {
            transformedData[year] = companyData[tableName][year][metricName];
          }
        });
        
        if (Object.keys(transformedData).length > 0) {
          return transformedData;
        }
      }
    }
  }

  return null;
}

// Helper function to find averages for a specific metric across all data structures
function findAveragesForMetric(companyData: any, metricName: string, ticker: string): any {
  const tablesToCheck = [
    'incomeStatement', 'balanceSheet', 'cashFlow', 'nopat', 
    'investedCapital', 'freeCashFlow', 'operationalPerformance', 
    'financingHealth', 'incomeStatementCommonSize', 'balanceSheetCommonSize'
  ];

  // Structure 1 (WMT): Check separate exports via WALMART_AVERAGES_MAP
  if (ticker === 'WMT') {
    for (const tableName of Object.keys(WALMART_AVERAGES_MAP)) {
      const tableAverages = WALMART_AVERAGES_MAP[tableName as keyof typeof WALMART_AVERAGES_MAP];
      if (tableAverages && (tableAverages as any)[metricName]) {
        return (tableAverages as any)[metricName];
      }
    }
  }

  // Structure 2 (BJ): Check table.Last1Y_AVG.metric
  for (const tableName of tablesToCheck) {
    const table = companyData[tableName];
    if (table && table.Last1Y_AVG && table.Last1Y_AVG[metricName] !== undefined) {
      // Found it! Extract all periods
      const result: any = {};
      ['Last1Y_AVG', 'Last2Y_AVG', 'Last3Y_AVG', 'Last4Y_AVG', 'Last5Y_AVG', 'Last10Y_AVG', 'Last15Y_AVG'].forEach(key => {
        if (table[key] && table[key][metricName] !== undefined) {
          result[key] = table[key][metricName];
        }
      });
      return result;
    }
  }

  // Structure 3 (DG): Check tableAverages.metric.Last1Y_AVG
  const averagesSections = [
    'incomeStatementAverages', 'balanceSheetAverages', 'cashFlowAverages',
    'nopatAverages', 'investedCapitalAverages', 'freeCashFlowAverages',
    'operationalPerformanceAverages', 'financingHealthAverages'
  ];
  
  for (const sectionName of averagesSections) {
    if (companyData[sectionName] && companyData[sectionName][metricName]) {
      return companyData[sectionName][metricName];
    }
  }

  // Structure 4 & 5 (DLTR/TGT): Check averages.tableName.Last1Y_AVG.metric
  if (companyData.averages) {
    for (const tableName of tablesToCheck) {
      const tableAverages = companyData.averages[tableName];
      if (tableAverages && tableAverages.Last1Y_AVG && tableAverages.Last1Y_AVG[metricName] !== undefined) {
        // Found it! Extract all periods
        const result: any = {};
        ['Last1Y_AVG', 'Last2Y_AVG', 'Last3Y_AVG', 'Last4Y_AVG', 'Last5Y_AVG', 'Last10Y_AVG', 'Last15Y_AVG'].forEach(key => {
          if (tableAverages[key] && tableAverages[key][metricName] !== undefined) {
            result[key] = tableAverages[key][metricName];
          }
        });
        return result;
      }
    }
  }

  return null;
}

// Helper function to find CAGRs for a specific metric across all data structures
function findCAGRForMetric(companyData: any, metricName: string, ticker: string): any {
  const tablesToCheck = [
    'incomeStatement', 'balanceSheet', 'cashFlow', 'nopat', 
    'investedCapital', 'freeCashFlow', 'operationalPerformance', 
    'financingHealth', 'incomeStatementCommonSize', 'balanceSheetCommonSize'
  ];

  // Structure 1 (WMT): Check separate exports via WALMART_CAGR_MAP
  if (ticker === 'WMT') {
    for (const tableName of Object.keys(WALMART_CAGR_MAP)) {
      const tableCAGR = WALMART_CAGR_MAP[tableName as keyof typeof WALMART_CAGR_MAP];
      if (tableCAGR && (tableCAGR as any)[metricName]) {
        return (tableCAGR as any)[metricName];
      }
    }
  }

  // Structure 2 (BJ): Check table.Last1Y_CAGR.metric
  for (const tableName of tablesToCheck) {
    const table = companyData[tableName];
    if (table && table.Last1Y_CAGR && table.Last1Y_CAGR[metricName] !== undefined) {
      // Found it! Extract all periods
      const result: any = {};
      ['Last1Y_CAGR', 'Last2Y_CAGR', 'Last3Y_CAGR', 'Last4Y_CAGR', 'Last5Y_CAGR', 'Last10Y_CAGR', 'Last15Y_CAGR'].forEach(key => {
        if (table[key] && table[key][metricName] !== undefined) {
          result[key] = table[key][metricName];
        }
      });
      return result;
    }
  }

  // Structure 3 (DG): Check tableCAGR.metric.Last1Y_CAGR
  const cagrSections = [
    'incomeStatementCAGR', 'balanceSheetCAGR', 'cashFlowCAGR',
    'nopatCAGR', 'investedCapitalCAGR', 'freeCashFlowCAGR',
    'operationalPerformanceCAGR', 'financingHealthCAGR'
  ];
  
  for (const sectionName of cagrSections) {
    if (companyData[sectionName] && companyData[sectionName][metricName]) {
      return companyData[sectionName][metricName];
    }
  }

  // Structure 4 & 5 (DLTR/TGT): Check cagr.tableName.Last1Y_CAGR.metric
  if (companyData.cagr) {
    for (const tableName of tablesToCheck) {
      const tableCAGR = companyData.cagr[tableName];
      if (tableCAGR && tableCAGR.Last1Y_CAGR && tableCAGR.Last1Y_CAGR[metricName] !== undefined) {
        // Found it! Extract all periods
        const result: any = {};
        ['Last1Y_CAGR', 'Last2Y_CAGR', 'Last3Y_CAGR', 'Last4Y_CAGR', 'Last5Y_CAGR', 'Last10Y_CAGR', 'Last15Y_CAGR'].forEach(key => {
          if (tableCAGR[key] && tableCAGR[key][metricName] !== undefined) {
            result[key] = tableCAGR[key][metricName];
          }
        });
        return result;
      }
    }
  }

  return null;
}

// Extract annual data (2011-2035) for a metric
export function getAnnualData(companyTicker: string, metricName: string, companyData: any): AnnualDataPoint[] {
  const metricData = findMetricInTables(companyData, metricName);
  
  if (!metricData) {
    console.warn(`Metric ${metricName} not found for company ${companyTicker}`);
    return [];
  }

  const years = Array.from({ length: 25 }, (_, i) => 2011 + i); // 2011-2035
  
  // Only return years with actual data (exclude undefined, null, and NaN)
  // Note: Legitimate 0 values are kept
  return years
    .filter(year => {
      const value = metricData[year];
      return value !== undefined && 
             value !== null && 
             typeof value === 'number' && 
             !isNaN(value);
    })
    .map(year => ({
      year,
      value: metricData[year],
      isHistorical: year <= 2024
    }));
}

// Extract average data (Last AVG values) for a metric
export function getAverageData(companyTicker: string, metricName: string, companyData: any): AverageDataPoint[] {
  const metricData = findAveragesForMetric(companyData, metricName, companyTicker);
  
  if (!metricData) {
    console.warn(`Average data for metric ${metricName} not found for company ${companyTicker}`);
    return [];
  }

  const averagePeriods = [
    { key: 'Last1Y_AVG', label: '1Y' },
    { key: 'Last2Y_AVG', label: '2Y' },
    { key: 'Last3Y_AVG', label: '3Y' },
    { key: 'Last4Y_AVG', label: '4Y' },
    { key: 'Last5Y_AVG', label: '5Y' },
    { key: 'Last10Y_AVG', label: '10Y' },
    { key: 'Last15Y_AVG', label: '15Y' }
  ];

  // Only return periods with actual data (exclude undefined, null, and NaN)
  // Note: Legitimate 0 values are kept
  return averagePeriods
    .filter(({ key }) => {
      const value = metricData[key];
      return value !== undefined && 
             value !== null && 
             typeof value === 'number' && 
             !isNaN(value);
    })
    .map(({ key, label }) => ({
      period: label,
      value: metricData[key]
    }));
}

// Extract CAGR data for a metric
export function getCAGRData(companyTicker: string, metricName: string, companyData: any): CAGRDataPoint[] {
  const metricData = findCAGRForMetric(companyData, metricName, companyTicker);
  
  if (!metricData) {
    console.warn(`CAGR data for metric ${metricName} not found for company ${companyTicker}`);
    return [];
  }

  const cagrPeriods = [
    { key: 'Last1Y_CAGR', label: '1Y' },
    { key: 'Last2Y_CAGR', label: '2Y' },
    { key: 'Last3Y_CAGR', label: '3Y' },
    { key: 'Last4Y_CAGR', label: '4Y' },
    { key: 'Last5Y_CAGR', label: '5Y' },
    { key: 'Last10Y_CAGR', label: '10Y' },
    { key: 'Last15Y_CAGR', label: '15Y' }
  ];

  // Only return periods with actual data (exclude undefined, null, and NaN)
  // Note: Legitimate 0 values are kept
  return cagrPeriods
    .filter(({ key }) => {
      const value = metricData[key];
      return value !== undefined && 
             value !== null && 
             typeof value === 'number' && 
             !isNaN(value);
    })
    .map(({ key, label }) => ({
      period: label,
      value: metricData[key]
    }));
}

// Format data for recharts library
export function formatDataForChart(data: any[], periodType: 'Annual' | 'Average' | 'CAGR'): any {
  if (periodType === 'Annual') {
    // For annual data, create two series: historical and future
    const historical = data.filter(d => d.isHistorical);
    const future = data.filter(d => !d.isHistorical);
    
    return {
      historical: historical.map(d => ({ year: d.year, value: d.value })),
      future: future.map(d => ({ year: d.year, value: d.value }))
    };
  } else {
    // For Average and CAGR, return as single series
    return data.map(d => ({
      period: d.period,
      value: d.value
    }));
  }
}

// Generate color palette for multiple metrics
export function generateColorPalette(count: number): string[] {
  const baseColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
    '#6366f1'  // indigo
  ];
  
  // If we need more colors than we have, repeat the palette
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}

// Get color scheme for charts
export function getChartColors(periodType: 'Annual' | 'Average' | 'CAGR', seriesIndex: number = 0): string {
  const colors = {
    Annual: {
      historical: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
      future: ['#93c5fd', '#6ee7b7', '#fcd34d', '#fca5a5', '#c4b5fd', '#67e8f9']
    },
    Average: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    CAGR: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4']
  };

  if (periodType === 'Annual') {
    return seriesIndex === 0 ? colors.Annual.historical[0] : colors.Annual.future[0];
  }
  
  return colors[periodType][seriesIndex % colors[periodType].length];
}

// Calculate industry averages for multiple companies
export function calculateIndustryAverages(
  companies: string[], 
  metricName: string, 
  companyDataMap: any,
  periodType: 'Average' | 'CAGR'
): any[] {
  const allData: any[] = [];
  
  companies.forEach(companyTicker => {
    const companyData = companyDataMap[companyTicker];
    if (!companyData) return;
    
    let data: any[] = [];
    if (periodType === 'Average') {
      data = getAverageData(companyTicker, metricName, companyData);
    } else if (periodType === 'CAGR') {
      data = getCAGRData(companyTicker, metricName, companyData);
    }
    
    data.forEach(point => {
      allData.push({
        ...point,
        company: companyTicker
      });
    });
  });
  
  // Group by period and calculate average
  const groupedData: { [key: string]: number[] } = {};
  allData.forEach(point => {
    if (!groupedData[point.period]) {
      groupedData[point.period] = [];
    }
    groupedData[point.period].push(point.value);
  });
  
  return Object.entries(groupedData).map(([period, values]) => ({
    period,
    value: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length
  }));
}
