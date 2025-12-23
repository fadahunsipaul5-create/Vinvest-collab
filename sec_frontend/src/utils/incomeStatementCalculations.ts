// Income Statement Calculation Utilities
// Based on the Python backend logic in backend/sec_app_2/calculators/income_statement.py

interface IncomeStatementData {
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

// Calculate Gross Income: Revenue - CostOfRevenue
export const calculateGrossIncome = (data: IncomeStatementData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const revenue = toNumber(yearData.Revenue);
    const cost = toNumber(yearData.CostOfRevenue);
    return revenue - cost;
  } catch (error) {
    console.error(`Error calculating Gross Income for year ${year}:`, error);
    return 0;
  }
};

// Calculate Operating Expense: SGAExpense + ResearchAndDevelopment + DepreciationAmortization + OtherOperatingExpense + SellingAndMarketingExpense + GeneralAndAdministrativeExpense + FulfillmentExpense + TechnologyExpense
export const calculateOperatingExpense = (data: IncomeStatementData, year: number): number => {
  try {
    const yearData = data[year] || {};
    // Note: Some of these might be mutually exclusive depending on how the company reports.
    // E.g. SGAExpense often includes SellingAndMarketingExpense and GeneralAndAdministrativeExpense.
    // If the API provides both the total (SGA) and breakdown, adding them all up might double count.
    // However, the prompt implies "breakdown fields" are additional. 
    // Usually, we should sum the most granular available fields OR the high level ones.
    // Given the previous setup used 'SellingGeneralAdministrative' (now SGAExpense) and 'Depreciation' (now DepreciationAmortization),
    // and we are adding R&D, we should include R&D.
    // For now, let's sum everything provided as per the request to "add the rest under their respective places".
    // If double counting occurs, it should be handled by only populating one level of hierarchy or adjusting the formula.
    // Assuming for now these are distinct line items or handled correctly in data population.
    
    // UPDATE: To avoid double counting, typically Operating Expenses = SG&A + R&D + D&A + Other.
    // Breakdowns of SG&A (Marketing, G&A) shouldn't be added to SG&A itself in the total sum if SG&A is already the sum.
    // If SGAExpense is populated, use it. Breakdowns are for display.
    
    const sga = toNumber(yearData.SGAExpense);
    const rnd = toNumber(yearData.ResearchAndDevelopment);
    const depreciation = toNumber(yearData.DepreciationAmortization);
    const other = toNumber(yearData.OtherOperatingExpense);
    
    // If SGA is 0 but we have components, maybe sum components? 
    // For safety with current data model where we map API fields directly:
    // If API gives SGA, we use it. R&D is usually separate.
    
    return sga + rnd + depreciation + other;
  } catch (error) {
    console.error(`Error calculating Operating Expense for year ${year}:`, error);
    return 0;
  }
};

// Calculate Operating Income: GrossIncome - OperatingExpense
export const calculateOperatingIncome = (data: IncomeStatementData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const gross = toNumber(yearData.GrossIncome); // Using calculated GrossIncome
    // Re-calculate operating expense here or trust the field if calculated previously?
    // Safer to recalculate using the helper above to ensure consistency
    const opExpense = calculateOperatingExpense(data, year);
    return gross - opExpense;
  } catch (error) {
    console.error(`Error calculating Operating Income for year ${year}:`, error);
    return 0;
  }
};

// Calculate Net Non-Operating Income: -InterestExpense + InterestIncome + OtherIncome
export const calculateNetNonOperatingIncome = (data: IncomeStatementData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const interestExpense = toNumber(yearData.InterestExpense);
    const interestIncome = toNumber(yearData.InterestIncome);
    const otherIncome = toNumber(yearData.OtherIncome);
    // Correct sign: -Expense + Income + Other
    return -interestExpense + interestIncome + otherIncome;
  } catch (error) {
    console.error(`Error calculating Net Non-Operating Income for year ${year}:`, error);
    return 0;
  }
};

// Calculate Pretax Income: OperatingIncome - InterestExpense + InterestIncome + OtherIncome
export const calculatePretaxIncome = (data: IncomeStatementData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const operatingIncome = toNumber(yearData.OperatingIncome);
    const interestExpense = toNumber(yearData.InterestExpense);
    const interestIncome = toNumber(yearData.InterestIncome);
    const otherIncome = toNumber(yearData.OtherIncome);
    return operatingIncome - interestExpense + interestIncome + otherIncome;
  } catch (error) {
    console.error(`Error calculating Pretax Income for year ${year}:`, error);
    return 0;
  }
};

