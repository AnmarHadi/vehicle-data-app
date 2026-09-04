import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // استرجاع المستخدم من localStorage عند التحميل
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${config.apiUrl}/login`, {
        username,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      return { success: true, user: response.data.user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'خطأ في تسجيل الدخول' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post(`${config.apiUrl}/change-password`, {
        username: user?.username,
        currentPassword,
        newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'خطأ في تغيير كلمة المرور' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};