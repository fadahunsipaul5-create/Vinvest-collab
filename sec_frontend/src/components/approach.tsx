import React from 'react';

interface ApproachProps {
  onClose?: () => void;
}

const Approach: React.FC<ApproachProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-0 right-0 text-2xl font-bold text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
          
          {/* Main Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#4A90A4] mb-4 leading-tight">
              OUR APPROACH TO OPTIMAL DECISION-MAKING AND<br />
              ACCELERATED VALUE CREATION
            </h1>
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            
            {/* Left Section - Three Pillars */}
            <div className="lg:w-1/3 space-y-6">
              {/* Data Visualization & Insights Generation */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#4A90A4] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#4A90A4] mb-2">
                    Data Visualization &<br />
                    Insights Generation
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Create data transparency by<br />
                    integrating OT, IT, ET data for<br />
                    data driven decision making
                  </p>
                </div>
              </div>

              {/* Process optimization */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#4A90A4] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#4A90A4] mb-2">
                    Process<br />
                    optimization
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Enable system-level decision<br />
                    making across functions,<br />
                    operation sites & value-chain
                  </p>
                </div>
              </div>

              {/* Superior Decisions / Agentization */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#4A90A4] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#4A90A4] mb-2">
                    Superior Decisions /<br />
                    Agentization
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Automate decision making<br />
                    and actions or develop co-<br />
                    pilots to enhance decisioning
                  </p>
                </div>
              </div>
            </div>

            {/* Center Section - From-To Flow */}
            <div className="lg:w-1/3 space-y-8">
              <div className="text-center">
                <div className="flex justify-center items-center space-x-8 mb-8">
                  <h2 className="text-xl font-bold text-[#4A90A4]">From</h2>
                  <h2 className="text-xl font-bold text-[#4A90A4]">To</h2>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Flow 1 */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-4 h-4 bg-[#4A90A4] rounded-full"></div>
                    <div className="flex-1 h-0.5 bg-[#4A90A4] mx-4"></div>
                    <div className="w-4 h-4 bg-[#4A90A4] rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Single source of<br />
                      truth across OT, IT,<br />
                      and ET
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Digital Twins (e.g., 3D plant<br />
                      model) with GenAI to query<br />
                      data and get instant insights
                    </p>
                  </div>
                </div>

                {/* Flow 2 */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-4 h-4 bg-[#4A90A4] rounded-full"></div>
                    <div className="flex-1 h-0.5 bg-[#4A90A4] mx-4"></div>
                    <div className="w-4 h-4 bg-[#4A90A4] rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Optimized decisions<br />
                      across two or more<br />
                      functions
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Dynamic enterprise<br />
                      (business / ops decisions<br />
                      optimized across enterprise)
                    </p>
                  </div>
                </div>

                {/* Flow 3 */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-4 h-4 bg-[#4A90A4] rounded-full"></div>
                    <div className="flex-1 h-0.5 bg-[#4A90A4] mx-4"></div>
                    <div className="w-4 h-4 bg-[#4A90A4] rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      One/two optimal<br />
                      actions taken by AI<br />
                      agents
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Most actions are taken by<br />
                      AI agents with necessary<br />
                      human interventions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Benefits */}
            <div className="lg:w-1/3 relative">
              <div className="absolute left-0 top-0 w-full h-full">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M5 0 Q15 50 5 100" stroke="#4A90A4" strokeWidth="1" fill="none"/>
                </svg>
              </div>
              <div className="pl-8">
                <div className="p-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    These efforts (for<br />
                    select use cases or at an<br />
                    enterprise-level) will<br />
                    enable you to make<br />
                    optimal, value-driven<br />
                    decisions and actions<br />
                    across the value chain<br />
                    and at all levels and<br />
                    drive significant business<br />
                    value (e.g., ROIC*)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="bg-[#9FC5E8] py-4 px-8 rounded-lg">
            <p className="text-[#4A90A4] font-bold text-lg text-center">
              We have built capabilities and delivery partner network to support across your digital/AI evolution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approach; 