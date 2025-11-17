// Free Cash Flow Table Calculation Utilities
// Based on backend/sec_app_2/calculators/free_cash_flow.py

export interface FreeCashFlowData {
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

export interface BalanceSheetData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface InvestedCapitalData {
  [year: number]: {
    [field: string]: number | string;
  };
}

export interface PPEChangesData {
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

// Get balance sheet field value
const getBalanceSheetField = (balanceSheetData: BalanceSheetData, year: number, field: string): number => {
  return getFieldValue(balanceSheetData, year, field);
};

// Get invested capital field value
const getInvestedCapitalField = (investedCapitalData: InvestedCapitalData, year: number, field: string): number => {
  return getFieldValue(investedCapitalData, year, field);
};

// Get PPE changes field value
const getPPEChangesField = (ppeChangesData: PPEChangesData, year: number, field: string): number => {
  return getFieldValue(ppeChangesData, year, field);
};

// Helper function to calculate change between current and prior year
const calculateChange = (current: number, prior: number): number => {
  return current - prior;
};

// 1. NOPAT (copied from NOPAT table)
export const calculateNOPAT = (
  _data: FreeCashFlowData,
  year: number,
  nopatData?: NOPATData
): number => {
  if (!nopatData) {
    console.warn(`Missing NOPAT data for NOPAT calculation for year ${year}`);
    return 0;
  }

  try {
    const result = getNOPATField(nopatData, year, 'NOPAT');
    console.debug(`NOPAT for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating NOPAT for year ${year}:`, error);
    return 0;
  }
};

// 2. Depreciation (copied from NOPAT table)
export const calculateDepreciation = (
  _data: FreeCashFlowData,
  year: number,
  nopatData?: NOPATData
): number => {
  if (!nopatData) {
    console.warn(`Missing NOPAT data for Depreciation calculation for year ${year}`);
    return 0;
  }

  try {
    const result = getNOPATField(nopatData, year, 'Depreciation');
    console.debug(`Depreciation for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Depreciation for year ${year}:`, error);
    return 0;
  }
};

// 3. EBITA Adjusted (copied from NOPAT table)
export const calculateEBITAAdjusted = (
  _data: FreeCashFlowData,
  year: number,
  nopatData?: NOPATData
): number => {
  if (!nopatData) {
    console.warn(`Missing NOPAT data for EBITA Adjusted calculation for year ${year}`);
    return 0;
  }

  try {
    const result = getNOPATField(nopatData, year, 'EBITAAdjusted');
    console.debug(`EBITA Adjusted for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating EBITA Adjusted for year ${year}:`, error);
    return 0;
  }
};

// 4. Change in Operating Working Capital
export const calculateChangeInOperatingWorkingCapital = (
  _data: FreeCashFlowData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!investedCapitalData) {
    console.warn(`Missing invested capital data for Change in Operating Working Capital calculation for year ${year}`);
    return 0;
  }

  try {
    const current = getInvestedCapitalField(investedCapitalData, year, 'OperatingWorkingCapital');
    const prior = getInvestedCapitalField(investedCapitalData, year - 1, 'OperatingWorkingCapital');
    const result = calculateChange(current, prior);
    console.debug(`Change in Operating Working Capital for ${year}: ${current} - ${prior} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Operating Working Capital for year ${year}:`, error);
    return 0;
  }
};

// 5. Change in Operating Lease Assets
export const calculateChangeInOperatingLeaseAssets = (
  _data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    console.warn(`Missing balance sheet data for Change in Operating Lease Assets calculation for year ${year}`);
    return 0;
  }

  try {
    const current = getBalanceSheetField(balanceSheetData, year, 'OperatingLeaseAssets');
    const prior = getBalanceSheetField(balanceSheetData, year - 1, 'OperatingLeaseAssets');
    const result = calculateChange(current, prior);
    console.debug(`Change in Operating Lease Assets for ${year}: ${current} - ${prior} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Operating Lease Assets for year ${year}:`, error);
    return 0;
  }
};

