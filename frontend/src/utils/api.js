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

  // Reports
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORTS_STATS: `${API_BASE_URL}/api/reports/stats`,
  REPORTS_BY_ID: (id) => `${API_BASE_URL}/api/reports/${id}`,
  REPORTS_FEEDBACK: (id) => `${API_BASE_URL}/api/reports/${id}/feedback`,

  // Health
  HEALTH: `${API_BASE_URL}/api/health`,
  TEST: `${API_BASE_URL}/api/test`,
};

// Get token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // ✅ CHANGED FROM 10000 to 30000ms
  timeoutErrorMessage: "Request timeout - backend server is not responding",
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Content-Type"] = "application/json";
    
    // Add timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      timestamp: config.metadata.startTime.toISOString()
    });
    
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
      response: error.response?.data
    });

    if (error.response?.status === 401) {
      console.warn("🔐 Authentication failed - redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Use setTimeout to avoid React state updates during render
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }
    
    return Promise.reject(error);
  }
);

// Enhanced API call wrapper with better error handling and retry logic
export const apiCall = async (endpoint, options = {}, retries = 3) => {
  const maxRetries = retries;
  
  try {
    const config = {
      url: endpoint,
      ...options,
    };

    console.log(`🔄 API Call attempt: ${config.method?.toUpperCase() || 'GET'} ${endpoint} (${maxRetries - retries + 1}/${maxRetries + 1})`);

    const response = await apiInstance(config);
    
    // Handle backend response format
    if (response.data && response.data.success === false) {
      const error = new Error(response.data.message || "Request failed");
      error.response = response;
      throw error;
    }
    
    return response.data;
  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    const isNetworkError = error.message.includes('Network Error') || !error.response;
    
    console.error(`❌ API Call failed: ${options.method?.toUpperCase() || 'GET'} ${endpoint}`, {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      isTimeout,
      isNetworkError,
      retriesLeft: retries
    });

    // Retry logic for timeout and network errors
    if ((isTimeout || isNetworkError) && retries > 0) {
      const delay = Math.pow(2, maxRetries - retries) * 1000; // Exponential backoff
      console.log(`⏳ Retrying in ${delay}ms... (${retries} retries left)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiCall(endpoint, options, retries - 1);
    }
    
    // Enhanced error handling
    if (error.response?.status === 401) {
      // Already handled in interceptor
    }
    
    // Return a consistent error format
    const errorMessage = isTimeout 
      ? "Backend server is not responding. Please check if the server is running."
      : isNetworkError
      ? "Network connection failed. Please check your internet connection."
      : error.response?.data?.message || error.message || "API request failed";
    
    throw {
      success: false,
      message: errorMessage,
      status: error.response?.status,
      code: error.code,
      data: error.response?.data,
      isTimeout,
      isNetworkError
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
        data: null
      };
    }
  },
};

// Only include endpoints that actually exist
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
  
  // Reports
  getReports: (params = {}) => api.get(API_ENDPOINTS.REPORTS, params),
  getReportStats: () => api.get(API_ENDPOINTS.REPORTS_STATS),
  getReportById: (id) => api.get(API_ENDPOINTS.REPORTS_BY_ID(id)),
  createReport: (data) => api.post(API_ENDPOINTS.REPORTS, data),
  submitFeedback: (id, feedback) => api.post(API_ENDPOINTS.REPORTS_FEEDBACK(id), { feedback }),
  
  // System
  healthCheck: () => api.get(API_ENDPOINTS.HEALTH),
  testConnection: () => api.get(API_ENDPOINTS.TEST),
};

// Enhanced backend connection test with detailed diagnostics
export const testBackendConnection = async () => {
  console.group('🔍 Backend Connection Diagnostics');
  
  try {
    console.log('📡 Testing connection to:', API_BASE_URL);
    
    // First, try a simple fetch to check if server is reachable
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
      isNetworkError: error.isNetworkError
    });
    
    // Additional diagnostic: try to ping the base URL
    try {
      const pingResponse = await fetch(API_BASE_URL, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      console.log('🌐 Server is reachable but API might be down. HTTP Status:', pingResponse.status);
    } catch (pingError) {
      console.error('💀 Server is completely unreachable:', pingError.message);
    }
    
    return {
      connected: false,
      message: error.message,
      isTimeout: error.isTimeout,
      isNetworkError: error.isNetworkError,
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
  
  // Wait a bit for backend to wake up (if it's sleeping)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const result = await testBackendConnection();
  connectionStatus = result.connected ? 'connected' : 'disconnected';
  
  if (!result.connected) {
    console.warn('⚠️ Application starting in offline mode. Some features may not work.');
    
    // Show user-friendly warning
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
          <strong>⚠️ Connection Issue</strong>
          <p class="mb-1">Cannot connect to server: ${result.message}</p>
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

// Auto-initialize (but don't block app startup)
setTimeout(() => {
  initializeApp();
}, 1000);

export default api;