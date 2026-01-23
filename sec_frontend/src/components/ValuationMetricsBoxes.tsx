import React, { useState, useEffect } from 'react';
import baseUrl from './api';

interface ValuationMetricsBoxesProps {
  ticker: string;
}

interface MetricsData {
  equityValue: number | null;
  marketCap: number | null;
  roic: number | null;
  earningsYield: number | null;
  marginOfSafety: number | null;
}

const ValuationMetricsBoxes: React.FC<ValuationMetricsBoxesProps> = ({ ticker }) => {
  const [metrics, setMetrics] = useState<MetricsData>({
    equityValue: null,
    marketCap: null,
    roic: null,
    earningsYield: null,
    marginOfSafety: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch equity value and market cap when ticker changes
  useEffect(() => {
    if (!ticker) {
      setMetrics({
        equityValue: null,
        marketCap: null,
        roic: null,
        earningsYield: null,
        marginOfSafety: null,
      });
      return;
    }

    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all metrics in parallel
        const [equityResponse, marketCapResponse, roicResponse, earningsYieldResponse, marginOfSafetyResponse] = await Promise.all([
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
          fetch(`${baseUrl}/api/sec/special_metrics/roic/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticker: ticker }),
          }),
          fetch(`${baseUrl}/api/sec/special_metrics/earnings_yield/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticker: ticker }),
          }),
          fetch(`${baseUrl}/api/sec/special_metrics/margin_of_safety/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticker: ticker }),
          }),
        ]);

        let equityValue = null;
        let marketCap = null;
        let roic = null;
        let earningsYield = null;
        let marginOfSafety = null;

        // Parse equity value
        if (equityResponse.ok) {
          const equityData = await equityResponse.json();
          if (equityData?.intrinsic_value !== undefined && equityData?.intrinsic_value !== null) {
            // Convert from raw value to billions
            const valueInBillions = Number(equityData.intrinsic_value) / 1000000000;
            if (!isNaN(valueInBillions) && isFinite(valueInBillions) && valueInBillions > 0) {
              equityValue = valueInBillions;
            }
          }
        }

        // Parse market cap
        if (marketCapResponse.ok) {
          const marketCapData = await marketCapResponse.json();
          if (marketCapData?.market_cap !== undefined && marketCapData?.market_cap !== null) {
            // Convert from raw value to billions
            const valueInBillions = Number(marketCapData.market_cap) / 1000000000;
            if (!isNaN(valueInBillions) && isFinite(valueInBillions) && valueInBillions > 0) {
              marketCap = valueInBillions;
            }
          }
        }

        // Parse ROIC
        if (roicResponse.ok) {
          const roicData = await roicResponse.json();
          if (roicData?.roic !== undefined && roicData?.roic !== null) {
            // ROIC is typically a percentage value
            const roicValue = Number(roicData.roic);
            if (!isNaN(roicValue) && isFinite(roicValue)) {
              roic = roicValue;
            }
          }
        }

        // Parse Earnings Yield
        if (earningsYieldResponse.ok) {
          const earningsYieldData = await earningsYieldResponse.json();
          if (earningsYieldData?.earnings_yield !== undefined && earningsYieldData?.earnings_yield !== null) {
            // Earnings yield is typically a percentage value
            const earningsYieldValue = Number(earningsYieldData.earnings_yield);
            if (!isNaN(earningsYieldValue) && isFinite(earningsYieldValue)) {
              earningsYield = earningsYieldValue;
            }
          }
        }

        // Parse Margin of Safety
        if (marginOfSafetyResponse.ok) {
          const marginOfSafetyData = await marginOfSafetyResponse.json();
          if (marginOfSafetyData?.margin_of_safety !== undefined && marginOfSafetyData?.margin_of_safety !== null) {
            // Margin of safety is typically a percentage value
            const marginOfSafetyValue = Number(marginOfSafetyData.margin_of_safety);
            if (!isNaN(marginOfSafetyValue) && isFinite(marginOfSafetyValue)) {
              marginOfSafety = marginOfSafetyValue;
            }
          }
        }

        setMetrics({
          equityValue,
          marketCap,
          roic,
          earningsYield,
          marginOfSafety,
        });
      } catch (err) {
        console.error('Error fetching valuation metrics:', err);
        setError('Failed to load valuation data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [ticker]);

  const formatValue = (value: number | null, prefix: string = '', suffix: string = '', decimals: number = 1) => {
    if (value === null) return 'N/A';
    return `${prefix}${value.toFixed(decimals)}${suffix}`;
  };

  const metricBoxes = [
    {
      label: 'Equity Value',
      value: formatValue(metrics.equityValue, '$', 'B'),
      isLoading: isLoading && metrics.equityValue === null,
    },
    {
      label: 'Market Cap',
      value: formatValue(metrics.marketCap, '$', 'B'),
      isLoading: isLoading && metrics.marketCap === null,
    },
    {
      label: 'ROIC',
      value: formatValue(metrics.roic, '', '%'),
      isLoading: isLoading && metrics.roic === null,
    },
    {
      label: 'Earnings Yield',
      value: formatValue(metrics.earningsYield, '', '%'),
      isLoading: isLoading && metrics.earningsYield === null,
    },
    {
      label: 'Margin of Safety',
      value: formatValue(metrics.marginOfSafety, '', '%'),
      isLoading: isLoading && metrics.marginOfSafety === null,
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-[#E0E6E4] mb-4">Valuation Summary</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
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
              {box.isLoading ? (
                <span className="text-gray-500 dark:text-gray-500">Loading...</span>
              ) : (
                box.value
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValuationMetricsBoxes;