// 6. Change in Variable Lease Assets
export const calculateChangeInVariableLeaseAssets = (
  _data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`Balance sheet data not yet populated for year ${year} - Change in Variable Lease Assets`);
    } else {
    console.warn(`Missing balance sheet data for Change in Variable Lease Assets calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const current = getBalanceSheetField(balanceSheetData, year, 'VariableLeaseAssets');
    const prior = getBalanceSheetField(balanceSheetData, year - 1, 'VariableLeaseAssets');
    const result = calculateChange(current, prior);
    console.debug(`Change in Variable Lease Assets for ${year}: ${current} - ${prior} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Variable Lease Assets for year ${year}:`, error);
    return 0;
  }
};

// 7. Change in Finance Lease Assets
export const calculateChangeInFinanceLeaseAssets = (
  _data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`Balance sheet data not yet populated for year ${year} - Change in Finance Lease Assets`);
    } else {
    console.warn(`Missing balance sheet data for Change in Finance Lease Assets calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const current = getBalanceSheetField(balanceSheetData, year, 'FinanceLeaseAssets');
    const prior = getBalanceSheetField(balanceSheetData, year - 1, 'FinanceLeaseAssets');
    const result = calculateChange(current, prior);
    console.debug(`Change in Finance Lease Assets for ${year}: ${current} - ${prior} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Finance Lease Assets for year ${year}:`, error);
    return 0;
  }
};

// 8. Change in Goodwill
export const calculateChangeInGoodwill = (
  _data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`Balance sheet data not yet populated for year ${year} - Change in Goodwill`);
    } else {
    console.warn(`Missing balance sheet data for Change in Goodwill calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const current = getBalanceSheetField(balanceSheetData, year, 'Goodwill');
    const prior = getBalanceSheetField(balanceSheetData, year - 1, 'Goodwill');
    const result = calculateChange(current, prior);
    console.debug(`Change in Goodwill for ${year}: ${current} - ${prior} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Goodwill for year ${year}:`, error);
    return 0;
  }
};

// 9. Change in Net Other Noncurrent Assets
export const calculateChangeInNetOtherNoncurrentAssets = (
  _data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  if (!balanceSheetData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`Balance sheet data not yet populated for year ${year} - Change in Net Other Noncurrent Assets`);
    } else {
    console.warn(`Missing balance sheet data for Change in Net Other Noncurrent Assets calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const currentOtherAssets = getBalanceSheetField(balanceSheetData, year, 'OtherAssetsNoncurrent');
    const currentOtherLiabilities = getBalanceSheetField(balanceSheetData, year, 'OtherLiabilitiesNoncurrent');
    const current = currentOtherAssets - currentOtherLiabilities;
    
    const priorOtherAssets = getBalanceSheetField(balanceSheetData, year - 1, 'OtherAssetsNoncurrent');
    const priorOtherLiabilities = getBalanceSheetField(balanceSheetData, year - 1, 'OtherLiabilitiesNoncurrent');
    const prior = priorOtherAssets - priorOtherLiabilities;
    
    const result = calculateChange(current, prior);
    console.debug(`Change in Net Other Noncurrent Assets for ${year}: ${current} - ${prior} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Net Other Noncurrent Assets for year ${year}:`, error);
    return 0;
  }
};

// 10. Capital Expenditures (from Free Cash Flow table)
export const calculateCapitalExpenditures = (
  data: FreeCashFlowData,
  year: number
): number => {
  try {
    const result = getFieldValue(data, year, 'CapitalExpenditures');
    console.debug(`Capital Expenditures for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Capital Expenditures for year ${year}:`, error);
    return 0;
  }
};

// 11. Change in Excess Cash
export const calculateChangeInExcessCash = (
  _data: FreeCashFlowData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!investedCapitalData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`Invested capital data not yet populated for year ${year} - Change in Excess Cash`);
    } else {
    console.warn(`Missing invested capital data for Change in Excess Cash calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const current = getInvestedCapitalField(investedCapitalData, year, 'ExcessCash');
    const prior = getInvestedCapitalField(investedCapitalData, year - 1, 'ExcessCash');
    // Note: This is calculated as prior - current (decrease in excess cash)
    const result = prior - current;
    console.debug(`Change in Excess Cash for ${year}: ${prior} - ${current} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Excess Cash for year ${year}:`, error);
    return 0;
  }
};

// 12. Change in Foreign Tax Credit Carry Forward
export const calculateChangeInForeignTaxCreditCarryForward = (
  _data: FreeCashFlowData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!investedCapitalData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`Invested capital data not yet populated for year ${year} - Change in Foreign Tax Credit Carry Forward`);
    } else {
    console.warn(`Missing invested capital data for Change in Foreign Tax Credit Carry Forward calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const current = getInvestedCapitalField(investedCapitalData, year, 'ForeignTaxCreditCarryForward');
    const prior = getInvestedCapitalField(investedCapitalData, year - 1, 'ForeignTaxCreditCarryForward');
    // Note: This is calculated as prior - current (decrease in carry forward)
    const result = prior - current;
    console.debug(`Change in Foreign Tax Credit Carry Forward for ${year}: ${prior} - ${current} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Change in Foreign Tax Credit Carry Forward for year ${year}:`, error);
    return 0;
  }
};

