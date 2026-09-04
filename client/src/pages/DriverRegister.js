import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const DriverRegister = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showResendConfirm, setShowResendConfirm] = useState(false);

    const handleSendPassword = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        
        if (phoneNumber.replace(/\D/g, '').length < 10) {
            setError('رقم الهاتف غير صحيح');
            setLoading(false);
            return;
        }
        
        try {
            // التحقق من وجود السائق
            const checkResponse = await axios.post(`${config.apiUrl}/check-driver`, {
                phoneNumber: phoneNumber.replace(/\D/g, '')
            });
            
            if (checkResponse.data.exists) {
                setShowResendConfirm(true);
                setLoading(false);
                return;
            }
            
            // تسجيل جديد
            const response = await axios.post(`${config.apiUrl}/register-driver`, {
                phoneNumber: phoneNumber.replace(/\D/g, '')
            });
            setSuccess(response.data.message || 'تم إرسال كلمة المرور عبر واتساب');
            setStep(2);
        } catch (error) {
            setError(error.response?.data?.message || 'خطأ');
        }
        setLoading(false);
    };

    const handleResendPassword = async () => {
        setLoading(true);
        setError('');
        setShowResendConfirm(false);
        
        try {
            const response = await axios.post(`${config.apiUrl}/resend-password`, {
                phoneNumber: phoneNumber.replace(/\D/g, '')
            });
            setSuccess('تم إرسال كلمة المرور الجديدة');
            setStep(2);
        } catch (error) {
            setError(error.response?.data?.message || 'خطأ');
        }
        setLoading(false);
    };

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        
        if (!password) {
            setError('يرجى إدخال كلمة المرور');
            setLoading(false);
            return;
        }
        
        try {
            const response = await axios.post(`${config.apiUrl}/login-driver`, {
                phoneNumber: phoneNumber.replace(/\D/g, ''),
                password
            });
            
            // 🔥 مسح جميع بيانات السائق السابق من localStorage
            localStorage.clear();
            
            // حفظ بيانات السائق الجديد
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('driverPhoneNumber', phoneNumber.replace(/\D/g, ''));
            localStorage.setItem('driverDeviceBlocked', 'false');
            
            navigate('/driver');
        } catch (error) {
            setError(error.response?.data?.message || 'كلمة المرور غير صحيحة');
        }
        setLoading(false);
    };

    if (showResendConfirm) {
        return (
            <div className="container mt-5" dir="rtl" style={{ textAlign: 'right' }}>
                <div className="row justify-content-center">
                    <div className="col-md-4">
                        <div className="card shadow">
                            <div className="card-body p-4 text-center">
                                <h4 className="mb-3">تنبيه!</h4>
                                <p>سبق وأن تم إرسال كلمة المرور إلى هذا الهاتف.</p>
                                <p>هل ترغب بإعادة إرسالها؟</p>
                                
                                <div className="d-flex justify-content-center gap-2 mt-4">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleResendPassword}
                                        disabled={loading}
                                    >
                                        {loading ? '⏳...' : 'نعم، أعد الإرسال'}
                                    </button>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() => { setShowResendConfirm(false); setStep(2); }}
                                    >
                                        لا، لدي كلمة المرور
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5" dir="rtl" style={{ textAlign: 'right' }}>
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card shadow">
                        <div className="card-body p-4">
                            <h3 className="text-center mb-4">تسجيل السائق</h3>
                            
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}
                            
                            {step === 1 ? (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label d-block text-right">رقم الهاتف</label>
                                        <input
                                            type="tel"
                                            className="form-control text-right"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder="07XXXXXXXXX"
                                            maxLength="11"
                                        />
                                        <small className="text-muted d-block">سيتم إرسال كلمة المرور عبر واتساب</small>
                                    </div>
                                    <button 
                                        className="btn btn-primary w-100"
                                        onClick={handleSendPassword}
                                        disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                                    >
                                        {loading ? '⏳ جاري الإرسال...' : '📱 إرسال كلمة المرور'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label d-block text-right">كلمة المرور</label>
                                        <input
                                            type="password"
                                            className="form-control text-right"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="كلمة المرور من واتساب"
                                            autoFocus
                                        />
                                    </div>
                                    <button 
                                        className="btn btn-primary w-100"
                                        onClick={handleLogin}
                                        disabled={loading || !password}
                                    >
                                        {loading ? '⏳ جاري الدخول...' : '🔐 دخول'}
                                    </button>
                                    <button 
                                        className="btn btn-link w-100 mt-2"
                                        onClick={() => { setStep(1); setSuccess(''); setError(''); }}
                                    >
                                        إعادة إرسال كلمة المرور
                                    </button>
                                </>
                            )}
                            
                            <div className="text-center mt-3">
                                <button className="btn btn-link" onClick={() => navigate('/driver-login')}>
                                    تسجيل دخول السائق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverRegister;
