import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.apiUrl}/login`, {
        username,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      window.location.href = '/';
      
    } catch (error) {
      setError(error.response?.data?.message || 'خطأ في تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" dir="rtl" style={{ textAlign: 'right' }}>
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="text-center mb-4">تسجيل الدخول</h3>
              
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label d-block text-right">اسم المستخدم</label>
                  <input
                    type="text"
                    className="form-control text-right"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label d-block text-right">كلمة المرور</label>
                  <input
                    type="password"
                    className="form-control text-right"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'جاري الدخول...' : 'دخول'}
                </button>
              </form>
              
              <div className="text-center mt-4">
                <Link to="/driver-login" className="btn btn-outline-primary btn-sm me-2">تسجيل دخول السائق</Link>
                <Link to="/driver-register" className="btn btn-outline-success btn-sm">تسجيل سائق جديد</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
