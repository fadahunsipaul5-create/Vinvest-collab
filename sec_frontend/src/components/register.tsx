// Register.tsx (Final Version for Google Auth Only)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import baseUrl from './api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    password: '', 
    confirm_password: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${baseUrl}/account/register/`, formData);
      
      if (response.status === 201) {
        alert('Registration successful! Please check your email to verify your account.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error("Registration failed:", error.response?.data || error.message);
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    try {
      const token = credentialResponse.credential;

      const response = await axios.post(`${baseUrl}/account/google-auth/`, {
        token: token,
      });

      const data = response.data;
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      // Force page reload to update authentication state
      window.location.href = '/home';
    } catch (error: any) {
      console.error("Google authentication failed:", error.response?.data || error.message);
      console.error("Full error:", error);
      
      // Show user-friendly error message
      if (error.response?.status === 500) {
        alert("Server error. Please check your backend configuration and try again.");
      } else if (error.response?.status === 400) {
        alert("Invalid token. Please try signing in again.");
      } else if (error.code === 'NETWORK_ERROR') {
        alert("Network error. Please check if your backend server is running.");
      } else {
        alert("Authentication failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img 
            className="mx-auto h-16 w-auto" 
            src="/GetDeepLogo.png"
            alt="GetDeep.AI"
          />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign up with your email or use Google authentication
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

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
            <button 
              type="button" 
              className="absolute right-2 top-2" 
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </button>
          </div>

          <div className="relative">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Confirm Password"
              value={formData.confirm_password}
              onChange={handleChange}
            />
            <button 
              type="button" 
              className="absolute right-2 top-2" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              👁
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Or sign up with Google</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setError("Google login failed")}
              text="signup_with"
              shape="rectangular"
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <a href="/login" className="text-blue-600 hover:underline">Already have an account? Sign in</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
