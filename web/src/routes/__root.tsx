import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect } from 'react'
import { authStore, authActions } from '@/store/auth'
import { authApi } from '@/lib/api.auth'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Admin Dashboard',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,

  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Trang không tìm thấy
        </h2>
        <p className="text-gray-600 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <a
          href="/admin/login"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Về trang đăng nhập
        </a>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  // Verify auth state on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const authState = authStore.state

      // If we have tokens, verify with server
      if (authState.accessToken) {
        try {
          // Verify token by getting current user
          const user = await authApi.getMe()

          // Update user info and ensure state is synced
          if (authState.isAuthenticated && authState.user) {
            // Update user info in case it changed
            authActions.updateUser(user)
            // Ensure tokens are still in sync
            const currentAccessToken = localStorage.getItem('accessToken')
            const currentRefreshToken = localStorage.getItem('refreshToken')
            if (currentAccessToken !== authState.accessToken) {
              authActions.updateTokens({
                accessToken: currentAccessToken || authState.accessToken,
                refreshToken: currentRefreshToken || undefined,
              })
            }
            // Set loading to false
            authStore.setState((state) => ({ ...state, isLoading: false }))
          } else {
            // We have token but state is not authenticated, restore it
            const currentAccessToken = localStorage.getItem('accessToken')
            const currentRefreshToken = localStorage.getItem('refreshToken')
            authActions.login(user, {
              accessToken: currentAccessToken || authState.accessToken,
              refreshToken: currentRefreshToken || authState.refreshToken || undefined,
            })
          }
        } catch (error) {
          // Token invalid, try to refresh if we have refresh token
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            try {
              const newTokens = await authApi.refreshToken(refreshToken)
              // Get user again with new token
              const user = await authApi.getMe()
              authActions.login(user, newTokens)
            } catch (refreshError) {
              // Refresh failed, clear auth state
              console.error('Token refresh failed:', refreshError)
              authActions.logout()
            }
          } else {
            // No refresh token, clear auth state
            console.error('Token verification failed:', error)
            authActions.logout()
          }
        }
      } else {
        // No token, set loading to false
        authStore.setState((state) => ({ ...state, isLoading: false }))
      }
    }

    verifyAuth()
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
