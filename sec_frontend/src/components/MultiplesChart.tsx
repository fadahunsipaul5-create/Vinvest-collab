import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Label,
  LabelList,
  Cell,
  ReferenceArea
} from 'recharts';
import { loadMultiplesDataForTickers, calculateMultiple, getNumericValue, MultiplesData } from '../utils/multiplesDataLoader';
import baseUrl from './api';

interface MultiplesChartProps {
  className?: string;
  initialCompany?: string; // Ticker from parent component
}

interface CompanyTicker {
  ticker: string;
  name: string;
  display_name?: string;
}

const YEAR_PERIODS = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y', '15Y'];

const DENOMINATOR_OPTIONS = [
  'GrossMargin',
  'OperatingIncome',
  'PretaxIncome',
  'NetIncome',
  'Revenue',
  'EBITAAdjusted',
  'EBITDAAdjusted',
  'NOPAT'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-[#161C1A] border border-gray-300 dark:border-[#161C1A] rounded p-2 shadow-lg text-gray-900 dark:text-[#E0E6E4]">
        <p className="font-semibold">{data.ticker}</p>
        {data.revenueGrowth !== undefined && (
          <p className="text-xs">Revenue Growth: {typeof data.revenueGrowth === 'number' ? data.revenueGrowth.toFixed(2) : data.revenueGrowth}%</p>
        )}
        {data.roic !== undefined && (
          <p className="text-xs">ROIC: {typeof data.roic === 'number' ? data.roic.toFixed(2) : data.roic}%</p>
        )}
        {data.multiple !== undefined && (
          <p className="text-xs">Multiple: {typeof data.multiple === 'number' ? data.multiple.toFixed(2) : data.multiple}x</p>
        )}
      </div>
    );
  }
  return null;
};

interface MultiplesSelectorsProps {
  numerator: string;
  denominator: string;
  viewMode: 'valueQuadrants' | 'peerRanks';
  onNumeratorChange: (value: string) => void;
  onDenominatorChange: (value: string) => void;
  onViewModeChange: (mode: 'valueQuadrants' | 'peerRanks') => void;
}

const MultiplesSelectors: React.FC<MultiplesSelectorsProps> = ({
  numerator,
  denominator,
  viewMode,
  onNumeratorChange,
  onDenominatorChange,
  onViewModeChange
}) => {
  return (
    <div className="flex flex-nowrap items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-[#889691]">Numerator</div>
        <select
          value={numerator}
          onChange={(e) => onNumeratorChange(e.target.value)}
          className="px-3 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-[#161C1A] bg-white dark:bg-[#161C1A] text-gray-700 dark:text-[#E0E6E4] focus:outline-none focus:ring-1 focus:ring-[#1B5A7D]"
        >
          <option value="EV foundational">EV foundational</option>
          <option value="Market Cap">Market Cap</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-[#889691]">Denominator</div>
        <select
          value={denominator}
          onChange={(e) => onDenominatorChange(e.target.value)}
          className="px-3 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-[#161C1A] bg-white dark:bg-[#161C1A] text-gray-700 dark:text-[#E0E6E4] focus:outline-none focus:ring-1 focus:ring-[#1B5A7D]"
        >
          {DENOMINATOR_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt === 'NOPAT' ? 'NOPAT' : opt}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewModeChange('valueQuadrants')}
          className={`px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors whitespace-nowrap ${viewMode === 'valueQuadrants'
            ? 'bg-[#144D37] text-white border-[#144D37]'
            : 'border-gray-300 dark:border-[#161C1A] bg-gray-50 dark:bg-[#1C2220] text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#161C1A]'
            }`}
        >
          Value Quadrants
        </button>
        <button
          onClick={() => onViewModeChange('peerRanks')}
          className={`px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors whitespace-nowrap ${viewMode === 'peerRanks'
            ? 'bg-[#144D37] text-white border-[#144D37]'
            : 'border-gray-300 dark:border-[#161C1A] bg-gray-50 dark:bg-[#1C2220] text-gray-700 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#161C1A]'
            }`}
        >
          Peer Ranks
        </button>
      </div>
    </div>
  );
};

