import React from 'react';

interface OperationsVirtualizationProps {
  onContactClick?: () => void;
}

const OperationsVirtualization: React.FC<OperationsVirtualizationProps> = ({ onContactClick }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1B5A7D] mb-4">Virtualization & Optimization Solutions</h1>
          </div>

          {/* OPPORTUNITY Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6">OPPORTUNITY</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4 text-gray-700">
                <p className="text-lg">Operational decisions in large organizations are very complex with many interdependencies and constraints</p>
                <p className="text-lg">Data sources (OT, IT, ET) are largely isolated with many systems and versions</p>
                <p className="text-lg">System-level optimization and Risk management/planning in these large complex operations requires virtualization and scenario developments</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                <img 
                  src="/rig.PNG" 
                  alt="Industrial facility at dusk with complex structures and mountain background" 
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Virtualization / Digital twin Platform Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6 text-center">Virtualization / Digital twin Platform</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                <img 
                  src="/pc.PNG" 
                  alt="Laptop displaying 3D digital twin model of industrial facility" 
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="text-lg">OT, IT, ET data Integration and Virtualization Layer</p>
                <p className="text-lg">Comprehensive 3D Digital Twin platform across all equipment, processes and operations</p>
                <p className="text-lg">Low-code platform to integrate AI and GenAI across the operations life cycle</p>
              </div>
            </div>
          </div>

          {/* Impact Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-[#1B5A7D] mb-6">Impact</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4 text-gray-700">
                <p className="text-lg"><span className="font-semibold text-[#1B5A7D]">Predictive Optimization:</span> Enabling proactive efficiency gains, reduced costs, and maximized uptime through real-time insights and forecasting.</p>
                <p className="text-lg"><span className="font-semibold text-[#1B5A7D]">Accelerated Innovation & Risk Mitigation:</span> Speeding up development and safe testing of new designs, while effectively reducing operational risks.</p>
                <p className="text-lg"><span className="font-semibold text-[#1B5A7D]">Data-Driven Decision-Making:</span> Providing a comprehensive, live view of operations to inform faster, smarter strategic and operational choices.</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                <img 
                  src="/helmet.PNG" 
                  alt="Worker in safety gear using tablet device in industrial setting" 
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <div className="flex justify-center pt-6">
            <button 
              onClick={onContactClick}
              className="px-8 py-3 bg-[#1B5A7D] text-white rounded-lg hover:bg-[#164964] transition-colors font-medium"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsVirtualization; 