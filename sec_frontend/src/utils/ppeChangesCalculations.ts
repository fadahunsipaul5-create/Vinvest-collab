// PPE Changes Table Calculation Utilities
// Based on backend/sec_app_2/calculators/ppe_changes.py

export interface PPEChangesData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface BalanceSheetData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface IncomeStatementData {
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

// Get balance sheet field value
const getBalanceSheetField = (balanceSheetData: BalanceSheetData, year: number, field: string): number => {
  return getFieldValue(balanceSheetData, year, field);
};

// Get income statement field value
const getIncomeStatementField = (incomeStatementData: IncomeStatementData, year: number, field: string): number => {
  return getFieldValue(incomeStatementData, year, field);
};


// 1. PPE Beginning of Year Calculation
export const calculatePPEBeginningOfYear = (
  _data: PPEChangesData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for PPE Beginning of Year calculation for year ${year}`);
    return 0;
  }

  try {
    const priorYear = year - 1;
    const ppeBeginning = getBalanceSheetField(balanceSheetData, priorYear, 'PropertyPlantAndEquipment');
    console.debug(`PPE Beginning of Year for ${year}: Prior year ${priorYear} PPE = ${ppeBeginning}`);
    return ppeBeginning;
  } catch (error) {
    console.error(`Error calculating PPE Beginning of Year for year ${year}:`, error);
    return 0;
  }
};

// 2. Capital Expenditures Calculation
export const calculateCapitalExpenditures = (
  _data: PPEChangesData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Capital Expenditures calculation for year ${year}`);
    return 0;
  }

  try {
    const capex = getBalanceSheetField(balanceSheetData, year, 'CapitalExpenditures');
    console.debug(`Capital Expenditures for ${year}: ${capex}`);
    return capex;
  } catch (error) {
    console.error(`Error calculating Capital Expenditures for year ${year}:`, error);
    return 0;
  }
};

// 3. Depreciation Calculation (negative of income statement depreciation)
export const calculateDepreciation = (
  _data: PPEChangesData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) {
    console.warn(`Missing income statement data for Depreciation calculation for year ${year}`);
    return 0;
  }

  try {
    const depExpense = getIncomeStatementField(incomeStatementData, year, 'Depreciation');
    const depreciation = -1 * depExpense;
    console.debug(`Depreciation for ${year}: -1 * ${depExpense} = ${depreciation}`);
    return depreciation;
  } catch (error) {
    console.error(`Error calculating Depreciation for year ${year}:`, error);
    return 0;
  }
};

