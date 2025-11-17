// Balance Sheet Calculation Utilities
// Based on the Python backend logic in backend/sec_app_2/calculators/balance_sheet.py

interface BalanceSheetData {
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

// Calculate Current Assets: CashAndCashEquivalents + Receivables + Inventory + DeferredTaxesAssetsCurrent + OtherAssetsCurrent
export const calculateCurrentAssets = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const cash = toNumber(yearData.CashAndCashEquivalents);
    const shortTermInvestments = toNumber((yearData as any).ShortTermInvestments);
    // Check both Receivables and ReceivablesCurrent field names
    const receivables = toNumber(yearData.Receivables || yearData.ReceivablesCurrent);
    const inventory = toNumber(yearData.Inventory);
    const deferredTaxes = toNumber(yearData.DeferredTaxesAssetsCurrent);
    const otherAssets = toNumber(yearData.OtherAssetsCurrent);
    return cash + shortTermInvestments + receivables + inventory + deferredTaxes + otherAssets;
  } catch (error) {
    console.error(`Error calculating Current Assets for year ${year}:`, error);
    return 0;
  }
};

// Calculate Non-Current Assets: PropertyPlantAndEquipmentNet + OperatingLeaseRightOfUseAsset + LeaseFinanceAssetsNoncurrent + Goodwill + DeferredIncomeTaxAssetsNoncurrent + OtherAssetsNoncurrent
export const calculateNoncurrentAssets = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    // Check both PropertyPlantAndEquipmentNet and PropertyPlantAndEquipment field names
    const ppe = toNumber(yearData.PropertyPlantAndEquipmentNet || yearData.PropertyPlantAndEquipment);
    // Check both OperatingLeaseRightOfUseAsset and OperatingLeaseAssets field names
    const operatingLease = toNumber(yearData.OperatingLeaseRightOfUseAsset || yearData.OperatingLeaseAssets);
    // Check both LeaseFinanceAssetsNoncurrent and FinanceLeaseAssets field names
    const financeLease = toNumber(yearData.LeaseFinanceAssetsNoncurrent || yearData.FinanceLeaseAssets);
    const goodwill = toNumber(yearData.Goodwill);
    const deferredTaxNoncurrent = toNumber(yearData.DeferredIncomeTaxAssetsNoncurrent);
    const otherNoncurrent = toNumber(yearData.OtherAssetsNoncurrent);
    return ppe + operatingLease + financeLease + goodwill + deferredTaxNoncurrent + otherNoncurrent;
  } catch (error) {
    console.error(`Error calculating Non-Current Assets for year ${year}:`, error);
    return 0;
  }
};

// Calculate Total Assets: AssetsCurrent + AssetsNoncurrent
export const calculateTotalAssets = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    // Check both AssetsCurrent and CurrentAssets field names
    const currentAssets = toNumber(yearData.AssetsCurrent || yearData.CurrentAssets);
    // Check both AssetsNoncurrent and NonCurrentAssets field names
    const noncurrentAssets = toNumber(yearData.AssetsNoncurrent || yearData.NonCurrentAssets);
    return currentAssets + noncurrentAssets;
  } catch (error) {
    console.error(`Error calculating Total Assets for year ${year}:`, error);
    return 0;
  }
};

// Calculate Assets (alias for TotalAssets): AssetsCurrent + AssetsNoncurrent
export const calculateAssets = (data: BalanceSheetData, year: number): number => {
  return calculateTotalAssets(data, year);
};

