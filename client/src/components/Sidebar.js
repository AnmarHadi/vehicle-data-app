import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions || {};

  const menuItems = [
    { path: '/', label: 'الرئيسية', icon: '🏠', show: true },
    { path: '/wheel-types', label: 'نوع العجلة', icon: '🔧', show: permissions.wheelTypes === true || isAdmin },
    { path: '/data-entry', label: 'إدخال البيانات', icon: '📝', show: permissions.dataEntry === true || isAdmin },
    { path: '/users', label: 'المستخدمون', icon: '👥', show: permissions.users === true || isAdmin },
    { path: '/view-data', label: 'البيانات المدخلة', icon: '📊', show: permissions.viewData === true || isAdmin },
    { path: '/whatsapp-qr', label: 'ربط واتساب', icon: '💬', show: isAdmin },
    { path: '/backup', label: 'النسخ الاحتياطي', icon: '💾', show: isAdmin },
    { path: '/change-password', label: 'تغيير كلمة المرور', icon: '🔑', show: true },
  ];

  const visibleItems = menuItems.filter(item => item.show);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isOpen ? '' : 'closed'}`} dir="rtl" style={{ textAlign: 'right' }}>
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link d-flex align-items-center justify-content-start ${location.pathname === item.path ? 'active' : ''}`}
            style={{ textAlign: 'right' }}
          >
            <span className="me-2">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <hr className="bg-light" />
        <button
          className="sidebar-link btn btn-link text-white w-100 d-flex align-items-center justify-content-start"
          style={{ textAlign: 'right' }}
          onClick={handleLogout}
        >
          <span className="me-2">🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;