import React from 'react';

interface CellData {
  [key: string]: number | string;
}

interface TableData {
  [year: number]: CellData;
}

interface ThreeStatementModelTabProps {
  hasIncomeStatementData: boolean;
  selectedCompany: string;
  incomeStatementData: TableData;
  handleDataChange: (tableId: string, year: number, field: string, value: number | string) => void;
  isInputField: (field: string) => boolean;
  isCalculatedField: (field: string) => boolean;
  IncomeStatementTable: React.ComponentType<any>;
  forecastDriverValues?: any;
}

const ThreeStatementModelTab: React.FC<ThreeStatementModelTabProps> = ({
  hasIncomeStatementData,
  selectedCompany,
  incomeStatementData,
  handleDataChange,
  isInputField,
  isCalculatedField,
  IncomeStatementTable,
  forecastDriverValues
}) => {
  return (
    <>
      {!hasIncomeStatementData && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 dark:text-yellow-500">⚠</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                No income statement data available for {selectedCompany}. The API returned no historical records.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-[#161C1A] rounded-lg shadow-sm border dark:border-gray-700 overflow-x-auto">
        <div className="[&>div]:mb-0 [&>div]:border-0 [&>div]:rounded-none [&>div>div:first-child]:hidden [&>div>div:last-child]:overflow-visible">
          <IncomeStatementTable 
            data={incomeStatementData || {}} 
            onDataChange={handleDataChange}
            isInputField={isInputField}
            isCalculatedField={isCalculatedField}
            companyTicker={selectedCompany}
            forecastDriverValues={forecastDriverValues}
          />
        </div>
      </div>
    </>
  );
};

export default ThreeStatementModelTab;

