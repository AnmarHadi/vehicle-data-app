const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();

// تحديث CORS ليقبل الطلبات من أي مصدر
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));

app.use(express.json({ limit: '50mb' }));

// استخدام متغير البيئة PORT إذا كان موجوداً (مطلوب للاستضافة)
const PORT = process.env.PORT || 5001;

// ============ إعدادات Supabase ============
const SUPABASE_URL = 'https://xxekphfpmymsulerprvz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// دالة جلب البيانات من جدول
async function fetchTable(table) {
    try {
        const response = await axios.get(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${table}:`, error.message);
        return [];
    }
}

// دالة إدخال بيانات
async function insertToTable(table, data) {
    try {
        const response = await axios.post(`${SUPABASE_URL}/rest/v1/${table}`, data, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error inserting to ${table}:`, error.message);
        throw error;
    }
}

// دالة تحديث بيانات
async function updateTable(table, id, data) {
    try {
        await axios.patch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, data, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error(`Error updating ${table}:`, error.message);
        throw error;
    }
}

// دالة حذف بيانات
async function deleteFromTable(table, id) {
    try {
        await axios.delete(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
    } catch (error) {
        console.error(`Error deleting from ${table}:`, error.message);
        throw error;
    }
}

console.log('✅ Supabase REST API configured');

// ============ Rate Limiting ============
const requestCounts = {};
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 120;

app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!requestCounts[ip]) {
        requestCounts[ip] = { count: 0, firstRequest: Date.now() };
    }
    
    const elapsed = Date.now() - requestCounts[ip].firstRequest;
    
    if (elapsed > RATE_LIMIT_WINDOW) {
        requestCounts[ip] = { count: 0, firstRequest: Date.now() };
    }
    
    requestCounts[ip].count++;
    
    if (requestCounts[ip].count > RATE_LIMIT_MAX) {
        return res.status(429).json({ message: 'طلبات كثيرة جداً، حاول لاحقاً' });
    }
    
    next();
});

// Middleware للتسجيل
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ============ دالة جلب اسم السائق ============
async function getDriverName(user) {
    if (user.role !== 'driver' || !user.phoneNumber) return null;
    
    try {
        const vehicles = await fetchTable('vehicleData');
        const vehicle = vehicles.find(v => v.phoneNumber === user.phoneNumber);
        
        if (vehicle) {
            return `${vehicle.firstName || ''} ${vehicle.fatherName || ''} ${vehicle.grandfatherName || ''} ${vehicle.lastName || ''}`.trim();
        }
    } catch (error) {
        console.error('Error getting driver name:', error);
    }
    return null;
}

// ============ التحقق من وجود مدير ============
app.get('/check-admin', async (req, res) => {
    try {
        const users = await fetchTable('users');
        const hasAdmin = users.some(u => u.role === 'admin');
        res.json({ hasAdmin });
    } catch (error) {
        res.json({ hasAdmin: false });
    }
});

// ============ إنشاء المدير ============
app.post('/setup-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'يرجى ملء جميع الحقول' });
        }
        
        const users = await fetchTable('users');
        if (users.some(u => u.role === 'admin')) {
            return res.status(400).json({ message: 'يوجد مدير بالفعل' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await insertToTable('users', {
            id: Date.now(),
            username,
            password: hashedPassword,
            role: 'admin',
            permissions: {
                dashboard: true,
                wheelTypes: true,
                dataEntry: true,
                users: true,
                viewData: true,
                edit: true,
                delete: true,
                addWheelType: true,
                editWheelType: true,
                deleteWheelType: true,
                editVehicleData: true,
                deleteVehicleData: true,
                exportExcel: true,
                exportPDF: true,
                exportAccess: true,
                resetDevice: true,
                addUser: true,
                editUser: true,
                toggleUserActive: true,
                resetUserPassword: true,
                saveDataEntry: true
            },
            isActive: true,
            createdAt: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'تم إنشاء المدير بنجاح' });
        
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'خطأ في إنشاء المدير' });
    }
});

// ============ تسجيل الدخول ============
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const users = await fetchTable('users');
        const user = users.find(u => u.username === username && u.isActive);
        
        if (!user) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, permissions: user.permissions },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                permissions: user.permissions
            }
        });
        
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'خطأ في تسجيل الدخول' });
    }
});

// ============ تغيير كلمة المرور ============
app.post('/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        
        const users = await fetchTable('users');
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updateTable('users', user.id, { password: hashedPassword });
        
        res.json({ success: true });
        
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تغيير كلمة المرور' });
    }
});

// ============ أنواع العجلات ============
app.get('/wheel-types', async (req, res) => {
    try {
        const types = await fetchTable('wheelTypes');
        res.json(types);
    } catch (error) {
        res.json([]);
    }
});

