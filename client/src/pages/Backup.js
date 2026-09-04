// src/pages/Backup.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const Backup = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const isAdmin = user?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
                <div className="alert alert-danger mt-5">غير مصرح بالوصول</div>
            </div>
        );
    }

    const handleBackup = async () => {
        setLoading(true);
        setMessage('');
        try {
            const response = await axios.get(`${config.apiUrl}/backup-data`, {
                responseType: 'blob'
            });
            
            const url = URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            setMessage('✅ تم إنشاء النسخة الاحتياطية بنجاح!');
        } catch (error) {
            setMessage('❌ خطأ في إنشاء النسخة الاحتياطية');
        }
        setLoading(false);
    };

    const handleRestore = async (file) => {
        setLoading(true);
        setMessage('');
        try {
            // قراءة محتوى الملف
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const fileContent = JSON.parse(e.target.result);
                    
                    await axios.post(`${config.apiUrl}/restore-data`, fileContent, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    setMessage('✅ تم استعادة النسخة الاحتياطية بنجاح!');
                } catch (parseError) {
                    console.error('Error parsing file:', parseError);
                    setMessage('❌ خطأ في قراءة ملف النسخة الاحتياطية');
                }
                setLoading(false);
            };
            
            reader.onerror = () => {
                setMessage('❌ خطأ في قراءة الملف');
                setLoading(false);
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Error restoring backup:', error);
            setMessage('❌ خطأ في استعادة النسخة الاحتياطية');
            setLoading(false);
        }
    };

    return (
        <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
            <h2 className="mb-4">النسخ الاحتياطي</h2>
            
            {message && <div className="alert alert-info">{message}</div>}
            
            <div className="row">
                <div className="col-md-6">
                    <div className="card p-4 mb-4">
                        <h4 className="mb-3">📥 إنشاء نسخة احتياطية</h4>
                        <p>قم بتنزيل نسخة كاملة من قاعدة البيانات.</p>
                        <button 
                            className="btn btn-primary btn-lg w-100"
                            onClick={handleBackup}
                            disabled={loading}
                        >
                            {loading ? '⏳ جاري...' : '📥 تحميل النسخة الاحتياطية'}
                        </button>
                    </div>
                </div>
                
                <div className="col-md-6">
                    <div className="card p-4 mb-4">
                        <h4 className="mb-3">📤 استعادة نسخة احتياطية</h4>
                        <p>قم بتحميل ملف النسخة الاحتياطية لاستعادة البيانات.</p>
                        <input
                            type="file"
                            accept=".json"
                            className="form-control mb-3"
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    if (window.confirm('هل أنت متأكد من استعادة النسخة؟ سيتم استبدال البيانات الحالية.')) {
                                        handleRestore(e.target.files[0]);
                                    }
                                }
                            }}
                            disabled={loading}
                        />
                        {loading && <div className="text-center mt-2">⏳ جاري المعالجة...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Backup;
