// Financing Health Table Calculation Utilities
// Based on the Financing Health table structure and formulas

export interface FinancingHealthData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface NOPATData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface IncomeStatementData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface InvestedCapitalData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface BalanceSheetData {
  [year: number]: {
    [field: string]: number | string;
  };
}

// Helper function to safely get field values
const getFieldValue = (data: any, year: number, field: string): number => {
  if (!data || !data[year] || data[year][field] === undefined || data[year][field] === null) {
    return 0;
  }
  const value = data[year][field];
  return typeof value === 'string' ? parseFloat(value) || 0 : Number(value) || 0;
};

// Get NOPAT field value
const getNOPATField = (nopatData: NOPATData, year: number, field: string): number => {
  return getFieldValue(nopatData, year, field);
};

// Get income statement field value
const getIncomeStatementField = (incomeStatementData: IncomeStatementData, year: number, field: string): number => {
  return getFieldValue(incomeStatementData, year, field);
};

// Get invested capital field value
const getInvestedCapitalField = (investedCapitalData: InvestedCapitalData, year: number, field: string): number => {
  return getFieldValue(investedCapitalData, year, field);
};

// Get balance sheet field value
const getBalanceSheetField = (balanceSheetData: BalanceSheetData, year: number, field: string): number => {
  return getFieldValue(balanceSheetData, year, field);
};

// Helper function to calculate ratio safely
const calculateRatio = (numerator: number, denominator: number): number => {
  if (denominator === 0 || !isFinite(denominator)) {
    return 0;
  }
  return numerator / denominator;
};

// 1. Adjusted EBITDA
export const calculateAdjustedEBITDA = (
  year: number,
  nopatData?: NOPATData
): number => {
  if (!nopatData) {
    console.warn(`Missing NOPAT data for Adjusted EBITDA calculation for year ${year}`);
    return 0;
  }

  try {
    const ebitaAdjusted = getNOPATField(nopatData, year, 'EBITAAdjusted');
    const depreciation = getNOPATField(nopatData, year, 'Depreciation');
    
    const result = ebitaAdjusted + depreciation;
    console.debug(`Adjusted EBITDA for ${year}: ${ebitaAdjusted} + ${depreciation} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Adjusted EBITDA for year ${year}:`, error);
    return 0;
  }
};

// 2. Interest Expense
export const calculateInterestExpense = (
  year: number,
  incomeStatementData?: IncomeStatementData,
  nopatData?: NOPATData
): number => {
  if (!incomeStatementData || !nopatData) {
    console.warn(`Missing data for Interest Expense calculation for year ${year}`);
    return 0;
  }

  try {
    const interestExpense = getIncomeStatementField(incomeStatementData, year, 'InterestExpense');
    const operatingLeaseInterest = getNOPATField(nopatData, year, 'OperatingLeaseInterest');
    const variableLeaseInterest = getNOPATField(nopatData, year, 'VariableLeaseInterest');
    
    const result = interestExpense + operatingLeaseInterest + variableLeaseInterest;
    console.debug(`Interest Expense for ${year}: ${interestExpense} + ${operatingLeaseInterest} + ${variableLeaseInterest} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Interest Expense for year ${year}:`, error);
    return 0;
  }
};

// 3. EBITA to Interest
export const calculateEBITAToInterest = (
  _data: FinancingHealthData,
  year: number,
  nopatData?: NOPATData,
  financingHealthData?: FinancingHealthData
): number => {
  if (!nopatData || !financingHealthData) {
    console.warn(`Missing data for EBITA to Interest calculation for year ${year}`);
    return 0;
  }

  try {
    const ebitaAdjusted = getNOPATField(nopatData, year, 'EBITAAdjusted');
    const interestExpense = getFieldValue(financingHealthData, year, 'InterestExpense');
    
    const result = calculateRatio(ebitaAdjusted, interestExpense);
    console.debug(`EBITA to Interest for ${year}: ${ebitaAdjusted} / ${interestExpense} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating EBITA to Interest for year ${year}:`, error);
    return 0;
  }
};

