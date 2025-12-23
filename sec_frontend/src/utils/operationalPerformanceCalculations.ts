// Operational Performance Calculations

export interface OperationalPerformanceData {
  [year: number]: {
    [key: string]: number;
  };
}

interface BalanceSheetData {
  [year: number]: {
    [key: string]: number;
  };
}

interface IncomeStatementData {
  [year: number]: {
    [key: string]: number;
  };
}

interface InvestedCapitalData {
  [year: number]: {
    [key: string]: number;
  };
}

interface NOPATData {
  [year: number]: {
    [key: string]: number;
  };
}

// Helper function to safely get a value
const getValue = (data: any, year: number, field: string): number => {
  return data?.[year]?.[field] ?? 0;
};

// Helper function to get average of current and previous year
const getAverage = (data: any, year: number, field: string): number => {
  const current = getValue(data, year, field);
  const previous = getValue(data, year - 1, field);
  return (current + previous) / 2;
};

// Return Metrics

export const calculateReturnOnEquity = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const netIncome = getValue(incomeStatementData, year, 'NetIncome');
  const avgEquity = getAverage(balanceSheetData, year, 'TotalEquity');
  
  return avgEquity !== 0 ? (netIncome / avgEquity) * 100 : 0;
};

export const calculateReturnOnAssets = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const netIncome = getValue(incomeStatementData, year, 'NetIncome');
  const avgAssets = getAverage(balanceSheetData, year, 'TotalAssets');
  
  return avgAssets !== 0 ? (netIncome / avgAssets) * 100 : 0;
};

export const calculateReturnOnInvestedCapitalExcludingGoodwill = (
  _data: OperationalPerformanceData,
  year: number,
  nopatData?: NOPATData,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!nopatData || !investedCapitalData) return 0;
  
  const nopat = getValue(nopatData, year, 'NOPAT');
  const avgCapital = getAverage(investedCapitalData, year, 'InvestedCapitalExcludingGoodwill');
  
  return avgCapital !== 0 ? (nopat / avgCapital) * 100 : 0;
};

export const calculateReturnOnInvestedCapitalIncludingGoodwill = (
  _data: OperationalPerformanceData,
  year: number,
  nopatData?: NOPATData,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!nopatData || !investedCapitalData) return 0;
  
  const nopat = getValue(nopatData, year, 'NOPAT');
  const avgCapital = getAverage(investedCapitalData, year, 'InvestedCapitalIncludingGoodwill');
  
  return avgCapital !== 0 ? (nopat / avgCapital) * 100 : 0;
};

// Margin Metrics

export const calculateGrossMarginAsPercentOfRevenue = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) return 0;
  
  const grossProfit = getValue(incomeStatementData, year, 'GrossProfit');
  const revenue = getValue(incomeStatementData, year, 'Revenue');
  
  return revenue !== 0 ? (grossProfit / revenue) * 100 : 0;
};

export const calculateOperatingIncomeAsPercentOfRevenue = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) return 0;
  
  const operatingIncome = getValue(incomeStatementData, year, 'OperatingIncome');
  const revenue = getValue(incomeStatementData, year, 'Revenue');
  
  return revenue !== 0 ? (operatingIncome / revenue) * 100 : 0;
};

export const calculateNetIncomeAsPercentOfRevenue = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) return 0;
  
  const netIncome = getValue(incomeStatementData, year, 'NetIncome');
  const revenue = getValue(incomeStatementData, year, 'Revenue');
  
  return revenue !== 0 ? (netIncome / revenue) * 100 : 0;
};

// Interest and Tax Metrics

export const calculateEffectiveInterestRate = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const interestExpense = getValue(incomeStatementData, year, 'InterestExpense');
  const avgDebt = getAverage(balanceSheetData, year, 'LongTermDebtNoncurrent') + 
                  getAverage(balanceSheetData, year, 'LongTermDebtCurrent');
  
  return avgDebt !== 0 ? (interestExpense / avgDebt) * 100 : 0;
};

export const calculateInterestBurden = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) return 0;
  
  const pretaxIncome = getValue(incomeStatementData, year, 'PretaxIncome');
  const operatingIncome = getValue(incomeStatementData, year, 'OperatingIncome');
  
  return operatingIncome !== 0 ? (pretaxIncome / operatingIncome) * 100 : 0;
};

export const calculateEffectiveTaxRate = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) return 0;
  
  const taxProvision = getValue(incomeStatementData, year, 'TaxProvision');
  const pretaxIncome = getValue(incomeStatementData, year, 'PretaxIncome');
  
  return pretaxIncome !== 0 ? (taxProvision / pretaxIncome) * 100 : 0;
};

export const calculateTaxBurden = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) return 0;
  
  const netIncome = getValue(incomeStatementData, year, 'NetIncome');
  const pretaxIncome = getValue(incomeStatementData, year, 'PretaxIncome');
  
  return pretaxIncome !== 0 ? (netIncome / pretaxIncome) * 100 : 0;
};

// Turnover Metrics

export const calculateAssetTurnover = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const revenue = getValue(incomeStatementData, year, 'Revenue');
  const avgAssets = getAverage(balanceSheetData, year, 'TotalAssets');
  
  return avgAssets !== 0 ? revenue / avgAssets : 0;
};

export const calculatePropertyPlantAndEquipmentTurnover = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const revenue = getValue(incomeStatementData, year, 'Revenue');
  const avgPPE = getAverage(balanceSheetData, year, 'PropertyPlantAndEquipmentNet');
  
  return avgPPE !== 0 ? revenue / avgPPE : 0;
};

