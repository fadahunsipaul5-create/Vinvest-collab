import baseUrl from '../components/api';

export interface MultiplesData {
  ticker: string;
  numerators: {
    enterpriseValue_Fundamental: number | string;
    marketCap_Fundamental: number | string;
    enterpriseValue_Current: number | string;
    marketCap_Current: number | string;
  };
  denominators: {
    [period: string]: {
      grossMargin?: number | string;
      operatingIncome?: number | string;
      pretaxIncome?: number | string;
      netIncome?: number | string;
      revenue?: number | string;
      ebitaAdjusted?: number | string;
      ebitdaAdjusted?: number | string;
      netOperatingProfitAfterTaxes?: number | string;
    };
  };
  roicMetrics: {
    [period: string]: {
      excludingGoodwill?: number | string;
      includingGoodwill?: number | string;
    };
  };
  revenueGrowth: {
    [period: string]: number | string;
  };
}

const PERIODS = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y', '15Y'];

// Load data for a single company from database API
async function loadCompanyData(ticker: string): Promise<MultiplesData> {
  // Fetch from Django REST API
  const apiUrl = `${baseUrl}/api/multiples/${ticker}/`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      // If 404, company doesn't have multiples data yet - return empty data
      if (response.status === 404) {
        console.warn(`Multiples data not found for ${ticker}`);
        return getEmptyData(ticker);
      }
      console.warn(`Failed to load data for ${ticker}: ${response.status}`);
      return getEmptyData(ticker);
    }
    
    const apiData = await response.json();
    
    console.log(`${ticker}: Loaded data from API`, apiData);
    
    // Map API response directly to MultiplesData structure
    const multiplesData: MultiplesData = {
      ticker: apiData.ticker || ticker,
      numerators: apiData.numerators || {},
      denominators: apiData.denominators || {},
      roicMetrics: apiData.roicMetrics || {},
      revenueGrowth: apiData.revenueGrowth || {}
    };
    
    return multiplesData;
    
    /* OLD CSV PARSING CODE - NO LONGER NEEDED
    const oldData: MultiplesData = {
      ticker,
      numerators: {
        enterpriseValue_Fundamental: '',
        marketCap_Fundamental: '',
        enterpriseValue_Current: '',
        marketCap_Current: '',
      },
      denominators: {},
      roicMetrics: {},
      revenueGrowth: {},
    };
    
    // Initialize denominator periods
    for (const period of PERIODS) {
      data.denominators[period] = {};
      data.roicMetrics[period] = {};
    }
    
    // Parse each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma, but only take first 3 parts (Name, Type, Value)
      // This handles cases where Value might contain commas
      const parts = line.split(',');
      if (parts.length < 3) continue;
      
      const name = parts[0];
      const type = parts[1];
      const value = parts.slice(2).join(','); // Rejoin in case value had commas
      
      if (!name || !type) continue;
      
      const parsedValue = parseValue(value || '');
      
      // Numerators
      if (type === 'Numerator') {
        if (name === 'EnterpriseValue_Fundamental') {
          data.numerators.enterpriseValue_Fundamental = parsedValue;
          if (ticker === 'TGT') console.log(`TGT EV_Fund: "${value}" -> ${parsedValue}`);
        } else if (name === 'MarketCap_Fundamental') {
          data.numerators.marketCap_Fundamental = parsedValue;
          if (ticker === 'TGT') console.log(`TGT MC_Fund: "${value}" -> ${parsedValue}`);
        } else if (name === 'EnterpriseValue_Current') {
          data.numerators.enterpriseValue_Current = parsedValue;
        } else if (name === 'MarketCap_Current') {
          data.numerators.marketCap_Current = parsedValue;
        }
      }
      
      // Denominators
      else if (type === 'Denominator') {
        for (const period of PERIODS) {
          const suffix = `_Last${period}_AVG`;
          if (name.endsWith(suffix)) {
            const metricName = name.replace(suffix, '');
            
            // Map CSV names to our data structure keys
            let metricKey: string;
            if (metricName === 'GrossMargin') metricKey = 'grossMargin';
            else if (metricName === 'OperatingIncome') metricKey = 'operatingIncome';
            else if (metricName === 'PretaxIncome') metricKey = 'pretaxIncome';
            else if (metricName === 'NetIncome') metricKey = 'netIncome';
            else if (metricName === 'Revenue') metricKey = 'revenue';
            else if (metricName === 'EBITAAdjusted') metricKey = 'ebitaAdjusted';
            else if (metricName === 'EBITDAAdjusted') metricKey = 'ebitdaAdjusted';
            else if (metricName === 'NetOperatingProfitAfterTaxes') metricKey = 'netOperatingProfitAfterTaxes';
            else continue;
            
            (data.denominators[period] as any)[metricKey] = parsedValue;
          }
        }
      }
      
      // ROIC metrics
      else if (type === 'X_axis') {
        for (const period of PERIODS) {
          const suffixExcl = `ROICExcludingGoodwill_Last${period}_AVG`;
          const suffixIncl = `ROICIncludingGoodwill_Last${period}_AVG`;
          
          if (name === suffixExcl) {
            data.roicMetrics[period].excludingGoodwill = parsedValue;
          } else if (name === suffixIncl) {
            data.roicMetrics[period].includingGoodwill = parsedValue;
          }
        }
      }
      
      // Revenue growth
      else if (type === 'Y_axis') {
        for (const period of PERIODS) {
          if (name === `RevenueGrowth_Last${period}_CAGR`) {
            data.revenueGrowth[period] = parsedValue;
          }
        }
      }
    }
    
    */
  } catch (error) {
    console.error(`Error loading data for ${ticker}:`, error);
    return getEmptyData(ticker);
  }
}

