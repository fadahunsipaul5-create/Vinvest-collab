import React, { useState, useEffect, useCallback, useRef } from 'react';

import { years } from '../data/constants';

import { ppeChangesReal } from '../data/ppeChangesReal';

import { balanceSheetReal } from '../data/balanceSheetReal';

import { investedCapitalReal } from '../data/investedCapitalReal';

import { nopatReal } from '../data/nopatReal';

import { freeCashFlowReal } from '../data/freeCashFlowReal';

import { financeHealthReal } from '../data/financeHealthReal';

import { roicReal } from '../data/roicReal';

import { balanceSheetCommonReal } from '../data/balanceSheetCommonReal';

import { incomeStatementCommonReal } from '../data/incomeStatementCommonReal';

import { operationalPerformanceReal } from '../data/operationalPerformanceReal';

import { cashFlowReal } from '../data/cashFlowReal';

import { walmartMockData } from '../data/walmartMockData';

import { bjMockData } from '../data/bjMockData';

import { dgMockData } from '../data/dgMockData';

import { dltrMockData } from '../data/dltrMockData';

import { tgtMockData } from '../data/tgtMockData';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCompanyData } from '../contexts/CompanyDataContext';

import baseUrl from './api';

import ThreeStatementModelTab from './tabs/ThreeStatementModelTab';
import InvestedCapitalTab from './tabs/InvestedCapitalTab';
import FreeCashFlowsTab from './tabs/FreeCashFlowsTab';
import ValuationSummaryTab from './tabs/ValuationSummaryTab';

import IncomeStatementTable from './tables/IncomeStatementTable';
import InvestedCapitalTable from './tables/InvestedCapitalTable';
import FreeCashFlowTable from './tables/FreeCashFlowTable';

interface CompanyTicker {
  ticker: string;
  name: string;
  display_name?: string;
}

import {

  recalculateDependentFields as calculateDependentFields,

  isCalculatedField as isIncomeCalculatedField,

  isInputField as isIncomeInputField

} from '../utils/incomeStatementCalculations';

// NOTE: formatMonetary helpers are used in table components; not needed in ValuationPage.

import {

  recalculateDependentFields as calculateBalanceSheetDependentFields,

  isCalculatedField as isBalanceSheetCalculatedField,

  isInputField as isBalanceSheetInputField

} from '../utils/balanceSheetCalculations';

import {

  calculateAllFields as calculateAllNOPATFields,

  isCalculatedField as isNOPATCalculatedField,

  isInputField as isNOPATInputField

} from '../utils/nopatCalculations';

import {

  recalculateDependentFields as calculateInvestedCapitalDependentFields,

  calculateAllFields as calculateAllInvestedCapitalFields,

  isCalculatedField as isInvestedCapitalCalculatedField,

  isInputField as isInvestedCapitalInputField

} from '../utils/investedCapitalCalculations';

import {

  recalculateDependentFields as _calculatePPEChangesDependentFields,

  calculateAllFields as calculateAllPPEChangesFields,

  isCalculatedField as isPPEChangesCalculatedField,

  isInputField as isPPEChangesInputField

} from '../utils/ppeChangesCalculations';

import {

  recalculateDependentFields as _calculateROICDependentFields,

  calculateAllFields as calculateAllROICFields,

  isCalculatedField as isROICCalculatedField,

  isInputField as isROICInputField

} from '../utils/roicCalculations';

import {

  recalculateDependentFields as _calculateFinancingHealthDependentFields,

  calculateAllFields as calculateAllFinancingHealthFields,

  isCalculatedField as isFinancingHealthCalculatedField,

  isInputField as isFinancingHealthInputField

} from '../utils/financingHealthCalculations';

import {

  recalculateDependentFields as _calculateFreeCashFlowDependentFields,

  calculateAllFields as calculateAllFreeCashFlowFields,

  isCalculatedField as isFreeCashFlowCalculatedField,

  isInputField as isFreeCashFlowInputField

} from '../utils/freeCashFlowCalculations';

import {

  calculateAllFields as calculateAllOperationalPerformanceFields,

  isCalculatedField as _isOperationalPerformanceCalculatedField,

  isInputField as _isOperationalPerformanceInputField

} from '../utils/operationalPerformanceCalculations';



// removed navigate-based routing for balance sheet



// NOTE: Forecast display helpers were moved to `src/utils/forecastDisplay.tsx`.



interface CellData {

  [key: string]: number | string;

}



interface TableData {

  [year: number]: CellData;

}



// NOTE: EditableTableProps was unused; removed to satisfy TS noUnusedLocals.



// Income Statement table to match the provided image

// ValuationPage props interface
interface ValuationPageProps {
  onClose?: () => void;
  initialCompany?: string;
  onCompanyChange?: (company: string) => void;
}

// Helper function to map balance sheet keys
const mapBalanceSheetKey = (k: string): string => {
  const mapping: { [key: string]: string } = {
    'CashAndCashEquivalentsAtCarryingValue': 'CashAndCashEquivalents',
    'CashCashEquivalentsAndShortTermInvestments': 'CashAndCashEquivalents',
    'Assets': 'Assets',
    'AssetsCurrent': 'AssetsCurrent',
    'PropertyPlantAndEquipmentNet': 'PropertyPlantAndEquipmentNet',
    'PropertyPlantAndEquipmentGross': 'PropertyPlantAndEquipmentGross',
    'AccumulatedDepreciationDepletionAndAmortizationPropertyPlantAndEquipment': 'AccumulatedDepreciationDepletionAndAmortizationPropertyPlantAndEquipment',
    'Goodwill': 'Goodwill',
    'IntangibleAssetsNetExcludingGoodwill': 'IntangibleAssetsNetExcludingGoodwill',
    'LongTermInvestments': 'LongTermInvestments',
    'OtherAssetsNoncurrent': 'OtherAssetsNoncurrent',
    'Liabilities': 'Liabilities',
    'LiabilitiesCurrent': 'LiabilitiesCurrent',
    'LiabilitiesNoncurrent': 'LiabilitiesNoncurrent',
    'LongTermDebtNoncurrent': 'LongTermDebtNoncurrent',
    'DeferredRevenue': 'DeferredRevenue',
    'StockholdersEquity': 'StockholdersEquity',
    'CommonStockValue': 'CommonStockValue',
    'RetainedEarningsAccumulatedDeficit': 'RetainedEarningsAccumulatedDeficit',
    'AccumulatedOtherComprehensiveIncomeLossNetOfTax': 'AccumulatedOtherComprehensiveIncomeLossNetOfTax',
    'LiabilitiesAndStockholdersEquity': 'LiabilitiesAndStockholdersEquity',
  };
  return mapping[k] || k;
};

