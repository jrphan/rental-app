import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fileApi } from "@/services/api.files";
import { UserFile } from "@/types/file.types";

const USER_FILES_KEY = (folder?: string) => ["user-files", folder] as const;

export function useUserFiles(folder?: string) {
  return useQuery<UserFile[]>({
    queryKey: USER_FILES_KEY(folder),
    queryFn: () => fileApi.listMyFiles(folder),
  });
}

export function useUploadUserFile(folder?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: { uri: string; name: string; type: string }) =>
      fileApi.uploadFile(file, folder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_FILES_KEY(folder) });
    },
  });
}

export function useDeleteUserFile(folder?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fileApi.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_FILES_KEY(folder) });
    },
  });
}