// 4. EBITDA to Interest
export const calculateEBITDAToInterest = (
  _data: FinancingHealthData,
  year: number,
  nopatData?: NOPATData,
  financingHealthData?: FinancingHealthData
): number => {
  if (!nopatData || !financingHealthData) {
    console.warn(`Missing data for EBITDA to Interest calculation for year ${year}`);
    return 0;
  }

  try {
    const ebitaAdjusted = getNOPATField(nopatData, year, 'EBITAAdjusted');
    const depreciation = getNOPATField(nopatData, year, 'Depreciation');
    const interestExpense = getFieldValue(financingHealthData, year, 'InterestExpense');
    
    const ebitda = ebitaAdjusted + depreciation;
    const result = calculateRatio(ebitda, interestExpense);
    console.debug(`EBITDA to Interest for ${year}: (${ebitaAdjusted} + ${depreciation}) / ${interestExpense} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating EBITDA to Interest for year ${year}:`, error);
    return 0;
  }
};

// 5. Debt to EBITA
export const calculateDebtToEBITA = (
  _data: FinancingHealthData,
  year: number,
  investedCapitalData?: InvestedCapitalData,
  nopatData?: NOPATData
): number => {
  if (!investedCapitalData || !nopatData) {
    console.warn(`Missing data for Debt to EBITA calculation for year ${year}`);
    return 0;
  }

  try {
    const debt = getInvestedCapitalField(investedCapitalData, year, 'Debt');
    const ebitaAdjusted = getNOPATField(nopatData, year, 'EBITAAdjusted');
    
    const result = calculateRatio(debt, ebitaAdjusted);
    console.debug(`Debt to EBITA for ${year}: ${debt} / ${ebitaAdjusted} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Debt to EBITA for year ${year}:`, error);
    return 0;
  }
};

// 6. Debt to EBITDA
export const calculateDebtToEBITDA = (
  _data: FinancingHealthData,
  year: number,
  investedCapitalData?: InvestedCapitalData,
  financingHealthData?: FinancingHealthData
): number => {
  if (!investedCapitalData || !financingHealthData) {
    console.warn(`Missing data for Debt to EBITDA calculation for year ${year}`);
    return 0;
  }

  try {
    const debt = getInvestedCapitalField(investedCapitalData, year, 'Debt');
    const adjustedEBITDA = getFieldValue(financingHealthData, year, 'AdjustedEBITDA');
    
    const result = calculateRatio(debt, adjustedEBITDA);
    console.debug(`Debt to EBITDA for ${year}: ${debt} / ${adjustedEBITDA} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Debt to EBITDA for year ${year}:`, error);
    return 0;
  }
};

// 7. Debt to Equity
export const calculateDebtToEquity = (
  _data: FinancingHealthData,
  year: number,
  investedCapitalData?: InvestedCapitalData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!investedCapitalData || !balanceSheetData) {
    console.warn(`Missing data for Debt to Equity calculation for year ${year}`);
    return 0;
  }

  try {
    const debt = getInvestedCapitalField(investedCapitalData, year, 'Debt');
    const equity = getBalanceSheetField(balanceSheetData, year, 'Equity');
    
    const result = calculateRatio(debt, equity);
    console.debug(`Debt to Equity for ${year}: ${debt} / ${equity} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Debt to Equity for year ${year}:`, error);
    return 0;
  }
};

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  AdjustedEBITDA: calculateAdjustedEBITDA,
  InterestExpense: calculateInterestExpense,
  EBITAToInterest: calculateEBITAToInterest,
  EBITDAToInterest: calculateEBITDAToInterest,
  DebtToEBITA: calculateDebtToEBITA,
  DebtToEBITDA: calculateDebtToEBITDA,
  DebtToEquity: calculateDebtToEquity,
};

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  EBITAAdjusted: ['AdjustedEBITDA', 'EBITAToInterest', 'EBITDAToInterest', 'DebtToEBITA'],
  Depreciation: ['AdjustedEBITDA', 'EBITDAToInterest'],
  InterestExpense: ['InterestExpense', 'EBITAToInterest', 'EBITDAToInterest'],
  OperatingLeaseInterest: ['InterestExpense'],
  VariableLeaseInterest: ['InterestExpense'],
  Debt: ['DebtToEBITA', 'DebtToEBITDA', 'DebtToEquity'],
  Equity: ['DebtToEquity'],
  AdjustedEBITDA: ['DebtToEBITDA'],
};