function getEmptyData(ticker: string): MultiplesData {
  const emptyData: MultiplesData = {
    ticker,
    numerators: {
      enterpriseValue_Fundamental: '',
      marketCap_Fundamental: '',
      enterpriseValue_Current: '',
      marketCap_Current: '',
    },
    denominators: {},
    roicMetrics: {},
    revenueGrowth: {},
  };
  
  for (const period of PERIODS) {
    emptyData.denominators[period] = {};
    emptyData.roicMetrics[period] = {};
  }
  
  return emptyData;
}

// Fetch available companies from API
async function fetchAvailableCompanies(): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/sec/central/companies`);
    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.status}`);
    }
    const data = await response.json();
    
    // Handle both paginated (results) and non-paginated responses
    const companiesList = data.results || data;
    
    // Extract tickers from company objects
    const tickers = companiesList.map((company: any) => company.ticker).filter(Boolean);
    
    return tickers;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

// Load all company data
export async function loadAllMultiplesData(): Promise<{ [ticker: string]: MultiplesData }> {
  const results: { [ticker: string]: MultiplesData } = {};
  
  // Fetch companies dynamically from API
  const companies = await fetchAvailableCompanies();
  
  if (companies.length === 0) {
    console.warn('No companies found from API');
    return results;
  }
  
  console.log(`Loading multiples data for ${companies.length} companies`);
  
  // Load multiples data for all companies (some may not have multiples data yet)
  await Promise.all(
    companies.map(async (ticker) => {
      const data = await loadCompanyData(ticker);
      // Only include companies that have at least some data (not completely empty)
      if (data.numerators && Object.keys(data.numerators).length > 0) {
        results[ticker] = data;
      }
    })
  );
  
  console.log(`Successfully loaded multiples data for ${Object.keys(results).length} companies`);
  
  return results;
}

// Get safe numeric value for calculations
export function getNumericValue(value: number | string | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;
  if (typeof value === 'string') {
    // Empty string means missing data
    if (value === '' || value.trim() === '') return null;
    if (value === 'inf' || value === 'Inf' || value === 'INF') return Infinity;
    if (value === 'Call_API') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Calculate multiple safely
export function calculateMultiple(numerator: number | string | undefined, denominator: number | string | undefined): number | string | null {
  const num = getNumericValue(numerator);
  const den = getNumericValue(denominator);
  
  // If either is null (missing data), return null
  if (num === null || den === null) return null;
  
  // If denominator is 0, can't calculate
  if (den === 0) return 'N/A';
  
  // If either is infinity, return inf
  if (!isFinite(num) || !isFinite(den)) return 'inf';
  
  return num / den;
}

