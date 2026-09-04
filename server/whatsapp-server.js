const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

// معالجة الأخطاء غير المعالجة
process.on('unhandledRejection', (reason) => {
    console.log('⚠️ Unhandled Rejection:', reason);
});

let qrImageData = null;
let isConnected = false;
let connectionStatus = 'disconnected';

const whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: 'whatsapp-session' }),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run'
        ]
    }
});

whatsappClient.on('qr', async (qr) => {
    try {
        qrImageData = await QRCode.toDataURL(qr);
        connectionStatus = 'waiting_qr';
        console.log('📱 QR code جاهز - امسحه من هاتفك');
    } catch (error) {
        console.error('QR error:', error);
    }
});

whatsappClient.on('ready', () => {
    isConnected = true;
    connectionStatus = 'connected';
    qrImageData = null;
    console.log('✅ واتساب متصل!');
});

whatsappClient.on('authenticated', () => {
    console.log('✅ تم التوثيق!');
});

whatsappClient.on('auth_failure', (msg) => {
    console.log('❌ فشل التوثيق:', msg);
});

whatsappClient.on('disconnected', (reason) => {
    isConnected = false;
    connectionStatus = 'disconnected';
    qrImageData = null;
    console.log('❌ انقطع الاتصال:', reason);
});

app.get('/whatsapp-qr-image', (req, res) => {
    if (isConnected) {
        res.json({ connected: true, qrImage: null });
    } else if (qrImageData) {
        res.json({ connected: false, qrImage: qrImageData });
    } else {
        res.json({ connected: false, qrImage: null });
    }
});

app.get('/whatsapp-status', (req, res) => {
    res.json({ status: connectionStatus, isConnected, hasQR: !!qrImageData });
});

app.post('/logout-whatsapp', async (req, res) => {
    try {
        await whatsappClient.logout();
        isConnected = false;
        connectionStatus = 'disconnected';
        qrImageData = null;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/send-whatsapp', async (req, res) => {
    const { phoneNumber, message } = req.body;
    if (!isConnected) return res.status(400).json({ success: false, error: 'واتساب غير متصل' });
    try {
        let formattedNumber = phoneNumber.replace(/\D/g, '');
        if (formattedNumber.startsWith('0')) formattedNumber = '964' + formattedNumber.substring(1);
        else if (!formattedNumber.startsWith('964')) formattedNumber = '964' + formattedNumber;
        const chatId = `${formattedNumber}@c.us`;
        const result = await whatsappClient.sendMessage(chatId, message);
        res.json({ success: true, messageId: result.id._serialized });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`WhatsApp server on port ${PORT}`);
    
    whatsappClient.initialize().catch(error => {
        console.error('❌ خطأ في التهيئة:', error.message);
        console.log('🔄 إعادة المحاولة خلال 5 ثواني...');
        setTimeout(() => {
            whatsappClient.initialize().catch(e => console.error('خطأ:', e.message));
        }, 5000);
    });
});