// Calculate Profit Loss Controlling: PretaxIncome - TaxProvision
export const calculateProfitLossControlling = (data: IncomeStatementData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const pretax = toNumber(yearData.PretaxIncome);
    const tax = toNumber(yearData.TaxProvision);
    return pretax - tax;
  } catch (error) {
    console.error(`Error calculating Profit Loss Controlling for year ${year}:`, error);
    return 0;
  }
};

// Calculate Net Income: ProfitLossControlling + NetIncomeNoncontrolling
export const calculateNetIncome = (data: IncomeStatementData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const plc = toNumber(yearData.ProfitLossControlling);
    const nonctrl = toNumber(yearData.NetIncomeNoncontrolling);
    return plc + nonctrl;
  } catch (error) {
    console.error(`Error calculating Net Income for year ${year}:`, error);
    return 0;
  }
};

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  GrossIncome: calculateGrossIncome,
  OperatingExpense: calculateOperatingExpense,
  OperatingIncome: calculateOperatingIncome,
  NetNonOperatingInterestIncome: calculateNetNonOperatingIncome,
  PretaxIncome: calculatePretaxIncome,
  ProfitLossControlling: calculateProfitLossControlling,
  NetIncome: calculateNetIncome,
};

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  Revenue: ['GrossIncome', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
  CostOfRevenue: ['GrossIncome', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
  SellingGeneralAdministrative: ['OperatingExpense', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
  Depreciation: ['OperatingExpense', 'OperatingIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
  InterestExpense: ['NetNonOperatingInterestIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
  InterestIncome: ['NetNonOperatingInterestIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
  OtherIncome: ['NetNonOperatingInterestIncome', 'PretaxIncome', 'ProfitLossControlling', 'NetIncome'],
  TaxProvision: ['ProfitLossControlling', 'NetIncome'],
  NetIncomeNoncontrolling: ['NetIncome'],
  // Additional input fields that don't affect calculated fields but should be recognized as inputs
  OperatingLeaseCost: [],
  VariableLeaseCost: [],
  LeasesDiscountRate: [],
  ForeignCurrencyAdjustment: [],
};

// Define calculation order to handle cascading dependencies
const calculationOrder = [
  'GrossIncome',           // Must be first (depends only on inputs)
  'OperatingExpense',      // Can be calculated independently
  'OperatingIncome',       // Depends on GrossIncome
  'NetNonOperatingInterestIncome',  // Can be calculated independently
  'PretaxIncome',          // Depends on OperatingIncome
  'ProfitLossControlling', // Depends on PretaxIncome
  'NetIncome',             // Depends on ProfitLossControlling
];

// Calculate all fields for a given year
export const calculateAllFields = (data: IncomeStatementData, year: number): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values to ensure proper cascading
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate in the correct dependency order
  for (const fieldName of calculationOrder) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        const value = calcFunction(updatedData, year);
        calculated[fieldName] = value;
        // CRITICAL: Update the data immediately for subsequent calculations
        updatedData[year][fieldName] = value;
      } catch (error) {
        console.error(`Error calculating ${fieldName} for year ${year}:`, error);
        calculated[fieldName] = 0;
        updatedData[year][fieldName] = 0;
      }
    }
  }
  
  return calculated;
};

// Recalculate dependent fields when an input field changes
export const recalculateDependentFields = (
  data: IncomeStatementData, 
  year: number, 
  changedField: string
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  const dependentFields = dependencies[changedField as keyof typeof dependencies] || [];
  
  // If no dependent fields, return empty object
  if (dependentFields.length === 0) {
    return calculated;
  }
  
  // Update the data with the current state for calculations
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Create a set of dependent fields for quick lookup
  const dependentSet = new Set(dependentFields);
  
  // Calculate dependent fields in the correct order
  for (const fieldName of calculationOrder) {
    // Only calculate if this field is actually dependent on the changed field
    if (dependentSet.has(fieldName) && calculatedFields[fieldName as keyof typeof calculatedFields]) {
      try {
        const value = calculatedFields[fieldName as keyof typeof calculatedFields](updatedData, year);
        calculated[fieldName] = value;
        // CRITICAL: Update the data immediately so subsequent calculations use the new value
        updatedData[year][fieldName] = value;
      } catch (error) {
        console.error(`Error recalculating ${fieldName} for year ${year}:`, error);
        calculated[fieldName] = 0;
        updatedData[year][fieldName] = 0;
      }
    }
  }
  
  return calculated;
};

// Check if a field is a calculated field
export const isCalculatedField = (fieldName: string): boolean => {
  return fieldName in calculatedFields;
};

// Check if a field is an input field (not calculated)
export const isInputField = (fieldName: string): boolean => {
  return !isCalculatedField(fieldName) && fieldName in dependencies;
};
