import React, { useState, useEffect, useRef } from 'react';
import baseUrl from './api';

interface Industry {
  industryId: number;
  industryName: string;
  label: string;
  countOfCompanies: number;
}

interface Company {
  ticker: string;
  name: string;
  [key: string]: any;
}

interface ReportData {
  reportType: string;
  company: {
    ticker: string;
    name: string;
  };
  industryName?: string;
  instructions: string;
}

interface ReportGenerationFormProps {
  onGenerate: (data: ReportData) => void;
  isLoading?: boolean;
  showInstructions?: boolean;
  showFormFields?: boolean;
}

const ReportGenerationForm: React.FC<ReportGenerationFormProps> = ({ onGenerate, isLoading = false, showInstructions = true, showFormFields = true }) => {
  // Form state
  const [reportType, setReportType] = useState<string>('company_performance_and_investment_thesis');
  const [directSearchValue, setDirectSearchValue] = useState<string>('');
  const [industryName, setIndustryName] = useState<string>(''); // For industry deep-dive
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [instructions, setInstructions] = useState<string>('');

  // Data state
  const [allIndustries, setAllIndustries] = useState<Industry[]>([]); // All available industries
  const [directSearchCompanies, setDirectSearchCompanies] = useState<Company[]>([]);
  const [showDirectSearchDropdown, setShowDirectSearchDropdown] = useState<boolean>(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState<boolean>(false);

  // Refs for dropdowns
  const directSearchRef = useRef<HTMLDivElement>(null);
  const industrySearchRef = useRef<HTMLDivElement>(null);

  // Report type options - matching API endpoint values
  const reportTypes = [
    { value: 'company_performance_and_investment_thesis', label: 'Company performance & investment thesis' },
    { value: 'industry_deep_drive', label: 'Industry deep-dive' },
    { value: 'custom_instructions', label: 'Custom instructions' },
  ];

  // Fetch all companies for direct search on mount
  useEffect(() => {
    fetchAllCompanies();
  }, []);

  // Fetch all industries when report type is industry deep-dive
  useEffect(() => {
    if (reportType === 'industry_deep_drive' && allIndustries.length === 0) {
      fetchAllIndustries();
    }
  }, [reportType, allIndustries.length]);

  // Handle direct search input
  useEffect(() => {
    if (directSearchValue.trim().length > 0) {
      const filtered = directSearchCompanies.filter(
        (company) =>
          company.name.toLowerCase().includes(directSearchValue.toLowerCase()) ||
          company.ticker.toLowerCase().includes(directSearchValue.toLowerCase())
      );
      setShowDirectSearchDropdown(filtered.length > 0);
    } else {
      setShowDirectSearchDropdown(false);
    }
  }, [directSearchValue, directSearchCompanies]);

  // Handle industry search input (show dropdown when typing or focused)
  useEffect(() => {
    if (reportType === 'industry_deep_drive' && allIndustries.length > 0) {
      // Show dropdown if there's search text OR if user focused the input (when empty, show all)
      const hasText = industryName.trim().length > 0;
      // We'll control dropdown visibility from onFocus handler instead
      // This effect just ensures filtered results are ready
    }
  }, [industryName, allIndustries, reportType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (directSearchRef.current && !directSearchRef.current.contains(event.target as Node)) {
        setShowDirectSearchDropdown(false);
      }
      if (industrySearchRef.current && !industrySearchRef.current.contains(event.target as Node)) {
        setShowIndustryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAllIndustries = async () => {
    try {
      // Using the central industries endpoint
      const response = await fetch(`${baseUrl}/api/sec/central/industries`);
      if (!response.ok) throw new Error('Failed to fetch industries');
      const data = await response.json();
      // API returns { industries: [...] } structure, handle both formats
      const industries = Array.isArray(data) 
        ? data 
        : (data.industries || []);
      // Map to Industry interface format if needed
      const mappedIndustries = industries.map((ind: any) => ({
        industryId: ind.industryId || ind.name || ind.industryName,
        industryName: ind.industryName || ind.name || ind.label,
        label: ind.label || ind.industryName || ind.name,
        countOfCompanies: ind.countOfCompanies || 0
      }));
      setAllIndustries(mappedIndustries);
    } catch (error) {
      console.error('Error fetching industries:', error);
      setAllIndustries([]);
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/sec/central/companies`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setDirectSearchCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setDirectSearchCompanies([]);
    }
  };

  const handleDirectSearchSelect = (company: Company) => {
    setDirectSearchValue(`${company.name} (${company.ticker})`);
    setSelectedCompany(company);
    setShowDirectSearchDropdown(false);
  };

  const handleIndustrySelect = (industry: Industry) => {
    setIndustryName(industry.industryName);
    setShowIndustryDropdown(false);
  };

  const handleGenerate = () => {
    // Validation based on report type
    if (reportType === 'industry_deep_drive') {
      if (!industryName.trim()) {
        alert('Please enter an industry name');
        return;
      }
    } else if (reportType === 'custom_instructions') {
      if (!instructions.trim()) {
        alert('Please enter instructions');
        return;
      }
    } else {
      // Company selection required for other types
      if (!selectedCompany) {
        alert('Please select a company');
        return;
      }
    }

    const reportData: ReportData = {
      reportType,
      company: selectedCompany ? {
        ticker: selectedCompany.ticker,
        name: selectedCompany.name,
      } : { ticker: '', name: '' },
      industryName: reportType === 'industry_deep_drive' ? industryName : undefined,
      instructions,
    };

    onGenerate(reportData);
  };

  const filteredDirectSearch = directSearchCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(directSearchValue.toLowerCase()) ||
      company.ticker.toLowerCase().includes(directSearchValue.toLowerCase())
  ).slice(0, 10); // Limit to 10 results

  const filteredIndustries = industryName.trim().length > 0
    ? allIndustries.filter(
        (ind) => ind.industryName.toLowerCase().includes(industryName.toLowerCase())
      ).slice(0, 10)
    : allIndustries.slice(0, 20); // Show first 20 when no filter text

  // If only showing instructions, render just that
  if (showInstructions && !showFormFields) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Add any specific instructions, focus areas, KPIs to analyze, etc."
          rows={3}
          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-[#889691] resize-none"
        />
      </div>
    );
  }

  // If only showing form fields (without instructions), render that
  if (showFormFields && !showInstructions) {
    return (
      <div className="space-y-4">
        {/* Step 1 & 2: Report Type and Company Selection - Horizontal Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Step 1: Report Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Step 1 — Select report type</label>
            <label className="block text-xs text-gray-600 dark:text-[#889691] mb-1">Report type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

        {/* Step 2: Selection (Company or Industry) - Hidden for Custom Instructions */}
        {reportType !== 'custom_instructions' && (
          <div>
            {reportType === 'industry_deep_drive' ? (
              // Industry Name Input
              <>
                <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Step 2 — Enter industry</label>
                <div className="relative" ref={industrySearchRef}>
                  <label className="block text-xs text-gray-600 dark:text-[#889691] mb-1">Industry Name</label>
                  <input
                    type="text"
                    value={industryName}
                    onChange={(e) => {
                      setIndustryName(e.target.value);
                      setShowIndustryDropdown(allIndustries.length > 0);
                    }}
                    onFocus={() => {
                      if (allIndustries.length > 0) {
                        setShowIndustryDropdown(true);
                      }
                    }}
                    placeholder="e.g. Artificial Intelligence, EV, Retail"
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-[#889691]"
                  />
                  {showIndustryDropdown && filteredIndustries.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-300 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-y-auto">
                      {filteredIndustries.map((ind) => (
                        <button
                          key={ind.industryId}
                          onClick={() => handleIndustrySelect(ind)}
                          className="w-full px-3 py-1.5 text-sm text-left text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] transition-colors"
                        >
                          {ind.industryName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Company Selection
              <>
                <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Step 2 — Select company</label>
                <div className="relative" ref={directSearchRef}>
                  <label className="block text-xs text-gray-600 dark:text-[#889691] mb-1">Company</label>
                  <input
                    type="text"
                    value={directSearchValue}
                    onChange={(e) => setDirectSearchValue(e.target.value)}
                    onFocus={() => {
                      if (filteredDirectSearch.length > 0) {
                        setShowDirectSearchDropdown(true);
                      }
                    }}
                    placeholder="Type company name or ticker"
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-[#889691]"
                  />
                  {showDirectSearchDropdown && filteredDirectSearch.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-300 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-y-auto">
                      {filteredDirectSearch.map((company) => (
                        <button
                          key={company.ticker}
                          onClick={() => handleDirectSearchSelect(company)}
                          className="w-full px-3 py-1.5 text-sm text-left text-gray-900 dark:text-[#E0E6E4] hover:bg-gray-100 dark:hover:bg-[#1C2220] transition-colors"
                        >
                          {company.name} ({company.ticker})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Instructions - Right below selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">
            {reportType === 'custom_instructions' ? 'Step 2 — Instructions' : 'Instructions'}
        </label>
        <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add any specific instructions, focus areas, KPIs to analyze, etc."
            rows={3}
            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-[#889691] resize-none"
          />
        </div>

      {/* Generate Button */}
      <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-[#161C1A]">
        <button
          onClick={handleGenerate}
          disabled={
            isLoading || 
            (reportType === 'company_performance_and_investment_thesis' && !selectedCompany) || 
            (reportType === 'industry_deep_drive' && !industryName.trim()) ||
            (reportType === 'custom_instructions' && !instructions.trim())
          }
          className="px-4 py-1.5 text-sm bg-[#144D37] text-white rounded hover:bg-[#0F3A28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating Report...' : 'Generate'}
        </button>
      </div>
      </div>
    );
  }

  // Default: show everything (for backwards compatibility)
  return (
    <div className="p-4 xl:p-6 space-y-4">
      {/* Step 1 & 2: Report Type and Company Selection - Horizontal Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Step 1: Report Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Step 1 — Select report type</label>
          <label className="block text-xs text-gray-600 dark:text-[#889691] mb-1">Report type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Selection (Company or Industry) */}
        <div>
          {reportType === 'industry_deep_drive' ? (
            // Industry Name Input
            <>
              <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Step 2 — Enter industry</label>
              <div className="relative" ref={industrySearchRef}>
                <label className="block text-xs text-gray-600 dark:text-[#889691] mb-1">Industry Name</label>
                <input
                  type="text"
                  value={industryName}
                  onChange={(e) => {
                    setIndustryName(e.target.value);
                    setShowIndustryDropdown(allIndustries.length > 0);
                  }}
                  onFocus={() => {
                    if (allIndustries.length > 0) {
                      setShowIndustryDropdown(true);
                    }
                  }}
                  placeholder="e.g. Artificial Intelligence, EV, Retail"
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-[#889691]"
                />
                {showIndustryDropdown && filteredIndustries.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-300 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-y-auto">
                    {filteredIndustries.map((ind) => (
                      <button
                        key={ind.industryId}
                        onClick={() => handleIndustrySelect(ind)}
                        className="w-full px-3 py-1.5 text-sm text-left text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        {ind.industryName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            // Company Selection
            <>
              <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Step 2 — Select company</label>
              <div className="relative" ref={directSearchRef}>
                <label className="block text-xs text-gray-600 dark:text-[#889691] mb-1">Company</label>
                <input
                  type="text"
                  value={directSearchValue}
                  onChange={(e) => setDirectSearchValue(e.target.value)}
                  onFocus={() => {
                    if (filteredDirectSearch.length > 0) {
                      setShowDirectSearchDropdown(true);
                    }
                  }}
                  placeholder="Type company name or ticker"
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-[#889691]"
                />
                {showDirectSearchDropdown && filteredDirectSearch.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161C1A] border border-gray-300 dark:border-[#161C1A] rounded shadow-lg max-h-60 overflow-y-auto">
                    {filteredDirectSearch.map((company) => (
                      <button
                        key={company.ticker}
                        onClick={() => handleDirectSearchSelect(company)}
                        className="w-full px-3 py-1.5 text-sm text-left text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        {company.name} ({company.ticker})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step 3: Instructions */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-[#E0E6E4] mb-1">Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Add any specific instructions, focus areas, KPIs to analyze, etc."
          rows={3}
          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] rounded border border-gray-300 dark:border-[#161C1A] focus:outline-none focus:ring-1 focus:ring-blue-500 dark:placeholder-[#889691] resize-none"
        />
      </div>

      {/* Generate Button */}
      <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-[#161C1A]">
        <button
          onClick={handleGenerate}
          disabled={
            isLoading || 
            (reportType === 'company_performance_and_investment_thesis' && !selectedCompany) || 
            (reportType === 'industry_deep_drive' && !industryName.trim()) ||
            (reportType === 'custom_instructions' && !instructions.trim())
          }
          className="px-4 py-1.5 text-sm bg-[#144D37] text-white rounded hover:bg-[#0F3A28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating Report...' : 'Generate'}
        </button>
      </div>
    </div>
  );
};

export default ReportGenerationForm;

