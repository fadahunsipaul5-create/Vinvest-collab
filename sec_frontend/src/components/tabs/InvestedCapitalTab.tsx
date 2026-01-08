import React from 'react';

interface CellData {
  [key: string]: number | string;
}

interface TableData {
  [year: number]: CellData;
}

interface InvestedCapitalTabProps {
  investedCapitalData: TableData;
  handleDataChange: (tableId: string, year: number, field: string, value: number | string) => void;
  isInvestedCapitalInputField: (field: string) => boolean;
  isInvestedCapitalCalculatedField: (field: string) => boolean;
  selectedCompany: string;
  InvestedCapitalTable: React.ComponentType<any>;
}

const InvestedCapitalTab: React.FC<InvestedCapitalTabProps> = ({
  investedCapitalData,
  handleDataChange,
  isInvestedCapitalInputField,
  isInvestedCapitalCalculatedField,
  selectedCompany,
  InvestedCapitalTable
}) => {
  return (
    <InvestedCapitalTable 
      data={investedCapitalData || {}} 
      onDataChange={handleDataChange}
      isInputField={isInvestedCapitalInputField}
      isCalculatedField={isInvestedCapitalCalculatedField}
      companyTicker={selectedCompany}
    />
  );
};

export default InvestedCapitalTab;

