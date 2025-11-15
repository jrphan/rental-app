import { apiClient } from "./api";

export interface FileUploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface GalleryResponse {
  files: FileUploadResult[];
}

export const fileApi = {
  /**
   * Upload một file
   */
  async uploadFile(
    file: { uri: string; type: string; name: string },
    folder?: string
  ): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const url = folder ? `/files/upload?folder=${folder}` : "/files/upload";

    const response = await apiClient.post<FileUploadResult>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.success) {
      // Standard: data is the uploaded file object
      if (response.data && !Array.isArray(response.data)) {
        return response.data as FileUploadResult;
      }
      // Wrapped: data is another ApiResponse with data inside
      const maybeWrapped = (response.data ?? {}) as any;
      if (
        maybeWrapped &&
        maybeWrapped.data &&
        !Array.isArray(maybeWrapped.data)
      ) {
        return maybeWrapped.data as FileUploadResult;
      }
    }
    throw new Error(response.message || "Upload file thất bại");
  },

  /**
   * Upload nhiều files
   */
  async uploadFiles(
    files: { uri: string; type: string; name: string }[],
    folder?: string
  ): Promise<FileUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    const url = folder
      ? `/files/upload-multiple?folder=${folder}`
      : "/files/upload-multiple";

    const response = await apiClient.post<FileUploadResult[]>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.success) {
      // Standard: data is the uploaded files array
      if (Array.isArray(response.data)) {
        return response.data as FileUploadResult[];
      }
      // Wrapped: data is another ApiResponse containing the array
      const maybeWrapped = (response.data ?? {}) as any;
      if (maybeWrapped && Array.isArray(maybeWrapped.data)) {
        return maybeWrapped.data as FileUploadResult[];
      }
    }
    throw new Error(response.message || "Upload nhiều file thất bại");
  },

  /**
   * Lấy danh sách files của user (gallery)
   */
  async getGallery(folder?: string): Promise<FileUploadResult[]> {
    const url = folder ? `/files/gallery?folder=${folder}` : "/files/gallery";

    const response = await apiClient.get<FileUploadResult[]>(url);
    if (response.success) {
      // Trường hợp chuẩn: data là mảng UploadResult
      if (Array.isArray(response.data)) {
        return response.data as FileUploadResult[];
      }
      // Trường hợp interceptor client đã wrap thêm 1 lớp: data = { success, data: [] }
      const maybeWrapped = (response.data ?? {}) as any;
      if (maybeWrapped && Array.isArray(maybeWrapped.data)) {
        return maybeWrapped.data as FileUploadResult[];
      }
    }
    throw new Error(response.message || "Lấy gallery thất bại");
  },

  /**
   * Xóa file
   */
  async deleteFile(key: string): Promise<void> {
    await apiClient.delete(`/files/${encodeURIComponent(key)}`);
  },
  /**
   * Xóa nhiều file
   */
  async deleteFiles(keys: string[]): Promise<void> {
    // Thực hiện tuần tự để đơn giản xử lý lỗi; có thể tối ưu Promise.allSettled
    for (const key of keys) {
      await apiClient.delete(`/files/${encodeURIComponent(key)}`);
    }
  },
};
