import React from 'react';

const ValueIdentificationServices: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1B5A7D] mb-4">Our Value Identification To Realization Services</h1>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-600">FROM: Value Identification ...</span>
              <span className="text-lg font-medium text-gray-600">TO: Value Realization</span>
            </div>
            <div className="relative">
              <div className="w-full h-4 bg-gray-200 rounded-full">
                <div className="h-full bg-gradient-to-r from-[#1B5A7D] to-[#164964] rounded-full relative">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-[#164964] border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1 - Value Identification */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6 text-center">
                Value Identification <br/>& Current State Assessment
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>On-demand insights, strategy development & domain expertise</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Value chain mapping and use case identification (including Digital/AI)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Current state assessment / readiness (data, IT/ OT/ET)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Use case ROIC, prioritization, and digital transformation roadmap</span>
                </li>
              </ul>
            </div>

            {/* Column 2 - Data Platforms */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6 text-center">
                Data Platforms & <br/>AIoT/IT/ET Infrastructure Implementation
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Data integration across sources and systems</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Data curation & building centralized data products and platforms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Accelerated AIoT/IT/ET implementation by leveraging technology including accelerators and pre-built solutions</span>
                </li>
              </ul>
            </div>

            {/* Column 3 - Value Realization */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <h2 className="text-2xl font-bold text-[#1B5A7D] mb-6 text-center">
                Select Use Case <br/>Implementation & Value Realization
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Select use/value case and digital/AI solution end-to-end implementation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Accelerated efforts by leverage AI agents and domain experts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1B5A7D] mr-3 text-lg">•</span>
                  <span>Institutionalization and new ways of working by addressing people, process changes</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Button */}
          <div className="flex justify-center mt-12">
            <button className="px-8 py-3 bg-[#1B5A7D] text-white rounded-lg hover:bg-[#164964] transition-colors font-medium flex items-center gap-2">
              <span>Contact Us</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValueIdentificationServices; 