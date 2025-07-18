import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setVerificationStatus('error');
      setMessage('Token is required');
      return;
    }

    // Call the backend verification endpoint
    const verifyEmail = async () => {
      try {
        const response = await fetch(`https://sec-insights-backend-791634680391.us-central1.run.app/account/verify-email/?token=${token}`);
        
        if (response.ok) {
          setVerificationStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          const data = await response.json();
          setVerificationStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setVerificationStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Verifying your email...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">GetDeep.AI</h2>
        </div>
        
        {verificationStatus === 'success' ? (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Email Verified Successfully!</h1>
            <p className="text-gray-600 mb-8">
              Your account has been activated and you can now sign in to access all features.
            </p>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">✗</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Verification Failed</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <button
              onClick={handleRegister}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Register Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 