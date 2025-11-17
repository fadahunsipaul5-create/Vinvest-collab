// Invested Capital Table Calculation Utilities
// Based on backend/sec_app_2/calculators/capital_table.py

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

// Get invested capital field value
const getInvestedCapitalField = (investedCapitalData: InvestedCapitalData, year: number, field: string): number => {
  return getFieldValue(investedCapitalData, year, field);
};

// 1. Current Assets Aggregate Calculation
export const calculateCurrentAssetsAggregate = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Current Assets Aggregate calculation for year ${year}`);
    return 0;
  }

  try {
    const operatingCash = getBalanceSheetField(balanceSheetData, year, 'OperatingCash');
    const receivables = getBalanceSheetField(balanceSheetData, year, 'ReceivablesCurrent');
    const inventory = getBalanceSheetField(balanceSheetData, year, 'Inventory');
    const otherAssets = getBalanceSheetField(balanceSheetData, year, 'OtherAssetsCurrent');
    
    const result = operatingCash + receivables + inventory + otherAssets;
    console.debug(`Current Assets Aggregate for ${year}: ${operatingCash} + ${receivables} + ${inventory} + ${otherAssets} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Current Assets Aggregate for year ${year}:`, error);
    return 0;
  }
};

// 2. Current Liabilities Aggregate Calculation
export const calculateCurrentLiabilitiesAggregate = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Current Liabilities Aggregate calculation for year ${year}`);
    return 0;
  }

  try {
    const accountsPayable = getBalanceSheetField(balanceSheetData, year, 'AccountsPayableCurrent');
    const employeeLiabilities = getBalanceSheetField(balanceSheetData, year, 'EmployeeLiabilitiesCurrent');
    const accruedLiabilities = getBalanceSheetField(balanceSheetData, year, 'AccruedLiabilitiesCurrent');
    const deferredRevenue = getBalanceSheetField(balanceSheetData, year, 'DeferredRevenueCurrent');
    const otherLiabilities = getBalanceSheetField(balanceSheetData, year, 'OtherLiabilitiesCurrent');
    
    const result = accountsPayable + employeeLiabilities + accruedLiabilities + deferredRevenue + otherLiabilities;
    console.debug(`Current Liabilities Aggregate for ${year}: Sum of 5 components = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Current Liabilities Aggregate for year ${year}:`, error);
    return 0;
  }
};

// 3. Net Operating Assets Current Calculation
export const calculateNetOperatingAssetsCurrent = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Net Operating Assets Current calculation for year ${year}`);
    return 0;
  }

  try {
    const operatingAssets = getBalanceSheetField(balanceSheetData, year, 'OperatingAssetsCurrent');
    const operatingLiabilities = getBalanceSheetField(balanceSheetData, year, 'OperatingLiabilitiesCurrent');
    
    const result = operatingAssets - operatingLiabilities;
    console.debug(`Net Operating Assets Current for ${year}: ${operatingAssets} - ${operatingLiabilities} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Net Operating Assets Current for year ${year}:`, error);
    return 0;
  }
};

// 4. Scaled Operating Lease Assets Calculation
export const calculateScaledOperatingLeaseAssets = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData,
  _incomeStatementData?: IncomeStatementData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing data for Scaled Operating Lease Assets calculation for year ${year}`);
    return 0;
  }

  try {
    const operatingLeaseAssets = getBalanceSheetField(balanceSheetData, year, 'OperatingLeaseAssets');
    // VariableLeaseCost available but ratio is 1.0 per original note
    const result = operatingLeaseAssets * 1.0;
    console.debug(`Scaled Operating Lease Assets for ${year}: ${operatingLeaseAssets} * 1.0 = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Scaled Operating Lease Assets for year ${year}:`, error);
    return 0;
  }
};

