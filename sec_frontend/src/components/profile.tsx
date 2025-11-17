import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import baseUrl from './api';

interface UserInfo {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  date_joined?: string;
  last_login?: string;
}

interface SubscriptionInfo {
  plan: string;
  questionsUsed: number;
  questionsLimit: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ plan: 'free', questionsUsed: 0, questionsLimit: 10 });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserInfo>({});

  useEffect(() => {
    // Load user info from localStorage
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      const user = JSON.parse(savedUserInfo);
      setUserInfo(user);
      setEditForm(user);
    }

    // Load subscription info
    const savedSubscription = localStorage.getItem('userSubscription');
    if (savedSubscription) {
      setSubscription(JSON.parse(savedSubscription));
    }

    // Fetch fresh subscription/profile details from backend
    const token = localStorage.getItem('access');
    if (token) {
      fetch(`${baseUrl}/account/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Failed: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          // Normalize plan for UI (backend uses 'pro_plus')
          const planRaw: string = data.subscription_plan || 'free';
          const planUI = planRaw === 'pro_plus' ? 'pro-plus' : planRaw;

          const limit: number = typeof data.questions_limit === 'number'
            ? data.questions_limit
            : planUI === 'pro-plus' ? 9999 : planUI === 'pro' ? 50 : 10;

          const remaining: number = typeof data.questions_remaining === 'number' ? data.questions_remaining : 0;
          const usedFromApi: number | undefined = data.questions_used;
          const used = Math.max(typeof usedFromApi === 'number' ? usedFromApi : (limit - remaining), 0);

          setSubscription({ plan: planUI, questionsUsed: used, questionsLimit: limit });
          localStorage.setItem('userSubscription', JSON.stringify({ plan: planUI, questionsUsed: used, questionsLimit: limit }));

          // Optionally refresh basic user info
          const mergedUser = {
            ...userInfo,
            email: data.email ?? userInfo.email,
            first_name: data.first_name ?? userInfo.first_name,
            last_name: data.last_name ?? userInfo.last_name,
          };
          setUserInfo(mergedUser);
          setEditForm(mergedUser);
          localStorage.setItem('user_info', JSON.stringify(mergedUser));
        })
        .catch((err) => {
          console.error('Failed to refresh profile from backend:', err);
        });
    }
  }, []);

  const handleSave = () => {
    // Update localStorage
    localStorage.setItem('user_info', JSON.stringify(editForm));
    setUserInfo(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(userInfo);
    setIsEditing(false);
  };

  const getSubscriptionBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-blue-500';
      case 'pro-plus':
        return 'bg-purple-500';
      default:
        return 'bg-green-500';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPlanName = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'Pro';
      case 'pro-plus':
        return 'Pro Plus';
      default:
        return 'Basic/Free';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate('/home')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Profile</h1>
                <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Manage your account settings and preferences</p>
              </div>
            </div>
            <img src="/inv.png" alt="GetDeep.AI" className="h-8 sm:h-10" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Personal Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.first_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm sm:text-base">{userInfo.first_name || 'Not set'}</p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.last_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm sm:text-base">{userInfo.last_name || 'Not set'}</p>
                  )}
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="text-gray-900 text-sm sm:text-base">{userInfo.email || 'Not set'}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <p className="text-gray-900 text-sm sm:text-base">{userInfo.username || 'Not set'}</p>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                  <p className="text-gray-900 text-sm sm:text-base">{formatDate(userInfo.date_joined)}</p>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                  <p className="text-gray-900 text-sm sm:text-base">{formatDate(userInfo.last_login)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Subscription Details</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                    <h3 className="text-sm font-medium text-gray-700">Current Plan</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white self-start ${getSubscriptionBadgeColor(subscription.plan)}`}>
                      {formatPlanName(subscription.plan)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Questions Used</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((subscription.questionsUsed / subscription.questionsLimit) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                      {subscription.questionsUsed}/{subscription.questionsLimit === 9999 ? '∞' : subscription.questionsLimit}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Questions Remaining</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {subscription.questionsLimit === 9999 ? '∞' : (subscription.questionsLimit - subscription.questionsUsed)}
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    // Signal Home to open pricing modal immediately
                    localStorage.setItem('show_pricing_modal', '1');
                    navigate('/home');
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm sm:text-base"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Account Actions</h2>
              
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={() => navigate('/password-reset')}
                  className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm sm:text-base"
                >
                  Change Password
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all saved data? This action cannot be undone.')) {
                      localStorage.removeItem('savedCharts');
                      localStorage.removeItem('chatHistory');
                      alert('Saved data cleared successfully!');
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors sm:ml-4 text-sm sm:text-base"
                >
                  Clear Saved Data
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      // TODO: Implement account deletion
                      alert('Account deletion feature coming soon!');
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors sm:ml-4 text-sm sm:text-base"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;