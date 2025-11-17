// ROIC Performance Table Calculation Utilities
// Based on backend/sec_app_2/calculators/roic_performance.py

export interface ROICPerformanceData {
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

export interface NOPATData {
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

// Get income statement field value
const getIncomeStatementField = (incomeStatementData: IncomeStatementData, year: number, field: string): number => {
  return getFieldValue(incomeStatementData, year, field);
};

// Get invested capital field value
const getInvestedCapitalField = (investedCapitalData: InvestedCapitalData, year: number, field: string): number => {
  return getFieldValue(investedCapitalData, year, field);
};

// Get NOPAT field value
const getNOPATField = (nopatData: NOPATData, year: number, field: string): number => {
  return getFieldValue(nopatData, year, field);
};

// Helper function to calculate ratio as percentage
const ratioPercentage = (numerator: number, denominator: number): number => {
  if (denominator === 0 || !isFinite(denominator)) {
    return 0;
  }
  return (numerator / denominator) * 100;
};

// 1. Cost of Revenue as Percent of Revenue
export const calculateCostOfRevenueAsPercentOfRevenue = (
  _data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) {
    console.warn(`Missing income statement data for Cost of Revenue % calculation for year ${year}`);
    return 0;
  }

  try {
    const costOfRevenue = getIncomeStatementField(incomeStatementData, year, 'CostOfRevenue');
    const revenue = getIncomeStatementField(incomeStatementData, year, 'Revenue');
    
    const result = ratioPercentage(costOfRevenue, revenue);
    console.debug(`Cost of Revenue as % of Revenue for ${year}: ${costOfRevenue} / ${revenue} * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating Cost of Revenue as % of Revenue for year ${year}:`, error);
    return 0;
  }
};

// 2. SG&A as Percent of Revenue
export const calculateSGAAsPercentOfRevenue = (
  _data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) {
    console.warn(`Missing income statement data for SG&A % calculation for year ${year}`);
    return 0;
  }

  try {
    const sga = getIncomeStatementField(incomeStatementData, year, 'SellingGeneralAdministrative');
    const revenue = getIncomeStatementField(incomeStatementData, year, 'Revenue');
    
    const result = ratioPercentage(sga, revenue);
    console.debug(`SG&A as % of Revenue for ${year}: ${sga} / ${revenue} * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating SG&A as % of Revenue for year ${year}:`, error);
    return 0;
  }
};

// 3. Operating Profit as Percent of Revenue
export const calculateOperatingProfitAsPercentOfRevenue = (
  _data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) {
    console.warn(`Missing income statement data for Operating Profit % calculation for year ${year}`);
    return 0;
  }

  try {
    const operatingIncome = getIncomeStatementField(incomeStatementData, year, 'OperatingIncome');
    const revenue = getIncomeStatementField(incomeStatementData, year, 'Revenue');
    
    const result = ratioPercentage(operatingIncome, revenue);
    console.debug(`Operating Profit as % of Revenue for ${year}: ${operatingIncome} / ${revenue} * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating Operating Profit as % of Revenue for year ${year}:`, error);
    return 0;
  }
};

// 4. Working Capital as Percent of Revenue
export const calculateWorkingCapitalAsPercentOfRevenue = (
  _data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!incomeStatementData || !investedCapitalData) {
    console.warn(`Missing data for Working Capital % calculation for year ${year}`);
    return 0;
  }

  try {
    const workingCapital = getInvestedCapitalField(investedCapitalData, year, 'OperatingWorkingCapital');
    const revenue = getIncomeStatementField(incomeStatementData, year, 'Revenue');
    
    const result = ratioPercentage(workingCapital, revenue);
    console.debug(`Working Capital as % of Revenue for ${year}: ${workingCapital} / ${revenue} * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating Working Capital as % of Revenue for year ${year}:`, error);
    return 0;
  }
};

