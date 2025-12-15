import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const TopPicks: React.FC<TopPicksProps> = ({ companies: propCompanies, industries: propIndustries, sectors: propSectors }) => {
  // Filter states
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  
  // Data from APIs
  const [fetchedSectors, setFetchedSectors] = useState<Sector[]>([]);
  const [fetchedIndustries, setFetchedIndustries] = useState<Industry[]>([]);
  const [fetchedCompanies, setFetchedCompanies] = useState<CompanyTicker[]>([]); // Companies for the table
  
  // Search states for Industry, Sector, and Company filters
  const [industrySearch, setIndustrySearch] = useState<string>('');
  const [sectorSearch, setSectorSearch] = useState<string>('');
  const [companySearch, setCompanySearch] = useState<string>('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState<boolean>(false);
  const [showSectorDropdown, setShowSectorDropdown] = useState<boolean>(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState<boolean>(false);
  
  // Refs for dropdowns
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const sectorDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  
  const [picksData, setPicksData] = useState<TopPickData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for mode selection
  const [activeMode, setActiveMode] = useState<'today' | 'historical'>('today');
  // New state for Historical Ranking
  const [selectedDate, setSelectedDate] = useState<string>(''); 
  const [historicalFilter, setHistoricalFilter] = useState<'overall' | 'date'>('overall');

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

  // Fetch Industries when Sector changes (or initially)
  useEffect(() => {
    if (!selectedSector) {
        setFetchedIndustries([]);
        return; 
    }

    let url = `${baseUrl}/api/sec/graphdb/industries_when_sector_given`;
    // Find sector ID if possible, or pass name
    const sector = fetchedSectors.find(s => s.sectorName === selectedSector);
    // API NOTE: Sending both sectorName and sectorId causes the external API to return empty list.
    // We prioritize sectorName as it is reliable.
    url += `?sectorName=${encodeURIComponent(selectedSector)}`;
    // if (sector) url += `&sectorId=${sector.sectorId}`;
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
          setFetchedIndustries(data);
          // Auto-select removed as per user request
          /*
          if (data && data.length > 0) {
              setSelectedIndustry(data[0].industryName);
          }
          */
      })
      .catch(err => console.error("Failed to fetch industries:", err));
  }, [selectedSector, fetchedSectors]);

  // Ensure we always have a valid selection if data is available (API does not support "All")
  // Auto-select removed as per user request to not default to "Communication Services"
  /*
  useEffect(() => {
      if (!selectedSector && fetchedSectors.length > 0) {
          setSelectedSector(fetchedSectors[0].sectorName);
      }
  }, [fetchedSectors]);
  */

  // Fetch Companies when Industry changes (or initially)
  useEffect(() => {
    if (!selectedIndustry) {
        setFetchedCompanies([]);
        setIsLoading(false);
        return;
    }

    let url = `${baseUrl}/api/sec/graphdb/companies_when_industry_given`;
    const industry = fetchedIndustries.find(i => i.industryName === selectedIndustry);
    // API NOTE: Sending both industryName and industryId might cause issues (like with sectors).
    // Using industryName is reliable.
    url += `?industryName=${encodeURIComponent(selectedIndustry)}`;
    // if (industry) url += `&industryId=${industry.industryId}`;

    setIsLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
          // Map response to CompanyTicker format
          const comps = data.map((c: any) => ({
              ticker: c.ticker,
              name: c.companyName || c.name || c.ticker
          }));
          setFetchedCompanies(comps);
          setIsLoading(false);
      })
      .catch(err => {
          console.error("Failed to fetch companies:", err);
          setIsLoading(false);
      });
  }, [selectedIndustry, fetchedIndustries]);

  // Helper to format numbers
  const formatPercent = (val: number) => {
    // Check if value is likely a ratio (e.g. 0.15) or percentage (15.0) or huge number
    // API returns Earnings Yield as 0.0153 -> 1.5%
    if (Math.abs(val) <= 1) {
        return `${(val * 100).toFixed(2)}%`; // Use 2 decimals for small ratios
    }
    // If it's a large number (like ROIC example), maybe just display as is or with 'x' or '$'?
    // Assuming ROIC might be bugged in API, let's just show it fixed
    if (val > 1000) {
        // Format as large number if needed, or just return as is
        return val.toLocaleString(); 
    }
    return `${val.toFixed(1)}%`;
  };
  const formatRatio = (val: number) => `${val.toFixed(2)}x`;
  
  // Fetch Ranking Data when Companies are loaded
  useEffect(() => {
    // Logic split based on Active Mode
    
    // 1. Historical Mode Logic
    if (activeMode === 'historical') {
        
        // Case A: Overall Ranking (Same as Today's default)
        if (historicalFilter === 'overall') {
            const fetchAllRankings = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${baseUrl}/api/sec/special_metrics/investment_factor_ranking_table_for_all_companies`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = await response.json();
                    const rankings: RankingResult[] = data.Ranking || data.ranking || [];

                    const newPicksData: TopPickData[] = rankings.map(r => ({
                        ticker: r.ticker,
                        name: r.ticker,
                        industry: 'N/A',
                        sector: 'N/A',
                        roic5YAvg: r.roic_5y_avg,
                        earningsYield: r.earnings_yield,
                        intrinsicToMarketCap: r.intrinsic_to_mc,
                        ranks: {
                            roic: r.roic_rank,
                            earnings: r.earnings_yield_rank,
                            intrinsic: r.intrinsic_to_mc_rank,
                            overall: r.overall_rank
                        },
                        netIncome5YAvg: 0,
                        sharesOutstanding: 0,
                        stockPrice: 0,
                        intrinsicValue: 0,
                        marketCap: 0
                    }));
                    setPicksData(newPicksData);
                } catch (err) {
                    console.error("Failed to fetch overall rankings in historical mode:", err);
                    setPicksData([]);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAllRankings();
            return;
        }

        // Case B: Specific Date
        if (historicalFilter === 'date') {
            if (!selectedDate) {
                 setPicksData([]);
                 return;
            }
    
            const fetchHistoricalRankings = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${baseUrl}/api/sec/special_metrics/investment_factor_ranking_table_for_all_companies/${selectedDate}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}) // Empty body as we just need the date which is in URL
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = await response.json();
                    
                    // Parse logic similar to "Today" mode
                    const rankings: RankingResult[] = data.Ranking || data.ranking || [];
    
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
                    
                    setPicksData(newPicksData);
                } catch (err) {
                    console.error("Failed to fetch historical rankings:", err);
                    setPicksData([]);
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchHistoricalRankings();
            return;
        }
    }

    // 2. Today's Pick Logic (Existing Default Behavior)
    
    // Mode 1: Default / All Companies (No filters selected)
    // Only applies if in 'today' mode or if we want historical to behave similarly initially
    if (activeMode === 'today' && !selectedSector && !selectedIndustry) {
        const fetchAllRankings = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${baseUrl}/api/sec/special_metrics/investment_factor_ranking_table_for_all_companies`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                // Handle potential case sensitivity or missing field
                const rankings: RankingResult[] = data.Ranking || data.ranking || [];

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
                
                setPicksData(newPicksData);
            } catch (err) {
                console.error("Failed to fetch all rankings:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllRankings();
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

    if (fetchedCompanies.length === 0) {
        setPicksData([]);
        return;
    }

    const fetchRankingData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/sec/special_metrics/investment_factor_ranking_table`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tickers: fetchedCompanies.map(c => c.ticker) }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Parse the API response table
            const tableRows = data.table || [];
            
            // Helper to parse "Value (Rank)" string
            // Examples: "7442211765.4334 (1)", "0.0153 (1)"
            const parseValueRank = (str: string) => {
                if (!str) return { value: 0, rank: 0 };
                const match = str.match(/^([\d.-]+)\s*\((\d+)\)$/);
                if (match) {
                    return { value: parseFloat(match[1]), rank: parseInt(match[2]) };
                }
                return { value: 0, rank: 0 };
            };

            // Map over ALL fetched companies to ensure they appear in table even if rejected by ranking API
            const newPicksData: TopPickData[] = fetchedCompanies.map((company) => {
                const row = tableRows.find((r: any) => r['Ticker'] === company.ticker);
                
                let roicData = { value: 0, rank: 0 };
                let earningsData = { value: 0, rank: 0 };
                let intrinsicData = { value: 0, rank: 0 };
                let overallRank = 0;

                if (row) {
                    roicData = parseValueRank(row['ROIC 5Y Avg']);
                    earningsData = parseValueRank(row['Earnings Yield']);
                    intrinsicData = parseValueRank(row['Intrinsic to Market Cap']);
                    overallRank = row['Overall Rank'];
                }

        return {
          ticker: company.ticker,
          name: company.name,
                    industry: selectedIndustry || "Unknown",
                    sector: selectedSector || "Unknown",
                    
                    // Parsed values
                    roic5YAvg: roicData.value,
                    earningsYield: earningsData.value,
                    intrinsicToMarketCap: intrinsicData.value,
                    
                    // Ranks
          ranks: {
                        roic: roicData.rank,
                        earnings: earningsData.rank,
                        intrinsic: intrinsicData.rank,
                        overall: overallRank
                    },

                    // Missing fields in ranking API
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
            setIsLoading(false);
        }
    };

    fetchRankingData();
  }, [fetchedCompanies, selectedSector, selectedIndustry, activeMode, selectedDate, historicalFilter]); // Re-run when companies list or filters change

  // Format Helper override for ROIC if needed
  // If ROIC comes as huge number (e.g. 7442211765), formatPercent might be wrong.
  // But let's verify data first.


  // Filter Data - RESTORED
  const filteredData = useMemo(() => {
    return picksData.filter(item => {
      const matchIndustry = selectedIndustry ? item.industry === selectedIndustry : true;
      const matchSector = selectedSector ? item.sector === selectedSector : true;
      const matchCompany = selectedCompany ? item.ticker === selectedCompany : true;
      return matchIndustry && matchSector && matchCompany;
    }).sort((a, b) => a.ranks.overall - b.ranks.overall);
  }, [picksData, selectedIndustry, selectedSector, selectedCompany]);

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
    // Assuming fetchedCompanies is the source of truth for the dropdowns when using API
    const sourceCompanies = fetchedCompanies;
    
    if (!selectedIndustry) return sourceCompanies;
    
    // Find the selected industry object
    const industryObj = fetchedIndustries.length > 0 
        ? fetchedIndustries.find(ind => ind.industryName === selectedIndustry)
        : propIndustries.find(ind => (ind.name || ind.label) === selectedIndustry);

    if (!industryObj) return sourceCompanies;

    // If using API data, we likely already fetched the companies for this industry in the useEffect
    // So we might just return fetchedCompanies if it matches the current industry context.
    // But for robustness with prop fallback:
    
    return sourceCompanies.filter(comp => {
      // If using props
      if ((industryObj as any).companies) {
          return (industryObj as any).companies.some((c: any) => 
        (typeof c === 'string' ? c : c.ticker) === comp.ticker
      );
      }
      // If using API, we just return the fetchedCompanies because they are already filtered by industry in useEffect
      // Check if the current fetchedCompanies are indeed for this industry? 
      // The useEffect updates fetchedCompanies when selectedIndustry changes.
      return true;
    });
  }, [fetchedCompanies, propCompanies, fetchedIndustries, propIndustries, selectedIndustry]);

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
    <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Top Picks Analysis</h2>
        
        {/* Mode Selection Buttons */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
            <button
            onClick={() => {
                setActiveMode('today');
                setSelectedDate('');
            }}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
              activeMode === 'today'
                ? 'text-[#1B5A7D] border-b-2 border-[#1B5A7D]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Today's Pick
          </button>
          <button
            onClick={() => setActiveMode('historical')}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
              activeMode === 'historical'
                ? 'text-[#1B5A7D] border-b-2 border-[#1B5A7D]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historical Ranking
          </button>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          
          {/* Historical Mode Filters: Date Selection */}
          {activeMode === 'historical' && (
            <>
             {/* Filter Type Selection */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ranking View</label>
                <div className="relative">
                  <select
                    value={historicalFilter}
                    onChange={(e) => {
                        setHistoricalFilter(e.target.value as 'overall' | 'date');
                        if (e.target.value === 'overall') {
                            setSelectedDate('');
                        }
                    }}
                    className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D] appearance-none bg-white"
                  >
                    <option value="overall">Overall Ranking (Current)</option>
                    <option value="date">Specific Date</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
             </div>

             {/* Date Filter (Only shown if 'date' is selected) */}
             {historicalFilter === 'date' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full font-medium text-sm px-3 py-1 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D] bg-white"
                      />
                    </div>
                 </div>
             )}
            </>
          )}

          {/* Today's Pick Filters: Industry & Sector */}
          {/* User requirement: "When the Historical Picks is clicked on, show 2 filters ie, company/companies and Ranking type." */}
          {/* This implies Industry/Sector are NOT shown in Historical mode, or at least not the primary ones. */}
          {/* However, the Company filter is shared or specific? */}
          
          {activeMode === 'today' && (
          <>
          {/* Industry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <div className="relative" ref={industryDropdownRef}>

              <input
                type="text"
                placeholder="Select Industry"
                value={selectedIndustry ? selectedIndustry : industrySearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setIndustrySearch(value);
                  if (value) {
                    setSelectedIndustry('');
                  }
                  setShowIndustryDropdown(true);
                }}
                onFocus={() => {
                  if (selectedIndustry) {
                    setIndustrySearch(selectedIndustry);
                    setSelectedIndustry('');
                  }
                  setShowIndustryDropdown(true);
                }}
                className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
              />
              {(selectedIndustry || industrySearch) && (
                <button
                  onClick={() => {
                    setSelectedIndustry('');
                    setIndustrySearch('');
                    setShowIndustryDropdown(false);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showIndustryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                  {filteredIndustries.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No industries found</div>
                  ) : (
                    <>
                      {filteredIndustries.map(ind => (
                        <div
                          key={ind}
                          onClick={() => handleIndustryChange(ind)}
                          className={`px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer ${
                            selectedIndustry === ind ? 'bg-blue-50' : ''
                          }`}
                        >
                          {ind}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
            <div className="relative" ref={sectorDropdownRef}>
              <input
                type="text"
                placeholder="Select Sector"
                value={selectedSector ? selectedSector : sectorSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setSectorSearch(value);
                  if (value) {
                    setSelectedSector('');
                  }
                  setShowSectorDropdown(true);
                }}
                onFocus={() => {
                  if (selectedSector) {
                    setSectorSearch(selectedSector);
                    setSelectedSector('');
                  }
                  setShowSectorDropdown(true);
                }}
                className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
              />
              {(selectedSector || sectorSearch) && (
                <button
                  onClick={() => {
                    setSelectedSector('');
                    setSectorSearch('');
                    setShowSectorDropdown(false);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showSectorDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                  {filteredSectors.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No sectors found</div>
                  ) : (
                    <>
                      {filteredSectors.map(sec => (
                        <div
                          key={sec}
                          onClick={() => handleSectorChange(sec)}
                          className={`px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer ${
                            selectedSector === sec ? 'bg-blue-50' : ''
                          }`}
                        >
                          {sec}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Company Filter (Shared or specific per mode?) */}
          {/* Requirement says "When the Historical Picks is clicked on, show 2 filters ie, company/companies and Ranking type." */}
          {/* Today's pick also has Company filter. So it can be shared, but maybe positioned differently if needed. */}
          {/* For now, keeping it here for both modes as it seems applicable. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <div className="relative" ref={companyDropdownRef}>
              <input
                type="text"
                placeholder="Select Company"
                value={selectedCompany ? (() => {
                  const company = filteredCompanies.find(c => c.ticker === selectedCompany);
                  return company ? `${company.name} (${company.ticker})` : '';
                })() : companySearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setCompanySearch(value);
                  if (value) {
                    setSelectedCompany('');
                  }
                  setShowCompanyDropdown(true);
                }}
                onFocus={() => {
                  if (selectedCompany) {
                    const company = filteredCompanies.find(c => c.ticker === selectedCompany);
                    setCompanySearch(company ? `${company.name} (${company.ticker})` : '');
                    setSelectedCompany('');
                  }
                  setShowCompanyDropdown(true);
                }}
                className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 rounded focus:outline-none focus:border-[#1B5A7D] focus:ring-1 focus:ring-[#1B5A7D]"
              />
              {(selectedCompany || companySearch) && (
                <button
                  onClick={() => {
                    setSelectedCompany('');
                    setCompanySearch('');
                    setShowCompanyDropdown(false);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showCompanyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                  {filteredCompaniesForSearch.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No companies found</div>
                  ) : (
                    <>
                      {filteredCompaniesForSearch.map(comp => (
                        <div
                          key={comp.ticker}
                          onClick={() => handleCompanyChange(comp.ticker)}
                          className={`px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer ${
                            selectedCompany === comp.ticker ? 'bg-blue-50' : ''
                          }`}
                        >
                          {comp.name} ({comp.ticker})
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overall Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticker
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROIC 5Y Avg <br/>
                <span className="text-gray-400 font-normal">(Value | Rank)</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Earnings Yield <br/>
                <span className="text-gray-400 font-normal">(Value | Rank)</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intrinsic to Market Cap <br/>
                <span className="text-gray-400 font-normal">(Value | Rank)</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.ticker} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B5A7D] text-white font-bold text-sm">
                      {item.ranks.overall}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.ticker}</div>
                    <div className="text-xs text-gray-500">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatPercent(item.roic5YAvg)} 
                      <span className="text-gray-500 ml-1 text-xs">
                        (Rank: {item.ranks.roic})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatPercent(item.earningsYield)}
                      <span className="text-gray-500 ml-1 text-xs">
                        (Rank: {item.ranks.earnings})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatRatio(item.intrinsicToMarketCap)}
                      <span className="text-gray-500 ml-1 text-xs">
                        (Rank: {item.ranks.intrinsic})
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                  No companies found matching the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p className="font-semibold mb-1">Methodology:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Overall Rank:</strong> Calculated by summing the ranks of ROIC, Earnings Yield, and Intrinsic/Market Cap (Lowest sum = Rank 1).</li>
          <li><strong>ROIC 5Y Avg:</strong> 5-year average Return on Invested Capital.</li>
          <li><strong>Earnings Yield:</strong> (Net Income 5Y Avg / Shares Outstanding) / Stock Price.</li>
          <li><strong>Intrinsic to Market Cap:</strong> Intrinsic Value / Current Market Cap.</li>
          <li>Values are updated daily from API.</li>
        </ul>
      </div>
    </div>
  );
};

export default TopPicks;

