import { useMutation } from '@tanstack/react-query';
import { apiDelete, apiPost } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import type { BookmarkEntity } from '@/lib/types';

/**
 * Toggles a saved item. Invalidates the saved list, the dashboard counts and
 * the detail query whose `isBookmarked` flag drives the button state.
 */
export function useBookmarkToggle(entityType: BookmarkEntity, detailKey?: readonly unknown[]) {
  return useMutation({
    mutationFn: async ({ entityId, isBookmarked }: { entityId: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await apiDelete('/bookmarks', { entityType, entityId });
        return { saved: false };
      }

      await apiPost('/bookmarks', { entityType, entityId });
      return { saved: true };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks(entityType) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (detailKey) void queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}
