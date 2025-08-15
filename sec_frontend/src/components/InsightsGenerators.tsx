import React from 'react';

interface InsightsGeneratorsProps {
  onContactClick?: () => void;
}

const InsightsGenerators: React.FC<InsightsGeneratorsProps> = ({ onContactClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1B5A7D] mb-4">Insights Generators (domain-specific)</h1>
          </div>

          {/* OPPORTUNITY Section */}
          <div className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="mt-16">
                <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6">OPPORTUNITY</h3>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg">
                    Insufficient or inaccurate or untimely data skews management decision making, leading to costly mistakes
                  </p>
                  <p className="text-lg">
                    Even if the data is available, it's hard to identify root cause or reasoning behind the data/trends
                  </p>
                  <p className="text-lg">
                    Decision makers waste up to <span className="font-bold text-[#1B5A7D]">80% of their time</span> for finding right data and information or generating right insights
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center">
                <img 
                  src="/wom.PNG" 
                  alt="Professional woman working at desk with laptop and documents" 
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>

          {/* SOLUTION / Services Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6 text-center">SOLUTION / SERVICES</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-xl mb-4">Example: Business Performance Dashboard and Insights Generator for all public companies</h4>
                <div className="bg-gray-100 rounded-lg p-4 border">
                  <div className="bg-white rounded p-3 mb-3">
                    <div className="space-y-2">
                      <div className="h-80 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src="/dash.PNG" 
                          alt="Dashboard interface" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="text-lg">
                  <span className="font-semibold text-[#1B5A7D]">Decision-specific Dashboard</span> with key performance metrics (by integrating relevant data from multiple systems, incl. OT, IT)
                </p>
                <p className="text-lg">
                  <span className="font-semibold text-[#1B5A7D]">Domain-specific knowledge base</span> by integrating data sourcing and defining relationships across data points for both structured and unstructured data
                </p>
                <p className="text-lg">
                  <span className="font-semibold text-[#1B5A7D]">AI-based insights generator</span> using AI agents, LLM tuning, external data APIs, and internal knowledge base
                </p>
              </div>
            </div>
          </div>

          {/* Impact Section */}
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="mt-16">
                <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6">IMPACT</h3>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg">
                    Significant value is created in any enterprise by optimal decision making and data/insights driven actions across the value chain and across all levels
                  </p>
                  <div className="space-y-2">
                    <p className="text-lg">• <span className="font-semibold text-[#1B5A7D]">Instant data analysis and insights/reasoning</span></p>
                    <p className="text-lg">• <span className="font-semibold text-[#1B5A7D]">4X speed improvement</span> in risk identification and compliances</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center">
                <img 
                  src="/impact.PNG"
                  alt="Industrial facility with safety equipment and machinery" 
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <div className="flex justify-center pt-6">
            <button 
              onClick={onContactClick}
              className="px-8 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-700 font-medium"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsGenerators; 