// Calculate Current Liabilities: AccountsPayableCurrent + EmployeeRelatedLiabilitiesCurrent + AccruedLiabilitiesCurrent + DeferredRevenueCurrent + LongTermDebtCurrent + OperatingLeaseLiabilitiesCurrent + FinanceLeaseLiabilitiesCurrent + OtherLiabilitiesCurrent
export const calculateCurrentLiabilities = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const accountsPayable = toNumber(yearData.AccountsPayableCurrent);
    const employeeRelated = toNumber(yearData.EmployeeRelatedLiabilitiesCurrent);
    const accruedLiabilities = toNumber(yearData.AccruedLiabilitiesCurrent);
    const deferredRevenue = toNumber(yearData.DeferredRevenueCurrent);
    const longTermDebtCurrent = toNumber(yearData.LongTermDebtCurrent);
    const operatingLeaseCurrent = toNumber(yearData.OperatingLeaseLiabilitiesCurrent);
    const financeLeaseCurrent = toNumber(yearData.FinanceLeaseLiabilitiesCurrent);
    const otherLiabilitiesCurrent = toNumber(yearData.OtherLiabilitiesCurrent);
    
    return accountsPayable + employeeRelated + accruedLiabilities + deferredRevenue + 
           longTermDebtCurrent + operatingLeaseCurrent + financeLeaseCurrent + otherLiabilitiesCurrent;
  } catch (error) {
    console.error(`Error calculating Current Liabilities for year ${year}:`, error);
    return 0;
  }
};

// Calculate Non-Current Liabilities: LongTermDebtNoncurrent + OperatingLeaseLiabilityNoncurrent + FinanceLeaseLiabilitiesNonCurrent + DeferredIncomeTaxLiabilitiesNonCurrent + OtherLiabilitiesNoncurrent
export const calculateNoncurrentLiabilities = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    const longTermDebtNoncurrent = toNumber(yearData.LongTermDebtNoncurrent);
    const operatingLeaseNoncurrent = toNumber(yearData.OperatingLeaseLiabilityNoncurrent);
    const financeLeaseNoncurrent = toNumber(yearData.FinanceLeaseLiabilitiesNonCurrent);
    const deferredTaxNoncurrent = toNumber(yearData.DeferredIncomeTaxLiabilitiesNonCurrent);
    const otherLiabilitiesNoncurrent = toNumber(yearData.OtherLiabilitiesNoncurrent);
    
    return longTermDebtNoncurrent + operatingLeaseNoncurrent + financeLeaseNoncurrent + 
           deferredTaxNoncurrent + otherLiabilitiesNoncurrent;
  } catch (error) {
    console.error(`Error calculating Non-Current Liabilities for year ${year}:`, error);
    return 0;
  }
};

// Calculate Total Liabilities: LiabilitiesCurrent + LiabilitiesNoncurrent
export const calculateTotalLiabilities = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    // Check both LiabilitiesCurrent and CurrentLiabilities field names
    const currentLiabilities = toNumber(yearData.LiabilitiesCurrent || yearData.CurrentLiabilities);
    // Check both LiabilitiesNoncurrent and NonCurrentLiabilities field names
    const noncurrentLiabilities = toNumber(yearData.LiabilitiesNoncurrent || yearData.NonCurrentLiabilities);
    return currentLiabilities + noncurrentLiabilities;
  } catch (error) {
    console.error(`Error calculating Total Liabilities for year ${year}:`, error);
    return 0;
  }
};

// Calculate Stockholders' Equity: TotalAssets - TotalLiabilities
export const calculateStockholdersEquity = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    // Check for both TotalAssets and Assets aliases
    const totalAssets = toNumber(yearData.TotalAssets || yearData.Assets);
    // Check for both TotalLiabilities and Liabilities aliases
    const totalLiabilities = toNumber(yearData.TotalLiabilities || yearData.Liabilities);
    return totalAssets - totalLiabilities;
  } catch (error) {
    console.error(`Error calculating Stockholders' Equity for year ${year}:`, error);
    return 0;
  }
};