app.post('/wheel-types', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'يرجى إدخال اسم النوع' });
        
        const newType = { id: Date.now(), name };
        await insertToTable('wheelTypes', newType);
        res.json(newType);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الإضافة' });
    }
});

app.put('/wheel-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        await updateTable('wheelTypes', id, { name });
        res.json({ id: Number(id), name });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في التعديل' });
    }
});

app.delete('/wheel-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteFromTable('wheelTypes', id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الحذف' });
    }
});

// ============ المستخدمون ============
app.get('/users', async (req, res) => {
    try {
        const users = await fetchTable('users');
        const safeUsers = [];
        
        for (const user of users.filter(u => u.role !== 'admin')) {
            const { password, ...safeUser } = user;
            const driverName = await getDriverName(user);
            safeUsers.push(driverName ? { ...safeUser, driverName } : safeUser);
        }
        
        res.json(safeUsers);
    } catch (error) {
        res.json([]);
    }
});

app.get('/users/all', async (req, res) => {
    try {
        const users = await fetchTable('users');
        const safeUsers = [];
        
        for (const user of users) {
            const { password, ...safeUser } = user;
            const driverName = await getDriverName(user);
            safeUsers.push(driverName ? { ...safeUser, driverName } : safeUser);
        }
        
        res.json(safeUsers);
    } catch (error) {
        res.json([]);
    }
});

app.post('/users', async (req, res) => {
    try {
        const { username, permissions } = req.body;
        
        const users = await fetchTable('users');
        if (users.some(u => u.username === username)) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        const hashedPassword = await bcrypt.hash('000000', 10);
        const newUser = {
            id: Date.now(),
            username,
            password: hashedPassword,
            role: 'user',
            permissions: permissions || {},
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        await insertToTable('users', newUser);
        
        const { password, ...safeUser } = newUser;
        res.json(safeUser);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة المستخدم' });
    }
});

app.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, permissions, isActive } = req.body;
        
        const updateData = {};
        if (username) updateData.username = username;
        if (permissions) updateData.permissions = permissions;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        await updateTable('users', id, updateData);
        
        const users = await fetchTable('users');
        const user = users.find(u => u.id == id);
        if (user) {
            const { password, ...safeUser } = user;
            res.json(safeUser);
        } else {
            res.status(404).json({ message: 'المستخدم غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تعديل المستخدم' });
    }
});

app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const users = await fetchTable('users');
        const user = users.find(u => u.id == id);
        
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'لا يمكن حذف حساب الأدمن' });
        }
        
        await deleteFromTable('users', id);
        res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الحذف' });
    }
});

app.post('/users/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const hashedPassword = await bcrypt.hash('000000', 10);
        await updateTable('users', id, { password: hashedPassword });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إعادة تعيين كلمة المرور' });
    }
});

// ============ بيانات العجلات ============
app.get('/vehicle-data', async (req, res) => {
    try {
        const data = await fetchTable('vehicleData');
        res.json(data);
    } catch (error) {
        res.json([]);
    }
});

app.post('/vehicle-data', async (req, res) => {
    try {
        const data = req.body;
        const { id: clientId, ...dataWithoutId } = data;
        
        if (data.isAdditionalVehicle) {
            const newId = Date.now() + Math.floor(Math.random() * 1000);
            const newData = { id: newId, ...dataWithoutId, isAdditionalVehicle: true, createdAt: new Date().toISOString() };
            await insertToTable('vehicleData', newData);
            return res.json(newData);
        }
        
        const vehicles = await fetchTable('vehicleData');
        const existing = vehicles.find(v => v.nationalId === data.nationalId && !v.isAdditionalVehicle);
        
        if (existing) {
            return res.status(400).json({ success: false, message: 'رقم البطاقة مسجل مسبقاً!' });
        }
        
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const newData = { id: newId, ...dataWithoutId, isAdditionalVehicle: false, createdAt: new Date().toISOString() };
        await insertToTable('vehicleData', newData);
        
        res.json(newData);
    } catch (error) {
        console.error('Error saving vehicle data:', error);
        res.status(500).json({ message: 'خطأ في حفظ البيانات' });
    }
});

app.put('/vehicle-data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const { id: clientId, ...dataWithoutId } = data;
        
        await updateTable('vehicleData', id, dataWithoutId);
        
        const vehicles = await fetchTable('vehicleData');
        const vehicle = vehicles.find(v => v.id == id);
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في التعديل' });
    }
});

app.delete('/vehicle-data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteFromTable('vehicleData', id);
        res.json({ success: true, message: 'تم حذف العجلة بنجاح', deletedId: Number(id) });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الحذف' });
    }
});