// 13. Interest Income (from Income Statement)
export const calculateInterestIncome = (
  _data: FreeCashFlowData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) {
    console.warn(`Missing income statement data for Interest Income calculation for year ${year}`);
    return 0;
  }

  try {
    const result = getIncomeStatementField(incomeStatementData, year, 'InterestIncome');
    console.debug(`Interest Income for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Interest Income for year ${year}:`, error);
    return 0;
  }
};

// 14. Other Income (from Income Statement)
export const calculateOtherIncome = (
  _data: FreeCashFlowData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) {
    console.warn(`Missing income statement data for Other Income calculation for year ${year}`);
    return 0;
  }

  try {
    const result = getIncomeStatementField(incomeStatementData, year, 'OtherIncome');
    console.debug(`Other Income for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Other Income for year ${year}:`, error);
    return 0;
  }
};

// 15. Taxes Non-operating (from Free Cash Flow table)
export const calculateTaxesNonoperating = (
  data: FreeCashFlowData,
  year: number
): number => {
  try {
    const result = getFieldValue(data, year, 'TaxesNonoperating');
    console.debug(`Taxes Non-operating for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Taxes Non-operating for year ${year}:`, error);
    return 0;
  }
};

// 16. Foreign Currency Adjustment (from Income Statement)
export const calculateForeignCurrencyAdjustment = (
  _data: FreeCashFlowData,
  year: number,
  incomeStatementData?: IncomeStatementData
): number => {
  if (!incomeStatementData) {
    console.warn(`Missing income statement data for Foreign Currency Adjustment calculation for year ${year}`);
    return 0;
  }

  try {
    const result = getIncomeStatementField(incomeStatementData, year, 'ForeignCurrencyAdjustment');
    console.debug(`Foreign Currency Adjustment for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Foreign Currency Adjustment for year ${year}:`, error);
    return 0;
  }
};

