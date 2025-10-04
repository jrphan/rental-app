import { QueryClient } from '@tanstack/react-query';

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds that data remains in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry for 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: (failureCount, error: any) => {
        // Don't retry for 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
    },
  },
});

// Query keys factory for better organization
export const queryKeys = {
  // Auth related queries
  auth: {
    profile: ['auth', 'profile'] as const,
    health: ['auth', 'health'] as const,
  },
  
  // Vehicle related queries
  vehicles: {
    all: ['vehicles'] as const,
    detail: (id: string) => ['vehicles', id] as const,
    search: (params: Record<string, any>) => ['vehicles', 'search', params] as const,
  },
  
  // Booking related queries
  bookings: {
    all: ['bookings'] as const,
    detail: (id: string) => ['bookings', id] as const,
    user: (userId: string) => ['bookings', 'user', userId] as const,
  },
  
  // Payment related queries
  payments: {
    all: ['payments'] as const,
    detail: (id: string) => ['payments', id] as const,
    user: (userId: string) => ['payments', 'user', userId] as const,
  },
  
  // Review related queries
  reviews: {
    all: ['reviews'] as const,
    detail: (id: string) => ['reviews', id] as const,
    vehicle: (vehicleId: string) => ['reviews', 'vehicle', vehicleId] as const,
  },
  
  // Location related queries
  locations: {
    all: ['locations'] as const,
    search: (params: Record<string, any>) => ['locations', 'search', params] as const,
  },
} as const;
