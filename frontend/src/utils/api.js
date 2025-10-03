import axios from "axios";

// Base API URL (from frontend .env)
const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : "https://luct-tcm7.onrender.com/api";

// Enhanced API endpoints with all routes
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME: `${API_BASE_URL}/auth/me`,
  },

  // Data Management
  DATA: {
    FACULTIES: `${API_BASE_URL}/faculties`,
    COURSES: `${API_BASE_URL}/courses`,
    COURSES_BY_ID: (id) => `${API_BASE_URL}/courses/${id}`,
    CLASSES: `${API_BASE_URL}/classes`,
    CLASSES_BY_ID: (id) => `${API_BASE_URL}/classes/${id}`,
    MY_CLASSES: `${API_BASE_URL}/my-classes`,
    LECTURERS: `${API_BASE_URL}/lecturers`,
  },

  // Reports Management
  REPORTS: {
    LIST: `${API_BASE_URL}/reports`,
    STATS: `${API_BASE_URL}/reports/stats`,
    COURSE_STATS: `${API_BASE_URL}/reports/course-stats`,
    WEEKLY_TREND: `${API_BASE_URL}/reports/weekly-trend`,
    BY_ID: (id) => `${API_BASE_URL}/reports/${id}`,
    FEEDBACK: (id) => `${API_BASE_URL}/reports/${id}/feedback`,
  },

  // Ratings System
  RATINGS: {
    SUBMIT: `${API_BASE_URL}/ratings`,
    MY_RATINGS: `${API_BASE_URL}/ratings/my-ratings`,
    LECTURER_RATINGS: `${API_BASE_URL}/ratings/lecturer`,
  },

  // Student Monitoring
  STUDENT: {
    ATTENDANCE: `${API_BASE_URL}/students/attendance`,
    STATS: `${API_BASE_URL}/students/stats`,
    PERFORMANCE: `${API_BASE_URL}/students/performance`,
  },

  // Analytics & Monitoring
  ANALYTICS: {
    OVERVIEW: `${API_BASE_URL}/analytics/overview`,
    TRENDS: `${API_BASE_URL}/analytics/trends`,
  },

  // User Management
  USERS: {
    LIST: `${API_BASE_URL}/users`,
    UPDATE_ROLE: (id) => `${API_BASE_URL}/users/${id}/role`,
  },

  // Search
  SEARCH: `${API_BASE_URL}/search`,

  // System
  SYSTEM: {
    HEALTH: `${API_BASE_URL}/health`,
    TEST: `${API_BASE_URL}/test`,
  },
};

// Get token from localStorage with fallback
export const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Enhanced API instance with interceptors
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log API calls in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params || '');
      }
      
      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const { status, data } = error.response || {};
      
      // Handle authentication errors
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = "/login?session_expired=true";
        }
      }
      
      // Enhanced error logging
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: status,
        message: data?.message || error.message,
        data: data
      });
      
      return Promise.reject(error);
    }
  );

  return instance;
};

const apiInstance = createApiInstance();

// Enhanced API call wrapper with better error handling
export const apiCall = async (endpoint, options = {}) => {
  try {
    const config = {
      url: endpoint,
      ...options,
    };

    const response = await apiInstance(config);
    
    // Handle backend response format
    if (response.data && response.data.success === false) {
      throw new Error(response.data.message || "Request failed");
    }
    
    return response.data;
  } catch (error) {
    const { status, data } = error.response || {};
    
    // Create user-friendly error messages
    let userMessage = "An unexpected error occurred";
    
    if (status === 400) {
      userMessage = data?.message || "Invalid request data";
    } else if (status === 401) {
      userMessage = "Authentication required";
    } else if (status === 403) {
      userMessage = "You don't have permission to perform this action";
    } else if (status === 404) {
      userMessage = "Resource not found";
    } else if (status === 409) {
      userMessage = "Resource already exists";
    } else if (status === 500) {
      userMessage = "Server error. Please try again later";
    } else if (error.message) {
      userMessage = error.message;
    }
    
    throw {
      success: false,
      message: userMessage,
      status: status,
      data: data,
      originalError: error
    };
  }
};

// Enhanced API methods with consistent response format
export const api = {
  get: async (endpoint, params = {}) => {
    try {
      const response = await apiCall(endpoint, { 
        method: "GET",
        params 
      });
      return {
        success: true,
        data: response.data || response,
        message: response.message || "Data retrieved successfully",
        status: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.data,
        status: error.status
      };
    }
  },
  
  post: async (endpoint, data = {}) => {
    try {
      const response = await apiCall(endpoint, { 
        method: "POST", 
        data 
      });
      return {
        success: true,
        data: response.data || response,
        message: response.message || "Created successfully",
        status: 201
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.data,
        status: error.status
      };
    }
  },
  
  put: async (endpoint, data = {}) => {
    try {
      const response = await apiCall(endpoint, { 
        method: "PUT", 
        data 
      });
      return {
        success: true,
        data: response.data || response,
        message: response.message || "Updated successfully",
        status: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.data,
        status: error.status
      };
    }
  },
  
  delete: async (endpoint) => {
    try {
      const response = await apiCall(endpoint, { 
        method: "DELETE" 
      });
      return {
        success: true,
        data: response.data || response,
        message: response.message || "Deleted successfully",
        status: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.data,
        status: error.status
      };
    }
  },
};

