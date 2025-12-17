const API_ENDPOINTS = {
  HEALTH: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_PASSWORD: '/auth/verify-reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    REFRESH: '/auth/refresh',
  },
  USER: {
    GET_USER_INFO: '/user/get-user-info',
    UPDATE_PROFILE: '/user/update-profile',
    SUBMIT_KYC: '/user/kyc',
  },
  ADMIN: {
    LIST_USERS: '/admin/users',
    LIST_KYC: '/admin/kyc',
    GET_KYC_DETAIL: (id: string) => `/admin/kyc/${id}`,
    APPROVE_KYC: (id: string) => `/admin/kyc/${id}/approve`,
    REJECT_KYC: (id: string) => `/admin/kyc/${id}/reject`,
  },
  FILES: {
    UPLOAD: '/files/upload',
    UPLOAD_MULTIPLE: '/files/upload-multiple',
    LIST_MY_FILES: '/files/me',
    DELETE_FILE: '/files/:id',
  },
}

export default API_ENDPOINTS
