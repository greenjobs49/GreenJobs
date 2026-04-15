const AUTH_KEY = 'job_portal_auth';

export const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting stored auth:', error);
    return null;
  }
};

export const setStoredAuth = (authData) => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error('Error storing auth:', error);
  }
};

export const removeStoredAuth = () => {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('Error removing auth:', error);
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};