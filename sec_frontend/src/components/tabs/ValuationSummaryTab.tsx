import React from 'react';

interface ValuationSummaryStaticValues {
  yearlyValues: { [year: number]: { fcf: number; discountFactor: number; presentValue: number } };
  valueOfOperations: number;
  adjustedValueOfOperations: number;
  excessCash: number;
  enterpriseValue: number;
  debt: number;
  operatingLeaseLiabilities: number;
  financeLeaseLiabilities: number;
  variableLeaseLiabilities: number;
  equityIntrinsicValue: number;
  nopatGrowthRate: number;
  returnOnNewInvestedCapital: number;
  weightedAverageCostOfCapital: number;
}

interface ValuationSummaryData {
  nopatGrowthRate: string;
  returnOnNewInvestedCapital: string;
  weightedAverageCostOfCapital: string;
  valueOfCarryForwardCredits: string;
}

interface ValuationSummaryTabProps {
  valuationSummaryStaticValues: ValuationSummaryStaticValues | null;
  valuationSummaryData: ValuationSummaryData;
  setValuationSummaryData: React.Dispatch<React.SetStateAction<ValuationSummaryData>>;
  hoveredMetric: string | null;
  setHoveredMetric: React.Dispatch<React.SetStateAction<string | null>>;
  tooltipPosition: { x: number; y: number };
  setTooltipPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  valuationSummaryTooltips: { [key: string]: string };
}

