import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { loadMultiplesDataForTickers, getNumericValue, MultiplesData } from '../utils/multiplesDataLoader';
import baseUrl from './api';

interface ReportChartProps {
  description: string;
  ticker: string;
}

const ReportChart: React.FC<ReportChartProps> = ({ description, ticker }) => {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Determine peers dynamically
        let peers = [ticker];
        
        // Fetch peers from the same industry
        try {
            const companyRes = await fetch(`${baseUrl}/api/sec/central/companies?ticker=${ticker}`);
            if (companyRes.ok) {
                const companies = await companyRes.json();
                const myCompany = (companies.results || companies).find((c: any) => c.ticker === ticker);
                
                if (myCompany && myCompany.industry) {
                    const industry = myCompany.industry;
                    const indRes = await fetch(`${baseUrl}/api/sec/central/industries`);
                    if (indRes.ok) {
                        const indData = await indRes.json();
                        const myIndustryData = (indData.industries || []).find((i: any) => i.name === industry);
                        
                        if (myIndustryData && myIndustryData.companies) {
                            const otherPeers = myIndustryData.companies
                                .filter((t: string) => t !== ticker)
                                .slice(0, 7);
                            peers = [ticker, ...otherPeers];
                        }
                    }
                }
            }
        } catch (peerErr) {
            console.warn("Failed to fetch dynamic peers, falling back to single company", peerErr);
        }

        // 2. Fetch data for these peers
        const multiplesData = await loadMultiplesDataForTickers(peers);
        const lowerDesc = description.toLowerCase();

        // 3. Helper to build chart data based on a value extractor function
        const buildChartData = (extractor: (data: MultiplesData) => number | null, scale = 1) => {
            return peers.map(peer => {
                const companyData = multiplesData[peer];
                if (!companyData) return null;
                const val = extractor(companyData);
                if (val === null) return null;
                return {
                    name: peer,
                    value: Number((val / scale).toFixed(1))
                };
            }).filter((item): item is { name: string; value: number } => item !== null);
        };

        let chartData: { name: string; value: number }[] = [];

        // --- Metric Mapping Logic ---

        // ROIC (Return on Invested Capital)
        if (lowerDesc.includes('roic') || lowerDesc.includes('return on invested capital')) {
            chartData = buildChartData(d => getNumericValue(d.roicMetrics?.['5Y']?.excludingGoodwill));
        }
        
        // Revenue Growth
        else if (lowerDesc.includes('revenue growth')) {
            chartData = buildChartData(d => getNumericValue(d.revenueGrowth?.['5Y']));
        }

        // Earnings Yield
        else if (lowerDesc.includes('earnings yield')) {
            chartData = buildChartData(d => {
                const mc = getNumericValue(d.numerators.marketCap_Fundamental);
                const ni = getNumericValue(d.denominators?.['1Y']?.netIncome);
                return (mc && ni) ? (ni / mc) * 100 : null;
            });
        }

        // Revenue (Absolute)
        else if (lowerDesc.includes('revenue')) {
            chartData = buildChartData(d => getNumericValue(d.denominators?.['1Y']?.revenue), 1_000_000_000); // Billions
        }

        // Net Income (Absolute)
        else if (lowerDesc.includes('net income')) {
            chartData = buildChartData(d => getNumericValue(d.denominators?.['1Y']?.netIncome), 1_000_000_000); // Billions
        }

        // Operating Income
        else if (lowerDesc.includes('operating income')) {
            chartData = buildChartData(d => getNumericValue(d.denominators?.['1Y']?.operatingIncome), 1_000_000_000); // Billions
        }

        // Gross Margin
        else if (lowerDesc.includes('gross margin')) {
            // Gross margin is often a ratio (0.25) or percentage (25). Assuming ratio in data, * 100 for %
            chartData = buildChartData(d => {
                const val = getNumericValue(d.denominators?.['1Y']?.grossMargin);
                return val !== null ? val * 100 : null; 
            });
        }

        // EBITDA
        else if (lowerDesc.includes('ebitda')) {
            chartData = buildChartData(d => getNumericValue(d.denominators?.['1Y']?.ebitdaAdjusted), 1_000_000_000); // Billions
        }

        // EBITA
        else if (lowerDesc.includes('ebita')) {
            chartData = buildChartData(d => getNumericValue(d.denominators?.['1Y']?.ebitaAdjusted), 1_000_000_000); // Billions
        }

        // Pretax Income
        else if (lowerDesc.includes('pretax') || lowerDesc.includes('pre-tax')) {
            chartData = buildChartData(d => getNumericValue(d.denominators?.['1Y']?.pretaxIncome), 1_000_000_000); // Billions
        }

        // Market Cap
        else if (lowerDesc.includes('market cap') || lowerDesc.includes('market capitalization')) {
            chartData = buildChartData(d => getNumericValue(d.numerators.marketCap_Fundamental), 1_000_000_000); // Billions
        }

        // Enterprise Value
        else if (lowerDesc.includes('enterprise value') || lowerDesc.includes('ev ')) {
            chartData = buildChartData(d => getNumericValue(d.numerators.enterpriseValue_Fundamental), 1_000_000_000); // Billions
        }

        else {
            setError("Chart type not supported yet");
        }

        setData(chartData);

      } catch (err) {
        console.error("Error fetching chart data", err);
        setError("Failed to load chart data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [description, ticker]);

  if (isLoading) {
    return (
      <div className="my-6 p-8 bg-gray-50 dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded flex justify-center items-center">
        <div className="text-gray-500 dark:text-[#889691]">Loading chart data...</div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="my-6 p-4 bg-gray-50 dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded text-center text-gray-500 dark:text-[#889691] italic">
        {error || `Unable to generate chart for: ${description}`}
      </div>
    );
  }

  // Determine unit suffix based on description and scale
  let unitSuffix = '%';
  const lowerDesc = description.toLowerCase();
  if (
      lowerDesc.includes('revenue') && !lowerDesc.includes('growth') || 
      lowerDesc.includes('income') || 
      lowerDesc.includes('ebitda') || 
      lowerDesc.includes('ebita') || 
      lowerDesc.includes('market cap') || 
      lowerDesc.includes('enterprise value')
  ) {
    unitSuffix = 'B';
  }

  return (
    <div className="my-6 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-[#E0E6E4] mb-4 text-center">{description}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              tickFormatter={(value) => `${value}${unitSuffix}`}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '4px', 
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`${value}${unitSuffix}`, description.split(' (')[0]]}
            />
            <Bar 
              dataKey="value" 
              fill="#1B5A7D" 
              radius={[4, 4, 0, 0]} 
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReportChart;
