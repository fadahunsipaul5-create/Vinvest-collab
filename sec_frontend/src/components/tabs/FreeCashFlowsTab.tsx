import React from 'react';

interface CellData {
  [key: string]: number | string;
}

interface TableData {
  [year: number]: CellData;
}

interface FreeCashFlowsTabProps {
  freeCashFlowData: TableData;
  handleDataChange: (tableId: string, year: number, field: string, value: number | string) => void;
  isFreeCashFlowInputField: (field: string) => boolean;
  isFreeCashFlowCalculatedField: (field: string) => boolean;
  selectedCompany: string;
  FreeCashFlowTable: React.ComponentType<any>;
}

const FreeCashFlowsTab: React.FC<FreeCashFlowsTabProps> = ({
  freeCashFlowData,
  handleDataChange,
  isFreeCashFlowInputField,
  isFreeCashFlowCalculatedField,
  selectedCompany,
  FreeCashFlowTable
}) => {
  return (
    <FreeCashFlowTable 
      data={freeCashFlowData || {}} 
      onDataChange={handleDataChange}
      isInputField={isFreeCashFlowInputField}
      isCalculatedField={isFreeCashFlowCalculatedField}
      companyTicker={selectedCompany}
    />
  );
};

export default FreeCashFlowsTab;

