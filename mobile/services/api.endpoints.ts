const API_ENDPOINTS = {
  HEALTH: "/",
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",
    FORGOT_PASSWORD: "/auth/forgot-password",
    VERIFY_RESET_PASSWORD: "/auth/verify-reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
    REFRESH: "/auth/refresh",
  },
  USER: {
    GET_USER_BY_ID: "/user/get-user-by-id",
  },
};

export default API_ENDPOINTS;
