import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import baseUrl from './api';

interface ValueBuildupChartProps {
  className?: string;
  initialCompany?: string; // Ticker from parent component (e.g., "WMT" or "WMT: Walmart Inc.")
}

const ValueBuildupChart: React.FC<ValueBuildupChartProps> = ({ className = "", initialCompany }) => {
  const [equityValue, setEquityValue] = useState<number | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [intrinsicToMc, setIntrinsicToMc] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract ticker from initialCompany prop (format: "TICKER" or "TICKER: Company Name")
  const ticker = initialCompany ? initialCompany.split(':')[0].trim().toUpperCase() : null;

  // Fetch EquityValue, Market Cap, and Intrinsic to MC from API
  useEffect(() => {
    if (!ticker) {
      setEquityValue(null);
      setMarketCap(null);
      setIntrinsicToMc(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([
      fetch(`${baseUrl}/api/sec/special_metrics/intrinsic_value/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: ticker }),
      }),
      fetch(`${baseUrl}/api/sec/special_metrics/market_cap/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: ticker }),
      }),
      fetch(`${baseUrl}/api/sec/special_metrics/intrinsic_to_mc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: ticker }),
      })
    ])
      .then(async ([intrinsicResponse, marketCapResponse, intrinsicToMcResponse]) => {
        // Handle Intrinsic Value response (same as equity value)
        let equityVal = null;
        if (intrinsicResponse.ok) {
          const intrinsicData = await intrinsicResponse.json();
          if (intrinsicData && intrinsicData.intrinsic_value !== undefined && intrinsicData.intrinsic_value !== null) {
            // Convert from raw value to billions for display
            const valueInBillions = Number(intrinsicData.intrinsic_value) / 1000000000;
            if (!isNaN(valueInBillions) && isFinite(valueInBillions) && valueInBillions > 0) {
              equityVal = valueInBillions;
            }
          }
        } else if (intrinsicResponse.status === 404) {
          // Handle 404 error response
          try {
            const errorData = await intrinsicResponse.json();
            if (errorData?.detail?.message) {
              console.warn(`[ValueBuildupChart] ${errorData.detail.message}`, errorData.detail.reasons || {});
            }
          } catch (e) {
            console.warn(`[ValueBuildupChart] No intrinsic value data available for ${ticker} (404)`);
          }
        }

        // Handle Market Cap response
        let marketCapVal = null;
        if (marketCapResponse.ok) {
          const marketCapData = await marketCapResponse.json();
          if (marketCapData && marketCapData.market_cap !== undefined && marketCapData.market_cap !== null) {
            // Convert from raw value to billions for display
            const valueInBillions = Number(marketCapData.market_cap) / 1000000000;
            if (!isNaN(valueInBillions) && isFinite(valueInBillions)) {
              marketCapVal = valueInBillions;
            }
          }
        }

        // Handle Intrinsic to MC response
        let intrinsicToMcVal = null;
        if (intrinsicToMcResponse.ok) {
          const intrinsicToMcData = await intrinsicToMcResponse.json();
          if (intrinsicToMcData && intrinsicToMcData.intrinsic_to_mc !== undefined && intrinsicToMcData.intrinsic_to_mc !== null) {
            const val = Number(intrinsicToMcData.intrinsic_to_mc);
            if (!isNaN(val) && isFinite(val)) {
              intrinsicToMcVal = val;
            }
          }
        } else if (intrinsicToMcResponse.status === 404) {
          // Handle 404 error response format per API docs: { "detail": { "message": "...", "reasons": {...} } }
          try {
            const errorData = await intrinsicToMcResponse.json();
            if (errorData?.detail?.message) {
              console.warn(`[Intrinsic to MC] ${errorData.detail.message}`, errorData.detail.reasons || {});
            }
          } catch (e) {
            console.warn(`[Intrinsic to MC] No data available for ${ticker} (404)`);
          }
          // Fallback: will calculate ratio from equityValue/marketCap if available
        }

        setEquityValue(equityVal);
        setMarketCap(marketCapVal);
        setIntrinsicToMc(intrinsicToMcVal);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching valuation data:', err);
        setError(err.message);
        setIsLoading(false);
        // Keep default values on error
        setEquityValue(null);
        setMarketCap(null);
        setIntrinsicToMc(null);
      });
  }, [ticker]);

  // Chart data with real EquityValue or default
  const intrinsicValue = equityValue !== null ? equityValue : 0;
  const marketCapValue = marketCap !== null ? marketCap : 0;

  // Calculate or use fetched Intrinsic to MC ratio
  // If we have direct API data, use it. Otherwise, calculate on frontend if possible.
  let ratio = 0;
  if (intrinsicToMc !== null) {
    ratio = intrinsicToMc;
  } else if (intrinsicValue !== 0 && marketCapValue !== 0) {
    ratio = intrinsicValue / marketCapValue;
  }

  // Only render chart if at least one value is non-zero (or both loaded)
  // If no company selected (ticker is null), we return null early above, but double check data here.
  const hasData = intrinsicValue !== 0 || marketCapValue !== 0;

  if (!ticker) {
    return null;
  }

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

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="mb-4">
        <div className="text-sm text-gray-600 dark:text-[#889691]">
          Financial valuation components breakdown
        </div>
      </div>

      {isLoading && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-sm text-gray-500 dark:text-[#889691]">Loading valuation data...</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-sm text-red-500 dark:text-red-400">Error loading data: {error}</div>
        </div>
      )}

      {!isLoading && !error && hasData && (
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
                  backgroundColor: 'var(--tooltip-bg, white)',
                  color: 'var(--tooltip-text, #111827)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
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
              <div className="w-8 h-px bg-gray-400 dark:bg-gray-500"></div>
              <div className="w-px h-4 bg-gray-400 dark:bg-gray-500"></div>
              <div className="w-8 h-px bg-gray-400 dark:bg-gray-500"></div>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-[#E0E6E4]">{ratio.toFixed(2)}x</span>
          </div>
        </div>
      )}

      {!isLoading && !error && !hasData && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-sm text-gray-500 dark:text-[#889691]">No data available for this company</div>
        </div>
      )}

    </div>
  );
};

export default ValueBuildupChart;
