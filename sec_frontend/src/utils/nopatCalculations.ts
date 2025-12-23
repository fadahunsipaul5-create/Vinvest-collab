// NOPAT Calculation Utilities
// Based on the Python backend logic in backend/sec_app_2/calculators/nopat.py

interface NOPATData {
  [year: number]: {
    [field: string]: number | string;
  };
}

interface BalanceSheetData {
  [year: number]: {
    [field: string]: number | string;
  };
}

interface IncomeStatementData {
  [year: number]: {
    [field: string]: number | string;
  };
}

interface InvestedCapitalData {
  [year: number]: {
    [field: string]: number | string;
  };
}

// Convert value to number, handling null/undefined
const toNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Get field from income statement (for Revenue, CostOfRevenue, etc.)
export const getIncomeStatementField = (
  incomeStatementData: IncomeStatementData, 
  year: number, 
  fieldName: string
): number => {
  return toNumber(incomeStatementData?.[year]?.[fieldName]);
};

// Calculate EBITA Unadjusted: Revenue - CostOfRevenue - SellingGeneralAndAdministration - Depreciation
export const calculateEBITAUnadjusted = (
  data: NOPATData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  try {
    const yearData = data[year] || {};
    
    // Try to get from NOPAT data first, then from income statement
    const revenue = toNumber(yearData.Revenue) || getIncomeStatementField(incomeStatementData || {}, year, 'Revenue');
    const costOfRevenue = toNumber(yearData.CostOfRevenue) || getIncomeStatementField(incomeStatementData || {}, year, 'CostOfRevenue');
    const sga = toNumber(yearData.SellingGeneralAdministrative) || getIncomeStatementField(incomeStatementData || {}, year, 'SellingGeneralAdministrative');
    const depreciation = toNumber(yearData.Depreciation) || getIncomeStatementField(incomeStatementData || {}, year, 'Depreciation');
    
    const result = revenue - costOfRevenue - sga - depreciation;
    console.debug(`EBITA Unadjusted for ${year}: ${revenue} - ${costOfRevenue} - ${sga} - ${depreciation} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating EBITA Unadjusted for year ${year}:`, error);
    return 0;
  }
};

// Calculate Operating Lease Interest: (Prior Year Operating Lease Liabilities) × (Leases Discount Rate %)
export const calculateOperatingLeaseInterest = (
  data: NOPATData,
  year: number,
  investedCapitalData?: InvestedCapitalData,
  incomeStatementData?: IncomeStatementData
): number => {
  try {
    const priorYear = year - 1;
    const priorCapData = investedCapitalData?.[priorYear] || {};
    const currentIncomeData = incomeStatementData?.[year] || {};
    const currentData = data[year] || {};
    
    const operatingLeaseLiabilities = toNumber(priorCapData.OperatingLeaseLiabilities);
    const leasesDiscountRate = toNumber(currentIncomeData.LeasesDiscountRate) || toNumber(currentData.LeasesDiscountRate);
    
    const result = operatingLeaseLiabilities * (leasesDiscountRate / 100);
    console.debug(`Operating Lease Interest for ${year}: ${operatingLeaseLiabilities} * ${leasesDiscountRate}% = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Operating Lease Interest for year ${year}:`, error);
    return 0;
  }
};

// Calculate Variable Lease Interest: (Variable Lease Assets) × (Leases Discount Rate %)
export const calculateVariableLeaseInterest = (
  data: NOPATData,
  year: number,
  balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
): number => {
  try {
    const balanceSheetYearData = balanceSheetData?.[year] || {};
    const currentIncomeData = incomeStatementData?.[year] || {};
    const currentData = data[year] || {};
    
    const variableLeaseAssets = toNumber(balanceSheetYearData.VariableLeaseAssets);
    const leasesDiscountRate = toNumber(currentIncomeData.LeasesDiscountRate) || toNumber(currentData.LeasesDiscountRate);
    
    const result = variableLeaseAssets * (leasesDiscountRate / 100);
    console.debug(`Variable Lease Interest for ${year}: ${variableLeaseAssets} * ${leasesDiscountRate}% = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Variable Lease Interest for year ${year}:`, error);
    return 0;
  }
};

// Calculate EBITA Adjusted: EBITA_Unadjusted + OperatingLeaseInterest + VariableLeaseInterest
export const calculateEBITAAdjusted = (
  data: NOPATData,
  year: number,
  _investedCapitalData?: InvestedCapitalData,
  _balanceSheetData?: BalanceSheetData,
  _incomeStatementData?: IncomeStatementData
): number => {
  try {
    const yearData = data[year] || {};
    const ebitaUnadjusted = toNumber(yearData.EBITA_Unadjusted);
    const operatingLeaseInterest = toNumber(yearData.OperatingLeaseInterest);
    const variableLeaseInterest = toNumber(yearData.VariableLeaseInterest);
    
    const result = ebitaUnadjusted + operatingLeaseInterest + variableLeaseInterest;
    console.debug(`EBITA Adjusted for ${year}: ${ebitaUnadjusted} + ${operatingLeaseInterest} + ${variableLeaseInterest} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating EBITA Adjusted for year ${year}:`, error);
    return 0;
  }
};

