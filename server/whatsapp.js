const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const whatsappClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'whatsapp-session'
    }),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

whatsappClient.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('امسح QR code من هاتفك:');
    console.log('واتساب → الإعدادات → الأجهزة المرتبطة → ربط جهاز');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('✅ واتساب جاهز!');
});

whatsappClient.on('authenticated', () => {
    console.log('✅ تم التوثيق!');
});

whatsappClient.on('disconnected', (reason) => {
    console.log('❌ انقطع الاتصال:', reason);
});

async function sendWhatsAppMessage(phoneNumber, message) {
    try {
        let formattedNumber = phoneNumber.replace(/\D/g, '');
        
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '964' + formattedNumber.substring(1);
        } else if (!formattedNumber.startsWith('964')) {
            formattedNumber = '964' + formattedNumber;
        }
        
        const chatId = `${formattedNumber}@c.us`;
        const result = await whatsappClient.sendMessage(chatId, message);
        console.log('✅ تم الإرسال!');
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ:', error.message);
        return { success: false, error: error.message };
    }
}

whatsappClient.initialize();

module.exports = { whatsappClient, sendWhatsAppMessage };