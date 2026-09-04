import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';

const WhatsAppQR = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('loading');
    const [qrImage, setQrImage] = useState(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!isAdmin) return;
        
        const checkStatus = async () => {
            try {
                // جلب QR code مباشرة كـ JSON
                const qrResponse = await axios.get(`${config.whatsappUrl}/whatsapp-qr-image`);
                
                if (qrResponse.data.connected) {
                    setStatus('connected');
                    setQrImage(null);
                } else if (qrResponse.data.qrImage) {
                    setStatus('waiting_qr');
                    setQrImage(qrResponse.data.qrImage);
                } else {
                    setStatus('loading');
                    setQrImage(null);
                }
            } catch (error) {
                setStatus('error');
                setQrImage(null);
            }
        };
        
        const interval = setInterval(checkStatus, 5000);
        checkStatus();
        
        return () => clearInterval(interval);
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
                <div className="alert alert-danger mt-5">
                    <h4>غير مصرح بالوصول</h4>
                    <p>هذه الصفحة مخصصة للأدمن فقط.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
            <h2 className="mb-4">ربط واتساب</h2>
            
            <div className="card p-4 text-center">
                {status === 'connected' ? (
                    <>
                        <div style={{ fontSize: '64px' }}>✅</div>
                        <h3 className="mt-3">واتساب متصل!</h3>
                        <p className="text-muted">الواتساب يعمل بشكل طبيعي.</p>
                        <button 
                            className="btn btn-danger mt-3"
                            onClick={async () => {
                                if (window.confirm('هل تريد قطع اتصال واتساب؟')) {
                                    try {
                                        await axios.post(`${config.whatsappUrl}/logout-whatsapp`);
                                        alert('تم قطع الاتصال');
                                        setStatus('loading');
                                        setQrImage(null);
                                    } catch (e) {
                                        alert('خطأ في قطع الاتصال');
                                    }
                                }
                            }}
                        >
                            🔌 قطع الاتصال
                        </button>
                    </>
                ) : status === 'waiting_qr' ? (
                    <>
                        <h3>امسح QR code من هاتفك</h3>
                        {qrImage && (
                            <img 
                                src={qrImage} 
                                style={{ 
                                    width: '300px', 
                                    height: '300px', 
                                    margin: '20px auto',
                                    display: 'block',
                                    border: '2px solid #ddd',
                                    borderRadius: '10px',
                                    padding: '10px'
                                }} 
                                alt="QR Code" 
                            />
                        )}
                        <p className="mt-3 fw-bold">
                            📱 واتساب → الإعدادات → الأجهزة المرتبطة → ربط جهاز
                        </p>
                        <p className="text-muted">الصفحة تتحدث تلقائياً كل 5 ثواني...</p>
                    </>
                ) : status === 'error' ? (
                    <>
                        <div style={{ fontSize: '64px' }}>❌</div>
                        <h3 className="mt-3">خادم الواتساب غير متصل</h3>
                        <p className="text-muted">تأكد من تشغيل whatsapp-server.js</p>
                        <code>node whatsapp-server.js</code>
                    </>
                ) : (
                    <>
                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                        <p className="mt-3">جاري التحميل...</p>
                    </>
                )}
            </div>
            
            <div className="alert alert-info mt-3">
                <h5>📌 تعليمات:</h5>
                <ol>
                    <li>تأكد من تشغيل خادم الواتساب: <code>node whatsapp-server.js</code></li>
                    <li>امسح QR code من هاتفك</li>
                    <li>انتظر حتى تظهر "✅ واتساب متصل"</li>
                    <li>بعد الاتصال، سيتم إرسال كلمات المرور تلقائياً</li>
                </ol>
            </div>
        </div>
    );
};

export default WhatsAppQR;
