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
  PROGRAM_CLASSES: (programId) => `${API_BASE_URL}/api/programs/${programId}/classes`,

  // Reports
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORTS_STATS: `${API_BASE_URL}/api/reports/stats`,
  REPORTS_BY_ID: (id) => `${API_BASE_URL}/api/reports/${id}`,
  REPORTS_FEEDBACK: (id) => `${API_BASE_URL}/api/reports/${id}/feedback`,
  MY_REPORTS: `${API_BASE_URL}/api/reports/my-reports`,

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
  timeout: 15000,
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Content-Type"] = "application/json";
    
    config.metadata = { startTime: new Date() };
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiInstance.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      duration: `${duration}ms`,
      data: response.data
    });
    
    return response;
  },
  (error) => {
    const endTime = new Date();
    const duration = error.config ? endTime - error.config.metadata.startTime : 'N/A';
    
    console.error(`💥 API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      duration: `${duration}ms`,
      error: error.message,
      code: error.code,
      responseData: error.response?.data
    });

    if (error.response?.status === 401) {
      console.warn("🔐 Authentication failed - redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }
    
    return Promise.reject(error);
  }
);

// Enhanced API call wrapper with better error handling and retry logic
export const apiCall = async (endpoint, options = {}, retries = 2) => {
  const maxRetries = retries;
  
  try {
    const config = {
      url: endpoint,
      ...options,
    };

    console.log(`🔄 API Call attempt: ${config.method?.toUpperCase() || 'GET'} ${endpoint} (${maxRetries - retries + 1}/${maxRetries + 1})`);

    const response = await apiInstance(config);
    
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Server returned HTML error page (Status: ${response.status})`);
    }
    
    return response.data;
  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    const isNetworkError = error.message.includes('Network Error') || !error.response;
    const isCorsError = error.message.includes('CORS') || error.message.includes('Access-Control');
    
    console.error(`❌ API Call failed: ${options.method?.toUpperCase() || 'GET'} ${endpoint}`, {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      responseData: error.response?.data,
      isTimeout,
      isNetworkError,
      isCorsError,
      retriesLeft: retries
    });

    let errorMessage = error.response?.data?.message || error.message || "API request failed";
    
    if (error.response?.status === 400 && error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join(', ');
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      }
    }

    if ((isTimeout || isNetworkError) && retries > 0 && !error.response?.status?.toString().startsWith('4')) {
      const delay = Math.pow(2, maxRetries - retries) * 1000;
      console.log(`⏳ Retrying in ${delay}ms... (${retries} retries left)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiCall(endpoint, options, retries - 1);
    }
    
    if (isCorsError) {
      errorMessage = "CORS error: Backend is not configured to accept requests from this origin. Please check backend CORS settings.";
    } else if (isTimeout) {
      errorMessage = "Backend server is not responding. Please check if the server is running.";
    } else if (isNetworkError) {
      errorMessage = "Network connection failed. Please check your internet connection.";
    } else if (error.response?.status === 400) {
      errorMessage = `Bad Request: ${errorMessage}`;
    } else if (error.response?.status === 404) {
      errorMessage = "Endpoint not found. The requested resource does not exist.";
    } else if (error.response?.status === 500) {
      errorMessage = "Server error. Please try again later.";
    }
    
    throw {
      success: false,
      message: errorMessage,
      status: error.response?.status,
      code: error.code,
      data: error.response?.data,
      isTimeout,
      isNetworkError,
      isCorsError
    };
  }
};

// Enhanced API methods with proper response handling
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
        message: response.message || "Request successful",
        status: 200
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.data,
        status: error.status,
        code: error.code,
        isTimeout: error.isTimeout,
        isNetworkError: error.isNetworkError,
        isCorsError: error.isCorsError,
        data: null
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
        status: error.status,
        code: error.code,
        isTimeout: error.isTimeout,
        isNetworkError: error.isNetworkError,
        isCorsError: error.isCorsError,
        data: null
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
        status: error.status,
        code: error.code,
        isTimeout: error.isTimeout,
        isNetworkError: error.isNetworkError,
        isCorsError: error.isCorsError,
        data: null
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
        status: error.status,
        code: error.code,
        isTimeout: error.isTimeout,
        isNetworkError: error.isNetworkError,
        isCorsError: error.isCorsError,
        data: null
      };
    }
  },
};

// Enhanced API methods using the api wrapper
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
  
  // Class Management
  getProgramClasses: (programId) => api.get(API_ENDPOINTS.PROGRAM_CLASSES(programId)),
  createClass: (classData) => api.post(API_ENDPOINTS.CLASSES, classData),
  updateClass: (classId, classData) => api.put(`${API_ENDPOINTS.CLASSES}/${classId}`, classData),
  deleteClass: (classId) => api.delete(`${API_ENDPOINTS.CLASSES}/${classId}`),
  
  // Reports
  getReports: (params = {}) => api.get(API_ENDPOINTS.REPORTS, params),
  getReportStats: () => api.get(API_ENDPOINTS.REPORTS_STATS),
  getReportById: (id) => api.get(API_ENDPOINTS.REPORTS_BY_ID(id)),
  createReport: (data) => api.post(API_ENDPOINTS.REPORTS, data),
  updateReport: (id, data) => api.put(API_ENDPOINTS.REPORTS_BY_ID(id), data),

  // Feedback endpoints
  submitFeedback: (reportId, feedback) => api.post(API_ENDPOINTS.REPORTS_FEEDBACK(reportId), { feedback }),
  getMyReports: () => api.get(API_ENDPOINTS.MY_REPORTS),
  
  // Ratings - UPDATED with improved submitRating method
  getMyRatings: () => api.get(API_ENDPOINTS.RATINGS_MY),
  getLecturerRatings: () => api.get(API_ENDPOINTS.RATINGS_LECTURER),
  submitRating: (ratingData) => {
    // Clean up the data - only send what the backend expects
    const validatedData = {
      rating: Number(ratingData.rating),
      comment: ratingData.comment || '',
      rating_type: ratingData.rating_type,
      lecturer_id: ratingData.lecturer_id,
      course_id: ratingData.course_id
      // Remove class_name if it's not needed
    };

    // Remove undefined values
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key] === undefined) {
        delete validatedData[key];
      }
    });

    console.log('📊 Submitting rating (cleaned):', validatedData);
    return api.post(API_ENDPOINTS.RATINGS, validatedData);
  },
  
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

// Enhanced backend connection test with detailed diagnostics
export const testBackendConnection = async () => {
  console.group('🔍 Backend Connection Diagnostics');
  
  try {
    console.log('📡 Testing connection to:', API_BASE_URL);
    
    const startTime = Date.now();
    const testResponse = await apiMethods.testConnection();
    const endTime = Date.now();
    
    console.log('✅ Backend connection successful:', {
      responseTime: `${endTime - startTime}ms`,
      status: testResponse.status,
      data: testResponse.data
    });
    
    return {
      connected: true,
      responseTime: endTime - startTime,
      status: testResponse.status,
      message: 'Backend is responding correctly'
    };
  } catch (error) {
    console.error('❌ Backend connection failed:', {
      message: error.message,
      status: error.status,
      isTimeout: error.isTimeout,
      isNetworkError: error.isNetworkError,
      isCorsError: error.isCorsError
    });
    
    return {
      connected: false,
      message: error.message,
      isTimeout: error.isTimeout,
      isNetworkError: error.isNetworkError,
      isCorsError: error.isCorsError,
      status: error.status
    };
  } finally {
    console.groupEnd();
  }
};

// Connection status monitor
let connectionStatus = 'unknown';
export const getConnectionStatus = () => connectionStatus;

// Initialize connection test with retry
export const initializeApp = async () => {
  console.log('🚀 Initializing application...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const result = await testBackendConnection();
  connectionStatus = result.connected ? 'connected' : 'disconnected';
  
  if (!result.connected) {
    console.warn('⚠️ Application starting in limited mode. Some features may not work.');
    
    if (typeof window !== 'undefined' && result.isCorsError) {
      setTimeout(() => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
          <strong>⚠️ CORS Configuration Issue</strong>
          <p class="mb-1">Backend is not accepting requests from this origin. Please check backend CORS settings.</p>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
      }, 1000);
    }
  }
  
  return result;
};

// Export connection utilities
export const connectionUtils = {
  testBackendConnection,
  getConnectionStatus,
  initializeApp
};

// Auto-initialize
setTimeout(() => {
  initializeApp();
}, 1000);

export default api;