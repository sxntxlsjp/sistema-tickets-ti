const API_URL = `${window.location.origin}/api`;

const getToken = () => {
    return localStorage.getItem('token');
};

const setToken = (token) => {
    localStorage.setItem('token', token);
};

const removeToken = () => {
    localStorage.removeItem('token');
};

const authHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
};