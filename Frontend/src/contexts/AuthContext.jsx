import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Check auth status when the page becomes visible (after redirect from OAuth)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuthStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkAuthStatus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkAuthStatus);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/auth/status', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = (redirectTo = '/analysis') => {
    // Pass the intended destination as a query parameter to the backend
    const encodedRedirect = encodeURIComponent(redirectTo);
    window.location.href = `http://localhost:4000/auth/google?redirect=${encodedRedirect}`;
  };

  const signOut = () => {
    window.location.href = 'http://localhost:4000/auth/logout';
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
