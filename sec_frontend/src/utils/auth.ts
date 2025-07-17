export const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user_info');
  window.location.href = '/register';
};

export const getUserInfo = () => {
  const userInfo = localStorage.getItem('user_info');
  if (userInfo) {
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      console.error('Error parsing user info:', error);
      return null;
    }
  }
  return null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access');
}; 