import React from 'react';

interface SandboxWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableSandbox: () => void;
}

const SandboxWarningModal: React.FC<SandboxWarningModalProps> = ({ 
  isOpen, 
  onClose, 
  onEnableSandbox 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[#161C1A] rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-gray-200 dark:border-[#1C2220]">
        {/* Header with Icon */}
        <div className="p-6 pb-0 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-blue-600 dark:text-blue-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Enable Sandbox Mode
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            To edit values and create custom projections, you need to enable Sandbox Mode first. This creates a safe environment for your assumptions.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#1C2220] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onEnableSandbox();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center justify-center gap-2"
          >
            Enable Sandbox
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SandboxWarningModal;

