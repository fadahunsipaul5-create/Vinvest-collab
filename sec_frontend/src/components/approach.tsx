import React from 'react';

interface ApproachProps {
  onClose?: () => void;
}

const Approach: React.FC<ApproachProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white py-8">
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
            <h1 className="text-4xl font-bold text-[#1B5A7D] mb-4">
              OUR APPROACH TO OPTIMAL DECISION-MAKING AND ACCELERATED VALUE CREATION
            </h1>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Section - Pillars */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6">Pillars</h2>
              
              <div className="space-y-6">
                {/* Data Visualization & Insights Generation */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#1B5A7D] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">👁️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1B5A7D] mb-2">
                      Data Visualization & Insights Generation
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Create data transparency by integrating OT, IT, ET data for data driven decision making
                    </p>
                  </div>
                </div>

                {/* Process optimization */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#1B5A7D] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1B5A7D] mb-2">
                      Process optimization
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Enable system-level decision making across functions, operation sites & value-chain
                    </p>
                  </div>
                </div>

                {/* Superior Decisions / Agentization */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#1B5A7D] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1B5A7D] mb-2">
                      Superior Decisions / Agentization
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Automate decision making and actions or develop co-pilots to enhance decisioning
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Section - From-To Transformations */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6">From-To Transformations</h2>
              
              <div className="space-y-8">
                {/* Transformation 1 */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#1B5A7D] text-white px-4 py-2 rounded-lg">
                      <span className="font-semibold">From</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#1B5A7D] rounded-full"></div>
                      <div className="w-16 h-0.5 bg-[#1B5A7D]"></div>
                      <div className="w-3 h-3 bg-[#1B5A7D] rounded-full"></div>
                    </div>
                    <div className="bg-[#1B5A7D] text-white px-4 py-2 rounded-lg">
                      <span className="font-semibold">To</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Single source of truth across OT, IT, and ET
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Digital Twins (e.g., 3D plant model) with GenAI to query data and get instant insights
                    </p>
                  </div>
                </div>

                {/* Transformation 2 */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#1B5A7D] text-white px-4 py-2 rounded-lg">
                      <span className="font-semibold">From</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#1B5A7D] rounded-full"></div>
                      <div className="w-16 h-0.5 bg-[#1B5A7D]"></div>
                      <div className="w-3 h-3 bg-[#1B5A7D] rounded-full"></div>
                    </div>
                    <div className="bg-[#1B5A7D] text-white px-4 py-2 rounded-lg">
                      <span className="font-semibold">To</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Optimized decisions across two or more functions
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Dynamic enterprise (business / ops decisions optimized across enterprise)
                    </p>
                  </div>
                </div>

                {/* Transformation 3 */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#1B5A7D] text-white px-4 py-2 rounded-lg">
                      <span className="font-semibold">From</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#1B5A7D] rounded-full"></div>
                      <div className="w-16 h-0.5 bg-[#1B5A7D]"></div>
                      <div className="w-3 h-3 bg-[#1B5A7D] rounded-full"></div>
                    </div>
                    <div className="bg-[#1B5A7D] text-white px-4 py-2 rounded-lg">
                      <span className="font-semibold">To</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      One/two optimal actions taken by AI agents
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Most actions are taken by AI agents with necessary human interventions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Benefits */}
            <div className="space-y-8 border-l-2 border-[#1B5A7D] pl-8">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6">Benefits</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 text-sm leading-relaxed">
                  These efforts (for select use cases or at an enterprise-level) will enable you to make optimal, value-driven decisions and actions across the value chain and at all levels and drive significant business value (e.g., ROIC*)
                </p>
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <div className="flex justify-center mt-12">
            <button className="px-8 py-3 bg-gray-300 text-[#1B5A7D] rounded-lg hover:bg-gray-400 transition-colors font-bold">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approach; 