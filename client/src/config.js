const config = {
    apiUrl: process.env.NODE_ENV === 'production' 
        ? '' // في الإنتاج، الخادم والواجهة على نفس العنوان
        : 'http://localhost:5001'
};

export default config;