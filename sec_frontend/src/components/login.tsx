import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import baseUrl from './api';
import { useTheme } from '../contexts/ThemeContext';

const Login = () => {
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0F0E] py-4 px-3 xm:py-6 xm:px-4 xs:py-8 xs:px-5 sm:py-12 sm:px-6 md:px-8 lg:px-10 xl:px-12 relative">
      {/* Dark Mode Toggle - Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-md bg-[#161C1A] dark:bg-[#161C1A] text-[#E0E6E4] hover:bg-[#1C2220] transition-colors text-sm font-medium"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            <span className="hidden sm:inline">Dark Mode</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            <span className="hidden sm:inline">Light Mode</span>
          </>
        )}
      </button>
      <div className="max-w-xs xm:max-w-sm xs:max-w-md sm:max-w-lg w-full space-y-4 xm:space-y-6 xs:space-y-7 sm:space-y-8">
        <div>
          <img className="mx-auto h-12 w-auto xm:h-18 xs:h-26 sm:h-30 md:h-30 lg:h-32 xl:h-50 dark:hidden" src="/logo.svg" alt="GetDeep.AI" />
          <img className="mx-auto h-12 w-auto xm:h-18 xs:h-26 sm:h-30 md:h-30 lg:h-32 xl:h-50 hidden dark:block" src="/vshape.svg" alt="GetDeep.AI" />
          <h2 className="mt-3 xm:mt-4 xs:mt-5 sm:mt-6 text-center text-xl xm:text-2xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-[#E0E6E4]">Sign in</h2>
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
              className="w-full px-2 py-1.5 xm:px-3 xm:py-2 xs:px-4 xs:py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border border-gray-300 dark:border-[#161C1A] rounded-md bg-white dark:bg-[#161C1A] text-gray-900 dark:text-[#E0E6E4] text-xs xm:text-sm xs:text-base sm:text-base md:text-lg focus:ring-2 focus:ring-[#144D37] focus:border-[#144D37]"
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
            className="w-full py-1.5 px-3 xm:py-2 xm:px-4 xs:py-2.5 xs:px-5 sm:py-3 sm:px-6 md:py-3.5 md:px-7 bg-[#144D37] text-white rounded-md hover:bg-[#0F3A28] disabled:opacity-50 text-xs xm:text-sm xs:text-base sm:text-base md:text-lg font-medium transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs xm:text-sm xs:text-base sm:text-base md:text-lg text-gray-500 dark:text-[#889691] mt-1 xm:mt-2">
          <a href="/request-password-reset" className="text-blue-600 dark:text-[#144D37] hover:underline">Forgot password?</a>
        </div>

        <div className="mt-3 xm:mt-4 xs:mt-5 sm:mt-6 text-center">
          <p className="text-xs xm:text-sm xs:text-base sm:text-base md:text-lg text-gray-600 dark:text-[#889691] mb-1 xm:mb-2 xs:mb-2.5 sm:mb-3">Or sign in with Google</p>
          <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => setError("Google login failed")}
            useOneTap
          />
          </div>
        </div>

        <div className="text-center text-sm sm:text-base text-gray-500 mt-4">
          <a href="/register" className="text-blue-600 dark:text-[#144D37] hover:underline">Don't have an account? Sign up</a>
        </div>

        {/* AI Disclaimer - Simple version for login */}
        <div className="mt-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#889691] bg-gray-50 dark:bg-[#161C1A] p-2 sm:p-3 rounded-md">
            ⚠️ AI responses may be inaccurate. We will continue to fine tune to improve the accuracy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
