import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/home');
  };

  const handleBackToPlans = () => {
    navigate('/home');
    // You could also set a flag in localStorage to auto-open the pricing modal
    localStorage.setItem('show_pricing_modal', 'true');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Payment Cancelled</h2>
            <p className="text-gray-600">
              Your payment was cancelled. No charges have been made to your account.
            </p>
          </div>

        <div className="space-y-3">
          <button
              onClick={handleBackToPlans}
              className="w-full bg-[#1B5A7D] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#164964] transition-colors"
          >
              View Plans Again
          </button>
            
          <button
              onClick={handleRetry}
              className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
              Return to Dashboard
          </button>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>Need help choosing a plan?</p>
            <p>Contact us at <a href="mailto:info@valueaccel.com" className="text-[#1B5A7D] hover:underline">info@valueaccel.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;