import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// TableData structure: { [year: number]: { [field: string]: number | string } }
interface CellData {
  [key: string]: number | string;
}

interface TableData {
  [year: number]: CellData;
}

// Modified company data structure: { [tableId: string]: TableData }
interface CompanyModifiedData {
  [tableId: string]: TableData;
}

// Context data structure: { [ticker: string]: CompanyModifiedData }
interface CompanyDataContextType {
  modifiedData: { [ticker: string]: CompanyModifiedData };
  resetTrigger: number; // Timestamp that changes whenever any reset occurs
  isSandboxMode: boolean;
  toggleSandboxMode: () => void;
  updateCompanyData: (ticker: string, tableId: string, year: number, field: string, value: number | string) => void;
  updateCompanyTableData: (ticker: string, tableId: string, tableData: TableData) => void;
  getModifiedCompanyData: (ticker: string) => CompanyModifiedData | null;
  resetCompanyData: (ticker: string) => void;
  resetAllCompanyData: () => void;
}

const CompanyDataContext = createContext<CompanyDataContextType | undefined>(undefined);

export const CompanyDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modifiedData, setModifiedData] = useState<{ [ticker: string]: CompanyModifiedData }>({});
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  const toggleSandboxMode = useCallback(() => {
    setIsSandboxMode(prev => !prev);
  }, []);

  // Update a specific field in a table for a company
  const updateCompanyData = useCallback((
    ticker: string,
    tableId: string,
    year: number,
    field: string,
    value: number | string
  ) => {
    setModifiedData(prev => {
      const newData = { ...prev };
      
      // Initialize ticker if it doesn't exist
      if (!newData[ticker]) {
        newData[ticker] = {};
      }
      
      // Initialize table if it doesn't exist
      if (!newData[ticker][tableId]) {
        newData[ticker][tableId] = {};
      }
      
      // Initialize year if it doesn't exist
      if (!newData[ticker][tableId][year]) {
        newData[ticker][tableId][year] = {};
      }
      
      // Update the field value
      newData[ticker][tableId][year][field] = value;
      
      return newData;
    });
  }, []);

  // Update entire table data for a company (useful for bulk updates)
  const updateCompanyTableData = useCallback((
    ticker: string,
    tableId: string,
    tableData: TableData
  ) => {
    setModifiedData(prev => {
      const newData = { ...prev };
      
      // Initialize ticker if it doesn't exist
      if (!newData[ticker]) {
        newData[ticker] = {};
      }
      
      // Deep merge the table data (new data takes precedence)
      // Need to merge year-by-year to ensure nested fields are properly merged
      const existingTable = newData[ticker][tableId] || {};
      const mergedTable: TableData = { ...existingTable };
      
      // Merge each year's data
      Object.keys(tableData).forEach(year => {
        const yearKey = typeof year === 'string' && !isNaN(Number(year)) ? Number(year) : year;
        (mergedTable as any)[yearKey] = {
          ...((existingTable as any)[yearKey] || {}),
          ...(tableData as any)[year]
        };
      });
      
      newData[ticker][tableId] = mergedTable;
      
      return newData;
    });
  }, []);

  // Get modified data for a specific company
  const getModifiedCompanyData = useCallback((ticker: string): CompanyModifiedData | null => {
    return modifiedData[ticker] || null;
  }, [modifiedData]);

  // Reset all modifications for a specific company
  const resetCompanyData = useCallback((ticker: string) => {
    setModifiedData(prev => {
      const newData = { ...prev };
      delete newData[ticker];
      return newData;
    });
    setResetTrigger(Date.now()); // Trigger Dashboard refresh
  }, []);

  // Reset all modifications for all companies
  const resetAllCompanyData = useCallback(() => {
    setModifiedData({});
    setResetTrigger(Date.now()); // Trigger Dashboard refresh
  }, []);

  return (
    <CompanyDataContext.Provider
      value={{
        modifiedData,
        resetTrigger,
        isSandboxMode,
        toggleSandboxMode,
        updateCompanyData,
        updateCompanyTableData,
        getModifiedCompanyData,
        resetCompanyData,
        resetAllCompanyData,
      }}
    >
      {children}
    </CompanyDataContext.Provider>
  );
};

// Hook to use the company data context
export const useCompanyData = (): CompanyDataContextType => {
  const context = useContext(CompanyDataContext);
  if (context === undefined) {
    throw new Error('useCompanyData must be used within a CompanyDataProvider');
  }
  return context;
};

