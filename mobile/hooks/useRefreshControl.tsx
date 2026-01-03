import React, { useState, useCallback } from "react";
import { RefreshControl } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { COLORS } from "@/constants/colors";

interface UseRefreshControlOptions {
    /**
     * Array of query keys to invalidate when refreshing
     * Example: [["popularVehicles"], ["vehiclesByCity"]]
     */
    queryKeys?: readonly (readonly unknown[])[];
    /**
     * Array of refetch functions from useQuery hooks
     */
    refetchFunctions?: (() => Promise<any>)[];
    /**
     * Custom refresh handler (overrides default behavior)
     */
    onRefresh?: () => Promise<void> | void;
}

/**
 * Hook to handle pull-to-refresh functionality with React Query cache invalidation
 * 
 * @example
 * ```tsx
 * const { refreshing, refreshControl, handleRefresh } = useRefreshControl({
 *   queryKeys: [["popularVehicles"], ["vehiclesByCity"]],
 *   refetchFunctions: [refetchPopular, refetchCity1, refetchCity2],
 * });
 * 
 * <ScrollView refreshControl={refreshControl}>
 *   ...
 * </ScrollView>
 * ```
 */
export function useRefreshControl(options: UseRefreshControlOptions = {}) {
    const { queryKeys = [], refetchFunctions = [], onRefresh } = options;
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            if (onRefresh) {
                // Use custom refresh handler if provided
                await onRefresh();
            } else {
                // Default behavior: invalidate queries and refetch
                // Invalidate all provided query keys
                await Promise.all(
                    queryKeys.map((queryKey) =>
                        queryClient.invalidateQueries({ queryKey: queryKey as readonly unknown[] })
                    )
                );

                // Refetch all provided functions
                if (refetchFunctions.length > 0) {
                    await Promise.all(
                        refetchFunctions.map((refetch) => refetch())
                    );
                }
            }
        } finally {
            setRefreshing(false);
        }
    }, [queryKeys, refetchFunctions, onRefresh, queryClient]);

    const refreshControl = (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
        />
    );

    return {
        refreshing,
        refreshControl,
        handleRefresh,
    };
}

