import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update user subscription status locally
    // In a real implementation, you might want to verify the payment with your backend
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1B5A7D] mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-900">Processing your payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your subscription.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
              <p className="text-gray-600">Your subscription has been activated successfully.</p>
              {sessionId && (
                <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-[#1B5A7D] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#164964] transition-colors"
              >
                Continue to Dashboard
              </button>
              
              <p className="text-sm text-gray-500">
                You can now enjoy all the features of your new plan!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;