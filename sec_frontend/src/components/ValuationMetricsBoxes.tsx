import React from 'react';

interface ValuationMetricsBoxesProps {
  ticker: string;
}

interface MetricsData {
  equityValue: number;
  marketCap: number;
  roic: number;
  earningsYield: number;
  marginOfSafety: number;
}

const ValuationMetricsBoxes: React.FC<ValuationMetricsBoxesProps> = ({ ticker: _ticker }) => {
  // Dummy data for now - will be replaced with real API calls later
  const metrics: MetricsData = {
    equityValue: 4.3,      // in billions
    marketCap: 156.8,      // in billions
    roic: 12.5,           // percentage
    earningsYield: 8.2,   // percentage
    marginOfSafety: 15.3, // percentage
  };

  const formatValue = (value: number, prefix: string = '', suffix: string = '', decimals: number = 1) => {
    return `${prefix}${value.toFixed(decimals)}${suffix}`;
  };

  const metricBoxes = [
    {
      label: 'Equity Value',
      value: formatValue(metrics.equityValue, '$', 'B'),
    },
    {
      label: 'Market Cap',
      value: formatValue(metrics.marketCap, '$', 'B'),
    },
    {
      label: 'ROIC',
      value: formatValue(metrics.roic, '', '%'),
    },
    {
      label: 'Earnings Yield',
      value: formatValue(metrics.earningsYield, '', '%'),
    },
    {
      label: 'Margin of Safety',
      value: formatValue(metrics.marginOfSafety, '', '%'),
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-[#E0E6E4] mb-4">Valuation Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metricBoxes.map((box, index) => (
          <div
            key={index}
            className="bg-[#1a1f1e] dark:bg-[#1a1f1e] rounded-lg p-4 border border-[#2a2f2e] dark:border-[#2a2f2e]"
          >
            <div className="text-sm font-medium text-gray-400 dark:text-gray-400 mb-2">
              {box.label}
            </div>
            <div className="text-2xl font-bold text-white dark:text-white">
              {box.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValuationMetricsBoxes;
