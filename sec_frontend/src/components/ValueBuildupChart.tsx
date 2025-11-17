import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import baseUrl from './api';

interface ValueBuildupChartProps {
  className?: string;
  initialCompany?: string; // Ticker from parent component (e.g., "WMT" or "WMT: Walmart Inc.")
}

const ValueBuildupChart: React.FC<ValueBuildupChartProps> = ({ className = "", initialCompany }) => {
  const [equityValue, setEquityValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract ticker from initialCompany prop (format: "TICKER" or "TICKER: Company Name")
  const ticker = initialCompany ? initialCompany.split(':')[0].trim().toUpperCase() : null;

  // Fetch EquityValue from API
  useEffect(() => {
    if (!ticker) {
      setEquityValue(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`${baseUrl}/api/sec/valuation-summary/${ticker}/`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch valuation summary: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Backend handles infinity by returning 1000B and isInfinity flag
        const value = data.equityValueInBillions;
        if (data.isInfinity || value === null || value === undefined || isNaN(value)) {
          // For infinity or invalid values, use a very large number for display (e.g., 1000B)
          setEquityValue(1000);
        } else {
          setEquityValue(Number(value));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching EquityValue:', err);
        setError(err.message);
        setIsLoading(false);
        // Keep default value on error
        setEquityValue(null);
      });
  }, [ticker]);

  // Chart data with real EquityValue or default
  const intrinsicValue = equityValue !== null ? equityValue : 10; // Default to 10 if not loaded
  const marketCapValue = 20; // Keep Market Cap as is for now

  const chartData = [
    { 
      name: 'Intrinsic',
      value: intrinsicValue,
      fill: '#1B5A7D'
    },
    { 
      name: 'Market cap',
      value: marketCapValue,
      fill: '#4A90E2'
    }
  ];

  // Format value for display (handle infinity and negative values)
  const formatValue = (value: number): string => {
    if (value === Infinity || value === -Infinity) {
      return '∞';
    }
    if (value < 0) {
      return `-$${Math.abs(value).toFixed(1)}B`;
    }
    return `$${value.toFixed(1)}B`;
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Value Build-up</h3>
        <div className="text-sm text-gray-600">
          Financial valuation components breakdown
        </div>
      </div>
      
      {isLoading && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading valuation data...</div>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-sm text-red-500">Error loading data: {error}</div>
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 40,
                right: 30,
                left: 20,
                bottom: 20,
              }}
              barCategoryGap="20%"
              barSize={60}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}B`}
              />
              <Tooltip 
                formatter={(value: number) => {
                  if (value === Infinity || value === -Infinity) {
                    return ['∞', 'Value'];
                  }
                  return [`$${value.toFixed(2)}B`, 'Value'];
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* 0.5x annotation */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-8 h-px bg-gray-400"></div>
              <div className="w-px h-4 bg-gray-400"></div>
              <div className="w-8 h-px bg-gray-400"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">0.5x</span>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ValueBuildupChart;