// 5. Net Other Noncurrent Assets Calculation
export const calculateNetOtherNoncurrentAssets = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Net Other Noncurrent Assets calculation for year ${year}`);
    return 0;
  }

  try {
    const otherAssets = getBalanceSheetField(balanceSheetData, year, 'OtherAssetsNoncurrent');
    const otherLiabilities = getBalanceSheetField(balanceSheetData, year, 'OtherLiabilitiesNoncurrent');
    
    const result = otherAssets - otherLiabilities;
    console.debug(`Net Other Noncurrent Assets for ${year}: ${otherAssets} - ${otherLiabilities} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Net Other Noncurrent Assets for year ${year}:`, error);
    return 0;
  }
};

// 6. Total Invested Capital Components Calculation
export const calculateTotalInvestedCapitalComponents = (
  data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData || !data) {
    console.warn(`Missing data for Total Invested Capital Components calculation for year ${year}`);
    return 0;
  }

  try {
    const operatingWorkingCapital = getInvestedCapitalField(data, year, 'OperatingWorkingCapital');
    const ppe = getBalanceSheetField(balanceSheetData, year, 'PropertyPlantAndEquipment');
    const operatingLeaseAssets = getBalanceSheetField(balanceSheetData, year, 'OperatingLeaseAssets');
    const variableLeaseAssets = getInvestedCapitalField(data, year, 'VariableLeaseAssets');
    const financeLeaseAssets = getBalanceSheetField(balanceSheetData, year, 'FinanceLeaseAssets');
    const otherAssetsNet = getInvestedCapitalField(data, year, 'OtherAssetsNetOtherLiabilities');
    
    const result = operatingWorkingCapital + ppe + operatingLeaseAssets + variableLeaseAssets + financeLeaseAssets + otherAssetsNet;
    console.debug(`Total Invested Capital Components for ${year}: Sum of 6 components = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Total Invested Capital Components for year ${year}:`, error);
    return 0;
  }
};

// 7. Invested Capital With Goodwill Calculation
export const calculateInvestedCapitalWithGoodwill = (
  data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData || !data) {
    console.warn(`Missing data for Invested Capital with Goodwill calculation for year ${year}`);
    return 0;
  }

  try {
    const investedCapitalExcluding = getInvestedCapitalField(data, year, 'InvestedCapitalExcludingGoodwill');
    const goodwill = getBalanceSheetField(balanceSheetData, year, 'Goodwill');
    
    const result = investedCapitalExcluding + goodwill;
    console.debug(`Invested Capital with Goodwill for ${year}: ${investedCapitalExcluding} + ${goodwill} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Invested Capital with Goodwill for year ${year}:`, error);
    return 0;
  }
};

// 8. Broader Invested Capital Calculation
export const calculateBroaderInvestedCapital = (
  data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData || !data) {
    console.warn(`Missing data for Broader Invested Capital calculation for year ${year}`);
    return 0;
  }

  try {
    const investedCapitalIncluding = getInvestedCapitalField(data, year, 'InvestedCapitalIncludingGoodwill');
    const excessCash = getBalanceSheetField(balanceSheetData, year, 'ExcessCash');
    const foreignTaxCredit = getBalanceSheetField(balanceSheetData, year, 'ForeignTaxCreditCarryForward');
    
    const result = investedCapitalIncluding + excessCash + foreignTaxCredit;
    console.debug(`Broader Invested Capital for ${year}: ${investedCapitalIncluding} + ${excessCash} + ${foreignTaxCredit} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Broader Invested Capital for year ${year}:`, error);
    return 0;
  }
};

// 9. Total Long Term Debt Calculation
export const calculateTotalLongTermDebt = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Total Long Term Debt calculation for year ${year}`);
    return 0;
  }

  try {
    const ltdCurrent = getBalanceSheetField(balanceSheetData, year, 'LongTermDebtCurrent');
    const ltdNoncurrent = getBalanceSheetField(balanceSheetData, year, 'LongTermDebtNoncurrent');
    
    const result = ltdCurrent + ltdNoncurrent;
    console.debug(`Total Long Term Debt for ${year}: ${ltdCurrent} + ${ltdNoncurrent} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Total Long Term Debt for year ${year}:`, error);
    return 0;
  }
};

