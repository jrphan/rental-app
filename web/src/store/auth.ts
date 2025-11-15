import { Store } from '@tanstack/store'

interface User {
  id: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
}

// Load auth state from localStorage on init
const loadAuthState = (): AuthState => {
  if (typeof window === 'undefined') {
    return initialState
  }

  try {
    const userStr = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (userStr && accessToken) {
      const user = JSON.parse(userStr)
      return {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: true, // Set to true initially, will be set to false after verification
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error)
  }

  return { ...initialState, isLoading: false }
}

export const authStore = new Store<AuthState>(loadAuthState())

// Actions
export const authActions = {
  login: (user: User, tokens: { accessToken: string; refreshToken?: string }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('accessToken', tokens.accessToken)
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken)
      }
    }

    authStore.setState({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || null,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }

    authStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  updateUser: (user: Partial<User>) => {
    const currentState = authStore.state
    if (currentState.user) {
      const updatedUser = { ...currentState.user, ...user }
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      authStore.setState({
        ...currentState,
        user: updatedUser,
      })
    }
  },

  updateTokens: (tokens: { accessToken: string; refreshToken?: string }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', tokens.accessToken)
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken)
      }
    }

    authStore.setState((state) => ({
      ...state,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || state.refreshToken,
    }))
  },
}