const ValuationSummaryTab: React.FC<ValuationSummaryTabProps> = ({
  valuationSummaryStaticValues,
  valuationSummaryData,
  setValuationSummaryData,
  hoveredMetric,
  setHoveredMetric,
  tooltipPosition,
  setTooltipPosition,
  valuationSummaryTooltips
}) => {
  return (
    <div className="p-6 bg-white dark:bg-[#0B0F0E] rounded-lg shadow-sm border dark:border-[#161C1A] relative">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-[#E0E6E4] mb-4">Valuation Summary</h3>

      {/* Tooltip */}
      {hoveredMetric && valuationSummaryTooltips[hoveredMetric] && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg pointer-events-none max-w-md"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          {valuationSummaryTooltips[hoveredMetric]}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-900 dark:text-gray-200 border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 sticky left-0 z-20 bg-gray-100 dark:bg-gray-700 border-r dark:border-gray-600 min-w-[300px]">
                Metric
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">
                FreeCashFlow
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">
                DiscountFactor
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">
                PresentValue
              </th>
            </tr>
          </thead>
          <tbody>
            {/* NOPAT Growth Rate In Perpetuity */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('NOPAT Growth Rate In Perpetuity');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                NOPAT Growth Rate In Perpetuity
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? valuationSummaryStaticValues.nopatGrowthRate.toFixed(2) : '0.00'}%
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="text"
                  value={valuationSummaryData.nopatGrowthRate}
                  onChange={(e) => setValuationSummaryData(prev => ({ ...prev, nopatGrowthRate: e.target.value }))}
                  className="w-full px-2 py-1 text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0B0F0E] border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#144D37] dark:focus:ring-[#144D37]"
                  placeholder="-"
                />
              </td>
            </tr>

            {/* Return On New Invested Capital */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Return On New Invested Capital');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Return On New Invested Capital
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? valuationSummaryStaticValues.returnOnNewInvestedCapital.toFixed(2) : '0.00'}%
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="text"
                  value={valuationSummaryData.returnOnNewInvestedCapital}
                  onChange={(e) => setValuationSummaryData(prev => ({ ...prev, returnOnNewInvestedCapital: e.target.value }))}
                  className="w-full px-2 py-1 text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0B0F0E] border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#144D37] dark:focus:ring-[#144D37]"
                  placeholder="-"
                />
              </td>
            </tr>

            {/* Weighted Average Cost of Capital */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Weighted Average Cost of Capital');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Weighted Average Cost of Capital
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? valuationSummaryStaticValues.weightedAverageCostOfCapital.toFixed(2) : '0.00'}%
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="text"
                  value={valuationSummaryData.weightedAverageCostOfCapital}
                  onChange={(e) => setValuationSummaryData(prev => ({ ...prev, weightedAverageCostOfCapital: e.target.value }))}
                  className="w-full px-2 py-1 text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0B0F0E] border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#144D37] dark:focus:ring-[#144D37]"
                  placeholder="-"
                />
              </td>
            </tr>

            {/* Yearly Discounted Values */}
            {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map(year => {
              const metricName = `${year} Discounted Value`;
              const yearData = valuationSummaryStaticValues?.yearlyValues[year];
              
              return (
                <tr key={year} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td 
                    className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                    onMouseEnter={(e) => {
                      setHoveredMetric(metricName);
                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    {metricName}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {yearData ? `$${(yearData.fcf / 1000000).toFixed(2)}M` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {yearData ? yearData.discountFactor.toFixed(4) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {yearData ? `$${(yearData.presentValue / 1000000).toFixed(2)}M` : '-'}
                  </td>
                </tr>
              );
            })}

            {/* Value Of Operations */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-800">
              <td 
                className="px-4 py-3 font-bold text-gray-800 dark:text-white sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Value Of Operations');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Value Of Operations
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.valueOfOperations / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* Midyear Adjustment Factor */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Midyear Adjustment Factor');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Midyear Adjustment Factor
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? (Math.sqrt(1 + valuationSummaryStaticValues.weightedAverageCostOfCapital / 100)).toFixed(4) : '-'}
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
            </tr>

            {/* Adjusted Value Of Operations */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-800">
              <td 
                className="px-4 py-3 font-bold text-gray-800 dark:text-white sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Adjusted Value Of Operations');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Adjusted Value Of Operations
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.adjustedValueOfOperations / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* Excess Cash */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Excess Cash');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Excess Cash
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.excessCash / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* Value Of Carry forward Credits - Highlighted in red */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-red-600 dark:text-red-400 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Value Of Carry forward Credits');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Value Of Carry forward Credits
              </td>
              <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">
                -
              </td>
              <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">
                -
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="text"
                  value={valuationSummaryData.valueOfCarryForwardCredits}
                  onChange={(e) => setValuationSummaryData(prev => ({ ...prev, valueOfCarryForwardCredits: e.target.value }))}
                  className="w-full px-2 py-1 text-center text-red-600 dark:text-red-400 bg-white dark:bg-[#0B0F0E] border border-red-300 dark:border-red-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500"
                  placeholder="-"
                />
              </td>
            </tr>

            {/* Enterprise Value */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-800">
              <td 
                className="px-4 py-3 font-bold text-gray-800 dark:text-white sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Enterprise Value');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Enterprise Value
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.enterpriseValue / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* Debt */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('Debt');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                Debt
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.debt / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* OperatingLeaseLiabilities */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('OperatingLeaseLiabilities');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                OperatingLeaseLiabilities
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.operatingLeaseLiabilities / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* FinanceLeaseLiabilities */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('FinanceLeaseLiabilities');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                FinanceLeaseLiabilities
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.financeLeaseLiabilities / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* VariableLeaseLiabilities */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <td 
                className="px-4 py-3 font-medium text-gray-800 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-800 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('VariableLeaseLiabilities');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                VariableLeaseLiabilities
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.variableLeaseLiabilities / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>

            {/* EquityIntrinsicValue */}
            <tr className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-blue-50 dark:bg-blue-900/20">
              <td 
                className="px-4 py-3 font-bold text-gray-800 dark:text-white sticky left-0 z-10 bg-blue-50 dark:bg-blue-900/20 border-r dark:border-gray-600 cursor-help relative"
                onMouseEnter={(e) => {
                  setHoveredMetric('EquityIntrinsicValue');
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                EquityIntrinsicValue
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                -
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white">
                {valuationSummaryStaticValues ? `$${(valuationSummaryStaticValues.equityIntrinsicValue / 1000000).toFixed(2)}M` : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ValuationSummaryTab;

