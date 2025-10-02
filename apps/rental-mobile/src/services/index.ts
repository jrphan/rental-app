// Export all services
export { BaseApiService, type ApiResponse } from './BaseApiService';
export { AuthService, authService } from './AuthService';

// Re-export for backward compatibility
export { authService as apiService } from './AuthService';
export { authService as default } from './AuthService';