// Calculate all fields for a given year
export const calculateAllFields = (
  data: FinancingHealthData,
  year: number,
  nopatData?: NOPATData,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData,
  balanceSheetData?: BalanceSheetData
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values to ensure proper cascading
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate fields in order (base fields first, then dependent fields)
  const calculationOrder = [
    'AdjustedEBITDA',
    'InterestExpense',
    'EBITAToInterest',
    'EBITDAToInterest',
    'DebtToEBITA',
    'DebtToEBITDA',
    'DebtToEquity'
  ];
  
  for (const fieldName of calculationOrder) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        let value: number;
        if (fieldName === 'AdjustedEBITDA') {
          value = (calcFunction as any)(updatedData, year, nopatData);
        } else if (fieldName === 'InterestExpense') {
          value = (calcFunction as any)(updatedData, year, incomeStatementData, nopatData);
        } else if (['EBITAToInterest', 'EBITDAToInterest'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, nopatData, updatedData);
        } else if (fieldName === 'DebtToEBITA') {
          value = (calcFunction as any)(updatedData, year, investedCapitalData, nopatData);
        } else if (fieldName === 'DebtToEBITDA') {
          value = (calcFunction as any)(updatedData, year, investedCapitalData, updatedData);
        } else if (fieldName === 'DebtToEquity') {
          value = (calcFunction as any)(updatedData, year, investedCapitalData, balanceSheetData);
        } else {
          value = (calcFunction as any)(updatedData, year);
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
  data: FinancingHealthData,
  year: number,
  changedField: string,
  nopatData?: NOPATData,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData,
  balanceSheetData?: BalanceSheetData
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Get dependent fields for the changed field
  const dependentFields = dependencies[changedField as keyof typeof dependencies] || [];
  
  for (const fieldName of dependentFields) {
    if (fieldName in calculatedFields) {
      const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
      try {
        let value: number;
        if (fieldName === 'AdjustedEBITDA') {
          value = (calcFunction as any)(updatedData, year, nopatData);
        } else if (fieldName === 'InterestExpense') {
          value = (calcFunction as any)(updatedData, year, incomeStatementData, nopatData);
        } else if (['EBITAToInterest', 'EBITDAToInterest'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, nopatData, updatedData);
        } else if (fieldName === 'DebtToEBITA') {
          value = (calcFunction as any)(updatedData, year, investedCapitalData, nopatData);
        } else if (fieldName === 'DebtToEBITDA') {
          value = (calcFunction as any)(updatedData, year, investedCapitalData, updatedData);
        } else if (fieldName === 'DebtToEquity') {
          value = (calcFunction as any)(updatedData, year, investedCapitalData, balanceSheetData);
        } else {
          value = (calcFunction as any)(updatedData, year);
        }
        
        calculated[fieldName] = value;
        // Update for cascading calculations
        updatedData[year][fieldName] = value;
        console.debug(`Recalculated ${fieldName} for ${year}: ${value}`);
      } catch (error) {
        console.error(`Error recalculating ${fieldName} for year ${year}:`, error);
      }
    }
  }
  
  return calculated;
};

// Check if a field is a calculated field
export const isCalculatedField = (fieldName: string): boolean => {
  return fieldName in calculatedFields;
};

// Check if a field is an input field (Financing Health fields are all calculated from other data)
export const isInputField = (_fieldName: string): boolean => {
  // Financing Health fields are all calculated from NOPAT, Income Statement, Invested Capital, and Balance Sheet data
  // No fields should be directly editable in the Financing Health table
  return false;
};
