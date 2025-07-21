import React from 'react';

const ApproachToValueCreation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1B5A7D] mb-4">OUR APPROACH TO OPTIMAL DECISION-MAKING AND ACCELERATED VALUE CREATION</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Pillars Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6">Pillars</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#1B5A7D] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-lg">👁️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1B5A7D] mb-2">Data Visualization & Insights Generation</h3>
                    <p className="text-gray-700">Create <strong>data transparency</strong> by integrating OT, IT, ET data for data driven decision making</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#1B5A7D] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-lg">⚙️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1B5A7D] mb-2">Process optimization</h3>
                    <p className="text-gray-700">Enable <strong>system-level decision making</strong> across functions, operation sites & value-chain</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#1B5A7D] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-lg">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1B5A7D] mb-2">Superior Decisions / Agentization</h3>
                    <p className="text-gray-700">Automate decision making and actions or develop co-pilots to enhance decisioning</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transformations Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6">Transformations</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-red-100 px-3 py-1 rounded">
                      <span className="text-red-800 font-medium text-sm">From</span>
                    </div>
                    <svg className="w-6 h-6 text-[#1B5A7D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="bg-green-100 px-3 py-1 rounded">
                      <span className="text-green-800 font-medium text-sm">To</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p className="text-gray-700">Single source of truth across OT, IT, and ET</p>
                    <p className="text-gray-700">Digital Twins (e.g., 3D plant model) with GenAI to query data and get instant insights</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-red-100 px-3 py-1 rounded">
                      <span className="text-red-800 font-medium text-sm">From</span>
                    </div>
                    <svg className="w-6 h-6 text-[#1B5A7D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="bg-green-100 px-3 py-1 rounded">
                      <span className="text-green-800 font-medium text-sm">To</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p className="text-gray-700">Optimized decisions across two or more functions</p>
                    <p className="text-gray-700">Dynamic enterprise (business / ops decisions optimized across enterprise)</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-red-100 px-3 py-1 rounded">
                      <span className="text-red-800 font-medium text-sm">From</span>
                    </div>
                    <svg className="w-6 h-6 text-[#1B5A7D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="bg-green-100 px-3 py-1 rounded">
                      <span className="text-green-800 font-medium text-sm">To</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p className="text-gray-700">One/two optimal actions taken by AI agents</p>
                    <p className="text-gray-700">Most actions are taken by AI agents with necessary human interventions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6">Benefits</h2>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <p className="text-gray-700 leading-relaxed">
                  These efforts (for select use cases or at an enterprise-level) will enable you to make optimal, value-driven decisions and actions across the value chain and at all levels and drive significant business value (e.g., ROIC*)
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#1B5A7D] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Enhanced decision-making capabilities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#1B5A7D] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Improved operational efficiency</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#1B5A7D] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Increased ROI and business value</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-[#1B5A7D] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Competitive advantage through technology</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <div className="flex justify-center pt-6">
            <button className="px-8 py-3 bg-[#1B5A7D] text-white rounded-lg hover:bg-[#164964] transition-colors font-medium">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproachToValueCreation; 