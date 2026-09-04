import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const AdminSetup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // الرابط الصحيح مع config
      const response = await axios.post(`${config.apiUrl}/setup-admin`, {
        username,
        password
      });
      
      console.log('Admin created successfully:', response.data);
      alert('تم إنشاء حساب المدير بنجاح!');
      navigate('/login');
      
    } catch (error) {
      console.error('Error creating admin:', error);
      setError(error.response?.data?.message || 'خطأ في إنشاء المدير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="text-center mb-4">إنشاء حساب المدير</h3>
              <p className="text-center text-muted mb-4">
                هذا أول تشغيل للنظام. يرجى إنشاء حساب المدير.
              </p>
              
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">اسم المستخدم</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">كلمة المرور</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'جاري الإنشاء...' : 'حفظ'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