// 5. Fixed Assets as Percent of Revenue
export const calculateFixedAssetsAsPercentOfRevenue = (
  _data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!incomeStatementData || !investedCapitalData) {
    console.warn(`Missing data for Fixed Assets % calculation for year ${year}`);
    return 0;
  }

  try {
    const ppe = getInvestedCapitalField(investedCapitalData, year, 'PropertyPlantAndEquipment');
    const operatingLeaseAssets = getInvestedCapitalField(investedCapitalData, year, 'OperatingLeaseAssets');
    const variableLeaseAssets = getInvestedCapitalField(investedCapitalData, year, 'VariableLeaseAssets');
    const financeLeaseAssets = getInvestedCapitalField(investedCapitalData, year, 'FinanceLeaseAssets');
    
    const totalFixedAssets = ppe + operatingLeaseAssets + variableLeaseAssets + financeLeaseAssets;
    const revenue = getIncomeStatementField(incomeStatementData, year, 'Revenue');
    
    const result = ratioPercentage(totalFixedAssets, revenue);
    console.debug(`Fixed Assets as % of Revenue for ${year}: ${totalFixedAssets} / ${revenue} * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating Fixed Assets as % of Revenue for year ${year}:`, error);
    return 0;
  }
};

// 6. Other Assets as Percent of Revenue
export const calculateOtherAssetsAsPercentOfRevenue = (
  _data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!incomeStatementData || !investedCapitalData) {
    console.warn(`Missing data for Other Assets % calculation for year ${year}`);
    return 0;
  }

  try {
    const otherAssets = getInvestedCapitalField(investedCapitalData, year, 'OtherAssetsNetOtherLiabilities');
    const revenue = getIncomeStatementField(incomeStatementData, year, 'Revenue');
    
    const result = ratioPercentage(otherAssets, revenue);
    console.debug(`Other Assets as % of Revenue for ${year}: ${otherAssets} / ${revenue} * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating Other Assets as % of Revenue for year ${year}:`, error);
    return 0;
  }
};

// 7. Pretax Return on Invested Capital
export const calculatePretaxReturnOnInvestedCapital = (
  _data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!incomeStatementData || !investedCapitalData) {
    console.warn(`Missing data for Pretax ROIC calculation for year ${year}`);
    return 0;
  }

  try {
    const operatingIncome = getIncomeStatementField(incomeStatementData, year, 'OperatingIncome');
    const investedCapitalExcluding = getInvestedCapitalField(investedCapitalData, year, 'InvestedCapitalExcludingGoodwill');
    
    const result = ratioPercentage(operatingIncome, investedCapitalExcluding);
    console.debug(`Pretax Return on Invested Capital for ${year}: ${operatingIncome} / ${investedCapitalExcluding} * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating Pretax Return on Invested Capital for year ${year}:`, error);
    return 0;
  }
};

// 8. Return on Invested Capital Excluding Goodwill
export const calculateReturnOnInvestedCapitalExcludingGoodwill = (
  _data: ROICPerformanceData,
  year: number,
  _incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData,
  nopatData?: NOPATData
): number => {
  if (!nopatData || !investedCapitalData) {
    console.warn(`Missing data for ROIC Excluding Goodwill calculation for year ${year}`);
    return 0;
  }

  try {
    const nopat = getNOPATField(nopatData, year, 'NOPAT');
    const currentCapital = getInvestedCapitalField(investedCapitalData, year, 'InvestedCapitalExcludingGoodwill');
    const priorYear = year - 1;
    const previousCapital = getInvestedCapitalField(investedCapitalData, priorYear, 'InvestedCapitalExcludingGoodwill');
    
    const averageCapital = (currentCapital + previousCapital) / 2;
    const result = ratioPercentage(nopat, averageCapital);
    
    console.debug(`ROIC Excluding Goodwill for ${year}: ${nopat} / ((${currentCapital} + ${previousCapital}) / 2) * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating ROIC Excluding Goodwill for year ${year}:`, error);
    return 0;
  }
};