// 4. PPE End of Year Calculation
export const calculatePPEEndOfYear = (
  _data: PPEChangesData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for PPE End of Year calculation for year ${year}`);
    return 0;
  }

  try {
    const ppeEnding = getBalanceSheetField(balanceSheetData, year, 'PropertyPlantAndEquipment');
    console.debug(`PPE End of Year for ${year}: ${ppeEnding}`);
    return ppeEnding;
  } catch (error) {
    console.error(`Error calculating PPE End of Year for year ${year}:`, error);
    return 0;
  }
};

// 5. Unexplained Changes in PPE Calculation (balancing item)
export const calculateUnexplainedChangesInPPE = (
  _data: PPEChangesData,
  year: number,
  balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!balanceSheetData || !incomeStatementData) {
    console.warn(`Missing data for Unexplained Changes in PPE calculation for year ${year}`);
    return 0;
  }

  try {
    const ppeEnding = getBalanceSheetField(balanceSheetData, year, 'PropertyPlantAndEquipment');
    const ppeBeginning = calculatePPEBeginningOfYear(_data, year, balanceSheetData) || 0;
    const capex = calculateCapitalExpenditures(_data, year, balanceSheetData) || 0;
    const depreciation = calculateDepreciation(_data, year, incomeStatementData) || 0;
    
    // Formula: PPE End - PPE Beginning - CapEx - Depreciation
    // Note: Depreciation is already negative, so we subtract it (which adds it back)
    const result = ppeEnding - ppeBeginning - capex - depreciation;
    console.debug(`Unexplained Changes in PPE for ${year}: ${ppeEnding} - ${ppeBeginning} - ${capex} - ${depreciation} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Unexplained Changes in PPE for year ${year}:`, error);
    return 0;
  }
};

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  PPEBeginningOfYear: calculatePPEBeginningOfYear,
  CapitalExpenditures: calculateCapitalExpenditures,
  Depreciation: calculateDepreciation,
  UnexplainedChangesInPPE: calculateUnexplainedChangesInPPE,
  PPEEndOfYear: calculatePPEEndOfYear,
};

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  PropertyPlantAndEquipment: ['PPEBeginningOfYear', 'PPEEndOfYear', 'UnexplainedChangesInPPE'],
  CapitalExpenditures: ['UnexplainedChangesInPPE'],
  Depreciation: ['UnexplainedChangesInPPE'],
  PPEBeginningOfYear: ['UnexplainedChangesInPPE'],
  PPEEndOfYear: ['UnexplainedChangesInPPE'],
};

// Calculate all fields for a given year
export const calculateAllFields = (
  data: PPEChangesData,
  year: number,
  balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values to ensure proper cascading
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate fields in dependency order
  const calculationOrder = [
    'PPEBeginningOfYear',
    'CapitalExpenditures', 
    'Depreciation',
    'PPEEndOfYear',
    'UnexplainedChangesInPPE'  // This must be last as it depends on all others
  ];
  
  for (const fieldName of calculationOrder) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        let value: number;
        if (['PPEBeginningOfYear', 'CapitalExpenditures', 'PPEEndOfYear'].includes(fieldName)) {
          value = calcFunction(updatedData, year, balanceSheetData);
        } else if (fieldName === 'Depreciation') {
          value = calcFunction(updatedData, year, incomeStatementData);
        } else if (fieldName === 'UnexplainedChangesInPPE') {
          value = calculateUnexplainedChangesInPPE(updatedData, year, balanceSheetData, incomeStatementData);
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
  data: PPEChangesData,
  year: number,
  changedField: string,
  balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
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
        if (['PPEBeginningOfYear', 'CapitalExpenditures', 'PPEEndOfYear'].includes(fieldName)) {
          value = calcFunction(updatedData, year, balanceSheetData);
        } else if (fieldName === 'Depreciation') {
          value = calcFunction(updatedData, year, incomeStatementData);
        } else if (fieldName === 'UnexplainedChangesInPPE') {
          value = calculateUnexplainedChangesInPPE(updatedData, year, balanceSheetData, incomeStatementData);
        } else {
          value = calcFunction(updatedData, year);
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

// Validation function to check PPE reconciliation
export const validatePPEReconciliation = (
  data: PPEChangesData,
  year: number,
  balanceSheetData?: BalanceSheetData,
  incomeStatementData?: IncomeStatementData
): { [key: string]: any } => {
  if (!balanceSheetData || !incomeStatementData) {
    return { valid: false, error: "Missing required data" };
  }

  try {
    const ppeBeginning = calculatePPEBeginningOfYear(data, year, balanceSheetData) || 0;
    const capex = calculateCapitalExpenditures(data, year, balanceSheetData) || 0;
    const depreciation = calculateDepreciation(data, year, incomeStatementData) || 0;
    const unexplained = calculateUnexplainedChangesInPPE(data, year, balanceSheetData, incomeStatementData) || 0;
    const ppeEnding = calculatePPEEndOfYear(data, year, balanceSheetData) || 0;
    
    // Calculate what PPE ending should be based on the reconciliation
    const calculatedEnding = ppeBeginning + capex - depreciation + unexplained;
    const difference = Math.abs(ppeEnding - calculatedEnding);
    const tolerance = 1.0;
    const valid = difference <= tolerance;
    
    return {
      valid,
      ppe_beginning: ppeBeginning,
      capital_expenditures: capex,
      depreciation,
      unexplained_changes: unexplained,
      ppe_ending_actual: ppeEnding,
      ppe_ending_calculated: calculatedEnding,
      difference,
      tolerance,
    };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error}` };
  }
};

// Check if a field is a calculated field
export const isCalculatedField = (fieldName: string): boolean => {
  return fieldName in calculatedFields;
};

// Check if a field is an input field (comes from balance sheet or income statement)
export const isInputField = (_fieldName: string): boolean => {
  // PPE Changes fields are not directly input - they come from balance sheet or income statement
  // The only "input" would be manual overrides, but normally all are calculated
  return false;
};