// ============ النسخ الاحتياطي ============
app.get('/backup-data', async (req, res) => {
    try {
        const users = await fetchTable('users');
        const wheelTypes = await fetchTable('wheelTypes');
        const vehicleData = await fetchTable('vehicleData');
        
        const backupData = {
            users,
            wheelTypes,
            vehicleData,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup_${Date.now()}.json`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ تسجيل السائقين ============
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

app.post('/check-driver', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const users = await fetchTable('users');
        res.json({ exists: users.some(u => u.phoneNumber === phoneNumber) });
    } catch (error) {
        res.json({ exists: false });
    }
});

app.post('/register-driver', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
            return res.status(400).json({ message: 'رقم هاتف غير صحيح' });
        }
        
        const users = await fetchTable('users');
        if (users.some(u => u.phoneNumber === phoneNumber)) {
            return res.status(400).json({ message: 'هذا الرقم مسجل مسبقاً' });
        }
        
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await insertToTable('users', {
            id: Date.now(),
            phoneNumber,
            password: hashedPassword,
            role: 'driver',
            permissions: { driverAccess: true },
            isActive: true,
            createdAt: new Date().toISOString()
        });
        
        const message = `🔐 كلمة المرور الخاصة بك:\n\n🔑 ${password}\n\nيرجى الحفاظ عليها.`;
        
        try {
            await axios.post('http://localhost:5002/send-whatsapp', {
                phoneNumber,
                message
            });
            res.json({ success: true, message: 'تم إرسال كلمة المرور عبر واتساب' });
        } catch (e) {
            res.json({ success: true, message: 'تم التسجيل بنجاح', password });
        }
        
    } catch (error) {
        res.status(500).json({ message: 'خطأ في التسجيل' });
    }
});

app.post('/resend-password', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        const users = await fetchTable('users');
        const driver = users.find(u => u.phoneNumber === phoneNumber);
        
        if (!driver) {
            return res.json({ exists: false, message: 'هذا الرقم غير مسجل' });
        }
        
        const newPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await updateTable('users', driver.id, { password: hashedPassword });
        
        const message = `🔐 كلمة المرور الجديدة:\n\n🔑 ${newPassword}\n\nيرجى الحفاظ عليها.`;
        
        try {
            await axios.post('http://localhost:5002/send-whatsapp', {
                phoneNumber,
                message
            });
            res.json({ success: true, message: 'تم إرسال كلمة المرور الجديدة' });
        } catch (e) {
            res.json({ success: true, message: 'تم تحديث كلمة المرور', password: newPassword });
        }
        
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إعادة الإرسال' });
    }
});

app.post('/login-driver', async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        
        const users = await fetchTable('users');
        const driver = users.find(u => u.phoneNumber === phoneNumber);
        
        if (!driver) {
            return res.status(401).json({ message: 'رقم الهاتف غير مسجل' });
        }
        
        if (!driver.isActive) {
            return res.status(401).json({ message: 'هذا الحساب موقوف' });
        }
        
        const isValid = await bcrypt.compare(password, driver.password);
        if (!isValid) {
            return res.status(401).json({ message: 'كلمة المرور غير صحيحة لهذا الرقم' });
        }
        
        const token = jwt.sign(
            { id: driver.id, phoneNumber: driver.phoneNumber, role: 'driver' },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: driver.id,
                phoneNumber: driver.phoneNumber,
                role: 'driver'
            }
        });
        
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تسجيل الدخول' });
    }
});

app.get('/driver-data/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const vehicles = await fetchTable('vehicleData');
        res.json(vehicles.find(v => v.phoneNumber === phoneNumber) || null);
    } catch (error) {
        res.json(null);
    }
});

app.get('/driver-vehicles/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const vehicles = await fetchTable('vehicleData');
        res.json(vehicles.filter(v => v.phoneNumber && v.phoneNumber.replace(/\D/g, '') === cleanPhone));
    } catch (error) {
        res.json([]);
    }
});

// ============ تقديم ملفات React (للإنتاج) ============
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
    
    if (fs.existsSync(clientBuildPath)) {
        app.use(express.static(clientBuildPath));
        
        app.get('*', (req, res) => {
            const apiRoutes = [
                '/check-admin', '/setup-admin', '/login', '/change-password',
                '/wheel-types', '/users', '/vehicle-data', '/backup-data',
                '/restore-data', '/check-driver', '/register-driver',
                '/resend-password', '/login-driver', '/driver-data',
                '/driver-vehicles', '/export-to-access', '/templates'
            ];
            
            if (!apiRoutes.some(route => req.url.startsWith(route))) {
                res.sendFile(path.join(clientBuildPath, 'index.html'));
            }
        });
    }
}

app.listen(PORT, () => {
    console.log('=================================');
    console.log(`Server running on port ${PORT}`);
    console.log('Database: Supabase REST API');
    console.log('=================================');
});