const ValuationPage: React.FC<ValuationPageProps> = ({ onClose, initialCompany, onCompanyChange }) => {

  const { updateCompanyTableData, resetCompanyData, getModifiedCompanyData } = useCompanyData();
  const [hasIncomeStatementData, setHasIncomeStatementData] = useState<boolean>(true);
  
  // State for editable PresentValue cells in Valuation Summary
  const [valuationSummaryData, setValuationSummaryData] = useState({
    nopatGrowthRate: '',
    returnOnNewInvestedCapital: '',
    weightedAverageCostOfCapital: '',
    valueOfCarryForwardCredits: ''
  });

  // Tooltip descriptions for Valuation Summary metrics
  const valuationSummaryTooltips: { [key: string]: string } = {
    'NOPAT Growth Rate In Perpetuity': 'Input field for NOPAT growth rate in perpetuity',
    'Return On New Invested Capital': 'Input field for return on new invested capital',
    'Weighted Average Cost of Capital': 'Input field for weighted average cost of capital',
    '2025 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 1)',
    '2026 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 2)',
    '2027 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 3)',
    '2028 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 4)',
    '2029 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 5)',
    '2030 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 6)',
    '2031 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 7)',
    '2032 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 8)',
    '2033 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 9)',
    '2034 Discounted Value': 'Calculated: FreeCashFlow * (1/(1 + WeightedAverageCostofCapital) ^ 10)',
    '2035 Discounted Value': 'Calculated: (1/(1 + WeightedAverageCostofCapital) ^ 10) * (NetOperatingProfitAfterTaxes * (1 - (NOPATGrowthRateInPerpetuity/ReturnOnNewInvestedCapital)) / (WeightedAverageCostofCapital - NOPATGrowthRateInPerpetuity))',
    'Value Of Operations': 'Calculated: Sum of discounted cash flows of forecasted years',
    'Midyear Adjustment Factor': 'Calculated: (1 + WeightedAverageCostofCapital) ** 0.5',
    'Adjusted Value Of Operations': 'Calculated: ValueOfOperations * MidyearAdjustmentFactor',
    'Excess Cash': 'Referenced: from 3StatementModel',
    'Value Of Carry forward Credits': 'Estimated carryforward credits - allowances',
    'Enterprise Value': 'Calculated: AdjustedValueOfOperations + ExcessCash + ValueOfCarryforwardCredits',
    'Debt': 'Referenced: from 3StatementModel',
    'OperatingLeaseLiabilities': 'Referenced: from 3StatementModel',
    'FinanceLeaseLiabilities': 'Referenced: from 3StatementModel',
    'VariableLeaseLiabilities': 'Referenced: from 3StatementModel',
    'EquityIntrinsicValue': 'Calculated: EnterpriseValue - Value of Debt and Lease Liabilities'
  };

  // State for tooltip visibility
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // State for static valuation summary values (to prevent recalculation on hover)
  const [valuationSummaryStaticValues, setValuationSummaryStaticValues] = useState<{
    yearlyValues: { [year: number]: { fcf: number; discountFactor: number; presentValue: number } };
    valueOfOperations: number;
    adjustedValueOfOperations: number;
    excessCash: number;
    valueOfCarryForwardCredits: number;
    enterpriseValue: number;
    debt: number;
    operatingLeaseLiabilities: number;
    financeLeaseLiabilities: number;
    variableLeaseLiabilities: number;
    equityIntrinsicValue: number;
    nopatGrowthRate: number;
    returnOnNewInvestedCapital: number;
    weightedAverageCostOfCapital: number;
  } | null>(null);

  // Initialize static values once
  useEffect(() => {
    if (!valuationSummaryStaticValues) {
      const yearlyValues: { [year: number]: { fcf: number; discountFactor: number; presentValue: number } } = {};
      [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].forEach(year => {
        const fcf = (Math.random() * 5000 + 1000) * 1000000;
        const discountFactor = Math.pow(1 / (1 + 0.10), year - 2024);
        const presentValue = fcf * discountFactor;
        yearlyValues[year] = { fcf, discountFactor, presentValue };
      });

      setValuationSummaryStaticValues({
        yearlyValues,
        valueOfOperations: (Math.random() * 50000 + 100000) * 1000000,
        adjustedValueOfOperations: (Math.random() * 50000 + 100000) * 1000000,
        excessCash: (Math.random() * 10000 + 5000) * 1000000,
        valueOfCarryForwardCredits: (Math.random() * 5000 + 1000) * 1000000,
        enterpriseValue: (Math.random() * 50000 + 100000) * 1000000,
        debt: (Math.random() * 20000 + 10000) * 1000000,
        operatingLeaseLiabilities: (Math.random() * 5000 + 2000) * 1000000,
        financeLeaseLiabilities: (Math.random() * 3000 + 1000) * 1000000,
        variableLeaseLiabilities: (Math.random() * 2000 + 500) * 1000000,
        equityIntrinsicValue: (Math.random() * 80000 + 50000) * 1000000,
        nopatGrowthRate: (Math.random() * 0.05 + 0.02) * 100,
        returnOnNewInvestedCapital: (Math.random() * 0.15 + 0.10) * 100,
        weightedAverageCostOfCapital: (Math.random() * 0.05 + 0.08) * 100
      });
    }
  }, [valuationSummaryStaticValues]);
  
  // Helper function to merge static data with context modifications
  const mergeDataWithContext = useCallback((staticData: {[key: string]: TableData}, ticker: string): {[key: string]: TableData} => {
    const modifiedData = getModifiedCompanyData(ticker);
    if (!modifiedData) {
      console.log(`[mergeDataWithContext] No modified data for ${ticker}, returning static data as-is`);
      return staticData;
    }
    
    console.log(`[mergeDataWithContext] Merging data for ${ticker}, modified tables:`, Object.keys(modifiedData));
    
    const merged = { ...staticData };
    
    // Merge each table that has modifications
    Object.keys(modifiedData).forEach(tableId => {
      // Special handling for income statement: ensure API data (staticData) is the base
      // Only merge user edits from context, not full table replacements
      if (tableId === 'incomeStatement') {
        console.log(`[mergeDataWithContext] Merging income statement for ${ticker}`);
        console.log(`[mergeDataWithContext] Static income statement has ${Object.keys(staticData[tableId] || {}).length} years`);
        console.log(`[mergeDataWithContext] Modified income statement has ${Object.keys(modifiedData[tableId] || {}).length} years`);
        
        // If we have API data (staticData), use it as the base - it takes precedence
        // If staticData is empty but we have context data, that means API hasn't loaded yet, so use context
        const hasApiData = staticData[tableId] && Object.keys(staticData[tableId]).length > 0;
        
        if (hasApiData) {
          // Start with API data as base - this is the source of truth
          const mergedTable: TableData = { ...staticData[tableId] };
          
          // Only merge user edits (field-level modifications) from context on top of API data
          Object.keys(modifiedData[tableId]).forEach(year => {
            const yearNum = typeof year === 'string' && !isNaN(Number(year)) ? Number(year) : year;
            if ((mergedTable as any)[yearNum]) {
              // Merge user edits on top of API data (user edits take precedence for specific fields)
              (mergedTable as any)[yearNum] = {
                ...(mergedTable as any)[yearNum],
                ...(modifiedData as any)[tableId][year]
              };
            } else {
              // If year doesn't exist in API data, add it from context (user-added forecast year)
              (mergedTable as any)[yearNum] = { ...(modifiedData as any)[tableId][year] };
            }
          });
          
          merged[tableId] = mergedTable;
          console.log(`[mergeDataWithContext] Using API data as base, final merged income statement has ${Object.keys(mergedTable).length} years`);
        } else {
          // No API data yet, use context data temporarily (shouldn't happen after API loads)
          console.warn(`[mergeDataWithContext] No API data for income statement, using context data`);
          merged[tableId] = { ...(modifiedData[tableId] as TableData) };
        }
      } else {
        // For other tables, use existing merge logic
        if (modifiedData[tableId] && staticData[tableId]) {
          const mergedTable: TableData = { ...staticData[tableId] };
          
          // Merge each year's data
          Object.keys(modifiedData[tableId]).forEach(year => {
            const yearNum = typeof year === 'string' && !isNaN(Number(year)) ? Number(year) : year;
            if ((mergedTable as any)[yearNum]) {
              (mergedTable as any)[yearNum] = {
                ...(mergedTable as any)[yearNum],
                ...(modifiedData as any)[tableId][year]
              };
            } else {
              (mergedTable as any)[yearNum] = { ...(modifiedData as any)[tableId][year] };
            }
          });
          
          merged[tableId] = mergedTable;
        }
      }
    });
    
    return merged;
  }, [getModifiedCompanyData]);

  // Initialize state with static data merged with context data
  const getInitialData = useCallback((ticker: string) => {
    const baseData = {
      balanceSheet: balanceSheetReal,
      ppeChanges: ppeChangesReal,
      freeCashFlow: freeCashFlowReal,
      cashFlows: (cashFlowReal as unknown) as TableData,
      incomeStatement: {} as TableData, // Will be loaded from API
      incomeStatementCommonSize: (incomeStatementCommonReal as unknown) as TableData,
      balanceSheetCommonSize: (balanceSheetCommonReal as unknown) as TableData,
      nopat: nopatReal,
      investedCapital: investedCapitalReal,
      roicPerformance: (roicReal as unknown) as TableData,
      financingHealth: (financeHealthReal as unknown) as TableData,
      operationalPerformance: (operationalPerformanceReal as unknown) as TableData
    };
    
    return mergeDataWithContext(baseData, ticker);
  }, [mergeDataWithContext]);

  const [allData, setAllData] = useState<{[key: string]: TableData}>(() => getInitialData(initialCompany || 'COST'));



  const [selectedCompany, setSelectedCompany] = useState(initialCompany || 'COST');

  const [activeTab, setActiveTab] = useState('incomeStatement');

  // Company dropdown state
  const [availableCompanies, setAvailableCompanies] = useState<CompanyTicker[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState<boolean>(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState<boolean>(false);
  const [companyInput, setCompanyInput] = useState<string>('');
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch companies from API
  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/companies`);
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`);
      }
      const data = await response.json();
      
      // Handle both paginated (results) and non-paginated responses
      const companiesList = data.results || data;
      
      const companies: CompanyTicker[] = [];
      companiesList.forEach((company: any) => {
        const ticker = company.ticker;
        const display_name = company.display_name || company.name || company.ticker;
        const name = company.name || company.ticker;
        companies.push({ ticker, name, display_name });
      });
      
      setAvailableCompanies(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Map CSV metric names to frontend field names
  const mapMetricNameToFrontendField = (csvMetricName: string): string => {
    const mapping: { [key: string]: string } = {
      // API Name -> Frontend Structure Name
      'SellingGeneralAndAdministration': 'SGAExpense',
      'SellingAndMarketingExpense': 'SellingAndMarketingExpense',
      'GeneralAndAdministrativeExpense': 'GeneralAndAdministrativeExpense',
      'ResearchAndDevelopment': 'ResearchAndDevelopment',
      'FulfillmentExpense': 'FulfillmentExpense',
      'TechnologyExpense': 'TechnologyExpense',
      'DepreciationAndAmortization': 'DepreciationAmortization',
      'GrossMargin': 'GrossProfit',
      'NetIncomeControlling': 'ProfitLossControlling', // Keep if used elsewhere, but check structure
      'OtherNonoperatingIncome': 'OtherIncome',
      'Revenue': 'Revenue',
      'CostOfRevenue': 'CostOfRevenue',
      'OperatingIncome': 'OperatingIncome',
      'OperatingExpenses': 'OperatingExpenses',
      'InterestExpense': 'InterestExpense',
      'InterestIncome': 'InterestIncome',
      'TaxProvision': 'TaxProvision',
      'NetIncome': 'NetIncome',
      'NetIncomeNoncontrolling': 'NetIncomeNoncontrolling'
    };
    
    // Return mapped name if exists, otherwise return original
    return mapping[csvMetricName] || csvMetricName;
  };

  // Map balance sheet CSV metric names to frontend field names
  const mapBalanceSheetMetricNameToFrontendField = (csvMetricName: string): string => {
    const mapping: { [key: string]: string } = {
      // API Name -> Frontend Structure Name
      // Assets Current
      'CashAndCashEquivalents': 'CashAndCashEquivalents',
      'ShortTermInvestments': 'ShortTermInvestments',
      'ReceivablesCurrent': 'ReceivablesCurrent', // Was 'Receivables' in structure but API sends 'ReceivablesCurrent'. Structure uses 'ReceivablesCurrent' as key.
      'Inventory': 'Inventory',
      'DeferredTaxAssetsCurrentBS': 'DeferredTaxAssetsCurrentBS',
      'OtherAssetsCurrent': 'OtherAssetsCurrent',
      
      // Assets Noncurrent
      'PropertyPlantAndEquipment': 'PropertyPlantAndEquipmentNet', // Map API 'PropertyPlantAndEquipment' to 'PropertyPlantAndEquipmentNet'
      'OperatingLeaseAssets': 'OperatingLeaseAssetsNoncurrent',   // Map API 'OperatingLeaseAssets' to 'OperatingLeaseAssetsNoncurrent'
      'FinanceLeaseAssets': 'FinanceLeaseAssetsNoncurrent',       // Map API 'FinanceLeaseAssets' to 'FinanceLeaseAssetsNoncurrent'
      'Goodwill': 'Goodwill',
      'DeferredIncomeTaxAssetsNoncurrent': 'DeferredIncomeTaxAssetsNoncurrent',
      'OtherAssetsNoncurrent': 'OtherAssetsNoncurrent',
      'ReceivablesNoncurrent': 'ReceivablesNoncurrent',
      'VariableLeaseAssets': 'VariableLeaseAssets',
      
      // Liabilities Current
      'AccountsPayableCurrent': 'AccountsPayableCurrent',
      'EmployeeAccruedLiabilitiesCurrent': 'EmployeeLiabilitiesCurrent', // Map API 'EmployeeAccruedLiabilitiesCurrent' to 'EmployeeLiabilitiesCurrent'
      'AccruedLiabilitiesCurrent': 'AccruedLiabilitiesCurrent',
      'AccruedIncomeTaxesCurrent': 'AccruedIncomeTaxesCurrent',
      'DeferredRevenueCurrent': 'DeferredRevenueCurrent',
      'LongTermDebtCurrent': 'LongTermDebtCurrent',
      'OperatingLeaseLiabilitiesCurrent': 'OperatingLeaseLiabilitiesCurrent',
      'FinanceLeaseLiabilitiesCurrent': 'FinanceLeaseLiabilitiesCurrent',
      'OtherLiabilitiesCurrent': 'OtherLiabilitiesCurrent',

      // Liabilities Noncurrent
      'LongTermDebtNoncurrent': 'LongTermDebtNoncurrent',
      'OperatingLeaseLiabilitiesNoncurrent': 'OperatingLeaseLiabilitiesNoncurrent', // Map API to Frontend
      'FinanceLeaseLiabilitiesNoncurrent': 'FinanceLeaseLiabilitiesNoncurrent',
      'DeferredIncomeTaxLiabilitiesNoncurrent': 'DeferredIncomeTaxLiabilitiesNoncurrent',
      'OtherLiabilitiesNoncurrent': 'OtherLiabilitiesNoncurrent',

      // Equity
      'CommonStock': 'CommonStockEquity', // Map API 'CommonStock' to 'CommonStockEquity'
      'PaidInCapitalCommonStock': 'PaidInCapitalCommonStock',
      'AccumulatedOtherIncome': 'AccumulatedOtherComprehensiveIncomeLossNetOfTax', // Map API 'AccumulatedOtherIncome'
      'NoncontrollingInterests': 'NoncontrollingInterests',
      'RetainedEarningsAccumulated': 'RetainedEarningsAccumulated',
      
      // Additional Metrics
      'Debt': 'Debt',
      'ForeignTaxCreditCarryForward': 'ForeignTaxCreditCarryForward',
      'CapitalExpenditures': 'CapitalExpenditures',
      'OperatingCash': 'OperatingCash',
      'ExcessCash': 'ExcessCash'
    };
    
    // Return mapped name if exists, otherwise return original
    return mapping[csvMetricName] || csvMetricName;
  };

  // Map cash flow CSV metric names to frontend field names
  const mapCashFlowMetricNameToFrontendField = (csvMetricName: string): string => {
    const mapping: { [key: string]: string } = {
      // API Name -> Frontend CashFlowsTable Name
      'DepreciationAndAmortization': 'DepreciationDepletionAndAmortization',
      'PaidInCapitalCommonStockIssuance': 'CommonStockIssuance',
      'PaidInCapitalCommonStockRepurchasePayment': 'CommonStockRepurchasePayment',
      'PaidInCapitalCommonStockDividendPayment': 'CommonStockDividendPayment',
      
      // Direct matches (explicitly listed for clarity)
      'NetIncome': 'NetIncome',
      'DeferredTax': 'DeferredTax',
      'OtherNoncashChanges': 'OtherNoncashChanges',
      'ChangeInReceivables': 'ChangeInReceivables',
      'ChangeInInventory': 'ChangeInInventory',
      'ChangeInPayable': 'ChangeInPayable',
      'ChangeInOtherCurrentAssets': 'ChangeInOtherCurrentAssets',
      'ChangeInOtherCurrentLiabilities': 'ChangeInOtherCurrentLiabilities',
      'ChangeInOtherWorkingCapital': 'ChangeInOtherWorkingCapital',
      'PurchaseOfPPE': 'PurchaseOfPPE',
      'SaleOfPPE': 'SaleOfPPE',
      'PurchaseOfBusiness': 'PurchaseOfBusiness',
      'SaleOfBusiness': 'SaleOfBusiness',
      'PurchaseOfInvestment': 'PurchaseOfInvestment',
      'SaleOfInvestment': 'SaleOfInvestment',
      'ShortTermDebtIssuance': 'ShortTermDebtIssuance',
      'ShortTermDebtPayment': 'ShortTermDebtPayment',
      'LongTermDebtIssuance': 'LongTermDebtIssuance',
      'LongTermDebtPayment': 'LongTermDebtPayment',
      'TaxWithholdingPayment': 'TaxWithholdingPayment',
      'FinancingLeasePayment': 'FinancingLeasePayment',
      'MinorityDividendPayment': 'MinorityDividendPayment',
      'MinorityShareholderPayment': 'MinorityShareholderPayment'
    };
    
    // Return mapped name if exists, otherwise return original
    return mapping[csvMetricName] || csvMetricName;
  };

  // Fetch income statement data from API
  const fetchIncomeStatementData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Income Statement] Fetching data for ${ticker}...`);
    try {
      // Use new centralized API endpoint
      const response = await fetch(`${baseUrl}/api/sec/central/financials/income-statement/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Income Statement] No income statement data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch income statement data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Income Statement] Raw API response for ${ticker}:`, data);
      
      // Transform API response to TableData format
      // API returns: { [year: string]: { [metric_name: string]: number } }
      // We need: { [year: number]: { [field_name: string]: number } }
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          
          // Map each metric name to frontend field name
          for (const [csvMetricName, value] of Object.entries(metrics as { [key: string]: number | string })) {
            const frontendFieldName = mapMetricNameToFrontendField(csvMetricName);
            yearData[frontendFieldName] = value;
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Income Statement] Transformed data for ${ticker}:`, tableData);
      console.log(`[Income Statement] Years available:`, Object.keys(tableData));
      if (Object.keys(tableData).length > 0) {
        const firstYear = Object.keys(tableData)[0];
        console.log(`[Income Statement] Sample year ${firstYear} fields:`, Object.keys(tableData[parseInt(firstYear)]));
      }
      
      return tableData;
    } catch (error) {
      console.error(`[Income Statement] Error fetching income statement data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch balance sheet data from API
  const fetchBalanceSheetData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Balance Sheet] Fetching data for ${ticker}...`);
    try {
      // Use new centralized API endpoint
      const response = await fetch(`${baseUrl}/api/sec/central/financials/balance-sheet/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Balance Sheet] No balance sheet data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch balance sheet data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Balance Sheet] Raw API response for ${ticker}:`, data);
      
      // Transform API response to TableData format
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          
          // Map each metric name to frontend field name
          for (const [csvMetricName, value] of Object.entries(metrics as { [key: string]: number | string })) {
            const frontendFieldName = mapBalanceSheetMetricNameToFrontendField(csvMetricName);
            yearData[frontendFieldName] = value;
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Balance Sheet] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Balance Sheet] Error fetching balance sheet data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch cash flow data from API
  const fetchCashFlowData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Cash Flow] Fetching data for ${ticker}...`);
    try {
      // Use new centralized API endpoint
      const response = await fetch(`${baseUrl}/api/sec/central/financials/cash-flow/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Cash Flow] No cash flow data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch cash flow data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Cash Flow] Raw API response for ${ticker}:`, data);
      
      // Transform API response to TableData format
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          
          // Map each metric name to frontend field name
          for (const [csvMetricName, value] of Object.entries(metrics as { [key: string]: number | string })) {
            const frontendFieldName = mapCashFlowMetricNameToFrontendField(csvMetricName);
            yearData[frontendFieldName] = value;
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Cash Flow] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Cash Flow] Error fetching cash flow data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // removed navigate = useNavigate();



  // removed handleTabChange = (val: string) => { ... };






  // Fetch NOPAT data from API
  const fetchNOPATData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[NOPAT] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/nopat/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[NOPAT] No NOPAT data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch NOPAT data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[NOPAT] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          // Map API fields to Frontend fields
          if (m.EBIT !== undefined) yearData['EBITAAdjusted'] = m.EBIT;
          if (m.CashTaxAdjustment !== undefined) yearData['TaxProvision'] = m.CashTaxAdjustment;
          if (m.NOPAT !== undefined) yearData['NOPAT'] = m.NOPAT;
          
          // Fill other fields if possible or leave empty/calculated
          // Usually NOPAT table has more rows, but we only get these 3 from API.
          // The calculation logic might override this if we trigger recalculations.
          // But for historical data, we should trust the API if available.
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[NOPAT] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[NOPAT] Error fetching NOPAT data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Invested Capital data from API
  const fetchInvestedCapitalData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Invested Capital] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/invested-capital/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Invested Capital] No Invested Capital data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Invested Capital data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Invested Capital] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          // Map API fields to Frontend fields
          if (m.OperatingWorkingCapital !== undefined) yearData['OperatingWorkingCapital'] = m.OperatingWorkingCapital;
          if (m['NetPP&E'] !== undefined) yearData['PropertyPlantAndEquipment'] = m['NetPP&E'];
          if (m.InvestedCapital !== undefined) yearData['InvestedCapitalIncludingGoodwill'] = m.InvestedCapital;
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Invested Capital] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Invested Capital] Error fetching Invested Capital data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Free Cash Flow data from API
  const fetchFreeCashFlowData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Free Cash Flow] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/free-cash-flow/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Free Cash Flow] No Free Cash Flow data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Free Cash Flow data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Free Cash Flow] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.NOPAT !== undefined) yearData['NetOperatingProfitAfterTaxes'] = m.NOPAT;
          if (m.FreeCashFlow !== undefined) yearData['FreeCashFlow'] = m.FreeCashFlow;
          // ChangeInInvestedCapital is an aggregate, might not map directly to a single breakdown line
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Free Cash Flow] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Free Cash Flow] Error fetching Free Cash Flow data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch ROIC data from API
  const fetchROICData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[ROIC] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/roic/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[ROIC] No ROIC data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch ROIC data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[ROIC] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.NOPATMargin !== undefined && typeof m.NOPATMargin === 'number') {
            yearData['OperatingProfitAsPercentOfRevenue'] = m.NOPATMargin * 100; // Convert to percentage
          }
          if (m.ROIC !== undefined && typeof m.ROIC === 'number') {
            yearData['ReturnOnInvestedCapitalIncludingGoodwill'] = m.ROIC * 100; // Convert to percentage
          }
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[ROIC] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[ROIC] Error fetching ROIC data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Operational Performance data from API
  const fetchOperationalPerformanceData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Operational Performance] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/operational-performance/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Operational Performance] No Operational Performance data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Operational Performance data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Operational Performance] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.RevenueGrowth !== undefined) yearData['RevenueGrowth'] = m.RevenueGrowth; // Percentage value (e.g. 6.7)
          if (m.EBITDAMargin !== undefined) yearData['EBITDAMargin'] = (m.EBITDAMargin as number) * 100; // Ratio (e.g. 0.034) -> Percentage (3.4)
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Operational Performance] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Operational Performance] Error fetching Operational Performance data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch Financing Health data from API
  const fetchFinancingHealthData = useCallback(async (ticker: string): Promise<TableData | null> => {
    console.log(`[Financing Health] Fetching data for ${ticker}...`);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/analysis/financing-health/${ticker}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Financing Health] No Financing Health data found for ${ticker}`);
          return null;
        }
        throw new Error(`Failed to fetch Financing Health data: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[Financing Health] Raw API response for ${ticker}:`, data);
      
      const tableData: TableData = {};
      
      for (const [yearStr, metrics] of Object.entries(data)) {
        const year = parseInt(yearStr);
        if (!isNaN(year)) {
          const yearData: { [key: string]: number | string } = {};
          const m = metrics as { [key: string]: number | string };
          
          if (m.NetDebt !== undefined) yearData['NetDebt'] = m.NetDebt;
          if (m.NetDebtToEBITDA !== undefined) yearData['DebtToEBITDA'] = m.NetDebtToEBITDA;
          if (m.InterestCoverage !== undefined) yearData['EBITAToTotalInterest'] = m.InterestCoverage;
          
          tableData[year] = yearData;
        }
      }
      
      console.log(`[Financing Health] Transformed data for ${ticker}:`, tableData);
      return tableData;
    } catch (error) {
      console.error(`[Financing Health] Error fetching Financing Health data for ${ticker}:`, error);
      return null;
    }
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Switch company data when selectedCompany changes

  useEffect(() => {
    const loadCompanyData = async () => {
      console.log(`[ValuationPage] Loading company data for ${selectedCompany}`);
      // Fetch income statement from API
      const incomeStatementData = await fetchIncomeStatementData(selectedCompany);
      console.log(`[ValuationPage] Income statement data received:`, incomeStatementData ? `Has ${Object.keys(incomeStatementData).length} years` : 'null/empty');
      
      const hasData = !!(incomeStatementData && Object.keys(incomeStatementData).length > 0);
      setHasIncomeStatementData(hasData);
      
      if (!hasData) {
        console.warn(`No income statement data available for ${selectedCompany}`);
      }
      
      // Fetch balance sheet from API
      const balanceSheetData = await fetchBalanceSheetData(selectedCompany);
      console.log(`[ValuationPage] Balance sheet data received:`, balanceSheetData ? `Has ${Object.keys(balanceSheetData).length} years` : 'null/empty');
      
      // Fetch cash flow from API
      const cashFlowData = await fetchCashFlowData(selectedCompany);
      console.log(`[ValuationPage] Cash flow data received:`, cashFlowData ? `Has ${Object.keys(cashFlowData).length} years` : 'null/empty');
      
      // Fetch NOPAT from API
      const nopatData = await fetchNOPATData(selectedCompany);
      console.log(`[ValuationPage] NOPAT data received:`, nopatData ? `Has ${Object.keys(nopatData).length} years` : 'null/empty');

      // Fetch Invested Capital from API
      const investedCapitalData = await fetchInvestedCapitalData(selectedCompany);
      console.log(`[ValuationPage] Invested Capital data received:`, investedCapitalData ? `Has ${Object.keys(investedCapitalData).length} years` : 'null/empty');

      // Fetch Free Cash Flow from API
      const freeCashFlowData = await fetchFreeCashFlowData(selectedCompany);
      console.log(`[ValuationPage] Free Cash Flow data received:`, freeCashFlowData ? `Has ${Object.keys(freeCashFlowData).length} years` : 'null/empty');

      // Fetch ROIC from API
      const roicData = await fetchROICData(selectedCompany);
      console.log(`[ValuationPage] ROIC data received:`, roicData ? `Has ${Object.keys(roicData).length} years` : 'null/empty');

      // Fetch Operational Performance from API
      const opData = await fetchOperationalPerformanceData(selectedCompany);
      console.log(`[ValuationPage] Operational Performance data received:`, opData ? `Has ${Object.keys(opData).length} years` : 'null/empty');

      // Fetch Financing Health from API
      const fhData = await fetchFinancingHealthData(selectedCompany);
      console.log(`[ValuationPage] Financing Health data received:`, fhData ? `Has ${Object.keys(fhData).length} years` : 'null/empty');
      
      // For now, keep other tables as hardcoded (will be replaced later)
      // Start with default/fallback data structure
      let staticData: any = {
        balanceSheet: balanceSheetData || {} as TableData,
        ppeChanges: ppeChangesReal as TableData,
        freeCashFlow: freeCashFlowData || {} as TableData,
        cashFlows: cashFlowData || {} as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: {} as TableData,
        balanceSheetCommonSize: {} as TableData,
        nopat: nopatData || {} as TableData,
        investedCapital: investedCapitalData || {} as TableData,
        roicPerformance: roicData || {} as TableData,
        financingHealth: fhData || {} as TableData,
        operationalPerformance: opData || {} as TableData
      };

      // Load other tables from mock data for specific companies (temporary until we load them from DB)
      if (selectedCompany === 'WMT') {
        staticData = {
          ...staticData,
          balanceSheet: walmartMockData.balanceSheet as TableData,
          freeCashFlow: walmartMockData.cashFlow as TableData,
          cashFlows: walmartMockData.cashFlow as TableData,
          incomeStatementCommonSize: walmartMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: walmartMockData.balanceSheetCommonSize as TableData,
          nopat: walmartMockData.nopat as TableData,
          investedCapital: walmartMockData.investedCapital as TableData,
          roicPerformance: walmartMockData.roicPerformance as TableData,
          financingHealth: walmartMockData.financingHealth as TableData,
          operationalPerformance: walmartMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'BJ') {
        staticData = {
          ...staticData,
          balanceSheet: bjMockData.balanceSheet as TableData,
          freeCashFlow: bjMockData.freeCashFlow as TableData,
          cashFlows: bjMockData.cashFlow as TableData,
          incomeStatementCommonSize: bjMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: bjMockData.balanceSheetCommonSize as TableData,
          nopat: bjMockData.nopat as TableData,
          investedCapital: bjMockData.investedCapital as TableData,
          roicPerformance: bjMockData.roicPerformance as TableData,
          financingHealth: bjMockData.financingHealth as TableData,
          operationalPerformance: bjMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'DG') {
        staticData = {
          ...staticData,
          balanceSheet: dgMockData.balanceSheet as TableData,
          freeCashFlow: dgMockData.cashFlow as TableData,
          cashFlows: dgMockData.cashFlow as TableData,
          incomeStatementCommonSize: dgMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: dgMockData.balanceSheetCommonSize as TableData,
          nopat: dgMockData.nopat as TableData,
          investedCapital: dgMockData.investedCapital as TableData,
          roicPerformance: dgMockData.roicPerformance as TableData,
          financingHealth: dgMockData.financingHealth as TableData,
          operationalPerformance: dgMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'DLTR') {
        staticData = {
          ...staticData,
          balanceSheet: dltrMockData.balanceSheet as TableData,
          ppeChanges: dltrMockData.ppeChanges as TableData,
          freeCashFlow: dltrMockData.freeCashFlow as TableData,
          cashFlows: dltrMockData.cashFlow as TableData,
          incomeStatementCommonSize: dltrMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: dltrMockData.balanceSheetCommonSize as TableData,
          nopat: dltrMockData.nopat as TableData,
          investedCapital: dltrMockData.investedCapital as TableData,
          roicPerformance: dltrMockData.roicPerformance as TableData,
          financingHealth: dltrMockData.financingHealth as TableData,
          operationalPerformance: dltrMockData.operationalPerformance as TableData
        };
      } else if (selectedCompany === 'TGT') {
        staticData = {
          ...staticData,
          balanceSheet: tgtMockData.balanceSheet as TableData,
          ppeChanges: tgtMockData.ppeChanges as TableData,
          freeCashFlow: tgtMockData.freeCashFlow as TableData,
          cashFlows: tgtMockData.cashFlow as TableData,
          incomeStatementCommonSize: tgtMockData.incomeStatementCommonSize as TableData,
          balanceSheetCommonSize: tgtMockData.balanceSheetCommonSize as TableData,
          nopat: tgtMockData.nopat as TableData,
          investedCapital: tgtMockData.investedCapital as TableData,
          roicPerformance: tgtMockData.roicPerformance as TableData,
          financingHealth: tgtMockData.financingHealth as TableData,
          operationalPerformance: tgtMockData.operationalPerformance as TableData
        };
      } else {
        // Default to Costco data structure for other companies (only as fallback if API data not available)
        staticData = {
          ...staticData,
          balanceSheet: staticData.balanceSheet && Object.keys(staticData.balanceSheet).length > 0 ? staticData.balanceSheet : balanceSheetReal,
          freeCashFlow: staticData.freeCashFlow && Object.keys(staticData.freeCashFlow).length > 0 ? staticData.freeCashFlow : freeCashFlowReal,
          cashFlows: staticData.cashFlows && Object.keys(staticData.cashFlows).length > 0 ? staticData.cashFlows : (cashFlowReal as unknown) as TableData,
          incomeStatementCommonSize: (incomeStatementCommonReal as unknown) as TableData,
          balanceSheetCommonSize: (balanceSheetCommonReal as unknown) as TableData,
          nopat: nopatReal,
          investedCapital: investedCapitalReal,
          roicPerformance: (roicReal as unknown) as TableData,
          financingHealth: (financeHealthReal as unknown) as TableData,
          operationalPerformance: (operationalPerformanceReal as unknown) as TableData
        };
      }
      
      console.log(`[ValuationPage] Static data before merge for ${selectedCompany}:`, {
        incomeStatement: staticData.incomeStatement ? `Has ${Object.keys(staticData.incomeStatement).length} years` : 'empty',
        balanceSheet: staticData.balanceSheet ? `Has ${Object.keys(staticData.balanceSheet).length} years` : 'empty'
      });
      
      const mergedData = mergeDataWithContext(staticData, selectedCompany);
      console.log(`[ValuationPage] Merged data for ${selectedCompany}:`, {
        incomeStatement: mergedData.incomeStatement ? `Has ${Object.keys(mergedData.incomeStatement).length} years` : 'empty',
        balanceSheet: mergedData.balanceSheet ? `Has ${Object.keys(mergedData.balanceSheet).length} years` : 'empty'
      });
      
      // Log sample income statement data to verify it's from API
      if (mergedData.incomeStatement && Object.keys(mergedData.incomeStatement).length > 0) {
        const sampleYear = Object.keys(mergedData.incomeStatement).sort().reverse()[0]; // Get latest year
        const sampleData = mergedData.incomeStatement[parseInt(sampleYear)];
        console.log(`[ValuationPage] Sample income statement data for year ${sampleYear}:`, {
          Revenue: sampleData?.Revenue,
          CostOfRevenue: sampleData?.CostOfRevenue,
          SellingGeneralAdministrative: sampleData?.SellingGeneralAdministrative,
          NetIncome: sampleData?.NetIncome
        });
      }
      
      setAllData(mergedData);
      console.log(`[ValuationPage] allData state updated for ${selectedCompany}`);
    };
    
    loadCompanyData();
  }, [selectedCompany, mergeDataWithContext, fetchIncomeStatementData, fetchBalanceSheetData, fetchCashFlowData]);



  // Note: Operational performance data is now loaded from static data file

  // including both historical (2011-2024) and forecast years (2025-2035)



  // Calculate derived tables based on input data

  const calculateDerivedData = useCallback(() => {

    const { balanceSheet, ppeChanges = {}, freeCashFlow, incomeStatement } = allData;



    // Calculate NOPAT using proper formulas from the image

    const nopat: TableData = {};

    years.forEach(year => {

      if (incomeStatement[year]) {

        const incomeData = incomeStatement[year];

        const balanceSheetData = balanceSheet[year] || {};

        

        // Get input fields from Income Statement

        const revenue = (incomeData.Revenue as number) || 0;

        const costOfRevenue = (incomeData.CostOfRevenue as number) || 0;

        const sga = (incomeData.SellingGeneralAdministrative as number) || 0;

        const depreciation = (incomeData.Depreciation as number) || 0;

        const taxProvision = (incomeData.TaxProvision as number) || 0;

        const leasesDiscountRate = (incomeData.LeasesDiscountRate as number) || 0;

        

        // Calculate EBITA Unadjusted = Revenue + CostOfRevenue + SG&A + Depreciation

        const ebitaUnadjusted = revenue + costOfRevenue + sga + depreciation;

        

        // Calculate Operating Lease Interest = CapitalTable_prior_year['OperatingLeaseLiabilities'] * LeasesDiscountRate / 100

        const priorYear = year - 1;

        const priorYearCapital = allData.investedCapital?.[priorYear] || {};

        const operatingLeaseLiabilities = (priorYearCapital.OperatingLeaseLiabilities as number) || 0;

        const operatingLeaseInterest = operatingLeaseLiabilities * leasesDiscountRate / 100;

        

        // Calculate Variable Lease Interest = BalanceSheet['VariableLeaseAssets'] * LeasesDiscountRate / 100

        const variableLeaseAssets = (balanceSheetData.VariableLeaseAssets as number) || 0;

        const variableLeaseInterest = variableLeaseAssets * leasesDiscountRate / 100;

        

        // Calculate EBITA Adjusted = EBITA_Unadjusted + OperatingLeaseInterest + VariableLeaseInterest

        const ebitaAdjusted = ebitaUnadjusted + operatingLeaseInterest + variableLeaseInterest;

        

        // Calculate NOPAT = EBITAAdjusted - TaxProvision

        const calculatedNOPAT = ebitaAdjusted - taxProvision;

        

        nopat[year] = {

          Revenue: revenue,

          CostOfRevenue: costOfRevenue,

          SellingGeneralAndAdministration: sga,

          Depreciation: depreciation,

          EBITA_Unadjusted: ebitaUnadjusted,

          OperatingLeaseInterest: operatingLeaseInterest,

          VariableLeaseInterest: variableLeaseInterest,

          EBITAAdjusted: ebitaAdjusted,

          TaxProvision: taxProvision,

          NOPAT: calculatedNOPAT

        };

      }

    });



    // Calculate Invested Capital (simplified)

    const calculatedInvestedCapital: TableData = {};

    years.forEach(year => {

      if (ppeChanges[year]) {

        calculatedInvestedCapital[year] = {

          PPE: (ppeChanges[year].PPEEndOfYear as number) || 0,

          WorkingCapital: 0,

          TotalInvestedCapital: ((ppeChanges[year].PPEEndOfYear as number) || 0)

        };

      }

    });



    return {

      ...allData,

      nopat: nopat, // Use the calculated nopat data

      investedCapital: calculatedInvestedCapital,

      freeCashFlow: freeCashFlow,

      roicPerformance: allData.roicPerformance || {} // Include roicPerformance from allData

    };

  }, [allData]);



  const [, setCalculatedData] = useState(calculateDerivedData());



  useEffect(() => {

    setCalculatedData(calculateDerivedData());

  }, [calculateDerivedData]);












  // Field type definitions - use imported utilities for income statement

  const inputFields = [

    'Revenue', 'CostOfRevenue', 'SGAExpense',

    'SellingAndMarketingExpense', 'GeneralAndAdministrativeExpense', 'ResearchAndDevelopment',
    'FulfillmentExpense', 'TechnologyExpense', 'OtherOperatingExpense',

    'DepreciationAmortization', 'OperatingLeaseCost', 'VariableLeaseCost', 'LeasesDiscountRate',

    'InterestExpense', 'InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment',

    'TaxProvision', 'NetIncomeNoncontrolling',

    // Balance Sheet Inputs
    'CashAndCashEquivalents', 'ShortTermInvestments', 'ReceivablesCurrent', 'Inventory', 'DeferredTaxAssetsCurrentBS', 'OtherAssetsCurrent',
    'PropertyPlantAndEquipmentNet', 'OperatingLeaseAssetsNoncurrent', 'FinanceLeaseAssetsNoncurrent', 'Goodwill', 'DeferredIncomeTaxAssetsNoncurrent', 'OtherAssetsNoncurrent', 'ReceivablesNoncurrent', 'VariableLeaseAssets',
    
    'AccountsPayableCurrent', 'EmployeeLiabilitiesCurrent', 'AccruedLiabilitiesCurrent', 'AccruedIncomeTaxesCurrent', 'DeferredRevenueCurrent', 'LongTermDebtCurrent', 'OperatingLeaseLiabilitiesCurrent', 'FinanceLeaseLiabilitiesCurrent', 'OtherLiabilitiesCurrent',
    
    'LongTermDebtNoncurrent', 'OperatingLeaseLiabilitiesNoncurrent', 'FinanceLeaseLiabilitiesNoncurrent', 'DeferredIncomeTaxLiabilitiesNoncurrent', 'OtherLiabilitiesNoncurrent',
    
    'CommonStockEquity', 'PaidInCapitalCommonStock', 'AccumulatedOtherComprehensiveIncomeLossNetOfTax', 'RetainedEarningsAccumulated', 'NoncontrollingInterest', 'NoncontrollingInterests',
    
    'Debt', 'ForeignTaxCreditCarryForward', 'CapitalExpenditures', 'OperatingCash', 'ExcessCash'
  ];



  const calculatedFields = [

    'GrossIncome', 'OperatingExpense', 'OperatingIncome',

    'NetNonOperatingInterestIncome', 'PretaxIncome',

    'ProfitLossControlling', 'NetIncome'

  ];



  // Use imported calculation utilities for income statement, balance sheet, and NOPAT fields

  const isInputField = (field: string) => isIncomeInputField(field) || isBalanceSheetInputField(field) || isNOPATInputField(field) || isInvestedCapitalInputField(field) || isPPEChangesInputField(field) || isROICInputField(field) || isFinancingHealthInputField(field) || isFreeCashFlowInputField(field) || inputFields.includes(field);

  const isCalculatedField = (field: string) => {

    // Explicitly ensure these fields ARE calculated - they are read-only

    const alwaysCalculatedFields = [

      'GrossIncome', 'OperatingExpense', 'OperatingIncome',

      'NetNonOperatingInterestIncome', 'PretaxIncome',

      'ProfitLossControlling', 'NetIncome'

    ];

    if (alwaysCalculatedFields.includes(field)) {

      return true;

    }

    

    // Explicitly ensure these fields are NOT calculated - they are user input fields

    const alwaysInputFields = [

      'Revenue', 'CostOfRevenue', 'SGAExpense', 'DepreciationAmortization',
      'SellingAndMarketingExpense', 'GeneralAndAdministrativeExpense', 'ResearchAndDevelopment',
      'FulfillmentExpense', 'TechnologyExpense', 'OtherOperatingExpense',

      'OperatingLeaseCost', 'VariableLeaseCost', 'LeasesDiscountRate',

      'InterestExpense', 'InterestIncome', 'OtherIncome', 'ForeignCurrencyAdjustment',

      'TaxProvision', 'NetIncomeNoncontrolling',

      // Balance Sheet Always Input
      'CashAndCashEquivalents', 'ShortTermInvestments', 'ReceivablesCurrent', 'Inventory', 'DeferredTaxAssetsCurrentBS', 'OtherAssetsCurrent',
      'PropertyPlantAndEquipmentNet', 'OperatingLeaseAssetsNoncurrent', 'FinanceLeaseAssetsNoncurrent', 'Goodwill', 'DeferredIncomeTaxAssetsNoncurrent', 'OtherAssetsNoncurrent', 'ReceivablesNoncurrent', 'VariableLeaseAssets',
      
      'AccountsPayableCurrent', 'EmployeeLiabilitiesCurrent', 'AccruedLiabilitiesCurrent', 'AccruedIncomeTaxesCurrent', 'DeferredRevenueCurrent', 'LongTermDebtCurrent', 'OperatingLeaseLiabilitiesCurrent', 'FinanceLeaseLiabilitiesCurrent', 'OtherLiabilitiesCurrent',
      
      'LongTermDebtNoncurrent', 'OperatingLeaseLiabilitiesNoncurrent', 'FinanceLeaseLiabilitiesNoncurrent', 'DeferredIncomeTaxLiabilitiesNoncurrent', 'OtherLiabilitiesNoncurrent',
      
      'CommonStockEquity', 'PaidInCapitalCommonStock', 'AccumulatedOtherComprehensiveIncomeLossNetOfTax', 'RetainedEarningsAccumulated', 'NoncontrollingInterest', 'NoncontrollingInterests',
      
      'Debt', 'ForeignTaxCreditCarryForward', 'CapitalExpenditures', 'OperatingCash', 'ExcessCash'
    ];

    if (alwaysInputFields.includes(field)) {

      return false;

    }

    return isIncomeCalculatedField(field) || isBalanceSheetCalculatedField(field) || isNOPATCalculatedField(field) || isInvestedCapitalCalculatedField(field) || isPPEChangesCalculatedField(field) || isROICCalculatedField(field) || isFinancingHealthCalculatedField(field) || isFreeCashFlowCalculatedField(field) || calculatedFields.includes(field);

  };



  const handleDataChange = (tableId: string, year: number, field: string, value: number | string) => {

    // Prevent user edits on calculated fields
    // For balance sheet, map display key to actual data key before checking
    const fieldToCheck = tableId === 'balanceSheet' ? mapBalanceSheetKey(field) : field;
    
    if ((tableId === 'incomeStatement' || tableId === 'balanceSheet' || tableId === 'nopat' || tableId === 'investedCapital' || tableId === 'ppeChanges' || tableId === 'roicPerformance' || tableId === 'financingHealth' || tableId === 'freeCashFlow') && isCalculatedField(fieldToCheck)) {

      return;

    }



    // Update local state immediately with the new value
    // For balance sheet, map display key to actual data key before storing
    const storageField = tableId === 'balanceSheet' ? mapBalanceSheetKey(field) : field;
    let computedUpdatedData: any = null;
    setAllData(prev => {

      const updatedData = {

      ...prev,

      [tableId]: {

        ...prev[tableId],

        [year]: {

          ...(prev[tableId] && prev[tableId][year] ? prev[tableId][year] : {}),

          [storageField]: value

        }

      }

      };



      // For income statement fields, calculate dependent fields immediately

      if (tableId === 'incomeStatement' && isInputField(field)) {

        try {

          // Calculate dependent fields using our client-side utilities

          const calculatedValues = calculateDependentFields(updatedData.incomeStatement as any, year, field);

          

          // Update the data with calculated values

          updatedData.incomeStatement = {

            ...updatedData.incomeStatement,

            [year]: {

              ...(updatedData.incomeStatement?.[year] || {}),

              ...calculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating income statement dependent fields:', error);

        }

      }



      // For balance sheet fields, calculate dependent fields immediately

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        // Map display key to actual data key for balance sheet fields
        // BalanceSheetTable uses display keys (like 'Receivables', 'Assets') but 
        // calculation functions expect actual data keys (like 'ReceivablesCurrent', calculated 'Assets')
        const mappedField = mapBalanceSheetKey(field);

        // Check if the mapped field is an input field
        if (isInputField(mappedField)) {
          try {

            // Calculate dependent fields using our client-side utilities
            // Use the mapped field name for calculations

            const calculatedValues = calculateBalanceSheetDependentFields(updatedData.balanceSheet as any, year, mappedField);

            // Update the data with calculated values

            updatedData.balanceSheet = {

              ...updatedData.balanceSheet,

              [year]: {

                ...(updatedData.balanceSheet?.[year] || {}),

                ...calculatedValues

              }

            };

          } catch (error) {

            console.error('Error calculating balance sheet dependent fields:', error);

          }

        }

      }



      // For income statement changes, recalculate NOPAT fields automatically

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          // Calculate all NOPAT fields when income statement changes

          const nopatCalculatedValues = calculateAllNOPATFields(

            updatedData.nopat as any,

            year,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any,

            updatedData.incomeStatement as any

          );

          

          // Update NOPAT data with calculated values

          updatedData.nopat = {

            ...updatedData.nopat,

            [year]: {

              ...(updatedData.nopat?.[year] || {}),

              ...nopatCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating NOPAT fields from income statement changes:', error);

        }

      }



      // For invested capital fields, calculate dependent fields immediately

      if (tableId === 'investedCapital' && isInputField(field) && year >= 2025 && year <= 2035) {

        try {

          const calculatedValues = calculateInvestedCapitalDependentFields(

            updatedData.investedCapital as any,

            year,

            field,

            updatedData.balanceSheet as any,

            updatedData.incomeStatement as any

          );

          

          updatedData.investedCapital = {

            ...updatedData.investedCapital,

            [year]: {

              ...(updatedData.investedCapital?.[year] || {}),

              ...calculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating invested capital dependent fields:', error);

        }

      }



      // For balance sheet changes, recalculate invested capital fields automatically

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        try {

          // Only calculate if we have prior year data (needed for YoY changes)

          if (updatedData.balanceSheet && updatedData.balanceSheet[year - 1]) {

            // Calculate all invested capital fields when balance sheet changes

            const investedCapitalCalculatedValues = calculateAllInvestedCapitalFields(

              updatedData.investedCapital as any,

              year,

              updatedData.balanceSheet as any,

              updatedData.incomeStatement as any

            );

            

            // Update invested capital data with calculated values

            updatedData.investedCapital = {

              ...updatedData.investedCapital,

              [year]: {

                ...(updatedData.investedCapital?.[year] || {}),

                ...investedCapitalCalculatedValues

              }

            };



            // Also recalculate PPE Changes when balance sheet changes

            const ppeChangesCalculatedValues = calculateAllPPEChangesFields(

              updatedData.ppeChanges as any,

              year,

              updatedData.balanceSheet as any,

              updatedData.incomeStatement as any

            );

            

            updatedData.ppeChanges = {

              ...updatedData.ppeChanges,

              [year]: {

                ...(updatedData.ppeChanges?.[year] || {}),

                ...ppeChangesCalculatedValues

              }

            };

          }

        } catch (error) {

          console.error('Error calculating invested capital fields from balance sheet changes:', error);

        }

      }



      // For income statement changes, also recalculate PPE Changes (for depreciation) and ROIC

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          // Calculate PPE Changes fields when income statement changes (affects depreciation)

          const ppeChangesCalculatedValues = calculateAllPPEChangesFields(

            updatedData.ppeChanges as any,

            year,

            updatedData.balanceSheet as any,

            updatedData.incomeStatement as any

          );

          

          updatedData.ppeChanges = {

            ...updatedData.ppeChanges,

            [year]: {

              ...(updatedData.ppeChanges?.[year] || {}),

              ...ppeChangesCalculatedValues

            }

          };



          // Calculate ROIC fields when income statement changes

          const roicCalculatedValues = calculateAllROICFields(

            updatedData.roicPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.roicPerformance = {

            ...updatedData.roicPerformance,

            [year]: {

              ...(updatedData.roicPerformance?.[year] || {}),

              ...roicCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating PPE Changes/ROIC fields from income statement changes:', error);

        }

      }



      // For invested capital changes, recalculate ROIC fields

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const roicCalculatedValues = calculateAllROICFields(

            updatedData.roicPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.roicPerformance = {

            ...updatedData.roicPerformance,

            [year]: {

              ...(updatedData.roicPerformance?.[year] || {}),

              ...roicCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating ROIC fields from invested capital changes:', error);

        }

      }



      // For NOPAT changes, recalculate ROIC and Financing Health fields

      if (tableId === 'nopat' && year >= 2025 && year <= 2035) {

        try {

          const roicCalculatedValues = calculateAllROICFields(

            updatedData.roicPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.roicPerformance = {

            ...updatedData.roicPerformance,

            [year]: {

              ...(updatedData.roicPerformance?.[year] || {}),

              ...roicCalculatedValues

            }

          };



          // Calculate Financing Health fields when NOPAT changes

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...(updatedData.financingHealth?.[year] || {}),

              ...financingHealthCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating ROIC/Financing Health fields from NOPAT changes:', error);

        }

      }



      // For income statement changes, also recalculate Financing Health fields

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...(updatedData.financingHealth?.[year] || {}),

              ...financingHealthCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Financing Health fields from income statement changes:', error);

        }

      }



      // For invested capital changes, recalculate Financing Health fields

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...(updatedData.financingHealth?.[year] || {}),

              ...financingHealthCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Financing Health fields from invested capital changes:', error);

        }

      }



      // For balance sheet changes, recalculate Financing Health and Free Cash Flow fields

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        try {

          const financingHealthCalculatedValues = calculateAllFinancingHealthFields(

            updatedData.financingHealth as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.investedCapital as any,

            updatedData.balanceSheet as any

          );

          

          updatedData.financingHealth = {

            ...updatedData.financingHealth,

            [year]: {

              ...updatedData.financingHealth[year],

              ...financingHealthCalculatedValues

            }

          };



          // Calculate Free Cash Flow fields when balance sheet changes

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...updatedData.freeCashFlow[year],

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Financing Health/Free Cash Flow fields from balance sheet changes:', error);

        }

      }



      // For NOPAT changes, also recalculate Free Cash Flow fields

      if (tableId === 'nopat' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from NOPAT changes:', error);

        }

      }



      // For income statement changes, also recalculate Free Cash Flow fields

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from income statement changes:', error);

        }

      }



      // For invested capital changes, recalculate Free Cash Flow fields

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from invested capital changes:', error);

        }

      }



      // For PPE changes, recalculate Free Cash Flow fields

      if (tableId === 'ppeChanges' && year >= 2025 && year <= 2035) {

        try {

          const freeCashFlowCalculatedValues = calculateAllFreeCashFlowFields(

            updatedData.freeCashFlow as any,

            year,

            updatedData.nopat as any,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.ppeChanges as any

          );

          

          updatedData.freeCashFlow = {

            ...updatedData.freeCashFlow,

            [year]: {

              ...(updatedData.freeCashFlow?.[year] || {}),

              ...freeCashFlowCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Free Cash Flow fields from PPE changes:', error);

        }

      }



      // For income statement changes, recalculate Operational Performance fields

      if (tableId === 'incomeStatement' && year >= 2025 && year <= 2035) {

        try {

          const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

            updatedData.operationalPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.operationalPerformance = {

            ...updatedData.operationalPerformance,

            [year]: {

              ...(updatedData.operationalPerformance?.[year] || {}),

              ...operationalPerformanceCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Operational Performance fields from income statement changes:', error);

        }

      }



      // For balance sheet changes, recalculate Operational Performance fields

      if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

        try {

          // Only calculate if we have all required prerequisite data

          if (updatedData.incomeStatement?.[year] && 

              updatedData.investedCapital?.[year] && 

              updatedData.nopat?.[year]) {

            const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

              updatedData.operationalPerformance as any,

              year,

              updatedData.incomeStatement as any,

              updatedData.balanceSheet as any,

              updatedData.investedCapital as any,

              updatedData.nopat as any

            );

            

            updatedData.operationalPerformance = {

              ...updatedData.operationalPerformance,

              [year]: {

                ...(updatedData.operationalPerformance?.[year] || {}),

                ...operationalPerformanceCalculatedValues

              }

            };

          }

        } catch (error) {

          console.error('Error calculating Operational Performance fields from balance sheet changes:', error);

        }

      }



      // For NOPAT changes, recalculate Operational Performance fields (ROIC metrics)

      if (tableId === 'nopat' && year >= 2025 && year <= 2035) {

        try {

          const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

            updatedData.operationalPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.operationalPerformance = {

            ...updatedData.operationalPerformance,

            [year]: {

              ...(updatedData.operationalPerformance?.[year] || {}),

              ...operationalPerformanceCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Operational Performance fields from NOPAT changes:', error);

        }

      }



      // For invested capital changes, recalculate Operational Performance fields (ROIC metrics)

      if (tableId === 'investedCapital' && year >= 2025 && year <= 2035) {

        try {

          const operationalPerformanceCalculatedValues = calculateAllOperationalPerformanceFields(

            updatedData.operationalPerformance as any,

            year,

            updatedData.incomeStatement as any,

            updatedData.balanceSheet as any,

            updatedData.investedCapital as any,

            updatedData.nopat as any

          );

          

          updatedData.operationalPerformance = {

            ...updatedData.operationalPerformance,

            [year]: {

              ...(updatedData.operationalPerformance?.[year] || {}),

              ...operationalPerformanceCalculatedValues

            }

          };

        } catch (error) {

          console.error('Error calculating Operational Performance fields from invested capital changes:', error);

        }

      }

      computedUpdatedData = updatedData;
      return updatedData;

    });

    // Sync updated data to context for the selected company
    // Use setTimeout to ensure state update completes, then sync using computed data
    setTimeout(() => {
      if (computedUpdatedData) {
        // Sync the table that was changed
        if (computedUpdatedData[tableId]) {
          console.log(`Syncing ${tableId} for ${selectedCompany}, year ${year}, field ${field}:`, computedUpdatedData[tableId][year]);
          updateCompanyTableData(selectedCompany, tableId, computedUpdatedData[tableId]);
        }
        
        // Also sync dependent tables that may have been recalculated
        const dependentTables: { [key: string]: string[] } = {
          'incomeStatement': ['nopat', 'roicPerformance', 'financingHealth', 'freeCashFlow', 'operationalPerformance', 'ppeChanges'],
          'balanceSheet': ['investedCapital', 'ppeChanges', 'financingHealth', 'freeCashFlow'],
          'nopat': ['roicPerformance', 'financingHealth', 'freeCashFlow'],
          'investedCapital': ['roicPerformance', 'financingHealth', 'freeCashFlow'],
          'ppeChanges': ['freeCashFlow']
        };

        const tablesToSync = dependentTables[tableId] || [];
        tablesToSync.forEach(depTableId => {
          if (computedUpdatedData[depTableId]) {
            updateCompanyTableData(selectedCompany, depTableId, computedUpdatedData[depTableId]);
          }
        });
      }
    }, 0);

    // NOTE: Backend calculations are disabled in favor of client-side calculations above

    // to prevent race conditions that overwrite user input with stale data

    

    // // Trigger backend calculations for balance sheet input fields

    // if (tableId === 'balanceSheet' && year >= 2025 && year <= 2035) {

    //   // Call balance sheet dependent fields endpoint for any change

    //   recalculateBalanceSheetDependentFields(year, field, value);

    // }



    // // Optional: Also trigger backend calculation for validation/backup

    // if (tableId === 'incomeStatement' && isInputField(field) && year >= 2025 && year <= 2035) {

    //   // Trigger backend calculation in background for validation

    //   recalculateDependentFields(year, field, value);

    // }

  };



  const handleReset = async () => {
    // Reset context for the selected company
    resetCompanyData(selectedCompany);

    // Fetch income statement from API
    const incomeStatementData = await fetchIncomeStatementData(selectedCompany);

    // Reload static data for the selected company (without context merge since we just cleared it)
    if (selectedCompany === 'WMT') {
      setAllData({
        balanceSheet: walmartMockData.balanceSheet as TableData,
        ppeChanges: ppeChangesReal as TableData,
        freeCashFlow: walmartMockData.cashFlow as TableData,
        cashFlows: walmartMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: walmartMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: walmartMockData.balanceSheetCommonSize as TableData,
        nopat: walmartMockData.nopat as TableData,
        investedCapital: walmartMockData.investedCapital as TableData,
        roicPerformance: walmartMockData.roicPerformance as TableData,
        financingHealth: walmartMockData.financingHealth as TableData,
        operationalPerformance: walmartMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'BJ') {
      setAllData({
        balanceSheet: bjMockData.balanceSheet as TableData,
        ppeChanges: bjMockData.ppeChanges as TableData,
        freeCashFlow: bjMockData.freeCashFlow as TableData,
        cashFlows: bjMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: bjMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: bjMockData.balanceSheetCommonSize as TableData,
        nopat: bjMockData.nopat as TableData,
        investedCapital: bjMockData.investedCapital as TableData,
        roicPerformance: bjMockData.roicPerformance as TableData,
        financingHealth: bjMockData.financingHealth as TableData,
        operationalPerformance: bjMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'DG') {
      setAllData({
        balanceSheet: dgMockData.balanceSheet as TableData,
        ppeChanges: ppeChangesReal as TableData,
        freeCashFlow: dgMockData.cashFlow as TableData,
        cashFlows: dgMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: dgMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: dgMockData.balanceSheetCommonSize as TableData,
        nopat: dgMockData.nopat as TableData,
        investedCapital: dgMockData.investedCapital as TableData,
        roicPerformance: dgMockData.roicPerformance as TableData,
        financingHealth: dgMockData.financingHealth as TableData,
        operationalPerformance: dgMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'DLTR') {
      setAllData({
        balanceSheet: dltrMockData.balanceSheet as TableData,
        ppeChanges: dltrMockData.ppeChanges as TableData,
        freeCashFlow: dltrMockData.freeCashFlow as TableData,
        cashFlows: dltrMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: dltrMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: dltrMockData.balanceSheetCommonSize as TableData,
        nopat: dltrMockData.nopat as TableData,
        investedCapital: dltrMockData.investedCapital as TableData,
        roicPerformance: dltrMockData.roicPerformance as TableData,
        financingHealth: dltrMockData.financingHealth as TableData,
        operationalPerformance: dltrMockData.operationalPerformance as TableData
      });
    } else if (selectedCompany === 'TGT') {
      setAllData({
        balanceSheet: tgtMockData.balanceSheet as TableData,
        ppeChanges: tgtMockData.ppeChanges as TableData,
        freeCashFlow: tgtMockData.freeCashFlow as TableData,
        cashFlows: tgtMockData.cashFlow as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: tgtMockData.incomeStatementCommonSize as TableData,
        balanceSheetCommonSize: tgtMockData.balanceSheetCommonSize as TableData,
        nopat: tgtMockData.nopat as TableData,
        investedCapital: tgtMockData.investedCapital as TableData,
        roicPerformance: tgtMockData.roicPerformance as TableData,
        financingHealth: tgtMockData.financingHealth as TableData,
        operationalPerformance: tgtMockData.operationalPerformance as TableData
      });
    } else {
      // COST (default)
      setAllData({
        balanceSheet: balanceSheetReal,
        ppeChanges: ppeChangesReal,
        freeCashFlow: freeCashFlowReal,
        cashFlows: (cashFlowReal as unknown) as TableData,
        incomeStatement: incomeStatementData || {} as TableData,
        incomeStatementCommonSize: (incomeStatementCommonReal as unknown) as TableData,
        balanceSheetCommonSize: (balanceSheetCommonReal as unknown) as TableData,
        nopat: nopatReal,
        investedCapital: investedCapitalReal,
        roicPerformance: (roicReal as unknown) as TableData,
        financingHealth: (financeHealthReal as unknown) as TableData,
        operationalPerformance: (operationalPerformanceReal as unknown) as TableData
      });
    }

  };































  // NOTE: getTableData was unused; removed to satisfy TS noUnusedLocals.



  return (

    <div className="bg-white dark:bg-[#0B0F0E] rounded-lg w-full min-h-full flex flex-col">

      {/* Header */}

      <div className="bg-white dark:bg-[#0B0F0E] border-b dark:border-[#161C1A] flex-shrink-0">

        <div className="px-4 py-4">

          <div className="flex justify-between items-center">

            <div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E0E6E4]">Company Valuation & Analysis</h1>

              <p className="text-gray-600 dark:text-[#889691] mt-1">Interactive financial modeling and valuation</p>

            </div>



            <div className="flex items-center gap-4">

              {/* Company Selector */}

              <div className="flex items-center gap-2">

                <label className="text-sm font-medium text-gray-700 dark:text-[#E0E6E4]">Company:</label>

                <div className="relative" ref={companyDropdownRef}>
                  <input
                    type="text"
                    value={
                      showCompanyDropdown || companyInput
                        ? companyInput
                        : (availableCompanies.find(c => c.ticker === selectedCompany)?.display_name || 
                           availableCompanies.find(c => c.ticker === selectedCompany)?.name || 
                           selectedCompany)
                    }
                    onChange={(e) => {
                      setCompanyInput(e.target.value);
                      setShowCompanyDropdown(true);
                    }}
                    onFocus={() => {
                      setShowCompanyDropdown(true);
                      setCompanyInput('');
                    }}
                    placeholder={companiesLoading ? "Loading..." : "Select company..."}
                    className="px-3 py-2 pr-8 border border-gray-300 dark:border-[#161C1A] rounded-lg bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] placeholder-gray-400 dark:placeholder-[#889691] focus:outline-none focus:ring-2 focus:ring-[#144D37] min-w-[200px]"
                    disabled={companiesLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400 dark:text-[#889691]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {showCompanyDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-[50vh] overflow-auto">
                      {companiesLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">Loading companies...</div>
                      ) : availableCompanies.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No companies available</div>
                      ) : (
                        availableCompanies
                          .filter(company => 
                            !companyInput || 
                            company.ticker.toLowerCase().includes(companyInput.toLowerCase()) ||
                            company.name.toLowerCase().includes(companyInput.toLowerCase()) ||
                            (company.display_name && company.display_name.toLowerCase().includes(companyInput.toLowerCase()))
                          )
                          .map(company => (
                            <div
                              key={company.ticker}
                              onClick={() => {
                                setSelectedCompany(company.ticker);
                                setCompanyInput('');
                                setShowCompanyDropdown(false);
                                onCompanyChange?.(company.ticker);
                              }}
                              className={`px-3 py-2 text-sm text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] cursor-pointer ${
                                selectedCompany === company.ticker ? 'bg-blue-50 dark:bg-[#144D37]/30' : ''
                              }`}
                            >
                              {company.display_name || company.name} ({company.ticker})
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>

              </div>



              {/* Reset Button */}

              <button

                onClick={handleReset}

                className="px-3 py-2 bg-[#144D37] text-white rounded-lg hover:bg-[#0F3A28] transition-colors flex items-center gap-2"

              >

                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />

                </svg>

                Reset

              </button>












              {/* Minimize Button */}

              {onClose && (

                <button

                  onClick={onClose}

                  className="px-3 py-2 bg-gray-600 dark:bg-[#161C1A] text-white dark:text-[#E0E6E4] rounded-lg hover:bg-gray-700 dark:hover:bg-[#1C2220] transition-colors flex items-center gap-2"

                >

                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />

                  </svg>

                  Minimize

                </button>

              )}

            </div>

          </div>

        </div>

      </div>



      {/* Content */}

      <div className="px-4 py-6">



        {/* Tables with Individual Tabs */}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <div className="space-y-2">

            {/* First Row of Tabs */}

            <TabsList className="grid w-full grid-cols-4 gap-1">
              <TabsTrigger value="3StatementModel" className="text-xs px-2 py-1">3 Statement Model</TabsTrigger>

              <TabsTrigger value="investedCapital" className="text-xs px-2 py-1">Invested Capital</TabsTrigger>

              <TabsTrigger value="cashFlow" className="text-xs px-2 py-1">Free Cash Flows</TabsTrigger>

              <TabsTrigger value="valuationSummary" className="text-xs px-2 py-1">Valuation Summary</TabsTrigger>

            </TabsList>

          </div>

          {/* 3 Statement Model content - shows Income Statement, Balance Sheet, and Cash Flow */}
          <TabsContent value="3StatementModel" className="mt-6">
            <ThreeStatementModelTab
              hasIncomeStatementData={hasIncomeStatementData}
              selectedCompany={selectedCompany}
              incomeStatementData={allData.incomeStatement || {}}
              handleDataChange={handleDataChange}
              isInputField={isInputField}
              isCalculatedField={isCalculatedField}
              IncomeStatementTable={IncomeStatementTable}
            />
          </TabsContent>

          {/* Invested Capital content */}
          <TabsContent value="investedCapital" className="mt-6">
            <InvestedCapitalTab
              investedCapitalData={allData.investedCapital || {}}
              handleDataChange={handleDataChange}
              isInvestedCapitalInputField={isInvestedCapitalInputField}
              isInvestedCapitalCalculatedField={isInvestedCapitalCalculatedField}
              selectedCompany={selectedCompany}
              InvestedCapitalTable={InvestedCapitalTable}
            />
          </TabsContent>

          {/* Free Cash Flows content */}
          <TabsContent value="cashFlow" className="mt-6">
            <FreeCashFlowsTab
              freeCashFlowData={allData.freeCashFlow || {}}
              handleDataChange={handleDataChange}
              isFreeCashFlowInputField={isFreeCashFlowInputField}
              isFreeCashFlowCalculatedField={isFreeCashFlowCalculatedField}
              selectedCompany={selectedCompany}
              FreeCashFlowTable={FreeCashFlowTable}
            />
          </TabsContent>

          {/* Valuation Summary content */}
          <TabsContent value="valuationSummary" className="mt-6">
            <ValuationSummaryTab
              valuationSummaryStaticValues={valuationSummaryStaticValues}
              valuationSummaryData={valuationSummaryData}
              setValuationSummaryData={setValuationSummaryData}
              hoveredMetric={hoveredMetric}
              setHoveredMetric={setHoveredMetric}
              tooltipPosition={tooltipPosition}
              setTooltipPosition={setTooltipPosition}
              valuationSummaryTooltips={valuationSummaryTooltips}
            />
          </TabsContent>

        </Tabs>

        {/* Info Box */}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">

          <div className="flex items-start gap-3">

            <svg className="w-5 h-5 text-gray-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

            </svg>

            <div>

              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Excel-like Functionality</h3>

              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">

                <strong>Historical data (2024 and earlier):</strong> Protected and cannot be edited (gray background). <br/>

                <strong>Forecasted years (2025+):</strong> Input tables are editable (green background), calculated tables remain read-only (blue background). <br/>

                Changes will automatically update linked calculations across all tables.

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};
export default ValuationPage;