// 9. Goodwill as Percent of Invested Capital
export const calculateGoodwillAsPercentOfInvestedCapital = (
  _data: ROICPerformanceData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!investedCapitalData) {
    console.warn(`Missing invested capital data for Goodwill % calculation for year ${year}`);
    return 0;
  }

  try {
    const goodwill = getInvestedCapitalField(investedCapitalData, year, 'Goodwill');
    const currentCapital = getInvestedCapitalField(investedCapitalData, year, 'InvestedCapitalExcludingGoodwill');
    const priorYear = year - 1;
    const previousCapital = getInvestedCapitalField(investedCapitalData, priorYear, 'InvestedCapitalExcludingGoodwill');
    
    const averageCapital = (currentCapital + previousCapital) / 2;
    const result = ratioPercentage(goodwill, averageCapital);
    
    console.debug(`Goodwill as % of Invested Capital for ${year}: ${goodwill} / ((${currentCapital} + ${previousCapital}) / 2) * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating Goodwill as % of Invested Capital for year ${year}:`, error);
    return 0;
  }
};

// 10. Return on Invested Capital Including Goodwill
export const calculateReturnOnInvestedCapitalIncludingGoodwill = (
  _data: ROICPerformanceData,
  year: number,
  investedCapitalData?: InvestedCapitalData,
  nopatData?: NOPATData
): number => {
  if (!nopatData || !investedCapitalData) {
    console.warn(`Missing data for ROIC Including Goodwill calculation for year ${year}`);
    return 0;
  }

  try {
    const nopat = getNOPATField(nopatData, year, 'NOPAT');
    const currentCapital = getInvestedCapitalField(investedCapitalData, year, 'InvestedCapitalIncludingGoodwill');
    const priorYear = year - 1;
    const previousCapital = getInvestedCapitalField(investedCapitalData, priorYear, 'InvestedCapitalIncludingGoodwill');
    
    const averageCapital = (currentCapital + previousCapital) / 2;
    const result = ratioPercentage(nopat, averageCapital);
    
    console.debug(`ROIC Including Goodwill for ${year}: ${nopat} / ((${currentCapital} + ${previousCapital}) / 2) * 100 = ${result}%`);
    return result;
  } catch (error) {
    console.error(`Error calculating ROIC Including Goodwill for year ${year}:`, error);
    return 0;
  }
};

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  CostOfRevenueAsPercentOfRevenue: calculateCostOfRevenueAsPercentOfRevenue,
  SellingGeneralAndAdministrationAsPercentOfRevenue: calculateSGAAsPercentOfRevenue,
  OperatingProfitAsPercentOfRevenue: calculateOperatingProfitAsPercentOfRevenue,
  WorkingCapitalAsPercentOfRevenue: calculateWorkingCapitalAsPercentOfRevenue,
  FixedAssetsAsPercentOfRevenue: calculateFixedAssetsAsPercentOfRevenue,
  OtherAssetsAsPercentOfRevenue: calculateOtherAssetsAsPercentOfRevenue,
  PretaxReturnOnInvestedCapital: calculatePretaxReturnOnInvestedCapital,
  ReturnOnInvestedCapitalExcludingGoodwill: calculateReturnOnInvestedCapitalExcludingGoodwill,
  GoodwillAsPercentOfInvestedCapital: calculateGoodwillAsPercentOfInvestedCapital,
  ReturnOnInvestedCapitalIncludingGoodwill: calculateReturnOnInvestedCapitalIncludingGoodwill,
};

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  Revenue: ['CostOfRevenueAsPercentOfRevenue', 'SellingGeneralAndAdministrationAsPercentOfRevenue', 'OperatingProfitAsPercentOfRevenue', 'WorkingCapitalAsPercentOfRevenue', 'FixedAssetsAsPercentOfRevenue', 'OtherAssetsAsPercentOfRevenue'],
  CostOfRevenue: ['CostOfRevenueAsPercentOfRevenue'],
  SellingGeneralAdministrative: ['SellingGeneralAndAdministrationAsPercentOfRevenue'],
  OperatingIncome: ['OperatingProfitAsPercentOfRevenue', 'PretaxReturnOnInvestedCapital'],
  OperatingWorkingCapital: ['WorkingCapitalAsPercentOfRevenue'],
  PropertyPlantAndEquipment: ['FixedAssetsAsPercentOfRevenue'],
  OperatingLeaseAssets: ['FixedAssetsAsPercentOfRevenue'],
  VariableLeaseAssets: ['FixedAssetsAsPercentOfRevenue'],
  FinanceLeaseAssets: ['FixedAssetsAsPercentOfRevenue'],
  OtherAssetsNetOtherLiabilities: ['OtherAssetsAsPercentOfRevenue'],
  InvestedCapitalExcludingGoodwill: ['PretaxReturnOnInvestedCapital', 'ReturnOnInvestedCapitalExcludingGoodwill'],
  InvestedCapitalIncludingGoodwill: ['ReturnOnInvestedCapitalIncludingGoodwill'],
  Goodwill: ['GoodwillAsPercentOfInvestedCapital'],
  NOPAT: ['ReturnOnInvestedCapitalExcludingGoodwill', 'ReturnOnInvestedCapitalIncludingGoodwill'],
};

