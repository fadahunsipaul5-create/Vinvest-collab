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
  onRowClick?: (ticker: string) => void;
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

// Circular Progress Component for V-Rating (matches TopPicks: color + value-based tooltip)
const CircularProgress: React.FC<{ value: number; size?: number; showTooltip?: boolean }> = ({ value, size = 60, showTooltip = true }) => {
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);
  const radius = (size - 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (normalizedValue / 100) * circumference;

  // Color based on value: green (>=80), yellow (50-79), red (<50) - same as TopPicks V-Rating
  const getColor = () => {
    if (normalizedValue >= 80) return '#22c55e'; // green-500
    if (normalizedValue >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  // V-Rating tooltip text by value range (same as TopPicks)
  const getTooltipText = () => {
    if (normalizedValue >= 80) {
      return 'A "Rationalist Strike." The company has passed all Gatekeepers and offers elite quality at a fair price.';
    }
    if (normalizedValue >= 50) {
      return 'A "Quality Compounder" or a "Fair Value" play. Safe, but perhaps overvalued or lacking momentum.';
    }
    return 'A structural failure in one or more pillars. High risk of capital destruction.';
  };

  const color = getColor();
  const tooltipText = showTooltip ? getTooltipText() : '';

  return (
    <div
      className="relative inline-flex items-center justify-center cursor-help"
      style={{ width: size, height: size }}
      onMouseEnter={() => showTooltip && setShowRatingTooltip(true)}
      onMouseLeave={() => setShowRatingTooltip(false)}
    >
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
          strokeWidth="3"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Value text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-gray-900 dark:text-white">
          {Math.round(normalizedValue)}
        </span>
      </div>
      {showRatingTooltip && tooltipText && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 max-w-[11rem] w-48 p-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-50 whitespace-normal break-words pointer-events-none">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

const SideMenu: React.FC<SideMenuProps> = ({ onRowClick }) => {
  const [rankings, setRankings] = useState<RankedCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  // Pagination state - cumulative loading
  const [itemsToShow, setItemsToShow] = useState<number>(10);

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
            <div className="p-2 pb-1.5 flex-shrink-0">
              <h2 className="text-xs font-semibold bg-[#144D37] text-white inline-block px-2 py-0.5 rounded-full text-center w-full">
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
                                            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-[#1C2220]">
                                                Ticker
                                            </th>
                                            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-[#1C2220] relative">
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
                                        {rankings.slice(0, itemsToShow).map((company) => (
                                            <tr 
                                              key={company.ticker} 
                                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                              onClick={() => onRowClick?.(company.ticker)}
                                            >
                                                <td className="py-2 px-2 text-center">
                                                    <div className="text-[10px] font-semibold text-gray-900 dark:text-white">
                                                        ${company.ticker}$
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <CircularProgress value={company.vRating} size={35} />
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
                    
                    {/* Pagination Controls - Range + arrow icons */}
                    {(() => {
                      const hasMoreItems = rankings.length > itemsToShow;
                      const hasPreviousItems = itemsToShow > 10;
                      const displayedCount = Math.min(itemsToShow, rankings.length);
                      
                      return rankings.length > 0 && (hasPreviousItems || hasMoreItems) && (
                        <div className="p-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-center gap-2">
                          <span className="text-[10px] text-gray-500 dark:text-[#889691]">
                            1-{displayedCount} of {rankings.length.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => setItemsToShow(prev => Math.max(10, prev - 10))}
                              disabled={!hasPreviousItems}
                              aria-label="Load previous 10"
                              className={`p-1.5 rounded transition-colors ${
                                hasPreviousItems
                                  ? 'text-gray-600 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#2A332F]'
                                  : 'text-gray-300 dark:text-[#2A3230] cursor-not-allowed'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setItemsToShow(prev => prev + 10)}
                              disabled={!hasMoreItems}
                              aria-label="Load next 10"
                              className={`p-1.5 rounded transition-colors ${
                                hasMoreItems
                                  ? 'text-gray-600 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#2A332F]'
                                  : 'text-gray-300 dark:text-[#2A3230] cursor-not-allowed'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