// Calculate NOPAT: EBITAAdjusted - TaxProvision
export const calculateNOPAT = (
  data: NOPATData,
  year: number,
  _investedCapitalData?: InvestedCapitalData,
  _balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
): number => {
  try {
    const yearData = data[year] || {};
    const ebitaAdjusted = toNumber(yearData.EBITAAdjusted);
    const taxProvision = toNumber(yearData.TaxProvision) || getIncomeStatementField(incomeStatementData || {}, year, 'TaxProvision');
    
    const result = ebitaAdjusted - taxProvision;
    console.debug(`NOPAT for ${year}: ${ebitaAdjusted} - ${taxProvision} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating NOPAT for year ${year}:`, error);
    return 0;
  }
};

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  EBITA_Unadjusted: calculateEBITAUnadjusted,
  OperatingLeaseInterest: calculateOperatingLeaseInterest,
  VariableLeaseInterest: calculateVariableLeaseInterest,
  EBITAAdjusted: calculateEBITAAdjusted,
  NOPAT: calculateNOPAT,
};

// Fields that are copied from income statement
export const incomeStatementFields = [
  'Revenue',
  'CostOfRevenue',
  'SellingGeneralAdministrative', 
  'Depreciation',
  'TaxProvision',
  'LeasesDiscountRate'
];

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  Revenue: ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
  CostOfRevenue: ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
  SellingGeneralAdministrative: ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
  Depreciation: ['EBITA_Unadjusted', 'EBITAAdjusted', 'NOPAT'],
  EBITA_Unadjusted: ['EBITAAdjusted', 'NOPAT'],
  OperatingLeaseInterest: ['EBITAAdjusted', 'NOPAT'],
  VariableLeaseInterest: ['EBITAAdjusted', 'NOPAT'],
  EBITAAdjusted: ['NOPAT'],
  TaxProvision: ['NOPAT'],
  LeasesDiscountRate: ['OperatingLeaseInterest', 'VariableLeaseInterest', 'EBITAAdjusted', 'NOPAT'],
};

// Calculate all fields for a given year
export const calculateAllFields = (
  data: NOPATData,
  year: number,
  investedCapitalData?: InvestedCapitalData,
  balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values to ensure proper cascading
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Copy income statement fields first
  if (incomeStatementData) {
    for (const field of incomeStatementFields) {
      const value = getIncomeStatementField(incomeStatementData, year, field);
      if (value !== 0) {
        calculated[field] = value;
        updatedData[year][field] = value;
      }
    }
  }
  
  // Calculate fields in dependency order
  const calculationOrder = [
    'EBITA_Unadjusted',
    'OperatingLeaseInterest', 
    'VariableLeaseInterest',
    'EBITAAdjusted',
    'NOPAT'
  ];
  
  for (const fieldName of calculationOrder) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        let value: number;
        if (fieldName === 'EBITA_Unadjusted') {
          value = calcFunction(updatedData, year, incomeStatementData);
        } else if (fieldName === 'OperatingLeaseInterest') {
          value = calculateOperatingLeaseInterest(updatedData, year, investedCapitalData, incomeStatementData);
        } else if (fieldName === 'VariableLeaseInterest') {
          value = calculateVariableLeaseInterest(updatedData, year, balanceSheetData, incomeStatementData);
        } else if (fieldName === 'EBITAAdjusted') {
          value = calculateEBITAAdjusted(updatedData, year, investedCapitalData, balanceSheetData, incomeStatementData);
        } else if (fieldName === 'NOPAT') {
          value = calculateNOPAT(updatedData, year, investedCapitalData, balanceSheetData, incomeStatementData);
        } else {
          value = calcFunction(updatedData, year);
        }
        
        calculated[fieldName] = value;
        // Update the data for subsequent calculations
        updatedData[year][fieldName] = value;
      } catch (error) {
        console.error(`Error calculating ${fieldName} for year ${year}:`, error);
        calculated[fieldName] = 0;
      }
    }
  }
  
  return calculated;
};

// Recalculate dependent fields when an input field changes
export const recalculateDependentFields = (
  data: NOPATData,
  year: number,
  changedField: string,
  investedCapitalData?: InvestedCapitalData,
  balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  const dependentFields = dependencies[changedField as keyof typeof dependencies] || [];
  
  // Update the data with the changed field for calculations
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate dependent fields in order
  for (const fieldName of dependentFields) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        let value: number;
        if (fieldName === 'EBITA_Unadjusted') {
          value = calcFunction(updatedData, year, incomeStatementData);
        } else if (fieldName === 'OperatingLeaseInterest') {
          value = calculateOperatingLeaseInterest(updatedData, year, investedCapitalData, incomeStatementData);
        } else if (fieldName === 'VariableLeaseInterest') {
          value = calculateVariableLeaseInterest(updatedData, year, balanceSheetData, incomeStatementData);
        } else if (fieldName === 'EBITAAdjusted') {
          value = calculateEBITAAdjusted(updatedData, year, investedCapitalData, balanceSheetData, incomeStatementData);
        } else if (fieldName === 'NOPAT') {
          value = calculateNOPAT(updatedData, year, investedCapitalData, balanceSheetData, incomeStatementData);
        } else {
          value = calcFunction(updatedData, year);
        }
        
        calculated[fieldName] = value;
        // Update the data for subsequent calculations
        updatedData[year][fieldName] = value;
      } catch (error) {
        console.error(`Error recalculating ${fieldName} for year ${year}:`, error);
        calculated[fieldName] = 0;
      }
    }
  }
  
  return calculated;
};

// Check if a field is a calculated field
export const isCalculatedField = (fieldName: string): boolean => {
  // All NOPAT fields are calculated - either from income statement or computed
  return fieldName in calculatedFields || incomeStatementFields.includes(fieldName) || 
         ['LeasesDiscountRate'].includes(fieldName);
};

// Check if a field is an input field (NOPAT has no input fields - all are calculated)
export const isInputField = (_fieldName: string): boolean => {
  // In NOPAT, all fields are calculated from income statement data
  // No fields should be directly editable in the NOPAT table
  return false;
};
