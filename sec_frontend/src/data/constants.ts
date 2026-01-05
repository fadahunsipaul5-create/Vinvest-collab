// Constants extracted from costcoMockData.ts to eliminate dependency on mock data

export const years = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

export const tableConfigs = [
  {
    id: 'balanceSheet',
    title: 'COST Balance Sheet Expanded',
    isEditable: true
  },
  {
    id: 'incomeStatement',
    title: 'COST Income Statement Expanded',
    isEditable: true
  },
  {
    id: 'incomeStatementCommonSize',
    title: 'COST Income Statement Common Size',
    isEditable: false
  },
  {
    id: 'balanceSheetCommonSize',
    title: 'COST Balance Sheet Common Size',
    isEditable: false
  },
  {
    id: 'ppeChanges',
    title: 'COST PPE Changes',
    isEditable: false
  },
  {
    id: 'cashFlow',
    title: 'COST Free Cash Flow',
    isEditable: false
  },
  {
    id: 'nopat',
    title: 'COST NOPAT',
    isEditable: false
  },
  {
    id: 'investedCapital',
    title: 'COST Invested Capital',
    isEditable: false
  },
  {
    id: 'roicPerformance',
    title: 'COST ROIC Performance',
    isEditable: false
  },
  {
    id: 'financingHealth',
    title: 'COST Financing Health',
    isEditable: false
  },
  {
    id: 'forecastedStatements',
    title: 'COST Forecasted Statements',
    isEditable: false
  }
];

// Balance Sheet Hierarchical Structure
export const balanceSheetStructure = {
  'Assets': {
    'AssetsCurrent': {
      'CashAndCashEquivalents': 'Cash And Cash Equivalents',
      'ShortTermInvestments': 'Short Term Investments',
      'ReceivablesCurrent': 'Receivables',
      'Inventory': 'Inventory',
      'DeferredTaxAssetsCurrentBS': 'Deferred Tax Assets Current',
      'OtherAssetsCurrent': 'Other Assets Current'
    },
    'AssetsNoncurrent': {
      'PropertyPlantAndEquipmentNet': 'Property Plant And Equipment Net',
      'OperatingLeaseAssetsNoncurrent': 'Operating Lease Assets',
      'FinanceLeaseAssetsNoncurrent': 'Finance Lease Assets',
      'Goodwill': 'Goodwill',
      'DeferredIncomeTaxAssetsNoncurrent': 'Deferred Income Tax Assets',
      'OtherAssetsNoncurrent': 'Other Assets Noncurrent',
      'ReceivablesNoncurrent': 'Receivables Noncurrent',
      'VariableLeaseAssets': 'Variable Lease Assets'
    }
  },
  'Liabilities': {
    'LiabilitiesCurrent': {
      'AccountsPayableCurrent': 'Accounts Payable Current',
      'EmployeeLiabilitiesCurrent': 'Employee Liabilities Current',
      'AccruedLiabilitiesCurrent': 'Accrued Liabilities Current',
      'AccruedIncomeTaxesCurrent': 'Accrued Income Taxes Current',
      'DeferredRevenueCurrent': 'Deferred Revenue Current',
      'LongTermDebtCurrent': 'Long Term Debt Current',
      'OperatingLeaseLiabilitiesCurrent': 'Operating Lease Liabilities Current',
      'FinanceLeaseLiabilitiesCurrent': 'Finance Lease Liabilities Current',
      'OtherLiabilitiesCurrent': 'Other Liabilities Current'
    },
    'LiabilitiesNoncurrent': {
      'LongTermDebtNoncurrent': 'Long Term Debt Noncurrent',
      'OperatingLeaseLiabilitiesNoncurrent': 'Operating Lease Liabilities',
      'FinanceLeaseLiabilitiesNoncurrent': 'Finance Lease Liabilities Noncurrent',
      'DeferredIncomeTaxLiabilitiesNoncurrent': 'Deferred Income Tax Liabilities',
      'OtherLiabilitiesNoncurrent': 'Other Liabilities Noncurrent'
    }
  },
  'Equity': {
    'CommonStockEquity': 'Common Stock Equity',
    'PaidInCapitalCommonStock': 'Paid In Capital Common Stock',
    'AccumulatedOtherComprehensiveIncomeLossNetOfTax': 'Accumulated Other Comprehensive Income',
    'NoncontrollingInterest': 'Noncontrolling Interest',
    'NoncontrollingInterests': 'Noncontrolling Interests',
    'RetainedEarningsAccumulated': 'Retained Earnings Accumulated'
  },
  'CalculatedTotals': {
    'TotalAssets': 'Total Assets',
    'TotalCurrentAssets': 'Total Current Assets',
    'TotalNoncurrentAssets': 'Total Noncurrent Assets',
    'TotalLiabilities': 'Total Liabilities',
    'TotalCurrentLiabilities': 'Total Current Liabilities',
    'TotalNoncurrentLiabilities': 'Total Noncurrent Liabilities',
    'TotalEquity': 'Total Equity',
    'TotalLiabilitiesAndEquity': 'Total Liabilities And Equity'
  },
  'AdditionalMetrics': {
    'Debt': 'Total Debt',
    'ForeignTaxCreditCarryForward': 'Foreign Tax Credit Carry Forward',
    'CapitalExpenditures': 'Capital Expenditures',
    'OperatingCash': 'Operating Cash',
    'ExcessCash': 'Excess Cash'
  }
};

// Income Statement Hierarchical Structure
export const incomeStatementStructure = {
  'Revenue': {
    'Revenue': 'Revenue',
    'CostOfRevenue': 'Cost Of Revenue'
  },
  'GrossIncome': {
    'GrossProfit': 'Gross Profit'
  },
  'OperatingExpenses': {
    'SGAExpense': 'SGA Expense',
    'SellingAndMarketingExpense': 'Selling And Marketing Expense',
    'GeneralAndAdministrativeExpense': 'General And Administrative Expense',
    'ResearchAndDevelopment': 'Research And Development',
    'FulfillmentExpense': 'Fulfillment Expense',
    'TechnologyExpense': 'Technology Expense',
    'DepreciationAmortization': 'Depreciation And Amortization',
    'OtherOperatingExpense': 'Other Operating Expense'
  },
  'OperatingIncome': {
    'OperatingIncome': 'Operating Income'
  },
  'NonOperatingIncome': {
    'InterestExpense': 'Interest Expense',
    'InterestIncome': 'Interest Income',
    'OtherIncome': 'Other Income'
  },
  'PreTaxIncome': {
    'PretaxIncome': 'Pretax Income'
  },
  'TaxProvision': {
    'TaxProvision': 'Tax Provision'
  },
  'NetIncome': {
    'NetIncome': 'Net Income',
    'NetIncomeNoncontrolling': 'Net Income Noncontrolling'
  }
};