// Calculate all fields for a given year
export const calculateAllFields = (
  data: ROICPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData,
  nopatData?: NOPATData
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values to ensure proper cascading
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate fields in order (percentage fields first, then return calculations)
  const calculationOrder = [
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
  
  for (const fieldName of calculationOrder) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        let value: number;
        if (['CostOfRevenueAsPercentOfRevenue', 'SellingGeneralAndAdministrationAsPercentOfRevenue', 'OperatingProfitAsPercentOfRevenue'].includes(fieldName)) {
          value = calcFunction(updatedData, year, incomeStatementData);
        } else if (['WorkingCapitalAsPercentOfRevenue', 'FixedAssetsAsPercentOfRevenue', 'OtherAssetsAsPercentOfRevenue', 'PretaxReturnOnInvestedCapital'].includes(fieldName)) {
          value = calcFunction(updatedData, year, incomeStatementData, investedCapitalData);
        } else if (fieldName === 'GoodwillAsPercentOfInvestedCapital') {
          value = calcFunction(updatedData, year, investedCapitalData);
        } else if (['ReturnOnInvestedCapitalExcludingGoodwill'].includes(fieldName)) {
          value = calculateReturnOnInvestedCapitalExcludingGoodwill(updatedData, year, incomeStatementData, investedCapitalData, nopatData);
        } else if (['ReturnOnInvestedCapitalIncludingGoodwill'].includes(fieldName)) {
          value = calculateReturnOnInvestedCapitalIncludingGoodwill(updatedData, year, investedCapitalData, nopatData);
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
  data: ROICPerformanceData,
  year: number,
  changedField: string,
  incomeStatementData?: IncomeStatementData,
  investedCapitalData?: InvestedCapitalData,
  nopatData?: NOPATData
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
        if (['CostOfRevenueAsPercentOfRevenue', 'SellingGeneralAndAdministrationAsPercentOfRevenue', 'OperatingProfitAsPercentOfRevenue'].includes(fieldName)) {
          value = calcFunction(updatedData, year, incomeStatementData);
        } else if (['WorkingCapitalAsPercentOfRevenue', 'FixedAssetsAsPercentOfRevenue', 'OtherAssetsAsPercentOfRevenue', 'PretaxReturnOnInvestedCapital'].includes(fieldName)) {
          value = calcFunction(updatedData, year, incomeStatementData, investedCapitalData);
        } else if (fieldName === 'GoodwillAsPercentOfInvestedCapital') {
          value = calcFunction(updatedData, year, investedCapitalData);
        } else if (['ReturnOnInvestedCapitalExcludingGoodwill'].includes(fieldName)) {
          value = calculateReturnOnInvestedCapitalExcludingGoodwill(updatedData, year, incomeStatementData, investedCapitalData, nopatData);
        } else if (['ReturnOnInvestedCapitalIncludingGoodwill'].includes(fieldName)) {
          value = calculateReturnOnInvestedCapitalIncludingGoodwill(updatedData, year, investedCapitalData, nopatData);
        } else {
          value = calcFunction(updatedData, year);
        }
        
        calculated[fieldName] = value;
        // Update for cascading calculations
        updatedData[year][fieldName] = value;
        console.debug(`Recalculated ${fieldName} for ${year}: ${value}%`);
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

// Check if a field is an input field (ROIC fields are all calculated from other data)
export const isInputField = (_fieldName: string): boolean => {
  // ROIC Performance fields are all calculated from Income Statement, Invested Capital, and NOPAT data
  // No fields should be directly editable in the ROIC table
  return false;
};
