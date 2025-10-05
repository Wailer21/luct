import axios from "axios";

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://luct-7.onrender.com";

export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/auth/me`,

  // Data
  FACULTIES: `${API_BASE_URL}/api/faculties`,
  COURSES: `${API_BASE_URL}/api/courses`,
  CLASSES: `${API_BASE_URL}/api/classes`,
  MY_CLASSES: `${API_BASE_URL}/api/my-classes`,
  LECTURERS: `${API_BASE_URL}/api/lecturers`,

  // Reports
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORTS_STATS: `${API_BASE_URL}/api/reports/stats`,
  REPORTS_BY_ID: (id) => `${API_BASE_URL}/api/reports/${id}`,
  REPORTS_FEEDBACK: (id) => `${API_BASE_URL}/api/reports/${id}/feedback`,

  // Ratings
  RATINGS: `${API_BASE_URL}/api/ratings`,
  RATINGS_MY: `${API_BASE_URL}/api/ratings/my-ratings`,
  RATINGS_LECTURER: `${API_BASE_URL}/api/ratings/lecturer`,

  // Search
  SEARCH: `${API_BASE_URL}/api/search`,

  // Student
  STUDENT_ATTENDANCE: `${API_BASE_URL}/api/students/attendance`,
  STUDENT_STATS: `${API_BASE_URL}/api/students/stats`,
  STUDENT_PERFORMANCE: `${API_BASE_URL}/api/students/performance`,

  // Analytics
  ANALYTICS_OVERVIEW: `${API_BASE_URL}/api/analytics/overview`,
  ANALYTICS_TRENDS: `${API_BASE_URL}/api/analytics/trends`,

  // User Management
  USERS: `${API_BASE_URL}/api/users`,
  USERS_UPDATE_ROLE: (id) => `${API_BASE_URL}/api/users/${id}/role`,

  // Health
  HEALTH: `${API_BASE_URL}/api/health`,
  TEST: `${API_BASE_URL}/api/test`,
};

// Get token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Enhanced API instance with interceptors
const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Reduced from 30000 to 15000
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Content-Type"] = "application/json";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Enhanced API call wrapper with better error handling and retry logic
export const apiCall = async (endpoint, options = {}, retries = 2) => {
  try {
    const config = {
      url: endpoint,
      ...options,
    };

    console.log(`🔄 API Call: ${config.method?.toUpperCase() || 'GET'} ${endpoint}`);

    const response = await apiInstance(config);
    
    // Handle backend response format - your backend returns {success, message, data, timestamp}
    if (response.data && response.data.success === false) {
      throw new Error(response.data.message || "Request failed");
    }
    
    return response.data; // This returns the full response object from your backend
  } catch (error) {
    console.error("❌ API Call failed:", {
      endpoint,
      method: options.method,
      error: error.response?.data || error.message
    });

    // Retry logic for timeout errors
    if (error.code === 'ECONNABORTED' && retries > 0) {
      console.log(`🔄 Retrying API call (${retries} retries left)...`);
      return apiCall(endpoint, options, retries - 1);
    }
    
    // Enhanced error handling
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    
    // Return a consistent error format
    const errorMessage = error.response?.data?.message || error.message || "API request failed";
    throw {
      success: false,
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// FIXED: Enhanced API methods with proper response handling
export const api = {
  get: async (endpoint, params = {}) => {
    try {
      const response = await apiCall(endpoint, { 
        method: "GET",
        params 
      });
      
      // FIXED: Your backend returns {success, message, data, timestamp}
      // So we return the response directly, not response.data
      return {
        success: response.success !== false, // Handle both true and undefined as success
        data: response.data || response, // Some endpoints might return data directly
        message: response.message || "Request successful"
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
      
      // FIXED: Your backend returns {success, message, data, timestamp}
      return {
        success: response.success !== false,
        data: response.data || response,
        message: response.message || "Created successfully"
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
        success: response.success !== false,
        data: response.data || response,
        message: response.message || "Updated successfully"
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
        success: response.success !== false,
        data: response.data || response,
        message: response.message || "Deleted successfully"
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
  login: (credentials) => api.post(API_ENDPOINTS.LOGIN, credentials),
  register: (userData) => api.post(API_ENDPOINTS.REGISTER, userData),
  getProfile: () => api.get(API_ENDPOINTS.ME),
  
  // Data
  getFaculties: () => api.get(API_ENDPOINTS.FACULTIES),
  getCourses: () => api.get(API_ENDPOINTS.COURSES),
  getClasses: () => api.get(API_ENDPOINTS.CLASSES),
  getMyClasses: () => api.get(API_ENDPOINTS.MY_CLASSES),
  getLecturers: () => api.get(API_ENDPOINTS.LECTURERS),
  
  // Reports
  getReports: (params = {}) => api.get(API_ENDPOINTS.REPORTS, params),
  getReportStats: () => api.get(API_ENDPOINTS.REPORTS_STATS),
  getReportById: (id) => api.get(API_ENDPOINTS.REPORTS_BY_ID(id)),
  createReport: (data) => api.post(API_ENDPOINTS.REPORTS, data),
  submitFeedback: (id, feedback) => api.post(API_ENDPOINTS.REPORTS_FEEDBACK(id), { feedback }),
  
  // Ratings
  getMyRatings: () => api.get(API_ENDPOINTS.RATINGS_MY),
  getLecturerRatings: () => api.get(API_ENDPOINTS.RATINGS_LECTURER),
  submitRating: (ratingData) => api.post(API_ENDPOINTS.RATINGS, ratingData),
  
  // Student Monitoring
  getStudentAttendance: (params = {}) => api.get(API_ENDPOINTS.STUDENT_ATTENDANCE, params),
  getStudentStats: (params = {}) => api.get(API_ENDPOINTS.STUDENT_STATS, params),
  getStudentPerformance: () => api.get(API_ENDPOINTS.STUDENT_PERFORMANCE),
  
  // Analytics
  getAnalyticsOverview: () => api.get(API_ENDPOINTS.ANALYTICS_OVERVIEW),
  getAnalyticsTrends: () => api.get(API_ENDPOINTS.ANALYTICS_TRENDS),
  
  // User Management
  getUsers: () => api.get(API_ENDPOINTS.USERS),
  updateUserRole: (id, role) => api.put(API_ENDPOINTS.USERS_UPDATE_ROLE(id), { role }),
  
  // Search
  search: (query) => api.get(API_ENDPOINTS.SEARCH, { q: query }),
  
  // System
  healthCheck: () => api.get(API_ENDPOINTS.HEALTH),
  testConnection: () => api.get(API_ENDPOINTS.TEST),
};

// Test backend connection on app startup
export const testBackendConnection = async () => {
  try {
    const response = await apiMethods.testConnection();
    console.log('✅ Backend connection successful:', response);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};

// Initialize connection test
testBackendConnection();

export default api;