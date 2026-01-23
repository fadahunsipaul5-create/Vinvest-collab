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

const TopPicks: React.FC<TopPicksProps> = () => {
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

  // Historical Chart Data State
  const [historicalChartData, setHistoricalChartData] = useState<any[]>([]);
  const [historicalChartLoading, setHistoricalChartLoading] = useState(false);
  const [historicalChartError, setHistoricalChartError] = useState<string | null>(null);

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

  // Fetch Historical Ranking Chart Data
  useEffect(() => {
    if (activeMode === 'historical' && selectedCompany) {
        setHistoricalChartLoading(true);
        setHistoricalChartError(null);
        // Fetch history for the selected company and ranking type
        // Use 'ALL' period for full history
        const url = `${baseUrl}/api/sec/central/rankings/historical?tickers=${encodeURIComponent(selectedCompany)}&rankingType=${encodeURIComponent(selectedRankingType)}&period=ALL`;
        
        console.log('Fetching historical ranking:', url);
    
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          let detail = '';
          try {
            const errJson = await res.json();
            detail = errJson?.detail ? String(errJson.detail) : '';
          } catch {
            // ignore json parse errors
          }
          throw new Error(detail || `HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Historical ranking data received:', data);

        // API response format check
        if (data && data.history && Array.isArray(data.history)) {
          // Format: { history: [{ date: "2025-12-13", "AAPL": 5 }, ...] }
          // We need to transform this to chart format: [{ date: "...", rank: 5 }]
          const tickerKey = selectedCompany; // The key in the object is the ticker

          const chartData = data.history
            .map((item: any) => ({
              date: item.date,
              rank: item[tickerKey] // Extract rank using the ticker as key
            }))
            .filter((item: any) => item.rank !== null && item.rank !== undefined); // Filter out nulls

          setHistoricalChartData(chartData);
        } else if (data && data.length > 0 && data[0].rankings) {
          // Fallback for previous expected format: [{ ticker: "AAPL", rankings: [...] }]
          setHistoricalChartData(data[0].rankings);
        } else {
          console.log('Unexpected data format or empty:', data);
          setHistoricalChartData([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch historical ranking chart data:", err);
        setHistoricalChartError(err?.message ? String(err.message) : 'Failed to fetch historical ranking data.');
        setHistoricalChartData([]);
      } finally {
        setHistoricalChartLoading(false);
      }
    })();
    } else {
        setHistoricalChartData([]);
        setHistoricalChartError(null);
    }
  }, [activeMode, selectedCompany, selectedRankingType]);

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
    <div className="-mt-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-[#E0E6E4] mb-4">Value Screener Analysis</h2>
        
        {/* Mode Selection Buttons */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-[#161C1A]">
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
            Today's Pick
          </button>
          <button
            onClick={() => setActiveMode('historical')}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
              activeMode === 'historical'
                ? 'text-[#144D37] dark:text-[#144D37] border-b-2 border-[#144D37] dark:border-[#144D37]'
                : 'text-gray-500 dark:text-[#889691] hover:text-gray-700 dark:hover:text-[#E0E6E4]'
            }`}
          >
            Historical Ranking
          </button>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          
          {/* Historical Mode Filters: Ranking Type & Company Only */}
          {activeMode === 'historical' && (
            <>
             {/* Ranking Type Filter */}
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Ranking Type</label>
                <div className="relative">
                  <select
                    value={selectedRankingType}
                    onChange={(e) => setSelectedRankingType(e.target.value)}
                    className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 dark:border-[#161C1A] rounded bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] focus:outline-none focus:border-[#144D37] focus:ring-1 focus:ring-[#144D37] appearance-none"
                  >
                    {rankingTypes.length > 0 ? (
                        rankingTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                        ))
                    ) : (
                    <option value="overall">Overall Rank</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400 dark:text-[#889691]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
             </div>
            </>
          )}

          {/* Today's Pick Filters: Industry & Sector */}
          {/* User requirement: "When the Historical Picks is clicked on, show 2 filters ie, company/companies and Ranking type." */}
          {/* This implies Industry/Sector are NOT shown in Historical mode, or at least not the primary ones. */}
          {/* However, the Company filter is shared or specific? */}
          
          {activeMode === 'today' && (
          <>
          {/* Sector Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Sector</label>
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
                className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 dark:border-[#161C1A] rounded bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] placeholder-gray-400 dark:placeholder-[#889691] focus:outline-none focus:border-[#144D37] focus:ring-1 focus:ring-[#144D37]"
              />
              {(selectedSector || sectorSearch) && (
                <button
                  onClick={() => {
                    setSelectedSector('');
                    setSectorSearch('');
                    setShowSectorDropdown(false);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#889691] hover:text-gray-600 dark:hover:text-[#E0E6E4]"
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
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showSectorDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                  {filteredSectors.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No sectors found</div>
                  ) : (
                    <>
                      {filteredSectors.map(sec => (
                        <div
                          key={sec}
                          onClick={() => handleSectorChange(sec)}
                          className={`px-3 py-1 text-sm text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] cursor-pointer ${
                            selectedSector === sec ? 'bg-blue-50 dark:bg-[#144D37]/30' : ''
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

          {/* Industry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Industry</label>
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
                className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 dark:border-[#161C1A] rounded bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] placeholder-gray-400 dark:placeholder-[#889691] focus:outline-none focus:border-[#144D37] focus:ring-1 focus:ring-[#144D37]"
              />
              {(selectedIndustry || industrySearch) && (
                <button
                  onClick={() => {
                    setSelectedIndustry('');
                    setIndustrySearch('');
                    setShowIndustryDropdown(false);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#889691] hover:text-gray-600 dark:hover:text-[#E0E6E4]"
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
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showIndustryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                  {filteredIndustries.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No industries found</div>
                  ) : (
                    <>
                      {filteredIndustries.map(ind => (
                        <div
                          key={ind}
                          onClick={() => handleIndustryChange(ind)}
                          className={`px-3 py-1 text-sm text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] cursor-pointer ${
                            selectedIndustry === ind ? 'bg-blue-50 dark:bg-[#144D37]/30' : ''
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
          </>
          )}

          {/* Company Filter - Available in both modes now */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Company</label>
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
                className="w-full font-medium text-sm px-3 py-1 pr-8 border border-gray-200 dark:border-[#161C1A] rounded bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] placeholder-gray-400 dark:placeholder-[#889691] focus:outline-none focus:border-[#144D37] focus:ring-1 focus:ring-[#144D37]"
              />
              {(selectedCompany || companySearch) && (
                <button
                  onClick={() => {
                    setSelectedCompany('');
                    setCompanySearch('');
                    setShowCompanyDropdown(false);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#889691] hover:text-gray-600 dark:hover:text-[#E0E6E4]"
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
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showCompanyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-auto">
                  {filteredCompaniesForSearch.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-[#889691]">No companies found</div>
                  ) : (
                    <>
                      {filteredCompaniesForSearch.map(comp => (
                        <div
                          key={comp.ticker}
                          onClick={() => handleCompanyChange(comp.ticker)}
                          className={`px-3 py-1 text-sm text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] cursor-pointer ${
                            selectedCompany === comp.ticker ? 'bg-blue-50 dark:bg-[#144D37]/30' : ''
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

        {/* Main Content Area: Table or Chart */}
        {activeMode === 'historical' && selectedCompany ? (
            // Historical Chart View
            <div className="h-[400px] w-full mt-4">
                {historicalChartLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#889691]">Loading chart data...</div>
                ) : historicalChartError ? (
                    <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400 text-center px-4">
                        {historicalChartError}
                    </div>
                ) : historicalChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                                }}
                                minTickGap={30}
                            />
                            <YAxis 
                                reversed={true} // Lower rank is better
                                label={{ value: 'Rank', angle: -90, position: 'insideLeft' }} 
                                domain={[1, 'auto']}
                            /> 
                            <Tooltip 
                                labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                formatter={(val: number) => [`Rank ${val}`, 'Rank']}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="rank" 
                                stroke="#144D37" 
                                strokeWidth={2}
                                name={`${selectedCompany} - ${rankingTypes.find(t => t.id === selectedRankingType)?.label || 'Rank'}`}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#889691]">
                        No historical ranking data available for {selectedCompany} ({selectedRankingType}).
                    </div>
                )}
            </div>
        ) : (
            // Standard Table View (Today's Pick Only)
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#161C1A] border border-gray-200 dark:border-[#161C1A]">
          <thead className="bg-gray-50 dark:bg-[#1C2220]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E0E6E4] uppercase tracking-wider">
                Overall Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E0E6E4] uppercase tracking-wider">
                Ticker
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E0E6E4] uppercase tracking-wider">
                ROIC 5Y Avg <br/>
                <span className="text-gray-400 dark:text-[#889691] font-normal">(Value | Rank)</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E0E6E4] uppercase tracking-wider">
                Earnings Yield <br/>
                <span className="text-gray-400 dark:text-[#889691] font-normal">(Value | Rank)</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E0E6E4] uppercase tracking-wider">
                Intrinsic to Market Cap <br/>
                <span className="text-gray-400 dark:text-[#889691] font-normal">(Value | Rank)</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#161C1A] divide-y divide-gray-200 dark:divide-[#161C1A]">
            {rankingLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-[#889691]">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-[#2A332F] border-t-[#144D37] animate-spin" />
                    <span>Generating ranking table…</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.ticker} className="hover:bg-gray-50 dark:hover:bg-[#1C2220] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#144D37] dark:bg-[#144D37] text-white font-bold text-sm">
                      {item.ranks.overall}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-[#E0E6E4]">{item.ticker}</div>
                    <div className="text-xs text-gray-500 dark:text-[#889691]">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-[#E0E6E4]">
                      {formatPercent(item.roic5YAvg)} 
                      <span className="text-gray-500 dark:text-[#889691] ml-1 text-xs">
                        (Rank: {item.ranks.roic})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-[#E0E6E4]">
                      {formatPercent(item.earningsYield)}
                      <span className="text-gray-500 dark:text-[#889691] ml-1 text-xs">
                        (Rank: {item.ranks.earnings})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-[#E0E6E4]">
                      {formatRatio(item.intrinsicToMarketCap)}
                      <span className="text-gray-500 dark:text-[#889691] ml-1 text-xs">
                        (Rank: {item.ranks.intrinsic})
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-[#889691]">
                  {rankingStats && rankingStats.sent > 0 && rankingStats.ranked === 0
                    ? `No ranked companies returned by the API for this filter (rejected ${rankingStats.rejected}/${rankingStats.sent}).`
                    : 'No companies found matching the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        )}
      
      <div className="mt-4 text-xs text-gray-500 dark:text-[#889691] bg-gray-50 dark:bg-[#1C2220] p-3 rounded">
        <p className="font-semibold mb-1 text-gray-700 dark:text-[#E0E6E4]">Methodology:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong className="text-gray-700 dark:text-[#E0E6E4]">Overall Rank:</strong> Calculated by summing the ranks of ROIC, Earnings Yield, and Intrinsic/Market Cap (Lowest sum = Rank 1).</li>
          <li><strong className="text-gray-700 dark:text-[#E0E6E4]">ROIC 5Y Avg:</strong> 5-year average Return on Invested Capital.</li>
          <li><strong className="text-gray-700 dark:text-[#E0E6E4]">Earnings Yield:</strong> (Net Income 5Y Avg / Shares Outstanding) / Stock Price.</li>
          <li><strong className="text-gray-700 dark:text-[#E0E6E4]">Intrinsic to Market Cap:</strong> Intrinsic Value / Current Market Cap.</li>
          <li>Values are updated daily from API.</li>
        </ul>
      </div>
    </div>
  );
};

export default TopPicks;

