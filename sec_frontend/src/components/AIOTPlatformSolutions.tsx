import React from 'react';

interface AIOTPlatformSolutionsProps {
  onContactClick?: () => void;
}

const AIOTPlatformSolutions: React.FC<AIOTPlatformSolutionsProps> = ({ onContactClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1B5A7D] mb-4">AIOT Platform & Solutions</h1>
          </div>

          {/* OPPORTUNITY Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6">OPPORTUNITY</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Operational Insights & Decisions</h4>
                  <p className="text-lg">Gain insights into asset performance, supply chain dynamics, and consumer behavior by integrating OT/sensor data with AI analytics.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Operations Optimization & Efficiency</h4>
                  <p className="text-lg">System-level optimization, predictive maintenance, real-time quality control, and automated process optimization to reduce downtime and operational costs.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Safety & Risk Mitigation</h4>
                  <p className="text-lg">Monitor environmental conditions, equipment health, and human behavior in hazardous settings to enable proactive alerts and automated responses for enhanced safety.</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                <img 
                  src="/man.PNG" 
                  alt="Professional person working in operational environment" 
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Solution / Platform Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6 text-center">Solution / Platform</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AIOT Platform Diagram */}
              <div className="flex justify-center">
                <div className="relative w-80 h-80">
                  {/* Central Circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#1B5A7D] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                  
                  {/* Platform Title */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20 text-center">
                    <p className="text-sm font-semibold text-[#1B5A7D]">AIOT Platform: an end-to-end integrated</p>
                    <p className="text-sm font-semibold text-[#1B5A7D]">platform for global AIOT ecosystem</p>
                  </div>

                  {/* Compute Nodes */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">☀️</span>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-12 text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">Compute Nodes</p>
                  </div>

                  {/* AI & ML Integrations */}
                  <div className="absolute top-1/4 right-0 transform translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">🔧</span>
                  </div>
                  <div className="absolute top-1/4 right-0 transform translate-x-1/2 -translate-y-1/2 mt-10 text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">AI & ML Integrations</p>
                  </div>

                  {/* Edge Computing */}
                  <div className="absolute bottom-1/4 right-0 transform translate-x-1/2 translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">🏭</span>
                  </div>
                  <div className="absolute bottom-1/4 right-0 transform translate-x-1/2 translate-y-[270%] text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">Edge Computing</p>
                  </div>

                  {/* Data Management */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">🖥️</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[270%] text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">Data Management</p>
                  </div>

                  {/* IoT Integration */}
                  <div className="absolute bottom-1/4 left-0 transform -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">🌐</span>
                  </div>
                  <div className="absolute bottom-1/4 left-0 transform -translate-x-1/2 translate-y-[270%] text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">IoT Integration</p>
                  </div>

                  {/* Network & Connectivity */}
                  <div className="absolute top-1/4 left-0 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">🔗</span>
                  </div>
                  <div className="absolute top-1/4 left-0 transform -translate-x-1/2 -translate-y-1/2 mt-10 text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">Network & Connectivity</p>
                  </div>

                  {/* Security & Governance */}
                  <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">🛡️</span>
                  </div>
                  <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 mt-10 text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">Security & Governance</p>
                  </div>

                  {/* Cloud Integration */}
                  <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-[#1B5A7D]">
                    <span className="text-[#1B5A7D] text-lg">☁️</span>
                  </div>
                  <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 mt-10 text-center">
                    <p className="text-xs font-medium text-[#1B5A7D]">Cloud Integration</p>
                  </div>
                </div>
              </div>

              {/* Platform Features */}
              <div className="space-y-6">
                <div className="bg-[#1B5A7D] text-white p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">Platform</h4>
                  <p className="text-sm">Cost-effective, scalable AIoT platform with a pre-configured IoT stack for communication, AI/ML, and real-time events.</p>
                </div>
                <div className="bg-[#1B5A7D] text-white p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">Integration</h4>
                  <p className="text-sm">Seamlessly integrates across technologies and systems, empowering developers to create comprehensive, data-driven solutions.</p>
                </div>
                <div className="bg-[#1B5A7D] text-white p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">Optimization</h4>
                  <p className="text-sm">Uncovers and analyzes data from connected devices across all systems to optimize processes and drive innovation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6">Impact</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Cost Reduction</h4>
                  <p className="text-lg">Decreases in operational expenses, maintenance costs, and energy consumption.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Enhanced Productivity</h4>
                  <p className="text-lg">Improved OEE (Overall Equipment Effectiveness), higher throughput, and better first-pass yield with reduced defects.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Optimized Asset Utilization</h4>
                  <p className="text-lg">Extended asset lifespan and increased operational uptime for critical machinery.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Supply Chain Resilience</h4>
                  <p className="text-lg">Lower inventory costs and improved logistics, leading to more agile and efficient operations.</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                <img 
                  src="/const.PNG"
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

export default AIOTPlatformSolutions; 