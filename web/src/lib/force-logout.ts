// Các message lỗi từ backend sẽ trigger force logout
// Backend trả về các message này (case-insensitive):
// - "Người dùng không tồn tại" (từ auth.service.ts)
// - "Invalid refresh token" (từ auth.service.ts khi refresh token invalid/expired)
// - "Invalid token type" (từ auth.service.ts khi token type không đúng)
// - "refresh token đã hết hạn" (có thể từ JWT library hoặc error handling khác)
export const FORCE_LOGOUT_MESSAGES = [
  'người dùng không tồn tại',
  'invalid refresh token',
  'refresh token đã hết hạn',
  'invalid token type',
]

// Export as object để có thể mutate từ module khác
export const forceLogoutState = {
  isForceLoggingOut: false,
}

export const matchesForceLogoutMessage = (message?: string) => {
  if (!message) {
    return false
  }
  const lower = message.toLowerCase()
  return FORCE_LOGOUT_MESSAGES.some((msg) => lower.includes(msg))
}
