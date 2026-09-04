import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const { user } = useAuth();
  
  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.role === 'admin') return user.username || 'الأدمن';
    if (user.role === 'driver') return user.phoneNumber || 'سائق';
    return user.username || 'مستخدم';
  };

  return (
    <nav className={`navbar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div>
        <h4 className="mb-0">نظام إدارة بيانات العجلات</h4>
      </div>
      <div className="d-flex align-items-center">
        <span className="text-white me-3" style={{ fontSize: '16px' }}>
          👤 {getUserDisplayName()}
        </span>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;