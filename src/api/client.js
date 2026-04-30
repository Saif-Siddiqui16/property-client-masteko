import axios from 'axios';

const api = axios.create({
    //baseURL: 'http://localhost:5000',
    //baseURL: 'https://property-demo-saif-production.up.railway.app',
    //baseURL: 'https://saif-property-news-production-9d29.up.railway.app',
    baseURL: 'https://saif-property-client-railway-production.up.railway.app',

    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 (optional for now)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Optional: Only redirect if NOT already on login or invite page
            if (!window.location.pathname.match(/\/(login|invite)/)) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
