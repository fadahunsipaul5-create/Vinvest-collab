import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import baseUrl from './api';

interface CompanyTicker {
  ticker: string;
  name: string;
}

interface Industry {
  industryId: string;
  industryName: string;
}

interface Sector {
  sectorId: string;
  sectorName: string;
}

interface TopPicksProps {
  companies: CompanyTicker[]; // Still kept for other uses if needed, but TopPicks will fetch its own now
  industries: any[]; // Kept for prop compatibility but we'll fetch our own
  sectors: string[]; // Kept for prop compatibility
  onTickerClick?: (ticker: string) => void; // Callback when ticker is clicked
  selectedTicker?: string; // Ticker selected from the top search input
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

interface TopPickData {
  ticker: string;
  name: string;
  industry: string;
  sector: string;
  
  // Raw values
  roic5YAvg: number;          // Percentage (e.g. 15.5 for 15.5%)
  netIncome5YAvg: number;     // In Billions
  sharesOutstanding: number;  // In Billions
  stockPrice: number;         // In Dollars
  intrinsicValue: number;     // In Billions
  marketCap: number;          // In Billions
  
  // Calculated values
  earningsYield: number;      // Percentage
  intrinsicToMarketCap: number; // Ratio
  
  // Ranks
  ranks: {
    roic: number;
    earnings: number;
    intrinsic: number;
    overall: number;
  };
}

// Elite Ticker Analysis interfaces
interface EliteTickerData {
  ticker: string;
  vEliteStatus: {
    type: 'elite' | 'gatekeeper' | 'fail';
    value: number | string; // For elite: rank number, for gatekeeper: "GATEKEEPER", for fail: "FAIL"
  };
  vRating: number;      // 0-100
  vQuality: number;     // 0-100
  vValue: number;       // 0-100
  vSafety: number;      // 0-100
  vMomentum: number;    // 0-100
}

// Circular Progress Component for V-Rating metrics with Tooltip
const CircularProgress: React.FC<{ value: number; size?: number; showTooltip?: boolean; metricType?: 'rating' | 'quality' | 'value' | 'safety' | 'momentum' }> = ({ value, size = 44, showTooltip = false, metricType = 'rating' }) => {
  const [showRatingTooltip, setShowRatingTooltip] = React.useState(false);
  const strokeWidth = size <= 48 ? 3 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (normalizedValue / 100) * circumference;
  
  // Color based on value: green for high (>=80), yellow for medium (50-79), red for low (<50)
  const getColor = () => {
    if (normalizedValue >= 80) return '#22c55e'; // green-500
    if (normalizedValue >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  // Get tooltip text based on metric type and value
  const getTooltipText = () => {
    if (metricType === 'quality') {
      // V-Quality tooltips: 90+, 50-89, <50
      if (normalizedValue >= 90) {
        return 'An "Unassailable Moat." High ROIC (e.g., 25%+) suggests the company generates immense value from its assets.';
      } else if (normalizedValue >= 50) {
        return 'A solid, productive business but faces moderate competition or cyclicality.';
      } else {
        return 'A "Commoditized" business. Low margins and poor return on invested capital.';
      }
    } else if (metricType === 'value') {
      // V-Value tooltips: 80+, 30-79, <30
      if (normalizedValue >= 80) {
        return 'A "Deep Logic Gap." You are buying $1 worth of assets/earnings for significantly less (e.g., a 30%+ discount).';
      } else if (normalizedValue >= 30) {
        return 'Fairly valued. You are paying what the business is actually worth.';
      } else {
        return 'A "Quality Premium." The market has bid the price up; you are overpaying for growth.';
      }
    } else if (metricType === 'safety') {
      // V-Safety tooltips: 90+, 50-89, <50
      if (normalizedValue >= 90) {
        return 'A "Financial Fortress." Virtually zero risk of bankruptcy; massive cash reserves.';
      } else if (normalizedValue >= 50) {
        return 'The "Grey Zone." Safe in normal markets, but could be stressed in a severe recession.';
      } else {
        return 'The "Distress Zone." High leverage and fragile cash flows.';
      }
    } else if (metricType === 'momentum') {
      // V-Momentum tooltips: 70+, 40-69, <40
      if (normalizedValue >= 70) {
        return '"Trend Confirmation." The market has begun to recognize the value; price is moving higher with volume.';
      } else if (normalizedValue >= 40) {
        return 'Sideways/Consolidation. The business is performing, but the stock is "resting."';
      } else {
        return 'Bearish trend or "Exhaustion." High RSI (>75) can also lower this score to warn of a "Top."';
      }
    } else {
      // V-Rating tooltips: 80+, 50-79, <50
      if (normalizedValue >= 80) {
        return 'A "Rationalist Strike." The company has passed all Gatekeepers and offers elite quality at a fair price.';
      } else if (normalizedValue >= 50) {
        return 'A "Quality Compounder" or a "Fair Value" play. Safe, but perhaps overvalued or lacking momentum.';
      } else {
        return 'A structural failure in one or more pillars. High risk of capital destruction.';
      }
    }
  };

  const color = getColor();
  const tooltipText = showTooltip ? getTooltipText() : '';

  return (
    <div 
      className="relative inline-flex items-center justify-center" 
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
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Value text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-semibold text-gray-900 dark:text-white ${size <= 48 ? 'text-[10px]' : 'text-sm'}`}>
          {Math.round(normalizedValue)}
        </span>
      </div>
      {showRatingTooltip && tooltipText && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 max-w-[11rem] w-48 p-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-50 whitespace-normal break-words">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

// V-Elite Status Badge Component (compact for Value Screener table)
const VEliteStatusBadge: React.FC<{ status: EliteTickerData['vEliteStatus'] }> = ({ status }) => {
  if (status.type === 'elite') {
    return (
      <div className="inline-flex items-center justify-center">
        <img 
          src="/gold.png" 
          alt="V-Elite Gold Badge" 
          className="w-10 h-[45px] sm:w-12 sm:h-[54px] object-contain drop-shadow-sm"
        />
      </div>
    );
  } else if (status.type === 'gatekeeper') {
    return (
      <div className="inline-flex items-center justify-center">
        <img 
          src="/silver.png" 
          alt="V-Elite Silver Badge" 
          className="w-10 h-[45px] sm:w-12 sm:h-[54px] object-contain drop-shadow-sm"
        />
      </div>
    );
  } else {
    // Fail status
    return (
      <div className="inline-flex items-center justify-center">
        <img 
          src="/red.png" 
          alt="GATEKEEPER FAIL Badge" 
          className="w-10 h-[45px] sm:w-12 sm:h-[54px] object-contain drop-shadow-sm"
        />
      </div>
    );
  }
};

// Custom Tooltip Component for V-Ratings Chart
const CustomVRatingsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isDark = document.documentElement.classList.contains('dark');
    
    return (
      <div className={`rounded-lg border shadow-lg p-3 ${
        isDark 
          ? 'bg-[#1C2220] border-[#2A3230] text-[#E0E6E4]' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <p className={`font-semibold mb-2 text-sm ${
          isDark ? 'text-[#E0E6E4]' : 'text-gray-900'
        }`}>
          {label === 'Today' ? 'Today' : new Date(label).toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: entry.color }}
              />
              <span className={isDark ? 'text-[#889691]' : 'text-gray-600'}>
                {entry.name}:
              </span>
              <span className={`font-semibold ${
                isDark ? 'text-[#E0E6E4]' : 'text-gray-900'
              }`}>
                {Math.round(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Info Tooltip Component
const InfoTooltip: React.FC<{ tooltipText: string; children?: React.ReactNode }> = ({ tooltipText, children }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <svg 
        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400 cursor-help ml-0.5" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      {showTooltip && (
        <div className="absolute right-0 top-6 w-64 p-3 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-20 whitespace-normal">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

const TopPicks: React.FC<TopPicksProps> = ({ onTickerClick, selectedTicker }) => {
  // Filter states
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  
  // Data from APIs
  const [fetchedSectors, setFetchedSectors] = useState<Sector[]>([]);
  const [fetchedIndustries, setFetchedIndustries] = useState<Industry[]>([]);
  const [fetchedCompanies, setFetchedCompanies] = useState<CompanyTicker[]>([]); // Companies for the table
  const [allCompanies, setAllCompanies] = useState<CompanyTicker[]>([]); // Store all companies to reset filtering
  
  // Search states for Industry, Sector, and Company filters
  const [industrySearch, setIndustrySearch] = useState<string>('');
  const [sectorSearch, setSectorSearch] = useState<string>('');
  const [companySearch, setCompanySearch] = useState<string>('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState<boolean>(false);
  const [showSectorDropdown, setShowSectorDropdown] = useState<boolean>(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState<boolean>(false);
  
  // AI Filter state for Scan tab
  const [aiFilter, setAiFilter] = useState<string>('');
  
  // Refs for dropdowns
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const sectorDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  
  const [picksData, setPicksData] = useState<TopPickData[]>([]);
  const [rankingStats, setRankingStats] = useState<{ sent: number; ranked: number; rejected: number } | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  
  // New state for mode selection
  const [activeMode, setActiveMode] = useState<'today' | 'historical'>('today');
  // New state for Historical Ranking
  const [rankingTypes, setRankingTypes] = useState<{id: string, label: string}[]>([]);
  const [selectedRankingType, setSelectedRankingType] = useState<string>('overall'); // Default to overall

  // Historical V-Ratings Chart Data State
  const [historicalVRatingsData, setHistoricalVRatingsData] = useState<any[]>([]);
  const [historicalVRatingsLoading, setHistoricalVRatingsLoading] = useState(false);
  const [historicalVRatingsError, setHistoricalVRatingsError] = useState<string | null>(null);

  // Pagination state - cumulative loading
  const [itemsToShow, setItemsToShow] = useState<number>(10);

  // Fetch Ranking Types on Mount
  useEffect(() => {
    fetch(`${baseUrl}/api/sec/central/rankings/types`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
          if (data && data.rankingTypes) {
            setRankingTypes(data.rankingTypes);
            // DO NOT set default here if state already has 'overall' as default
            // Just let the user's default state 'overall' work, or find it in list to confirm existence
          }
      })
      .catch(err => console.error("Failed to fetch ranking types:", err));
  }, []);

  // Fetch Historical V-Ratings Chart Data
  useEffect(() => {
    const tickerToFetch = selectedTicker || selectedCompany;
    if (activeMode === 'historical' && tickerToFetch) {
        setHistoricalVRatingsLoading(true);
        setHistoricalVRatingsError(null);
        
        // Fetch historical ranking data for all ranking types to calculate V-ratings
        const rankingTypesToFetch = ['overall', 'roic', 'earnings', 'intrinsic'];
    
    (async () => {
      try {
            // Fetch all ranking types in parallel
            const promises = rankingTypesToFetch.map(type => 
              fetch(`${baseUrl}/api/sec/central/rankings/historical?tickers=${encodeURIComponent(tickerToFetch)}&rankingType=${encodeURIComponent(type)}&period=ALL`)
                .then(res => {
                  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                  return res.json();
                })
            );
            
            const results = await Promise.all(promises);
            
            // Process the data to create V-rating chart data
            const processedData: { [date: string]: { date: string; vRating: number; vQuality: number; vValue: number; vSafety: number; vMomentum: number } } = {};
            
            // Process overall ranking for V-Rating
            if (results[0] && results[0].history) {
              results[0].history.forEach((item: any) => {
                const date = item.date;
                const overallRank = item[tickerToFetch];
                if (overallRank !== null && overallRank !== undefined) {
                  if (!processedData[date]) {
                    processedData[date] = {
                      date,
                      vRating: 0,
                      vQuality: 0,
                      vValue: 0,
                      vSafety: 0,
                      vMomentum: 0
                    };
                  }
                  // Convert rank to V-Rating (inverse, scaled to 0-100)
                  processedData[date].vRating = Math.max(0, Math.min(100, 100 - (overallRank - 1) * 2));
                  processedData[date].vSafety = Math.max(0, Math.min(100, 100 - overallRank * 0.5));
                }
              });
            }
            
            // Process ROIC ranking for V-Quality
            if (results[1] && results[1].history) {
              results[1].history.forEach((item: any) => {
                const date = item.date;
                const roicRank = item[tickerToFetch];
                if (roicRank !== null && roicRank !== undefined) {
                  if (!processedData[date]) {
                    processedData[date] = {
                      date,
                      vRating: 0,
                      vQuality: 0,
                      vValue: 0,
                      vSafety: 0,
                      vMomentum: 0
                    };
                  }
                  // Convert ROIC rank to V-Quality (simplified conversion)
                  processedData[date].vQuality = Math.max(0, Math.min(100, 100 - roicRank * 2));
                }
              });
            }
            
            // Process earnings ranking for V-Momentum
            if (results[2] && results[2].history) {
              results[2].history.forEach((item: any) => {
                const date = item.date;
                const earningsRank = item[tickerToFetch];
                if (earningsRank !== null && earningsRank !== undefined) {
                  if (!processedData[date]) {
                    processedData[date] = {
                      date,
                      vRating: 0,
                      vQuality: 0,
                      vValue: 0,
                      vSafety: 0,
                      vMomentum: 0
                    };
                  }
                  // Convert earnings rank to V-Momentum
                  processedData[date].vMomentum = Math.max(0, Math.min(100, 100 - earningsRank * 2));
                }
              });
            }
            
            // Process intrinsic ranking for V-Value
            if (results[3] && results[3].history) {
              results[3].history.forEach((item: any) => {
                const date = item.date;
                const intrinsicRank = item[tickerToFetch];
                if (intrinsicRank !== null && intrinsicRank !== undefined) {
                  if (!processedData[date]) {
                    processedData[date] = {
                      date,
                      vRating: 0,
                      vQuality: 0,
                      vValue: 0,
                      vSafety: 0,
                      vMomentum: 0
                    };
                  }
                  // Convert intrinsic rank to V-Value
                  processedData[date].vValue = Math.max(0, Math.min(100, 100 - intrinsicRank * 2));
                }
              });
            }
            
            // Convert to array and sort by date, filter from January 25th onwards, add "Today" label to the latest
            const startDate = new Date('2026-01-25'); // Start from January 25th, 2026
            startDate.setHours(0, 0, 0, 0); // Set to start of day
            
            const chartDataArray = Object.values(processedData)
              .filter(item => {
                const itemDate = new Date(item.date);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate >= startDate;
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((item, index, arr) => ({
                ...item,
                dateLabel: index === arr.length - 1 ? 'Today' : item.date
              }));
            
            setHistoricalVRatingsData(chartDataArray);
      } catch (err: any) {
            console.error("Failed to fetch historical V-ratings data:", err);
            setHistoricalVRatingsError(err?.message ? String(err.message) : 'Failed to fetch historical V-ratings data.');
            setHistoricalVRatingsData([]);
      } finally {
            setHistoricalVRatingsLoading(false);
      }
    })();
    } else {
        setHistoricalVRatingsData([]);
        setHistoricalVRatingsError(null);
    }
  }, [activeMode, selectedTicker, selectedCompany]);

  // Fetch Sectors on Mount
  useEffect(() => {
    fetch(`${baseUrl}/api/sec/graphdb/sectors`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setFetchedSectors(data);
      })
      .catch(err => console.error("Failed to fetch sectors:", err));
  }, []);

  // Fetch Industries when Sector changes
  useEffect(() => {
    if (!selectedSector) {
      // If no sector selected, fetch ALL industries from Central
      fetch(`${baseUrl}/api/sec/central/industries`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then(data => {
            const inds = (data.industries || []).map((i: any) => ({
                industryId: i.name,
                industryName: i.name,
                companies: i.companies
            }));
            setFetchedIndustries(inds);
        })
        .catch(err => console.error("Failed to fetch industries:", err));
      return;
    }

    // If Sector selected, fetch industries for that sector
    fetch(`${baseUrl}/api/sec/graphdb/industries_when_sector_given?sectorName=${encodeURIComponent(selectedSector)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
          // GraphDB API likely returns array of { industryId, industryName, ... }
          // We need to map it to our Industry interface
          // Note: GraphDB might NOT return 'companies' list in the industry object?
          // If not, our client-side filtering of companies (filteredCompanies) might break for those industries.
          // But let's assume for now we just want to populate the Industry dropdown.
          setFetchedIndustries(data);
      })
      .catch(err => console.error("Failed to fetch industries for sector:", err));
  }, [selectedSector]);

  // Ensure we always have a valid selection if data is available (API does not support "All")
  // Auto-select removed as per user request to not default to "Communication Services"
  /*
  useEffect(() => {
      if (!selectedSector && fetchedSectors.length > 0) {
          setSelectedSector(fetchedSectors[0].sectorName);
      }
  }, [fetchedSectors]);
  */

  // Fetch Companies (Centralized)
  useEffect(() => {
    // If industry is selected, we might still want to filter by it, but the source should be central
    // However, the central companies API returns ALL companies.
    // GraphDB API was filtering by industry.
    // Strategy: Fetch ALL companies once from central, then filter locally if industry is selected.
    
    // Check if we already have companies from props or if we need to fetch
    // If propCompanies is empty or we want to force central:

    fetch(`${baseUrl}/api/sec/central/companies`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
          // Map response to CompanyTicker format if needed
          // API returns [{ticker: "AAPL", name: "Apple Inc."}, ...]
          setFetchedCompanies(data);
          setAllCompanies(data);
          // Loading state removed(false);
      })
      .catch(err => {
          console.error("Failed to fetch companies:", err);
          // Loading state removed(false);
      });
  }, []); // Run once on mount

  /* 
  // OLD GraphDB Logic - Commented Out
  // Fetch Companies when Industry changes (or initially)
  useEffect(() => {
    if (!selectedIndustry) {
        setFetchedCompanies([]);
        // Loading state removed(false);
        return;
    }

    let url = `${baseUrl}/api/sec/graphdb/companies_when_industry_given`;
    // ...
  }, [selectedIndustry, fetchedIndustries]);
  */

  // Fetch Companies when Industry changes (handle GraphDB vs Central logic)
  useEffect(() => {
    if (!selectedIndustry) {
        // Reset to all companies if no industry selected
        if (allCompanies.length > 0) {
            setFetchedCompanies(allCompanies);
        }
        return;
    }

    const industryObj = fetchedIndustries.find(ind => ind.industryName === selectedIndustry);
    
    // If industry object exists but lacks 'companies' list (GraphDB source), fetch them
    if (industryObj && !(industryObj as any).companies) {
        // Loading state removed(true);
        fetch(`${baseUrl}/api/sec/graphdb/companies_when_industry_given?industryName=${encodeURIComponent(selectedIndustry)}`)
           .then(res => {
               if (!res.ok) throw new Error("Failed to fetch companies for industry");
               return res.json();
           })
           .then(data => {
               // GraphDB returns `companyName` (not `name`) - normalize to CompanyTicker for the UI
               const normalized: CompanyTicker[] = (data || []).map((c: any) => ({
                   ticker: c.ticker,
                   name: c.name ?? c.companyName ?? c.ticker
               }));
               setFetchedCompanies(normalized);
               // Loading state removed(false);
           })
           .catch(err => {
               console.error("Failed to fetch companies for industry:", err);
               setFetchedCompanies([]);
               // Loading state removed(false);
           });
    } else {
        // Central source (has companies list) or unknown
        // Reset fetchedCompanies to allCompanies so that 'filteredCompanies' logic can work
        if (allCompanies.length > 0) {
             setFetchedCompanies(allCompanies);
        }
    }
  }, [selectedIndustry, fetchedIndustries, allCompanies]);

  // Helper to format numbers (kept for potential future use)
  // const formatPercent = (val: number) => { ... };
  // const formatRatio = (val: number) => `${val.toFixed(2)}x`;
  
  // Fetch Ranking Data when Companies are loaded
  useEffect(() => {
    // Logic split based on Active Mode
    
    // 1. Historical Mode Logic - Handled by Chart useEffect now

    // 2. Today's Pick Logic (Existing Default Behavior)
    
    // Mode 1: Default / All Companies (No filters selected)
    // Only applies if in 'today' mode or if we want historical to behave similarly initially
    if (activeMode === 'today' && !selectedSector && !selectedIndustry) {
        const fetchAllRankings = async () => {
            setRankingLoading(true);
            try {
                const response = await fetch(`${baseUrl}/api/sec/special_metrics/investment_factor_ranking_table_for_all_companies/`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                console.log('[TopPicks] Fetched all rankings data:', data);
                // Handle potential case sensitivity or missing field
                const rankings: RankingResult[] = data.Ranking || data.ranking || [];
                console.log('[TopPicks] Processed rankings count:', rankings.length);

                const newPicksData: TopPickData[] = rankings.map(r => ({
                    ticker: r.ticker,
                    name: r.ticker, // API doesn't return name
                    industry: 'N/A',
                    sector: 'N/A',
                    
                    // Raw values from API
                    roic5YAvg: r.roic_5y_avg,
                    earningsYield: r.earnings_yield,
                    intrinsicToMarketCap: r.intrinsic_to_mc,
                    
                    // Ranks
                    ranks: {
                        roic: r.roic_rank,
                        earnings: r.earnings_yield_rank,
                        intrinsic: r.intrinsic_to_mc_rank,
                        overall: r.overall_rank
                    },

                    // Missing fields
                    netIncome5YAvg: 0,
                    sharesOutstanding: 0,
                    stockPrice: 0,
                    intrinsicValue: 0,
                    marketCap: 0
                }));
                
                console.log('[TopPicks] Setting picksData:', newPicksData.length, 'items');
                setPicksData(newPicksData);
                setRankingStats({ sent: rankings.length, ranked: rankings.length, rejected: 0 });
            } catch (err) {
                console.error("[TopPicks] Failed to fetch all rankings:", err);
                setPicksData([]);
                setRankingStats(null);
            } finally {
                setRankingLoading(false);
            }
        };
        fetchAllRankings();
        return;
    }

    // Option A: Sector selected first, do NOT call rankings until an Industry is selected.
    if (activeMode === 'today' && selectedSector && !selectedIndustry) {
        setPicksData([]);
        setRankingStats(null);
        setRankingLoading(false);
        return;
    }

    // Mode 2: Filtered Rankings (Only fetch if we have companies for the industry)
    // This applies to both modes if filters are used, or restricted to 'today' if historical is different.
    // Assuming Historical also uses industry filters? 
    // User requirement: "When the Historical Picks is clicked on, show 2 filters ie, company/companies and Ranking type."
    // So Historical ignores sector/industry?
    
    if (activeMode === 'historical') {
        // Skip the standard industry-based fetch if historical mode uses different filters.
        return; 
    }

    // Determine industry-scoped companies to rank:
    // - Central industries may have an explicit `companies` ticker list
    // - GraphDB flow populates `fetchedCompanies` with industry companies
    const industryObj = fetchedIndustries.find(ind => ind.industryName === selectedIndustry);
    const industryTickersFromCentral = (industryObj as any)?.companies;
    const companiesToRank: CompanyTicker[] =
        Array.isArray(industryTickersFromCentral) && industryTickersFromCentral.length > 0
            ? allCompanies.filter(c => industryTickersFromCentral.includes(c.ticker))
            : fetchedCompanies;

    if (selectedIndustry && companiesToRank.length === 0) {
        setPicksData([]);
        setRankingStats({ sent: 0, ranked: 0, rejected: 0 });
        setRankingLoading(false);
        return;
    }

    const fetchRankingData = async () => {
        setRankingLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/sec/special_metrics/investment_factor_ranking_table/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tickers: companiesToRank.map(c => c.ticker) }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Support BOTH possible API response schemas:
            // - Legacy (observed): { table: [{ "Ticker": "TGT", "Overall Rank": 1, "ROIC 5Y Avg": "0.1671 (3)", ... }] }
            // - Docs/new: { table: [{ ticker, overall_rank, roic_5y_avg, roic_rank, ... }], rejected: [...] }
            const tableRows: any[] = data.table || [];
            const rejectedRows: any[] = data.rejected || [];
            const isLegacyTable =
                tableRows.length > 0 &&
                (tableRows[0]?.['Ticker'] !== undefined || tableRows[0]?.['Overall Rank'] !== undefined);

            const parseValueRank = (str: string) => {
                if (!str) return { value: 0, rank: 0 };
                const match = String(str).match(/^([\d.-]+)\s*\((\d+)\)$/);
                if (match) return { value: parseFloat(match[1]), rank: parseInt(match[2], 10) };
                // If it's a plain number string, treat it as value with unknown rank
                const asNum = Number(str);
                return Number.isFinite(asNum) ? { value: asNum, rank: 0 } : { value: 0, rank: 0 };
            };

            // Track counts; if nothing is rankable, avoid rendering placeholder "0 rank" rows.
            setRankingStats({ sent: companiesToRank.length, ranked: tableRows.length, rejected: rejectedRows.length });
            if (tableRows.length === 0) {
                setPicksData([]);
                return;
            }

            const companyNameByTicker = new Map<string, string>(
                companiesToRank.map(c => [String(c.ticker || '').toUpperCase(), c.name ?? String(c.ticker || '').toUpperCase()])
            );

            // Render ONLY ranked rows returned by the API.
            const newPicksData: TopPickData[] = tableRows.map((row: any) => {
                const ticker = String(isLegacyTable ? row?.['Ticker'] : row?.ticker || '').toUpperCase();

                let roicValue = 0, roicRank = 0;
                let earningsValue = 0, earningsRank = 0;
                let intrinsicValue = 0, intrinsicRank = 0;
                let overallRank = 0;

                if (isLegacyTable) {
                    const roic = parseValueRank(row['ROIC 5Y Avg']);
                    const earn = parseValueRank(row['Earnings Yield']);
                    const intr = parseValueRank(row['Intrinsic to Market Cap']);
                    roicValue = roic.value; roicRank = roic.rank;
                    earningsValue = earn.value; earningsRank = earn.rank;
                    intrinsicValue = intr.value; intrinsicRank = intr.rank;
                    overallRank = Number(row['Overall Rank']) || 0;
                } else {
                    roicValue = row.roic_5y_avg ?? 0;
                    roicRank = row.roic_rank ?? 0;
                    earningsValue = row.earnings_yield ?? 0;
                    earningsRank = row.earnings_yield_rank ?? 0;
                    intrinsicValue = row.intrinsic_to_mc ?? 0;
                    intrinsicRank = row.intrinsic_to_mc_rank ?? 0;
                    overallRank = row.overall_rank ?? 0;
                }

                return {
                    ticker,
                    name: companyNameByTicker.get(ticker) ?? ticker,
                    industry: selectedIndustry || "Unknown",
                    sector: selectedSector || "Unknown",

                    // Values
                    roic5YAvg: roicValue,
                    earningsYield: earningsValue,
                    intrinsicToMarketCap: intrinsicValue,

                    // Ranks
                    ranks: {
                        roic: roicRank,
                        earnings: earningsRank,
                        intrinsic: intrinsicRank,
                        overall: overallRank
                    },

                    // Fields not provided by ranking endpoint
                    netIncome5YAvg: 0,
                    sharesOutstanding: 0,
                    stockPrice: 0,
                    intrinsicValue: 0,
                    marketCap: 0
                };
            });
      
            setPicksData(newPicksData);

        } catch (err) {
            console.error("Failed to fetch ranking data:", err);
            // Fallback to empty or keep previous?
            // setPicksData([]); 
        } finally {
            setRankingLoading(false);
        }
    };

    fetchRankingData();
  }, [fetchedCompanies, allCompanies, fetchedIndustries, selectedSector, selectedIndustry, activeMode]); // Re-run when companies list or filters change

  // Format Helper override for ROIC if needed
  // If ROIC comes as huge number (e.g. 7442211765), formatPercent might be wrong.
  // But let's verify data first.


  // Filter Data - RESTORED
  const filteredData = useMemo(() => {
    console.log('[TopPicks] Filtering data:', {
      picksDataCount: picksData.length,
      selectedIndustry,
      selectedSector,
      selectedCompany
    });
    
    let data = picksData.filter(item => {
      const matchIndustry = selectedIndustry ? item.industry === selectedIndustry : true;
      const matchSector = selectedSector ? item.sector === selectedSector : true;
      const matchCompany = selectedCompany ? item.ticker === selectedCompany : true;
      return matchIndustry && matchSector && matchCompany;
    });

    console.log('[TopPicks] After filtering:', data.length, 'items');

    // Default sort by overall rank for Today's Pick
    data = data.sort((a, b) => {
      const ar = a.ranks.overall || Number.POSITIVE_INFINITY;
      const br = b.ranks.overall || Number.POSITIVE_INFINITY;
      return ar - br;
    });
    
    return data;
  }, [picksData, selectedIndustry, selectedSector, selectedCompany]);

  // Convert TopPickData to EliteTickerData
  const convertToEliteTickerData = (item: TopPickData): EliteTickerData => {
    // Calculate V-Rating metrics from existing data
    // For now, using overall_score and other metrics to derive values
    // In production, these should come from the API
    const overallScore = item.ranks.overall || 100;
    const vRating = Math.max(0, Math.min(100, 100 - (overallScore - 1) * 2)); // Inverse of rank, scaled to 0-100
    
    // Derive other metrics from existing data (mock for now - should come from API)
    const vQuality = Math.max(0, Math.min(100, (item.roic5YAvg || 0) * 10)); // Scale ROIC to 0-100
    const vValue = Math.max(0, Math.min(100, (item.intrinsicToMarketCap || 0) * 50)); // Scale intrinsic/mc ratio
    const vSafety = Math.max(0, Math.min(100, 100 - (item.ranks.overall || 100) * 0.5)); // Inverse of overall rank
    const vMomentum = Math.max(0, Math.min(100, (item.earningsYield || 0) * 20)); // Scale earnings yield
    
    // Determine V-Elite Status based on overall rank
    let vEliteStatus: EliteTickerData['vEliteStatus'];
    if (item.ranks.overall <= 10) {
      vEliteStatus = { type: 'elite', value: item.ranks.overall };
    } else if (item.ranks.overall <= 15) {
      vEliteStatus = { type: 'gatekeeper', value: item.ranks.overall };
    } else {
      vEliteStatus = { type: 'fail', value: 'FAIL' };
    }
    
    return {
      ticker: item.ticker,
      vEliteStatus,
      vRating,
      vQuality,
      vValue,
      vSafety,
      vMomentum
    };
  };

  // Convert filtered data to Elite Ticker format
  const eliteTickerData = useMemo(() => {
    return filteredData.map(convertToEliteTickerData);
  }, [filteredData]);

  // Paginated data - cumulative loading (show first N items)
  const paginatedEliteTickerData = useMemo(() => {
    return eliteTickerData.slice(0, itemsToShow);
  }, [eliteTickerData, itemsToShow]);

  // Calculate pagination info
  const hasMoreItems = eliteTickerData.length > itemsToShow;
  const hasPreviousItems = itemsToShow > 10;

  // Reset pagination when filters change
  useEffect(() => {
    setItemsToShow(10);
  }, [selectedIndustry, selectedSector, selectedCompany, activeMode]);

  // Update available options for filters based on API data
  const availableSectors = useMemo(() => fetchedSectors.map(s => s.sectorName).sort(), [fetchedSectors]);
  const availableIndustries = useMemo(() => fetchedIndustries.map(i => i.industryName).sort(), [fetchedIndustries]);
  
  // ... (rest of filter logic) ...

  // Filtered Industries and Sectors based on search input
  const filteredIndustries = useMemo(() => {
    if (!industrySearch) return availableIndustries;
    return availableIndustries.filter(ind =>
      ind.toLowerCase().includes(industrySearch.toLowerCase())
    );
  }, [availableIndustries, industrySearch]);

  const filteredSectors = useMemo(() => {
    if (!sectorSearch) return availableSectors;
    return availableSectors.filter(sec =>
      sec.toLowerCase().includes(sectorSearch.toLowerCase())
    );
  }, [availableSectors, sectorSearch]);

  // Filtered Companies for Dropdown (based on industry selection)
  const filteredCompanies = useMemo(() => {
    // FetchedCompanies has ALL companies from Central API
    const sourceCompanies = fetchedCompanies;
    
    if (!selectedIndustry) return sourceCompanies;
    
    // Find the selected industry object from fetchedIndustries (which now comes from Central API)
    const industryObj = fetchedIndustries.find(ind => ind.industryName === selectedIndustry);

    if (!industryObj) return sourceCompanies;

    // Filter sourceCompanies to include only those in the industry's company list
    // industryObj.companies is array of tickers (strings)
    // sourceCompanies is array of {ticker, name}
    
    // Check if industryObj has companies property (added in previous step)
    const validTickers = (industryObj as any).companies;
    if (Array.isArray(validTickers) && validTickers.length > 0) {
      return sourceCompanies.filter(comp => validTickers.includes(comp.ticker));
    }
    // GraphDB industries do not include `companies`; in that flow `fetchedCompanies` is already industry-scoped.
    return sourceCompanies;
  }, [fetchedCompanies, fetchedIndustries, selectedIndustry]);

  // Filtered Companies for Search (based on search input)
  const filteredCompaniesForSearch = useMemo(() => {
    const baseList = filteredCompanies;
    if (!companySearch) return baseList;
    return baseList.filter(comp =>
      comp.ticker.toLowerCase().includes(companySearch.toLowerCase()) ||
      comp.name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [filteredCompanies, companySearch]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setShowIndustryDropdown(false);
      }
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
        setShowSectorDropdown(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Industry Change - clear company selection if it doesn't belong to new industry
  const handleIndustryChange = (newIndustry: string) => {
    setSelectedIndustry(newIndustry);
    setIndustrySearch('');
    setShowIndustryDropdown(false);
    
    // Always clear company selection when industry changes to avoid inconsistencies
    // (Since we fetch companies specific to the industry)
    if (selectedCompany) {
         setSelectedCompany('');
    }
  };

  // Handle Sector Change
  const handleSectorChange = (newSector: string) => {
    setSelectedSector(newSector);
    setSectorSearch('');
    setShowSectorDropdown(false);
  };

  // Handle Company Change - auto-select industry if possible
  const handleCompanyChange = (newCompanyTicker: string) => {
    setSelectedCompany(newCompanyTicker);
    setCompanySearch('');
    setShowCompanyDropdown(false);
    if (newCompanyTicker && !selectedIndustry) {
      const companyData = picksData.find(d => d.ticker === newCompanyTicker);
      if (companyData && companyData.industry) {
        setSelectedIndustry(companyData.industry);
      }
    }
  };

  return (
    <div className="relative z-0 px-2 sm:px-4 xl:px-6 pb-2 sm:pb-4 xl:pb-6 pt-0 mt-0">
      <div className="mb-0 mt-0">
        <h2 className="text-xl font-bold text-gray-800 dark:text-[#E0E6E4] mb-0 mt-0">VInvest Rating - Elite Ticker Analysis</h2>
        
        {/* Mode Selection Buttons */}
        <div className="flex space-x-2 mb-5 border-b border-gray-200 dark:border-[#161C1A]">
          <button
            onClick={() => {
                setActiveMode('today');
            }}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
              activeMode === 'today'
                ? 'text-[#144D37] dark:text-[#144D37] border-b-2 border-[#144D37] dark:border-[#144D37]'
                : 'text-gray-500 dark:text-[#889691] hover:text-gray-700 dark:hover:text-[#E0E6E4]'
            }`}
          >
            Scan
          </button>
          <button
            onClick={() => setActiveMode('historical')}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
              activeMode === 'historical'
                ? 'text-[#144D37] dark:text-[#144D37] border-b-2 border-[#144D37] dark:border-[#144D37]'
                : 'text-gray-500 dark:text-[#889691] hover:text-gray-700 dark:hover:text-[#E0E6E4]'
            }`}
          >
            Track
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* AI Filter Input - Only for Scan tab */}
          {activeMode === 'today' && (
            <div className="flex-1">
              <div className="relative">
              <input
                type="text"
                  value={aiFilter}
                  onChange={(e) => setAiFilter(e.target.value)}
                  placeholder="AI Filter"
                  className="w-full font-medium text-sm px-3 py-1.5 pr-8 border border-gray-200 dark:border-[#161C1A] rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D] bg-white dark:bg-[#1C2220] dark:text-[#E0E6E4] dark:placeholder-[#889691]"
                />
                {aiFilter && (
                <button
                    onClick={() => setAiFilter('')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#E0E6E4] p-0.5"
                    aria-label="Clear filter"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              </div>
                        </div>
              )}
            </div>
          </div>

        {/* Main Content Area: Table or Chart */}
        {activeMode === 'historical' ? (
            // V-Ratings Historical Chart View for Track tab
            (() => {
              // Get the ticker from selectedTicker prop or selectedCompany state
              const tickerToShow = selectedTicker || selectedCompany;
              
              return (
                <div className="h-[400px] w-full mt-4">
                  {!tickerToShow ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#889691]">
                      Please select a ticker from the table or search bar to view V-Ratings chart.
              </div>
                  ) : historicalVRatingsLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#889691]">
                      Loading historical V-Ratings data...
                        </div>
                  ) : historicalVRatingsError ? (
                    <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400 text-center px-4">
                      {historicalVRatingsError}
                    </div>
                  ) : historicalVRatingsData.length > 0 ? (
                    <div className="w-full h-full bg-white dark:bg-[#1C2220] rounded-lg p-4 border border-gray-200 dark:border-[#161C1A]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={historicalVRatingsData}
                          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke="#E5E7EB" 
                            strokeOpacity={0.5}
                            className="dark:stroke-[#2A3230]"
                          />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(val) => {
                              // Show "Today" for the last point, otherwise show date
                              const item = historicalVRatingsData.find(d => d.date === val);
                              return item?.dateLabel === 'Today' ? 'Today' : new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                }}
                                minTickGap={30}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
                            className="dark:text-[#889691]"
                            style={{ fill: '#6B7280' }}
                            />
                            <YAxis 
                            label={{ 
                              value: 'Rating', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12, fontWeight: 600 }
                            }} 
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
                            className="dark:text-[#889691]"
                            style={{ fill: '#6B7280' }}
                            tickCount={6}
                            /> 
                            <Tooltip 
                            content={<CustomVRatingsTooltip />}
                            cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '5 5' }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                            iconSize={16}
                            formatter={(value) => {
                              const isDark = document.documentElement.classList.contains('dark');
                              return (
                                <span style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 500, 
                                  color: isDark ? '#889691' : '#374151' 
                                }}>
                                  {value}
                                </span>
                              );
                            }}
                          />
                            <Line 
                                type="monotone" 
                            dataKey="vRating" 
                                stroke="#144D37" 
                            strokeWidth={3}
                            name="V-Rating"
                            dot={{ r: 5, fill: '#144D37', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7, fill: '#144D37', strokeWidth: 2, stroke: '#fff' }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="vQuality" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            name="V-Quality"
                            dot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="vValue" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            name="V-Value"
                            dot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="vSafety" 
                            stroke="#F59E0B" 
                            strokeWidth={3}
                            name="V-Safety"
                            dot={{ r: 5, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="vMomentum" 
                            stroke="#EF4444" 
                            strokeWidth={3}
                            name="V-Momentum"
                            dot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#889691]">
                      No historical V-Rating data available for {tickerToShow}.
                    </div>
                )}
            </div>
              );
            })()
        ) : (
            // Elite Ticker Analysis Table View (Today's Pick Only)
      <div className="overflow-auto max-h-[75vh] lg:max-h-[calc(100vh-200px)] border border-gray-200 dark:border-[#161C1A] rounded-lg custom-scrollbar bg-white dark:bg-[#161C1A] mt-3">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#161C1A]">
          <thead className="bg-blue-50 dark:bg-[#1C2220] sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="px-1.5 py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-[#161C1A]">
                Ticker
              </th>
              <th scope="col" className="px-1.5 py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-[#161C1A]">
                V-Elite
              </th>
              <th scope="col" className="px-1.5 py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-[#161C1A]">
                <InfoTooltip tooltipText="A weighted aggregate of all four pillars. It represents the &quot;Total Truth&quot; of the investment's current state.">
                  <span>V-Rating</span>
                </InfoTooltip>
              </th>
              <th scope="col" className="px-1.5 py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-[#161C1A]">
                <InfoTooltip tooltipText="Measures capital efficiency (ROIC), revenue stability, and gross margins.">
                  <span>V-Quality</span>
                </InfoTooltip>
              </th>
              <th scope="col" className="px-1.5 py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-[#161C1A]">
                <InfoTooltip tooltipText="Measures the delta between the company's intrinsic &quot;Rational Value&quot; and its current market price.">
                  <span>V-Value</span>
                </InfoTooltip>
              </th>
              <th scope="col" className="px-1.5 py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-[#161C1A]">
                <InfoTooltip tooltipText="A composite of the Altman Z-Score (solvency), Piotroski F-Score (health), and Debt-to-EBITDA.">
                  <span>V-Safety</span>
                </InfoTooltip>
              </th>
              <th scope="col" className="px-1.5 py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                <InfoTooltip tooltipText="Tracks price velocity relative to the 200-day Moving Average and the 14-day RSI exhaustion levels.">
                  <span>V-Momentum</span>
                </InfoTooltip>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#161C1A] divide-y divide-gray-200 dark:divide-[#161C1A]">
            {rankingLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-[#889691]">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-[#2A332F] border-t-[#144D37] animate-spin" />
                    <span>Generating ranking table…</span>
                  </div>
                </td>
              </tr>
            ) : eliteTickerData.length > 0 ? (
              paginatedEliteTickerData.map((item) => (
                <tr 
                  key={item.ticker} 
                  className="hover:bg-gray-50 dark:hover:bg-[#1C2220] transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedCompany(item.ticker);
                    onTickerClick && onTickerClick(item.ticker);
                  }}
                >
                  <td className="px-1.5 py-2 text-center border-r border-gray-200 dark:border-[#161C1A]">
                    <div className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-white">
                      ${item.ticker}$
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-gray-200 dark:border-[#161C1A]">
                    <div className="flex items-center justify-center">
                      <VEliteStatusBadge status={item.vEliteStatus} />
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-gray-200 dark:border-[#161C1A]">
                    <div className="flex items-center justify-center">
                      <CircularProgress value={item.vRating} size={44} showTooltip={true} />
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-gray-200 dark:border-[#161C1A]">
                    <div className="flex items-center justify-center">
                      <CircularProgress value={item.vQuality} size={44} showTooltip={true} metricType="quality" />
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-gray-200 dark:border-[#161C1A]">
                    <div className="flex items-center justify-center">
                      <CircularProgress value={item.vValue} size={44} showTooltip={true} metricType="value" />
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-gray-200 dark:border-[#161C1A]">
                    <div className="flex items-center justify-center">
                      <CircularProgress value={item.vSafety} size={44} showTooltip={true} metricType="safety" />
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <CircularProgress value={item.vMomentum} size={44} showTooltip={true} metricType="momentum" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-[#889691]">
                  {rankingStats && rankingStats.sent > 0 && rankingStats.ranked === 0
                    ? `No ranked companies returned by the API for this filter (rejected ${rankingStats.rejected}/${rankingStats.sent}).`
                    : 'No companies found matching the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls - Range + arrow icons */}
        {eliteTickerData.length > 0 && (hasPreviousItems || hasMoreItems) && (
          <div className="py-4 flex items-center justify-center gap-4 bg-white dark:bg-[#161C1A] border-t border-gray-200 dark:border-[#161C1A]">
            <span className="text-sm text-gray-500 dark:text-[#889691]">
              1-{paginatedEliteTickerData.length} of {eliteTickerData.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setItemsToShow(prev => Math.max(10, prev - 10))}
                disabled={!hasPreviousItems}
                aria-label="Load previous 10"
                className={`p-2 rounded-lg transition-colors ${
                  hasPreviousItems
                    ? 'text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#2A332F]'
                    : 'text-gray-300 dark:text-[#2A3230] cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setItemsToShow(prev => prev + 10)}
                disabled={!hasMoreItems}
                aria-label="Load next 10"
                className={`p-2 rounded-lg transition-colors ${
                  hasMoreItems
                    ? 'text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#2A332F]'
                    : 'text-gray-300 dark:text-[#2A3230] cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
        )}
  </div>
);
};

export default TopPicks;

