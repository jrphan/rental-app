# React Query Setup for Mobile App

This directory contains all React Query hooks for managing server state in the mobile application.

## 📁 Structure

```
src/queries/
├── auth.ts          # Authentication queries and mutations
├── vehicles.ts      # Vehicle-related queries and mutations
├── bookings.ts      # Booking-related queries and mutations (to be created)
├── payments.ts      # Payment-related queries and mutations (to be created)
├── reviews.ts       # Review-related queries and mutations (to be created)
├── locations.ts     # Location-related queries and mutations (to be created)
└── index.ts         # Export all queries
```

## 🔧 Setup

React Query has been configured with:

- **QueryClient** with optimized defaults
- **DevTools** for development debugging
- **Error handling** with automatic retry logic
- **Cache management** with proper invalidation
- **Toast notifications** for user feedback

## 📋 Available Hooks

### Authentication (`auth.ts`)

```typescript
import { useLogin, useRegister, useProfile, useLogout } from "../queries/auth";

// Login
const loginMutation = useLogin();
await loginMutation.mutateAsync({ email, password });

// Register
const registerMutation = useRegister();
await registerMutation.mutateAsync(userData);

// Get Profile
const { data: user, isLoading, error } = useProfile();

// Logout
const logoutMutation = useLogout();
await logoutMutation.mutateAsync();

// Check auth status
const isAuthenticated = useIsAuthenticated();
const currentUser = useCurrentUser();
```

### Vehicles (`vehicles.ts`)

```typescript
import { useVehicles, useVehicle, useCreateVehicle } from "../queries/vehicles";

// Get all vehicles with search params
const { data: vehicles, isLoading } = useVehicles({
  query: "search term",
  minPrice: 100,
  maxPrice: 500,
});

// Get single vehicle
const { data: vehicle } = useVehicle(vehicleId);

// Create vehicle
const createMutation = useCreateVehicle();
await createMutation.mutateAsync(vehicleData);
```

## 🎯 Key Features

### 1. **Automatic Error Handling**

- All mutations include automatic error handling
- Toast notifications for success/error states
- Proper error message extraction from API responses

### 2. **Cache Management**

- Automatic cache invalidation on mutations
- Optimistic updates where appropriate
- Background refetching with stale-while-revalidate

### 3. **Loading States**

- `isLoading` for initial load
- `isFetching` for background updates
- `isPending` for mutations

### 4. **Retry Logic**

- Automatic retry for network errors
- No retry for 4xx client errors
- Configurable retry counts

## 📝 Usage Examples

### Basic Query

```typescript
function VehicleList() {
  const { data: vehicles, isLoading, error } = useVehicles();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={vehicles}
      renderItem={({ item }) => <VehicleCard vehicle={item} />}
    />
  );
}
```

### Mutation with Loading State

```typescript
function LoginForm() {
  const loginMutation = useLogin();

  const handleLogin = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      // Success handled automatically by the mutation
    } catch (error) {
      // Error handled automatically by the mutation
    }
  };

  return (
    <TouchableOpacity
      onPress={() => handleLogin(email, password)}
      disabled={loginMutation.isPending}
    >
      <Text>{loginMutation.isPending ? "Logging in..." : "Login"}</Text>
    </TouchableOpacity>
  );
}
```

### Optimistic Updates

```typescript
function CreateVehicleForm() {
  const queryClient = useQueryClient();
  const createMutation = useCreateVehicle();

  const handleCreate = async (vehicleData: VehicleData) => {
    // Optimistic update
    queryClient.setQueryData(queryKeys.vehicles.all, (old: Vehicle[]) => [
      ...old,
      { ...vehicleData, id: "temp-id" },
    ]);

    try {
      await createMutation.mutateAsync(vehicleData);
    } catch (error) {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    }
  };
}
```

## 🔄 Cache Invalidation

### Automatic Invalidation

Mutations automatically invalidate related queries:

```typescript
// When creating a vehicle, the vehicles list is automatically refetched
const createMutation = useCreateVehicle();
// After success, queryKeys.vehicles.all is invalidated
```

### Manual Invalidation

```typescript
const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });

// Invalidate all queries
queryClient.invalidateQueries();

// Remove specific query from cache
queryClient.removeQueries({ queryKey: queryKeys.vehicles.detail(id) });
```

## 🛠️ Adding New Queries

1. **Create a new file** in `src/queries/` (e.g., `bookings.ts`)
2. **Define query keys** in `src/lib/queryClient.ts`
3. **Create hooks** following the established patterns
4. **Export from** `src/queries/index.ts`

Example:

```typescript
// src/queries/bookings.ts
export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.all,
    queryFn: () => bookingService.getBookings(),
    staleTime: 2 * 60 * 1000,
  });
}
```

## 🐛 Debugging

### DevTools

React Query DevTools are available in development:

- Shows all queries and their states
- Cache inspection
- Query timeline

### Logging

```typescript
// Enable query logging in development
if (__DEV__) {
  queryClient.setLogger({
    log: console.log,
    warn: console.warn,
    error: console.error,
  });
}
```

## 📚 Best Practices

1. **Use consistent query keys** - Define them in `queryClient.ts`
2. **Handle loading and error states** - Always provide UI feedback
3. **Optimize cache time** - Set appropriate `staleTime` for different data types
4. **Invalidate related queries** - Keep data consistent across the app
5. **Use optimistic updates** - For better UX where appropriate
6. **Handle offline scenarios** - React Query provides built-in retry logic

## 🔗 Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Query Key Factory Pattern](https://tkdodo.eu/blog/effective-react-query-keys)
