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
    GET_USER_INFO: "/user/get-user-info",
    UPDATE_PROFILE: "/user/update-profile",
    SUBMIT_KYC: "/user/kyc",
    GET_NOTIFICATIONS: "/user/notifications",
    GET_UNREAD_NOTIFICATION_COUNT: "/user/notifications/unread-count",
    MARK_NOTIFICATION_AS_READ: "/user/notifications/:id/read",
    MARK_ALL_NOTIFICATIONS_AS_READ: "/user/notifications/read-all",
    REGISTER_DEVICE_TOKEN: "/user/device-token",
  },
  VEHICLE: {
    CREATE: "/vehicle/create",
    LIST_MY_VEHICLES: "/vehicle/my-vehicles",
    GET_MY_VEHICLE_DETAIL: "/vehicle/my-vehicles/:id",
  },
  FILES: {
    UPLOAD: "/files/upload",
    UPLOAD_MULTIPLE: "/files/upload-multiple",
    LIST_MY_FILES: "/files/me",
    DELETE_FILE: "/files/:id",
  },
};

export default API_ENDPOINTS;
