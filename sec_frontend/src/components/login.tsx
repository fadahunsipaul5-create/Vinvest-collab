import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import baseUrl from './api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      
      // Store user information for display
      if (data.user) {
        localStorage.setItem("user_info", JSON.stringify(data.user));
      }
      
      // Force page reload to update authentication state
      window.location.href = '/home';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    try {
      const { credential } = credentialResponse;

      const res = await fetch(`${baseUrl}/users/google-auth/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Google login failed');

      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      
      // Store user information for display
      if (data.user) {
        localStorage.setItem("user_info", JSON.stringify(data.user));
      }
      
      // Force page reload to update authentication state
      window.location.href = '/home';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-3 xm:py-6 xm:px-4 xs:py-8 xs:px-5 sm:py-12 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="max-w-xs xm:max-w-sm xs:max-w-md sm:max-w-lg w-full space-y-4 xm:space-y-6 xs:space-y-7 sm:space-y-8">
        <div>
          <img className="mx-auto h-8 w-auto xm:h-10 xs:h-12 sm:h-14 md:h-16 lg:h-18 xl:h-15" src="/inv.png" alt="GetDeep.AI" />
          <h2 className="mt-3 xm:mt-4 xs:mt-5 sm:mt-6 text-center text-xl xm:text-2xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-gray-900">Sign in</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-3 xm:space-y-4 xs:space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-2 py-1.5 xm:px-3 xm:py-2 xs:px-4 xs:py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border border-gray-300 rounded-md text-xs xm:text-sm xs:text-base sm:text-base md:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full px-2 py-1.5 xm:px-3 xm:py-2 xs:px-4 xs:py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border border-gray-300 rounded-md text-xs xm:text-sm xs:text-base sm:text-base md:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8 xm:pr-10"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            <button type="button" className="absolute right-1.5 top-1.5 xm:right-2 xm:top-2 xs:right-3 xs:top-2.5 sm:right-3 sm:top-3 text-sm xm:text-base xs:text-lg sm:text-xl" onClick={() => setShowPassword(!showPassword)}>
              👁
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-1.5 px-3 xm:py-2 xm:px-4 xs:py-2.5 xs:px-5 sm:py-3 sm:px-6 md:py-3.5 md:px-7 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs xm:text-sm xs:text-base sm:text-base md:text-lg font-medium transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs xm:text-sm xs:text-base sm:text-base md:text-lg text-gray-500 mt-1 xm:mt-2">
          <a href="/request-password-reset" className="text-blue-600 hover:underline">Forgot password?</a>
        </div>

        <div className="mt-3 xm:mt-4 xs:mt-5 sm:mt-6 text-center">
          <p className="text-xs xm:text-sm xs:text-base sm:text-base md:text-lg text-gray-600 mb-1 xm:mb-2 xs:mb-2.5 sm:mb-3">Or sign in with Google</p>
          <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => setError("Google login failed")}
            useOneTap
          />
          </div>
        </div>

        <div className="text-center text-sm sm:text-base text-gray-500 mt-4">
          <a href="/register" className="text-blue-600 hover:underline">Don't have an account? Sign up</a>
        </div>

        {/* AI Disclaimer - Simple version for login */}
        <div className="mt-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 sm:p-3 rounded-md">
            ⚠️ AI responses may be inaccurate. We will continue to fine tune to improve the accuracy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
