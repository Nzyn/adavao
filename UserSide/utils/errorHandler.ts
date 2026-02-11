// Error handling utilities

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export const handleApiError = (error: any): ApiError => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection and make sure the server is running.',
      status: 0,
    };
  }
  
  if (error.message?.includes('Failed to update profile: 404')) {
    return {
      message: 'User not found. Please try logging in again.',
      status: 404,
    };
  }
  
  if (error.message?.includes('Failed to update profile: 422')) {
    return {
      message: 'Invalid data provided. Please check your input and try again.',
      status: 422,
    };
  }
  
  if (error.message?.includes('Failed to update profile: 500')) {
    return {
      message: 'Server error. Please try again later.',
      status: 500,
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred. Please try again.',
    status: error.status || 0,
    details: error,
  };
};

export const isNetworkError = (error: any): boolean => {
  return error.name === 'TypeError' && error.message.includes('fetch');
};