const MultiplesChart: React.FC<MultiplesChartProps> = ({ className = '', initialCompany }) => {
  // Show company selector
  const SHOW_COMPANY_SELECTOR = true;

  const [viewMode, setViewMode] = useState<'valueQuadrants' | 'peerRanks'>('valueQuadrants');
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyTicker[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Year period selection state
  const [selectedYears, setSelectedYears] = useState('5Y');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Numerator and denominator selection
  const [numerator, setNumerator] = useState('EV foundational');
  const [denominator, setDenominator] = useState('NOPAT');

  // Loaded multiples data
  const [multiplesData, setMultiplesData] = useState<{ [ticker: string]: MultiplesData } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Available companies from API
  const [availableCompanies, setAvailableCompanies] = useState<CompanyTicker[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // Real Market Cap Data (fetched from external API)
  const [realMarketCaps, setRealMarketCaps] = useState<Record<string, number>>({});

  // Fetch real market cap for selected companies
  useEffect(() => {
    // Only fetch if numerator is Market Cap and we have selected companies
    if (numerator !== 'Market Cap' || selectedCompanies.length === 0) return;

    const fetchMarketCaps = async () => {
      const newMarketCaps: Record<string, number> = { ...realMarketCaps };
      let hasUpdates = false;

      await Promise.all(selectedCompanies.map(async (company) => {
        // Skip if we already have it (optional optimization, maybe we want to refresh?)
        // For now, let's fetch to ensure freshness
        try {
          const response = await fetch(`${baseUrl}/api/sec/special_metrics/market_cap/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker: company.ticker }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.market_cap) {
              newMarketCaps[company.ticker] = data.market_cap;
              hasUpdates = true;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch market cap for ${company.ticker}`, err);
        }
      }));

      if (hasUpdates) {
        setRealMarketCaps(newMarketCaps);
      }
    };

    fetchMarketCaps();
  }, [selectedCompanies, numerator]);

  // Fetch companies from API
  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/companies`);
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`);
      }
      const data = await response.json();

      // Handle both paginated (results) and non-paginated responses
      const companiesList = data.results || data;

      const companies: CompanyTicker[] = [];
      companiesList.forEach((company: any) => {
        const ticker = company.ticker;
        // Central API returns {ticker, name}
        const display_name = company.display_name || company.name || company.ticker;
        const name = company.name || company.ticker;
        companies.push({ ticker, name, display_name });
      });

      setAvailableCompanies(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Load companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Load data on mount
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-select company when initialCompany prop changes
  useEffect(() => {
    if (initialCompany && availableCompanies.length > 0) {
      const initialTicker = initialCompany.split(':')[0].trim().toUpperCase();
      const company = availableCompanies.find(c => c.ticker.toUpperCase() === initialTicker);
      if (company) {
        // Set the company as the selection (replacing previous)
        setSelectedCompanies([company]);
      } else if (initialTicker) {
        // Fallback: allow selection even if company list hasn't fully populated or doesn't contain it
        setSelectedCompanies([{ ticker: initialTicker, name: initialTicker, display_name: initialTicker }]);
      }
    }
  }, [initialCompany, availableCompanies]);

  // Load multiples data on-demand for selected companies (much faster than preloading all)
  useEffect(() => {
    if (selectedCompanies.length === 0) return;

    const tickersToLoad = selectedCompanies
      .map(c => c.ticker.toUpperCase())
      .filter(t => !multiplesData || !multiplesData[t]);

    if (tickersToLoad.length === 0) return;

    let cancelled = false;
    setIsLoading(true);
    loadMultiplesDataForTickers(tickersToLoad)
      .then((data) => {
        if (cancelled) return;
        setMultiplesData(prev => ({ ...(prev || {}), ...data }));
      })
      .catch((error) => {
        console.error('Failed to load multiples data:', error);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCompanies, multiplesData]);

  // Helper function to get denominator key
  const getDenominatorKey = (denominator: string): string => {
    if (denominator === 'NOPAT') return 'netOperatingProfitAfterTaxes';
    if (denominator === 'GrossMargin') return 'grossMargin';
    if (denominator === 'OperatingIncome') return 'operatingIncome';
    if (denominator === 'PretaxIncome') return 'pretaxIncome';
    if (denominator === 'NetIncome') return 'netIncome';
    if (denominator === 'Revenue') return 'revenue';
    if (denominator === 'EBITAAdjusted') return 'ebitaAdjusted';
    if (denominator === 'EBITDAAdjusted') return 'ebitdaAdjusted';
    return denominator.charAt(0).toLowerCase() + denominator.slice(1);
  };

  // Data key: loader stores by UPPERCASE ticker; look up case-insensitively
  const getDataByTicker = (ticker: string) => multiplesData?.[ticker.toUpperCase()] ?? multiplesData?.[ticker];

  // Calculate data for simple chart with useMemo
  const simpleData = useMemo(() => {
    if (!multiplesData) return [];

    return selectedCompanies.map(company => {
      const data = getDataByTicker(company.ticker);
      // Even if internal data is missing, we might have real market cap, but we still need denominator from internal data.
      // So if no internal data, we can't calculate multiple (denominator missing).
      if (!data) return { ticker: company.ticker, value: 0 };

      // Get numerator
      let numValue = numerator === 'EV foundational'
        ? data.numerators.enterpriseValue_Fundamental
        : data.numerators.marketCap_Fundamental;

      // Override with real market cap if available and selected
      if (numerator === 'Market Cap' && realMarketCaps[company.ticker]) {
        numValue = realMarketCaps[company.ticker];
      }

      // Get denominator
      const denKey = getDenominatorKey(denominator);
      const denValue = (data.denominators[selectedYears] as any)?.[denKey];

      // Debug logging for verification
      console.log(`[${company.ticker}] Simple Chart Calculation:`, {
        numerator,
        numValue,
        denominator,
        denKey,
        selectedYears,
        denValue,
        rawCalculation: numValue && denValue ? Number(numValue) / Number(denValue) : null,
        dataStructure: {
          numerators: data.numerators,
          denominators: data.denominators[selectedYears]
        }
      });

      // Calculate multiple
      const multiple = calculateMultiple(numValue, denValue);

      // Handle different return types
      if (multiple === null) return { ticker: company.ticker, value: 0 };
      if (multiple === 'N/A' || multiple === 'inf') return { ticker: company.ticker, value: 0 };
      if (typeof multiple !== 'number') return { ticker: company.ticker, value: 0 };

      return {
        ticker: company.ticker,
        value: Math.round(multiple * 100) / 100
      };
    });
  }, [multiplesData, selectedCompanies, numerator, denominator, selectedYears, realMarketCaps]);

  // Calculate data for holistic chart with useMemo
  const holisticData = useMemo(() => {
    if (!multiplesData) return [];

    return selectedCompanies
      .map(company => {
        const data = getDataByTicker(company.ticker);
        if (!data) return null;

        // Get revenue growth
        const revenueGrowth = getNumericValue(data.revenueGrowth[selectedYears]);

        // Get ROIC (use excluding goodwill)
        const roic = getNumericValue(data.roicMetrics[selectedYears]?.excludingGoodwill);

        // Calculate multiple
        let numValue = numerator === 'EV foundational'
          ? data.numerators.enterpriseValue_Fundamental
          : data.numerators.marketCap_Fundamental;

        // Override with real market cap if available and selected
        if (numerator === 'Market Cap' && realMarketCaps[company.ticker]) {
          numValue = realMarketCaps[company.ticker];
        }

        const denKey = getDenominatorKey(denominator);
        const denValue = (data.denominators[selectedYears] as any)?.[denKey];
        const multiple = calculateMultiple(numValue, denValue);

        // Debug logging for holistic chart
        console.log(`[${company.ticker}] Holistic Chart Calculation:`, {
          selectedYears,
          revenueGrowth: {
            raw: data.revenueGrowth[selectedYears],
            parsed: revenueGrowth
          },
          roic: {
            raw: data.roicMetrics[selectedYears]?.excludingGoodwill,
            parsed: roic
          },
          multiple: {
            numerator: numValue,
            denominator: denValue,
            calculated: multiple
          },
          dataStructure: {
            revenueGrowth: data.revenueGrowth,
            roicMetrics: data.roicMetrics[selectedYears]
          }
        });

        // Filter out invalid data points (missing ROIC or revenue growth)
        if (revenueGrowth === null || roic === null) return null;
        if (!isFinite(revenueGrowth) || !isFinite(roic)) return null;

        const multipleValue = typeof multiple === 'number' ? Math.round(multiple * 100) / 100 : 0;

        return {
          ticker: company.ticker,
          revenueGrowth,
          roic,
          multiple: multipleValue
        };
      })
      .filter(item => item !== null); // Remove invalid data points
  }, [multiplesData, selectedCompanies, numerator, denominator, selectedYears, realMarketCaps]);

  // Calculate bounds for quadrants
  const bounds = useMemo(() => {
    if (holisticData.length === 0) return { xMid: 15, yMid: 0, xMax: 30, yMax: 20, xMin: 0, yMin: -20 };

    const roics = holisticData.map(d => d.roic);
    const growths = holisticData.map(d => d.revenueGrowth);

    // Use fixed midpoints or data-driven ones?
    // ROIC > 15% is usually high quality. Growth > 0% is growing.
    const xMid = 15;
    const yMid = 0;

    const xMax = Math.max(30, Math.max(...roics) * 1.2);
    const xMin = Math.min(0, Math.min(...roics) * 1.2);
    const yMax = Math.max(10, Math.max(...growths) * 1.2);
    const yMin = Math.min(-10, Math.min(...growths) * 1.2);

    return { xMid, yMid, xMax, yMax, xMin, yMin };
  }, [holisticData]);

  return (
    <div className={`bg-white dark:bg-[#161C1A] rounded-lg dark:border-[#161C1A] p-3 sm:p-4 ${className}`}>
      {/* Header and controls: Numerator, Denominator, Value Quadrants, Peer Ranks on one line */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-nowrap items-center gap-3 sm:gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <MultiplesSelectors
            numerator={numerator}
            denominator={denominator}
            viewMode={viewMode}
            onNumeratorChange={setNumerator}
            onDenominatorChange={setDenominator}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Company Multi-Select Search – elevated so dropdown appears above chart */}
        {SHOW_COMPANY_SELECTOR && (
          <div className="relative z-30" ref={companyDropdownRef}>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-[#161C1A] rounded min-h-[42px] bg-white dark:bg-[#1C2220]">
              {selectedCompanies.map((company, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-[#161C1A] dark:text-[#E0E6E4] rounded text-sm"
                >
                  {company.display_name || company.name || company.ticker}
                  <button
                    onClick={() => setSelectedCompanies(companies =>
                      companies.filter((_, i) => i !== index)
                    )}
                    className="text-gray-400 hover:text-gray-600 dark:text-[#889691] dark:hover:text-[#E0E6E4]"
                  >
                    <svg
                      className="w-3 h-3"
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
                </div>
              ))}
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                onFocus={() => setShowCompanyDropdown(true)}
                placeholder="Search companies... (select to show bubbles on graph)"
                className="flex-1 min-w-[100px] outline-none text-xs sm:text-sm bg-transparent dark:text-[#E0E6E4] dark:placeholder-[#889691]"
              />
            </div>

            {showCompanyDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-xl max-h-60 overflow-auto">
                {companiesLoading ? (
                  <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-[#889691]">Loading companies...</div>
                ) : availableCompanies.length === 0 ? (
                  <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-[#889691]">No companies available</div>
                ) : (
                  availableCompanies
                    .filter(company => {
                      return (
                        !selectedCompanies.some(c => c.ticker === company.ticker) &&
                        (company.ticker.toLowerCase().includes(companyInput.toLowerCase()) ||
                          company.name.toLowerCase().includes(companyInput.toLowerCase()))
                      );
                    })
                    .map(company => (
                      <div
                        key={company.ticker}
                        onClick={() => {
                          if (!selectedCompanies.some(c => c.ticker === company.ticker)) {
                            setSelectedCompanies([...selectedCompanies, company]);
                          }
                          setCompanyInput('');
                          setShowCompanyDropdown(false);
                        }}
                        className="px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-[#1C2220] dark:text-[#E0E6E4] cursor-pointer"
                      >
                        {company.name} ({company.ticker})
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart: Value Quadrants (Revenue Growth vs ROIC) or Peer Ranks – always visible */}
      <div className="mt-4 h-[380px] sm:h-[460px] relative">
        {isLoading && selectedCompanies.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#161C1A]/80 z-10 text-gray-500 dark:text-[#889691]">
            Loading data...
          </div>
        ) : null}
        {viewMode === 'peerRanks' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simpleData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="ticker" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}x`} />
                <Bar dataKey="value" fill="#1B5A7D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          // Value Quadrants (Scatter Chart) – graph only, no overlay prompts
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 28, right: 20, left: 6, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  type="number"
                  dataKey="roic"
                  name="ROIC"
                  domain={[bounds.xMin, bounds.xMax]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                >
                  <Label
                    value={`ROIC (${selectedYears})`}
                    position="insideBottomRight"
                    offset={0}
                    dy={8}
                    style={{ fontSize: '12px', textAnchor: 'end', fontWeight: 600 }}
                  />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="revenueGrowth"
                  name="Revenue Growth"
                  domain={[bounds.yMin, bounds.yMax]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                >
                  <Label
                    value="Revenue Growth"
                    angle={-90}
                    position="insideLeft"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                </YAxis>

                {/* Quadrant Backgrounds (design: Yellow, Green, Red, Blue) */}
                <ReferenceArea x1={bounds.xMin} x2={bounds.xMid} y1={bounds.yMid} y2={bounds.yMax} fill="#fef3c7" fillOpacity={0.5} /> {/* Yellow: The Growth Chasers */}
                <ReferenceArea x1={bounds.xMid} x2={bounds.xMax} y1={bounds.yMid} y2={bounds.yMax} fill="#dcfce7" fillOpacity={0.5} /> {/* Green: The Elite Compounders */}
                <ReferenceArea x1={bounds.xMin} x2={bounds.xMid} y1={bounds.yMin} y2={bounds.yMid} fill="#fee2e2" fillOpacity={0.5} /> {/* Red: The Value Traps */}
                <ReferenceArea x1={bounds.xMid} x2={bounds.xMax} y1={bounds.yMin} y2={bounds.yMid} fill="#dbeafe" fillOpacity={0.5} /> {/* Blue: The Moat Kings */}

                {/* Quadrant Labels – visible prompts (Revenue Growth vs ROIC) */}
                <ReferenceArea x1={bounds.xMin} x2={bounds.xMid} y1={bounds.yMid} y2={bounds.yMax} fill="transparent">
                  <Label value="The Growth Chasers" position="center" style={{ fill: '#92400e', opacity: 0.85, fontSize: '13px', fontWeight: 'bold' }} />
                </ReferenceArea>
                <ReferenceArea x1={bounds.xMid} x2={bounds.xMax} y1={bounds.yMid} y2={bounds.yMax} fill="transparent">
                  <Label value="The Elite Compounders" position="center" style={{ fill: '#166534', opacity: 0.85, fontSize: '13px', fontWeight: 'bold' }} />
                </ReferenceArea>
                <ReferenceArea x1={bounds.xMin} x2={bounds.xMid} y1={bounds.yMin} y2={bounds.yMid} fill="transparent">
                  <Label value="The Value Traps" position="center" style={{ fill: '#991b1b', opacity: 0.85, fontSize: '13px', fontWeight: 'bold' }} />
                </ReferenceArea>
                <ReferenceArea x1={bounds.xMid} x2={bounds.xMax} y1={bounds.yMin} y2={bounds.yMid} fill="transparent">
                  <Label value="The Moat Kings" position="center" style={{ fill: '#1e40af', opacity: 0.85, fontSize: '13px', fontWeight: 'bold' }} />
                </ReferenceArea>

                <Tooltip content={CustomTooltip} />
                {/* Bubbles: size = value of multiple (higher value = bigger bubble); dots very visible; light labels */}
                <Scatter data={holisticData} fill="#1B5A7D" fillOpacity={0.95} stroke="#0d3d52" strokeWidth={2}>
                  <LabelList
                    dataKey="ticker"
                    position="top"
                    offset={6}
                    style={{ fontSize: 10, fill: '#64748b', opacity: 0.9 }}
                  />
                  {holisticData.map((entry, index) => {
                    const maxMultiple = Math.max(...holisticData.map(d => d.multiple), 1);
                    const minR = 14;
                    const maxR = 48;
                    const size = holisticData.length === 1
                      ? 24
                      : minR + (entry.multiple / maxMultiple) * (maxR - minR);
                    return <Cell key={`cell-${index}`} r={Math.max(minR, Math.min(maxR, size))} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Custom Y-axis Label with Year Selector */}
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                left: '20%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span className="text-xs font-medium text-gray-700 dark:text-[#E0E6E4]">Revenue Growth</span>

              {/* Year Selector Dropdown */}
              <div ref={yearDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="text-xs font-medium text-[#1B5A7D] dark:text-[#144D37] bg-white dark:bg-[#1C2220] px-2 py-1 rounded border border-gray-300 dark:border-[#161C1A] hover:bg-gray-50 dark:hover:bg-[#161C1A] flex items-center gap-1"
                >
                  ({selectedYears})
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showYearDropdown && (
                  <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#161C1A] border border-gray-200 dark:border-[#161C1A] rounded shadow-lg z-20">
                    {YEAR_PERIODS.map(period => (
                      <div
                        key={period}
                        onClick={() => {
                          setSelectedYears(period);
                          setShowYearDropdown(false);
                        }}
                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1C2220] whitespace-nowrap ${selectedYears === period ? 'bg-[#E5F0F6] dark:bg-[#144D37]/30 text-[#1B5A7D] dark:text-[#144D37]' : 'text-gray-700 dark:text-[#E0E6E4]'
                          }`}
                      >
                        {period}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplesChart;


