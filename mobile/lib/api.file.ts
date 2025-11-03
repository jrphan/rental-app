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

    const url = folder
      ? `/api/files/upload?folder=${folder}`
      : "/api/files/upload";

    const response = await apiClient.post<FileUploadResult>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
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
      ? `/api/files/upload-multiple?folder=${folder}`
      : "/api/files/upload-multiple";

    const response = await apiClient.post<FileUploadResult[]>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Lấy danh sách files của user (gallery)
   */
  async getGallery(folder?: string): Promise<FileUploadResult[]> {
    const url = folder
      ? `/api/files/gallery?folder=${folder}`
      : "/api/files/gallery";

    const response = await apiClient.get<FileUploadResult[]>(url);
    return response.data;
  },

  /**
   * Xóa file
   */
  async deleteFile(key: string): Promise<void> {
    await apiClient.delete(`/api/files/${encodeURIComponent(key)}`);
  },
};
