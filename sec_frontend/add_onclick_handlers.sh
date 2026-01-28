#!/bin/bash

# This script adds onClick handlers to all breakdown field cells in the Income Statement table

FILE="/Users/apple/Documents/Vinvest-collab/sec_frontend/src/components/tables/IncomeStatementTable.tsx"

# List of all breakdown fields that need onClick handlers
FIELDS=(
  "SellingGeneralAndAdministration"
  "Depreciation"
  "IntangibleAssetAmortization"
  "DepreciationAndIntangibleAssetAmortization"
  "OperatingLeaseAmortization"
  "FinanceLeaseAmortization"
  "VariableLeaseAmortization"
  "LeaseAmortization"
  "ResearchAndDevelopment"
  "GoodwillImpairment"
  "OtherOperatingExpense"
  "OperatingExpenses"
  "VariableLeaseCost"
  "OperatingExpensesAdjusted"
  "OperatingIncome"
  "InterestExpenseDebt"
  "OperatingLeaseInterestExpense"
  "FinanceLeaseInterestExpense"
  "VariableLeaseInterestExpense"
  "InterestExpense"
  "InterestIncome"
  "InterestExpenseIncomeNet"
  "OtherNonoperatingIncome"
  "NonoperatingIncomeNet"
  "PretaxIncome"
  "TaxProvision"
  "NetIncomeControlling"
  "NetIncomeNoncontrolling"
  "NetIncome"
  "AssetImpairmentCharge"
  "UnrealizedGainOnInvestments"
  "OtherNoncashChanges"
  "StockBasedCompensation"
  "CommonStockDividendPayment"
  "CommonStockRepurchasePayment"
  "EBIT"
  "EBITA"
  "EBITDA"
  "TaxOperating"
  "NetOperatingProfitAfterTaxes"
  "OperatingLeaseCost"
  "CapitalExpenditures"
)

# For each field, add onClick handler after the className line
for field in "${FIELDS[@]}"; do
  # Find lines with the field name and add onClick handler
  sed -i '' "/onMouseEnter.*setHoveredBreakdown('$field')/i\\
                onClick={() => handleBreakdownClick('$field')}
" "$FILE"
done

echo "Added onClick handlers to breakdown fields"
