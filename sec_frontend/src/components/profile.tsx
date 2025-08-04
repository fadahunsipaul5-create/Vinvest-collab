import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/home')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
              </div>
            </div>
            <img src="/deep.PNG" alt="GetDeep.AI" className="h-10" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-3">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.first_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{userInfo.first_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.last_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{userInfo.last_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="text-gray-900">{userInfo.email || 'Not set'}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <p className="text-gray-900">{userInfo.username || 'Not set'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                  <p className="text-gray-900">{formatDate(userInfo.date_joined)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                  <p className="text-gray-900">{formatDate(userInfo.last_login)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Current Plan</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getSubscriptionBadgeColor(subscription.plan)}`}>
                      {formatPlanName(subscription.plan)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Questions Used</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((subscription.questionsUsed / subscription.questionsLimit) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {subscription.questionsUsed}/{subscription.questionsLimit === 9999 ? '∞' : subscription.questionsLimit}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Questions Remaining</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {subscription.questionsLimit === 9999 ? '∞' : (subscription.questionsLimit - subscription.questionsUsed)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    navigate('/home');
                    // The home page will need to be updated to trigger the subscription modal
                    setTimeout(() => {
                      const event = new CustomEvent('showUpgradeModal');
                      window.dispatchEvent(event);
                    }, 500);
                  }}
                  className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/password-reset')}
                  className="w-full md:w-auto px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
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
                  className="w-full md:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors ml-0 md:ml-4"
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
                  className="w-full md:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ml-0 md:ml-4"
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