// 10. Total Operating Lease Liabilities Calculation
export const calculateTotalOperatingLeaseLiabilities = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Total Operating Lease Liabilities calculation for year ${year}`);
    return 0;
  }

  try {
    const olCurrent = getBalanceSheetField(balanceSheetData, year, 'OperatingLeaseLiabilitiesCurrent');
    const olNoncurrent = getBalanceSheetField(balanceSheetData, year, 'OperatingLeaseLiabilitiesNoncurrent');
    
    const result = olCurrent + olNoncurrent;
    console.debug(`Total Operating Lease Liabilities for ${year}: ${olCurrent} + ${olNoncurrent} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Total Operating Lease Liabilities for year ${year}:`, error);
    return 0;
  }
};

// 11. Total Finance Lease Liabilities Calculation
export const calculateTotalFinanceLeaseLiabilities = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Total Finance Lease Liabilities calculation for year ${year}`);
    return 0;
  }

  try {
    const flCurrent = getBalanceSheetField(balanceSheetData, year, 'FinanceLeaseLiabilitiesCurrent');
    const flNoncurrent = getBalanceSheetField(balanceSheetData, year, 'FinanceLeaseLiabilitiesNoncurrent');
    
    const result = flCurrent + flNoncurrent;
    console.debug(`Total Finance Lease Liabilities for ${year}: ${flCurrent} + ${flNoncurrent} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Total Finance Lease Liabilities for year ${year}:`, error);
    return 0;
  }
};

// 12. Total Debt and Lease Liabilities Calculation
export const calculateTotalDebtAndLeaseLiabilities = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData || !_data) {
    console.warn(`Missing data for Total Debt and Lease Liabilities calculation for year ${year}`);
    return 0;
  }

  try {
    const debt = getInvestedCapitalField(_data, year, 'Debt');
    const operatingLeaseLiabilities = getInvestedCapitalField(_data, year, 'OperatingLeaseLiabilities');
    const variableLeaseLiabilities = getInvestedCapitalField(_data, year, 'VariableLeaseLiabilities');
    const financeLeaseLiabilities = getInvestedCapitalField(_data, year, 'FinanceLeaseLiabilities');
    
    const result = debt + operatingLeaseLiabilities + variableLeaseLiabilities + financeLeaseLiabilities;
    console.debug(`Total Debt and Lease Liabilities for ${year}: Sum of 4 components = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Total Debt and Lease Liabilities for year ${year}:`, error);
    return 0;
  }
};