// Calculate Liabilities and Stockholders' Equity: TotalLiabilities + StockholdersEquity
export const calculateLiabilitiesAndEquity = (data: BalanceSheetData, year: number): number => {
  try {
    const yearData = data[year] || {};
    // Check for both TotalLiabilities and Liabilities aliases
    const totalLiabilities = toNumber(yearData.TotalLiabilities || yearData.Liabilities);
    // Check for both StockholdersEquity and Equity aliases
    const stockholdersEquity = toNumber(yearData.StockholdersEquity || yearData.Equity);
    return totalLiabilities + stockholdersEquity;
  } catch (error) {
    console.error(`Error calculating Liabilities and Stockholders' Equity for year ${year}:`, error);
    return 0;
  }
};

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  AssetsCurrent: calculateCurrentAssets,
  AssetsNoncurrent: calculateNoncurrentAssets,
  TotalAssets: calculateTotalAssets,
  Assets: calculateAssets,
  LiabilitiesCurrent: calculateCurrentLiabilities,
  LiabilitiesNoncurrent: calculateNoncurrentLiabilities,
  TotalLiabilities: calculateTotalLiabilities,
  Liabilities: calculateTotalLiabilities,
  StockholdersEquity: calculateStockholdersEquity,
  Equity: calculateStockholdersEquity,
  LiabilitiesAndStockholdersEquity: calculateLiabilitiesAndEquity,
  LiabilitiesAndEquity: calculateLiabilitiesAndEquity,
};

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  CashAndCashEquivalents: ['AssetsCurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  ShortTermInvestments: ['AssetsCurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  Receivables: ['AssetsCurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  ReceivablesCurrent: ['AssetsCurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  Inventory: ['AssetsCurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  DeferredTaxesAssetsCurrent: ['AssetsCurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OtherAssetsCurrent: ['AssetsCurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  PropertyPlantAndEquipmentNet: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  PropertyPlantAndEquipment: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OperatingLeaseRightOfUseAsset: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OperatingLeaseAssets: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  LeaseFinanceAssetsNoncurrent: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  FinanceLeaseAssets: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  Goodwill: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  DeferredIncomeTaxAssetsNoncurrent: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OtherAssetsNoncurrent: ['AssetsNoncurrent', 'TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  AccountsPayableCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  EmployeeRelatedLiabilitiesCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  AccruedLiabilitiesCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  DeferredRevenueCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  LongTermDebtCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OperatingLeaseLiabilitiesCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  FinanceLeaseLiabilitiesCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OtherLiabilitiesCurrent: ['LiabilitiesCurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  LongTermDebtNoncurrent: ['LiabilitiesNoncurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OperatingLeaseLiabilityNoncurrent: ['LiabilitiesNoncurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  FinanceLeaseLiabilitiesNonCurrent: ['LiabilitiesNoncurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  DeferredIncomeTaxLiabilitiesNonCurrent: ['LiabilitiesNoncurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  OtherLiabilitiesNoncurrent: ['LiabilitiesNoncurrent', 'TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  AssetsCurrent: ['TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  AssetsNoncurrent: ['TotalAssets', 'Assets', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  TotalAssets: ['StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  Assets: ['StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  LiabilitiesCurrent: ['TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  LiabilitiesNoncurrent: ['TotalLiabilities', 'Liabilities', 'StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  TotalLiabilities: ['StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  Liabilities: ['StockholdersEquity', 'Equity', 'LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  StockholdersEquity: ['LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
  Equity: ['LiabilitiesAndStockholdersEquity', 'LiabilitiesAndEquity'],
};

// Calculate all fields for a given year
export const calculateAllFields = (data: BalanceSheetData, year: number): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values to ensure proper cascading
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate in dependency order
  for (const [fieldName, calcFunction] of Object.entries(calculatedFields)) {
    try {
      const value = calcFunction(updatedData, year);
      calculated[fieldName] = value;
      // Update the data for subsequent calculations
      updatedData[year][fieldName] = value;
    } catch (error) {
      console.error(`Error calculating ${fieldName} for year ${year}:`, error);
      calculated[fieldName] = 0;
    }
  }
  
  return calculated;
};

// Recalculate dependent fields when an input field changes
export const recalculateDependentFields = (
  data: BalanceSheetData, 
  year: number, 
  changedField: string
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  const dependentFields = dependencies[changedField as keyof typeof dependencies] || [];
  
  // Update the data with the changed field for calculations
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate dependent fields in order
  for (const fieldName of dependentFields) {
    if (calculatedFields[fieldName as keyof typeof calculatedFields]) {
      try {
        const value = calculatedFields[fieldName as keyof typeof calculatedFields](updatedData, year);
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
  return fieldName in calculatedFields;
};

// Check if a field is an input field (not calculated but has dependencies)
export const isInputField = (fieldName: string): boolean => {
  return !isCalculatedField(fieldName) && fieldName in dependencies;
};
