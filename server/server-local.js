const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// تخزين البيانات في ملف JSON
const DATA_FILE = path.join(__dirname, 'data.json');

// تحميل البيانات من الملف
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return {
        users: [],
        wheelTypes: [],
        vehicleData: [],
        blockedDevices: []
    };
}

// حفظ البيانات إلى الملف
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

let db = loadData();

// Middleware للمصادقة
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'غير مصرح بالوصول' });
    }

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'انتهت صلاحية الجلسة' });
        }
        req.user = user;
        next();
    });
};

// Middleware للتحقق من الصلاحيات
const checkPermission = (permission) => {
    return (req, res, next) => {
        const userPermissions = req.user.permissions || {};
        if (userPermissions[permission] || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'ليس لديك صلاحية للوصول' });
        }
    };
};

// ============ Routes ============

// التحقق من وجود مدير
app.get('/api/check-admin', (req, res) => {
    const hasAdmin = db.users.some(u => u.role === 'admin');
    res.json({ hasAdmin });
});

// إنشاء مدير النظام
app.post('/api/setup-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const hasAdmin = db.users.some(u => u.role === 'admin');
        if (hasAdmin) {
            return res.status(400).json({ message: 'يوجد مدير بالفعل في النظام' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const adminUser = {
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
                delete: true
            },
            isActive: true,
            createdAt: new Date().toISOString()
        };

        db.users.push(adminUser);
        saveData(db);

        res.json({ success: true, message: 'تم إنشاء حساب المدير بنجاح' });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'خطأ في إنشاء المدير' });
    }
});

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = db.users.find(u => u.username === username && u.isActive);

        if (!user) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                permissions: user.permissions 
            },
            'your-secret-key',
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
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// تغيير كلمة المرور
app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = db.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        saveData(db);

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'خطأ في تغيير كلمة المرور' });
    }
});

// إدارة أنواع العجلات
app.get('/api/wheel-types', authenticateToken, (req, res) => {
    res.json(db.wheelTypes);
});

app.post('/api/wheel-types', authenticateToken, checkPermission('wheelTypes'), (req, res) => {
    try {
        const { name } = req.body;
        const newType = { id: Date.now(), name };
        db.wheelTypes.push(newType);
        saveData(db);
        res.json(newType);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة النوع' });
    }
});

app.put('/api/wheel-types/:id', authenticateToken, checkPermission('edit'), (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const index = db.wheelTypes.findIndex(t => t.id === Number(id));
        if (index !== -1) {
            db.wheelTypes[index].name = name;
            saveData(db);
            res.json(db.wheelTypes[index]);
        } else {
            res.status(404).json({ message: 'النوع غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تعديل النوع' });
    }
});

app.delete('/api/wheel-types/:id', authenticateToken, checkPermission('delete'), (req, res) => {
    try {
        const { id } = req.params;
        db.wheelTypes = db.wheelTypes.filter(t => t.id !== Number(id));
        saveData(db);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في حذف النوع' });
    }
});

// إدارة المستخدمين
app.get('/api/users', authenticateToken, checkPermission('users'), (req, res) => {
    const safeUsers = db.users.map(({ password, ...user }) => user);
    res.json(safeUsers);
});

app.post('/api/users', authenticateToken, checkPermission('users'), async (req, res) => {
    try {
        const { username, permissions } = req.body;
        const hashedPassword = await bcrypt.hash('000000', 10);
        const newUser = {
            id: Date.now(),
            username,
            password: hashedPassword,
            role: 'user',
            permissions,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        db.users.push(newUser);
        saveData(db);
        const { password, ...safeUser } = newUser;
        res.json(safeUser);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة المستخدم' });
    }
});

app.put('/api/users/:id', authenticateToken, checkPermission('users'), (req, res) => {
    try {
        const { id } = req.params;
        const { username, permissions, isActive } = req.body;
        const index = db.users.findIndex(u => u.id === Number(id));
        if (index !== -1) {
            db.users[index].username = username;
            db.users[index].permissions = permissions;
            db.users[index].isActive = isActive;
            saveData(db);
            const { password, ...safeUser } = db.users[index];
            res.json(safeUser);
        } else {
            res.status(404).json({ message: 'المستخدم غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تعديل المستخدم' });
    }
});

app.post('/api/users/:id/reset-password', authenticateToken, checkPermission('users'), async (req, res) => {
    try {
        const { id } = req.params;
        const hashedPassword = await bcrypt.hash('000000', 10);
        const index = db.users.findIndex(u => u.id === Number(id));
        if (index !== -1) {
            db.users[index].password = hashedPassword;
            saveData(db);
            res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور إلى 000000' });
        } else {
            res.status(404).json({ message: 'المستخدم غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إعادة تعيين كلمة المرور' });
    }
});

// إدارة بيانات العجلات
app.get('/api/vehicle-data', authenticateToken, checkPermission('viewData'), (req, res) => {
    const { fromDate, toDate, searchName, searchPlate } = req.query;
    let filteredData = [...db.vehicleData];

    if (fromDate && toDate) {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= new Date(fromDate) && itemDate <= new Date(toDate);
        });
    }

    if (searchName) {
        filteredData = filteredData.filter(item =>
            `${item.firstName} ${item.fatherName} ${item.lastName}`.includes(searchName)
        );
    }

    if (searchPlate) {
        filteredData = filteredData.filter(item =>
            `${item.plateGovernorate}${item.plateLetter}${item.plateNumber}`.includes(searchPlate)
        );
    }

    res.json(filteredData);
});

app.post('/api/vehicle-data', async (req, res) => {
    try {
        const data = req.body;
        const newData = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString()
        };
        db.vehicleData.push(newData);
        saveData(db);
        res.json(newData);
    } catch (error) {
        console.error('Error saving vehicle data:', error);
        res.status(500).json({ message: 'خطأ في حفظ البيانات' });
    }
});

app.put('/api/vehicle-data/:id', authenticateToken, checkPermission('edit'), (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const index = db.vehicleData.findIndex(d => d.id === Number(id));
        if (index !== -1) {
            db.vehicleData[index] = { ...db.vehicleData[index], ...data };
            saveData(db);
            res.json(db.vehicleData[index]);
        } else {
            res.status(404).json({ message: 'البيانات غير موجودة' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تعديل البيانات' });
    }
});

app.delete('/api/vehicle-data/:id', authenticateToken, checkPermission('delete'), (req, res) => {
    try {
        const { id } = req.params;
        db.vehicleData = db.vehicleData.filter(d => d.id !== Number(id));
        saveData(db);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في حذف البيانات' });
    }
});

// التحقق من الجهاز المحظور
app.post('/api/check-device', (req, res) => {
    const { deviceId } = req.body;
    const isBlocked = db.blockedDevices.some(d => d.deviceId === deviceId);
    res.json({ isBlocked });
});

// حظر جهاز بعد إدخال البيانات
app.post('/api/block-device', (req, res) => {
    const { deviceId, vehicleDataId } = req.body;
    db.blockedDevices.push({ deviceId, vehicleDataId });
    saveData(db);
    res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('=================================');
    console.log('Server is running on port ' + PORT);
    console.log('Using file-based storage');
    console.log('Data file: ' + DATA_FILE);
    console.log('=================================');
});