// 13. Net Deferred Income Taxes Calculation
export const calculateNetDeferredIncomeTaxes = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Net Deferred Income Taxes calculation for year ${year}`);
    return 0;
  }

  try {
    const deferredIncomeTaxes = getBalanceSheetField(balanceSheetData, year, 'DeferredIncomeTaxes');
    const foreignTaxCredit = getBalanceSheetField(balanceSheetData, year, 'ForeignTaxCreditCarryForward');
    
    const result = -1 * (deferredIncomeTaxes - foreignTaxCredit);
    console.debug(`Net Deferred Income Taxes for ${year}: -1 * (${deferredIncomeTaxes} - ${foreignTaxCredit}) = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Net Deferred Income Taxes for year ${year}:`, error);
    return 0;
  }
};

// 14. Total Capital/Funds Calculation
export const calculateTotalCapitalFunds = (
  _data: InvestedCapitalData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData || !_data) {
    console.warn(`Missing data for Total Capital/Funds calculation for year ${year}`);
    return 0;
  }

  try {
    const debtAndEquivalents = getInvestedCapitalField(_data, year, 'DebtAndDebtEquivalents');
    const deferredTaxesNet = calculateNetDeferredIncomeTaxes(_data, year, balanceSheetData) || 0;
    const noncontrollingInterests = getBalanceSheetField(balanceSheetData, year, 'NoncontrollingInterests');
    const equity = getBalanceSheetField(balanceSheetData, year, 'Equity');
    
    const result = debtAndEquivalents + deferredTaxesNet + noncontrollingInterests + equity;
    console.debug(`Total Capital/Funds for ${year}: ${debtAndEquivalents} + ${deferredTaxesNet} + ${noncontrollingInterests} + ${equity} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Total Capital/Funds for year ${year}:`, error);
    return 0;
  }
};

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  CurrentAssetsAggregate: calculateCurrentAssetsAggregate,
  CurrentLiabilitiesAggregate: calculateCurrentLiabilitiesAggregate,
  NetOperatingAssetsCurrent: calculateNetOperatingAssetsCurrent,
  ScaledOperatingLeaseAssets: calculateScaledOperatingLeaseAssets,
  NetOtherNoncurrentAssets: calculateNetOtherNoncurrentAssets,
  TotalInvestedCapitalComponents: calculateTotalInvestedCapitalComponents,
  InvestedCapitalWithGoodwill: calculateInvestedCapitalWithGoodwill,
  BroaderInvestedCapital: calculateBroaderInvestedCapital,
  TotalLongTermDebt: calculateTotalLongTermDebt,
  TotalOperatingLeaseLiabilities: calculateTotalOperatingLeaseLiabilities,
  TotalFinanceLeaseLiabilities: calculateTotalFinanceLeaseLiabilities,
  TotalDebtAndLeaseLiabilities: calculateTotalDebtAndLeaseLiabilities,
  NetDeferredIncomeTaxes: calculateNetDeferredIncomeTaxes,
  TotalCapitalFunds: calculateTotalCapitalFunds,
};

// Fields that come from balance sheet (input fields)
export const balanceSheetFields = [
  'OperatingCash',
  'ReceivablesCurrent',
  'Inventory',
  'OtherAssetsCurrent',
  'AccountsPayableCurrent',
  'EmployeeLiabilitiesCurrent',
  'AccruedLiabilitiesCurrent',
  'DeferredRevenueCurrent',
  'OtherLiabilitiesCurrent',
  'OperatingAssetsCurrent',
  'OperatingLiabilitiesCurrent',
  'OperatingLeaseAssets',
  'PropertyPlantAndEquipment',
  'FinanceLeaseAssets',
  'OtherAssetsNoncurrent',
  'OtherLiabilitiesNoncurrent',
  'Goodwill',
  'ExcessCash',
  'ForeignTaxCreditCarryForward',
  'LongTermDebtCurrent',
  'LongTermDebtNoncurrent',
  'OperatingLeaseLiabilitiesCurrent',
  'OperatingLeaseLiabilitiesNoncurrent',
  'FinanceLeaseLiabilitiesCurrent',
  'FinanceLeaseLiabilitiesNoncurrent',
  'DeferredIncomeTaxes',
  'NoncontrollingInterests',
  'Equity'
];

// Input fields that can be manually entered (not from balance sheet)
export const inputFields = [
  'OperatingWorkingCapital',
  'VariableLeaseAssets',
  'OtherAssetsNetOtherLiabilities',
  'InvestedCapitalExcludingGoodwill',
  'InvestedCapitalIncludingGoodwill',
  'Debt',
  'OperatingLeaseLiabilities',
  'VariableLeaseLiabilities',
  'FinanceLeaseLiabilities',
  'DebtAndDebtEquivalents'
];

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  OperatingCash: ['CurrentAssetsAggregate'],
  ReceivablesCurrent: ['CurrentAssetsAggregate'],
  Inventory: ['CurrentAssetsAggregate'],
  OtherAssetsCurrent: ['CurrentAssetsAggregate'],
  AccountsPayableCurrent: ['CurrentLiabilitiesAggregate'],
  EmployeeLiabilitiesCurrent: ['CurrentLiabilitiesAggregate'],
  AccruedLiabilitiesCurrent: ['CurrentLiabilitiesAggregate'],
  DeferredRevenueCurrent: ['CurrentLiabilitiesAggregate'],
  OtherLiabilitiesCurrent: ['CurrentLiabilitiesAggregate'],
  PropertyPlantAndEquipment: ['TotalInvestedCapitalComponents'],
  OperatingLeaseAssets: ['ScaledOperatingLeaseAssets', 'TotalInvestedCapitalComponents'],
  FinanceLeaseAssets: ['TotalInvestedCapitalComponents'],
  OtherAssetsNoncurrent: ['NetOtherNoncurrentAssets'],
  OtherLiabilitiesNoncurrent: ['NetOtherNoncurrentAssets'],
  Goodwill: ['InvestedCapitalWithGoodwill'],
  ExcessCash: ['BroaderInvestedCapital'],
  ForeignTaxCreditCarryForward: ['NetDeferredIncomeTaxes', 'BroaderInvestedCapital'],
  NoncontrollingInterests: ['TotalCapitalFunds'],
  Equity: ['TotalCapitalFunds'],
  VariableLeaseAssets: ['TotalInvestedCapitalComponents'],
  InvestedCapitalExcludingGoodwill: ['InvestedCapitalWithGoodwill'],
  InvestedCapitalIncludingGoodwill: ['BroaderInvestedCapital'],
  Debt: ['TotalDebtAndLeaseLiabilities'],
  OperatingLeaseLiabilities: ['TotalDebtAndLeaseLiabilities'],
  VariableLeaseLiabilities: ['TotalDebtAndLeaseLiabilities'],
  FinanceLeaseLiabilities: ['TotalDebtAndLeaseLiabilities'],
  DebtAndDebtEquivalents: ['TotalCapitalFunds'],
  VariableLeaseCost: ['ScaledOperatingLeaseAssets'],
  CurrentAssetsAggregate: ['NetOperatingAssetsCurrent'],
  CurrentLiabilitiesAggregate: ['NetOperatingAssetsCurrent'],
  TotalInvestedCapitalComponents: ['InvestedCapitalWithGoodwill'],
  InvestedCapitalWithGoodwill: ['BroaderInvestedCapital'],
  NetDeferredIncomeTaxes: ['TotalCapitalFunds'],
  OperatingWorkingCapital: ['TotalInvestedCapitalComponents'],
  OtherAssetsNetOtherLiabilities: ['TotalInvestedCapitalComponents'],
};

// Calculate all fields for a given year
export const calculateAllFields = (
  data: InvestedCapitalData,
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
    'CurrentAssetsAggregate',
    'CurrentLiabilitiesAggregate',
    'NetOperatingAssetsCurrent',
    'ScaledOperatingLeaseAssets', 
    'NetOtherNoncurrentAssets',
    'TotalInvestedCapitalComponents',
    'InvestedCapitalWithGoodwill',
    'BroaderInvestedCapital',
    'TotalLongTermDebt',
    'TotalOperatingLeaseLiabilities',
    'TotalFinanceLeaseLiabilities',
    'TotalDebtAndLeaseLiabilities',
    'NetDeferredIncomeTaxes',
    'TotalCapitalFunds'
  ];
  
  for (const fieldName of calculationOrder) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        let value: number;
        if (fieldName === 'ScaledOperatingLeaseAssets') {
          value = calcFunction(updatedData, year, balanceSheetData, incomeStatementData);
        } else if (['CurrentAssetsAggregate', 'CurrentLiabilitiesAggregate', 'NetOperatingAssetsCurrent', 'NetOtherNoncurrentAssets', 'TotalLongTermDebt', 'TotalOperatingLeaseLiabilities', 'TotalFinanceLeaseLiabilities', 'NetDeferredIncomeTaxes'].includes(fieldName)) {
          value = calcFunction(updatedData, year, balanceSheetData);
        } else if (['TotalInvestedCapitalComponents', 'InvestedCapitalWithGoodwill', 'BroaderInvestedCapital', 'TotalDebtAndLeaseLiabilities', 'TotalCapitalFunds'].includes(fieldName)) {
          value = calcFunction(updatedData, year, balanceSheetData);
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
  data: InvestedCapitalData,
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
        if (fieldName === 'ScaledOperatingLeaseAssets') {
          value = calcFunction(updatedData, year, balanceSheetData, incomeStatementData);
        } else if (['CurrentAssetsAggregate', 'CurrentLiabilitiesAggregate', 'NetOperatingAssetsCurrent', 'NetOtherNoncurrentAssets', 'TotalLongTermDebt', 'TotalOperatingLeaseLiabilities', 'TotalFinanceLeaseLiabilities', 'NetDeferredIncomeTaxes'].includes(fieldName)) {
          value = calcFunction(updatedData, year, balanceSheetData);
        } else if (['TotalInvestedCapitalComponents', 'InvestedCapitalWithGoodwill', 'BroaderInvestedCapital', 'TotalDebtAndLeaseLiabilities', 'TotalCapitalFunds'].includes(fieldName)) {
          value = calcFunction(updatedData, year, balanceSheetData);
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

// Check if a field is a calculated field
export const isCalculatedField = (fieldName: string): boolean => {
  return fieldName in calculatedFields;
};

// Check if a field is an input field (can be manually entered)
export const isInputField = (fieldName: string): boolean => {
  return inputFields.includes(fieldName) || balanceSheetFields.includes(fieldName);
};
