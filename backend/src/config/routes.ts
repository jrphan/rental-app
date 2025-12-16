export const ROUTES = {
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
  FILES: {
    UPLOAD: '/files/upload',
    UPLOAD_MULTIPLE: '/files/upload-multiple',
    LIST_MY_FILES: '/files/me',
    DELETE_FILE: '/files/:id',
  },
};
