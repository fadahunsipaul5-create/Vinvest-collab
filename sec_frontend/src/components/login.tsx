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
      const response = await fetch(`${baseUrl}/account/login/`, {
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

      const res = await fetch(`${baseUrl}/account/google-auth/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Google login failed');

      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      // Force page reload to update authentication state
      window.location.href = '/home';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img className="mx-auto h-16 w-auto" src="/new_logo.PNG" alt="GetDeep.AI" />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Sign in</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded"
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
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            <button type="button" className="absolute right-2 top-2" onClick={() => setShowPassword(!showPassword)}>
              👁
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-2">
          <a href="/request-password-reset" className="text-blue-600 hover:underline">Forgot password?</a>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Or sign in with Google</p>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => setError("Google login failed")}
            useOneTap
          />
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <a href="/register" className="text-blue-600 hover:underline">Don’t have an account? Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
