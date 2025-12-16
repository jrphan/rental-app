import API_ENDPOINTS from "./api.endpoints";
import { apiClient } from "@/lib/api";
import { UserFile } from "@/types/file.types";

export const fileApi = {
  async uploadFile(
    file: { uri: string; name: string; type: string },
    folder?: string
  ): Promise<UserFile> {
    const formData = new FormData();
    // React Native FormData: dùng any để tránh lỗi type của web
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    if (folder) {
      formData.append("folder", folder);
    }

    const response = await apiClient.post<UserFile>(
      API_ENDPOINTS.FILES.UPLOAD,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data as UserFile;
    }
    throw new Error(response.message || "Upload file thất bại");
  },

  async uploadMultipleFiles(
    files: { uri: string; name: string; type: string }[],
    folder?: string
  ): Promise<UserFile[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
    if (folder) {
      formData.append("folder", folder);
    }

    const response = await apiClient.post<UserFile[]>(
      API_ENDPOINTS.FILES.UPLOAD_MULTIPLE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data as UserFile[];
    }
    throw new Error(response.message || "Upload nhiều file thất bại");
  },

  async listMyFiles(folder?: string): Promise<UserFile[]> {
    const url = folder
      ? `${API_ENDPOINTS.FILES.LIST_MY_FILES}?folder=${encodeURIComponent(
          folder
        )}`
      : API_ENDPOINTS.FILES.LIST_MY_FILES;

    const response = await apiClient.get<UserFile[]>(url);
    if (response.success && response.data) {
      return response.data as UserFile[];
    }
    throw new Error(response.message || "Lấy danh sách file thất bại");
  },

  async deleteFile(id: string): Promise<void> {
    const response = await apiClient.delete<null>(
      API_ENDPOINTS.FILES.DELETE_FILE.replace(":id", id)
    );
    if (!response.success) {
      throw new Error(response.message || "Xóa file thất bại");
    }
  },
};
