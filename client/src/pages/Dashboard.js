import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions || {};

  const pages = [
    { name: 'نوع العجلة', icon: '🔧', path: '/wheel-types', color: '#4CAF50', show: permissions.wheelTypes === true || isAdmin },
    { name: 'إدخال البيانات', icon: '📝', path: '/data-entry', color: '#2196F3', show: permissions.dataEntry === true || isAdmin },
    { name: 'المستخدمون', icon: '👥', path: '/users', color: '#FF9800', show: permissions.users === true || isAdmin },
    { name: 'البيانات المدخلة', icon: '📊', path: '/view-data', color: '#9C27B0', show: permissions.viewData === true || isAdmin },
    { name: 'ربط واتساب', icon: '💬', path: '/whatsapp-qr', color: '#25D366', show: isAdmin },
    { name: 'النسخ الاحتياطي', icon: '💾', path: '/backup', color: '#795548', show: isAdmin },
    { name: 'تغيير كلمة المرور', icon: '🔑', path: '/change-password', color: '#F44336', show: true },
  ];

  const visiblePages = pages.filter(page => page.show);

  return (
    <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
      <h2 className="text-center mb-4">الصفحة الرئيسية</h2>
      <div className="row">
        {visiblePages.map((page, index) => (
          <div className="col-md-4 mb-4" key={index}>
            <div
              className="card text-center"
              onClick={() => navigate(page.path)}
              style={{ cursor: 'pointer', borderTop: `4px solid ${page.color}` }}
            >
              <div className="card-body">
                <div style={{ fontSize: '48px' }}>{page.icon}</div>
                <h5 className="card-title mt-3">{page.name}</h5>
              </div>
            </div>
          </div>
        ))}
        {visiblePages.length === 0 && (
          <div className="col-12 text-center">
            <p className="text-muted">لا توجد صفحات متاحة لك</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
