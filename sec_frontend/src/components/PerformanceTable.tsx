import React, { useState, useEffect } from 'react';
import baseUrl from './api';

interface PerformanceTableProps {
  ticker: string;
}

interface PerformanceData {
  status: string;
  key: string;
  ticker: string;
  columns: string[];
  rows: Array<{
    metric: string;
    [year: string]: string | number;
  }>;
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({ ticker }) => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setData(null);
      return;
    }

    const fetchPerformanceData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract ticker from format like "WMT" or "WMT: Walmart Inc."
        const tickerOnly = ticker.split(':')[0].trim().toUpperCase();
        
        const response = await fetch(`${baseUrl}/api/sec/dynamic_table/Performance?ticker=${tickerOnly}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch performance data: ${response.status}`);
        }

        const responseData = await response.json();
        setData(responseData);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, [ticker]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-[#889691]">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-[#889691]">No performance data available</div>
      </div>
    );
  }

  // Get year columns (exclude 'metric' column)
  const yearColumns = data.columns.filter(col => col !== 'metric');
  
  // Format value for display
  const formatValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);
    
    // If it's a percentage (between 0 and 1), show as percentage
    if (numValue > 0 && numValue < 1) {
      return `${(numValue * 100).toFixed(2)}%`;
    }
    // If it's a percentage already (like 15.5), show as percentage
    if (numValue > 1 && numValue < 100) {
      return `${numValue.toFixed(2)}%`;
    }
    // For larger numbers, format with commas
    return numValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-[#E0E6E4] mb-2">
          Annual Performance Metrics - {data.ticker}
        </h3>
        <p className="text-sm text-gray-600 dark:text-[#889691]">
          {data.rows.length} metrics from {yearColumns[0]} to {yearColumns[yearColumns.length - 1]}
        </p>
      </div>
      
      <div className="overflow-x-auto border border-gray-200 dark:border-[#161C1A] rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#161C1A]">
          <thead className="bg-gray-50 dark:bg-[#1C2220] sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#889691] uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-[#1C2220] z-10 border-r border-gray-200 dark:border-[#161C1A]">
                Metric
              </th>
              {yearColumns.map((year) => (
                <th
                  key={year}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#889691] uppercase tracking-wider min-w-[80px]"
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#0B0F0E] divide-y divide-gray-200 dark:divide-[#161C1A]">
            {data.rows.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 dark:hover:bg-[#161C1A] transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-[#E0E6E4] sticky left-0 bg-white dark:bg-[#0B0F0E] z-10 border-r border-gray-200 dark:border-[#161C1A]">
                  {row.metric}
                </td>
                {yearColumns.map((year) => (
                  <td
                    key={year}
                    className="px-3 py-3 text-sm text-center text-gray-700 dark:text-[#E0E6E4] whitespace-nowrap"
                  >
                    {formatValue(row[year])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceTable;
