import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import axios from 'axios';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import AdminSetup from './pages/AdminSetup';
import Dashboard from './pages/Dashboard';
import WheelTypes from './pages/WheelTypes';
import DataEntry from './pages/DataEntry';
import Users from './pages/Users';
import ViewData from './pages/ViewData';
import ChangePassword from './pages/ChangePassword';
import DriverLink from './pages/DriverLink';
import DriverRegister from './pages/DriverRegister';
import DriverLogin from './pages/DriverLogin';
import WhatsAppQR from './pages/WhatsAppQR';
import Backup from './pages/Backup';

// Context
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(savedUser));
    }
    
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const response = await axios.get('http://localhost:5001/check-admin');
      setHasAdmin(response.data.hasAdmin);
    } catch (error) {
      console.error('Error checking admin:', error);
      setHasAdmin(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserData(null);
  };

  if (hasAdmin === null) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
          <p className="mt-3">جاري التحقق من النظام...</p>
        </div>
      </div>
    );
  }

  const isAdmin = userData?.role === 'admin';
  const isDriver = userData?.role === 'driver';
  const permissions = userData?.permissions || {};

  const MainLayout = ({ children }) => (
    <div className="app-container">
      <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} onLogout={handleLogout} />
      <div className="main-content">
        <Sidebar isOpen={sidebarOpen} onLogout={handleLogout} />
        <div className={`page-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route 
              path="/setup" 
              element={hasAdmin ? <Navigate to="/login" replace /> : <AdminSetup />} 
            />
            
            <Route 
              path="/login" 
              element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} 
            />
            
            {/* مسارات السائقين - بدون MainLayout */}
            <Route path="/driver" element={<DriverLink />} />
            <Route path="/driver-register" element={<DriverRegister />} />
            <Route path="/driver-login" element={<DriverLogin />} />

            {/* الصفحة الرئيسية - السائق يوجه لصفحته الخاصة */}
            <Route 
              path="/" 
              element={
                isLoggedIn ? (
                  isDriver ? (
                    <Navigate to="/driver" replace />
                  ) : (
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  )
                ) : hasAdmin ? (
                  <Navigate to="/login" replace />
                ) : (
                  <Navigate to="/setup" replace />
                )
              } 
            />

            {/* بقية المسارات - فقط للمستخدمين العاديين والأدمن */}
            <Route 
              path="/whatsapp-qr" 
              element={
                isLoggedIn && isAdmin ? (
                  <MainLayout>
                    <WhatsAppQR />
                  </MainLayout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route 
              path="/backup" 
              element={
                isLoggedIn && isAdmin ? (
                  <MainLayout>
                    <Backup />
                  </MainLayout>
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route 
              path="/wheel-types" 
              element={
                isLoggedIn && !isDriver ? (
                  permissions.wheelTypes === true || isAdmin ? (
                    <MainLayout>
                      <WheelTypes />
                    </MainLayout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/data-entry/*" 
              element={
                isLoggedIn && !isDriver ? (
                  permissions.dataEntry === true || isAdmin ? (
                    <MainLayout>
                      <DataEntry />
                    </MainLayout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/users" 
              element={
                isLoggedIn && !isDriver ? (
                  permissions.users === true || isAdmin ? (
                    <MainLayout>
                      <Users />
                    </MainLayout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/view-data" 
              element={
                isLoggedIn && !isDriver ? (
                  permissions.viewData === true || isAdmin ? (
                    <MainLayout>
                      <ViewData />
                    </MainLayout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            <Route 
              path="/change-password" 
              element={
                isLoggedIn && !isDriver ? (
                  <MainLayout>
                    <ChangePassword />
                  </MainLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;