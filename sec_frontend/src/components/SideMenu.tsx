import React, { useState, useEffect } from 'react';
import baseUrl from './api';

interface SideMenuProps {
  onOpenValuation: () => void;
  onOpenContact: () => void;
  onOpenInsights: () => void;
  onOpenAIOT: () => void;
  onOpenOperations: () => void;
  onOpenApproach: () => void;
  onOpenValueServices: () => void;
  onOpenWhyUs: () => void;
}

interface RankingResult {
  overall_rank: number;
  ticker: string;
  roic_5y_avg: number;
  roic_rank: number;
  earnings_yield: number;
  earnings_yield_rank: number;
  intrinsic_to_mc: number;
  intrinsic_to_mc_rank: number;
  overall_score: number;
}

interface RankedCompany {
  ticker: string;
  vRating: number; // V-Rating score (0-100)
}

// Circular Progress Component for V-Rating
const CircularProgress: React.FC<{ value: number; size?: number }> = ({ value, size = 60 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (normalizedValue / 100) * circumference;
  
  // Color based on value: green for high (>=70), yellow for medium (40-69), red for low (<40)
  const getColor = () => {
    if (normalizedValue >= 70) return '#22c55e'; // green-500
    if (normalizedValue >= 40) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const color = getColor();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Value text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {Math.round(normalizedValue)}
        </span>
      </div>
    </div>
  );
};

const SideMenu: React.FC<SideMenuProps> = (_props) => {
  const [rankings, setRankings] = useState<RankedCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/api/sec/special_metrics/investment_factor_ranking_table_for_all_companies/`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const rawRankings: RankingResult[] = data.Ranking || data.ranking || [];

        // Debug: Log first item to see structure
        console.log("First ranking item:", rawRankings[0]);

        // Sort by overall rank
        const sorted = rawRankings.sort((a, b) => (a.overall_rank || Infinity) - (b.overall_rank || Infinity));

        // Map to display format - using overall_score as V-Rating (scale to 0-100 if needed)
        const displayRankings: RankedCompany[] = sorted.map(r => ({
          ticker: r.ticker,
          vRating: r.overall_score != null ? Math.min(Math.max(r.overall_score * 100, 0), 100) : 0
        }));

        setRankings(displayRankings);
      } catch (err) {
        console.error("Failed to fetch side menu rankings:", err);
        setError("Failed to load rankings");
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <div className="hidden lg:flex lg:col-span-2 flex-col h-full max-h-[100vh] w-full min-w-0">
      <div className="bg-white dark:bg-[#161C1A] rounded-lg p-0 shadow-sm h-full w-full min-w-0 flex flex-col overflow-hidden text-gray-900 dark:text-white border dark:border-[#161C1A]">
        <div className="h-full w-full min-w-0 flex flex-col">
            <div className="p-3 pb-2 flex-shrink-0">
              <h2 className="text-sm font-semibold bg-[#144D37] text-white inline-block px-3 py-1 rounded-full text-center w-full">
                VInvest Rating
              </h2>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                 {/* Rankings List */}
                 <div className="flex-1 flex flex-col min-h-0">
                    {/* <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase text-xs flex-shrink-0">Top Rated</div> */}
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        {loading ? (
                             <div className="text-gray-500 text-xs p-4">Loading rankings...</div>
                        ) : error ? (
                             <div className="text-red-400 text-xs p-4">Error loading rankings</div>
                        ) : rankings.length > 0 ? (
                            <div className="overflow-x-auto w-full">
                                <table className="min-w-full w-full border-collapse">
                                    <thead className="sticky top-0 bg-white dark:bg-[#161C1A] z-10">
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-[#1C2220]">
                                                Ticker
                                            </th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-[#1C2220] relative">
                                                <div className="flex items-center justify-center gap-1">
                                                  <span>V-Rating</span>
                                                  <div 
                                                    className="relative"
                                                    onMouseEnter={() => setShowTooltip(true)}
                                                    onMouseLeave={() => setShowTooltip(false)}
                                                  >
                                                    <svg 
                                                      className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-help" 
                                                      fill="currentColor" 
                                                      viewBox="0 0 20 20"
                                                    >
                                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                    </svg>
                                                    {showTooltip && (
                                                      <div className="absolute right-0 top-6 w-48 p-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-20">
                                                        V-Rating combines valuation, capital allocation, and stability metrics
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {rankings.map((company) => (
                                            <tr key={company.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-3 px-4 text-center">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        ${company.ticker}$
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <CircularProgress value={company.vRating} size={60} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-gray-500 text-xs p-4">No rankings available</div>
                        )}
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
