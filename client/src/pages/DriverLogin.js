import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const DriverLogin = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(`${config.apiUrl}/login-driver`, {
                phoneNumber: phoneNumber.replace(/\D/g, ''),
                password
            });
            
            // مسح البيانات القديمة
            localStorage.clear();
            
            // حفظ البيانات الأساسية
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('driverPhoneNumber', phoneNumber.replace(/\D/g, ''));
            
            // جلب بيانات السائق من الخادم
            try {
                const driverDataResponse = await axios.get(
                    `${config.apiUrl}/driver-data/${phoneNumber.replace(/\D/g, '')}`
                );
                if (driverDataResponse.data && driverDataResponse.data.firstName) {
                    localStorage.setItem('driverData', JSON.stringify(driverDataResponse.data));
                    localStorage.setItem('driverDataId', String(driverDataResponse.data.id));
                }
            } catch (e) {
                console.log('No existing driver data');
            }
            
            // إعادة التحميل الكامل
            window.location.href = '/driver';
        } catch (error) {
            setError(error.response?.data?.message || 'خطأ في تسجيل الدخول');
        }
        setLoading(false);
    };

    return (
        <div className="container mt-5" dir="rtl" style={{ textAlign: 'right' }}>
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card shadow">
                        <div className="card-body p-4">
                            <h3 className="text-center mb-4">تسجيل دخول السائق</h3>
                            
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            <form onSubmit={handleLogin}>
                                <div className="mb-3">
                                    <label className="form-label d-block text-right">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        className="form-control text-right"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        placeholder="07XXXXXXXXX"
                                        maxLength="11"
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label d-block text-right">كلمة المرور</label>
                                    <input
                                        type="password"
                                        className="form-control text-right"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="كلمة المرور من واتساب"
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
                            
                            <div className="text-center mt-3">
                                <Link to="/driver-register">تسجيل سائق جديد</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverLogin;
