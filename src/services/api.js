import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Token exists' : 'No token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization.substring(0, 20) + '...');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token may be invalid');
      console.log('Response:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData)
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getPending: () => api.get('/users/pending'),
  approve: (id) => api.put(`/users/${id}/approve`),
  suspend: (id) => api.put(`/users/${id}/suspend`),
  activate: (id) => api.put(`/users/${id}/activate`),
  delete: (id) => api.delete(`/users/${id}`)
};

// Jobs API
export const jobsAPI = {
  getAll: () => api.get('/jobs'),
  getPending: () => api.get('/jobs/pending'),
  getAllJobs: () => api.get('/jobs/all'),
  create: (jobData) => api.post('/jobs', jobData),
  approve: (id, collection) => api.put(`/jobs/${id}/approve`, { collection }),
  updateStatus: (id, status) => api.put(`/jobs/${id}/status`, { status }),
  delete: (id, collection) => api.delete(`/jobs/${id}`, { params: { collection } })
};

// Bookings API
export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  getPending: () => api.get('/bookings/pending'),
  getById: (id) => api.get(`/bookings/${id}`),
  approve: (id, adminNotes) => api.put(`/bookings/${id}/approve`, { adminNotes }),
  reject: (id, rejectionReason) => api.put(`/bookings/${id}/reject`, { rejectionReason }),
  updatePayment: (id, paymentStatus) => api.put(`/bookings/${id}/payment`, { paymentStatus }),
  delete: (id) => api.delete(`/bookings/${id}`)
};

export default api;
