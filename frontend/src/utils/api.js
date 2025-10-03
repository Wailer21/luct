import axios from "axios";

// Base API URL (from frontend .env)
const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : "https://luct-tcm7.onrender.com/api";

export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  ME: `${API_BASE_URL}/auth/me`,

  // Data
  FACULTIES: `${API_BASE_URL}/faculties`,
  COURSES: `${API_BASE_URL}/courses`,
  CLASSES: `${API_BASE_URL}/classes`,
  MY_CLASSES: `${API_BASE_URL}/my-classes`,
  LECTURERS: `${API_BASE_URL}/lecturers`,

  // Reports
  REPORTS: `${API_BASE_URL}/reports`,
  REPORTS_STATS: `${API_BASE_URL}/reports/stats`,
  REPORTS_BY_ID: (id) => `${API_BASE_URL}/reports/${id}`,
  REPORTS_FEEDBACK: (id) => `${API_BASE_URL}/reports/${id}/feedback`,

  // Ratings - Add these missing endpoints
  RATINGS: `${API_BASE_URL}/ratings`,
  RATINGS_MY: `${API_BASE_URL}/ratings/my-ratings`,
  RATINGS_LECTURER: `${API_BASE_URL}/ratings/lecturer`,

  // Search
  SEARCH: `${API_BASE_URL}/search`,

  // Health
  HEALTH: `${API_BASE_URL}/health`,
};

// Get token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Enhanced API call wrapper with error handling and automatic auth
export const apiCall = async (endpoint, options = {}, requireAuth = false) => {
  try {
    const config = {
      url: endpoint,
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Add auth headers if required
    if (requireAuth) {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required: No token found");
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`API Call: ${config.method?.toUpperCase()} ${endpoint}`, config.data || '');

    const response = await axios(config);
    
    // Handle backend response format
    if (response.data && response.data.success === false) {
      throw new Error(response.data.message || "Request failed");
    }
    
    return response.data;
  } catch (error) {
    console.error("API Call failed:", error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login
      window.location.href = "/login";
    }
    
    // Return a consistent error format
    const errorData = error.response?.data || { message: error.message };
    throw {
      success: false,
      message: errorData.message || "API request failed",
      error: errorData
    };
  }
};

// Enhanced API methods with better error handling
export const api = {
  get: async (endpoint, requireAuth = false) => {
    try {
      const response = await apiCall(endpoint, { method: "GET" }, requireAuth);
      return {
        success: true,
        data: response.data || response,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.error
      };
    }
  },
  
  post: async (endpoint, data, requireAuth = false) => {
    try {
      const response = await apiCall(endpoint, { method: "POST", data }, requireAuth);
      return {
        success: true,
        data: response.data || response,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.error
      };
    }
  },
  
  put: async (endpoint, data, requireAuth = false) => {
    try {
      const response = await apiCall(endpoint, { method: "PUT", data }, requireAuth);
      return {
        success: true,
        data: response.data || response,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.error
      };
    }
  },
  
  delete: async (endpoint, requireAuth = false) => {
    try {
      const response = await apiCall(endpoint, { method: "DELETE" }, requireAuth);
      return {
        success: true,
        data: response.data || response,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.error
      };
    }
  },
};