// Convenience methods for specific endpoints
export const apiMethods = {
  // Auth
  auth: {
    login: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    register: (userData) => api.post(API_ENDPOINTS.AUTH.REGISTER, userData),
    getProfile: () => api.get(API_ENDPOINTS.AUTH.ME),
  },

  // Data Management
  data: {
    getFaculties: () => api.get(API_ENDPOINTS.DATA.FACULTIES),
    getCourses: () => api.get(API_ENDPOINTS.DATA.COURSES),
    getCourseById: (id) => api.get(API_ENDPOINTS.DATA.COURSES_BY_ID(id)),
    createCourse: (data) => api.post(API_ENDPOINTS.DATA.COURSES, data),
    updateCourse: (id, data) => api.put(API_ENDPOINTS.DATA.COURSES_BY_ID(id), data),
    deleteCourse: (id) => api.delete(API_ENDPOINTS.DATA.COURSES_BY_ID(id)),
    getClasses: () => api.get(API_ENDPOINTS.DATA.CLASSES),
    getClassById: (id) => api.get(API_ENDPOINTS.DATA.CLASSES_BY_ID(id)),
    createClass: (data) => api.post(API_ENDPOINTS.DATA.CLASSES, data),
    updateClass: (id, data) => api.put(API_ENDPOINTS.DATA.CLASSES_BY_ID(id), data),
    deleteClass: (id) => api.delete(API_ENDPOINTS.DATA.CLASSES_BY_ID(id)),
    getMyClasses: () => api.get(API_ENDPOINTS.DATA.MY_CLASSES),
    getLecturers: () => api.get(API_ENDPOINTS.DATA.LECTURERS),
  },

  // Reports
  reports: {
    getReports: (params = {}) => api.get(API_ENDPOINTS.REPORTS.LIST, params),
    getReportStats: () => api.get(API_ENDPOINTS.REPORTS.STATS),
    getCourseStats: () => api.get(API_ENDPOINTS.REPORTS.COURSE_STATS),
    getWeeklyTrend: () => api.get(API_ENDPOINTS.REPORTS.WEEKLY_TREND),
    getReportById: (id) => api.get(API_ENDPOINTS.REPORTS.BY_ID(id)),
    createReport: (data) => api.post(API_ENDPOINTS.REPORTS.LIST, data),
    submitFeedback: (id, feedback) => api.post(API_ENDPOINTS.REPORTS.FEEDBACK(id), { feedback }),
    getFeedback: (id) => api.get(API_ENDPOINTS.REPORTS.FEEDBACK(id)),
  },

  // Ratings
  ratings: {
    getMyRatings: () => api.get(API_ENDPOINTS.RATINGS.MY_RATINGS),
    getLecturerRatings: () => api.get(API_ENDPOINTS.RATINGS.LECTURER_RATINGS),
    submitRating: (ratingData) => api.post(API_ENDPOINTS.RATINGS.SUBMIT, ratingData),
  },

  // Student Monitoring
  student: {
    getAttendance: (params = {}) => api.get(API_ENDPOINTS.STUDENT.ATTENDANCE, params),
    getStats: (params = {}) => api.get(API_ENDPOINTS.STUDENT.STATS, params),
    getPerformance: () => api.get(API_ENDPOINTS.STUDENT.PERFORMANCE),
  },

  // Analytics
  analytics: {
    getOverview: () => api.get(API_ENDPOINTS.ANALYTICS.OVERVIEW),
    getTrends: () => api.get(API_ENDPOINTS.ANALYTICS.TRENDS),
  },

  // User Management
  users: {
    getUsers: () => api.get(API_ENDPOINTS.USERS.LIST),
    updateUserRole: (id, role) => api.put(API_ENDPOINTS.USERS.UPDATE_ROLE(id), { role }),
  },

  // Search
  search: (query) => api.get(API_ENDPOINTS.SEARCH, { q: query }),

  // System
  system: {
    healthCheck: () => api.get(API_ENDPOINTS.SYSTEM.HEALTH),
    testConnection: () => api.get(API_ENDPOINTS.SYSTEM.TEST),
  },
};

// Utility functions
export const apiUtils = {
  // Test backend connection
  testConnection: async () => {
    try {
      const response = await apiMethods.system.testConnection();
      console.log('✅ Backend connection successful');
      return { connected: true, data: response.data };
    } catch (error) {
      console.error('❌ Backend connection failed:', error.message);
      return { connected: false, error: error.message };
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiMethods.system.healthCheck();
      return { healthy: true, data: response.data };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  },

  // Batch requests
  batch: (requests) => Promise.all(requests),

  // Retry mechanism
  retry: async (fn, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiUtils.retry(fn, retries - 1, delay * 2);
    }
  },
};

// Initialize connection test on import
if (typeof window !== 'undefined') {
  apiUtils.testConnection().then(result => {
    if (result.connected) {
      console.log('🎉 API initialized successfully');
    } else {
      console.warn('⚠️ API connection issues - some features may not work');
    }
  });
}

export default api;