export const calculateCashTurnover = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const revenue = getValue(incomeStatementData, year, 'Revenue');
  const avgCash = getAverage(balanceSheetData, year, 'CashAndCashEquivalents');
  
  return avgCash !== 0 ? revenue / avgCash : 0;
};

export const calculateReceivablesCurrentTurnover = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const revenue = getValue(incomeStatementData, year, 'Revenue');
  const avgReceivables = getAverage(balanceSheetData, year, 'ReceivablesCurrent');
  
  return avgReceivables !== 0 ? revenue / avgReceivables : 0;
};

export const calculateInventoryTurnover = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const costOfRevenue = getValue(incomeStatementData, year, 'CostOfRevenue');
  const avgInventory = getAverage(balanceSheetData, year, 'Inventory');
  
  return avgInventory !== 0 ? costOfRevenue / avgInventory : 0;
};

export const calculateAccountsPayableCurrentTurnover = (
  _data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!incomeStatementData || !balanceSheetData) return 0;
  
  const costOfRevenue = getValue(incomeStatementData, year, 'CostOfRevenue');
  const avgPayables = getAverage(balanceSheetData, year, 'AccountsPayableCurrent');
  
  return avgPayables !== 0 ? costOfRevenue / avgPayables : 0;
};

// Calculated fields registry
export const calculatedFields = {
  ReturnOnEquity: calculateReturnOnEquity,
  ReturnOnAssets: calculateReturnOnAssets,
  ReturnOnInvestedCapitalExcludingGoodwill: calculateReturnOnInvestedCapitalExcludingGoodwill,
  ReturnOnInvestedCapitalIncludingGoodwill: calculateReturnOnInvestedCapitalIncludingGoodwill,
  GrossMarginAsPercentOfRevenue: calculateGrossMarginAsPercentOfRevenue,
  OperatingIncomeAsPercentOfRevenue: calculateOperatingIncomeAsPercentOfRevenue,
  NetIncomeAsPercentOfRevenue: calculateNetIncomeAsPercentOfRevenue,
  EffectiveInterestRate: calculateEffectiveInterestRate,
  InterestBurden: calculateInterestBurden,
  EffectiveTaxRate: calculateEffectiveTaxRate,
  TaxBurden: calculateTaxBurden,
  AssetTurnover: calculateAssetTurnover,
  PropertyPlantAndEquipmentTurnover: calculatePropertyPlantAndEquipmentTurnover,
  CashTurnover: calculateCashTurnover,
  ReceivablesCurrentTurnover: calculateReceivablesCurrentTurnover,
  InventoryTurnover: calculateInventoryTurnover,
  AccountsPayableCurrentTurnover: calculateAccountsPayableCurrentTurnover,
};

// Calculate all fields for a given year
export const calculateAllFields = (
  data: OperationalPerformanceData,
  year: number,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData,
  investedCapitalData?: InvestedCapitalData,
  nopatData?: NOPATData
): Record<string, number> => {
  const calculated: Record<string, number> = {};

  // Return metrics
  calculated.ReturnOnEquity = calculateReturnOnEquity(data, year, incomeStatementData, balanceSheetData);
  calculated.ReturnOnAssets = calculateReturnOnAssets(data, year, incomeStatementData, balanceSheetData);
  calculated.ReturnOnInvestedCapitalExcludingGoodwill = calculateReturnOnInvestedCapitalExcludingGoodwill(data, year, nopatData, investedCapitalData);
  calculated.ReturnOnInvestedCapitalIncludingGoodwill = calculateReturnOnInvestedCapitalIncludingGoodwill(data, year, nopatData, investedCapitalData);

  // Margin metrics
  calculated.GrossMarginAsPercentOfRevenue = calculateGrossMarginAsPercentOfRevenue(data, year, incomeStatementData);
  calculated.OperatingIncomeAsPercentOfRevenue = calculateOperatingIncomeAsPercentOfRevenue(data, year, incomeStatementData);
  calculated.NetIncomeAsPercentOfRevenue = calculateNetIncomeAsPercentOfRevenue(data, year, incomeStatementData);

  // Interest and tax metrics
  calculated.EffectiveInterestRate = calculateEffectiveInterestRate(data, year, incomeStatementData, balanceSheetData);
  calculated.InterestBurden = calculateInterestBurden(data, year, incomeStatementData);
  calculated.EffectiveTaxRate = calculateEffectiveTaxRate(data, year, incomeStatementData);
  calculated.TaxBurden = calculateTaxBurden(data, year, incomeStatementData);

  // Turnover metrics
  calculated.AssetTurnover = calculateAssetTurnover(data, year, incomeStatementData, balanceSheetData);
  calculated.PropertyPlantAndEquipmentTurnover = calculatePropertyPlantAndEquipmentTurnover(data, year, incomeStatementData, balanceSheetData);
  calculated.CashTurnover = calculateCashTurnover(data, year, incomeStatementData, balanceSheetData);
  calculated.ReceivablesCurrentTurnover = calculateReceivablesCurrentTurnover(data, year, incomeStatementData, balanceSheetData);
  calculated.InventoryTurnover = calculateInventoryTurnover(data, year, incomeStatementData, balanceSheetData);
  calculated.AccountsPayableCurrentTurnover = calculateAccountsPayableCurrentTurnover(data, year, incomeStatementData, balanceSheetData);

  return calculated;
};

// Helper to check if field is calculated (all fields are calculated for operational performance)
export const isCalculatedField = (field: string): boolean => {
  return field in calculatedFields;
};

// Helper to check if field is input (no input fields for operational performance)
export const isInputField = (_field: string): boolean => {
  return false;
};