// 17. Unexplained Changes in PPE (from PPE Changes table)
export const calculateUnexplainedChangesInPPE = (
  _data: FreeCashFlowData,
  year: number,
  ppeChangesData?: PPEChangesData
): number => {
  if (!ppeChangesData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`PPE changes data not yet populated for year ${year} - Unexplained Changes in PPE`);
    } else {
    console.warn(`Missing PPE changes data for Unexplained Changes in PPE calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const result = getPPEChangesField(ppeChangesData, year, 'UnexplainedChangesInPPE');
    console.debug(`Unexplained Changes in PPE for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Unexplained Changes in PPE for year ${year}:`, error);
    return 0;
  }
};

// 18. Gross Cash Flow
export const calculateGrossCashFlow = (
  _data: FreeCashFlowData,
  year: number,
  nopatData?: NOPATData
): number => {
  if (!nopatData) {
    console.warn(`Missing NOPAT data for Gross Cash Flow calculation for year ${year}`);
    return 0;
  }

  try {
    const nopat = getNOPATField(nopatData, year, 'NOPAT');
    const depreciation = getNOPATField(nopatData, year, 'Depreciation');
    const result = nopat + depreciation;
    console.debug(`Gross Cash Flow for ${year}: ${nopat} + ${depreciation} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Gross Cash Flow for year ${year}:`, error);
    return 0;
  }
};

// 19. Free Cash Flow (main calculation)
export const calculateFreeCashFlow = (
  data: FreeCashFlowData,
  year: number,
  nopatData?: NOPATData,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData,
  investedCapitalData?: InvestedCapitalData,
  ppeChangesData?: PPEChangesData
): number => {
  try {
    // Get all components
    const grossCashFlow = calculateGrossCashFlow(data, year, nopatData);
    const interestIncome = calculateInterestIncome(data, year, incomeStatementData);
    const otherIncome = calculateOtherIncome(data, year, incomeStatementData);
    const foreignCurrencyAdjustment = calculateForeignCurrencyAdjustment(data, year, incomeStatementData);
    const changeInWorkingCapital = calculateChangeInOperatingWorkingCapital(data, year, investedCapitalData);
    const changeInOperatingLeaseAssets = calculateChangeInOperatingLeaseAssets(data, year, balanceSheetData);
    const changeInVariableLeaseAssets = calculateChangeInVariableLeaseAssets(data, year, balanceSheetData);
    const changeInFinanceLeaseAssets = calculateChangeInFinanceLeaseAssets(data, year, balanceSheetData);
    const changeInGoodwill = calculateChangeInGoodwill(data, year, balanceSheetData);
    const changeInNetOtherNoncurrentAssets = calculateChangeInNetOtherNoncurrentAssets(data, year, balanceSheetData);
    const capitalExpenditures = calculateCapitalExpenditures(data, year);
    const taxesNonoperating = calculateTaxesNonoperating(data, year);
    const changeInExcessCash = calculateChangeInExcessCash(data, year, investedCapitalData);
    const changeInForeignTaxCreditCarryForward = calculateChangeInForeignTaxCreditCarryForward(data, year, investedCapitalData);
    const unexplainedChangesInPPE = calculateUnexplainedChangesInPPE(data, year, ppeChangesData);

    // Calculate Free Cash Flow
    const result = grossCashFlow + interestIncome + otherIncome + foreignCurrencyAdjustment
      - changeInWorkingCapital - changeInOperatingLeaseAssets - changeInVariableLeaseAssets
      - changeInFinanceLeaseAssets - changeInGoodwill - changeInNetOtherNoncurrentAssets
      - capitalExpenditures - taxesNonoperating - changeInExcessCash - changeInForeignTaxCreditCarryForward
      - unexplainedChangesInPPE;

    console.debug(`Free Cash Flow for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Free Cash Flow for year ${year}:`, error);
    return 0;
  }
};

// 20. Discount Factor
export const calculateDiscountFactor = (
  data: FreeCashFlowData,
  year: number,
  wacc: number = 0.1,
  baseYear?: number
): number => {
  try {
    const waccValue = getFieldValue(data, year, 'WeightedAverageCostOfCapital') || wacc;
    const baseYearValue = baseYear || Math.min(...Object.keys(data).map(Number).filter(y => y > 0));
    const order = year - baseYearValue;
    const result = order <= 0 ? 1.0 : 1 / Math.pow(1 + waccValue, order);
    console.debug(`Discount Factor for ${year}: 1 / (1 + ${waccValue})^${order} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Discount Factor for year ${year}:`, error);
    return 1.0;
  }
};

// 21. Present Value of Free Cash Flow
export const calculatePresentValueOfFreeCashFlow = (
  data: FreeCashFlowData,
  year: number
): number => {
  try {
    const discountFactor = getFieldValue(data, year, 'DiscountFactor');
    const freeCashFlow = getFieldValue(data, year, 'FreeCashFlow');
    const result = discountFactor * freeCashFlow;
    console.debug(`Present Value of Free Cash Flow for ${year}: ${discountFactor} × ${freeCashFlow} = ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Present Value of Free Cash Flow for year ${year}:`, error);
    return 0;
  }
};

// Additional calculation functions for Excel structure fields

// Net Operating Profit After Taxes (alias for NOPAT)
export const calculateNetOperatingProfitAfterTaxes = calculateNOPAT;

// Decrease in Working Capital (negative of change)
export const calculateDecreaseInWorkingCapital = (
  data: FreeCashFlowData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  const change = calculateChangeInOperatingWorkingCapital(data, year, investedCapitalData);
  return -change; // Decrease is negative of change
};

// Decrease in Operating Leases (negative of change)
export const calculateDecreaseInOperatingLeases = (
  data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  const change = calculateChangeInOperatingLeaseAssets(data, year, balanceSheetData);
  return -change; // Decrease is negative of change
};

// Decrease in Variable Leases (negative of change)
export const calculateDecreaseInVariableLeases = (
  data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  const change = calculateChangeInVariableLeaseAssets(data, year, balanceSheetData);
  return -change; // Decrease is negative of change
};

// Decrease in Finance Leases (negative of change)
export const calculateDecreaseInFinanceLeases = (
  data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  const change = calculateChangeInFinanceLeaseAssets(data, year, balanceSheetData);
  return -change; // Decrease is negative of change
};

// Decrease in Goodwill (negative of change)
export const calculateDecreaseInGoodwill = (
  data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  const change = calculateChangeInGoodwill(data, year, balanceSheetData);
  return -change; // Decrease is negative of change
};

// Decrease in Other Assets Net of Other Liabilities (negative of change)
export const calculateDecreaseInOtherAssetsNetOfOtherLiabilities = (
  data: FreeCashFlowData,
  year: number,
  balanceSheetData?: BalanceSheetData
): number => {
  const change = calculateChangeInNetOtherNoncurrentAssets(data, year, balanceSheetData);
  return -change; // Decrease is negative of change
};

// Decrease in Excess Cash (negative of change)
export const calculateDecreaseInExcessCash = (
  data: FreeCashFlowData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  const change = calculateChangeInExcessCash(data, year, investedCapitalData);
  return -change; // Decrease is negative of change
};

// Decrease in Foreign Tax Credit Carry Forward (negative of change)
export const calculateDecreaseInForeignTaxCreditCarryForward = (
  data: FreeCashFlowData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  const change = calculateChangeInForeignTaxCreditCarryForward(data, year, investedCapitalData);
  return -change; // Decrease is negative of change
};

// Cash Flow to Investors (same as Free Cash Flow)
export const calculateCashFlowToInvestors = calculateFreeCashFlow;

// Excess Cash (from Invested Capital)
export const calculateExcessCash = (
  _data: FreeCashFlowData,
  year: number,
  investedCapitalData?: InvestedCapitalData
): number => {
  if (!investedCapitalData) {
    const isForecastYear = year >= 2025;
    if (isForecastYear) {
      console.debug(`Invested capital data not yet populated for year ${year} - Excess Cash`);
    } else {
    console.warn(`Missing invested capital data for Excess Cash calculation for year ${year}`);
    }
    return 0;
  }

  try {
    const result = getInvestedCapitalField(investedCapitalData, year, 'ExcessCash');
    console.debug(`Excess Cash for ${year}: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error calculating Excess Cash for year ${year}:`, error);
    return 0;
  }
};

// Present Value (alias for Present Value of Free Cash Flow)
export const calculatePresentValue = calculatePresentValueOfFreeCashFlow;

// Map of calculated fields and their calculation functions
export const calculatedFields = {
  // Excel structure field names
  NetOperatingProfitAfterTaxes: calculateNetOperatingProfitAfterTaxes,
  Depreciation: calculateDepreciation,
  GrossCashFlow: calculateGrossCashFlow,
  DecreaseInWorkingCapital: calculateDecreaseInWorkingCapital,
  CapitalExpenditures: calculateCapitalExpenditures,
  DecreaseInOperatingLeases: calculateDecreaseInOperatingLeases,
  DecreaseInVariableLeases: calculateDecreaseInVariableLeases,
  DecreaseInFinanceLeases: calculateDecreaseInFinanceLeases,
  DecreaseInGoodwill: calculateDecreaseInGoodwill,
  DecreaseInOtherAssetsNetOfOtherLiabilities: calculateDecreaseInOtherAssetsNetOfOtherLiabilities,
  FreeCashFlow: calculateFreeCashFlow,
  InterestIncome: calculateInterestIncome,
  OtherIncome: calculateOtherIncome,
  TaxesNonoperating: calculateTaxesNonoperating,
  DecreaseInExcessCash: calculateDecreaseInExcessCash,
  DecreaseInForeignTaxCreditCarryForward: calculateDecreaseInForeignTaxCreditCarryForward,
  ForeignCurrencyAdjustment: calculateForeignCurrencyAdjustment,
  UnexplainedChangesInPPE: calculateUnexplainedChangesInPPE,
  CashFlowToInvestors: calculateCashFlowToInvestors,
  ExcessCash: calculateExcessCash,
  DiscountFactor: calculateDiscountFactor,
  PresentValue: calculatePresentValue,
  
  // Original field names (for backward compatibility)
  NOPAT: calculateNOPAT,
  EBITAAdjusted: calculateEBITAAdjusted,
  ChangeInOperatingWorkingCapital: calculateChangeInOperatingWorkingCapital,
  ChangeInOperatingLeaseAssets: calculateChangeInOperatingLeaseAssets,
  ChangeInVariableLeaseAssets: calculateChangeInVariableLeaseAssets,
  ChangeInFinanceLeaseAssets: calculateChangeInFinanceLeaseAssets,
  ChangeInGoodwill: calculateChangeInGoodwill,
  ChangeInNetOtherNoncurrentAssets: calculateChangeInNetOtherNoncurrentAssets,
  ChangeInExcessCash: calculateChangeInExcessCash,
  ChangeInForeignTaxCreditCarryForward: calculateChangeInForeignTaxCreditCarryForward,
  PresentValueOfFreeCashFlow: calculatePresentValueOfFreeCashFlow,
};

// Dependencies map - which fields depend on which input fields
export const dependencies = {
  // Excel structure field names
  NetOperatingProfitAfterTaxes: ['GrossCashFlow', 'FreeCashFlow'],
  Depreciation: ['GrossCashFlow'],
  GrossCashFlow: ['FreeCashFlow'],
  DecreaseInWorkingCapital: ['FreeCashFlow'],
  CapitalExpenditures: ['FreeCashFlow'],
  DecreaseInOperatingLeases: ['FreeCashFlow'],
  DecreaseInVariableLeases: ['FreeCashFlow'],
  DecreaseInFinanceLeases: ['FreeCashFlow'],
  DecreaseInGoodwill: ['FreeCashFlow'],
  DecreaseInOtherAssetsNetOfOtherLiabilities: ['FreeCashFlow'],
  FreeCashFlow: ['PresentValue'],
  InterestIncome: ['FreeCashFlow'],
  OtherIncome: ['FreeCashFlow'],
  TaxesNonoperating: ['FreeCashFlow'],
  DecreaseInExcessCash: ['FreeCashFlow'],
  DecreaseInForeignTaxCreditCarryForward: ['FreeCashFlow'],
  ForeignCurrencyAdjustment: ['FreeCashFlow'],
  UnexplainedChangesInPPE: ['FreeCashFlow'],
  CashFlowToInvestors: ['PresentValue'],
  ExcessCash: ['DecreaseInExcessCash', 'FreeCashFlow'],
  DiscountFactor: ['PresentValue'],
  PresentValue: [],
  
  // Original field names (for backward compatibility)
  NOPAT: ['GrossCashFlow', 'FreeCashFlow'],
  EBITAAdjusted: ['GrossCashFlow'],
  OperatingWorkingCapital: ['ChangeInOperatingWorkingCapital', 'FreeCashFlow'],
  OperatingLeaseAssets: ['ChangeInOperatingLeaseAssets', 'FreeCashFlow'],
  VariableLeaseAssets: ['ChangeInVariableLeaseAssets', 'FreeCashFlow'],
  FinanceLeaseAssets: ['ChangeInFinanceLeaseAssets', 'FreeCashFlow'],
  Goodwill: ['ChangeInGoodwill', 'FreeCashFlow'],
  OtherAssetsNoncurrent: ['ChangeInNetOtherNoncurrentAssets', 'FreeCashFlow'],
  OtherLiabilitiesNoncurrent: ['ChangeInNetOtherNoncurrentAssets', 'FreeCashFlow'],
  ForeignTaxCreditCarryForward: ['ChangeInForeignTaxCreditCarryForward', 'FreeCashFlow'],
  WeightedAverageCostOfCapital: ['DiscountFactor', 'PresentValueOfFreeCashFlow'],
};

// Calculate all fields for a given year
export const calculateAllFields = (
  data: FreeCashFlowData,
  year: number,
  nopatData?: NOPATData,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData,
  investedCapitalData?: InvestedCapitalData,
  ppeChangesData?: PPEChangesData,
  wacc: number = 0.1
): { [field: string]: number } => {
  const calculated: { [field: string]: number } = {};
  
  // Update the data with any new calculated values to ensure proper cascading
  const updatedData = { ...data };
  if (!updatedData[year]) updatedData[year] = {};
  
  // Calculate fields in order (base fields first, then dependent fields)
  const calculationOrder = [
    'NetOperatingProfitAfterTaxes', 'Depreciation', 'GrossCashFlow',
    'DecreaseInWorkingCapital', 'CapitalExpenditures', 'DecreaseInOperatingLeases',
    'DecreaseInVariableLeases', 'DecreaseInFinanceLeases', 'DecreaseInGoodwill',
    'DecreaseInOtherAssetsNetOfOtherLiabilities', 'FreeCashFlow', 'InterestIncome',
    'OtherIncome', 'TaxesNonoperating', 'DecreaseInExcessCash',
    'DecreaseInForeignTaxCreditCarryForward', 'ForeignCurrencyAdjustment',
    'UnexplainedChangesInPPE', 'CashFlowToInvestors', 'ExcessCash',
    'DiscountFactor', 'PresentValue'
  ];
  
  for (const fieldName of calculationOrder) {
    const calcFunction = calculatedFields[fieldName as keyof typeof calculatedFields];
    if (calcFunction) {
      try {
        let value: number;
        if (['NOPAT', 'Depreciation', 'EBITAAdjusted'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, nopatData);
        } else if (['InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, incomeStatementData);
        } else if (['ChangeInOperatingLeaseAssets', 'ChangeInVariableLeaseAssets', 'ChangeInFinanceLeaseAssets', 'ChangeInGoodwill', 'ChangeInNetOtherNoncurrentAssets'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, balanceSheetData);
        } else if (['ChangeInOperatingWorkingCapital', 'ChangeInExcessCash', 'ChangeInForeignTaxCreditCarryForward'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, investedCapitalData);
        } else if (['UnexplainedChangesInPPE'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, ppeChangesData);
        } else if (['CapitalExpenditures', 'TaxesNonoperating'].includes(fieldName)) {
          value = calcFunction(updatedData, year);
        } else if (['GrossCashFlow'].includes(fieldName)) {
          value = calculateGrossCashFlow(updatedData, year, nopatData);
        } else if (['FreeCashFlow'].includes(fieldName)) {
          value = calculateFreeCashFlow(updatedData, year, nopatData, incomeStatementData, balanceSheetData, investedCapitalData, ppeChangesData);
        } else if (['DiscountFactor'].includes(fieldName)) {
          value = calculateDiscountFactor(updatedData, year, wacc);
        } else if (['PresentValueOfFreeCashFlow'].includes(fieldName)) {
          value = calculatePresentValueOfFreeCashFlow(updatedData, year);
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
  data: FreeCashFlowData,
  year: number,
  changedField: string,
  nopatData?: NOPATData,
  incomeStatementData?: IncomeStatementData,
  balanceSheetData?: BalanceSheetData,
  investedCapitalData?: InvestedCapitalData,
  ppeChangesData?: PPEChangesData,
  wacc: number = 0.1
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
        if (['NOPAT', 'Depreciation', 'EBITAAdjusted'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, nopatData);
        } else if (['InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, incomeStatementData);
        } else if (['ChangeInOperatingLeaseAssets', 'ChangeInVariableLeaseAssets', 'ChangeInFinanceLeaseAssets', 'ChangeInGoodwill', 'ChangeInNetOtherNoncurrentAssets'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, balanceSheetData);
        } else if (['ChangeInOperatingWorkingCapital', 'ChangeInExcessCash', 'ChangeInForeignTaxCreditCarryForward'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, investedCapitalData);
        } else if (['UnexplainedChangesInPPE'].includes(fieldName)) {
          value = (calcFunction as any)(updatedData, year, ppeChangesData);
        } else if (['CapitalExpenditures', 'TaxesNonoperating'].includes(fieldName)) {
          value = calcFunction(updatedData, year);
        } else if (['GrossCashFlow'].includes(fieldName)) {
          value = calculateGrossCashFlow(updatedData, year, nopatData);
        } else if (['FreeCashFlow'].includes(fieldName)) {
          value = calculateFreeCashFlow(updatedData, year, nopatData, incomeStatementData, balanceSheetData, investedCapitalData, ppeChangesData);
        } else if (['DiscountFactor'].includes(fieldName)) {
          value = calculateDiscountFactor(updatedData, year, wacc);
        } else if (['PresentValueOfFreeCashFlow'].includes(fieldName)) {
          value = calculatePresentValueOfFreeCashFlow(updatedData, year);
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

// Check if a field is an input field (Free Cash Flow has some input fields)
export const isInputField = (fieldName: string): boolean => {
  // Free Cash Flow has some input fields like CapitalExpenditures, TaxesNonoperating, WeightedAverageCostOfCapital
  const inputFields = ['CapitalExpenditures', 'TaxesNonoperating', 'WeightedAverageCostOfCapital'];
  return inputFields.includes(fieldName);
};
